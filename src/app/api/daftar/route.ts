import { createHash, randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { getLiveEventData } from "@/lib/kembarinEvents";

// Sederhana in-memory cache untuk Rate Limiting & Proteksi Double Submit
// Catatan: Karena Vercel adalah serverless environment, in-memory cache ini berjalan per instance/container.
// Ini cukup efektif untuk memblokir spam langsung atau double click brutal dari client yang sama.
const rateLimitMap = new Map<string, { count: number; lastReset: number }>();
// Key-nya HASH dari NIK, bukan NIK mentah — supaya data pribadi peserta tidak menetap
// di memori proses dalam bentuk terbaca (dan tidak ikut tercetak kalau map ini pernah
// ter-dump saat debugging). Salt-nya acak per instance; map ini memang per instance.
const doubleSubmitMap = new Map<string, number>();
const NIK_HASH_SALT = randomUUID();

const RATE_LIMIT_WINDOW = 60 * 1000; // 1 menit
const MAX_REQUESTS_PER_WINDOW = 3;   // Maksimal 3 kali daftar per menit per IP
const DOUBLE_SUBMIT_WINDOW = 5000;   // 5 detik pencegahan double-submit untuk NIK yang sama

function hashNik(nik: string): string {
  return createHash("sha256").update(`${NIK_HASH_SALT}:${nik}`).digest("hex");
}

/**
 * IP pengunjung asli. PENTING: `x-forwarded-for` bisa diisi sebagian oleh klien —
 * penyerang tinggal mengirim header itu dengan nilai acak tiap request untuk memecah
 * kunci rate limiter (dan, kalau diteruskan mentah, ikut mengelabui rate limiter
 * kembarin-v2 lewat jalur trusted-proxy). Yang boleh dipercaya:
 *   1. `x-vercel-forwarded-for` — ditulis platform, tidak bisa ditimpa klien.
 *   2. entri PALING KANAN dari `x-forwarded-for` — ditambahkan proxy terakhir/terdekat;
 *      bagian kiri adalah bagian yang bisa dikarang klien.
 */
function getClientIp(req: NextRequest): string {
  const vercelIp = req.headers.get("x-vercel-forwarded-for");
  if (vercelIp) return vercelIp.split(",").pop()!.trim();

  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    const hops = forwarded.split(",").map((part) => part.trim()).filter(Boolean);
    if (hops.length > 0) return hops[hops.length - 1];
  }

  return req.headers.get("x-real-ip") || "127.0.0.1";
}

/** Buang deretan angka panjang (NIK, no. WhatsApp) sebelum sesuatu masuk log. */
function redact(text: string): string {
  return text.replace(/\d{8,}/g, "[redacted]");
}

/**
 * Pesan error dari core hanya diteruskan ke pengguna kalau memang terlihat sebagai pesan
 * untuk manusia (mis. "NIK sudah terdaftar"). Sebelumnya potongan respons apa pun
 * diteruskan mentah, termasuk yang berpotensi membocorkan detail internal.
 */
function isSafeUserFacingMessage(message: string): boolean {
  if (message.length === 0 || message.length > 200) return false;
  if (/[\n\r<>{}]/.test(message)) return false;
  return !/(error:|exception|stack|at\s+\w+\s*\(|\/var\/|\/home\/|node_modules|select\s|insert\s|update\s\w+\sset|prisma|sqlstate|econn|undefined is not)/i.test(
    message
  );
}

// Pembersihan cache memori berkala dilakukan secara pasif di dalam request handler
function bersihkanCacheMundur(now: number) {
  if (rateLimitMap.size > 200) {
    rateLimitMap.forEach((data, ip) => {
      if (now - data.lastReset > RATE_LIMIT_WINDOW) rateLimitMap.delete(ip);
    });
  }
  if (doubleSubmitMap.size > 200) {
    doubleSubmitMap.forEach((timestamp, key) => {
      if (now - timestamp > DOUBLE_SUBMIT_WINDOW) doubleSubmitMap.delete(key);
    });
  }
}

// ─── Validator satuan ────────────────────────────────────────────────────────
const NAMA_PATTERN = /^[a-zA-Z\s\.\']+$/;
const KOTA_PATTERN = /^[a-zA-Z\s\.\'\-]+$/;
const EMAIL_PATTERN = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
const WHATSAPP_PATTERN = /^\+?\d{8,15}$/;
const NIK_PATTERN = /^\d{16}$/;
const GENDER_WHITELIST = ["Laki-laki", "Perempuan"];
const SIZE_WHITELIST = ["XS", "S", "M", "L", "XL", "XXL", "XXXL"];

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

function gagal(message: string, status = 400) {
  return NextResponse.json({ success: false, message }, { status });
}

interface PesertaTervalidasi {
  nama: string;
  email: string | null;
  whatsapp: string | null;
  nik: string;
  gender: string;
  kota: string;
  kategori: string;
  size: string;
  harga: number;
  ticketTypeId: number | null;
}

export async function POST(req: NextRequest) {
  try {
    const now = Date.now();
    // Jalankan pembersihan pasif
    bersihkanCacheMundur(now);

    // 1. IP pengunjung untuk rate limiting (lihat catatan di getClientIp)
    const ip = getClientIp(req);

    // 2. Rate limiting
    const limitData = rateLimitMap.get(ip);
    if (!limitData) {
      rateLimitMap.set(ip, { count: 1, lastReset: now });
    } else {
      if (now - limitData.lastReset > RATE_LIMIT_WINDOW) {
        rateLimitMap.set(ip, { count: 1, lastReset: now });
      } else {
        if (limitData.count >= MAX_REQUESTS_PER_WINDOW) {
          const retryAfter = Math.max(1, Math.ceil((RATE_LIMIT_WINDOW - (now - limitData.lastReset)) / 1000));
          return NextResponse.json(
            {
              success: false,
              message: "Terlalu banyak permintaan pendaftaran dari IP Anda. Silakan tunggu 1 menit sebelum mencoba lagi.",
            },
            { status: 429, headers: { "Retry-After": String(retryAfter) } }
          );
        }
        limitData.count++;
      }
    }

    // 3. Parse body
    let body: Record<string, unknown>;
    try {
      body = (await req.json()) as Record<string, unknown>;
    } catch {
      return gagal("Format JSON tidak valid.");
    }

    const { eventCode, buyer, participants, paymentGateway, health_declaration, privacy_consent, subtotal, total_amount } = body;

    // 4. Validasi & sanitasi ketat

    if (typeof eventCode !== "string" || eventCode.trim() !== "smadarun") {
      return gagal("Kode event tidak valid.");
    }

    // ── Data pemesan ──────────────────────────────────────────────────────────
    if (!isRecord(buyer)) return gagal("Data pemesan wajib diisi.");

    const buyerNama = typeof buyer.nama === "string" ? buyer.nama.trim() : "";
    if (buyerNama.length < 3 || buyerNama.length > 100 || !NAMA_PATTERN.test(buyerNama)) {
      return gagal("Format nama pemesan tidak valid. Hanya diperbolehkan huruf, spasi, titik (.), atau kutip (').");
    }

    const buyerEmail = typeof buyer.email === "string" ? buyer.email.trim() : "";
    if (!EMAIL_PATTERN.test(buyerEmail)) return gagal("Format email pemesan tidak valid.");

    const buyerWhatsapp = typeof buyer.whatsapp === "string" ? buyer.whatsapp.trim() : "";
    if (!WHATSAPP_PATTERN.test(buyerWhatsapp)) {
      return gagal("Format nomor WhatsApp pemesan tidak valid. Masukkan 8-15 digit angka.");
    }

    // ── Persetujuan (satu kali per pesanan, mewakili seluruh peserta) ─────────
    // Sebelumnya kedua checkbox HANYA mengunci tombol di browser, sehingga request
    // langsung ke endpoint ini bisa mendaftar tanpa persetujuan apa pun.
    if (health_declaration !== true) {
      return gagal("Pernyataan kondisi kesehatan wajib disetujui sebelum mendaftar.");
    }
    if (privacy_consent !== true) {
      return gagal("Persetujuan Kebijakan Privasi wajib diberikan sebelum mendaftar.");
    }

    // ── Data live: harga, kategori aktif, status buka/tutup, batas kolektif ───
    // kembarin-v2 adalah sumber kebenaran; nominal apa pun dari klien tidak dipercaya.
    const live = await getLiveEventData();
    if (!live.isOpen) {
      return gagal("Pendaftaran untuk event ini sedang tidak dibuka. Silakan coba beberapa saat lagi.");
    }

    const tarifPerKategori = new Map(live.ticketTypes.map((t) => [t.categoryKey, t]));

    // ── Daftar peserta ────────────────────────────────────────────────────────
    if (!Array.isArray(participants) || participants.length === 0) {
      return gagal("Minimal satu peserta wajib diisi.");
    }
    if (participants.length > live.maxTicketsPerOrder) {
      return gagal(
        live.multiTicketEnabled
          ? `Maksimal ${live.maxTicketsPerOrder} tiket dalam satu pesanan.`
          : "Event ini hanya mengizinkan satu tiket per pesanan."
      );
    }

    const pesertaTervalidasi: PesertaTervalidasi[] = [];
    const nikTerpakai = new Set<string>();

    for (let i = 0; i < participants.length; i++) {
      const nomor = i + 1;
      const p = participants[i];
      if (!isRecord(p)) return gagal(`Data peserta ${nomor} tidak valid.`);

      const nama = typeof p.nama === "string" ? p.nama.trim() : "";
      if (nama.length < 3 || nama.length > 100 || !NAMA_PATTERN.test(nama)) {
        return gagal(`Format nama peserta ${nomor} tidak valid. Hanya huruf, spasi, titik (.), atau kutip (').`);
      }

      const nik = typeof p.nik === "string" ? p.nik.trim() : "";
      if (!NIK_PATTERN.test(nik)) {
        return gagal(`NIK peserta ${nomor} harus berupa angka dengan panjang tepat 16 digit.`);
      }
      // Satu NIK hanya boleh muncul sekali dalam satu pesanan — kalau tidak, satu orang
      // bisa terdaftar berkali-kali dalam satu order dan memakan kuota kategori.
      if (nikTerpakai.has(nik)) {
        return gagal(`NIK peserta ${nomor} sama dengan peserta lain dalam pesanan ini.`);
      }
      nikTerpakai.add(nik);

      const gender = typeof p.gender === "string" ? p.gender : "";
      if (!GENDER_WHITELIST.includes(gender)) {
        return gagal(`Pilihan jenis kelamin peserta ${nomor} tidak valid.`);
      }

      const size = typeof p.size === "string" ? p.size : "";
      if (!SIZE_WHITELIST.includes(size)) {
        return gagal(`Pilihan ukuran jersey peserta ${nomor} tidak valid.`);
      }

      const kota = typeof p.kota === "string" ? p.kota.trim() : "";
      if (kota.length < 2 || kota.length > 100 || !KOTA_PATTERN.test(kota)) {
        return gagal(`Format kota domisili peserta ${nomor} tidak valid. Hanya huruf, spasi, titik, strip, dan kutip.`);
      }

      const kategori = typeof p.kategori === "string" ? p.kategori : "";
      const tiket = tarifPerKategori.get(kategori);
      if (!tiket) {
        return gagal(`Kategori lomba peserta ${nomor} tidak valid atau sedang tidak aktif.`);
      }

      // Email & WhatsApp peserta bersifat opsional: kalau kosong, core memakai data
      // pemesan (lihat resolveParticipantEmail di kembarin-v2).
      const emailPeserta = typeof p.email === "string" && p.email.trim() ? p.email.trim() : null;
      if (emailPeserta && !EMAIL_PATTERN.test(emailPeserta)) {
        return gagal(`Format email peserta ${nomor} tidak valid.`);
      }
      const waPeserta = typeof p.whatsapp === "string" && p.whatsapp.trim() ? p.whatsapp.trim() : null;
      if (waPeserta && !WHATSAPP_PATTERN.test(waPeserta)) {
        return gagal(`Format nomor WhatsApp peserta ${nomor} tidak valid. Masukkan 8-15 digit angka.`);
      }

      pesertaTervalidasi.push({
        nama,
        email: emailPeserta,
        whatsapp: waPeserta,
        nik,
        gender,
        kota,
        kategori,
        size,
        harga: tiket.price,
        ticketTypeId: tiket.id,
      });
    }

    // ── Perhitungan nominal ──────────────────────────────────────────────────
    // BIAYA LAYANAN DIHITUNG PER TIKET, BUKAN PER PESANAN — sama seperti
    // calculateAdminFee() di kembarin-v2 (feePerTicket * ticketCount). Pesanan 5 tiket
    // berarti 5 x biaya layanan. Kalau di sini dihitung per pesanan, total yang tampil
    // di layar akan lebih kecil daripada yang ditagihkan DOKU.
    const expectedSubtotal = pesertaTervalidasi.reduce((sum, p) => sum + p.harga, 0);
    const expectedAdminFee = live.adminFee * pesertaTervalidasi.length;
    const expectedTotal = expectedSubtotal + expectedAdminFee;

    // Nominal dari klien tidak dipakai untuk apa pun — hanya dicocokkan sebagai
    // deteksi manipulasi/ketidaksinkronan harga.
    if (typeof subtotal === "number" && subtotal !== expectedSubtotal) {
      return gagal("Nominal subtotal tiket tidak sesuai dengan tarif kategori yang dipilih.");
    }
    if (typeof total_amount === "number" && total_amount !== expectedTotal) {
      return gagal("Total nominal pembayaran tidak sesuai.");
    }

    // 5. Proteksi double-submit — mengunci SEMUA NIK dalam pesanan
    const nikKeys = pesertaTervalidasi.map((p) => hashNik(p.nik));
    const terkunci = nikKeys.find((key) => {
      const last = doubleSubmitMap.get(key);
      return last && now - last < DOUBLE_SUBMIT_WINDOW;
    });
    if (terkunci) {
      return gagal("Pendaftaran dengan NIK ini sedang diproses. Silakan tunggu beberapa detik.", 409);
    }
    nikKeys.forEach((key) => doubleSubmitMap.set(key, now));
    const lepasKunci = () => nikKeys.forEach((key) => doubleSubmitMap.delete(key));

    // 6. Payload ke core (kembarin-v2)
    const kembarInUrl = process.env.KEMBAR_IN_API_URL || "https://kembar.in/api/participants/register";

    const gatewayName =
      typeof paymentGateway === "string" && /^[a-z0-9_-]{2,20}$/i.test(paymentGateway) ? paymentGateway : "doku";

    // PENTING: payload dibangun EKSPLISIT dari field yang sudah divalidasi.
    // Jangan pernah menyebar body mentah dari klien ke sini — endpoint ini mengirim
    // header trusted-proxy, jadi field liar akan sampai ke core sebagai request tepercaya.
    // Bentuk { buyer, participants[] } adalah kontrak pesanan kolektif core; core
    // menghitung ulang seluruh harga, biaya layanan, dan kuota dari databasenya sendiri.
    const payloadBackend = {
      eventCode: "smadarun",
      buyer: {
        nama: buyerNama,
        email: buyerEmail,
        whatsapp: buyerWhatsapp,
      },
      participants: pesertaTervalidasi.map((p) => ({
        nama: p.nama,
        email: p.email ?? buyerEmail,
        ticketTypeId: p.ticketTypeId ?? undefined,
        customFields: {
          nik: p.nik,
          whatsapp: p.whatsapp ?? buyerWhatsapp,
          gender: p.gender,
          kota: p.kota,
          kategori: p.kategori,
          size: p.size,
        },
      })),
      paymentGateway: gatewayName,

      // Jejak persetujuan peserta. Timestamp sengaja dibuat di server, bukan diambil
      // dari klien, supaya tidak bisa dikarang.
      health_declaration: true,
      privacy_consent: true,
      consent_recorded_at: new Date(now).toISOString(),
    };

    // Set timeout request proxy 25 detik agar API route Next.js memberi waktu cukup untuk backend core
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 25000);

    // Header trusted-proxy: memberitahu core system IP pengunjung ASLI (bukan IP egress
    // server-to-server smadarun2027), supaya rate limiter kembarin-v2 tidak salah tembak
    // saat banyak pendaftar berbeda mendaftar bersamaan. Opt-in — kalau TRUSTED_PROXY_API_KEY
    // belum dikonfigurasi, header ini tidak dikirim dan perilaku proxy tetap seperti sebelumnya.
    const proxyHeaders: Record<string, string> = { "Content-Type": "application/json" };
    const trustedProxyKey = process.env.TRUSTED_PROXY_API_KEY;
    if (trustedProxyKey) {
      proxyHeaders["X-Trusted-Proxy-Key"] = trustedProxyKey;
      proxyHeaders["X-Forwarded-Client-Ip"] = ip;
    }

    try {
      const response = await fetch(kembarInUrl, {
        method: "POST",
        headers: proxyHeaders,
        body: JSON.stringify(payloadBackend),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errText = await response.text();
        // Log tanpa deretan angka panjang (NIK/WhatsApp bisa ikut terpantul di pesan error).
        console.error(`[api/daftar] core menolak (HTTP ${response.status}):`, redact(errText).slice(0, 300));
        lepasKunci();

        // Teruskan pesan validasi dari core HANYA kalau bentuknya memang pesan untuk
        // pengguna (mis. "NIK sudah terdaftar"), bukan potongan error internal.
        let customMessage =
          response.status >= 500
            ? "Sistem pendaftaran pusat sedang bermasalah. Silakan coba beberapa saat lagi."
            : "Data pendaftaran Anda ditolak sistem pendaftaran pusat. Periksa kembali isian Anda.";
        try {
          const parsedErr = JSON.parse(errText);
          const candidate =
            parsedErr && typeof parsedErr.message === "string"
              ? parsedErr.message
              : parsedErr && typeof parsedErr.error === "string"
                ? parsedErr.error
                : null;
          if (candidate && isSafeUserFacingMessage(candidate)) {
            customMessage = candidate;
          }
        } catch {
          // Respons bukan JSON — pakai pesan generik di atas, jangan pantulkan isinya.
        }

        return NextResponse.json({ success: false, message: customMessage }, { status: response.status });
      }

      const result = await response.json();
      if (result && result.success === false) {
        lepasKunci();
      }
      return NextResponse.json(result);
    } catch (fetchErr: unknown) {
      clearTimeout(timeoutId);
      console.error(
        "[api/daftar] gagal menghubungi core:",
        fetchErr instanceof Error ? `${fetchErr.name}: ${fetchErr.message}` : "unknown error"
      );
      lepasKunci();

      let errorMsg =
        "Koneksi ke core system pendaftaran terputus atau sibuk. Data Anda belum tersimpan, silakan coba beberapa saat lagi.";
      if (fetchErr instanceof Error && fetchErr.name === "AbortError") {
        errorMsg = "Request Timeout. Waktu tunggu pendaftaran habis (25 detik). Silakan periksa koneksi Anda dan coba lagi.";
      }

      return NextResponse.json({ success: false, message: errorMsg }, { status: 504 });
    }
  } catch (globalErr: unknown) {
    console.error(
      "[api/daftar] kesalahan internal:",
      globalErr instanceof Error ? `${globalErr.name}: ${globalErr.message}` : "unknown error"
    );
    return NextResponse.json(
      {
        success: false,
        message: "Terjadi kesalahan internal pada server pendaftaran. Silakan coba beberapa saat lagi.",
      },
      { status: 500 }
    );
  }
}

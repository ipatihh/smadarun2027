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
        // Reset window
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
      return NextResponse.json({ success: false, message: "Format JSON tidak valid." }, { status: 400 });
    }

    const {
      eventCode,
      nama,
      email,
      nik,
      whatsapp,
      gender,
      kota,
      kategori,
      subtotal,
      total_amount,
      nominal,
      paymentGateway,
      size,
      health_declaration,
      privacy_consent,
    } = body;

    // 4. Validasi & Sanitasi Data Ketat (Mencegah SQL Injection & Manipulasi Input)

    // Event Code Verification
    if (typeof eventCode !== "string" || eventCode.trim() !== "smadarun") {
      return NextResponse.json({ success: false, message: "Kode event tidak valid." }, { status: 400 });
    }

    // Nama Lengkap: String, huruf, spasi, titik (.), tanda petik tunggal (\'), panjang 3 - 100
    if (
      typeof nama !== "string" ||
      nama.trim().length < 3 ||
      nama.trim().length > 100 ||
      !/^[a-zA-Z\s\.\']+$/.test(nama.trim())
    ) {
      return NextResponse.json(
        { success: false, message: "Format nama tidak valid. Hanya diperbolehkan huruf, spasi, titik (.), atau kutip (')." },
        { status: 400 }
      );
    }

    // Email: Validasi regex email standar
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (typeof email !== "string" || !emailRegex.test(email.trim())) {
      return NextResponse.json({ success: false, message: "Format email tidak valid." }, { status: 400 });
    }

    // NIK KTP / Kartu Pelajar: Harus angka tepat 16 digit
    if (typeof nik !== "string" || !/^\d{16}$/.test(nik.trim())) {
      return NextResponse.json({ success: false, message: "NIK harus berupa angka dengan panjang tepat 16 digit." }, { status: 400 });
    }

    // WhatsApp: Harus angka, minimal 8 digit dan maksimal 15 digit (opsional didahului tanda +)
    if (typeof whatsapp !== "string" || !/^\+?\d{8,15}$/.test(whatsapp.trim())) {
      return NextResponse.json(
        { success: false, message: "Format nomor WhatsApp tidak valid. Masukkan 8-15 digit angka." },
        { status: 400 }
      );
    }

    // Gender Whitelist
    const genderWhitelist = ["Laki-laki", "Perempuan"];
    if (typeof gender !== "string" || !genderWhitelist.includes(gender)) {
      return NextResponse.json({ success: false, message: "Pilihan Jenis Kelamin tidak valid." }, { status: 400 });
    }

    // Size Whitelist
    const sizeWhitelist = ["XS", "S", "M", "L", "XL", "XXL", "XXXL"];
    if (typeof size !== "string" || !sizeWhitelist.includes(size)) {
      return NextResponse.json({ success: false, message: "Pilihan Ukuran Jersey tidak valid." }, { status: 400 });
    }

    // Kota: huruf, spasi, titik, kutip, dan strip (mis. "Nganjuk", "Jakarta Barat").
    if (
      typeof kota !== "string" ||
      kota.trim().length < 2 ||
      kota.trim().length > 100 ||
      !/^[a-zA-Z\s\.\'\-]+$/.test(kota.trim())
    ) {
      return NextResponse.json(
        { success: false, message: "Format nama kota tidak valid. Hanya huruf, spasi, titik, strip, dan kutip." },
        { status: 400 }
      );
    }

    // Persetujuan wajib. Sebelumnya kedua checkbox HANYA mengunci tombol di browser,
    // sehingga request langsung ke endpoint ini bisa mendaftar tanpa persetujuan apa pun
    // dan tidak ada satu pun jejak persetujuan yang tersimpan (padahal yang dikumpulkan
    // termasuk NIK — data pribadi di bawah UU PDP).
    if (health_declaration !== true) {
      return NextResponse.json(
        { success: false, message: "Pernyataan kondisi kesehatan wajib disetujui sebelum mendaftar." },
        { status: 400 }
      );
    }
    if (privacy_consent !== true) {
      return NextResponse.json(
        { success: false, message: "Persetujuan Kebijakan Privasi wajib diberikan sebelum mendaftar." },
        { status: 400 }
      );
    }

    // Kategori & Nominal Verification (Mencegah manipulasi nominal/harga tiket dari frontend)
    // Harga & kategori diambil live dari kembarin-v2 (satu-satunya sumber kebenaran, dikontrol
    // penuh dari dasbor Super Admin kembarin-v2) — bukan hardcode di project ini.
    const live = await getLiveEventData();
    if (!live.isOpen) {
      return NextResponse.json(
        { success: false, message: "Pendaftaran untuk event ini sedang tidak dibuka. Silakan coba beberapa saat lagi." },
        { status: 400 }
      );
    }
    const KATEGORI_TARIF: Record<string, number> = Object.fromEntries(
      live.ticketTypes.map((t) => [t.categoryKey, t.price])
    );

    if (typeof kategori !== "string" || KATEGORI_TARIF[kategori] === undefined) {
      return NextResponse.json({ success: false, message: "Kategori lomba tidak valid." }, { status: 400 });
    }

    const expectedSubtotal = KATEGORI_TARIF[kategori]; // Subtotal tiket murni panitia
    const expectedAdminFee = live.adminFee;            // Biaya Layanan Platform, live dari kembarin-v2
    const expectedTotal = expectedSubtotal + expectedAdminFee;

    // Verifikasi penyesuaian nominal jika dikirim oleh client
    if (typeof subtotal === "number" && subtotal !== expectedSubtotal) {
      return NextResponse.json(
        { success: false, message: "Nominal subtotal tiket tidak sesuai dengan tarif kategori yang dipilih." },
        { status: 400 }
      );
    }

    if (typeof total_amount === "number" && total_amount !== expectedTotal) {
      return NextResponse.json(
        { success: false, message: "Total nominal pembayaran tidak sesuai." },
        { status: 400 }
      );
    }

    if (typeof nominal === "number" && nominal !== expectedTotal && nominal !== expectedSubtotal) {
      return NextResponse.json(
        { success: false, message: "Nominal pembayaran tidak sesuai dengan tarif kategori yang dipilih." },
        { status: 400 }
      );
    }

    // 5. Proteksi Double-Submit Sisi Server (Pencegahan Duplikat Cepat)
    const normalizedNik = nik.trim();
    const nikKey = hashNik(normalizedNik);
    const lastSubmitTime = doubleSubmitMap.get(nikKey);
    if (lastSubmitTime && now - lastSubmitTime < DOUBLE_SUBMIT_WINDOW) {
      return NextResponse.json(
        {
          success: false,
          message: "Data pendaftaran dengan NIK ini sedang diproses. Silakan tunggu beberapa detik.",
        },
        { status: 409 }
      );
    }
    // Set lock
    doubleSubmitMap.set(nikKey, now);

    // 6. Siapkan Payload & Proxy Request ke Backend Kembarin (kembarin-v2)
    const kembarInUrl = process.env.KEMBAR_IN_API_URL || "https://kembar.in/api/participants/register";

    const gatewayName = typeof paymentGateway === "string" && /^[a-z0-9_-]{2,20}$/i.test(paymentGateway)
      ? paymentGateway
      : "doku";

    // PENTING: payload dibangun EKSPLISIT dari field yang sudah divalidasi.
    // Sebelumnya di sini ada `...body`, sehingga field apa pun yang dikirim klien
    // (status pembayaran, flag verifikasi, dsb) ikut diteruskan ke core system —
    // dan diteruskan sebagai request tepercaya kalau header trusted-proxy aktif.
    const payloadBackend = {
      eventCode: "smadarun",
      nama: nama.trim(),
      email: email.trim(),
      nik: normalizedNik,
      whatsapp: whatsapp.trim(),
      gender,
      kota: kota.trim(),
      kategori,
      size,
      custom_fields: {},

      // Jejak persetujuan peserta. Timestamp sengaja dibuat di server, bukan diambil
      // dari klien, supaya tidak bisa dikarang.
      health_declaration: true,
      privacy_consent: true,
      consent_recorded_at: new Date(now).toISOString(),

      // Tiket / Subtotal Murni Event
      subtotal: expectedSubtotal,
      ticket_price: expectedSubtotal,
      ticketPrice: expectedSubtotal,
      price: expectedSubtotal,

      // Biaya Layanan Platform, live dari kembarin-v2 (Semua Varian Nama Parameter)
      admin_fee: expectedAdminFee,
      adminFee: expectedAdminFee,
      platform_fee: expectedAdminFee,
      platformFee: expectedAdminFee,
      service_fee: expectedAdminFee,
      serviceFee: expectedAdminFee,
      fee: expectedAdminFee,
      biaya_admin: expectedAdminFee,
      biayaAdmin: expectedAdminFee,
      biaya_layanan: expectedAdminFee,
      biayaLayanan: expectedAdminFee,

      // Total Pembayaran (Subtotal + Biaya Layanan) (Semua Varian Nama Parameter)
      total_amount: expectedTotal,
      totalAmount: expectedTotal,
      nominal: expectedTotal,
      amount: expectedTotal,
      total: expectedTotal,
      total_price: expectedTotal,
      totalPrice: expectedTotal,
      final_amount: expectedTotal,
      finalAmount: expectedTotal,

      // Payment Gateway
      paymentGateway: gatewayName,
      payment_gateway: gatewayName,
    };

    // Set timeout request proxy 25 detik (25000ms) agar API route Next.js memberikan waktu cukup untuk backend core
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 25000);

    // Header trusted-proxy: memberitahu core system IP pengunjung ASLI (bukan IP egress
    // server-to-server smadarun2027), supaya rate limiter kembarin-v2 tidak salah tembak
    // saat banyak pendaftar berbeda mendaftar bersamaan. Opt-in — kalau TRUSTED_PROXY_API_KEY
    // belum dikonfigurasi (belum dikoordinasikan dengan tim core), header ini tidak dikirim
    // dan perilaku proxy tetap seperti sebelumnya.
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

      // Pastikan merespons balik secara anggun & aman
      if (!response.ok) {
        const errText = await response.text();
        // Log tanpa deretan angka panjang (NIK/WhatsApp bisa ikut terpantul di pesan error).
        console.error(
          `[api/daftar] core menolak (HTTP ${response.status}):`,
          redact(errText).slice(0, 300)
        );
        // Lepas lock NIK agar user bisa mencoba lagi
        doubleSubmitMap.delete(nikKey);

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

        return NextResponse.json(
          {
            success: false,
            message: customMessage,
          },
          { status: response.status }
        );
      }

      const result = await response.json();
      if (result && result.success === false) {
        // Lepas lock jika backend mengembalikan 200 dengan success: false
        doubleSubmitMap.delete(nikKey);
      }
      return NextResponse.json(result);
    } catch (fetchErr: unknown) {
      clearTimeout(timeoutId);
      console.error(
        "[api/daftar] gagal menghubungi core:",
        fetchErr instanceof Error ? `${fetchErr.name}: ${fetchErr.message}` : "unknown error"
      );
      // Lepas lock NIK agar user bisa mencoba lagi
      doubleSubmitMap.delete(nikKey);

      let errorMsg = "Koneksi ke core system pendaftaran terputus atau sibuk. Data Anda belum tersimpan, silakan coba beberapa saat lagi.";
      if (fetchErr instanceof Error && fetchErr.name === "AbortError") {
        errorMsg = "Request Timeout. Waktu tunggu pendaftaran habis (25 detik). Silakan periksa koneksi Anda dan coba lagi.";
      }

      return NextResponse.json(
        {
          success: false,
          message: errorMsg,
        },
        { status: 504 }
      );
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

import { createHash, randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { getLiveEventData } from "@/lib/kembarinEvents";
import { KOTA_MANUAL_MAX_LENGTH, KOTA_MANUAL_PATTERN, resolveProvince, resolveWilayah } from "@/lib/wilayah";
import {
  isJenisIdentitas,
  JenisIdentitas,
  kunciIdentitas,
  LABEL_JENIS_IDENTITAS,
  rapikanNomorIdentitas,
  validasiIdentitas,
} from "@/lib/identitas";
import {
  klasifikasiPenolakanCore,
  PESAN_BELUM_PASTI,
  pesanTanpaTautan,
  pesanTautanDitolak,
  ResponsDaftar,
  verifikasiSuksesCore,
} from "@/lib/kontrakPendaftaran";
import {
  ambilJatah,
  asalDiizinkan,
  bacaBodyRequest,
  bacaTeksTerbatas,
  catat as catatLog,
  contentTypeJson,
  getClientIp,
  headerKeCore,
  isRecord,
  urlCore,
  type PetaHitungan,
} from "@/lib/proxyCore";
import { VERSI_PERSETUJUAN_DIKENAL, VERSI_PERSETUJUAN_TANPA_LABEL } from "@/lib/persetujuan";
import { rapikanNamaBib, validasiNamaBib } from "@/lib/namaBib";
import { rapikanIsian, validasiKolomTambahan } from "@/lib/kolomTambahan";
import { URL_KEMBALI_PEMBAYARAN } from "@/lib/statusPesanan";

// ─── Batas & proteksi per instance ───────────────────────────────────────────
// Semua Map di bawah hidup di memori SATU instance serverless (Vercel bisa menjalankan
// banyak instance, dan instance bisa di-restart). Ini saringan lapis pertama, bukan
// sumber kebenaran: limiter terpusat ada di core (`register_<ip>`, 10/menit, memakai IP
// asli lewat header trusted-proxy) dan idempotensi pesanan dijamin core lewat `sessionId`.

/**
 * Dua lapis rate limit per IP:
 * - semua permintaan: saringan banjir murah sebelum body dibaca;
 * - permintaan yang lolos validasi dan benar-benar diteruskan ke core. Core mengizinkan
 *   30/menit per IP pengunjung partner terverifikasi (PARTNER_INTEGRATION.md §3); di sini
 *   20 (keputusan pemilik, 2 Oktober 2026) — longgar untuk satu jaringan sekolah/kampus di
 *   balik satu IP NAT, tetapi tetap di bawah batas core sehingga penolakan terjadi di sini
 *   dulu dengan pesan yang jelas. Dulu satu batas 3/menit menghitung juga request yang
 *   gagal validasi, sehingga satu jaringan cepat terblokir hanya karena beberapa orang salah ketik.
 */
const BATAS_SEMUA_PERMINTAAN = 30;
const BATAS_KE_CORE = 20;
const hitunganSemua: PetaHitungan = new Map();
const hitunganKeCore: PetaHitungan = new Map();

/**
 * Payload 10 peserta ±5 KB tanpa kolom tambahan. Kolom tambahan dari form builder core
 * (src/lib/kolomTambahan.ts) bisa menambah beberapa KB per peserta; batas ini masih jauh
 * di atasnya tetapi tetap memotong body raksasa. Core sendiri menerima hingga 3 MB.
 */
const BATAS_BODY_REQUEST = 64 * 1024;
/** Respons core normal < 2 KB. */
const BATAS_BODY_CORE = 64 * 1024;
const CORE_TIMEOUT_MS = 25_000;

/**
 * Kunci "sedang diproses" per nomor identitas, dipegang SELAMA request ke core berjalan
 * (dulu hanya 5 detik, padahal request ke core bisa 25 detik). Masa berlaku hanya jaring
 * pengaman bila handler mati di tengah jalan. Key-nya hash ber-salt, bukan NIK mentah.
 */
const kunciDalamProses = new Map<string, number>();
const MASA_KUNCI = CORE_TIMEOUT_MS + 10_000;
const NIK_HASH_SALT = randomUUID();

function hashNik(nik: string): string {
  return createHash("sha256").update(`${NIK_HASH_SALT}:${nik}`).digest("hex");
}

// Kunci "sedang diproses" yang kedaluwarsa dibersihkan pasif di dalam request handler.
function bersihkanKunciMundur(now: number) {
  if (kunciDalamProses.size > 200) {
    kunciDalamProses.forEach((kedaluwarsa, key) => {
      if (now > kedaluwarsa) kunciDalamProses.delete(key);
    });
  }
}

const catat = (event: string, data: Record<string, string | number | undefined>) => catatLog("api/daftar", event, data);

// ─── Validator satuan ────────────────────────────────────────────────────────
const NAMA_PATTERN = /^[a-zA-Z\s\.\']+$/;
const EMAIL_PATTERN = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
const EMAIL_MAX = 254;
const WHATSAPP_PATTERN = /^\+?\d{8,15}$/;
const GENDER_WHITELIST = ["Laki-laki", "Perempuan"];
const SIZE_WHITELIST = ["XS", "S", "M", "L", "XL", "XXL", "XXXL"];
const KODE_WILAYAH_MAX = 16;
const KATEGORI_MAX = 100;
const SESSION_ID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const POLA_VERSI_PERSETUJUAN = /^[A-Za-z0-9._-]{1,32}$/;

function emailValid(email: string): boolean {
  return email.length <= EMAIL_MAX && EMAIL_PATTERN.test(email);
}

function balas(body: ResponsDaftar, status: number, headers?: Record<string, string>) {
  return NextResponse.json(body, { status, headers });
}

/** Penolakan sebelum/tanpa menghubungi core: pasti tidak ada pesanan yang dibuat. */
function gagal(message: string, status = 400, code = "INVALID_REQUEST", headers?: Record<string, string>) {
  return balas({ success: false, outcome: "rejected", code, message }, status, headers);
}

interface PesertaTervalidasi {
  nama: string;
  email: string | null;
  whatsapp: string | null;
  nik: string;
  jenisIdentitas: JenisIdentitas;
  gender: string;
  kota: string;
  provCode: string | null;
  kotaCode: string | null;
  kategori: string;
  size: string;
  harga: number;
  ticketTypeId: number | null;
  namaBib: string;
  tambahan: Record<string, string>;
}

export async function POST(req: NextRequest) {
  const ref = randomUUID();
  const kunciDipegang: string[] = [];
  try {
    const now = Date.now();
    bersihkanKunciMundur(now);

    // 1. IP pengunjung untuk rate limiting (lihat catatan di getClientIp)
    const ip = getClientIp(req);

    // 2. Saringan banjir (semua permintaan)
    const jatahSemua = ambilJatah(hitunganSemua, ip, BATAS_SEMUA_PERMINTAAN, now);
    if (!jatahSemua.ok) {
      return gagal(
        "Terlalu banyak permintaan pendaftaran dari jaringan Anda. Silakan tunggu 1 menit sebelum mencoba lagi.",
        429,
        "RATE_LIMITED",
        { "Retry-After": String(jatahSemua.retryAfter) }
      );
    }

    // 3. Bentuk permintaan: asal, media type, ukuran, dan root JSON
    if (!asalDiizinkan(req)) {
      return gagal("Permintaan ditolak.", 403, "ORIGIN_NOT_ALLOWED");
    }
    if (!contentTypeJson(req)) {
      return gagal("Format permintaan harus JSON.", 415, "UNSUPPORTED_MEDIA_TYPE");
    }
    const teksBody = await bacaBodyRequest(req, BATAS_BODY_REQUEST);
    if (teksBody === null) {
      return gagal("Ukuran data pendaftaran terlalu besar.", 413, "PAYLOAD_TOO_LARGE");
    }
    let parsed: unknown;
    try {
      parsed = JSON.parse(teksBody);
    } catch {
      return gagal("Format JSON tidak valid.");
    }
    // JSON `null`, angka, string, atau array dulu lolos ke destructuring dan berakhir 500.
    if (!isRecord(parsed)) return gagal("Format data pendaftaran tidak valid.");
    const body = parsed;

    const {
      eventCode,
      buyer,
      participants,
      health_declaration,
      privacy_consent,
      subtotal,
      total_amount,
      sessionId,
      consent_policy_version,
    } = body;

    // 4. Validasi & sanitasi ketat

    if (typeof eventCode !== "string" || eventCode.trim() !== "smadarun") {
      return gagal("Kode event tidak valid.");
    }

    // Kunci idempotensi dari browser: satu UUID per isi pesanan (lihat DaftarForm). Opsional
    // supaya tab yang dibuka sebelum deploy ini tetap bisa mendaftar; bila dikirim, wajib UUID.
    let sessionIdTervalidasi: string | null = null;
    if (sessionId !== undefined && sessionId !== null) {
      if (typeof sessionId !== "string" || !SESSION_ID_PATTERN.test(sessionId)) {
        return gagal("Kode sesi pendaftaran tidak valid. Muat ulang halaman lalu coba lagi.");
      }
      sessionIdTervalidasi = sessionId.toLowerCase();
    }

    // ── Data pemesan ──────────────────────────────────────────────────────────
    if (!isRecord(buyer)) return gagal("Data pemesan wajib diisi.");

    const buyerNama = typeof buyer.nama === "string" ? buyer.nama.trim() : "";
    if (buyerNama.length < 3 || buyerNama.length > 100 || !NAMA_PATTERN.test(buyerNama)) {
      return gagal("Format nama pemesan tidak valid. Hanya diperbolehkan huruf, spasi, titik (.), atau kutip (').");
    }

    const buyerEmail = typeof buyer.email === "string" ? buyer.email.trim() : "";
    if (!emailValid(buyerEmail)) return gagal("Format email pemesan tidak valid.");

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
    // Versi teks persetujuan yang DITAMPILKAN di tab pendaftar (lihat src/lib/persetujuan.ts).
    // Hanya label yang pernah dipakai situs ini yang diterima; tab lama tanpa label
    // menampilkan teks label pertama.
    let versiPersetujuan = VERSI_PERSETUJUAN_TANPA_LABEL;
    if (consent_policy_version !== undefined && consent_policy_version !== null) {
      if (
        typeof consent_policy_version !== "string" ||
        !POLA_VERSI_PERSETUJUAN.test(consent_policy_version) ||
        !VERSI_PERSETUJUAN_DIKENAL.includes(consent_policy_version)
      ) {
        return gagal("Versi teks persetujuan tidak dikenal. Muat ulang halaman lalu coba lagi.");
      }
      versiPersetujuan = consent_policy_version;
    }

    // ── Data live: harga, kategori aktif, status buka/tutup, batas kolektif ───
    // kembarin-v2 adalah sumber kebenaran; nominal apa pun dari klien tidak dipercaya.
    const live = await getLiveEventData();
    if (!live.isOpen) {
      return gagal("Pendaftaran untuk event ini sedang tidak dibuka. Silakan coba beberapa saat lagi.", 400, "REGISTRATION_CLOSED");
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

      // NIK atau nomor kartu pelajar. Jenis yang tidak dikirim dianggap NIK — itu
      // perilaku form sebelum pilihan kartu pelajar ada (tab yang dibuka sebelum deploy).
      const jenisIdentitas = p.jenisIdentitas ?? "nik";
      if (!isJenisIdentitas(jenisIdentitas)) {
        return gagal(`Jenis nomor identitas peserta ${nomor} tidak valid.`);
      }
      const nik = typeof p.nik === "string" ? rapikanNomorIdentitas(p.nik) : "";
      const pesanIdentitas = validasiIdentitas(jenisIdentitas, nik);
      if (pesanIdentitas) {
        return gagal(`Peserta ${nomor}: ${pesanIdentitas}`);
      }
      // Satu identitas hanya boleh muncul sekali dalam satu pesanan — kalau tidak, satu
      // orang bisa terdaftar berkali-kali dalam satu order dan memakan kuota kategori.
      // Dibandingkan dalam bentuk kunci (tanpa pemisah), sama seperti core menilainya.
      const kunci = kunciIdentitas(nik);
      if (nikTerpakai.has(kunci)) {
        return gagal(`Nomor identitas peserta ${nomor} sama dengan peserta lain dalam pesanan ini.`);
      }
      nikTerpakai.add(kunci);

      const gender = typeof p.gender === "string" ? p.gender : "";
      if (!GENDER_WHITELIST.includes(gender)) {
        return gagal(`Pilihan jenis kelamin peserta ${nomor} tidak valid.`);
      }

      const size = typeof p.size === "string" ? p.size : "";
      if (!SIZE_WHITELIST.includes(size)) {
        return gagal(`Pilihan ukuran jersey peserta ${nomor} tidak valid.`);
      }

      // Domisili. Jalur dropdown: nama kota DITURUNKAN dari kode (teks dari browser
      // diabaikan), dan kabupaten wajib anak dari provinsinya. Jalur manual: provinsi
      // tetap wajib dari daftar resmi, kota boleh diketik. Core memvalidasi ulang
      // keduanya dengan dataset yang sama (lihat src/lib/wilayah.ts).
      const provCodeRaw = typeof p.provCode === "string" ? p.provCode.trim() : "";
      const kotaCodeRaw = typeof p.kotaCode === "string" ? p.kotaCode.trim() : "";
      if (provCodeRaw.length > KODE_WILAYAH_MAX || kotaCodeRaw.length > KODE_WILAYAH_MAX) {
        return gagal(`Kode wilayah domisili peserta ${nomor} tidak valid. Silakan pilih ulang.`);
      }
      const kotaTeks = typeof p.kota === "string" ? p.kota.trim().toUpperCase() : "";
      let kota: string;
      let provCode: string | null = null;
      let kotaCode: string | null = null;
      if (kotaCodeRaw) {
        const wilayah = resolveWilayah(provCodeRaw, kotaCodeRaw);
        if (!wilayah) {
          return gagal(`Kota/kabupaten domisili peserta ${nomor} tidak sesuai dengan provinsinya. Silakan pilih ulang.`);
        }
        kota = wilayah.display;
        provCode = wilayah.prov.c;
        kotaCode = wilayah.kota.c;
      } else {
        if (provCodeRaw) {
          const provinsi = resolveProvince(provCodeRaw);
          if (!provinsi) return gagal(`Provinsi domisili peserta ${nomor} tidak valid. Silakan pilih ulang.`);
          provCode = provinsi.c;
        }
        // Tanpa provCode sama sekali = dropdown wilayah dimatikan di kembarin-v2
        // (event_config.enable_wilayah_dropdown), atau payload dari tab yang dibuka
        // sebelum toggle itu dinyalakan. Tetap diterima sebagai teks bebas (core juga
        // menerimanya untuk event partner) supaya peserta tidak kehilangan isian form
        // yang panjang.
        if (kotaTeks.length < 2 || kotaTeks.length > (provCode ? KOTA_MANUAL_MAX_LENGTH : 100) || !KOTA_MANUAL_PATTERN.test(kotaTeks)) {
          return gagal(`Format kota domisili peserta ${nomor} tidak valid. Hanya huruf, spasi, titik, strip, dan kutip.`);
        }
        kota = kotaTeks;
      }

      const kategori = typeof p.kategori === "string" && p.kategori.length <= KATEGORI_MAX ? p.kategori : "";
      const tiket = tarifPerKategori.get(kategori);
      if (!tiket) {
        return gagal(`Kategori lomba peserta ${nomor} tidak valid atau sedang tidak aktif.`);
      }

      // Email & WhatsApp peserta bersifat opsional: kalau kosong, core memakai data
      // pemesan (lihat resolveParticipantEmail di kembarin-v2).
      const emailPeserta = typeof p.email === "string" && p.email.trim() ? p.email.trim() : null;
      if (emailPeserta && !emailValid(emailPeserta)) {
        return gagal(`Format email peserta ${nomor} tidak valid.`);
      }
      const waPeserta = typeof p.whatsapp === "string" && p.whatsapp.trim() ? p.whatsapp.trim() : null;
      if (waPeserta && !WHATSAPP_PATTERN.test(waPeserta)) {
        return gagal(`Format nomor WhatsApp peserta ${nomor} tidak valid. Masukkan 8-15 digit angka.`);
      }

      // Nama BIB hanya dibaca bila kolomnya dipasang panitia di kembarin-v2; selain itu
      // isian dari browser diabaikan. Core menegakkan aturan yang sama.
      let namaBib = "";
      if (live.namaBib) {
        const mentah = typeof p.namaBib === "string" ? p.namaBib.slice(0, 200) : "";
        const pesanNamaBib = validasiNamaBib(mentah, live.namaBib);
        if (pesanNamaBib) return gagal(`Peserta ${nomor}: ${pesanNamaBib}`);
        namaBib = rapikanNamaBib(mentah);
      }

      // Kolom tambahan form builder core. Hanya kunci yang ada di form_schema yang dibaca
      // — isian liar dari browser tidak pernah diteruskan ke core.
      const tambahanMentah = isRecord(p.tambahan) ? p.tambahan : {};
      const tambahan: Record<string, string> = {};
      for (const kolom of live.kolomTambahan) {
        const mentah = tambahanMentah[kolom.name];
        const nilai = typeof mentah === "string" ? mentah.slice(0, kolom.maxLength + 50) : "";
        const pesanKolom = validasiKolomTambahan(kolom, nilai);
        if (pesanKolom) return gagal(`Peserta ${nomor}: ${pesanKolom}`);
        const rapi = rapikanIsian(kolom, nilai);
        if (rapi) tambahan[kolom.name] = rapi;
      }

      pesertaTervalidasi.push({
        nama,
        email: emailPeserta,
        whatsapp: waPeserta,
        nik,
        jenisIdentitas,
        gender,
        kota,
        provCode,
        kotaCode,
        kategori,
        size,
        harga: tiket.price,
        ticketTypeId: tiket.id,
        namaBib,
        tambahan,
      });
    }

    // ── Perhitungan nominal ──────────────────────────────────────────────────
    // BIAYA LAYANAN DIHITUNG PER TIKET, BUKAN PER PESANAN — sama seperti
    // calculateAdminFee() di kembarin-v2 (feePerTicket * ticketCount). Pesanan 5 tiket
    // berarti 5 x biaya layanan. Kalau di sini dihitung per pesanan, total yang tampil
    // di layar akan lebih kecil daripada yang ditagihkan oleh PT KEMBAR INOVASI.
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

    // 5. Jatah ke core — hanya permintaan yang lolos validasi yang dihitung.
    const jatahCore = ambilJatah(hitunganKeCore, ip, BATAS_KE_CORE, now);
    if (!jatahCore.ok) {
      return gagal(
        "Terlalu banyak percobaan pendaftaran dari jaringan Anda. Silakan tunggu 1 menit sebelum mencoba lagi.",
        429,
        "RATE_LIMITED",
        { "Retry-After": String(jatahCore.retryAfter) }
      );
    }

    // 6. Kunci "sedang diproses" untuk SEMUA nomor identitas dalam pesanan, selama
    // request ke core berjalan. Dilepas di `finally` apa pun hasilnya: pengiriman ulang
    // setelah hasil belum pasti aman karena membawa sessionId yang sama.
    const nikKeys = pesertaTervalidasi.map((p) => hashNik(kunciIdentitas(p.nik)));
    const terkunci = nikKeys.some((key) => (kunciDalamProses.get(key) ?? 0) > now);
    if (terkunci) {
      return gagal(
        "Pendaftaran dengan nomor identitas ini sedang diproses. Tunggu hingga selesai sebelum mencoba lagi.",
        409,
        "REGISTRATION_IN_PROGRESS"
      );
    }
    for (const key of nikKeys) {
      kunciDalamProses.set(key, now + MASA_KUNCI);
      kunciDipegang.push(key);
    }

    // 7. Payload ke core (kembarin-v2)
    const kembarInUrl = urlCore("register");

    // PENTING: payload dibangun EKSPLISIT dari field yang sudah divalidasi.
    // Jangan pernah menyebar body mentah dari klien ke sini — endpoint ini mengirim
    // header trusted-proxy, jadi field liar akan sampai ke core sebagai request tepercaya.
    // Bentuk { buyer, participants[] } adalah kontrak pesanan kolektif core; core
    // menghitung ulang seluruh harga, biaya layanan, dan kuota dari databasenya sendiri.
    const payloadBackend = {
      eventCode: "smadarun",
      // Kontrak idempotensi core (RegisterParticipantRequest.sessionId): core menyimpan
      // `smadarun:<sessionId>` sebagai idempotency_key unik pesanan. Permintaan ulang
      // dengan sessionId yang sama mengembalikan pesanan yang sudah ada (beserta tautan
      // bayarnya), bukan membuat pesanan baru — kecuali pesanan itu sudah dibatalkan.
      ...(sessionIdTervalidasi ? { sessionId: sessionIdTervalidasi } : {}),
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
          // Kolom tambahan form builder core (kunci = nama field). Ditaruh paling atas
          // bersama Nama BIB: data inti di bawahnya selalu menang bila namanya bentrok.
          ...p.tambahan,
          // Kunci = nama field Nama BIB di form_schema core, bukan nama karangan situs ini.
          // Ditaruh PALING ATAS supaya nama field yang kebetulan bentrok (mis. "kota")
          // tidak pernah menimpa data inti di bawahnya.
          ...(live.namaBib && p.namaBib ? { [live.namaBib.fieldName]: p.namaBib } : {}),
          nik: p.nik,
          // Kolom `nik` core menampung NIK maupun nomor kartu pelajar; label ini yang
          // memberi tahu panitia mana yang dipakai peserta. Namanya sengaja tidak cocok
          // pola semantik core (nik/identity, kota, dst) supaya tidak terbaca sebagai field lain.
          jenis_identitas: LABEL_JENIS_IDENTITAS[p.jenisIdentitas],
          whatsapp: p.whatsapp ?? buyerWhatsapp,
          gender: p.gender,
          kota: p.kota,
          kategori: p.kategori,
          size: p.size,
          // Kontrak wilayah core (RegistrationOrderService): core menyelesaikan ulang
          // kode ini dan menyimpan prov_code/prov_name/kota_code/kota_name, sehingga
          // dasbor panitia menampilkan "JAWA TIMUR · KAB. NGANJUK". Key ini SENGAJA
          // ditaruh SETELAH `kota` — core versi lama mencari domisili dengan pola
          // /kota/ pada urutan key, dan `__wilayah_kota` ikut cocok.
          ...(p.provCode ? { __wilayah_prov: p.provCode, __wilayah_kota: p.kotaCode ?? "" } : {}),
        },
      })),
      // Situs ini tidak menawarkan pilihan metode pembayaran, jadi gateway dipilih core
      // dari saklar per-event & global di dasbor kembarin-v2. Nilai dari browser SENGAJA
      // diabaikan: menamai gateway di sini pernah membuat seluruh pendaftaran gagal saat
      // panitia mematikan gateway itu di dasbor.
      paymentGateway: "auto",

      // Jejak persetujuan. Core (kontrak partner, PARTNER_INTEGRATION.md §9) menyimpannya di
      // registration_orders.consent_json — setelah migrasi core; sebelumnya diabaikan.
      // Timestamp dibuat di server ini, bukan browser; core hanya menyimpannya bila selisih
      // dengan jamnya <= 10 menit, dan waktu resmi tetap created_at pesanan.
      health_declaration: true,
      privacy_consent: true,
      consent_recorded_at: new Date(now).toISOString(),
      consent_policy_version: versiPersetujuan,

      // Setelah bayar, gateway memulangkan pembeli ke /daftar/status situs ini, bukan ke
      // kembar.in (kontrak core §4b). Nilai tetap dari server — tidak pernah dari browser.
      // Core hanya memakainya dari partner terverifikasi dan bila host-nya host tautan
      // partner event; selain itu core diam-diam memakai halaman kembar.in.
      partnerReturnUrl: URL_KEMBALI_PEMBAYARAN,
    };

    // Header trusted-proxy (IP pengunjung asli) — lihat headerKeCore di src/lib/proxyCore.ts.
    const proxyHeaders = headerKeCore(ip);

    // 8. Panggil core. Batas waktu mencakup SELURUH respons — header DAN body. Dulu timer
    // dihentikan begitu header tiba, sehingga body yang macet bisa menggantung melewati
    // 25 detik. Tidak ada percobaan ulang otomatis: POST pendaftaran tidak diulang diam-diam.
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), CORE_TIMEOUT_MS);
    let statusCore: number;
    let teksCore: string | null;
    try {
      const response = await fetch(kembarInUrl, {
        method: "POST",
        headers: proxyHeaders,
        body: JSON.stringify(payloadBackend),
        signal: controller.signal,
        cache: "no-store",
      });
      statusCore = response.status;
      teksCore = await bacaTeksTerbatas(response.body, BATAS_BODY_CORE);
    } catch (fetchErr: unknown) {
      const nama = fetchErr instanceof Error ? fetchErr.name : "unknown";
      const timeout = nama === "AbortError" || nama === "TimeoutError";
      catat(timeout ? "core_timeout" : "core_unreachable", { ref, error: nama });
      // Permintaan mungkin sudah diproses core sebelum sambungan putus/timeout.
      return balas(
        { success: false, outcome: "unknown", code: timeout ? "CORE_TIMEOUT" : "CORE_UNREACHABLE", message: PESAN_BELUM_PASTI, ref },
        504
      );
    } finally {
      clearTimeout(timeoutId);
    }

    if (teksCore === null) {
      catat("core_response_too_large", { ref, httpStatus: statusCore });
      return balas({ success: false, outcome: "unknown", code: "CORE_MALFORMED_RESPONSE", message: PESAN_BELUM_PASTI, ref }, 502);
    }

    if (statusCore < 200 || statusCore >= 300) {
      const hasil = klasifikasiPenolakanCore(statusCore, teksCore);
      catat(hasil.bugPartner ? "partner_bug" : "core_rejected", {
        ref,
        httpStatus: statusCore,
        code: hasil.code,
        outcome: hasil.outcome,
      });
      const retryAfter = hasil.retryAfterSeconds ? { "Retry-After": String(hasil.retryAfterSeconds) } : undefined;
      if (hasil.outcome === "unknown") {
        return balas(
          {
            success: false,
            outcome: "unknown",
            code: hasil.code,
            message: hasil.message,
            orderCode: hasil.orderCode,
            retryAfterSeconds: hasil.retryAfterSeconds,
            ref,
          },
          // 503 dipertahankan untuk "tautan bayar masih disiapkan" (core mengirim Retry-After).
          hasil.code === "REGISTRATION_ORDER_PROCESSING" ? 503 : 502,
          retryAfter
        );
      }
      // 4xx core diteruskan apa adanya (409 = sudah terdaftar, 429 = rate limit core, ...).
      const status = statusCore >= 400 && statusCore < 500 ? statusCore : 503;
      return balas(
        {
          success: false,
          outcome: "rejected",
          code: hasil.code,
          message: hasil.message,
          orderCode: hasil.orderCode,
          paymentExpiresAt: hasil.paymentExpiresAt,
          ...(hasil.ulangSesi ? { ulangSesi: true as const } : {}),
          ref,
        },
        status,
        retryAfter
      );
    }

    let dataCore: unknown;
    try {
      dataCore = JSON.parse(teksCore);
    } catch {
      dataCore = undefined;
    }
    const verifikasi = verifikasiSuksesCore(dataCore);
    switch (verifikasi.jenis) {
      case "berhasil":
        return balas(
          { success: true, outcome: verifikasi.order.status === "paid" ? "paid" : "created", order: verifikasi.order },
          200
        );
      case "tanpa-tautan":
        catat("core_missing_payment_url", { ref });
        return balas(
          { success: false, outcome: "unknown", code: "PAYMENT_LINK_MISSING", message: pesanTanpaTautan(verifikasi.kode), orderCode: verifikasi.kode, ref },
          502
        );
      case "tautan-ditolak":
        catat("core_untrusted_payment_url", { ref });
        return balas(
          { success: false, outcome: "unknown", code: "PAYMENT_LINK_UNTRUSTED", message: pesanTautanDitolak(verifikasi.kode), orderCode: verifikasi.kode, ref },
          502
        );
      default:
        catat("core_malformed_success", { ref, httpStatus: statusCore });
        return balas({ success: false, outcome: "unknown", code: "CORE_MALFORMED_RESPONSE", message: PESAN_BELUM_PASTI, ref }, 502);
    }
  } catch (globalErr: unknown) {
    catat("internal_error", { ref, error: globalErr instanceof Error ? globalErr.name : "unknown" });
    // Bila kunci sudah dipegang, kegagalan bisa terjadi setelah core dihubungi.
    return balas(
      kunciDipegang.length > 0
        ? { success: false, outcome: "unknown", code: "INTERNAL_ERROR", message: PESAN_BELUM_PASTI, ref }
        : {
            success: false,
            outcome: "rejected",
            code: "INTERNAL_ERROR",
            message: "Terjadi kesalahan pada server pendaftaran. Belum ada pesanan yang dikirim; silakan coba beberapa saat lagi.",
            ref,
          },
      kunciDipegang.length > 0 ? 502 : 500
    );
  } finally {
    for (const key of kunciDipegang) kunciDalamProses.delete(key);
  }
}

// Kontrak respons pendaftaran: core (kembarin-v2) → api/daftar → browser.
// Fungsi murni, dipakai server maupun browser, diuji di tests/kontrakPendaftaran.test.ts.
//
// Prinsip: sebuah percobaan pendaftaran hanya punya tiga kemungkinan hasil.
//   - "berhasil"    : core mengonfirmasi pesanan (kode pesanan + tautan bayar / sudah lunas).
//   - "ditolak"     : core PASTI tidak membuat tagihan (validasi, kuota, rate limit, dst).
//   - "belum-pasti" : sisanya — timeout, sambungan putus, 5xx, respons rusak. Pesanan
//                     mungkin sudah dibuat. JANGAN pernah disebut "belum tersimpan" atau
//                     "dibatalkan"; isian dipertahankan dan pengiriman ulang memakai kunci
//                     idempotensi yang sama (sessionId) sehingga core mengembalikan pesanan
//                     yang sama, bukan membuat yang baru.
//
// Kontrak sukses core diverifikasi dari kode kembarin-v2 (read-only):
// RegistrationOrderService.register() dan resolveExistingOrderPayload() sama-sama
// mengembalikan { success: true, status, orderId, orderCode, paymentUrl?, paymentExpiresAt?, ... }.

import { isTrustedPaymentUrl } from "./paymentUrl";

// ─── Pesan ──────────────────────────────────────────────────────────────────

export const PESAN_BELUM_PASTI =
  "Hasil pendaftaran belum dapat dipastikan — pesanan mungkin sudah dibuat, mungkin juga belum. Isian Anda tetap ada di halaman ini. Tekan Bayar lagi tanpa mengubah isian: bila pesanan ternyata sudah ada, sistem memakai pesanan yang sama, bukan membuat yang baru. Bila ragu, periksa email pemesan atau hubungi panitia.";

/** Invoice gateway belum dibuat (core: invoiceCreationState "not_created"). */
export const PESAN_GATEWAY_GAGAL =
  "Halaman pembayaran gagal disiapkan, sehingga belum ada tagihan maupun pembayaran yang dibuat. Silakan coba lagi beberapa saat lagi; bila tetap gagal, hubungi panitia.";

export const pesanTanpaTautan = (kode: string) =>
  `Pesanan ${kode} sudah tercatat, tetapi tautan pembayarannya belum diterima. Jangan membuat pesanan baru: tekan Bayar lagi tanpa mengubah isian untuk mengambil tautan pesanan yang sama, atau hubungi panitia dengan kode ${kode}.`;

export const pesanTautanDitolak = (kode: string) =>
  `Pesanan ${kode} sudah tercatat, tetapi tautan pembayarannya tidak lolos pemeriksaan keamanan sehingga tidak dibuka. Jangan membuat pesanan baru; hubungi panitia dengan kode ${kode}.`;

/** Core: REGISTRATION_ORDER_PROCESSING — pesanan ada, tautan bayar masih dibuat. */
export const pesanSedangDisiapkan = (kode: string, detik?: number) =>
  `Pesanan ${kode} sudah tercatat dan tautan pembayarannya masih disiapkan. Jangan membuat pesanan baru: tunggu ${
    detik ? `sekitar ${detik} detik` : "sebentar"
  }, lalu tekan Bayar lagi tanpa mengubah isian untuk mengambil tautan pesanan yang sama.`;

/** Core: PAYMENT_GATEWAY_RECONCILIATION_REQUIRED tanpa pesan yang bisa diteruskan. */
export const pesanRekonsiliasi = (kode: string) =>
  `Status tagihan pesanan ${kode} belum dapat dipastikan. Jangan membuat pesanan baru; hubungi panitia dengan kode ${kode} agar pembayarannya diperiksa.`;

/** Core: REGISTRATION_IDENTITY_PENDING_ORDER tanpa pesan yang bisa diteruskan. */
export const pesanIdentitasDiPesananLain = (kode?: string) =>
  `Nomor identitas peserta sudah ada di pesanan${kode ? ` ${kode}` : ""} yang belum dibayar atas email pemesan ini. Lanjutkan pembayaran pesanan itu lewat tautan di email pemesan, atau daftar ulang setelah batas bayarnya lewat.`;

/** Core: REGISTRATION_IDEMPOTENCY_MISMATCH. Sesi sudah dibuang browser; tidak perlu muat ulang. */
export const pesanIsiBerbeda = (kode?: string) =>
  kode
    ? `Pesanan ${kode} sudah tercatat dengan isi yang berbeda dari isian sekarang. Isian Anda tetap ada: tekan Bayar lagi untuk mengirimnya sebagai pesanan baru, atau lanjutkan pembayaran pesanan ${kode} lewat tautan di email pemesan.`
    : PESAN_SESI_DIPERBARUI;

export const PESAN_SESI_DIPERBARUI =
  "Sesi pendaftaran perlu diperbarui. Isian Anda tetap ada; tekan Bayar lagi untuk mengirim ulang.";

/**
 * Pesan error dari core hanya diteruskan ke pengguna kalau memang terlihat sebagai pesan
 * untuk manusia (mis. "NIK sudah terdaftar"), bukan potongan error internal.
 */
export function isSafeUserFacingMessage(message: string, maxLength = 200): boolean {
  if (message.length === 0 || message.length > maxLength) return false;
  if (/[\n\r<>{}]/.test(message)) return false;
  return !/(error:|exception|stack|at\s+\w+\s*\(|\/var\/|\/home\/|node_modules|select\s|insert\s|update\s\w+\sset|prisma|sqlstate|econn|undefined is not)/i.test(
    message
  );
}

// ─── Bentuk respons api/daftar (yang diterima browser) ────────────────────────

export interface PesananTerverifikasi {
  kode: string;
  status: "pending" | "paid";
  /** Ada bila status "pending" — sudah lolos whitelist domain gateway di server. */
  paymentUrl?: string;
  paymentExpiresAt?: string;
  ticketCount?: number;
  /** Kunci akses halaman status (core §8). Hanya ada bila core memasang ORDER_STATUS_TOKEN_SECRET. */
  statusToken?: string;
}

export type ResponsDaftar =
  | { success: true; outcome: "created" | "paid"; order: PesananTerverifikasi }
  | {
      success: false;
      outcome: "rejected";
      code: string;
      message: string;
      orderCode?: string;
      paymentExpiresAt?: string;
      /** Browser wajib membuang sessionId lama (kunci idempotensi ditolak core). */
      ulangSesi?: true;
      ref?: string;
    }
  | {
      success: false;
      outcome: "unknown";
      code: string;
      message: string;
      orderCode?: string;
      retryAfterSeconds?: number;
      ref?: string;
    };

const POLA_KODE = /^[A-Z][A-Z0-9_]{2,63}$/;
/** Sama dengan ORDER_CODE_PATTERN core (domains/registration/server/orderStatus.ts). */
export const POLA_KODE_PESANAN = /^[A-Za-z0-9][A-Za-z0-9_-]{2,63}$/;
/** HMAC-SHA256 base64url — sama dengan TOKEN_PATTERN core (orderStatusToken.ts). */
export const POLA_TOKEN_STATUS = /^[A-Za-z0-9_-]{43}$/;

function tanggalIso(value: unknown): string | undefined {
  return typeof value === "string" && !Number.isNaN(Date.parse(value)) ? value : undefined;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

function parseJson(teks: string): unknown {
  try {
    return JSON.parse(teks);
  } catch {
    return undefined;
  }
}

// ─── Server: respons sukses core ─────────────────────────────────────────────

export type VerifikasiSukses =
  | { jenis: "berhasil"; order: PesananTerverifikasi }
  | { jenis: "tanpa-tautan"; kode: string }
  | { jenis: "tautan-ditolak"; kode: string }
  | { jenis: "rusak" };

/**
 * Hanya field yang dibutuhkan browser yang diteruskan (allowlist). `token`,
 * `participantIds`, `orderId`, `paymentGateway`, dan pesan bebas dari core tidak dikirim.
 */
export function verifikasiSuksesCore(data: unknown): VerifikasiSukses {
  if (!isRecord(data) || data.success !== true) return { jenis: "rusak" };
  const kode = typeof data.orderCode === "string" ? data.orderCode.trim() : "";
  if (!POLA_KODE_PESANAN.test(kode)) return { jenis: "rusak" };
  if (data.orderId !== undefined && !(Number.isInteger(data.orderId) && (data.orderId as number) > 0)) {
    return { jenis: "rusak" };
  }
  const ticketCount =
    Number.isInteger(data.ticketCount) && (data.ticketCount as number) > 0 ? (data.ticketCount as number) : undefined;
  // Token yang bentuknya salah diabaikan, bukan menggagalkan pesanan: pesanan tetap sah,
  // hanya halaman status yang jatuh ke tautan kembar.in.
  const statusToken =
    typeof data.statusToken === "string" && POLA_TOKEN_STATUS.test(data.statusToken) ? data.statusToken : undefined;

  if (data.status === "paid") {
    return { jenis: "berhasil", order: { kode, status: "paid", ticketCount, statusToken } };
  }
  if (data.status !== "pending") return { jenis: "rusak" };

  // Situs ini selalu memakai gateway otomatis ("auto"), jadi pesanan pending WAJIB punya
  // tautan bayar. Tanpa tautan, pesanan sudah ada tetapi peserta tidak bisa membayar.
  if (typeof data.paymentUrl !== "string" || !data.paymentUrl.trim()) return { jenis: "tanpa-tautan", kode };
  const paymentUrl = data.paymentUrl.trim();
  if (!isTrustedPaymentUrl(paymentUrl, "https://basis.invalid")) return { jenis: "tautan-ditolak", kode };

  return {
    jenis: "berhasil",
    order: { kode, status: "pending", paymentUrl, paymentExpiresAt: tanggalIso(data.paymentExpiresAt), ticketCount, statusToken },
  };
}

// ─── Server: respons non-2xx core ─────────────────────────────────────────────

export interface KlasifikasiPenolakan {
  outcome: "rejected" | "unknown";
  code: string;
  message: string;
  orderCode?: string;
  paymentExpiresAt?: string;
  retryAfterSeconds?: number;
  /** Kunci idempotensi ditolak core: browser harus memakai sessionId baru. */
  ulangSesi?: true;
  /** Penolakan yang hanya mungkin terjadi karena kesalahan di situs ini — wajib dicatat. */
  bugPartner?: true;
}

/**
 * `status` = status HTTP core (bukan 2xx); `teks` = isi respons mentah (sudah dibatasi).
 * Tabel kode: kembarin-v2 docs/PARTNER_INTEGRATION.md §7. Yang dibaca `code` dan field
 * terstruktur (`orderCode`, `paymentExpiresAt`, `retryAfterSeconds`) — kalimat `message`
 * tidak pernah diurai.
 *
 * 5xx tanpa kode yang dikenal dianggap BELUM PASTI, bukan ditolak: error tak terduga
 * setelah transaksi database bisa terjadi setelah pesanan tersimpan.
 */
export function klasifikasiPenolakanCore(status: number, teks: string): KlasifikasiPenolakan {
  const parsed = parseJson(teks);
  const err = isRecord(parsed) ? parsed : {};
  const code = typeof err.code === "string" && POLA_KODE.test(err.code) ? err.code : "";
  const kandidat =
    typeof err.message === "string" ? err.message : typeof err.error === "string" ? err.error : null;
  const pesanAman = kandidat && isSafeUserFacingMessage(kandidat) ? kandidat : null;
  const orderCode =
    typeof err.orderCode === "string" && POLA_KODE_PESANAN.test(err.orderCode.trim()) ? err.orderCode.trim() : undefined;
  const paymentExpiresAt = tanggalIso(err.paymentExpiresAt);
  const retryAfterSeconds =
    Number.isInteger(err.retryAfterSeconds) && (err.retryAfterSeconds as number) > 0 && (err.retryAfterSeconds as number) <= 3600
      ? (err.retryAfterSeconds as number)
      : undefined;

  switch (code) {
    case "PAYMENT_GATEWAY_CREATION_FAILED":
      // Invoice tidak terbit dan pesanan dibatalkan core. Pesan core diganti dengan
      // penjelasan yang menyebut bahwa belum ada tagihan.
      return { outcome: "rejected", code, message: PESAN_GATEWAY_GAGAL };
    case "PAYMENT_GATEWAY_RECONCILIATION_REQUIRED":
      return {
        outcome: "unknown",
        code,
        orderCode,
        message: pesanAman ?? (orderCode ? pesanRekonsiliasi(orderCode) : PESAN_BELUM_PASTI),
      };
    case "REGISTRATION_ORDER_PROCESSING":
      // 503 + Retry-After: pesanan ADA, tautan bayar masih dibuat. Kirim ulang dengan isi
      // dan sessionId yang sama akan mengembalikan pesanan itu.
      return {
        outcome: "unknown",
        code,
        orderCode,
        retryAfterSeconds,
        message: orderCode ? pesanSedangDisiapkan(orderCode, retryAfterSeconds) : PESAN_BELUM_PASTI,
      };
    case "REGISTRATION_IDENTITY_PENDING_ORDER":
      // Nomor identitas ada di pesanan pending milik email pemesan yang sama. Tautan
      // bayarnya sengaja tidak dikirim core — ada di email pemesan.
      return {
        outcome: "rejected",
        code,
        orderCode,
        paymentExpiresAt,
        message: pesanAman ?? pesanIdentitasDiPesananLain(orderCode),
      };
    case "REGISTRATION_IDEMPOTENCY_MISMATCH":
      // sessionId sama dipakai isi yang menurut core berbeda: rotasi kunci di browser
      // situs ini salah. Ditolak; browser membuang sesi supaya kiriman berikut memakai id baru.
      // Pesan core ("muat ulang halaman lalu isi kembali") SENGAJA tidak diteruskan: di sini
      // memuat ulang justru menghapus isian, padahal cukup tekan Bayar lagi.
      return { outcome: "rejected", code, orderCode, ulangSesi: true, bugPartner: true, message: pesanIsiBerbeda(orderCode) };
    case "REGISTRATION_SESSION_INVALID":
      return { outcome: "rejected", code, ulangSesi: true, bugPartner: true, message: PESAN_SESI_DIPERBARUI };
  }

  if (status >= 500 && code !== "REGISTRATION_PROTECTION_UNAVAILABLE") {
    return { outcome: "unknown", code: code || "CORE_SERVER_ERROR", message: PESAN_BELUM_PASTI };
  }
  if (status === 429 || code === "REGISTRATION_RATE_LIMITED") {
    return {
      outcome: "rejected",
      code: code || "CORE_RATE_LIMITED",
      retryAfterSeconds,
      message: pesanAman ?? "Terlalu banyak percobaan pendaftaran. Silakan tunggu sebentar lalu coba lagi.",
    };
  }
  if (code === "REGISTRATION_PROTECTION_UNAVAILABLE") {
    return {
      outcome: "rejected",
      code,
      message: "Sistem pendaftaran pusat sedang sibuk. Belum ada pesanan yang dibuat; silakan coba beberapa saat lagi.",
    };
  }
  return {
    outcome: "rejected",
    code: code || "CORE_REJECTED",
    message: pesanAman ?? "Data pendaftaran Anda ditolak sistem pendaftaran pusat. Periksa kembali isian Anda.",
  };
}

// ─── Browser: menafsirkan respons api/daftar ──────────────────────────────────

export type HasilPengiriman =
  | { jenis: "bayar"; url: string; kode: string; statusToken?: string }
  | { jenis: "lunas"; kode: string; statusToken?: string }
  | { jenis: "ditolak"; pesan: string; kode?: string; ulangSesi: boolean; ref?: string }
  | { jenis: "belum-pasti"; pesan: string; kode?: string; ref?: string };

/**
 * `origin` = window.location.origin. Respons yang tidak sesuai kontrak SELALU jadi
 * "belum-pasti": permintaan mungkin sudah sampai ke core, jadi tidak boleh dianggap
 * berhasil (lalu isian dihapus) maupun gagal total.
 */
export function tafsirkanResponsDaftar(
  httpStatus: number,
  contentType: string | null,
  teks: string,
  origin: string
): HasilPengiriman {
  const data = contentType && contentType.includes("application/json") ? parseJson(teks) : undefined;
  if (!isRecord(data)) return { jenis: "belum-pasti", pesan: PESAN_BELUM_PASTI };
  const ref = typeof data.ref === "string" && /^[A-Za-z0-9-]{4,64}$/.test(data.ref) ? data.ref : undefined;

  if (data.success === true && httpStatus >= 200 && httpStatus < 300) {
    const order = isRecord(data.order) ? data.order : null;
    const kode = order && typeof order.kode === "string" && POLA_KODE_PESANAN.test(order.kode) ? order.kode : null;
    if (!order || !kode) return { jenis: "belum-pasti", pesan: PESAN_BELUM_PASTI, ref };
    const statusToken =
      typeof order.statusToken === "string" && POLA_TOKEN_STATUS.test(order.statusToken) ? order.statusToken : undefined;
    if (data.outcome === "paid" && order.status === "paid") return { jenis: "lunas", kode, statusToken };
    if (data.outcome === "created" && order.status === "pending") {
      if (typeof order.paymentUrl !== "string") return { jenis: "belum-pasti", pesan: pesanTanpaTautan(kode), kode, ref };
      // Diperiksa ulang di browser (pertahanan berlapis) — server sudah memeriksanya.
      if (!isTrustedPaymentUrl(order.paymentUrl, origin)) {
        return { jenis: "belum-pasti", pesan: pesanTautanDitolak(kode), kode, ref };
      }
      return { jenis: "bayar", url: order.paymentUrl, kode, statusToken };
    }
    return { jenis: "belum-pasti", pesan: PESAN_BELUM_PASTI, ref };
  }

  // Pesan dari api/daftar sendiri boleh lebih panjang (penjelasan "belum pasti" + kode pesanan).
  const pesan = typeof data.message === "string" && isSafeUserFacingMessage(data.message, 600) ? data.message : null;
  const kode =
    typeof data.orderCode === "string" && POLA_KODE_PESANAN.test(data.orderCode) ? data.orderCode : undefined;
  // "rejected" hanya dikirim api/daftar bila core PASTI tidak membuat tagihan BARU. Bisa
  // membawa kode pesanan lain (mis. identitas sudah ada di pesanan pending pemesan ini).
  if (data.success === false && data.outcome === "rejected" && httpStatus >= 400) {
    return {
      jenis: "ditolak",
      pesan: pesan ?? "Pendaftaran ditolak. Periksa kembali isian Anda.",
      kode,
      ulangSesi: data.ulangSesi === true,
      ref,
    };
  }
  return { jenis: "belum-pasti", pesan: pesan ?? PESAN_BELUM_PASTI, kode, ref };
}

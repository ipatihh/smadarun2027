// Status pesanan untuk halaman /daftar/status: core → api/status-pesanan → browser.
// Kontrak core: kembarin-v2 docs/PARTNER_INTEGRATION.md §8 (POST /api/public/orders/status).
// Fungsi murni + akses sessionStorage, diuji di tests/statusPesanan.test.ts.

import { isTrustedPaymentUrl } from "./paymentUrl";
import { POLA_KODE_PESANAN, POLA_TOKEN_STATUS } from "./kontrakPendaftaran";

export type StatusPesanan = "pending" | "paid" | "cancelled" | "expired";

export interface StatusTerverifikasi {
  status: StatusPesanan;
  ticketCount?: number;
  /** Batas bayar (ISO) — hanya pesanan gateway yang masih/pernah bisa dibayar. */
  paymentExpiresAt?: string;
  /** Hanya selama pesanan masih bisa dibayar, dan sudah lolos whitelist domain gateway. */
  paymentUrl?: string;
}

export type JenisGagalStatus = "tidak-valid" | "tidak-ada" | "belum-aktif" | "dibatasi" | "gangguan";

export type ResponsStatus =
  | { success: true; order: StatusTerverifikasi }
  | { success: false; hasil: JenisGagalStatus; message: string };

/** Halaman status pesanan di kembar.in; bisa dibuka cukup dengan kode, tanpa token. */
export const urlPaymentReturn = (kode: string) =>
  `https://kembar.in/events/smadarun/payment-return?order=${encodeURIComponent(kode)}`;

/**
 * Tujuan kembali dari gateway setelah bayar (`partnerReturnUrl`, kontrak core §4b). Core
 * menambahkan `?order=<kode>&result=success|failed` dan hanya memakainya karena host-nya
 * sama dengan tautan "Tiket dijual di" event smadarun di kembar.in — selain itu pembeli
 * kembali ke halaman kembar.in di atas. Harus `www`: smadarun.id dialihkan ke www, dan
 * token status di sessionStorage hanya terbaca di origin tempat pendaftar mengisi form.
 */
export const URL_KEMBALI_PEMBAYARAN = "https://www.smadarun.id/daftar/status";

/**
 * Kode pesanan dari `?order=` tujuan kembali gateway. `result` sengaja tidak dibaca: siapa pun
 * bisa mengetik `?result=success`, dan gateway juga memulangkan pembeli yang baru memilih
 * metode bayar tanpa membayar. Status hanya dari core.
 */
export function kodeDariKueri(search: string): string | null {
  const kode = new URLSearchParams(search).get("order")?.trim() ?? "";
  return POLA_KODE_PESANAN.test(kode) ? kode : null;
}

export interface PesananTampil {
  pesanan: PesananTersimpan;
  /** Tersimpan di tab ini — hanya ini yang bisa "dilupakan". */
  dariPenyimpanan: boolean;
  /** Halaman dibuka dari tujuan kembali gateway untuk pesanan ini. */
  dariGateway: boolean;
}

/**
 * Pesanan yang ditampilkan halaman status. Kembali dari gateway dengan kode yang sama dengan
 * pesanan tersimpan = pesanan itu, lengkap dengan tokennya. Kode lain (tab/perangkat lain,
 * penyimpanan diblokir) tampil TANPA token — tidak bisa diperiksa dari sini, hanya ditautkan
 * ke kembar.in.
 */
export function pilihPesananTampil(tersimpan: PesananTersimpan | null, kodeKembali: string | null): PesananTampil | null {
  if (kodeKembali && tersimpan?.kode !== kodeKembali) {
    return { pesanan: { kode: kodeKembali }, dariPenyimpanan: false, dariGateway: true };
  }
  if (!tersimpan) return null;
  return { pesanan: tersimpan, dariPenyimpanan: true, dariGateway: kodeKembali === tersimpan.kode };
}

/**
 * Baru kembali dari gateway, konfirmasi pembayaran bisa tiba beberapa detik setelah pembeli.
 * Status `pending` diperiksa ulang otomatis sebentar: 12 × 5 detik ≈ 1 menit, di bawah batas
 * core 20/menit per pesanan dan batas api/status-pesanan 30/menit per IP. Setelah itu
 * pengguna menekan "Periksa lagi".
 */
export const JEDA_PERIKSA_ULANG_MS = 5_000;
export const BATAS_PERIKSA_ULANG = 12;

export function perluPeriksaUlang(hasil: HasilStatus | null, dariGateway: boolean, sudahDiulang: number): boolean {
  return dariGateway && sudahDiulang < BATAS_PERIKSA_ULANG && hasil?.jenis === "ada" && hasil.order.status === "pending";
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

const STATUS_SAH: readonly StatusPesanan[] = ["pending", "paid", "cancelled", "expired"];

/** Allowlist field status pesanan; null = bentuknya tidak sesuai kontrak. */
function bersihkanStatus(order: unknown, base: string): StatusTerverifikasi | null {
  if (!isRecord(order) || !STATUS_SAH.includes(order.status as StatusPesanan)) return null;
  const status = order.status as StatusPesanan;
  const hasil: StatusTerverifikasi = { status };
  if (Number.isInteger(order.ticketCount) && (order.ticketCount as number) >= 0) hasil.ticketCount = order.ticketCount as number;
  if (typeof order.paymentExpiresAt === "string" && !Number.isNaN(Date.parse(order.paymentExpiresAt))) {
    hasil.paymentExpiresAt = order.paymentExpiresAt;
  }
  // Tautan bayar hanya untuk pesanan yang masih bisa dibayar, dan hanya domain gateway resmi.
  if (status === "pending" && typeof order.paymentUrl === "string" && isTrustedPaymentUrl(order.paymentUrl, base)) {
    hasil.paymentUrl = order.paymentUrl;
  }
  return hasil;
}

const PESAN: Record<JenisGagalStatus, string> = {
  "tidak-valid": "Data pesanan di perangkat ini tidak valid.",
  "tidak-ada": "Pesanan tidak ditemukan.",
  "belum-aktif": "Pemeriksaan status otomatis belum tersedia.",
  dibatasi: "Terlalu banyak pemeriksaan status. Coba lagi sebentar lagi.",
  gangguan: "Status pesanan belum dapat diperiksa saat ini.",
};

/** Server: menerjemahkan respons core menjadi respons api/status-pesanan (tanpa data lain). */
export function terjemahkanStatusCore(httpStatus: number, teks: string): { status: number; body: ResponsStatus } {
  const data = parseJson(teks);
  const code = isRecord(data) && typeof data.code === "string" ? data.code : "";
  if (httpStatus >= 200 && httpStatus < 300) {
    const order = isRecord(data) && data.success === true ? bersihkanStatus(data.order, "https://basis.invalid") : null;
    return order
      ? { status: 200, body: { success: true, order } }
      : { status: 502, body: { success: false, hasil: "gangguan", message: PESAN.gangguan } };
  }
  // Pesanan tidak ada dan token salah dijawab core sama persis (anti-enumerasi); di sini pun sama.
  if (httpStatus === 404) return { status: 404, body: { success: false, hasil: "tidak-ada", message: PESAN["tidak-ada"] } };
  if (httpStatus === 503 && code === "ORDER_STATUS_UNAVAILABLE") {
    return { status: 503, body: { success: false, hasil: "belum-aktif", message: PESAN["belum-aktif"] } };
  }
  if (httpStatus === 429) return { status: 429, body: { success: false, hasil: "dibatasi", message: PESAN.dibatasi } };
  return { status: 502, body: { success: false, hasil: "gangguan", message: PESAN.gangguan } };
}

export const responsGagalStatus = (hasil: JenisGagalStatus, status: number) => ({
  status,
  body: { success: false, hasil, message: PESAN[hasil] } as ResponsStatus,
});

export type HasilStatus = { jenis: "ada"; order: StatusTerverifikasi } | { jenis: JenisGagalStatus };

/** Browser: respons yang tidak sesuai kontrak = gangguan (bukan "tidak ada", bukan sukses). */
export function tafsirkanResponsStatus(
  httpStatus: number,
  contentType: string | null,
  teks: string,
  origin: string
): HasilStatus {
  const data = contentType && contentType.includes("application/json") ? parseJson(teks) : undefined;
  if (!isRecord(data)) return { jenis: "gangguan" };
  if (data.success === true && httpStatus === 200) {
    const order = bersihkanStatus(data.order, origin);
    return order ? { jenis: "ada", order } : { jenis: "gangguan" };
  }
  const hasil = data.hasil;
  if (hasil === "tidak-ada" || hasil === "belum-aktif" || hasil === "dibatasi" || hasil === "tidak-valid") {
    return { jenis: hasil };
  }
  return { jenis: "gangguan" };
}

// ─── Penyimpanan di browser ──────────────────────────────────────────────────
// sessionStorage, BUKAN localStorage maupun URL: token status adalah kunci akses pesanan.
// Ia hanya hidup selama tab itu terbuka dan tidak ikut terbawa ke tab, perangkat, atau
// tautan lain. Tidak ada data pribadi yang disimpan — hanya kode pesanan dan token.

export const KUNCI_SESI_PESANAN = "smadarun:pesanan-terakhir";

export interface PesananTersimpan {
  kode: string;
  statusToken?: string;
}

function penyimpanan(): Storage | null {
  try {
    return typeof window === "undefined" ? null : window.sessionStorage;
  } catch {
    return null; // diblokir (mode privat, kebijakan peramban)
  }
}

export function bacaPesananTerakhir(store: Storage | null = penyimpanan()): PesananTersimpan | null {
  try {
    const data = parseJson(store?.getItem(KUNCI_SESI_PESANAN) ?? "");
    if (!isRecord(data) || typeof data.kode !== "string" || !POLA_KODE_PESANAN.test(data.kode)) return null;
    const statusToken =
      typeof data.statusToken === "string" && POLA_TOKEN_STATUS.test(data.statusToken) ? data.statusToken : undefined;
    return { kode: data.kode, statusToken };
  } catch {
    return null;
  }
}

/**
 * Simpan pesanan terakhir tab ini. Kode tanpa token (mis. hasil belum pasti) tidak
 * menghapus token yang sudah tersimpan untuk kode yang SAMA.
 */
export function simpanPesananTerakhir(baru: PesananTersimpan, store: Storage | null = penyimpanan()): void {
  if (!store || !POLA_KODE_PESANAN.test(baru.kode)) return;
  const lama = bacaPesananTerakhir(store);
  const statusToken =
    baru.statusToken && POLA_TOKEN_STATUS.test(baru.statusToken)
      ? baru.statusToken
      : lama?.kode === baru.kode
        ? lama.statusToken
        : undefined;
  try {
    store.setItem(KUNCI_SESI_PESANAN, JSON.stringify(statusToken ? { kode: baru.kode, statusToken } : { kode: baru.kode }));
  } catch {
    // Penyimpanan penuh/diblokir: halaman status jatuh ke panduan umum.
  }
}

export function lupakanPesananTerakhir(store: Storage | null = penyimpanan()): void {
  try {
    store?.removeItem(KUNCI_SESI_PESANAN);
  } catch {
    // abaikan
  }
}

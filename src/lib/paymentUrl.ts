// Hanya domain resmi gateway pembayaran yang boleh dituju saat redirect otomatis ke
// halaman pembayaran. Mencegah open-redirect/phishing seandainya respons core suatu
// saat tidak sesuai ekspektasi.
//
// Dicocokkan sebagai domain induk — subdomain apa pun ikut diterima — sehingga mode
// sandbox maupun produksi di core tidak perlu mengubah daftar ini:
//   Midtrans  produksi app.midtrans.com   · sandbox app.sandbox.midtrans.com
//   DOKU      produksi *.doku.com          · sandbox sandbox.doku.com
// Gateway baru yang dipilih core ("auto") wajib ditambahkan domain induknya di sini.
export const ALLOWED_PAYMENT_DOMAINS = ["doku.com", "midtrans.com"] as const;

/** `base` dipakai untuk URL relatif — yang hasilnya selalu ditolak (bukan domain gateway). */
export function isTrustedPaymentUrl(url: string, base: string): boolean {
  try {
    const parsed = new URL(url, base);
    if (parsed.protocol !== "https:") return false;
    return ALLOWED_PAYMENT_DOMAINS.some(
      (domain) => parsed.hostname === domain || parsed.hostname.endsWith(`.${domain}`)
    );
  } catch {
    return false;
  }
}

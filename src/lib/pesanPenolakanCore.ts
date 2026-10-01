// Menerjemahkan penolakan dari core (kembarin-v2) menjadi pesan untuk peserta.
// Fungsi murni — dipakai api/daftar dan bisa diuji tanpa memanggil core.

/**
 * Pesan error dari core hanya diteruskan ke pengguna kalau memang terlihat sebagai pesan
 * untuk manusia (mis. "NIK sudah terdaftar"). Sebelumnya potongan respons apa pun
 * diteruskan mentah, termasuk yang berpotensi membocorkan detail internal.
 */
export function isSafeUserFacingMessage(message: string): boolean {
  if (message.length === 0 || message.length > 200) return false;
  if (/[\n\r<>{}]/.test(message)) return false;
  return !/(error:|exception|stack|at\s+\w+\s*\(|\/var\/|\/home\/|node_modules|select\s|insert\s|update\s\w+\sset|prisma|sqlstate|econn|undefined is not)/i.test(
    message
  );
}

export const PESAN_GATEWAY_GAGAL =
  "Halaman pembayaran gagal disiapkan, jadi pendaftaran Anda belum tersimpan dan belum ada pembayaran. Silakan coba lagi beberapa saat lagi; bila tetap gagal, hubungi panitia.";

/** `status` = status HTTP core (bukan 2xx); `errText` = isi respons mentah. */
export function pesanPenolakanCore(status: number, errText: string): string {
  let pesan =
    status >= 500
      ? "Sistem pendaftaran pusat sedang bermasalah. Silakan coba beberapa saat lagi."
      : "Data pendaftaran Anda ditolak sistem pendaftaran pusat. Periksa kembali isian Anda.";

  let parsed: unknown;
  try {
    parsed = JSON.parse(errText);
  } catch {
    // Respons bukan JSON — pakai pesan generik di atas, jangan pantulkan isinya.
    return pesan;
  }
  if (!parsed || typeof parsed !== "object") return pesan;
  const err = parsed as Record<string, unknown>;

  if (err.code === "PAYMENT_GATEWAY_CREATION_FAILED") {
    // Halaman pembayaran gagal dibuat (kunci gateway salah/tidak cocok mode
    // sandbox-produksi, gateway down, dst) dan core sudah membatalkan ordernya.
    // Pesan core di sini ditujukan ke admin — menyebut nama gateway dan menu dasbor —
    // jadi TIDAK diteruskan. Sebelumnya pesan itu tersaring (memuat "->") dan peserta
    // malah disuruh "periksa kembali isian", padahal isiannya benar.
    // PAYMENT_GATEWAY_RECONCILIATION_REQUIRED sengaja tetap lewat jalur biasa:
    // pesannya untuk peserta dan memuat kode pesanan yang harus dilaporkan.
    return PESAN_GATEWAY_GAGAL;
  }

  const kandidat =
    typeof err.message === "string" ? err.message : typeof err.error === "string" ? err.error : null;
  if (kandidat && isSafeUserFacingMessage(kandidat)) pesan = kandidat;
  return pesan;
}

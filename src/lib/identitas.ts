// Nomor identitas peserta: NIK (KTP/Kartu Keluarga) ATAU nomor kartu pelajar.
// Dipakai bersama oleh DaftarForm (UX) dan api/daftar (penentu akhir), supaya
// aturan di browser dan di server tidak bisa melenceng satu sama lain.
//
// Core (kembarin-v2) menyimpan keduanya di kolom `nik` yang sama dan hanya
// mensyaratkan 4–32 karakter alfanumerik setelah pemisah dibuang
// (`normalizeCanonicalIdentity`). Aturan di sini SENGAJA lebih ketat:
// - NIK tetap tepat 16 digit, supaya salah ketik tetap tertangkap.
// - Nomor pelajar maksimal 16 karakter. Kolom `nik` pasti muat 16 karakter
//   (panjang NIK); nomor yang lebih panjang berisiko ditolak database setelah
//   peserta mengisi seluruh formulir.

export type JenisIdentitas = "nik" | "kartu_pelajar";

/** Label tampilan — juga nilai `jenis_identitas` yang dibaca panitia di dasbor core. */
export const LABEL_JENIS_IDENTITAS: Record<JenisIdentitas, string> = {
  nik: "NIK",
  kartu_pelajar: "Kartu Pelajar",
};

export const NOMOR_IDENTITAS_MAX = 16;
const NOMOR_PELAJAR_MIN = 4;

export function isJenisIdentitas(value: unknown): value is JenisIdentitas {
  return value === "nik" || value === "kartu_pelajar";
}

/** Rapikan isian: buang spasi tepi dan satukan spasi ganda. */
export function rapikanNomorIdentitas(nomor: string): string {
  return nomor.trim().replace(/\s+/g, " ");
}

/**
 * Bentuk pembanding untuk deteksi duplikat — cermin `normalizeCanonicalIdentity`
 * di core: pemisah dibuang dan huruf diseragamkan, jadi "1234.567" dan "1234567"
 * dianggap orang yang sama, persis seperti core menilainya.
 */
export function kunciIdentitas(nomor: string): string {
  return nomor.normalize("NFKD").trim().toLowerCase().replace(/[\s.\-_/]/g, "");
}

/** Pesan kesalahan untuk ditampilkan, atau null kalau valid. */
export function validasiIdentitas(jenis: JenisIdentitas, nomorMentah: string): string | null {
  const nomor = rapikanNomorIdentitas(nomorMentah);

  if (jenis === "nik") {
    if (!nomor) return "NIK wajib diisi.";
    if (!/^\d{16}$/.test(nomor)) return `NIK harus 16 digit angka (sekarang ${nomor.length} karakter).`;
    return null;
  }

  if (!nomor) return "Nomor kartu pelajar wajib diisi.";
  if (nomor.length > NOMOR_IDENTITAS_MAX) {
    return `Nomor kartu pelajar maksimal ${NOMOR_IDENTITAS_MAX} karakter.`;
  }
  if (!/^[a-zA-Z0-9][a-zA-Z0-9 ./-]*$/.test(nomor)) {
    return "Hanya angka, huruf, titik, strip, dan garis miring yang diperbolehkan.";
  }
  if (kunciIdentitas(nomor).length < NOMOR_PELAJAR_MIN) {
    return `Nomor kartu pelajar minimal ${NOMOR_PELAJAR_MIN} angka/huruf.`;
  }
  return null;
}

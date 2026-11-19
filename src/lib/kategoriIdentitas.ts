// Kategori lomba mengikuti jenis nomor identitas (permintaan pemilik 19 Nov 2026): peserta yang
// memilih Kartu Pelajar masuk kategori pelajar (podium U-18), yang memilih NIK masuk kategori umum.
// Dipakai bersama oleh DaftarForm (UX) dan api/daftar (penentu akhir), seperti `identitas.ts`.
//
// Kategori pelajar dikenali dari NAMA tiket di core yang memuat kata "pelajar" (mis. "5KM Pelajar");
// nama dan harganya tetap diatur panitia di kembarin-v2. Aturan hanya berlaku bila core punya
// kategori pelajar DAN kategori lain — kalau salah satunya tidak ada, semua kategori terbuka seperti
// biasa, supaya pendaftaran tidak pernah buntu karena panitia mengganti nama tiket.

import { LABEL_JENIS_IDENTITAS, type JenisIdentitas } from "./identitas";

export function isKategoriPelajar(categoryKey: string): boolean {
  return /\bpelajar\b/i.test(categoryKey);
}

/** Kategori yang boleh dipilih untuk jenis identitas ini, urutan mengikuti core. */
export function kategoriUntukIdentitas(categoryKeys: string[], jenis: JenisIdentitas): string[] {
  const pelajar = categoryKeys.filter(isKategoriPelajar);
  const umum = categoryKeys.filter((key) => !isKategoriPelajar(key));
  if (pelajar.length === 0 || umum.length === 0) return categoryKeys;
  return jenis === "kartu_pelajar" ? pelajar : umum;
}

/** Apakah kategori ditentukan oleh jenis identitas (core punya kategori pelajar dan lainnya). */
export function kategoriMengikutiIdentitas(categoryKeys: string[]): boolean {
  return kategoriUntukIdentitas(categoryKeys, "kartu_pelajar").length !== categoryKeys.length;
}

/**
 * Kategori sesudah jenis identitas dipilih: pilihan sekarang dipertahankan bila masih boleh,
 * selain itu satu-satunya kategori yang boleh, atau kosong (peserta memilih sendiri).
 */
export function kategoriOtomatis(categoryKeys: string[], jenis: JenisIdentitas, sekarang: string): string {
  const boleh = kategoriUntukIdentitas(categoryKeys, jenis);
  if (sekarang && boleh.includes(sekarang)) return sekarang;
  return boleh.length === 1 ? boleh[0] : "";
}

/** Pesan kesalahan bila kategori tidak cocok dengan jenis identitas, atau null. */
export function validasiKategoriIdentitas(
  categoryKeys: string[],
  jenis: JenisIdentitas,
  kategori: string,
): string | null {
  if (!kategori || kategoriUntukIdentitas(categoryKeys, jenis).includes(kategori)) return null;
  return `Peserta dengan ${LABEL_JENIS_IDENTITAS[jenis]} mendaftar di kategori ${
    jenis === "kartu_pelajar" ? "pelajar" : "umum"
  }.`;
}

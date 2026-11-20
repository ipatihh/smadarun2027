// Kategori pelajar vs umum. Peserta memilih kategori SENDIRI; jenis nomor identitas (NIK / kartu pelajar)
// TIDAK menentukannya (keputusan pemilik 20 Nov 2026: pelajar sering memakai NIK, dan aturan lama yang
// mengunci kategori ke jenis identitas membuat mereka tersangkut di "Umum"). Keabsahan peserta kategori
// pelajar (podium U-18 Kab. Nganjuk) diperiksa panitia saat pengambilan racepack.
//
// Kategori pelajar dikenali dari NAMA tiket di core yang memuat kata "pelajar" (mis. "5KM Pelajar");
// nama dan harganya tetap diatur panitia di kembarin-v2. Dipakai untuk pengingat di formulir dan untuk
// memisahkan kelompok di kartu tiket beranda.

export function isKategoriPelajar(categoryKey: string): boolean {
  return /\bpelajar\b/i.test(categoryKey);
}

/** Core punya kategori pelajar DAN kategori lain (mis. "5KM Pelajar" + "5KM Umum"). */
export function adaKategoriPelajarDanUmum(categoryKeys: string[]): boolean {
  const pelajar = categoryKeys.filter(isKategoriPelajar).length;
  return pelajar > 0 && pelajar < categoryKeys.length;
}

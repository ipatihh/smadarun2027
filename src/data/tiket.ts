// Metadata MARKETING SAJA untuk tampilan tiket (nama & fasilitas).
// Harga, ketersediaan, dan status buka/tutup pendaftaran TIDAK lagi di sini —
// semua itu diambil live dari kembarin-v2 lewat src/lib/kembarinEvents.ts, supaya
// Super Admin di dasbor kembarin-v2 bisa atur semuanya dari satu tempat.
//
// Fasilitas yang berlaku untuk semua kategori ditampilkan SEKALI di bawah kartu,
// termasuk saat core baru mengirim satu kategori atau menambah kategori baru.
// Perbarui daftar ini bila paket umum yang dijanjikan panitia berubah.
export const fasilitasSemuaKategori = [
  'Jersey Eksklusif SMADARUN 2027',
  'Medali Finisher',
  'Nomor BIB',
  'String Bag',
  'Photo Tagging',
];

// Kelompok peserta di kartu tiket beranda (revisi panitia Nov 2026). Saat Coming Soon menggantikan teks
// "Menyusul" di tempat harga; saat pendaftaran buka (event_config.coming_soon di core mati) tetap tampil di
// atas harga. Hanya teks tampilan: harga dan status buka/tutup tetap live dari kembarin-v2.
// `podium` menentukan warna lencana: true = lencana magenta tema, false = netral. Teks mengikuti dokumen
// revisi panitia; "(Podium)" / "(Non-Podium)" ditampilkan sebagai lencana, bukan tanda kurung.
export const kelompokPeserta: { nama: string; lencana: string; podium: boolean }[] = [
  { nama: 'Kelompok U-18 Putra/Putri Pelajar Kab. Nganjuk', lencana: 'Podium', podium: true },
  { nama: 'Kelompok Umum', lencana: 'Non-Podium', podium: false },
];

// Catatan kecil di bawah kelompok pada kartu tiket beranda. Di ringkasan /daftar dicabut atas permintaan
// pemilik (19 Nov 2026: "menganggu"); jangan dipasang lagi di sana.
export const catatanPodium =
  'Podium hanya untuk pelajar berdomisili Kab. Nganjuk. Event ini terbuka untuk umum, siapa pun boleh mendaftar.';

// categoryKey HARUS persis sama (case-insensitive) dengan category_name dari
// kembarin-v2 untuk nama tampilan dan fasilitas KHUSUS kategori. Kategori baru
// tanpa metadata tetap muncul dengan nama dari core dan fasilitas umum di atas.
// Jangan ulangi fasilitas umum atau nama kategori di `features`.
export interface ITiketMarketing {
  categoryKey: string;
  name: string;
  features: string[];
  url: string;
  /** Label kecil di sudut kartu, mis. "Early Bird" atau "Paling diminati". Opsional. */
  badge?: string;
  /** Tandai satu kategori sebagai kartu yang ditonjolkan. Opsional. */
  highlight?: boolean;
}

export const tiketMarketing: ITiketMarketing[] = [
  {
    categoryKey: '5 KM  Reguler',
    name: '5 KM Reguler',
    features: [],
    url: '/daftar',
  },
];

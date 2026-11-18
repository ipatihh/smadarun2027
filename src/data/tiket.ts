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

// Kelompok peserta yang tampil di kartu tiket SELAMA pendaftaran masih "Coming Soon" (menggantikan
// teks "Menyusul" di tempat harga; revisi panitia Nov 2026). Hanya teks tampilan: harga dan
// status buka/tutup tetap live dari kembarin-v2. Begitu pendaftaran dibuka, kartu kembali
// menampilkan harga dari core.
export const kelompokPeserta = [
  'Kelompok U-18 Putra/Putri Pelajar Kab. Nganjuk (Podium)',
  'Kelompok Umum (Non-Podium)',
];

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

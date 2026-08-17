// Metadata MARKETING SAJA per kategori tiket (nama tampilan & daftar fasilitas).
// Harga, ketersediaan, dan status buka/tutup pendaftaran TIDAK lagi di sini —
// semua itu diambil live dari kembarin-v2 lewat src/lib/kembarinEvents.ts, supaya
// Super Admin di dasbor kembarin-v2 bisa atur semuanya dari satu tempat.
//
// categoryKey HARUS persis sama (case-insensitive) dengan category_name yang
// dikonfigurasi admin kembarin-v2 supaya kategori ini dapat teks fasilitas yang
// pas. Kategori yang tidak terdaftar di sini tetap otomatis muncul (pakai
// categoryKey apa adanya sebagai nama, tanpa daftar fasilitas) — jadi kategori
// baru yang admin tambahkan di kembarin-v2 tidak akan pernah hilang dari
// tampilan, walau belum sempat ditulis teks marketing-nya di sini.
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
    categoryKey: '5K Pelajar',
    name: '5K - Pelajar',
    badge: 'Khusus pelajar',
    features: [
      'Slot Lari Kategori 5K Pelajar',
      'Jersey Eksklusif SMADARUN 2027',
      'Medali Finisher (Bagi yang mencapai finish)',
      'Nomor Dada / BIB Berwarna',
      'Refreshment / Hidrasi Lomba',
      'Asuransi & Proteksi Medis',
    ],
    url: '/daftar',
  },
  {
    categoryKey: '5K Umum',
    name: '5K - Umum',
    features: [
      'Slot Lari Kategori 5K Umum',
      'Jersey Eksklusif SMADARUN 2027',
      'Medali Finisher (Bagi yang mencapai finish)',
      'Nomor Dada / BIB Berwarna',
      'Refreshment / Hidrasi Lomba',
      'Asuransi & Proteksi Medis',
    ],
    url: '/daftar',
  },
];

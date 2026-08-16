// Hapus baris import { ITiket } yang bikin eror merah, ganti langsung dengan ini:
export interface ICustomPricing {
    // categoryKey HARUS persis sama dengan nama kategori tiket yang dikonfigurasi
    // di admin panel kembarin-v2 (core system) — dipakai sebagai satu-satunya sumber
    // kebenaran untuk kartu tiket di homepage, dropdown form /daftar, DAN validasi
    // harga di server (src/app/api/daftar/route.ts). Jangan hardcode nama kategori
    // terpisah di tempat lain.
    categoryKey: string;
    name: string;
    price: number;
    features: string[];
    url: string;
    isAvailable?: boolean;
}

export const tiers: ICustomPricing[] = [
    {
        categoryKey: '5K Pelajar',
        name: '5K - Pelajar',
        price: 150000,
        features: [
            'Slot Lari Kategori 5K Pelajar',
            'Jersey Eksklusif SMADARUN 2027',
            'Medali Finisher (Bagi yang mencapai finish)',
            'Nomor Dada / BIB Berwarna',
            'Refreshment / Hidrasi Lomba',
            'Asuransi & Proteksi Medis',
        ],
        url: '/daftar',
        isAvailable: false,
    },
    {
        categoryKey: '5K Umum',
        name: '5K - Umum',
        price: 170000,
        features: [
            'Slot Lari Kategori 5K Umum',
            'Jersey Eksklusif SMADARUN 2027',
            'Medali Finisher (Bagi yang mencapai finish)',
            'Nomor Dada / BIB Berwarna',
            'Refreshment / Hidrasi Lomba',
            'Asuransi & Proteksi Medis',
        ],
        url: '/daftar',
        isAvailable: false,
    },
];
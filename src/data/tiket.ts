// Hapus baris import { ITiket } yang bikin eror merah, ganti langsung dengan ini:
export interface ICustomPricing {
    name: string;
    price: number;
    features: string[];
    url: string;
    isAvailable?: boolean;
}

export const tiers: ICustomPricing[] = [
    {
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
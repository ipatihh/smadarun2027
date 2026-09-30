import { IGalleryPhoto } from "@/types";

// ============================================================================
// GALERI "MOMEN TAHUN LALU" — tempat foto dokumentasi SMADARUN sebelumnya.
// ============================================================================
//
// SAMPLE: semua foto di bawah masih contoh. Ganti `src` dengan foto dokumentasi asli
// (taruh filenya di public/images/) dan tulis `alt` yang menggambarkan isi foto.
//
// Tata letak menyesuaikan jumlah foto:
//   - Foto PERTAMA tampil paling besar — pilih foto yang paling "bercerita".
//   - 3 foto → 1 besar + 2 kecil. 5 foto → 1 besar + 4 kecil. Dua jumlah ini paling rapi.
//   - Kosongkan array untuk menyembunyikan seksi ini sepenuhnya.
//
// ============================================================================

export const galleryIntro = {
    title: "Momen SMADARUN Sebelumnya",
    description: "Sekilas suasana dari lintasan tahun lalu.",
};

export const galleryPhotos: IGalleryPhoto[] = [
    {
        src: "/images/pocari-1.jpg",
        alt: "Pelari tersenyum saat melintas di rute malam",
    },
    {
        src: "/images/pocari-1.jpg",
        alt: "Foto bersama peserta dan panitia",
    },
    {
        src: "/images/pocari-1.jpg",
        alt: "Peserta berkumpul sebelum lomba dimulai",
    },
];

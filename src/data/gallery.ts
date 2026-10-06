import { IGalleryPhoto } from "@/types";

// ============================================================================
// GALERI "MOMEN TAHUN LALU" — foto dokumentasi asli SMADARUN 2026.
// ============================================================================
//
// Ukuran adalah dimensi file di public/images (hasil scripts/optimasi-foto.mjs, lebar 2400); digunakan untuk menjaga proporsi gambar di
// galeri dan lightbox. Foto panggung membuka galeri; foto garis start
// menutupnya selebar area konten.
//
// ============================================================================

export const galleryIntro = {
    title: "Momen SMADARUN Sebelumnya",
    description: "Sekilas suasana dari lintasan tahun lalu.",
};

export const galleryPhotos: IGalleryPhoto[] = [
    {
        src: "/images/galeri-podium.jpg",
        caption: "Podium para pemenang",
        alt: "Para pemenang SMADARUN berfoto bersama di panggung",
        width: 2400,
        height: 956,
    },
    {
        src: "/images/galeri-finis.jpg",
        caption: "Menuju garis finis",
        alt: "Pelari mendekati garis finis di lintasan kota",
        width: 2400,
        height: 1592,
    },
    {
        src: "/images/galeri-juara.jpg",
        caption: "Juara putri",
        alt: "Juara putri SMADARUN menerima penghargaan",
        width: 2400,
        height: 1787,
    },
    {
        src: "/images/galeri-peserta.jpg",
        caption: "Sebelum lomba",
        alt: "Peserta dan pendamping berfoto bersama sebelum lomba",
        width: 2400,
        height: 1660,
    },
    {
        src: "/images/galeri-start.jpg",
        caption: "Di balik pita start",
        alt: "Peserta bersiap di belakang pita garis start",
        width: 2400,
        height: 1253,
    },
];

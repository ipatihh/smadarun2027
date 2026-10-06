import { IGalleryPhoto } from "@/types";

// ============================================================================
// GALERI "MOMEN TAHUN LALU" — foto dokumentasi asli SMADARUN 2026.
// ============================================================================
//
// Ukuran adalah dimensi file asli; digunakan untuk menjaga proporsi gambar di
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
        src: "/images/hero4.JPG",
        alt: "Para pemenang SMADARUN berfoto bersama di panggung",
        width: 5439,
        height: 2166,
    },
    {
        src: "/images/hero5.JPG",
        alt: "Pelari mendekati garis finis di lintasan kota",
        width: 3021,
        height: 2004,
    },
    {
        src: "/images/hero3.JPG",
        alt: "Juara putri SMADARUN menerima penghargaan",
        width: 2934,
        height: 2185,
    },
    {
        src: "/images/hero7.JPG",
        alt: "Peserta dan pendamping berfoto bersama sebelum lomba",
        width: 3180,
        height: 2199,
    },
    {
        src: "/images/hero6.JPG",
        alt: "Peserta bersiap di belakang pita garis start",
        width: 4215,
        height: 2201,
    },
];

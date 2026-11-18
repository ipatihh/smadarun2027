import { IFlyer } from "@/types";

// ============================================================================
// MOCKUP JERSEY, MEDALI, DAN STRING BAG — tempat memasang gambar dari panitia.
// ============================================================================
//
// CARA MEMASANG (manual, tanpa mengubah komponen):
//   1. Taruh file gambar di folder  public/images/flyer/
//      (contoh: public/images/flyer/rute.jpg).
//   2. Pada item yang sesuai di bawah, isi tiga baris ini:
//        src: "/images/flyer/rute.jpg",
//        width: 1080,    // lebar asli file, dalam piksel
//        height: 1350,   // tinggi asli file, dalam piksel
//      Cara cek ukuran di Mac:  sips -g pixelWidth -g pixelHeight public/images/flyer/rute.jpg
//   3. Simpan. Selesai — klik gambar otomatis membuka tampilan besar + zoom.
//
// UKURAN YANG DISARANKAN: PORTRAIT 4:5 (1080 x 1350 px), JPG/WebP di bawah ~500 KB.
//   Boleh rasio lain (mis. peta rute landscape); tata letak mengikuti rasio asli, tanpa crop.
//
// SELAMA `src` KOSONG, item tampil sebagai kotak "Mockup segera hadir" (ukuran 4:5).
//   - Ingin menyembunyikan satu flyer? Hapus item-nya dari daftar.
//   - Ingin menyembunyikan seluruh seksi? Kosongkan array `flyerItems` menjadi [].
//   - Jumlah item bebas (1, 2, 3, atau lebih); kolom menyesuaikan.
//
// SAMPLE: sebelum go-live, semua kotak kosong wajib diisi gambar asli atau dihapus.
//
// ============================================================================

// Revisi panitia (Nov 2026): judul seksi diganti, kalimat pengantar dihapus, slot "Rute Lintasan"
// dicabut, dan ditambah slot String Bag. Rute tidak dipasang di sini lagi.
export const flyerIntro = {
    title: "Jersey, Medali & String Bag",
};

export const flyerItems: IFlyer[] = [
    {
        title: "Jersey",
        alt: "Desain jersey SMADARUN 2027",
        src: "/images/flyer/jersey.webp",
        width: 1536,
        height: 1024,
    },
    {
        title: "Medali Finisher",
        alt: "Desain medali finisher SMADARUN 2027",
        src: "/images/flyer/medali.webp",
        width: 905,
        height: 1280,
    },
    {
        title: "String Bag",
        alt: "Mockup string bag SMADARUN 2027",
        src: "/images/flyer/string-bag.webp",
        width: 1414,
        height: 2000,
    },
];

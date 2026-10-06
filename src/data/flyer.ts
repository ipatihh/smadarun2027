import { IFlyer } from "@/types";

// ============================================================================
// FLYER RUTE, JERSEY, DAN MEDALI — tempat memasang gambar dari panitia.
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
// SELAMA `src` KOSONG, item tampil sebagai kotak "Flyer segera hadir" (ukuran 4:5).
//   - Ingin menyembunyikan satu flyer? Hapus item-nya dari daftar.
//   - Ingin menyembunyikan seluruh seksi? Kosongkan array `flyerItems` menjadi [].
//   - Jumlah item bebas (1, 2, 3, atau lebih); kolom menyesuaikan.
//
// SAMPLE: sebelum go-live, semua kotak kosong wajib diisi gambar asli atau dihapus.
//
// ============================================================================

export const flyerIntro = {
    title: "Rute, Jersey & Medali",
    description: "Lihat lintasan yang akan kamu lalui dan perlengkapan yang kamu dapat.",
};

export const flyerItems: IFlyer[] = [
    {
        title: "Rute Lintasan",
        alt: "Peta rute lari SMADARUN 2027",
        // src: "/images/flyer/rute.jpg",
        // width: 1080,
        // height: 1350,
    },
    {
        title: "Jersey",
        alt: "Desain jersey SMADARUN 2027",
        // src: "/images/flyer/jersey.jpg",
        // width: 1080,
        // height: 1350,
    },
    {
        title: "Medali Finisher",
        alt: "Desain medali finisher SMADARUN 2027",
        // src: "/images/flyer/medali.jpg",
        // width: 1080,
        // height: 1350,
    },
];

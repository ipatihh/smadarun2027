import { ILogo } from "@/types";

// ============================================================================
// LOGO SMADA (SEKOLAH) DAN SMADARUN (EVENT) — tempat memasang logo dari panitia.
// ============================================================================
//
// CARA MEMASANG (manual, tanpa mengubah komponen):
//   1. Taruh file di folder  public/images/logo/
//      (contoh: public/images/logo/smadarun.png dan public/images/logo/smada.png).
//   2. Pada logo yang sesuai di bawah, hapus tanda // dan isi ukuran aslinya:
//        src: "/images/logo/smadarun.png",
//        width: 400,    // lebar asli file, dalam piksel
//        height: 400,   // tinggi asli file, dalam piksel
//      Cara cek ukuran di Mac:  sips -g pixelWidth -g pixelHeight public/images/logo/smadarun.png
//   3. Simpan. Logo muncul otomatis di semua tempatnya (lihat di bawah).
//
// FORMAT: SVG atau PNG transparan; tinggi minimal ±120 px supaya tajam di layar retina.
//   Logo tampil KECIL (tinggi 28–40 px) dan tidak bisa diklik/diperbesar. Rasio bebas,
//   tata letak mengikuti rasio asli.
//
// DI MANA LOGO TAMPIL:
//   - logoEvent (SMADARUN): header kiri atas, di depan tulisan "SMADARUN 2027", dan footer.
//   - logoSekolah (SMADA): di depan kicker hero "SMA Negeri 2 Nganjuk mempersembahkan"
//       (menggantikan garis emas kecil), dan footer.
//   Selama `src` kosong, logo tidak tampil sama sekali dan situs memakai tampilan teks seperti
//   sebelumnya — tidak ada kotak kosong di header.
//
// Bila logo event sudah memuat TULISAN "SMADARUN 2027", ubah `sembunyikanTeksHeader` menjadi
// true supaya tulisannya tidak dobel di header.
//
// SAMPLE: kedua logo wajib diisi sebelum go-live.
//
// ============================================================================

export const logoEvent: ILogo = {
    alt: "Logo SMADARUN 2027",
    // src: "/images/logo/smadarun.png",
    // width: 400,
    // height: 400,
};

export const logoSekolah: ILogo = {
    alt: "Logo SMA Negeri 2 Nganjuk",
    // src: "/images/logo/smada.png",
    // width: 400,
    // height: 400,
};

export const sembunyikanTeksHeader = false;

/** Teks header benar-benar disembunyikan hanya bila logo event ada DAN flag di atas menyala. */
export const teksHeaderDisembunyikan = Boolean(logoEvent.src) && sembunyikanTeksHeader;

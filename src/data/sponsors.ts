// ============================================================================
// DAFTAR SPONSOR & PARTNER
// ============================================================================
//
// CARA MENAMBAH LOGO BARU (tidak perlu menyentuh komponen sama sekali):
//
//   1. Simpan file logo ke folder:  public/images/sponsors/
//      Beri nama huruf kecil tanpa spasi, mis. "bank-jatim.png", "radio-nganjuk.png".
//   2. Tambahkan satu baris di array `sponsors` di bawah, contoh:
//
//         { name: "Bank Jatim", logo: "bank-jatim.png", url: "https://bankjatim.co.id" },
//
//      - `logo` cukup NAMA FILE-nya saja, tidak perlu tulis path lengkap.
//      - `url` boleh dikosongkan kalau sponsor belum punya tautan.
//      - Urutan tampil = urutan di array ini.
//   3. Selesai. Tata letak dan ukuran kotak menyesuaikan otomatis,
//      berapa pun jumlah logonya.
//
// BELUM PUNYA FILE LOGONYA?
//   Kosongkan `logo` (atau hapus field-nya). Nama sponsor akan tampil sebagai teks
//   di kotak yang sama, jadi daftar sponsor tetap rapi sambil menunggu aset dikirim.
//
// ATURAN PEMASANGAN (ringkasan; rincian di CLAUDE.md):
//   - Latar logo WAJIB transparan. Kalau berlatar hitam/putih: node scripts/transparan-logo.mjs <asli> <nama.png>
//     lalu beri `blend: true` agar tampil tanpa kotak putih dan menyatu dengan tema.
//   - Semua sponsor & mitra satu kelompok di bawah judul "Didukung oleh": tanpa tier, ukuran kotak sama.
//   - Logo memanjang (rasio > ±4:1) beri `wide: true` — kotak lebih lebar dengan tinggi yang sama.
//
// SPESIFIKASI ASET (kirimkan ini ke calon sponsor):
//   - Format PNG latar transparan (paling aman), WebP, atau SVG.
//   - Tinggi minimal 200px, idealnya 400px, supaya tajam di layar retina.
//   - Pangkas dulu ruang kosong di sekeliling logo agar tinggi optisnya rata dengan
//     logo lain.
//
// ============================================================================

/** Folder tempat semua file logo sponsor disimpan. */
export const SPONSOR_LOGO_DIR = "/images/sponsors";

export interface ISponsor {
  /** Nama resmi sponsor. Dipakai sebagai alt text & teks pengganti kalau logo belum ada. */
  name: string;
  /** Nama file di public/images/sponsors/ (mis. "bank-jatim.png"). Kosongkan kalau belum ada. */
  logo?: string;
  /** Situs atau Instagram sponsor. Kosongkan kalau belum ada. */
  url?: string;
  /** true = logo sangat memanjang (mis. teks + alamat): kotaknya dilebarkan agar teks kecil tetap terbaca. */
  wide?: boolean;
  /** Dimensi asli file (px) agar rasio gambar benar sebelum dimuat. Bila kosong dipakai ukuran bawaan. */
  dimensi?: { width: number; height: number };
  /** true = file PNG/SVG berlatar transparan: tampil tanpa kotak putih, menyatu dengan latar seksi. */
  blend?: boolean;
}

/** Kotak logo: satu ukuran untuk semua sponsor & mitra (tanpa tier). */
// Di ponsel kotaknya sengaja lebih besar (dua logo per baris) — bukan sekadar versi susut dari desktop.
export const sponsorBox = { height: "h-28 md:h-32", width: "w-40 md:w-52" };

// Selama array ini kosong, seksi sponsor (`Logos.tsx`) menampilkan beberapa slot "Logo di sini".
// Berkas contoh lain di public/images/sponsors/ (kembarin*.png, nganjuk-runners.png) belum dipakai.
export const sponsors: ISponsor[] = [
  // Urutan array = urutan tampil dari atas ke bawah (logo `wide` masing-masing satu baris sendiri).
  { name: "Reza.Photowork", logo: "reza-photowork.png", wide: true, blend: true, dimensi: { width: 910, height: 136 } },
  // Logo memanjang (±7:1) dengan teks alamat kecil → `wide` melebarkan kotaknya agar terbaca.
  // File sudah dibersihkan: latar hitam asli dibuang jadi transparan, outline putih stiker dipertahankan
  // agar teks navy terbaca di atas latar terang maupun gelap.
  { name: "Sate Sor Nongko", logo: "sate-sor-nongko.png", wide: true, blend: true, dimensi: { width: 658, height: 105 } },
  // Lambang/logo bertumpuk (bukan `wide`) berjajar dalam satu baris.
  { name: "PASI (Persatuan Atletik Seluruh Indonesia)", logo: "pasi.png", blend: true, dimensi: { width: 429, height: 501 } },
  { name: "Havor Jersey", logo: "havor-jersey.png", blend: true, dimensi: { width: 600, height: 342 } },
];

/** Path lengkap file logo. Menerima nama file maupun path absolut (untuk fleksibilitas). */
export function sponsorLogoPath(logo: string): string {
  return logo.startsWith("/") ? logo : `${SPONSOR_LOGO_DIR}/${logo}`;
}

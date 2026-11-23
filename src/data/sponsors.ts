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
//         { name: "Bank Jatim", logo: "bank-jatim.png", tier: "community", url: "https://bankjatim.co.id" },
//
//      - `logo` cukup NAMA FILE-nya saja, tidak perlu tulis path lengkap.
//      - `url` boleh dikosongkan kalau sponsor belum punya tautan.
//      - Urutan tampil = urutan di array ini.
//   3. Selesai. Tata letak, ukuran kotak, dan hierarki tier menyesuaikan otomatis,
//      berapa pun jumlah logonya.
//
// BELUM PUNYA FILE LOGONYA?
//   Kosongkan `logo` (atau hapus field-nya). Nama sponsor akan tampil sebagai teks
//   di kotak yang sama, jadi daftar sponsor tetap rapi sambil menunggu aset dikirim.
//
// SPESIFIKASI ASET (kirimkan ini ke calon sponsor):
//   - Format PNG latar transparan (paling aman), WebP, atau SVG.
//   - Tinggi minimal 200px, idealnya 400px, supaya tajam di layar retina.
//   - Pangkas dulu ruang kosong di sekeliling logo agar tinggi optisnya rata dengan
//     logo lain.
//   - Kalau ada, kirim juga versi monokrom untuk dipakai di tier "Media & Mitra".
//
// ============================================================================

/** Folder tempat semua file logo sponsor disimpan. */
export const SPONSOR_LOGO_DIR = "/images/sponsors";

export type SponsorTier = "title" | "community" | "media";

export interface ISponsor {
  /** Nama resmi sponsor. Dipakai sebagai alt text & teks pengganti kalau logo belum ada. */
  name: string;
  /** Nama file di public/images/sponsors/ (mis. "bank-jatim.png"). Kosongkan kalau belum ada. */
  logo?: string;
  /** Situs atau Instagram sponsor. Kosongkan kalau belum ada. */
  url?: string;
  tier: SponsorTier;
  /** true = logo sangat memanjang (mis. teks + alamat): kotaknya dilebarkan agar teks kecil tetap terbaca. */
  wide?: boolean;
  /** true = file PNG/SVG berlatar transparan: tampil tanpa kotak putih, menyatu dengan latar seksi. */
  blend?: boolean;
}

export interface ISponsorTierConfig {
  tier: SponsorTier;
  /** Judul yang tampil di atas kelompok logo. */
  label: string;
  /** Tinggi kotak logo — inilah yang membentuk hierarki antar tier. */
  boxHeight: string;
  /** Lebar kotak logo. */
  boxWidth: string;
  /** true = logo ditampilkan monokrom (berwarna saat disorot). */
  muted: boolean;
}

// Urutan di array ini = urutan tier dari atas ke bawah di halaman.
export const sponsorTiers: ISponsorTierConfig[] = [
  {
    tier: "title",
    label: "Sponsor Utama",
    boxHeight: "h-20 sm:h-24 md:h-28",
    boxWidth: "w-36 sm:w-48 md:w-60",
    muted: false,
  },
  {
    tier: "community",
    label: "Mitra / Partner",
    boxHeight: "h-14 sm:h-16 md:h-20",
    boxWidth: "w-28 sm:w-36 md:w-48",
    muted: false,
  },
  {
    tier: "media",
    label: "Media & Mitra",
    boxHeight: "h-11 sm:h-12 md:h-14",
    boxWidth: "w-24 sm:w-28 md:w-40",
    muted: true,
  },
];

// Selama array ini kosong, seksi sponsor (`Logos.tsx`) menampilkan slot "Logo di sini" per tier.
// Berkas contoh lain di public/images/sponsors/ (kembarin*.png, nganjuk-runners.png) belum dipakai.
export const sponsors: ISponsor[] = [
  // Logo memanjang (±7:1) dengan teks alamat kecil → `wide` melebarkan kotaknya agar terbaca.
  // File sudah dibersihkan: latar hitam asli dibuang jadi transparan, outline putih stiker dipertahankan
  // agar teks navy terbaca di atas latar terang maupun gelap.
  { name: "Sate Sor Nongko", logo: "sate-sor-nongko.png", tier: "community", wide: true, blend: true },
];

/** Path lengkap file logo. Menerima nama file maupun path absolut (untuk fleksibilitas). */
export function sponsorLogoPath(logo: string): string {
  return logo.startsWith("/") ? logo : `${SPONSOR_LOGO_DIR}/${logo}`;
}

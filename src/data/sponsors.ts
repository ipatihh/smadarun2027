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
//   - Kalau ada, kirim juga versi monokrom untuk dipakai di tier "Media & Partner".
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
    boxHeight: "h-24 sm:h-28",
    boxWidth: "w-52 sm:w-60",
    muted: false,
  },
  {
    tier: "community",
    label: "Community Partner",
    boxHeight: "h-16 sm:h-20",
    boxWidth: "w-40 sm:w-48",
    muted: false,
  },
  {
    tier: "media",
    label: "Media & Partner",
    boxHeight: "h-12 sm:h-14",
    boxWidth: "w-32 sm:w-40",
    muted: true,
  },
];

// CATATAN: semua entri di bawah masih SAMPLE untuk menguji tata letak.
export const sponsors: ISponsor[] = [
  {
    name: "Kembar.in",
    logo: "kembarin.png",
    url: "https://kembar.in",
    tier: "title",
  },
  {
    name: "Nganjuk Runners",
    logo: "nganjuk-runners.png",
    tier: "community",
  },
  {
    name: "Kembar.in Community",
    logo: "kembarin-community.png",
    tier: "media",
  },
];

/** Path lengkap file logo. Menerima nama file maupun path absolut (untuk fleksibilitas). */
export function sponsorLogoPath(logo: string): string {
  return logo.startsWith("/") ? logo : `${SPONSOR_LOGO_DIR}/${logo}`;
}

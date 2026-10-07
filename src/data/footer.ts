import { ISocials } from "@/types";

export const footerDetails: {
    subheading: string;
    email: string;
    telephone: string;
    socials: ISocials;
} = {
    subheading: "Rayakan semangat olahraga, kebersamaan, dan kompetisi sehat di ajang lari tahunan terbesar persembahan SMA Negeri 2 Nganjuk.",

    // Tautan navigasi tidak lagi diulang di footer — semuanya sudah ada di header.

    email: 'info@kembar.in',
    telephone: '0878-5186-2317', // WhatsApp panitia/pembayaran; di footer ditautkan ke wa.me

    // SAMPLE — arahkan ke akun resmi panitia. Urutan di sini = urutan ikon di footer;
    // platform yang dikosongkan/dihapus otomatis tidak tampil. Nama yang didukung ada di
    // getPlatformIconByName (src/utils.tsx).
    socials: {
        instagram: 'https://www.instagram.com',
        x: 'https://x.com',
        facebook: 'https://facebook.com',
    },
}

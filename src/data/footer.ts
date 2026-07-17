import { IMenuItem, ISocials } from "@/types";

export const footerDetails: {
    subheading: string;
    quickLinks: IMenuItem[];
    email: string;
    telephone: string;
    socials: ISocials;
} = {
    // Deskripsi finansial diganti menjadi deskripsi event lari SMADA Nganjuk
    subheading: "Rayakan semangat olahraga, kebersamaan, dan kompetisi sehat di ajang lari tahunan terbesar persembahan SMA Negeri 2 Nganjuk.",
    
    // Teks menu dan link tujuannya disesuaikan ke Bahasa Indonesia
    quickLinks: [
        {
            text: "Beranda",
            url: "#beranda"
        },
        {
            text: "Tiket",
            url: "#tiket"
        },
        {
            text: "Testimoni",
            url: "#testimonials"
        }
    ],
    
    // Informasi kontak diperbarui
    email: 'info@kembar.in',
    telephone: '+62 812-3456-7890', // Silakan ganti dengan nomor HP/WhatsApp panitia jika ada
    
    // Sosial media (bisa kamu isi dengan link akun resmi kepanitiaan kamu)
    socials: {
        twitter: 'https://twitter.com',
        facebook: 'https://facebook.com',
        linkedin: 'https://www.linkedin.com',
        instagram: 'https://www.instagram.com', // Nanti tinggal arahkan ke IG official SMADARUN
    }
}
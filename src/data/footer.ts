import { ISocials } from "@/types";

export interface IKontakPanitia {
    nama: string;
    /** Nomor WhatsApp apa adanya (boleh pakai strip); ditautkan ke wa.me lewat `tautanWhatsApp`. */
    nomor: string;
}

/** Tautan wa.me dari nomor lokal (0812…) atau internasional; `pesan` opsional untuk teks awal chat. */
export const tautanWhatsApp = (nomor: string, pesan?: string): string =>
    `https://wa.me/${nomor.replace(/\D/g, '').replace(/^0/, '62')}${pesan ? `?text=${encodeURIComponent(pesan)}` : ''}`;

export const footerDetails: {
    subheading: string;
    kontak: IKontakPanitia[];
    socials: ISocials;
    /** Teks yang ditampilkan di samping ikon sosial media (kunci = nama platform di `socials`). */
    socialLabels: Record<string, string>;
} = {
    subheading: "Rayakan semangat olahraga, kebersamaan, dan kompetisi sehat di ajang lari tahunan terbesar persembahan SMA Negeri 2 Nganjuk.",

    // Tautan navigasi tidak lagi diulang di footer — semuanya sudah ada di header.

    // Kontak panitia (keputusan pemilik, 19 Nov 2026): HANYA WhatsApp tiga orang ini, tanpa email.
    // Dipakai di footer, FAQ, halaman status pesanan, dan Kebijakan Privasi (lewat footer).
    kontak: [
        { nama: 'Gero', nomor: '0821-4372-9459' },
        { nama: 'Hanif', nomor: '0821-4027-7608' },
        { nama: 'Arsyad', nomor: '0878-5640-3199' },
    ],

    // Sosial media resmi: hanya Instagram (keputusan pemilik, 19 Nov 2026). Urutan = urutan ikon
    // di footer; platform lain yang didukung ada di getPlatformIconByName (src/utils.tsx).
    socials: {
        instagram: 'https://www.instagram.com/smada.run_',
    },
    socialLabels: {
        instagram: '@smada.run_',
    },
}

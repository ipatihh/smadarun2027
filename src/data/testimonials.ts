import { ITestimonial } from "@/types";

// Nama event ditulis langsung (bukan siteDetails.siteName): ulasan menyebut edisi 2025,
// sedangkan siteName memuat "2027" sehingga kalimatnya jadi "SMADARUN 2027 2025".
export const testimonials: ITestimonial[] = [
    {
        name: 'Fatih',
        role: 'Founder kembar.in',
        message: 'Saya ikut SMADARUN 2025. Rutenya steril, udaranya sejuk, dan acaranya meriah. Event yang sangat menarik untuk diikuti.',
        avatar: '/images/ivatih-1.jpg',
    },
];

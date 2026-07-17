import { ITestimonial } from "@/types";
import { siteDetails } from "./siteDetails";

export const testimonials: ITestimonial[] = [
    {
        name: 'Fatih',
        role: 'Founder kembar.in',
        message: `Seru banget ikut ${siteDetails.siteName} tahun lalu! Rutenya steril, water station-nya melimpah, dan yang paling juara itu medali finisher-nya estetik parah. Tahun ini wajib ikutan lagi bareng temen-temen komunitas!`,
        avatar: '/images/ivatih-1.jpg',
    },
    {
        name: 'Siti Rahma',
        role: 'Pelari Umum (Surabaya)',
        message: `Gak nyesel jauh-jauh datang ke ${siteDetails.siteName}. Vibes acaranya dapet banget, penonton di pinggir jalan pada semangatin pas udah mau finish. Cocok banget buat pemula yang mau ngerasain race lari perdana.`,
        avatar: '/images/ivatih-1.jpg',
    },
    {
        name: 'Rian Hidayat',
        role: 'Anggota Komunitas Nganjuk Berlari',
        message: `Race management ${siteDetails.siteName} rapi banget untuk skala event sekolah, bahkan gak kalah sama event lari regional lainnya. Pengambilan race pack tertib dan jersey-nya nyaman banget dipake lari jauh.`,
        avatar: '/images/ivatih-1.jpg',
    },
];
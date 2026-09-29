import { FiDroplet, FiMap, FiClock, FiShield, FiCamera, FiMapPin } from "react-icons/fi";

import { IBenefit } from "@/types";

export const benefitsIntro = {
    title: "Disiapkan dari Start sampai Finish",
    description: "Kamu cukup fokus berlari. Keamanan rute, hidrasi, sampai dokumentasi sudah diurus panitia.",
};

// Isi race pack (jersey, medali, BIB, refreshment) SENGAJA tidak ditulis di sini: daftar
// itu sudah tampil di seksi Tiket ("Semua kategori sudah termasuk", dari src/data/tiket.ts).
// Sebelumnya fasilitas yang sama diulang di tiga tempat sekaligus.
export const benefits: IBenefit[] = [
    {
        title: "Water Station Terjadwal",
        description: "Pos hidrasi berkala supaya stamina dan cairan tubuhmu tetap terjaga.",
        icon: <FiDroplet size={20} />,
    },
    {
        title: "Rute Terarah & Steril",
        description: "Dipandu marshal dan penanda rute yang jelas di setiap belokan.",
        icon: <FiMap size={20} />,
    },
    {
        title: "Pencatatan Waktu Akurat",
        description: "Sistem pencatatan waktu yang siap mengukur pencapaian terbaikmu.",
        icon: <FiClock size={20} />,
    },
    {
        title: "Tim Medis & Ambulans Standby",
        description: "Pos kesehatan siaga di titik-titik strategis sepanjang rute.",
        icon: <FiShield size={20} />,
    },
    {
        title: "Fotografer di Berbagai Titik",
        description: "Momen terbaikmu diabadikan oleh tim fotografer resmi.",
        icon: <FiCamera size={20} />,
    },
    {
        title: "Lokasi Mudah Dijangkau",
        description: "Titik start dan finish yang mudah diakses, lengkap dengan area parkir.",
        icon: <FiMapPin size={20} />,
    },
];

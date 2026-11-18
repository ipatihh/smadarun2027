import { FiDroplet, FiMap, FiShield, FiCamera, FiPackage } from "react-icons/fi";

import { IBenefit } from "@/types";

export const benefitsIntro = {
    title: "Fasilitas",
    description: "Nikmati pengalaman berlari bersama kami.",
};

// Isi race pack (jersey, medali, BIB, refreshment) SENGAJA tidak ditulis di sini: daftar
// itu sudah tampil di seksi Tiket ("Semua kategori sudah termasuk", dari src/data/tiket.ts).
// Sebelumnya fasilitas yang sama diulang di tiga tempat sekaligus.
export const benefits: IBenefit[] = [
    {
        title: "Tersedia Waterstation",
        description: "Pos hidrasi berkala supaya stamina dan cairan tubuhmu tetap terjaga.",
        icon: <FiDroplet size={20} />,
    },
    {
        title: "Rute Terarah & Steril",
        description: "Dipandu marshal dan penanda rute yang jelas di setiap belokan.",
        icon: <FiMap size={20} />,
    },
    {
        title: "Tim Medis & Ambulans Standby",
        description: "Pos kesehatan siaga di titik-titik strategis sepanjang rute.",
        icon: <FiShield size={20} />,
    },
    {
        title: "Fotografer di Spot Terbaik",
        description: "Momen terbaikmu diabadikan oleh tim fotografer resmi.",
        icon: <FiCamera size={20} />,
    },
    {
        title: "Racepack Menarik",
        description: "Perlengkapan lomba eksklusif yang bisa kamu bawa pulang.",
        icon: <FiPackage size={20} />,
    },
];

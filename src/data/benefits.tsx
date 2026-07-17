// PERBAIKAN IMPOR: Memasukkan FiDroplet dan FiCamera, serta menghapus FiHeart dan FiUsers yang sudah tidak terpakai
import { FiAward, FiMapPin, FiClock, FiShield, FiMap, FiCheckCircle, FiDroplet, FiCamera } from "react-icons/fi";
import { FaTshirt } from "react-icons/fa"; 

import { IBenefit } from "@/types"

export const benefits: IBenefit[] = [
    {
        title: "Fasilitas & Race Pack Peserta",
        description: "Setiap peserta SMADARUN akan mendapatkan paket lomba eksklusif untuk mendukung kenyamanan dan performa terbaikmu saat berlari.",
        bullets: [
            {
                title: "Jersey Eksklusif SMADARUN 2027",
                description: "Bahan premium yang nyaman, ringan, dan cepat kering (dry-fit).",
                icon: <FaTshirt size={26} /> 
            },
            {
                title: "Medali Finisher Khusus",
                description: "Apresiasi logam eksklusif bagi semua pelari yang berhasil menyelesaikan rute.",
                icon: <FiAward size={26} />
            },
            {
                title: "Nomor Dada (BIB) & Refreshment",
                description: "Nomor pelari resmi beserta paket hidrasi di rute dan garis finish.",
                icon: <FiCheckCircle size={26} />
            }
        ],
        imageSrc: "/images/pocari-1.jpg"
    },
    {
        title: "Rute Steril & Penuh Semangat",
        description: "Nikmati jalur lari yang aman dengan pemandangan kota yang menyenangkan dan dukungan penuh di sepanjang jalan.",
        bullets: [
            {
                title: "Water Station Terjadwal",
                description: "Pos hidrasi berkala untuk memastikan stamina dan cairan tubuhmu terjaga.",
                // 1. UBAH IKON WATER STATION MENJADI TETESAN AIR DI SINI
                icon: <FiDroplet size={26} /> 
            },
            {
                title: "Rute Terarah & Steril",
                description: "Dipandu oleh marshal profesional dan penanda rute yang sangat jelas.",
                icon: <FiMap size={26} />
            },
            {
                title: "Pencatatan Waktu Akurat",
                description: "Sistem pencatatan waktu yang siap mengukur pencapaian lari terbaikmu.",
                icon: <FiClock size={26} />
            }
        ],
        imageSrc: "/images/pocari-1.jpg"
    },
    {
        title: "Aman & Didukung Komunitas",
        description: "Keselamatan pelari adalah prioritas utama kami. Berlari dengan tenang bersama ratusan peserta lainnya.",
        bullets: [
            {
                title: "Tim Medis & Ambulans Standby",
                description: "Tim medis bergerak cepat dan pos kesehatan siap siaga di area strategis.",
                icon: <FiShield size={26} />
            },
            {
                title: "Fotografer di Berbagai Titik",
                description: "Abadikan momen terbaikmu saat berlari oleh tim fotografer official.",
                // 2. UBAH IKON FOTOGRAFER MENJADI KAMERA DI SINI
                icon: <FiCamera size={26} /> 
            },
            {
                title: "Lokasi Strategis",
                description: "Titik start dan finish yang mudah diakses dengan area parkir luas.",
                icon: <FiMapPin size={26} />
            }
        ],
        imageSrc: "/images/pocari-1.jpg"
    },
]
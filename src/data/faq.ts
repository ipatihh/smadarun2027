import { IFAQ } from "@/types";
import { siteDetails } from "./siteDetails";

export const faqs: IFAQ[] = [
    {
        question: `Kapan dan di mana ${siteDetails.siteName} dilaksanakan?`,
        answer: 'Informasi mengenai tanggal pelaksanaan resmi, lokasi pengambilan race pack, serta rute start/finish dapat Anda pantau secara berkala melalui halaman utama website ini atau akun Instagram resmi kami.',
    },
    {
        question: 'Fasilitas apa saja yang didapatkan oleh peserta?',
        answer: 'Setiap peserta yang terdaftar akan mendapatkan Slot Lari resmi, Jersey Eksklusif SMADARUN 2027, Nomor Dada (BIB), Konsumsi/Hidrasi di rute lomba, Proteksi Medis/Asuransi, serta Medali Finisher bagi yang berhasil mencapai garis finish sebelum batas waktu.',
    },
    {
        question: 'Apakah ada batas waktu (Cut Off Time) untuk kategori 5K?',
        answer: 'Ada. Batas waktu pengerjaan rute (Cut Off Time) untuk kategori 5K dirancang sangat longgar dan ramah bagi pemula, sehingga aman diikuti oleh pelari hobi, keluarga, maupun pelajar yang baru pertama kali ikut event lari.',
    },
    {
        question: 'Bagaimana mekanisme pengambilan Race Pack (RPC)?',
        answer: 'Pengambilan paket lomba (Race Pack) wajib membawa bukti email konfirmasi pendaftaran dan kartu identitas resmi (Kartu Pelajar/KTP). Jadwal dan lokasi detail pengambilan akan diumumkan menjelang hari pelaksanaan kegiatan.',
    },
    {
        question: 'Apakah tiket yang sudah dibeli bisa dibatalkan atau dipindahtangankan?',
        answer: 'Tiket lari yang sudah berhasil dibayar bersifat final dan tidak dapat dibatalkan, diuangkan kembali (refund), ataupun diubah datanya/dipindahtangankan kepada orang lain demi keselamatan serta kevalidan data asuransi peserta.'
    }
];
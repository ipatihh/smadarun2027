import type { Metadata } from "next";
import { getLiveEventData } from "@/lib/kembarinEvents";
import DaftarForm from "./DaftarForm";

// Zona waktu dikunci ke WIB supaya hasil format sama persis di server maupun di browser
// pengunjung (kalau tidak, teks hasil render server dan klien bisa berbeda).
function formatJadwalBuka(iso: string | null): string | null {
  if (!iso) return null;
  const ms = new Date(iso).getTime();
  if (Number.isNaN(ms)) return null;
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "full",
    timeStyle: "short",
    timeZone: "Asia/Jakarta",
  }).format(ms) + " WIB";
}

export const metadata: Metadata = {
  title: "Daftar SMADARUN 2027 — Siap Start Bareng? | SMAN 2 Nganjuk",
  description:
    "Pilih kategori, isi data peserta, bayar online: tiga langkah dan kamu resmi jadi bagian dari cerita baru di garis start SMADARUN 2027.",
  // Tanpa ini halaman mewarisi canonical beranda dari layout.tsx dan dianggap duplikatnya.
  alternates: { canonical: "/daftar" },
  // openGraph/twitter di sini MENGGANTI milik layout (tidak digabung), jadi ditulis lengkap.
  openGraph: {
    title: "Daftar SMADARUN 2027 — Siap Start Bareng? | SMAN 2 Nganjuk",
    description:
      "Pilih kategori, isi data peserta, bayar online: tiga langkah dan kamu resmi jadi bagian dari cerita baru di garis start SMADARUN 2027.",
    url: "/daftar",
    type: "website",
    siteName: "SMADARUN 2027",
    locale: "id_ID",
  },
  twitter: {
    card: "summary_large_image",
    title: "Daftar SMADARUN 2027 — Siap Start Bareng? | SMAN 2 Nganjuk",
    description:
      "Pilih kategori, isi data peserta, bayar online: tiga langkah dan kamu resmi jadi bagian dari cerita baru di garis start SMADARUN 2027.",
  },
};

// Tanggal hari-H untuk ringkasan event (WIB, tanpa jam).
function formatTanggalEvent(iso: string | null): string | null {
  if (!iso) return null;
  const ms = new Date(iso).getTime();
  if (Number.isNaN(ms)) return null;
  return new Intl.DateTimeFormat("id-ID", { dateStyle: "long", timeZone: "Asia/Jakarta" }).format(ms);
}

export default async function DaftarPage() {
  const live = await getLiveEventData();

  return (
    <DaftarForm
      ticketTypes={live.ticketTypes}
      isOpen={live.isOpen}
      comingSoon={live.comingSoon}
      adminFee={live.adminFee}
      adminFeeLabel={live.adminFeeLabel}
      opensAtLabel={formatJadwalBuka(live.opensAt)}
      // Seperti seksi jadwal di beranda: tanggal & lokasi hanya dari core, dan belum tampil saat Coming Soon.
      tanggalEvent={live.comingSoon ? null : formatTanggalEvent(live.eventDate)}
      lokasi={live.comingSoon ? null : live.location}
      multiTicketEnabled={live.multiTicketEnabled}
      maxTicketsPerOrder={live.maxTicketsPerOrder}
      wilayahDropdown={live.wilayahDropdown}
      namaBib={live.namaBib}
      kolomTambahan={live.kolomTambahan}
    />
  );
}

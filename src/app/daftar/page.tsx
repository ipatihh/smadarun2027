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
  title: "Daftar SMADARUN 2027 — Pendaftaran Lomba Lari SMA Negeri 2 Nganjuk",
  description:
    "Daftar SMADARUN 2027, lomba lari SMA Negeri 2 Nganjuk. Pilih kategori tiket, isi data peserta, dan bayar online.",
  // Tanpa ini halaman mewarisi canonical beranda dari layout.tsx dan dianggap duplikatnya.
  alternates: { canonical: "/daftar" },
  openGraph: { url: "/daftar" },
};

export default async function DaftarPage() {
  const live = await getLiveEventData();

  return (
    <DaftarForm
      ticketTypes={live.ticketTypes}
      isOpen={live.isOpen}
      comingSoon={live.comingSoon}
      adminFee={live.adminFee}
      opensAtLabel={formatJadwalBuka(live.opensAt)}
      multiTicketEnabled={live.multiTicketEnabled}
      maxTicketsPerOrder={live.maxTicketsPerOrder}
      wilayahDropdown={live.wilayahDropdown}
      namaBib={live.namaBib}
      kolomTambahan={live.kolomTambahan}
    />
  );
}

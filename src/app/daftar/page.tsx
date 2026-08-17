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

export default async function DaftarPage() {
  const live = await getLiveEventData();

  return (
    <DaftarForm
      ticketTypes={live.ticketTypes}
      isOpen={live.isOpen}
      adminFee={live.adminFee}
      opensAtLabel={formatJadwalBuka(live.opensAt)}
    />
  );
}

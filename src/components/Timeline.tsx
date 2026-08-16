import SectionTitle from "./SectionTitle";
import TimelineItems, { TimelineEntry } from "./TimelineItems";
import { getLiveEventData } from "@/lib/kembarinEvents";

function formatClock(raw: string): string {
  const match = raw.match(/^(\d{2}):(\d{2})/);
  return match ? `${match[1]}:${match[2]} WIB` : raw;
}

async function Timeline() {
  const live = await getLiveEventData();
  if (!live.timeline) return null;

  const { rpcTanggal, rpcWaktu, rpcLokasi, gunStarts } = live.timeline;

  const entries: TimelineEntry[] = [];

  if (rpcTanggal || rpcWaktu || rpcLokasi) {
    const detailParts = [rpcWaktu, rpcLokasi].filter(Boolean);
    entries.push({
      title: "Pengambilan Race Pack (RPC)",
      time: rpcTanggal,
      detail: detailParts.length > 0 ? detailParts.join(" • ") : null,
    });
  }

  const activeDistances = live.ticketTypes.map((t) => t.categoryKey.toUpperCase());
  const gunStartEntries = Object.entries(gunStarts).filter(([key]) =>
    activeDistances.some((cat) => cat.includes(key.toUpperCase()))
  );

  for (const [key, value] of gunStartEntries) {
    entries.push({
      title: `Gun Start — Kategori ${key}`,
      time: formatClock(value),
      detail: null,
    });
  }

  if (entries.length === 0) return null;

  return (
    <section id="timeline" className="py-10 lg:py-20">
      <SectionTitle>
        <h2 className="text-center mb-4">Susunan Acara</h2>
      </SectionTitle>
      <p className="mb-12 text-center text-foreground-accent">
        Catat waktunya supaya tidak ketinggalan momen penting.
      </p>
      <TimelineItems entries={entries} />
    </section>
  );
}

export default Timeline;

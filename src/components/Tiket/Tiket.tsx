import { getLiveEventData, ResolvedTicketTier } from "@/lib/kembarinEvents";
import { tiketMarketing } from "@/data/tiket";
import TiketGrid from "./TiketGrid";

async function Tiket() {
  const live = await getLiveEventData();

  const tiers: ResolvedTicketTier[] = live.ticketTypes.map((lt) => {
    const marketing = tiketMarketing.find(
      (m) => m.categoryKey.toLowerCase() === lt.categoryKey.toLowerCase()
    );
    return {
      ...lt,
      name: marketing?.name ?? lt.categoryKey,
      features: marketing?.features ?? [],
      url: marketing?.url ?? "/daftar",
      isAvailable: live.isOpen,
    };
  });

  if (tiers.length === 0) {
    return (
      <section id="tiket" className="py-20 px-5 bg-background">
        <div className="max-w-6xl mx-auto text-center text-muted-foreground">
          Kategori tiket akan segera diumumkan. Pantau terus info resmi panitia.
        </div>
      </section>
    );
  }

  return (
    <section id="tiket" className="py-20 px-5 bg-background">
      <div className="max-w-6xl mx-auto">
        <TiketGrid tiers={tiers} />
      </div>
    </section>
  );
};

export default Tiket;

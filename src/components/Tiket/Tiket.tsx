import { getLiveEventData, ResolvedTicketTier } from "@/lib/kembarinEvents";
import { tiketMarketing } from "@/data/tiket";
import SectionTitle from "../SectionTitle";
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
      badge: marketing?.badge,
      highlight: marketing?.highlight,
    };
  });

  // Fasilitas yang dimiliki SEMUA kategori dipindah ke satu baris di bawah grid.
  // Sebelumnya tiap kartu mengulang daftar yang nyaris identik, sehingga kedua kategori
  // terbaca sebagai duplikat dan pembeda aslinya (harga & peruntukan) jadi tenggelam.
  const sharedFeatures =
    tiers.length > 1
      ? tiers[0].features.filter((feature) =>
          tiers.every((tier) => tier.features.includes(feature))
        )
      : [];

  const tiersWithUniqueFeatures = tiers.map((tier) => ({
    ...tier,
    features: tier.features.filter((feature) => !sharedFeatures.includes(feature)),
  }));

  return (
    <section id="tiket" className="scroll-mt-24 py-10 lg:py-20">
      <SectionTitle>
        <h2 className="text-center mb-4">Kategori Tiket</h2>
      </SectionTitle>
      <p className="mb-12 text-center text-foreground-accent">
        Amankan slot sekarang sebelum kehabisan!
      </p>

      {tiers.length === 0 ? (
        <div className="mx-auto max-w-xl rounded-card border border-border bg-card p-8 text-center text-muted-foreground">
          Kategori tiket akan segera diumumkan. Pantau terus info resmi panitia.
        </div>
      ) : (
        <TiketGrid
          tiers={tiersWithUniqueFeatures}
          sharedFeatures={sharedFeatures}
          adminFee={live.adminFee}
        />
      )}
    </section>
  );
}

export default Tiket;

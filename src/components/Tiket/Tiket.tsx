import { getLiveEventData, ResolvedTicketTier } from "@/lib/kembarinEvents";
import { tiketMarketing } from "@/data/tiket";
import SectionTitle from "../SectionTitle";
import Eyebrow from "../Eyebrow";
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
      comingSoon: live.comingSoon,
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

  // Jumlah kategori live dari core: dengan satu kategori, ajakan "pilih"/"paling pas" tidak masuk akal.
  const tunggal = tiers.length === 1;
  const judul = tunggal ? "Amankan tempatmu" : "Pilih jarakmu";
  const labelSeksi = tunggal ? "Tiket" : "Kategori";
  const pengantar = tunggal
    ? "Satu kategori tersedia untuk SMADARUN 2027."
    : "Temukan kategori yang paling pas untukmu.";

  return (
    <section id="tiket" className="scroll-mt-24 py-16 lg:py-28">
      <div className="reveal-left">
        <Eyebrow center>{labelSeksi}</Eyebrow>
        <SectionTitle>
          <h2 className="mb-3 text-center">{judul}</h2>
        </SectionTitle>
      </div>
      <p className="reveal-right mb-14 text-center text-sm text-foreground-accent sm:text-base">
        {pengantar}
      </p>

      {tiers.length === 0 ? (
        <div className="mx-auto max-w-xl rounded-card border border-border bg-card p-8 text-center text-muted-foreground">
          Kategori tiket akan segera diumumkan. Pantau terus info resmi panitia.
        </div>
      ) : (
        <>
          <TiketGrid
            tiers={tiersWithUniqueFeatures}
            sharedFeatures={sharedFeatures}
            adminFee={live.adminFee}
          />
          {live.multiTicketEnabled && live.maxTicketsPerOrder > 1 && (
            <p className="mx-auto mt-6 max-w-2xl text-center text-sm text-foreground-accent">
              <span className="font-bold text-foreground">Daftar rombongan?</span> Satu pembayaran bisa untuk sampai{" "}
              {live.maxTicketsPerOrder} peserta sekaligus — boleh beda kategori dan beda ukuran jersey.
            </p>
          )}
        </>
      )}
    </section>
  );
}

export default Tiket;

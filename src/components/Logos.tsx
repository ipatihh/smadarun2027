import Image from "next/image";
import { sponsors, sponsorTiers, sponsorLogoPath, ISponsor, ISponsorTierConfig } from "@/data/sponsors";
import { footerDetails } from "@/data/footer";

/**
 * Galeri sponsor bertingkat. Semua isinya digerakkan oleh src/data/sponsors.ts —
 * menambah sponsor cukup menaruh file logo di public/images/sponsors/ lalu menambah
 * satu baris di array, tanpa menyentuh file ini.
 *
 * Hierarki dibangun lewat UKURAN kotak logo per tier, bukan lewat transparansi, dan tiap
 * logo diletakkan di kotak bertinggi tetap dengan object-contain supaya logo bulat, kotak,
 * maupun memanjang tetap sejajar secara optis berapa pun jumlahnya.
 */

const SponsorLogo: React.FC<{ sponsor: ISponsor; tier: ISponsorTierConfig }> = ({ sponsor, tier }) => {
  const boxClass = `flex ${tier.boxHeight} ${tier.boxWidth} items-center justify-center rounded-field border border-border bg-card px-4 py-2 shadow-rest transition-shadow hover:shadow-hover`;

  // Belum ada file logonya → tampilkan nama sponsor supaya barisnya tetap rapi.
  if (!sponsor.logo) {
    return (
      <span className={boxClass}>
        <span className="text-center font-display text-sm font-bold uppercase leading-tight tracking-wide text-foreground-accent">
          {sponsor.name}
        </span>
      </span>
    );
  }

  const src = sponsorLogoPath(sponsor.logo);
  // File SVG dilayani langsung dari /public (image optimizer Next menolak SVG secara
  // default) — supaya panitia bebas memakai format apa pun yang dikirim sponsor tanpa
  // perlu mengubah konfigurasi.
  const isSvg = src.toLowerCase().endsWith(".svg");

  return (
    <span className={boxClass}>
      <Image
        src={src}
        alt={sponsor.name}
        width={240}
        height={96}
        sizes="240px"
        unoptimized={isSvg}
        className={`max-h-full w-auto object-contain ${
          tier.muted ? "opacity-80 grayscale transition hover:opacity-100 hover:grayscale-0" : ""
        }`}
      />
    </span>
  );
};

const Logos: React.FC = () => {
  const tiersWithSponsors = sponsorTiers
    .map((tier) => ({ ...tier, items: sponsors.filter((s) => s.tier === tier.tier) }))
    .filter((tier) => tier.items.length > 0);

  if (tiersWithSponsors.length === 0) return null;

  return (
    <section id="logos" className="scroll-mt-24 bg-background px-5 py-12 lg:py-16">
      <div className="mx-auto max-w-5xl">
        <p className="text-center text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Didukung oleh
        </p>

        <div className="mt-8 space-y-10">
          {tiersWithSponsors.map((tier) => (
            <div key={tier.tier}>
              <p className="mb-4 text-center text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                {tier.label}
              </p>
              {/* flex-wrap: berapa pun jumlah logonya otomatis turun baris, tetap rata tengah */}
              <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6">
                {tier.items.map((sponsor) =>
                  sponsor.url ? (
                    <a
                      key={sponsor.name}
                      href={sponsor.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={sponsor.name}
                      className="rounded-field focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                    >
                      <SponsorLogo sponsor={sponsor} tier={tier} />
                    </a>
                  ) : (
                    <SponsorLogo key={sponsor.name} sponsor={sponsor} tier={tier} />
                  )
                )}
              </div>
            </div>
          ))}
        </div>

        <p className="mt-10 text-center text-sm text-muted-foreground">
          Tertarik menjadi sponsor SMADARUN 2027?{" "}
          <a
            href={`mailto:${footerDetails.email}?subject=Kerja%20Sama%20Sponsor%20SMADARUN%202027`}
            className="font-semibold text-foreground underline underline-offset-4 hover:text-foreground-accent"
          >
            Hubungi panitia
          </a>
        </p>
      </div>
    </section>
  );
};

export default Logos;

import { Fragment } from "react";
import Image from "next/image";
import { sponsors, sponsorBox, sponsorLogoPath, ISponsor } from "@/data/sponsors";
import Eyebrow from "./Eyebrow";

/**
 * Seksi "Didukung oleh": semua sponsor & mitra dalam SATU kelompok, satu ukuran kotak, tanpa tier
 * (keputusan pemilik, 23 Nov 2026). Isinya digerakkan oleh src/data/sponsors.ts — menambah sponsor
 * cukup menaruh file logo di public/images/sponsors/ lalu menambah satu baris di array.
 *
 * Tiap logo diletakkan di kotak bertinggi tetap dengan object-contain supaya logo bulat, kotak,
 * maupun memanjang tetap sejajar secara optis berapa pun jumlahnya.
 */

const SponsorLogo: React.FC<{ sponsor: ISponsor }> = ({ sponsor }) => {
  // bg-logo-surface tetap terang di mode gelap — logo sponsor hampir selalu dibuat untuk latar putih.
  // Logo `wide`: kotak melebar (maks. 22rem) supaya teks kecil di dalam logo tetap terbaca; tingginya sama.
  const ukuranKotak = sponsor.wide
    ? "w-full max-w-[22rem] px-0 sm:h-20 sm:px-3"
    : `${sponsorBox.height} ${sponsorBox.width} px-4`;
  // Logo `blend` (PNG latar transparan): tanpa kotak putih/garis, menyatu dengan latar seksi. Outline
  // putih stiker pada gambarnya yang menjaga teks tetap terbaca di mode terang maupun gelap.
  const gayaKotak = sponsor.blend
    ? "py-1"
    : "rounded-field border border-border bg-logo-surface py-2 transition-colors hover:border-border-strong";
  const boxClass = `flex ${ukuranKotak} items-center justify-center ${gayaKotak}`;

  // Belum ada file logonya → tampilkan nama sponsor supaya barisnya tetap rapi.
  if (!sponsor.logo) {
    return (
      <span className={boxClass}>
        <span className="text-center font-display text-sm font-bold uppercase leading-tight tracking-wide text-on-primary">
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

  const kelas = `max-h-full object-contain ${sponsor.wide ? "h-auto w-full" : "w-auto"}`;
  const dimensi = sponsor.dimensi ?? { width: sponsor.wide ? 658 : 240, height: sponsor.wide ? 105 : 96 };
  const sizes = sponsor.wide ? "(min-width: 768px) 480px, 90vw" : "240px";

  return (
    <span className={boxClass}>
      <Image
        src={src}
        alt={sponsor.name}
        {...dimensi}
        sizes={sizes}
        unoptimized={isSvg}
        className={kelas}
      />
    </span>
  );
};

// Jumlah kotak kosong saat BELUM ADA sponsor sama sekali: memberi gambaran ke calon sponsor
// di mana logo mereka akan dipasang.
const JUMLAH_SLOT_KOSONG = 4;

const SlotKosong: React.FC = () => (
  <span
    className={`flex ${sponsorBox.height} ${sponsorBox.width} items-center justify-center rounded-field border border-dashed border-border-strong/60 px-4 py-2 text-center text-xs text-foreground-accent sm:text-sm`}
  >
    Logo di sini
  </span>
);

const Logos: React.FC = () => {
  // Daftar kosong → seksi tetap tampil dengan slot kosong (bukan disembunyikan).
  const belumAdaSponsor = sponsors.length === 0;

  return (
    <section id="logos" className="scroll-mt-24 bg-background px-5 py-12 lg:py-16">
      <div className="mx-auto max-w-5xl">
        <div className="reveal-left text-center">
          {/* Satu-satunya judul seksi (permintaan pemilik): tanpa h2 terpisah agar tidak berulang. */}
          <Eyebrow center>Didukung oleh</Eyebrow>
        </div>

        {/* flex-wrap: berapa pun jumlah logonya otomatis turun baris, tetap rata tengah */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3 sm:gap-4 md:gap-6">
          {belumAdaSponsor && Array.from({ length: JUMLAH_SLOT_KOSONG }, (_, i) => <SlotKosong key={i} />)}
          {sponsors.map((sponsor) => {
            const logo = sponsor.url ? (
              <a
                href={sponsor.url}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={sponsor.name}
                className={`rounded-field focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-background ${
                  sponsor.wide ? "flex w-full justify-center" : ""
                }`}
              >
                <SponsorLogo sponsor={sponsor} />
              </a>
            ) : (
              <SponsorLogo sponsor={sponsor} />
            );
            // Logo `wide` selalu menempati satu baris sendiri di semua lebar layar (urutan array = atas ke bawah).
            return sponsor.wide ? (
              <div key={sponsor.name} className="flex basis-full justify-center">
                {logo}
              </div>
            ) : (
              <Fragment key={sponsor.name}>{logo}</Fragment>
            );
          })}
        </div>

        <p className="mt-10 text-center text-sm text-muted-foreground">
          Tertarik menjadi sponsor SMADARUN 2027?{" "}
          <a
            href="#kontak"
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

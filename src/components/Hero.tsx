import Image from "next/image";
import Link from "next/link";

import { heroDetails } from "@/data/hero";

/**
 * Hero editorial: satu judul, foto start selebar layar, satu aksi.
 * Foto start asli dipotong secara visual agar tulisan tahun sebelumnya pada
 * tepi aset tidak berbenturan dengan identitas acara 2027.
 */
const Hero: React.FC = () => (
  <section id="beranda" className="hero-atmosphere relative isolate overflow-hidden pb-16 pt-28 sm:pb-24 sm:pt-36">
    <div className="hero-grid pointer-events-none absolute inset-0 -z-10" aria-hidden="true" />

    <div className="mx-auto max-w-7xl px-5">
      <p className="reveal flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-foreground-accent sm:text-xs">
        <span className="h-px w-8 bg-primary-accent" aria-hidden="true" />
        {heroDetails.kicker}
      </p>

      <div className="reveal reveal-1 relative mt-6 flex items-end justify-between gap-4 pb-5">
        <h1 className="font-display text-[clamp(2.9rem,10.5vw,9.5rem)] font-semibold uppercase leading-[0.88] tracking-[-0.045em] text-foreground">
          {heroDetails.heading}<span className="sr-only"> {heroDetails.headingAccent}</span>
        </h1>
        <span className="shrink-0 font-display text-xl font-medium leading-none text-foreground-accent sm:pb-1 sm:text-3xl md:text-4xl" aria-hidden="true">
          {heroDetails.headingAccent}
        </span>
        <svg className="hero-track pointer-events-none absolute inset-x-0 -bottom-5 h-5 w-full overflow-visible" viewBox="0 0 1200 20" preserveAspectRatio="none" aria-hidden="true">
          <path className="hero-track-base" d="M0 0 H1200" />
          <path className="hero-track-progress" d="M0 0 H1200" pathLength="1" />
        </svg>
      </div>

    </div>

    <div className="reveal reveal-2 relative mt-5 min-h-[31rem] overflow-hidden bg-secondary sm:min-h-[34rem] lg:min-h-[36rem]">
      {heroDetails.centerImageSrc && (
        <Image
          src={heroDetails.centerImageSrc}
          alt={heroDetails.centerImageAlt}
          fill
          sizes="100vw"
          priority
          unoptimized={heroDetails.centerImageSrc.toLowerCase().endsWith(".svg")}
          className="scale-[1.9] object-cover object-[58%_center] sm:scale-[1.85] sm:object-[center_80%]"
        />
      )}
      <div className="hero-photo-shade absolute inset-0" aria-hidden="true" />

      <div className="relative mx-auto flex min-h-[31rem] max-w-7xl flex-col items-start justify-start px-6 pb-8 pt-9 text-on-secondary sm:min-h-[34rem] sm:px-10 sm:pt-11 lg:min-h-[36rem] lg:px-14 lg:pt-14">
        <p className="max-w-lg text-3xl font-semibold tracking-tight sm:text-4xl lg:text-5xl">
          {heroDetails.tagline}
        </p>
        <p className="mt-3 max-w-md text-sm leading-relaxed text-on-secondary-muted sm:text-base">
          {heroDetails.subheading}
        </p>
        <Link
          href="/daftar"
          className="mt-7 inline-flex min-h-11 w-fit items-center justify-center rounded-full bg-primary px-6 text-sm font-semibold text-on-primary shadow-rest transition-all duration-300 hover:-translate-y-0.5 hover:bg-primary-accent hover:shadow-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-secondary"
        >
          Daftar sekarang
        </Link>
      </div>
    </div>
  </section>
);

export default Hero;

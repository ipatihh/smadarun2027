import Image from "next/image";
import Link from "next/link";

import BrandLogo from "@/components/BrandLogo";
import { heroDetails } from "@/data/hero";
import { logoSekolah } from "@/data/logo";

/**
 * Hero editorial: satu judul, foto start selebar layar, satu aksi.
 * hero1.JPG sudah dipotong (scripts/optimasi-foto.mjs) ke area yang tampil, sehingga teks tahun
 * sebelumnya di tepi aset asli ikut terbuang dan tidak berbenturan dengan identitas 2027.
 * Tidak ada zoom CSS: zoom meregangkan foto dan memaksa browser mengunduh berkas jauh lebih besar.
 */
const Hero: React.FC = () => (
  <section id="beranda" className="hero-atmosphere relative isolate overflow-hidden pt-28 sm:pt-36">
    <div className="hero-grid pointer-events-none absolute inset-0 -z-10" aria-hidden="true" />

    <div className="mx-auto max-w-7xl px-5">
      <p className="reveal flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.16em] text-foreground-accent sm:text-[13px]">
        {logoSekolah.src ? (
          <BrandLogo logo={logoSekolah} className="h-7 sm:h-8" priority />
        ) : (
          <span className="h-px w-8 bg-primary-accent" aria-hidden="true" />
        )}
        {heroDetails.kicker}
      </p>

      <div className="reveal reveal-1 relative mt-6 flex items-end justify-between gap-4 pb-5">
        <h1 className="font-display text-[clamp(3rem,11vw,10rem)] font-semibold leading-[0.95] tracking-[-0.05em] text-foreground">
          {heroDetails.heading}<span className="sr-only"> {heroDetails.headingAccent}</span>
        </h1>
        <span className="shrink-0 font-display text-xl font-medium leading-none text-foreground-accent sm:pb-2 sm:text-3xl md:text-5xl" aria-hidden="true">
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
          className="photo-warm object-cover object-[64%_center] sm:object-bottom"
        />
      )}
      <div className="hero-photo-shade absolute inset-0" aria-hidden="true" />

      <div className="relative mx-auto flex min-h-[31rem] max-w-7xl flex-col items-start justify-start px-6 pb-8 pt-9 text-on-secondary sm:min-h-[34rem] sm:px-10 sm:pt-11 lg:min-h-[36rem] lg:px-14 lg:pt-14">
        <p className="max-w-xl font-display text-4xl font-medium leading-[1.1] tracking-[-0.02em] sm:text-5xl lg:text-6xl">
          {heroDetails.tagline}
        </p>
        <p className="mt-3 max-w-md text-sm leading-relaxed text-on-secondary-muted sm:text-base">
          {heroDetails.subheading}
        </p>
        <Link
          href="/daftar"
          className="mt-7 inline-flex min-h-11 w-fit items-center justify-center rounded-full bg-primary px-6 text-sm font-semibold text-on-primary transition-all duration-300 hover:-translate-y-0.5 hover:bg-primary-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-secondary"
        >
          Daftar sekarang
        </Link>
      </div>
    </div>
  </section>
);

export default Hero;

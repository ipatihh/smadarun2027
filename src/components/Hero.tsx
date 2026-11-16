import Image from "next/image";
import Link from "next/link";

import BrandLogo from "@/components/BrandLogo";
import PolaTitik from "@/components/PolaTitik";
import { heroDetails } from "@/data/hero";
import { logoSekolah } from "@/data/logo";
import { getLiveEventData } from "@/lib/kembarinEvents";

/**
 * Hero editorial: satu judul, foto start selebar layar, satu aksi.
 * hero1.JPG sudah dipotong (scripts/optimasi-foto.mjs) ke area yang tampil, sehingga teks tahun
 * sebelumnya di tepi aset asli ikut terbuang dan tidak berbenturan dengan identitas 2027.
 * Tidak ada zoom CSS: zoom meregangkan foto dan memaksa browser mengunduh berkas jauh lebih besar.
 */
async function Hero() {
  const live = await getLiveEventData();
  return (
  <section id="beranda" className="hero-atmosphere relative isolate overflow-hidden pt-28 sm:pt-36">
    <div className="hero-grid pointer-events-none absolute inset-0 -z-10" aria-hidden="true" />
    <PolaTitik className="absolute -right-48 top-8 -z-10 h-[34rem] w-[34rem] opacity-80 sm:-right-24 sm:top-0 sm:h-[46rem] sm:w-[46rem]" />

    <div className="mx-auto max-w-7xl px-5">
      <p className="reveal flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.16em] text-on-secondary-muted sm:text-[13px]">
        {logoSekolah.src ? (
          <BrandLogo logo={logoSekolah} className="h-10 sm:h-12" priority />
        ) : (
          <Image src="/images/logo/burung-hantu-ikon.png" alt="" width={96} height={96} className="h-7 w-7 shrink-0 sm:h-8 sm:w-8" priority />
        )}
        {heroDetails.kicker}
      </p>

      <div className="reveal reveal-1 relative mt-6 flex items-end justify-between gap-4 pb-5">
        <h1 className="font-display text-[clamp(3rem,11vw,10rem)] font-semibold leading-[0.95] tracking-[-0.05em] text-on-secondary">
          {heroDetails.heading}<span className="sr-only"> {heroDetails.headingAccent}</span>
        </h1>
        <span className="shrink-0 font-display text-xl font-medium leading-none text-on-secondary-muted sm:pb-2 sm:text-3xl md:text-5xl" aria-hidden="true">
          {heroDetails.headingAccent}
        </span>
        <svg className="hero-track pointer-events-none absolute inset-x-0 -bottom-5 h-5 w-full overflow-visible" viewBox="0 0 1200 20" preserveAspectRatio="none" aria-hidden="true">
          <path className="hero-track-base" d="M0 0 H1200" />
          <path className="hero-track-progress" d="M0 0 H1200" pathLength="1" />
        </svg>
      </div>

    </div>

    <div className="relative mx-3 mt-5 sm:mx-5">
    {/* Burung hantu mengintip dari tepi panel: cakarnya mencengkeram garis tepi. Posisi horizontal
        sengaja di celah antara kata SMADARUN dan "2027" supaya tidak menimpa teks. */}
    <Image
      src="/images/logo/burung-hantu.png"
      alt=""
      aria-hidden="true"
      width={640}
      height={437}
      priority
      className="reveal reveal-2 pointer-events-none absolute bottom-full right-[14%] z-10 -mb-px h-9 w-auto sm:right-[18%] sm:h-24 lg:h-32"
    />
    <div className="reveal reveal-2 relative min-h-[31rem] overflow-hidden rounded-t-panel bg-secondary sm:min-h-[34rem] lg:min-h-[36rem]">
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
        {live.comingSoon ? (
          <span className="mt-7 inline-flex min-h-11 w-fit cursor-default items-center justify-center rounded-full bg-surface-sunken px-6 text-sm font-semibold text-muted-foreground">
            Coming Soon
          </span>
        ) : (
        <Link
          href="/daftar"
          className="mt-7 inline-flex min-h-11 w-fit items-center justify-center rounded-full bg-primary px-6 text-sm font-semibold text-on-primary transition-all duration-300 hover:-translate-y-0.5 hover:bg-primary-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-secondary"
        >
          Daftar sekarang
        </Link>
        )}
      </div>
    </div>
    </div>
  </section>
  );
}

export default Hero;

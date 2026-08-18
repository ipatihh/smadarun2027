import Image from 'next/image';
import Link from 'next/link';

import { heroDetails } from '@/data/hero';

/**
 * Hero sengaja hanya memuat satu alur baca: penyelenggara → nama event → tagline →
 * penjelasan singkat → satu aksi utama.
 *
 * Lockup logo kolaborasi (kembar.in × Nganjuk Runners) DIHAPUS dari sini: di layar
 * ponsel ia menambah satu blok penuh sebelum pengunjung sempat membaca nama event,
 * dan logo yang sama sudah punya tempat sendiri di seksi "Didukung oleh" lengkap
 * dengan tingkatannya. Kalau suatu saat ingin dikembalikan, tambahkan sebagai
 * elemen desktop saja (hidden sm:flex) supaya tidak mengorbankan tampilan ponsel.
 */
const Hero: React.FC = () => {
    return (
        <section
            id="beranda"
            className="relative flex items-center justify-center px-5 pb-0 pt-28 sm:pt-32 md:pt-40"
        >
            {/* Latar belakang: garis diagonal "speed lines" */}
            <div className="absolute left-0 top-0 bottom-0 -z-10 w-full" aria-hidden="true">
                <div className="absolute inset-0 h-full w-full bg-hero-background bg-[repeating-linear-gradient(115deg,#80808014_0px,#80808014_1.5px,transparent_1.5px,transparent_40px)] [mask-image:radial-gradient(ellipse_50%_50%_at_50%_50%,#000_60%,transparent_100%)]">
                </div>
            </div>

            <div className="absolute left-0 right-0 bottom-0 h-40 backdrop-blur-[2px] bg-gradient-to-b from-transparent via-[rgba(26,29,33,0.06)] to-[rgba(26,29,33,0.12)]" aria-hidden="true">
            </div>

            <div className="text-center">
                {/* Kicker: penyelenggara event */}
                <p className="reveal text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground sm:text-sm sm:tracking-wider">
                    {heroDetails.kicker}
                </p>

                {/* Nama event — langsung menyambung kalimat "…mempersembahkan" di atasnya */}
                <h1 className="reveal reveal-1 mt-3 font-display text-5xl font-bold uppercase leading-[0.95] tracking-tight text-foreground sm:text-7xl md:text-8xl md:leading-none">
                    {heroDetails.heading} <span className="text-primary-accent">{heroDetails.headingAccent}</span>
                </h1>

                {/* Tagline: kalimat ajakannya, berdiri sebagai barisnya sendiri */}
                <p className="reveal reveal-2 mt-2.5 font-display text-sm uppercase tracking-[0.25em] text-foreground-accent sm:mt-3 sm:text-xl md:text-3xl md:tracking-[0.2em]">
                    {heroDetails.tagline}
                </p>

                <p className="reveal reveal-2 mx-auto mt-5 max-w-sm text-base text-foreground-accent sm:max-w-lg sm:text-lg">
                    {heroDetails.subheading}
                </p>

                {/*
                   Di ponsel hanya SATU tombol yang berbobot; aksi sekunder turun jadi tautan
                   teks supaya tidak ada dua balok besar bertumpuk. Mulai sm: keduanya kembali
                   berdampingan sebagai tombol.
                */}
                <div className="reveal reveal-3 mt-7 flex flex-col items-center justify-center gap-3 sm:mt-8 sm:flex-row sm:gap-4">
                    <Link
                        href="/daftar"
                        className="w-full rounded-full bg-primary px-10 py-4 text-lg font-bold text-on-primary shadow-rest transition-colors hover:bg-primary-accent hover:shadow-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-hero-background sm:w-auto"
                    >
                        Daftar Sekarang
                    </Link>
                    <Link
                        href="#tiket"
                        className="rounded-full px-4 py-2 font-semibold text-foreground-accent underline underline-offset-4 transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-hero-background sm:border sm:border-border-strong sm:px-10 sm:py-4 sm:text-lg sm:font-bold sm:text-foreground sm:no-underline sm:hover:border-foreground"
                    >
                        Lihat Kategori
                    </Link>
                </div>

                {/* Gambar Utama Event (Poster/Jersey) */}
                {heroDetails.centerImageSrc && (
                    <div className="reveal reveal-4">
                        <Image
                            src={heroDetails.centerImageSrc}
                            width={768}
                            height={600}
                            sizes="(max-width: 768px) 100vw, 768px"
                            priority
                            alt="Poster utama SMADARUN 2027"
                            className="relative z-10 mx-auto mt-10 h-auto w-full max-w-3xl rounded-panel shadow-hover md:mt-16"
                        />
                    </div>
                )}
            </div>
        </section>
    );
};

export default Hero;

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

            <div className="w-full text-center">
                {/* Kicker: penyelenggara event */}
                <p className="reveal text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground sm:text-sm sm:tracking-wider">
                    {heroDetails.kicker}
                </p>

                {/* Nama event — langsung menyambung kalimat "…mempersembahkan" di atasnya */}
                <h1 className="reveal reveal-1 mt-3 font-display text-5xl font-bold uppercase leading-[0.95] tracking-tight text-foreground sm:text-7xl md:text-8xl md:leading-none">
                    {heroDetails.heading} <span className="accent-mark">{heroDetails.headingAccent}</span>
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
                        className="w-full rounded-full bg-primary px-8 py-3.5 text-base font-bold text-on-primary shadow-rest transition-colors hover:bg-primary-accent hover:shadow-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-hero-background sm:w-auto sm:px-10 sm:py-4 sm:text-lg"
                    >
                        Daftar Sekarang
                    </Link>
                    <Link
                        href="#tiket"
                        className="rounded-full px-4 py-2 font-semibold text-foreground-accent underline underline-offset-4 transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-hero-background sm:border sm:border-border-strong sm:px-10 sm:py-4 sm:text-lg sm:font-bold sm:text-foreground sm:no-underline sm:hover:border-foreground"
                    >
                        Lihat Kategori
                    </Link>
                </div>

                {/*
                   Gambar utama event. Bingkainya berasio tetap (4:3 di ponsel, 16:9 mulai sm)
                   dan gambarnya object-cover, jadi poster/foto/ilustrasi apa pun yang dipasang
                   panitia di hero.ts tidak mengubah tinggi hero. Subjek utama sebaiknya di
                   tengah karena sisi kiri-kanan terpotong di ponsel.
                */}
                {heroDetails.centerImageSrc && (
                    <div className="reveal reveal-4 relative z-10 mx-auto mt-10 aspect-[4/3] w-full max-w-5xl overflow-hidden rounded-panel bg-surface-sunken shadow-hover sm:aspect-video md:mt-14">
                        <Image
                            src={heroDetails.centerImageSrc}
                            alt={heroDetails.centerImageAlt}
                            fill
                            sizes="(max-width: 1024px) 100vw, 1024px"
                            priority
                            // Image optimizer Next menolak SVG secara default — sajikan langsung.
                            unoptimized={heroDetails.centerImageSrc.toLowerCase().endsWith('.svg')}
                            className="object-cover"
                        />
                    </div>
                )}
            </div>
        </section>
    );
};

export default Hero;

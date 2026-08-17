import Image from 'next/image';
import Link from 'next/link';

import { heroDetails } from '@/data/hero';

const Hero: React.FC = () => {
    return (
        <section
            id="beranda"
            className="relative flex items-center justify-center pb-0 pt-32 md:pt-40 px-5"
        >
            {/* Latar belakang: garis diagonal "speed lines" */}
            <div className="absolute left-0 top-0 bottom-0 -z-10 w-full" aria-hidden="true">
                <div className="absolute inset-0 h-full w-full bg-hero-background bg-[repeating-linear-gradient(115deg,#80808014_0px,#80808014_1.5px,transparent_1.5px,transparent_40px)] [mask-image:radial-gradient(ellipse_50%_50%_at_50%_50%,#000_60%,transparent_100%)]">
                </div>
            </div>

            <div className="absolute left-0 right-0 bottom-0 backdrop-blur-[2px] h-40 bg-gradient-to-b from-transparent via-[rgba(26,29,33,0.06)] to-[rgba(26,29,33,0.12)]" aria-hidden="true">
            </div>

            <div className="text-center">
                {/* Logo kolaborasi penyelenggara */}
                <div className="reveal flex items-center justify-center gap-4 mb-5">
                    <Image
                        src="/images/kembarin2.png"
                        width={160}
                        height={40}
                        alt="Logo SMADA RUN"
                        className="h-10 w-auto object-contain object-center"
                    />
                    <span className="text-muted-foreground font-medium text-sm font-sans" aria-hidden="true">✕</span>
                    <Image
                        src="/images/njr-1.png"
                        width={160}
                        height={40}
                        alt="Logo Nganjuk Runners"
                        className="h-10 w-auto object-contain object-center"
                    />
                </div>

                {/* Kicker: sumber penyelenggara event */}
                <p className="reveal reveal-1 mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                    {heroDetails.kicker}
                </p>

                {/* Judul & Sub-judul Event */}
                <h1 className="reveal reveal-1 text-5xl md:text-7xl md:leading-tight font-bold text-foreground max-w-lg md:max-w-2xl mx-auto">
                    {heroDetails.heading}
                </h1>
                <p className="reveal reveal-2 mt-4 text-foreground max-w-lg mx-auto">
                    {heroDetails.subheading}
                </p>

                {/* Aksi utama & sekunder */}
                <div className="reveal reveal-3 mt-8 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
                    <Link
                        href="/daftar"
                        className="w-full sm:w-auto text-on-primary bg-primary hover:bg-primary-accent px-10 py-4 rounded-full font-bold transition-colors text-lg shadow-rest hover:shadow-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-hero-background"
                    >
                        Daftar Sekarang
                    </Link>
                    <Link
                        href="#tiket"
                        className="w-full sm:w-auto text-foreground border border-border-strong hover:border-foreground px-10 py-4 rounded-full font-bold transition-colors text-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-hero-background"
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
                            className='relative mt-12 md:mt-16 mx-auto z-10 rounded-panel shadow-hover h-auto w-full max-w-3xl'
                        />
                    </div>
                )}
            </div>
        </section>
    );
};

export default Hero;

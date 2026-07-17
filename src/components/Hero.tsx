import React from 'react';
import Image from 'next/image';
import Link from 'next/link';

import { heroDetails } from '@/data/hero';

const Hero: React.FC = () => {
    return (
        <section
            id="hero"
            className="relative flex items-center justify-center pb-0 pt-32 md:pt-40 px-5"
        >
            {/* Latar Belakang Kotak-Kotak / Grid */}
            <div className="absolute left-0 top-0 bottom-0 -z-10 w-full">
                <div className="absolute inset-0 h-full w-full bg-hero-background bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_50%_50%_at_50%_50%,#000_60%,transparent_100%)]">
                </div>
            </div>

            <div className="absolute left-0 right-0 bottom-0 backdrop-blur-[2px] h-40 bg-gradient-to-b from-transparent via-[rgba(233,238,255,0.5)] to-[rgba(202,208,230,0.5)]">
            </div>

            <div className="text-center">
                {/* 🟢 AWAL BLOK LOGO KOLABORASI */}
                <div className="flex items-center justify-center gap-4 mb-6 opacity-90 hover:opacity-100 transition-opacity duration-300">
                    <Image
                        src="/images/kembarin2.png" // 🛠️ Ganti dengan nama file logo SMADA RUN kamu
                        width={160}
                        height={40}
                        alt="Logo SMADA RUN"
                        className="h-10 w-auto object-contain object-center"
                        unoptimized
                    />
                    <span className="text-gray-400 font-medium text-sm font-sans">✕</span>
                    <Image
                        src="/images/njr-1.png" // 🛠️ Ganti dengan nama file logo Nganjuk Runners kamu
                        width={160}
                        height={40}
                        alt="Logo Nganjuk Runners"
                        className="h-10 w-auto object-contain object-center"
                        unoptimized
                    />
                </div>
                {/* 🔴 AKHIR BLOK LOGO KOLABORASI */}

                {/* Judul & Sub-judul Event */}
                <h1 className="text-4xl md:text-6xl md:leading-tight font-bold text-foreground max-w-lg md:max-w-2xl mx-auto">
                    {heroDetails.heading}
                </h1>
                <p className="mt-4 text-foreground max-w-lg mx-auto">
                    {heroDetails.subheading}
                </p>
                
                {/* Tombol Pendaftaran (Menggantikan App Store & Play Store) */}
                <div className="mt-8 flex flex-col sm:flex-row items-center sm:gap-4 w-fit mx-auto">
                    <Link 
                        href="#tiket" 
                        className="text-black bg-primary hover:bg-primary-accent px-10 py-4 rounded-full font-bold transition-colors text-lg shadow-md"
                    >
                        Daftarkan Dirimu Sekarang
                    </Link>
                </div>

                {/* Gambar Utama Event (Poster/Jersey) */}
                {heroDetails.centerImageSrc && (
                    <Image
                        src={heroDetails.centerImageSrc}
                        width={768} // Diperlebar sedikit agar pas untuk ukuran poster/foto lari
                        height={600}
                        quality={100}
                        sizes="(max-width: 768px) 100vw, 600px"
                        priority={true}
                        unoptimized={true}
                        alt="SMADA RUN 2027 Banner Utama"
                        className='relative mt-12 md:mt-16 mx-auto z-10 rounded-2xl shadow-lg' 
                    />
                )}
            </div>
        </section>
    );
};

export default Hero;
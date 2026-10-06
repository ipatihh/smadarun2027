"use client";

import { useState } from "react";
import Image from "next/image";
import Lightbox from "yet-another-react-lightbox";
import Zoom from "yet-another-react-lightbox/plugins/zoom";
import "yet-another-react-lightbox/styles.css";

import { galleryIntro, galleryPhotos } from "@/data/gallery";

/**
 * Galeri dokumentasi event sebelumnya. Foto ditampilkan sesuai rasio aslinya,
 * dengan foto panggung dan garis start selebar konten. Tiga foto di antaranya
 * berbagi satu baris agar susunannya rapat tanpa memotong foto.
 *
 * Klik foto untuk membuka lightbox (memperbesar + navigasi antar foto + zoom).
 * Tiap foto adalah <button> sungguhan: bisa dicapai dengan Tab dan dibuka dengan
 * Enter/Spasi. Dulu pemicunya `figure onClick` — tidak terjangkau keyboard sama sekali.
 */
const tombolFoto =
    "group block w-full cursor-zoom-in overflow-hidden rounded-card bg-surface-sunken text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-background";
const Gallery: React.FC = () => {
    const [lightboxIndex, setLightboxIndex] = useState(-1);

    if (galleryPhotos.length === 0) return null;

    const slides = galleryPhotos.map(({ src, alt, width, height }) => ({ src, alt, width, height }));

    return (
        <section id="galeri" aria-labelledby="galeri-judul" className="pb-10 lg:pb-20">
            <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between sm:gap-6">
                <h2 id="galeri-judul" className="reveal-left text-2xl font-bold text-foreground lg:text-3xl">
                    {galleryIntro.title}
                </h2>
                <p className="reveal-right text-base text-foreground-accent">{galleryIntro.description}</p>
            </div>

            <div className="mt-6 grid grid-cols-1 items-start gap-4 md:grid-cols-[1.507fr_1.343fr_1.446fr]">
                {galleryPhotos.map((foto, index) => (
                    <figure key={foto.src} className={index === 0 || index === galleryPhotos.length - 1 ? "md:col-span-3" : undefined}>
                        <button type="button" onClick={() => setLightboxIndex(index)} className={tombolFoto} aria-label={`Perbesar foto: ${foto.alt}`}>
                            <Image
                                src={foto.src}
                                alt=""
                                width={foto.width}
                                height={foto.height}
                                loading={index === 0 ? "eager" : "lazy"}
                                sizes={index === 0 || index === galleryPhotos.length - 1 ? "(max-width: 1280px) 100vw, 1280px" : "(max-width: 768px) 100vw, (max-width: 1280px) 33vw, 420px"}
                                className="block h-auto w-full transition-opacity duration-300 group-hover:opacity-90"
                            />
                        </button>
                    </figure>
                ))}
            </div>

            <Lightbox
                open={lightboxIndex >= 0}
                close={() => setLightboxIndex(-1)}
                index={lightboxIndex}
                slides={slides}
                plugins={[Zoom]}
                animation={{ fade: 250 }}
                carousel={{ finite: true }}
                styles={{ container: { backgroundColor: "rgb(var(--secondary) / 0.96)" } }}
            />
        </section>
    );
};

export default Gallery;

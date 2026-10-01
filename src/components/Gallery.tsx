"use client";

import { useState } from "react";
import Image from "next/image";
import Lightbox from "yet-another-react-lightbox";
import Zoom from "yet-another-react-lightbox/plugins/zoom";
import "yet-another-react-lightbox/styles.css";

import { galleryIntro, galleryPhotos } from "@/data/gallery";

/**
 * Galeri foto dokumentasi event sebelumnya. Seluruh isinya dari src/data/gallery.ts —
 * foto pertama selalu tampil besar, sisanya kotak-kotak kecil di sebelahnya.
 *
 * Klik foto untuk membuka lightbox (memperbesar + navigasi antar foto + zoom).
 */
const Gallery: React.FC = () => {
    const [lightboxIndex, setLightboxIndex] = useState(-1);

    if (galleryPhotos.length === 0) return null;

    const [utama, ...lainnya] = galleryPhotos;
    const adaLainnya = lainnya.length > 0;

    const slides = galleryPhotos.map((p) => ({ src: p.src, alt: p.alt }));

    return (
        <section id="galeri" aria-labelledby="galeri-judul" className="pb-10 lg:pb-20">
            <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between sm:gap-6">
                <h2 id="galeri-judul" className="reveal-left text-2xl font-bold text-foreground lg:text-3xl">
                    {galleryIntro.title}
                </h2>
                <p className="reveal-right text-base text-foreground-accent">{galleryIntro.description}</p>
            </div>

            <div
                className={`mt-6 grid grid-cols-2 gap-3 sm:gap-4 ${
                    lainnya.length >= 4 ? "lg:grid-cols-4" : "lg:grid-cols-3"
                }`}
            >
                <figure
                    onClick={() => setLightboxIndex(0)}
                    className={`relative col-span-2 aspect-[16/10] cursor-pointer overflow-hidden rounded-card bg-surface-sunken transition-transform duration-200 hover:scale-[1.01] ${
                        adaLainnya ? "lg:row-span-2 lg:aspect-auto" : "lg:col-span-3 lg:aspect-[21/9]"
                    }`}
                >
                    <Image
                        src={utama.src}
                        alt={utama.alt}
                        fill
                        sizes="(max-width: 1024px) 100vw, 800px"
                        className="object-cover"
                    />
                </figure>

                {lainnya.map((foto, index) => {
                    // Foto terakhir yang tersisa sendirian di baris ponsel dilebarkan penuh,
                    // supaya tidak ada petak kosong di sebelahnya.
                    const sendirianDiPonsel = lainnya.length % 2 === 1 && index === lainnya.length - 1;
                    return (
                        <figure
                            key={`${foto.src}-${index}`}
                            onClick={() => setLightboxIndex(index + 1)}
                            className={`relative cursor-pointer overflow-hidden rounded-card bg-surface-sunken transition-transform duration-200 hover:scale-[1.02] ${
                                sendirianDiPonsel
                                    ? "col-span-2 aspect-[16/10] lg:col-span-1 lg:aspect-square"
                                    : "aspect-square"
                            }`}
                        >
                            <Image
                                src={foto.src}
                                alt={foto.alt}
                                fill
                                sizes="(max-width: 1024px) 50vw, 400px"
                                className="object-cover"
                            />
                        </figure>
                    );
                })}
            </div>

            <Lightbox
                open={lightboxIndex >= 0}
                close={() => setLightboxIndex(-1)}
                index={lightboxIndex}
                slides={slides}
                plugins={[Zoom]}
                animation={{ fade: 250 }}
                carousel={{ finite: true }}
                styles={{ container: { backgroundColor: "rgba(0, 0, 0, 0.9)" } }}
            />
        </section>
    );
};

export default Gallery;

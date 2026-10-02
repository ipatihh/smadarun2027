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
 * Tiap foto adalah <button> sungguhan: bisa dicapai dengan Tab dan dibuka dengan
 * Enter/Spasi. Dulu pemicunya `figure onClick` — tidak terjangkau keyboard sama sekali.
 */
const tombolFoto =
    "absolute inset-0 h-full w-full cursor-pointer rounded-card focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-inset focus-visible:ring-focus";
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
                    className={`relative col-span-2 aspect-[16/10] overflow-hidden rounded-card bg-surface-sunken transition-transform duration-200 hover:scale-[1.01] ${
                        adaLainnya ? "lg:row-span-2 lg:aspect-auto" : "lg:col-span-3 lg:aspect-[21/9]"
                    }`}
                >
                    <button type="button" onClick={() => setLightboxIndex(0)} className={tombolFoto} aria-label={`Perbesar foto: ${utama.alt}`}>
                        <Image
                            src={utama.src}
                            alt=""
                            fill
                            sizes="(max-width: 1024px) 100vw, 800px"
                            className="object-cover"
                        />
                    </button>
                </figure>

                {lainnya.map((foto, index) => {
                    // Foto terakhir yang tersisa sendirian di baris ponsel dilebarkan penuh,
                    // supaya tidak ada petak kosong di sebelahnya.
                    const sendirianDiPonsel = lainnya.length % 2 === 1 && index === lainnya.length - 1;
                    return (
                        <figure
                            key={`${foto.src}-${index}`}
                            className={`relative overflow-hidden rounded-card bg-surface-sunken transition-transform duration-200 hover:scale-[1.02] ${
                                sendirianDiPonsel
                                    ? "col-span-2 aspect-[16/10] lg:col-span-1 lg:aspect-square"
                                    : "aspect-square"
                            }`}
                        >
                            <button type="button" onClick={() => setLightboxIndex(index + 1)} className={tombolFoto} aria-label={`Perbesar foto: ${foto.alt}`}>
                                <Image
                                    src={foto.src}
                                    alt=""
                                    fill
                                    sizes="(max-width: 1024px) 50vw, 400px"
                                    className="object-cover"
                                />
                            </button>
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

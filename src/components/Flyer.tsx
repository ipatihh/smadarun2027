"use client";

import { useState } from "react";
import Image from "next/image";
import { FiImage } from "react-icons/fi";
import Lightbox from "yet-another-react-lightbox";
import Zoom from "yet-another-react-lightbox/plugins/zoom";
import "yet-another-react-lightbox/styles.css";

import Eyebrow from "./Eyebrow";
import SectionTitle from "./SectionTitle";
import { flyerIntro, flyerItems } from "@/data/flyer";

/**
 * Flyer rute, jersey, dan medali. Seluruh isinya dari src/data/flyer.ts (di sana ada
 * petunjuk memasang gambar). Item tanpa `src` tampil sebagai kotak "segera hadir" berukuran
 * 4:5 supaya tata letak sudah final sebelum flyernya ada.
 *
 * Ponsel: carousel geser dengan snap (kartu berikutnya mengintip). Desktop: grid, kolom
 * mengikuti jumlah item. Klik gambar membuka lightbox (tombol sungguhan, bisa dengan keyboard).
 */
const tombolFlyer =
    "group block w-full cursor-zoom-in overflow-hidden rounded-photo bg-surface-sunken text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-background";

const Flyer: React.FC = () => {
    const [lightboxIndex, setLightboxIndex] = useState(-1);

    if (flyerItems.length === 0) return null;

    // Hanya flyer yang sudah punya gambar yang ikut lightbox.
    const terisi = flyerItems.filter((item) => item.src);
    const slides = terisi.map((item) => ({
        src: item.src as string,
        alt: item.alt ?? item.title,
        width: item.width,
        height: item.height,
    }));

    const kolom =
        flyerItems.length === 1
            ? "md:mx-auto md:max-w-sm"
            : flyerItems.length === 2
              ? "md:grid-cols-2 md:max-w-3xl md:mx-auto"
              : "md:grid-cols-3";

    return (
        <section id="flyer" aria-labelledby="flyer-judul" className="py-16 lg:py-24">
            <div className="grid gap-4 lg:grid-cols-2 lg:items-end lg:gap-16">
                <div className="reveal-left">
                    <Eyebrow>Info lomba</Eyebrow>
                    <SectionTitle>
                        <h2 id="flyer-judul" className="max-w-md">{flyerIntro.title}</h2>
                    </SectionTitle>
                </div>
                <p className="reveal-right max-w-md text-sm leading-relaxed text-foreground-accent sm:text-base lg:justify-self-end">
                    {flyerIntro.description}
                </p>
            </div>

            <ul
                className={`mt-12 flex snap-x snap-mandatory items-start gap-6 overflow-x-auto pb-4 scrollbar-hide md:grid md:gap-8 md:overflow-x-visible ${kolom}`}
            >
                {flyerItems.map((item) => {
                    const indexLightbox = terisi.indexOf(item);
                    return (
                        <li key={item.title} className="min-w-[78%] snap-center sm:min-w-[55%] md:min-w-0">
                            <figure>
                                {item.src ? (
                                    <button
                                        type="button"
                                        onClick={() => setLightboxIndex(indexLightbox)}
                                        className={tombolFlyer}
                                        aria-label={`Perbesar: ${item.alt ?? item.title}`}
                                    >
                                        <Image
                                            src={item.src}
                                            alt=""
                                            width={item.width ?? 1080}
                                            height={item.height ?? 1350}
                                            loading="lazy"
                                            sizes="(max-width: 768px) 78vw, 400px"
                                            className="photo-warm block h-auto w-full transition-opacity duration-300 group-hover:opacity-90"
                                        />
                                    </button>
                                ) : (
                                    <div
                                        role="img"
                                        aria-label={`${item.title}: flyer segera hadir`}
                                        className="flex aspect-[4/5] w-full flex-col items-center justify-center gap-3 rounded-photo border border-dashed border-border-strong bg-surface-sunken px-6 text-center"
                                    >
                                        <FiImage className="h-6 w-6 text-foreground-accent" aria-hidden="true" />
                                        <p className="text-sm font-semibold text-foreground">Flyer segera hadir</p>
                                        <p className="text-xs text-muted-foreground">Rasio 4:5 · 1080 × 1350 px</p>
                                    </div>
                                )}
                                <figcaption className="mt-2 text-xs tracking-[0.02em] text-muted-foreground">{item.title}</figcaption>
                            </figure>
                        </li>
                    );
                })}
            </ul>

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

export default Flyer;

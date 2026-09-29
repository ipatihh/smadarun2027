import Image from "next/image";

import { galleryIntro, galleryPhotos } from "@/data/gallery";

/**
 * Galeri foto dokumentasi event sebelumnya. Seluruh isinya dari src/data/gallery.ts —
 * foto pertama selalu tampil besar, sisanya kotak-kotak kecil di sebelahnya.
 *
 * Inilah tempat foto yang dulu menempel di tiga blok zig-zag Benefits: fotonya tetap
 * punya tempat, tanpa membuat halaman di ponsel memanjang tiga layar.
 */
const Gallery: React.FC = () => {
    if (galleryPhotos.length === 0) return null;

    const [utama, ...lainnya] = galleryPhotos;
    const adaLainnya = lainnya.length > 0;

    return (
        <section id="galeri" aria-labelledby="galeri-judul" className="pb-10 lg:pb-20">
            <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between sm:gap-6">
                <h2 id="galeri-judul" className="text-2xl font-bold text-foreground lg:text-3xl">
                    {galleryIntro.title}
                </h2>
                <p className="text-base text-foreground-accent">{galleryIntro.description}</p>
            </div>

            <div
                className={`mt-6 grid grid-cols-2 gap-3 sm:gap-4 ${
                    lainnya.length >= 4 ? "lg:grid-cols-4" : "lg:grid-cols-3"
                }`}
            >
                <figure
                    className={`relative col-span-2 aspect-[16/10] overflow-hidden rounded-card bg-surface-sunken ${
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
                            className={`relative overflow-hidden rounded-card bg-surface-sunken ${
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
        </section>
    );
};

export default Gallery;

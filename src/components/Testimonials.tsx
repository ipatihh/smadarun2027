
import React from 'react';
import Image from 'next/image';
import { testimonials } from '@/data/testimonials';
import { stats } from '@/data/stats';
import SectionTitle from './SectionTitle';

const Testimonials: React.FC = () => {
    return (
        <section id="testimonials" className="scroll-mt-24 py-16 lg:py-24">
            {/*
               Angka statistik menumpang di kepala seksi ini, bukan seksi sendiri: keduanya
               sama-sama bukti sosial, dan satu seksi penuh untuk tiga angka (salah satunya
               "5K" yang sudah jadi nama kategori tiket) hanya menambah panjang halaman.
            */}
            <div className="mb-10 flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
                <div className="reveal-left max-w-xl">
                    <SectionTitle>
                        <h2 className="mb-4">Apa Kata Mereka?</h2>
                    </SectionTitle>
                    <p className="text-sm leading-relaxed text-foreground-accent sm:text-base">
                        Kesan dan cerita dari para pelari yang sudah pernah bergabung.
                    </p>
                </div>
                {stats.length > 0 && (
                    <ul className="reveal-right flex gap-8 border-l border-border pl-6 sm:gap-10 sm:pl-8">
                        {stats.map(stat => (
                            <li key={stat.title}>
                                <p className="font-display text-3xl font-semibold leading-none text-foreground sm:text-4xl">{stat.title}</p>
                                <p className="mt-2 max-w-[10rem] text-sm text-foreground-accent">{stat.description}</p>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
            {/*
               Mobile: carousel geser dengan snap; desktop: grid 3 kolom.
               scrollbar-hide kini benar-benar ada (didefinisikan di globals.css).
            */}
            <div
            className="flex lg:grid lg:grid-cols-3 gap-6 lg:gap-8 overflow-x-auto lg:overflow-x-visible snap-x snap-mandatory pb-6 max-w-full mx-auto scrollbar-hide"
        >
            {testimonials.map((testimonial, index) => (
                <div
                    key={index}
                    /* Kartu berikutnya mengintip di ponsel sebagai petunjuk carousel. */
                    className="relative flex min-w-[85%] snap-center flex-col justify-between overflow-hidden rounded-card border border-border bg-card p-6 transition-[border-color,transform] duration-300 hover:-translate-y-0.5 hover:border-border-strong md:min-w-[45%] lg:min-w-full"
                >
                    <span className="font-display absolute top-3 right-5 text-6xl text-primary-accent/40 select-none leading-none" aria-hidden="true">&rdquo;</span>
                    <div>
                        <div className="flex items-center mb-4 w-full justify-start">
                            <Image
                                src={testimonial.avatar}
                                alt={`${testimonial.name} avatar`}
                                width={50}
                                height={50}
                                className="rounded-full shadow-rest object-cover"
                            />
                            <div className="ml-4 text-left">
                                <h3 className="text-base sm:text-lg font-semibold text-foreground">{testimonial.name}</h3>
                                <p className="text-sm text-foreground-accent">{testimonial.role}</p>
                            </div>
                        </div>
                        {/* Mengubah text-center di mobile menjadi text-left agar lebih rapi saat di-slide */}
                        <p className="text-foreground-accent text-left text-sm leading-relaxed">&quot;{testimonial.message}&quot;</p>
                    </div>
                </div>
            ))}
            </div>
        </section>
    );
};

export default Testimonials;

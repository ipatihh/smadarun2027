
import React from 'react';
import Image from 'next/image';
import { testimonials } from '@/data/testimonials';
import { stats } from '@/data/stats';
import SectionTitle from './SectionTitle';
import Eyebrow from './Eyebrow';

const Testimonials: React.FC = () => {
    return (
        <section id="testimonials" className="scroll-mt-24 py-16 lg:py-28">
            {/*
               Angka statistik menumpang di kepala seksi ini, bukan seksi sendiri: keduanya
               sama-sama bukti sosial, dan satu seksi penuh untuk tiga angka (salah satunya
               "5K" yang sudah jadi nama kategori tiket) hanya menambah panjang halaman.
            */}
            <div className="mb-10 flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
                <div className="reveal-left max-w-xl">
                    <Eyebrow>Cerita pelari</Eyebrow>
                    <SectionTitle>
                        <h2 className="mb-4">Apa Kata Mereka?</h2>
                    </SectionTitle>
                    <p className="text-sm leading-relaxed text-foreground-accent sm:text-base">
                        Kesan dan cerita dari para pelari yang sudah pernah bergabung.
                    </p>
                </div>
                {stats.length > 0 && (
                    <ul className="reveal-right flex gap-8 border-l border-border-strong/60 pl-6 sm:gap-10 sm:pl-8">
                        {stats.map(stat => (
                            <li key={stat.title}>
                                <p className="font-display text-4xl font-medium leading-none text-foreground sm:text-5xl">{stat.title}</p>
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
            <div className="mx-auto flex max-w-full snap-x snap-mandatory gap-8 overflow-x-auto pb-6 scrollbar-hide lg:grid lg:grid-cols-3 lg:gap-12 lg:overflow-x-visible">
                {testimonials.map((testimonial, index) => (
                    <figure
                        key={index}
                        /* Kartu berikutnya mengintip di ponsel sebagai petunjuk carousel. */
                        className="flex min-w-[85%] snap-center flex-col justify-between border-t border-border-strong/60 pt-6 md:min-w-[45%] lg:min-w-full"
                    >
                        <blockquote className="text-lg font-normal leading-relaxed text-foreground">
                            &ldquo;{testimonial.message}&rdquo;
                        </blockquote>
                        <figcaption className="mt-6 flex items-center">
                            <Image
                                src={testimonial.avatar}
                                alt={`${testimonial.name} avatar`}
                                width={44}
                                height={44}
                                className="rounded-full object-cover"
                            />
                            <div className="ml-4 text-left">
                                <p className="text-sm font-semibold text-foreground">{testimonial.name}</p>
                                <p className="text-sm text-foreground-accent">{testimonial.role}</p>
                            </div>
                        </figcaption>
                    </figure>
                ))}
            </div>
        </section>
    );
};

export default Testimonials;


import React from 'react';
import Image from 'next/image';
import { testimonials } from '@/data/testimonials';
import SectionTitle from './SectionTitle';

const Testimonials: React.FC = () => {
    return (
        <section id="testimonials" className="scroll-mt-24 py-10 lg:py-20">
            <SectionTitle>
                <h2 className="text-center mb-4">Apa Kata Mereka?</h2>
            </SectionTitle>
            <p className="mb-12 text-center text-foreground-accent">
                Kesan dan cerita seru dari para pelari yang telah bergabung di event kami sebelumnya.
            </p>
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
                    /*
                       MENGUBAH KARTU TESTIMONI:
                       - min-w-[85%] di HP agar kartu berikutnya agak mengintip (memberi petunjuk bisa di-slide)
                       - lg:min-w-full di desktop agar ukurannya pas mengikuti kolom grid
                       - snap-center membuat kartu otomatis mengunci di tengah layar saat di-swipe
                       - offset vertikal selang-seling di desktop supaya tidak rata sempurna seperti tabel
                    */
                    className={`min-w-[85%] md:min-w-[45%] lg:min-w-full snap-center bg-card border border-border p-6 rounded-card shadow-rest hover:shadow-hover transition-all duration-300 flex flex-col justify-between relative overflow-hidden ${index % 2 !== 0 ? "lg:translate-y-6" : ""}`}
                >
                    <span className="font-display absolute -top-3 right-4 text-7xl text-primary/25 select-none leading-none" aria-hidden="true">&rdquo;</span>
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
                                <h3 className="text-lg font-semibold text-secondary">{testimonial.name}</h3>
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
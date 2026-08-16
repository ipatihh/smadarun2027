"use client";

import React from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { testimonials } from '@/data/testimonials';
import { revealContainer, revealChild } from '@/lib/motion';

const Testimonials: React.FC = () => {
    return (
        /*
           MENGUBAH CONTAINER UTAMA:
           - Di HP/Tablet (default): flex, bisa di-slide kesamping (overflow-x-auto), efek magnet (snap-x snap-mandatory)
           - Di Desktop (lg:): berubah otomatis jadi grid 3 kolom kembali (lg:grid lg:grid-cols-3)
           - Ditambahkan kelas scrollbar-hide agar bar scroller di bawahnya tidak mengganggu estetika
        */
        <motion.div
            className="flex lg:grid lg:grid-cols-3 gap-6 lg:gap-8 overflow-x-auto lg:overflow-x-visible snap-x snap-mandatory pb-6 max-w-full mx-auto scrollbar-hide"
            variants={revealContainer}
            initial="offscreen"
            whileInView="onscreen"
            viewport={{ once: true }}
        >
            {testimonials.map((testimonial, index) => (
                <motion.div
                    key={index}
                    variants={revealChild}
                    /*
                       MENGUBAH KARTU TESTIMONI:
                       - min-w-[85%] di HP agar kartu berikutnya agak mengintip (memberi petunjuk bisa di-slide)
                       - lg:min-w-full di desktop agar ukurannya pas mengikuti kolom grid
                       - snap-center membuat kartu otomatis mengunci di tengah layar saat di-swipe
                       - offset vertikal selang-seling di desktop supaya tidak rata sempurna seperti tabel
                    */
                    className={`min-w-[85%] md:min-w-[45%] lg:min-w-full snap-center bg-card border border-border p-6 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 flex flex-col justify-between relative overflow-hidden ${index % 2 !== 0 ? "lg:translate-y-6" : ""}`}
                >
                    <span className="font-display absolute -top-3 right-4 text-7xl text-primary/25 select-none leading-none" aria-hidden="true">&rdquo;</span>
                    <div>
                        <div className="flex items-center mb-4 w-full justify-start">
                            <Image
                                src={testimonial.avatar}
                                alt={`${testimonial.name} avatar`}
                                width={50}
                                height={50}
                                className="rounded-full shadow-md object-cover"
                            />
                            <div className="ml-4 text-left">
                                <h3 className="text-lg font-semibold text-secondary">{testimonial.name}</h3>
                                <p className="text-sm text-foreground-accent">{testimonial.role}</p>
                            </div>
                        </div>
                        {/* Mengubah text-center di mobile menjadi text-left agar lebih rapi saat di-slide */}
                        <p className="text-foreground-accent text-left text-sm leading-relaxed">&quot;{testimonial.message}&quot;</p>
                    </div>
                </motion.div>
            ))}
        </motion.div>
    );
};

export default Testimonials;
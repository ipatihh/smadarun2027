"use client";

import React from "react";
import { motion } from "framer-motion";
import { ctaDetails } from "@/data/cta";
import { revealContainer, revealChild } from "@/lib/motion";

const CTA: React.FC = () => {
    return (
        <section id="cta" className="mt-10 mb-5 lg:my-20">
            <div className="relative h-full w-full z-10 mx-auto py-12 sm:py-20">
                <div className="h-full w-full">
                    {/* Panel diagonal — bukan grid generik */}
                    <div className="rounded-3xl overflow-hidden absolute inset-0 -z-10 h-full w-full bg-secondary">
                        <div className="absolute inset-0 bg-secondary-accent [clip-path:polygon(0_0,38%_0,15%_100%,0_100%)]"></div>
                        <div className="absolute inset-0 bg-secondary-accent opacity-40 [clip-path:polygon(48%_0,58%_0,32%_100%,22%_100%)]"></div>
                    </div>

                    <motion.div
                        className="h-full flex flex-col items-center justify-center text-white text-center px-5"
                        variants={revealContainer}
                        initial="offscreen"
                        whileInView="onscreen"
                        viewport={{ once: true }}
                    >
                        {/* Judul Ajakan */}
                        <motion.h2 variants={revealChild} className="text-4xl sm:text-5xl md:text-6xl md:leading-tight font-bold mb-4 max-w-3xl">
                            {ctaDetails.heading}
                        </motion.h2>

                        {/* Sub-judul Penjelas */}
                        <motion.p variants={revealChild} className="mx-auto max-w-xl md:px-5 text-gray-300 mb-8 leading-relaxed">
                            {ctaDetails.subheading}
                        </motion.p>

                        {/* Transformasi Tombol: Mengganti Tombol App ke Tombol Registrasi Berwarna Kuning */}
                        <motion.div variants={revealChild} className="w-full max-w-sm mx-auto">
                            <a
                                href="/daftar" // Silakan ganti tanda # dengan link pendaftaran panitia jika sudah ada
                                target="_blank"
                                rel="noopener noreferrer"
                                className="block w-full text-center bg-primary hover:bg-primary-accent text-black font-bold py-4 px-8 rounded-full text-lg transition-all duration-300 transform hover:-translate-y-1 shadow-[0_4px_20px_rgba(254,216,53,0.3)] hover:shadow-[0_6px_25px_rgba(254,216,53,0.5)] active:scale-[0.98]"
                            >
                                Daftar SMADARUN 2027 Sekarang
                            </a>
                        </motion.div>
                    </motion.div>
                </div>
            </div>
        </section>
    );
};

export default CTA;
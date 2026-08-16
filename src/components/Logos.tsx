"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { revealChild } from "@/lib/motion";

const Logos: React.FC = () => {
    return (
        <section id="logos" className="py-8 lg:py-12 px-5 bg-background">
            <motion.div
                variants={revealChild}
                initial="offscreen"
                whileInView="onscreen"
                viewport={{ once: true }}
                className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center gap-5 sm:gap-10 border-t border-b border-border py-6"
            >
                <p className="text-sm font-semibold uppercase tracking-wider text-muted-foreground shrink-0">
                    Didukung oleh<br className="hidden sm:block" /> <span className="text-secondary">Sponsor & Partner</span>
                </p>
                <div className="w-full flex flex-wrap flex-row items-center justify-center sm:justify-end gap-6 sm:gap-10 opacity-60 logos-container">

                    {/* Sponsor 1 */}
                    <div className="w-28 sm:w-36 h-12 relative flex items-center justify-center">
                        <Image
                            src="/images/kembarin3.png"
                            alt="Sponsor 1"
                            fill
                            sizes="144px"
                            className="object-contain grayscale hover:grayscale-0 transition-all"
                        />
                    </div>

                    {/* Sponsor 2 */}
                    <div className="w-28 sm:w-36 h-12 relative flex items-center justify-center">
                        <Image
                            src="/images/kembarin2.png"
                            alt="Sponsor 2"
                            fill
                            sizes="144px"
                            className="object-contain grayscale hover:grayscale-0 transition-all"
                        />
                    </div>

                    {/* Tambahkan pembungkus div di atas sebanyak jumlah sponsor kamu */}

                </div>
            </motion.div>
        </section>
    )
}

export default Logos

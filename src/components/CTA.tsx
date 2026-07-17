import React from "react";
import { ctaDetails } from "@/data/cta";

const CTA: React.FC = () => {
    return (
        <section id="cta" className="mt-10 mb-5 lg:my-20">
            <div className="relative h-full w-full z-10 mx-auto py-12 sm:py-20">
                <div className="h-full w-full">
                    {/* Background Grid Efek Minimalis */}
                    <div className="rounded-3xl opacity-95 absolute inset-0 -z-10 h-full w-full bg-[#050a02] bg-[linear-gradient(to_right,#12170f_1px,transparent_1px),linear-gradient(to_bottom,#12170f_1px,transparent_1px)] bg-[size:6rem_4rem]">
                        <div className="rounded-3xl absolute bottom-0 left-0 right-0 top-0 bg-[radial-gradient(circle_600px_at_50%_500px,#1C1C02,transparent)]"></div>
                    </div>

                    <div className="h-full flex flex-col items-center justify-center text-white text-center px-5">
                        {/* Judul Ajakan */}
                        <h2 className="text-3xl sm:text-4xl md:text-5xl md:leading-tight font-bold mb-4 max-w-3xl">
                            {ctaDetails.heading}
                        </h2>

                        {/* Sub-judul Penjelas */}
                        <p className="mx-auto max-w-xl md:px-5 text-gray-300 mb-8 leading-relaxed">
                            {ctaDetails.subheading}
                        </p>

                        {/* Transformasi Tombol: Mengganti Tombol App ke Tombol Registrasi Berwarna Kuning */}
                        <div className="w-full max-w-sm mx-auto">
                            <a
                                href="/daftar" // Silakan ganti tanda # dengan link pendaftaran panitia jika sudah ada
                                target="_blank"
                                rel="noopener noreferrer"
                                className="block w-full text-center bg-[#FCD34D] hover:bg-[#FBBF24] text-black font-bold py-4 px-8 rounded-2xl text-lg transition-all duration-300 transform hover:-translate-y-1 shadow-[0_4px_20px_rgba(252,211,77,0.3)] hover:shadow-[0_6px_25px_rgba(252,211,77,0.5)] active:scale-[0.98]"
                            >
                                Daftar SMADARUN 2027 Sekarang
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default CTA;
"use client"; // Diperlukan karena kita menggunakan fungsi interaktif (useState)

import Link from 'next/link';
import React, { useState } from 'react';
import { FaRunning, FaShieldAlt, FaFileContract } from 'react-icons/fa'; 

import { siteDetails } from '@/data/siteDetails';
import { footerDetails } from '@/data/footer';
import { getPlatformIconByName } from '@/utils';

const Footer: React.FC = () => {
    // State untuk mengontrol buka/tutup modal pop-up
    const [modalType, setModalType] = useState<'privacy' | 'terms' | null>(null);

    return (
        <footer className="bg-hero-background text-foreground py-10 relative">
            <div className="max-w-7xl w-full mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-10">
                <div>
                    <Link href="/" className="flex items-center gap-2">
                        <FaRunning className="min-w-fit w-5 h-5 md:w-7 md:h-7 text-[#FCD34D]" />
                        <h3 className="manrope text-xl font-semibold cursor-pointer">
                            {siteDetails.siteName}
                        </h3>
                    </Link>
                    <p className="mt-3.5 text-foreground-accent">
                        {footerDetails.subheading}
                    </p>
                </div>
                <div>
                    <h4 className="text-lg font-semibold mb-4">Quick Links</h4>
                    <ul className="text-foreground-accent">
                        {footerDetails.quickLinks.map(link => (
                            <li key={link.text} className="mb-2">
                                <Link href={link.url} className="hover:text-foreground">{link.text}</Link>
                            </li>
                        ))}
                    </ul>
                </div>
                <div>
                    <h4 className="text-lg font-semibold mb-4">Contact Us</h4>

                    {footerDetails.email && <a href={`mailto:${footerDetails.email}`}  className="block text-foreground-accent hover:text-foreground">Email: {footerDetails.email}</a>}

                    {footerDetails.telephone && <a href={`tel:${footerDetails.telephone}`} className="block text-foreground-accent hover:text-foreground">Phone: {footerDetails.telephone}</a>}

                    {footerDetails.socials && (
                        <div className="mt-5 flex items-center gap-5 flex-wrap">
                            {Object.keys(footerDetails.socials).map(platformName => {
                                if (platformName && footerDetails.socials[platformName]) {
                                    return (
                                        <Link
                                            href={footerDetails.socials[platformName]}
                                            key={platformName}
                                            aria-label={platformName}
                                        >
                                            {getPlatformIconByName(platformName)}
                                        </Link>
                                    )
                                }
                            })}
                        </div>
                    )}
                </div>
            </div>

            <div className="mt-8 text-center text-foreground-accent px-6 border-t border-border pt-6">
                <p>Copyright &copy; {siteDetails.siteName}. All rights reserved.</p>
                
                {/* 🟢 BLOK MODIFIKASI: Tombol Pemicu Pop-up Legalitas */}
                <div className="flex justify-center items-center gap-4 mt-2 text-sm text-gray-500">
                    <button 
                        onClick={() => setModalType('privacy')} 
                        className="hover:text-foreground flex items-center gap-1.5 transition outline-none"
                    >
                        <FaShieldAlt className="w-3.5 h-3.5 text-[#FCD34D]" /> Kebijakan Privasi
                    </button>
                    <span>•</span>
                    <button 
                        onClick={() => setModalType('terms')} 
                        className="hover:text-foreground flex items-center gap-1.5 transition outline-none"
                    >
                        <FaFileContract className="w-3.5 h-3.5 text-[#FCD34D]" /> Syarat & Ketentuan
                    </button>
                </div>

                <p className="text-sm mt-3 text-gray-500">
                    Developed by{' '}
                    <a 
                        href="https://kembar.in" 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="text-secondary hover:underline font-medium"
                    >
                        kembar.in
                    </a>
                </p>
            </div>

            {/* 🟢 BLOK POP-UP MODAL (Kombinasi Privacy Policy & Terms & Conditions) */}
            {modalType && (
                <div 
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex justify-center items-center p-4"
                    onClick={() => setModalType(null)} // Klik di luar box untuk menutup
                >
                    <div 
                        className="bg-white text-gray-900 p-6 md:p-8 rounded-2xl max-w-lg w-full shadow-2xl border border-gray-100 relative animate-fadeIn"
                        onClick={(e) => e.stopPropagation()} // Mencegah tertutup tidak sengaja jika teks diklik
                    >
                        {/* Tombol Silang */}
                        <button 
                            onClick={() => setModalType(null)} 
                            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-2xl font-bold font-sans focus:outline-none"
                        >
                            &times;
                        </button>

                        {/* Konten Kebijakan Privasi */}
                        {modalType === 'privacy' && (
                            <div>
                                <div className="flex items-center gap-2 mb-4 text-gray-800">
                                    <FaShieldAlt className="w-6 h-6 text-[#FCD34D]" />
                                    <h4 className="text-xl font-black tracking-tight uppercase">Kebijakan Privasi</h4>
                                </div>
                                <div className="text-sm text-gray-600 space-y-3 max-h-[60vh] overflow-y-auto pr-2 leading-relaxed">
                                    <p>Panitia <strong>SMADARUN 2027</strong> berkomitmen penuh untuk menjaga keamanan dan kerahasiaan data pribadi Anda.</p>
                                    <p><strong>1. Pengumpulan Data:</strong> Kami mengumpulkan informasi identitas resmi berupa Nama Lengkap, Email, NIK, Nomor WhatsApp, dan Ukuran Jersey untuk keperluan validasi kepesertaan, asuransi keselamatan, dan distribusi Paket Lari (Race Pack).</p>
                                    <p><strong>2. Keamanan Dokumen:</strong> File bukti transfer pembayaran yang Anda unggah disimpan dalam infrastruktur digital kami yang aman dan hanya digunakan oleh tim verifikasi internal.</p>
                                    <p><strong>3. Rahasia Pihak Ketiga:</strong> Seluruh database yang terkumpul melalui portal pendaftaran ini tidak akan diperjualbelikan atau disebarluaskan kepada pihak eksternal di luar kepentingan operasional resmi event.</p>
                                </div>
                            </div>
                        )}

                        {/* Konten Syarat & Ketentuan */}
                        {modalType === 'terms' && (
                            <div>
                                <div className="flex items-center gap-2 mb-4 text-gray-800">
                                    <FaFileContract className="w-6 h-6 text-[#FCD34D]" />
                                    <h4 className="text-xl font-black tracking-tight uppercase">Syarat & Ketentuan</h4>
                                </div>
                                <div className="text-sm text-gray-600 space-y-3 max-h-[60vh] overflow-y-auto pr-2 leading-relaxed">
                                    <p>Dengan mendaftarkan diri di <strong>SMADARUN 2027</strong>, Anda dianggap menyetujui seluruh aturan kepesertaan di bawah ini:</p>
                                    <p><strong>1. Kebijakan Tiket & Pembatalan:</strong> Tiket pendaftaran serta biaya administrasi sistem (Rp3.000) yang telah dibayarkan bersifat final, mengikat, dan <strong>tidak dapat di-refund</strong> atau dibatalkan sepihak dengan alasan pribadi apa pun.</p>
                                    <p><strong>2. Aturan Jersey:</strong> Pilihan ukuran jersey lari yang sudah Anda konfirmasi di formulir tidak dapat ditukar atau diubah kembali pada saat pengambilan Paket Lari (Race Pack) demi kelancaran manajemen produksi.</p>
                                    <p><strong>3. Tanggung Jawab Kesehatan:</strong> Setiap peserta menyatakan dirinya dalam kondisi fisik dan medis yang sehat untuk mengikuti jarak tempuh lomba lari ini serta bertanggung jawab penuh atas keselamatan dirinya masing-masing.</p>
                                </div>
                            </div>
                        )}

                        <button 
                            onClick={() => setModalType(null)} 
                            className="mt-6 w-full py-2.5 bg-gray-900 hover:bg-gray-800 text-white font-bold text-sm rounded-xl transition"
                        >
                            Saya Mengerti
                        </button>
                    </div>
                </div>
            )}
        </footer>
    );
};

export default Footer;
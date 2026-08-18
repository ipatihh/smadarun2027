"use client"; // Diperlukan karena kita menggunakan fungsi interaktif (useState)

import Link from 'next/link';
import React, { useState } from 'react';
import { Dialog, DialogPanel, DialogTitle } from '@headlessui/react';
import { FaRunning, FaShieldAlt, FaFileContract } from 'react-icons/fa'; 

import { siteDetails } from '@/data/siteDetails';
import { footerDetails } from '@/data/footer';
import { getPlatformIconByName } from '@/utils';

interface FooterProps {
    /**
     * Biaya layanan platform per transaksi — live dari kembarin-v2 lewat layout.tsx.
     * WAJIB dari data live: nominal ini pernah di-hardcode "Rp3.000" di Syarat & Ketentuan
     * padahal admin sudah mengubahnya jadi Rp2.000, sehingga dokumen yang disetujui peserta
     * menyebut angka yang berbeda dengan yang benar-benar ditagihkan.
     */
    adminFee: number;
}

const Footer: React.FC<FooterProps> = ({ adminFee }) => {
    // State untuk mengontrol buka/tutup modal pop-up
    const [modalType, setModalType] = useState<'privacy' | 'terms' | null>(null);
    const adminFeeLabel = `Rp${adminFee.toLocaleString('id-ID')}`;

    return (
        <footer className="bg-hero-background text-foreground py-10 relative">
            <div className="max-w-7xl w-full mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-10">
                <div>
                    <Link href="/" className="flex items-center gap-2">
                        <FaRunning className="min-w-fit w-5 h-5 md:w-7 md:h-7 text-primary-accent" />
                        <h3 className="font-display text-xl font-semibold cursor-pointer">
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
                <div className="flex justify-center items-center gap-4 mt-2 text-sm text-muted-foreground">
                    <button 
                        onClick={() => setModalType('privacy')} 
                        className="hover:text-foreground flex items-center gap-1.5 transition outline-none"
                    >
                        <FaShieldAlt className="w-3.5 h-3.5 text-primary-accent" /> Kebijakan Privasi
                    </button>
                    <span>•</span>
                    <button 
                        onClick={() => setModalType('terms')} 
                        className="hover:text-foreground flex items-center gap-1.5 transition outline-none"
                    >
                        <FaFileContract className="w-3.5 h-3.5 text-primary-accent" /> Syarat & Ketentuan
                    </button>
                </div>

                <p className="text-sm mt-3 text-muted-foreground">
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

            {/*
               Modal legal memakai Dialog dari Headless UI (sudah jadi dependency):
               dapat ditutup dengan Escape, fokus terkunci di dalam dialog, dan fokus
               dikembalikan ke tombol pemicu saat ditutup — sebelumnya semua itu tidak ada.
            */}
            <Dialog open={modalType !== null} onClose={() => setModalType(null)} className="relative z-50">
                <div className="fixed inset-0 bg-overlay backdrop-blur-sm" aria-hidden="true" />
                <div className="fixed inset-0 flex justify-center items-center p-4">
                    <DialogPanel className="bg-card text-foreground p-6 md:p-8 rounded-card max-w-lg w-full shadow-hover border border-border relative">
                        <button
                            onClick={() => setModalType(null)}
                            className="absolute top-4 right-4 rounded-full px-2 text-muted-foreground hover:text-foreground-accent text-2xl font-bold font-sans focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                        >
                            <span aria-hidden="true">&times;</span>
                            <span className="sr-only">Tutup</span>
                        </button>

                        {/* Konten Kebijakan Privasi */}
                        {modalType === 'privacy' && (
                            <div>
                                <DialogTitle className="flex items-center gap-2 mb-4 text-foreground text-xl font-black tracking-tight uppercase">
                                    <FaShieldAlt className="w-6 h-6 text-primary-accent shrink-0" aria-hidden="true" />
                                    Kebijakan Privasi
                                </DialogTitle>
                                <div className="text-sm text-foreground-accent space-y-3 max-h-[60vh] overflow-y-auto pr-2 leading-relaxed">
                                    <p>Panitia <strong>SMADARUN 2027</strong> berkomitmen menjaga keamanan dan kerahasiaan data pribadi Anda, sesuai UU No. 27 Tahun 2022 tentang Pelindungan Data Pribadi.</p>
                                    <p><strong>1. Data yang dikumpulkan:</strong> Nama lengkap, alamat email, NIK, nomor WhatsApp, jenis kelamin, kota domisili, dan ukuran jersey. Data ini dipakai untuk validasi kepesertaan, pendataan asuransi/keselamatan, dan distribusi Race Pack.</p>
                                    <p><strong>2. Dasar pemrosesan:</strong> Persetujuan Anda, yang diberikan lewat kotak centang di formulir pendaftaran. Anda boleh menolak, dengan konsekuensi pendaftaran tidak dapat diproses.</p>
                                    <p><strong>3. Pihak yang ikut memproses:</strong> Data pendaftaran diproses oleh <strong>kembar.in</strong> selaku penyedia sistem pendaftaran resmi event ini, dan data transaksi diproses oleh <strong>DOKU</strong> selaku penyedia gerbang pembayaran. Panitia tidak pernah menerima atau menyimpan data kartu/rekening Anda.</p>
                                    <p><strong>4. Penyebarluasan:</strong> Data peserta tidak diperjualbelikan dan tidak dibagikan ke pihak lain di luar keperluan operasional resmi event dan kewajiban hukum yang berlaku.</p>
                                    <p><strong>5. Penyimpanan & hak Anda:</strong> Data disimpan selama penyelenggaraan event dan keperluan administrasi setelahnya. Anda berhak meminta akses, koreksi, atau penghapusan data dengan menghubungi <a className="font-semibold underline underline-offset-2" href={`mailto:${footerDetails.email}`}>{footerDetails.email}</a>.</p>
                                </div>
                            </div>
                        )}

                        {/* Konten Syarat & Ketentuan */}
                        {modalType === 'terms' && (
                            <div>
                                <DialogTitle className="flex items-center gap-2 mb-4 text-foreground text-xl font-black tracking-tight uppercase">
                                    <FaFileContract className="w-6 h-6 text-primary-accent shrink-0" aria-hidden="true" />
                                    Syarat &amp; Ketentuan
                                </DialogTitle>
                                <div className="text-sm text-foreground-accent space-y-3 max-h-[60vh] overflow-y-auto pr-2 leading-relaxed">
                                    <p>Dengan mendaftarkan diri di <strong>SMADARUN 2027</strong>, Anda dianggap menyetujui seluruh aturan kepesertaan di bawah ini:</p>
                                    <p><strong>1. Kebijakan Tiket &amp; Pembatalan:</strong> Tiket pendaftaran{adminFee > 0 ? ` serta biaya layanan sistem (${adminFeeLabel} per tiket)` : ''} yang telah dibayarkan bersifat final, mengikat, dan <strong>tidak dapat di-refund</strong> atau dibatalkan sepihak dengan alasan pribadi apa pun. Nominal biaya layanan yang berlaku selalu ditampilkan pada rincian biaya sebelum Anda membayar.</p>
                                    <p><strong>2. Aturan Jersey:</strong> Pilihan ukuran jersey lari yang sudah Anda konfirmasi di formulir tidak dapat ditukar atau diubah kembali pada saat pengambilan Paket Lari (Race Pack) demi kelancaran manajemen produksi.</p>
                                    <p><strong>3. Tanggung Jawab Kesehatan:</strong> Setiap peserta menyatakan dirinya dalam kondisi fisik dan medis yang sehat untuk mengikuti jarak tempuh lomba lari ini serta bertanggung jawab penuh atas keselamatan dirinya masing-masing.</p>
                                </div>
                            </div>
                        )}

                        <button
                            onClick={() => setModalType(null)}
                            className="mt-6 w-full py-2.5 bg-secondary hover:bg-secondary-accent text-on-secondary font-bold text-sm rounded-full transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-card"
                        >
                            Saya Mengerti
                        </button>
                    </DialogPanel>
                </div>
            </Dialog>
        </footer>
    );
};

export default Footer;
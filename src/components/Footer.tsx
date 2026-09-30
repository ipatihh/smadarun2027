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
     * Biaya layanan platform per tiket — live dari kembarin-v2 lewat FooterLive.tsx.
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
        <footer className="bg-hero-background text-foreground pt-12 pb-36 md:py-12 relative">
            <div className="max-w-7xl w-full mx-auto px-6 flex flex-col gap-10 md:flex-row md:justify-between">
                <div className="max-w-sm">
                    <Link href="/" className="inline-flex items-center gap-2 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
                        <FaRunning className="min-w-fit w-6 h-6 text-foreground" aria-hidden="true" />
                        <span className="font-display text-xl font-semibold">
                            {siteDetails.siteName}
                        </span>
                    </Link>
                    <p className="mt-3.5 text-base text-foreground-accent">
                        {footerDetails.subheading}
                    </p>
                </div>

                {/* Tautan navigasi sengaja tidak diulang di sini — semuanya sudah ada di header. */}
                <div>
                    <h2 className="text-lg font-semibold mb-3">Kontak panitia</h2>
                    <ul className="space-y-1 text-base text-foreground-accent">
                        {footerDetails.email && (
                            <li>
                                <a href={`mailto:${footerDetails.email}`} className="hover:text-foreground">{footerDetails.email}</a>
                            </li>
                        )}
                        {footerDetails.telephone && (
                            <li>
                                <a href={`tel:${footerDetails.telephone.replace(/[^\d+]/g, '')}`} className="hover:text-foreground">{footerDetails.telephone}</a>
                            </li>
                        )}
                    </ul>

                    {footerDetails.socials && (
                        <div className="mt-5 flex items-center gap-5 flex-wrap text-foreground-accent">
                            {Object.keys(footerDetails.socials).map(platformName => {
                                if (platformName && footerDetails.socials[platformName]) {
                                    return (
                                        <a
                                            href={footerDetails.socials[platformName]}
                                            key={platformName}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            aria-label={platformName}
                                            className="rounded transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                                        >
                                            {getPlatformIconByName(platformName)}
                                        </a>
                                    )
                                }
                            })}
                        </div>
                    )}
                </div>
            </div>

            <div className="max-w-7xl mx-auto mt-10 px-6">
                <div className="flex flex-col items-center gap-3 border-t border-border pt-6 text-sm text-muted-foreground md:flex-row md:justify-between">
                    <p>&copy; {siteDetails.siteName}. Hak cipta dilindungi.</p>

                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setModalType('privacy')}
                            className="rounded transition hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                        >
                            Kebijakan Privasi
                        </button>
                        <span aria-hidden="true">·</span>
                        <button
                            onClick={() => setModalType('terms')}
                            className="rounded transition hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                        >
                            Syarat &amp; Ketentuan
                        </button>
                    </div>

                    <p>
                        Dikembangkan oleh{' '}
                        <a
                            href="https://kembar.in"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-medium text-foreground hover:underline underline-offset-4"
                        >
                            PT KEMBAR INOVASI
                        </a>
                    </p>
                </div>
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
                                <DialogTitle className="flex items-center gap-2 mb-4 text-foreground text-2xl font-bold">
                                    <FaShieldAlt className="w-6 h-6 text-foreground-accent shrink-0" aria-hidden="true" />
                                    Kebijakan Privasi
                                </DialogTitle>
                                <div className="text-sm text-foreground-accent space-y-3 max-h-[60vh] overflow-y-auto pr-2 leading-relaxed">
                                    <p>Panitia <strong>SMADARUN 2027</strong> berkomitmen menjaga keamanan dan kerahasiaan data pribadi Anda, sesuai UU No. 27 Tahun 2022 tentang Pelindungan Data Pribadi.</p>
                                    <p><strong>1. Data yang dikumpulkan:</strong> Nama lengkap, alamat email, NIK, nomor WhatsApp, jenis kelamin, kota domisili, dan ukuran jersey. Data ini dipakai untuk validasi kepesertaan, pendataan asuransi/keselamatan, dan distribusi Race Pack.</p>
                                    <p><strong>2. Dasar pemrosesan:</strong> Persetujuan Anda, yang diberikan lewat kotak centang di formulir pendaftaran. Anda boleh menolak, dengan konsekuensi pendaftaran tidak dapat diproses.</p>
                                    <p><strong>3. Pihak yang ikut memproses:</strong> Data pendaftaran dan transaksi diproses secara terintegrasi oleh <strong><a href="https://kembar.in" target="_blank" rel="noopener noreferrer" className="underline hover:text-foreground">PT KEMBAR INOVASI</a></strong> selaku <i>ticketing partner</i> resmi event ini. Panitia tidak pernah menerima atau menyimpan data kartu/rekening Anda.</p>
                                    <p><strong>4. Penyebarluasan:</strong> Data peserta tidak diperjualbelikan dan tidak dibagikan ke pihak lain di luar keperluan operasional resmi event dan kewajiban hukum yang berlaku.</p>
                                    <p><strong>5. Penyimpanan & hak Anda:</strong> Data disimpan selama penyelenggaraan event dan keperluan administrasi setelahnya. Anda berhak meminta akses, koreksi, atau penghapusan data dengan menghubungi <a className="font-semibold underline underline-offset-2" href={`mailto:${footerDetails.email}`}>{footerDetails.email}</a>.</p>
                                </div>
                            </div>
                        )}

                        {/* Konten Syarat & Ketentuan */}
                        {modalType === 'terms' && (
                            <div>
                                <DialogTitle className="flex items-center gap-2 mb-4 text-foreground text-2xl font-bold">
                                    <FaFileContract className="w-6 h-6 text-foreground-accent shrink-0" aria-hidden="true" />
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
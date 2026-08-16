'use client';

import Link from 'next/link';
import React, { useState } from 'react';
import { usePathname } from 'next/navigation'; // 1. Tambahkan import untuk membaca URL aktif
import { Transition } from '@headlessui/react';
import { HiOutlineXMark, HiBars3 } from 'react-icons/hi2';
import { FaRunning } from 'react-icons/fa';

import Container from './Container';
import { siteDetails } from '@/data/siteDetails';
import { menuItems } from '@/data/menuItems';

const Header: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const pathname = usePathname(); // 2. Ambil path URL saat ini (misal: '/' atau '/daftar')

    const toggleMenu = () => {
        setIsOpen(!isOpen);
    };

    // 3. Fungsi pembantu untuk memodifikasi URL secara dinamis
    const formatUrl = (url: string) => {
        // Jika URL diawali dengan '#' (anchor scroll) dan kita sedang tidak di beranda ('/')
        if (url.startsWith('#') && pathname !== '/') {
            return `/${url}`; // Mengubah '#tiket' menjadi '/#tiket'
        }
        return url; // Tetap biarkan asli jika sudah di beranda atau bukan link anchor
    };

    return (
        /* 
           PERUBAHAN UTAMA DI SINI:
           - Di HP: tetap menggunakan 'fixed' bawaan agar aman.
           - Di Desktop (md:): diubah menjadi 'md:fixed md:bg-white/90 md:backdrop-blur-md md:shadow-sm'.
             Ini membuat header terkunci di atas saat di-scroll, berubah warna jadi putih transparan (efek kaca),
             dan memberikan bayangan tipis agar terpisah dari konten di bawahnya.
        */
        <header className="bg-transparent fixed top-0 left-0 right-0 md:fixed md:bg-white/90 md:backdrop-blur-md md:shadow-sm z-50 mx-auto w-full transition-all duration-300">
            <Container className="!px-0">
                {/* Menyesuaikan padding desktop (md:py-4) agar saat melayang tidak terlalu tebal */}
                <nav className="shadow-md md:shadow-none bg-white md:bg-transparent mx-auto flex justify-between items-center py-2 px-5 md:py-4 transition-all">
                    {/* Logo */}
                    <Link href="/" className="flex items-center gap-2">
                        <FaRunning className="text-foreground min-w-fit w-7 h-7" />
                        <span className="font-display text-xl font-semibold text-foreground cursor-pointer">
                            {siteDetails.siteName}
                        </span>
                    </Link>

                    {/* Desktop Menu */}
                    <ul className="hidden md:flex space-x-6 items-center">
                        {menuItems.map(item => (
                            <li key={item.text}>
                                {/* 4. Terapkan fungsi formatUrl(item.url) di sini */}
                                <Link href={formatUrl(item.url)} className="text-foreground hover:text-foreground-accent transition-colors font-medium">
                                    {item.text}
                                </Link>
                            </li>
                        ))}
                    </ul>

                    {/* Mobile Menu Button */}
                    <div className="md:hidden flex items-center">
                        <button
                            onClick={toggleMenu}
                            type="button"
                            className="bg-primary text-black focus:outline-none rounded-full w-10 h-10 flex items-center justify-center"
                            aria-controls="mobile-menu"
                            aria-expanded={isOpen}
                        >
                            {isOpen ? (
                                <HiOutlineXMark className="h-6 w-6" aria-hidden="true" />
                            ) : (
                                <HiBars3 className="h-6 w-6" aria-hidden="true" />
                            )}
                            <span className="sr-only">Toggle navigation</span>
                        </button>
                    </div>
                </nav>
            </Container>

            {/* Mobile Menu with Transition */}
            <Transition
                show={isOpen}
                enter="transition ease-out duration-200 transform"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="transition ease-in duration-75 transform"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
            >
                <div id="mobile-menu" className="md:hidden bg-white shadow-lg">
                    <ul className="flex flex-col space-y-4 pt-1 pb-6 px-6">
                        {menuItems.map(item => (
                            <li key={item.text}>
                                {/* 5. Terapkan juga fungsi formatUrl(item.url) untuk menu mobile */}
                                <Link href={formatUrl(item.url)} className="text-foreground hover:text-primary block" onClick={toggleMenu}>
                                    {item.text}
                                </Link>
                            </li>
                        ))}
                    </ul>
                </div>
            </Transition>
        </header>
    );
};

export default Header;
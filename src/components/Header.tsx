'use client';

import Link from 'next/link';
import React, { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { Transition } from '@headlessui/react';
import { HiOutlineXMark, HiBars3 } from 'react-icons/hi2';
import { FaRunning } from 'react-icons/fa';

import Container from './Container';
import { siteDetails } from '@/data/siteDetails';
import { menuItems } from '@/data/menuItems';

const Header: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [isScrolled, setIsScrolled] = useState(false);
    const pathname = usePathname();

    const toggleMenu = () => {
        setIsOpen(!isOpen);
    };

    // Header transparan saat di puncak halaman, lalu memadat (latar + garis bawah)
    // begitu digulir — supaya hero tidak terpotong bar putih, tapi menu tetap terbaca
    // di atas konten apa pun.
    useEffect(() => {
        const onScroll = () => setIsScrolled(window.scrollY > 16);
        onScroll();
        window.addEventListener('scroll', onScroll, { passive: true });
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    // Anchor '#tiket' hanya valid di beranda; di halaman lain jadikan '/#tiket'.
    const formatUrl = (url: string) => {
        if (url.startsWith('#') && pathname !== '/') {
            return `/${url}`;
        }
        return url;
    };

    const isDaftarPage = pathname === '/daftar';
    const isSolid = isScrolled || isOpen || isDaftarPage;

    return (
        <header
            className={`fixed top-0 left-0 right-0 z-50 mx-auto w-full transition-all duration-300 ${
                isSolid ? 'bg-card/90 backdrop-blur-md border-b border-border shadow-rest' : 'bg-transparent'
            }`}
        >
            <Container className="!px-0">
                <nav aria-label="Navigasi utama" className="mx-auto flex justify-between items-center gap-4 py-3 px-5 md:py-4">
                    <Link href="/" className="flex items-center gap-2 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background">
                        <FaRunning className="text-foreground min-w-fit w-7 h-7" />
                        <span className="font-display text-xl font-semibold text-foreground">
                            {siteDetails.siteName}
                        </span>
                    </Link>

                    {/* Menu Desktop */}
                    <ul className="hidden md:flex space-x-6 items-center">
                        {menuItems.map(item => (
                            <li key={item.text}>
                                <Link
                                    href={formatUrl(item.url)}
                                    className="text-foreground hover:text-foreground-accent transition-colors font-medium rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-4 focus-visible:ring-offset-background"
                                >
                                    {item.text}
                                </Link>
                            </li>
                        ))}
                    </ul>

                    {/* Aksi utama — sebelumnya tidak ada sama sekali di navigasi */}
                    <div className="hidden md:block">
                        {!isDaftarPage && (
                            <Link
                                href="/daftar"
                                className="inline-flex items-center rounded-full bg-primary hover:bg-primary-accent text-on-primary font-bold px-6 py-2.5 text-sm uppercase tracking-wide shadow-rest hover:shadow-hover transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                            >
                                Daftar
                            </Link>
                        )}
                    </div>

                    {/* Aksi utama + tombol menu (mobile) */}
                    <div className="md:hidden flex items-center gap-2">
                        {!isDaftarPage && (
                            <Link
                                href="/daftar"
                                className="inline-flex items-center rounded-full bg-primary hover:bg-primary-accent text-on-primary font-bold px-4 py-2 text-xs uppercase tracking-wide shadow-rest transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                            >
                                Daftar
                            </Link>
                        )}
                        <button
                            onClick={toggleMenu}
                            type="button"
                            className="bg-surface-sunken text-foreground rounded-full w-10 h-10 flex items-center justify-center border border-border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                            aria-controls="mobile-menu"
                            aria-expanded={isOpen}
                        >
                            {isOpen ? (
                                <HiOutlineXMark className="h-6 w-6" aria-hidden="true" />
                            ) : (
                                <HiBars3 className="h-6 w-6" aria-hidden="true" />
                            )}
                            <span className="sr-only">Buka/tutup navigasi</span>
                        </button>
                    </div>
                </nav>
            </Container>

            {/* Menu Mobile */}
            <Transition
                show={isOpen}
                enter="transition ease-out duration-200 transform"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="transition ease-in duration-75 transform"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
            >
                <div id="mobile-menu" className="md:hidden bg-card border-t border-border shadow-hover">
                    <ul className="flex flex-col space-y-1 pt-2 pb-6 px-6">
                        {menuItems.map(item => (
                            <li key={item.text}>
                                <Link
                                    href={formatUrl(item.url)}
                                    className="block py-2 text-foreground hover:text-foreground-accent font-medium rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                                    onClick={toggleMenu}
                                >
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

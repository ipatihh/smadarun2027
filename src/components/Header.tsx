'use client';

import Link from 'next/link';
import React, { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { Transition } from '@headlessui/react';
import { HiOutlineXMark, HiBars3 } from 'react-icons/hi2';

import Container from './Container';
import { siteDetails } from '@/data/siteDetails';
import { menuItems } from '@/data/menuItems';
import { logoEvent, teksHeaderDisembunyikan } from '@/data/logo';
import BrandLogo from './BrandLogo';

const Header: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [isScrolled, setIsScrolled] = useState(false);
    const pathname = usePathname();

    const toggleMenu = () => {
        setIsOpen(!isOpen);
    };

    // Header tetap selebar viewport. Saat digulir, latar menguat dan progres tipis
    // membantu orientasi tanpa menambah bar aksi atau menutup konten.
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
            className={`fixed inset-x-0 top-0 z-50 w-full border-b transition-[background-color,box-shadow,border-color] duration-500 ease-out ${
                isSolid
                    ? 'border-border bg-card/95 shadow-rest backdrop-blur-xl'
                    : 'border-transparent bg-transparent'
            }`}
        >
            <Container className="!px-0">
                <nav aria-label="Navigasi utama" className={`mx-auto flex items-center justify-between gap-4 px-4 transition-[padding] duration-500 sm:px-5 ${isScrolled ? 'py-2.5 md:py-3' : 'py-3 md:py-4'}`}>
                    <Link href="/" className="group flex items-center gap-2 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-background">
                        <BrandLogo logo={logoEvent} className="h-8 sm:h-9" decorative={!teksHeaderDisembunyikan} priority />
                        {!teksHeaderDisembunyikan && (
                            <span className="font-display text-base font-semibold tracking-[0.02em] text-foreground sm:text-lg">
                                {siteDetails.siteName}
                            </span>
                        )}
                        <span className="h-1.5 w-1.5 rounded-full bg-primary-accent opacity-0 transition-[opacity,transform] duration-300 group-hover:translate-x-0.5 group-hover:opacity-100 group-focus-visible:opacity-100" aria-hidden="true" />
                    </Link>

                    {/* Menu Desktop */}
                    <ul className="hidden md:flex space-x-7 items-center text-sm">
                        {menuItems.map(item => (
                            <li key={item.text}>
                                <Link
                                    href={formatUrl(item.url)}
                                    className="group relative rounded py-2 text-foreground transition-colors hover:text-foreground-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-4 focus-visible:ring-offset-background"
                                >
                                    {item.text}
                                    <span className="absolute inset-x-0 bottom-0 h-px origin-left scale-x-0 bg-primary-accent transition-transform duration-300 group-hover:scale-x-100 group-focus-visible:scale-x-100" aria-hidden="true" />
                                </Link>
                            </li>
                        ))}
                    </ul>

                    {/* Aksi utama — sebelumnya tidak ada sama sekali di navigasi */}
                    <div className="hidden md:block">
                        {!isDaftarPage && (
                            <Link
                                href="/daftar"
                                className="inline-flex min-h-10 items-center justify-center rounded-full bg-primary px-5 text-sm font-semibold text-on-primary transition-all duration-300 hover:-translate-y-0.5 hover:bg-primary-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-background"
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
                                className="inline-flex min-h-10 items-center justify-center rounded-full bg-primary px-4 text-sm font-semibold text-on-primary shadow-rest transition-all duration-300 hover:-translate-y-0.5 hover:bg-primary-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                            >
                                Daftar
                            </Link>
                        )}
                        <button
                            onClick={toggleMenu}
                            type="button"
                            className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-surface-sunken text-foreground transition-[background-color,border-color] duration-300 hover:border-border-strong hover:bg-primary/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-background"
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
                <div id="mobile-menu" className="border-t border-border bg-card shadow-hover md:hidden">
                    <ul className="flex flex-col space-y-1 pt-2 pb-6 px-6">
                        {menuItems.map(item => (
                            <li key={item.text}>
                                <Link
                                    href={formatUrl(item.url)}
                                    className="block rounded py-2 font-medium text-foreground transition-colors hover:text-foreground-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
                                    onClick={toggleMenu}
                                >
                                    {item.text}
                                </Link>
                            </li>
                        ))}
                    </ul>
                </div>
            </Transition>
            <span className="header-scroll-progress pointer-events-none absolute inset-x-0 bottom-0 h-px origin-left bg-primary-accent" aria-hidden="true" />
        </header>
    );
};

export default Header;

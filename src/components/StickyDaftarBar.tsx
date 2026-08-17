"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

interface Props {
  // Harga tiket termurah (live dari kembarin-v2). null = pendaftaran tidak dibuka /
  // belum ada kategori, bar tidak ditampilkan sama sekali.
  lowestPrice: number | null;
}

/**
 * Bar aksi melayang khusus mobile. Muncul setelah pengunjung melewati hero, supaya
 * tombol daftar selalu berada dalam jangkauan ibu jari tanpa perlu menggulir balik
 * ke atas atau ke kartu tiket.
 */
const StickyDaftarBar: React.FC<Props> = ({ lowestPrice }) => {
  const pathname = usePathname();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setIsVisible(window.scrollY > 420);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Tidak relevan di halaman formulir itu sendiri.
  if (pathname !== "/" || lowestPrice === null) return null;

  return (
    <div
      className={`md:hidden fixed inset-x-0 bottom-0 z-40 transition-transform duration-300 ${
        isVisible ? "translate-y-0" : "translate-y-full"
      }`}
      aria-hidden={!isVisible}
    >
      <div className="flex items-center gap-3 border-t border-border bg-card/95 px-5 py-3 shadow-hover backdrop-blur-md [padding-bottom:max(0.75rem,env(safe-area-inset-bottom))]">
        <div className="min-w-0">
          <div className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
            Tiket mulai
          </div>
          <div className="font-display text-xl font-bold leading-none text-foreground">
            Rp {lowestPrice.toLocaleString("id-ID")}
          </div>
        </div>
        <Link
          href="/daftar"
          tabIndex={isVisible ? 0 : -1}
          className="ml-auto shrink-0 rounded-full bg-primary px-7 py-3 text-sm font-extrabold uppercase tracking-wide text-on-primary shadow-rest transition-colors hover:bg-primary-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-card"
        >
          Daftar
        </Link>
      </div>
    </div>
  );
};

export default StickyDaftarBar;

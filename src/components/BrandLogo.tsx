import Image from "next/image";

import { ILogo } from "@/types";

interface BrandLogoProps {
    logo: ILogo;
    /** Kelas tinggi, mis. "h-8 sm:h-9". Lebar mengikuti rasio asli. */
    className?: string;
    /** Dekoratif (alt kosong) bila sudah ada teks di sebelahnya; false bila logo berdiri sendiri. */
    decorative?: boolean;
    priority?: boolean;
}

/**
 * Logo kecil dari src/data/logo.ts. Tidak merender apa pun bila `src` belum diisi, jadi
 * pemanggil tidak perlu memeriksanya. Tanpa lightbox: logo hanya penanda identitas.
 */
const BrandLogo: React.FC<BrandLogoProps> = ({ logo, className = "h-8", decorative = true, priority = false }) => {
    if (!logo.src) return null;
    return (
        <Image
            src={logo.src}
            alt={decorative ? "" : logo.alt}
            width={logo.width ?? 200}
            height={logo.height ?? 200}
            priority={priority}
            unoptimized={logo.src.toLowerCase().endsWith(".svg")}
            className={`w-auto shrink-0 ${className}`}
        />
    );
};

export default BrandLogo;

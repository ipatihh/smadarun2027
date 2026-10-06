interface EyebrowProps {
    children: React.ReactNode;
    /** Rata tengah (dipakai seksi yang judulnya di tengah). */
    center?: boolean;
    className?: string;
}

/**
 * Label kecil di atas judul seksi — gaya yang sama dengan kicker hero, supaya
 * semua seksi punya ritme pembuka yang seragam.
 */
const Eyebrow: React.FC<EyebrowProps> = ({ children, center = false, className = "" }) => (
    <p
        className={`mb-4 flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.16em] text-foreground-accent sm:text-[13px] ${
            center ? "justify-center" : ""
        } ${className}`}
    >
        <span className="h-px w-8 bg-primary-accent" aria-hidden="true" />
        {children}
        {center && <span className="h-px w-8 bg-primary-accent" aria-hidden="true" />}
    </p>
);

export default Eyebrow;

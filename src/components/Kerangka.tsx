/**
 * Potongan kerangka (skeleton) bersama untuk loading.tsx dan keadaan "memeriksa".
 * Warna lewat token (bg-surface-sunken) supaya mode gelap ikut; animasi `animate-pulse`
 * otomatis mengikuti prefers-reduced-motion (Tailwind menghormatinya lewat globals.css).
 */
export const Baris = ({ className = "" }: { className?: string }) => (
  <div className={`animate-pulse rounded-full bg-surface-sunken ${className}`} aria-hidden="true" />
);

export const Blok = ({ className = "" }: { className?: string }) => (
  <div className={`animate-pulse rounded-field bg-surface-sunken ${className}`} aria-hidden="true" />
);

/** Kerangka ringkasan pembayaran: ikon, judul, kalimat, empat baris, kotak info. Sama bentuknya dengan RingkasanLunas. */
export const KerangkaRingkasan = ({ judul, kode }: { judul?: string; kode?: string }) => (
  <div role="status" aria-live="polite" aria-busy="true">
    <div className="h-12 w-12 animate-pulse rounded-full bg-surface-sunken" aria-hidden="true" />
    {judul ? (
      <h1 className="mt-6 font-display text-2xl font-semibold tracking-[-0.02em] text-foreground">{judul}</h1>
    ) : (
      <Baris className="mt-6 h-7 w-64" />
    )}
    {kode && <p className="mt-2 font-mono text-xs text-muted-foreground">{kode}</p>}
    <div className="mt-3 space-y-2">
      <Baris className="h-3 w-full" />
      <Baris className="h-3 w-3/4" />
    </div>
    <div className="mt-7 divide-y divide-border border-y border-border">
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className="flex items-center justify-between gap-5 py-3.5">
          <Baris className="h-3 w-24" />
          <Baris className="h-3 w-32" />
        </div>
      ))}
    </div>
    <Blok className="mt-6 h-16 w-full" />
  </div>
);

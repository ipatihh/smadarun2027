/**
 * Kerangka beranda selagi Server Component menunggu data live kembarin-v2.
 * Bentuknya sengaja meniru tata letak asli (hero → panel countdown → kartu tiket)
 * supaya perpindahan ke konten sungguhan tidak terasa melompat.
 *
 * Tanpa file ini, Next.js tidak menampilkan apa pun sampai render server selesai —
 * pengunjung hanya melihat layar diam dan mengira halaman macet.
 */
const Baris = ({ className = "" }: { className?: string }) => (
  <div className={`animate-pulse rounded-full bg-surface-sunken ${className}`} />
);

export default function LoadingBeranda() {
  return (
    <div className="px-5 pt-28 sm:pt-32 md:pt-40" aria-busy="true" aria-live="polite">
      <span className="sr-only">Memuat halaman…</span>

      {/* Hero */}
      <div className="mx-auto flex max-w-2xl flex-col items-center gap-4 text-center">
        <Baris className="h-3 w-56" />
        <Baris className="h-12 w-72 sm:h-16 sm:w-[26rem]" />
        <Baris className="h-3 w-40" />
        <div className="mt-2 w-full space-y-2">
          <Baris className="mx-auto h-3 w-full max-w-sm" />
          <Baris className="mx-auto h-3 w-4/5 max-w-xs" />
        </div>
        <Baris className="mt-4 h-14 w-full max-w-xs" />
      </div>

      {/* Gambar utama */}
      <div className="mx-auto mt-10 h-56 w-full max-w-3xl animate-pulse rounded-panel bg-surface-sunken sm:h-80" />

      {/* Panel hitung mundur */}
      <div className="mx-auto mt-8 h-40 w-full max-w-4xl animate-pulse rounded-panel bg-surface-sunken" />

      {/* Kartu tiket */}
      <div className="mx-auto mt-10 flex w-full max-w-4xl flex-col gap-6 md:flex-row">
        {[0, 1].map((i) => (
          <div
            key={i}
            className="h-72 w-full animate-pulse rounded-t-panel rounded-bl-lg rounded-br-panel bg-surface-sunken"
          />
        ))}
      </div>
    </div>
  );
}

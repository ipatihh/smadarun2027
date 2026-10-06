import { Baris, Blok } from "@/components/Kerangka";

/**
 * Kerangka beranda selagi Server Component menunggu data live kembarin-v2. Meniru tata letak
 * tema Warm Editorial persis (kicker → judul besar + garis tipis → foto selebar layar →
 * panel hari lomba menumpuk di tepi foto → pembuka seksi Fasilitas), supaya pindah ke konten
 * sungguhan tidak melompat. Ukuran/jarak harus tetap sama dengan Hero.tsx & EventInfo.tsx.
 *
 * Tanpa file ini, Next.js tidak menampilkan apa pun sampai render server selesai —
 * pengunjung hanya melihat layar diam dan mengira halaman macet.
 */
export default function LoadingBeranda() {
  return (
    <div aria-busy="true" aria-live="polite">
      <span className="sr-only">Memuat halaman…</span>

      <div className="hero-atmosphere relative isolate overflow-hidden pt-28 sm:pt-36">
        <div className="hero-grid pointer-events-none absolute inset-0 -z-10" aria-hidden="true" />

        <div className="mx-auto max-w-7xl px-5">
          {/* Kicker */}
          <div className="flex items-center gap-3">
            <div className="h-px w-8 bg-border-strong" aria-hidden="true" />
            <Baris className="h-3 w-56 !bg-border" />
          </div>

          {/* Judul besar + 2027, garis tipis di bawahnya */}
          <div className="relative mt-6 flex items-end justify-between gap-4 pb-5">
            <Baris className="h-[clamp(2.9rem,10.5vw,9rem)] w-[72%] max-w-4xl !rounded-field !bg-border" />
            <Baris className="h-6 w-14 !bg-border sm:h-9 sm:w-24" />
            <div className="absolute inset-x-0 -bottom-5 h-px bg-border" aria-hidden="true" />
          </div>
        </div>

        {/* Foto selebar layar, tinggi sama dengan Hero */}
        <div className="relative mt-5 min-h-[31rem] animate-pulse bg-secondary/80 sm:min-h-[34rem] lg:min-h-[36rem]">
          <div className="mx-auto max-w-7xl px-6 pt-9 sm:px-10 sm:pt-11 lg:px-14 lg:pt-14">
            <div className="h-9 w-64 animate-pulse rounded-field bg-on-secondary/15 sm:h-12 sm:w-96" />
            <div className="mt-4 h-3 w-48 animate-pulse rounded-full bg-on-secondary/10" />
            <div className="mt-7 h-11 w-44 animate-pulse rounded-full bg-primary/40" />
          </div>
        </div>
      </div>

      {/* Panel hari lomba, menumpuk di tepi bawah foto (sama dengan EventInfo) */}
      <div className="relative z-20 -mt-10 px-5 sm:-mt-14">
        <div className="mx-auto h-44 max-w-5xl rounded-panel bg-secondary sm:h-48" />
      </div>

      {/* Pembuka seksi Fasilitas: label, judul, tiga butir bergaris tipis */}
      <div className="mx-auto max-w-7xl px-5 py-20 lg:py-32">
        <div className="flex items-center gap-3">
          <div className="h-px w-8 bg-border-strong" aria-hidden="true" />
          <Baris className="h-3 w-24" />
        </div>
        <Blok className="mt-4 h-10 w-full max-w-md sm:h-12" />
        <div className="mt-14 grid gap-x-12 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="border-t border-border-strong/60 pt-6">
              <Baris className="h-3 w-8" />
              <Baris className="mt-6 h-5 w-48" />
              <Baris className="mt-3 h-3 w-full" />
              <Baris className="mt-2 h-3 w-4/5" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

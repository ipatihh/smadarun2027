import { Baris, Blok } from "@/components/Kerangka";

/**
 * Kerangka halaman pendaftaran. Meniru DaftarForm: latar + grid halus, judul, ringkasan event
 * (flyer, keterangan; di atas formulir di ponsel, di kiri di desktop), satu kartu formulir bertahap
 * (penanda tiga langkah, penghitung tiket, tiga isian pemesan, navigasi), dan bar bawah di ponsel — supaya tidak ada lompatan tata letak begitu data live selesai.
 * Pembungkus & jarak harus tetap sama dengan DaftarForm.tsx.
 */
const BlokIsian = () => (
  <div className="space-y-2">
    <Baris className="h-2.5 w-28" />
    <Blok className="h-12 w-full" />
  </div>
);

export default function LoadingDaftar() {
  return (
    <div className="registration-atmosphere relative min-h-screen px-5 pb-40 pt-28 lg:pb-24" aria-busy="true" aria-live="polite">
      <span className="sr-only">Memuat formulir pendaftaran…</span>
      <div className="registration-grid pointer-events-none absolute inset-0 -z-10" aria-hidden="true" />

      <div className="mx-auto w-full max-w-2xl lg:max-w-5xl">
        <Blok className="mb-7 h-9 w-72 sm:h-10 sm:w-96" />

        <div className="lg:grid lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)] lg:items-start lg:gap-6">
        <div className="mb-6 rounded-panel border border-border bg-card p-5 lg:mb-0" aria-hidden="true">
          <div className="space-y-2.5">
            <Baris className="h-3 w-48" />
            <Baris className="h-3 w-40" />
            <Baris className="h-3 w-36" />
          </div>
          <Baris className="mt-4 h-3 w-full" />
        </div>

        <div className="min-w-0 rounded-panel border border-border bg-card p-5 sm:p-8">
          {/* Penanda tiga langkah */}
          <div className="grid grid-cols-3 gap-3" aria-hidden="true">
            {[0, 1, 2].map((i) => (
              <div key={i}>
                <div className="h-1 animate-pulse rounded-full bg-surface-sunken" />
                <Baris className="mt-2 h-3 w-20" />
              </div>
            ))}
          </div>

          <div className="mt-8 space-y-6">
            <Blok className="h-[4.25rem] w-full" />
            <div className="space-y-2">
              <Baris className="h-5 w-36" />
              <Baris className="h-3 w-64 max-w-full" />
            </div>
            <BlokIsian />
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <BlokIsian />
              <BlokIsian />
            </div>
          </div>

          <div className="mt-8 flex justify-end border-t border-border pt-6">
            <Blok className="hidden h-12 w-64 !rounded-full lg:block" />
          </div>
        </div>
        </div>
      </div>

      {/* Bar bawah ponsel — sama bentuknya dengan bar aslinya (total kiri, tombol pendek kanan) */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card/95 lg:hidden" aria-hidden="true">
        <div className="mx-auto flex max-w-xl items-center gap-4 px-5 py-3 [padding-bottom:max(0.75rem,env(safe-area-inset-bottom))]">
          <div className="space-y-2">
            <Baris className="h-2.5 w-20" />
            <Baris className="h-5 w-28" />
          </div>
          <div className="ml-auto flex w-36 shrink-0 flex-col items-center gap-1.5 sm:w-44">
            <Blok className="h-11 w-full !rounded-full" />
            <Baris className="h-2 w-24" />
          </div>
        </div>
      </div>
    </div>
  );
}

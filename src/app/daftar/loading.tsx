import { Baris, Blok } from "@/components/Kerangka";

/**
 * Kerangka portal pendaftaran. Meniru DaftarForm: latar + grid halus, kepala (label, judul besar,
 * pengantar, caption), kartu formulir tiga tahap di kiri, ringkasan pesanan di kanan (desktop),
 * dan bar bayar bawah di ponsel — supaya tidak ada lompatan tata letak begitu data live selesai.
 * Pembungkus & jarak harus tetap sama dengan DaftarForm.tsx.
 */
const BlokIsian = () => (
  <div className="space-y-2">
    <Baris className="h-2.5 w-28" />
    <Blok className="h-12 w-full" />
  </div>
);

const Tahap = ({ children }: { children: React.ReactNode }) => (
  <div className="space-y-5">
    <div className="flex items-center gap-3">
      <div className="h-8 w-8 animate-pulse rounded-full bg-surface-sunken" aria-hidden="true" />
      <Baris className="h-4 w-40" />
    </div>
    {children}
  </div>
);

export default function LoadingDaftar() {
  return (
    <div className="registration-atmosphere relative min-h-screen px-5 pb-40 pt-28 lg:pb-24" aria-busy="true" aria-live="polite">
      <span className="sr-only">Memuat formulir pendaftaran…</span>
      <div className="registration-grid pointer-events-none absolute inset-0 -z-10" aria-hidden="true" />

      <div className="mx-auto w-full max-w-6xl">
        {/* Kepala: label, judul, pengantar, caption */}
        <div className="mb-10 max-w-2xl">
          <div className="mb-4 flex items-center gap-3">
            <div className="h-px w-8 bg-border-strong" aria-hidden="true" />
            <Baris className="h-3 w-52" />
          </div>
          <Blok className="h-9 w-72 sm:h-12 sm:w-[30rem]" />
          <Baris className="mt-4 h-3 w-full max-w-md" />
          <Baris className="mt-3 h-3 w-48" />
        </div>

        <div className="grid grid-cols-1 gap-7 lg:grid-cols-[minmax(0,1fr)_20rem]">
          <div className="space-y-8 rounded-panel border border-border bg-card p-5 sm:p-8 lg:p-10">
            <Tahap>
              <BlokIsian />
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <BlokIsian />
                <BlokIsian />
              </div>
              <Blok className="h-12 w-full" />
            </Tahap>
            <div className="border-t border-border" aria-hidden="true" />
            <Tahap>
              <div className="space-y-4 rounded-card border border-border bg-surface-sunken/55 p-5 sm:p-6">
                <BlokIsian />
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <BlokIsian />
                  <BlokIsian />
                </div>
                <BlokIsian />
              </div>
              <Blok className="h-11 w-44 !rounded-full" />
            </Tahap>
            <div className="border-t border-border" aria-hidden="true" />
            <Tahap>
              <Blok className="h-20 w-full" />
              <Blok className="h-20 w-full" />
            </Tahap>
          </div>

          <aside className="hidden lg:block" aria-hidden="true">
            <div className="rounded-panel border border-border bg-card p-6">
              <Baris className="h-3 w-32" />
              <div className="mt-5 space-y-3">
                <Baris className="h-3 w-full" />
                <Baris className="h-3 w-4/5" />
                <Baris className="h-3 w-full" />
                <Baris className="h-4 w-2/3" />
              </div>
              <Blok className="mt-6 h-11 w-full !rounded-full" />
            </div>
          </aside>
        </div>
      </div>

      {/* Bar bayar ponsel — sama bentuknya dengan bar aslinya (total kiri, tombol pendek kanan) */}
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

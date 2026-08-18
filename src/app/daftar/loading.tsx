/**
 * Kerangka portal pendaftaran. Meniru susunan aslinya: kolom formulir di kiri dan
 * kartu ringkasan pesanan di kanan (desktop), supaya tidak ada lompatan tata letak
 * begitu data live selesai dimuat.
 */
const Baris = ({ className = "" }: { className?: string }) => (
  <div className={`animate-pulse rounded-full bg-surface-sunken ${className}`} />
);

const BlokIsian = () => (
  <div className="space-y-2">
    <Baris className="h-2.5 w-28" />
    <div className="h-12 w-full animate-pulse rounded-field bg-surface-sunken" />
  </div>
);

export default function LoadingDaftar() {
  return (
    <div className="min-h-screen px-5 pb-40 pt-28 lg:pb-20" aria-busy="true" aria-live="polite">
      <span className="sr-only">Memuat formulir pendaftaran…</span>

      <div className="mx-auto w-full max-w-5xl">
        <div className="mb-8 flex flex-col items-center gap-2">
          <Baris className="h-8 w-56" />
          <Baris className="h-2.5 w-40" />
        </div>

        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_22rem]">
          <div className="space-y-8 rounded-card border border-border bg-card p-6 shadow-rest md:p-9">
            {[0, 1].map((seksi) => (
              <div key={seksi} className="space-y-5">
                <div className="flex items-center gap-3">
                  <div className="h-7 w-7 animate-pulse rounded-full bg-surface-sunken" />
                  <Baris className="h-4 w-40" />
                </div>
                <BlokIsian />
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <BlokIsian />
                  <BlokIsian />
                </div>
              </div>
            ))}
          </div>

          <aside className="hidden lg:block">
            <div className="rounded-card border border-border bg-card p-6 shadow-rest">
              <Baris className="h-2.5 w-32" />
              <div className="mt-5 space-y-3">
                <Baris className="h-3 w-full" />
                <Baris className="h-3 w-4/5" />
                <Baris className="h-4 w-2/3" />
              </div>
              <div className="mt-6 h-14 w-full animate-pulse rounded-full bg-surface-sunken" />
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

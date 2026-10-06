import { KerangkaRingkasan } from "@/components/Kerangka";

/**
 * Kerangka halaman status/pembayaran. Tanpa file ini rute ini memakai loading.tsx milik /daftar
 * (kerangka FORMULIR), sehingga pembeli yang baru kembali dari gateway melihat bentuk yang salah.
 * Bingkai harus sama dengan page.tsx; isi kartu = bentuk ringkasan pembayaran (RingkasanLunas).
 */
export default function LoadingStatus() {
  return (
    <div className="registration-atmosphere relative min-h-screen px-5 pb-20 pt-28" aria-busy="true">
      <div className="registration-grid pointer-events-none absolute inset-0 -z-10" aria-hidden="true" />
      <div className="mx-auto w-full max-w-2xl">
        <div className="mb-8 text-center text-xs font-semibold uppercase tracking-[0.16em] text-foreground-accent sm:text-[13px]">
          SMADARUN 2027 / Status pendaftaran
        </div>
        <div className="rounded-card border border-border bg-card p-6 md:p-9">
          <span className="sr-only">Memuat status pesanan…</span>
          <KerangkaRingkasan />
        </div>
      </div>
    </div>
  );
}

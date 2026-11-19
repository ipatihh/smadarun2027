
import React from "react";
import Link from "next/link";
import { FiCheck } from "react-icons/fi";
import { ResolvedTicketTier } from "@/lib/kembarinEvents";
import { catatanPodium, kelompokPeserta } from "@/data/tiket";
import { isKategoriPelajar } from "@/lib/kategoriIdentitas";

interface PricingColumnProps {
  tier: ResolvedTicketTier;
  /** Biaya layanan platform per tiket (live dari kembarin-v2). */
  adminFee: number;
  /** Nama biaya dari core (event_config.admin_fee_label). */
  adminFeeLabel: string;
  /** true = core punya kategori pelajar dan umum, jadi kartu ini hanya memuat kelompok miliknya. */
  pisahKelompok?: boolean;
}

const rupiah = (n: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(n);

const PricingColumn: React.FC<PricingColumnProps> = ({ tier, adminFee, adminFeeLabel, pisahKelompok = false }) => {
  const hasFeatures = tier.features.length > 0;
  // Kartu pelajar = kelompok podium U-18; kartu lainnya = kelompok umum (permintaan pemilik 20 Nov 2026).
  const kelompokKartu = pisahKelompok
    ? kelompokPeserta.filter((k) => k.podium === isKategoriPelajar(tier.categoryKey))
    : kelompokPeserta;

  return (
    <div
      className={`relative flex h-full w-full flex-col justify-between rounded-card border bg-card p-8 transition-[border-color,transform] duration-300 hover:-translate-y-0.5 hover:border-border-strong ${
        tier.highlight ? "border-primary-accent" : "border-border"
      }`}
    >
      {/* Slot badge — sebelumnya tidak ada tempat sama sekali untuk penanda
          "Early Bird"/"sisa slot", padahal urgensi adalah inti penjualan tiket. */}
      {tier.badge && (
        <span className="absolute -top-3 left-8 rounded-full bg-primary px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-on-primary">
          {tier.badge}
        </span>
      )}

      <div className={`${hasFeatures ? 'md:flex md:items-start md:gap-10' : ''}`}>
        {/* Kolom kiri: harga + CTA */}
        <div className={`text-center ${hasFeatures ? 'md:w-1/2 lg:w-5/12' : ''}`}>
          <h3 className="font-display text-xl font-medium text-foreground sm:text-2xl">{tier.name}</h3>

          <div className="mt-4">
            {/* Kelompok peserta tampil di kedua keadaan: saat Coming Soon menggantikan teks "Menyusul" di
                tempat harga, dan saat pendaftaran buka tampil di atas harga. */}
            <ul className="mx-auto max-w-sm divide-y divide-border-strong/50 border-y border-border-strong/50 text-left">
              {kelompokKartu.map((kelompok) => (
                <li key={kelompok.nama} className="flex items-center justify-between gap-3 py-3">
                  <span className="text-sm leading-snug text-foreground">{kelompok.nama}</span>
                  <span
                    className={`shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                      kelompok.podium ? "bg-primary text-on-primary" : "bg-surface-sunken text-foreground-accent"
                    }`}
                  >
                    {kelompok.lencana}
                  </span>
                </li>
              ))}
            </ul>
            {/* Kartu umum (saat kategori dipisah) tidak memuat catatan ini; kartu pelajar dan kartu tunggal tetap. */}
            {!(pisahKelompok && !isKategoriPelajar(tier.categoryKey)) && (
              <p className="mx-auto mt-3 max-w-sm text-center text-xs leading-relaxed text-muted-foreground">{catatanPodium}</p>
            )}
            {!tier.comingSoon && (
              <span className="mt-6 block font-display text-4xl font-medium tracking-[-0.02em] text-foreground sm:text-5xl">
                {rupiah(tier.price)}
              </span>
            )}
            {adminFee > 0 && !tier.comingSoon && (
              <p className="mt-1.5 text-xs text-muted-foreground">
                + {adminFeeLabel} {rupiah(adminFee)} per tiket
              </p>
            )}
          </div>

          <div className="mt-6 flex flex-col items-center">
            {tier.isAvailable === false ? (
              <button
                className="inline-flex min-h-11 cursor-not-allowed items-center justify-center rounded-full bg-surface-sunken px-5 text-center text-sm font-semibold text-muted-foreground"
                disabled
              >
                {tier.comingSoon ? "Coming Soon" : "Tidak Tersedia"}
              </button>
            ) : (
              <>
                <Link
                  href={tier.url || "/daftar"}
                  className="inline-flex min-h-11 items-center justify-center rounded-full bg-primary px-6 text-center text-sm font-semibold text-on-primary transition-all duration-200 hover:bg-primary-accent active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-card"
                >
                  Daftar sekarang
                  <span className="sr-only"> {tier.name}</span>
                </Link>
                <p className="mt-3 text-xs leading-relaxed tracking-[0.02em] text-foreground-accent">
                  <span className="font-semibold">NB:</span> Pembayaran online · Konfirmasi otomatis
                </p>
              </>
            )}
          </div>
        </div>

        {/* Kolom kanan: benefit — di ponsel muncul di bawah, di desktop di samping */}
        {hasFeatures && (
          <ul className="mt-8 space-y-3 border-t border-border-strong/60 pt-6 md:mt-0 md:w-1/2 md:border-l md:border-t-0 md:border-l-border-strong/60 md:pl-8 md:pt-0 lg:w-7/12">
            {tier.features.map((feature) => (
              <li key={feature} className="flex items-start">
                <FiCheck className="mt-0.5 h-5 w-5 shrink-0 text-foreground" aria-hidden="true" />
                <p className="ml-3 text-left text-sm text-foreground-accent">{feature}</p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default PricingColumn;


import React from "react";
import Link from "next/link";
import { FiCheck } from "react-icons/fi";
import { ResolvedTicketTier } from "@/lib/kembarinEvents";

interface PricingColumnProps {
  tier: ResolvedTicketTier;
  /** Biaya layanan platform per tiket (live dari kembarin-v2). */
  adminFee: number;
}

const rupiah = (n: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(n);

const PricingColumn: React.FC<PricingColumnProps> = ({ tier, adminFee }) => {
  const hasFeatures = tier.features.length > 0;

  return (
    <div
      className={`relative flex h-full w-full flex-col justify-between rounded-card border bg-card p-7 shadow-rest transition-all duration-300 hover:-translate-y-0.5 hover:shadow-hover ${
        tier.highlight ? "border-primary-accent ring-1 ring-primary-accent" : "border-border"
      }`}
    >
      {/* Slot badge — sebelumnya tidak ada tempat sama sekali untuk penanda
          "Early Bird"/"sisa slot", padahal urgensi adalah inti penjualan tiket. */}
      {tier.badge && (
        <span className="absolute -top-3 left-8 rounded-full bg-primary px-3 py-1 text-[11px] font-black uppercase tracking-wider text-on-primary shadow-rest">
          {tier.badge}
        </span>
      )}

      <div className={`${hasFeatures ? 'md:flex md:items-start md:gap-10' : ''}`}>
        {/* Kolom kiri: harga + CTA */}
        <div className={hasFeatures ? 'md:w-1/2 lg:w-5/12' : ''}>
          <h3 className="text-left text-lg font-semibold text-foreground sm:text-xl">{tier.name}</h3>

          <div className="mt-4">
            <span className="font-display text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
              {rupiah(tier.price)}
            </span>
            {adminFee > 0 && (
              <p className="mt-1.5 text-xs text-muted-foreground">
                + Biaya Layanan {rupiah(adminFee)} per tiket
              </p>
            )}
          </div>

          <div className="mt-6">
            {tier.isAvailable === false ? (
              <button
                className="inline-flex min-h-11 cursor-not-allowed items-center rounded-full bg-surface-sunken px-5 text-center text-sm font-semibold text-muted-foreground"
                disabled
              >
                Tidak Tersedia
              </button>
            ) : (
              <>
                <Link
                  href={tier.url || "/daftar"}
                  className="inline-flex min-h-11 items-center rounded-full bg-primary px-5 text-center text-sm font-semibold text-on-primary shadow-rest transition-all duration-200 hover:bg-primary-accent hover:shadow-hover active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-card"
                >
                  Daftar {tier.name}
                </Link>
                <p className="mt-2 text-[11px] italic leading-relaxed text-foreground-accent">
                  <span className="font-semibold">NB:</span> Pembayaran online · Konfirmasi otomatis
                </p>
              </>
            )}
          </div>
        </div>

        {/* Kolom kanan: benefit — di ponsel muncul di bawah, di desktop di samping */}
        {hasFeatures && (
          <ul className="mt-8 space-y-3 border-t border-border pt-6 md:mt-0 md:w-1/2 md:border-l md:border-t-0 md:pl-8 md:pt-0 lg:w-7/12">
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

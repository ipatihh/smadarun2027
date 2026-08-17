
import React from "react";
import Link from "next/link";
import { FiCheck } from "react-icons/fi";
import { ResolvedTicketTier } from "@/lib/kembarinEvents";

interface PricingColumnProps {
  tier: ResolvedTicketTier;
  /** Biaya layanan platform per transaksi (live dari kembarin-v2). */
  adminFee: number;
}

const rupiah = (n: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(n);

const PricingColumn: React.FC<PricingColumnProps> = ({ tier, adminFee }) => {
  return (
    <div
      className={`relative flex h-full w-full flex-col justify-between rounded-t-panel rounded-bl-lg rounded-br-panel border bg-card p-8 shadow-rest transition-all duration-300 hover:-translate-y-1 hover:shadow-hover ${
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

      <div>
        <h3 className="text-left font-display text-2xl font-bold text-foreground">{tier.name}</h3>

        <div className="mt-4">
          <span className="font-display text-4xl font-bold tracking-tight text-foreground">
            {rupiah(tier.price)}
          </span>
          {adminFee > 0 && (
            <p className="mt-1.5 text-xs text-muted-foreground">
              + biaya layanan {rupiah(adminFee)} per tiket
            </p>
          )}
        </div>

        <div className="mt-6">
          {tier.isAvailable === false ? (
            <button
              className="block w-full cursor-not-allowed rounded-full bg-surface-sunken px-4 py-3 text-center font-semibold text-muted-foreground"
              disabled
            >
              Tidak tersedia
            </button>
          ) : (
            <Link
              href={tier.url || "/daftar"}
              className="block w-full rounded-full bg-primary px-4 py-3 text-center font-semibold text-on-primary shadow-rest transition-all duration-200 hover:bg-primary-accent hover:shadow-hover active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-card"
            >
              Daftar {tier.name}
            </Link>
          )}
        </div>

        {tier.features.length > 0 && (
          <div className="mt-8 border-t-2 border-dashed border-border pt-6">
            <p className="text-left text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Khusus kategori ini:
            </p>
            <ul className="mt-4 space-y-3">
              {tier.features.map((feature) => (
                <li key={feature} className="flex items-start">
                  <FiCheck className="mt-0.5 h-5 w-5 shrink-0 text-secondary" aria-hidden="true" />
                  <p className="ml-3 text-left text-sm text-muted-foreground">{feature}</p>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default PricingColumn;

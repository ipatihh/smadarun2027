import { FiCheck } from "react-icons/fi";
import { ResolvedTicketTier } from "@/lib/kembarinEvents";
import PricingColumn from "./TiketColumn";

interface Props {
  tiers: ResolvedTicketTier[];
  /** Fasilitas yang sama di semua kategori — ditampilkan sekali di bawah grid. */
  sharedFeatures: string[];
  /** Biaya layanan platform, live dari kembarin-v2. */
  adminFee: number;
}

const TiketGrid: React.FC<Props> = ({ tiers, sharedFeatures, adminFee }) => {
  return (
    <div
      className="mx-auto w-full max-w-md md:max-w-4xl"
    >
      <div className="flex flex-col items-stretch justify-center gap-6 md:flex-row md:gap-8">
        {tiers.map((tier) => (
          <PricingColumn key={tier.categoryKey} tier={tier} adminFee={adminFee} />
        ))}
      </div>

      {sharedFeatures.length > 0 && (
        <div
          className="mt-8 rounded-card border border-dashed border-border-strong bg-card p-6"
        >
          <p className="text-center text-sm font-bold uppercase tracking-wide text-muted-foreground">
            Semua kategori mendapatkan
          </p>
          <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {sharedFeatures.map((feature) => (
              <li key={feature} className="flex items-start gap-2.5">
                <FiCheck className="mt-0.5 h-4 w-4 shrink-0 text-secondary" aria-hidden="true" />
                <span className="text-sm text-foreground-accent">{feature}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default TiketGrid;

"use client";

import { motion } from "framer-motion";
import { ResolvedTicketTier } from "@/lib/kembarinEvents";
import { revealContainer } from "@/lib/motion";
import PricingColumn from "./TiketColumn";

interface Props {
  tiers: ResolvedTicketTier[];
}

const TiketGrid: React.FC<Props> = ({ tiers }) => {
  return (
    <motion.div
      className="flex flex-col md:flex-row items-stretch justify-center gap-8 max-w-md mx-auto md:max-w-4xl w-full"
      variants={revealContainer}
      initial="offscreen"
      whileInView="onscreen"
      viewport={{ once: true }}
    >
      {tiers.map((tier) => (
        <PricingColumn key={tier.categoryKey} tier={tier} />
      ))}
    </motion.div>
  );
};

export default TiketGrid;

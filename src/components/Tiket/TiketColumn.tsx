"use client";

import React from "react";
import { FiCheck } from "react-icons/fi";
import { motion } from "framer-motion";
import { ResolvedTicketTier } from "@/lib/kembarinEvents";
import { revealChild } from "@/lib/motion";

interface PricingColumnProps {
  tier: ResolvedTicketTier;
}

const PricingColumn: React.FC<PricingColumnProps> = ({ tier }) => {
  return (
    <motion.div
      variants={revealChild}
      className="bg-card rounded-t-3xl rounded-br-3xl rounded-bl-lg border border-border p-8 shadow-sm flex flex-col justify-between transition-all duration-300 hover:shadow-md hover:-translate-y-1 h-full w-full">
      <div>
        {/* Nama Kategori */}
        <h3 className="text-2xl font-bold text-foreground text-left">{tier.name}</h3>

        {/* Harga */}
        <div className="mt-4 flex items-baseline text-foreground">
          <span className="font-display text-4xl font-bold tracking-tight">
            {typeof tier.price === "number" ? (
              new Intl.NumberFormat("id-ID", {
                style: "currency",
                currency: "IDR",
                minimumFractionDigits: 0,
              }).format(tier.price)
            ) : (
              tier.price
            )}
          </span>
        </div>

        {/* Tombol Kuning Identitas Smada */}
        <div className="mt-6">
          {tier.isAvailable == false ? (
            <button
              className="block w-full text-center bg-gray-400 text-white font-semibold py-3 px-4 rounded-full cursor-not-allowed"
              disabled
            >
              Tidak Tersedia
            </button>
          ) : (
            <a
              href={tier.url || "#"}
              className="block w-full text-center bg-primary hover:bg-primary-accent text-black font-semibold py-3 px-4 rounded-full transition-all duration-200 transform active:scale-[0.98] shadow-sm hover:shadow-md"
            >
              Daftar Sekarang
            </a>
          )}
        </div>

        {/* Garis Pembatas Fasilitas — kesan sobekan tiket */}
        <div className="mt-8 border-t-2 border-dashed border-border pt-6">
          <p className="text-sm font-semibold tracking-wide uppercase text-muted-foreground text-left">
            Fasilitas Peserta:
          </p>
          
          <ul className="mt-4 space-y-3">
            {tier.features && tier.features.map((feature: string, featureIndex: number) => (
              <li key={featureIndex} className="flex items-start">
                <div className="flex-shrink-0">
                  <FiCheck className="h-5 w-5 text-secondary mt-0.5" />
                </div>
                <p className="ml-3 text-sm text-muted-foreground text-left">{feature}</p>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </motion.div>
  );
};

export default PricingColumn;
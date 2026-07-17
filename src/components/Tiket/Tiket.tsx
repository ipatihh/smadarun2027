import React from "react";
import { tiers } from "@/data/tiket";
import PricingColumn from "./TiketColumn";

const Tiket: React.FC = () => {
  return (
    <section id="tiket" className="py-20 px-5 bg-background">
      <div className="max-w-6xl mx-auto">
        
        {/* JUDUL DI SINI SUDAH DIHAPUS AGAR TIDAK DOBEL DENGAN BAWAAN TEMPLATE */}

        {/* Container Utama: Mengatur posisi center & responsif */}
        <div className="flex flex-col md:flex-row items-stretch justify-center gap-8 max-w-md mx-auto md:max-w-4xl w-full">
          {tiers.map((tier, index) => (
            <PricingColumn key={index} tier={tier} />
          ))}
        </div>

      </div>
    </section>
  );
};

export default Tiket;
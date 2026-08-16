"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { revealChild } from "@/lib/motion";

interface Props {
  eventDate: string | null;
}

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

function computeTimeLeft(targetMs: number): TimeLeft {
  const diff = Math.max(0, targetMs - Date.now());
  return {
    days: Math.floor(diff / 86_400_000),
    hours: Math.floor((diff % 86_400_000) / 3_600_000),
    minutes: Math.floor((diff % 3_600_000) / 60_000),
    seconds: Math.floor((diff % 60_000) / 1_000),
  };
}

const UNITS: { key: keyof TimeLeft; label: string }[] = [
  { key: "days", label: "Hari" },
  { key: "hours", label: "Jam" },
  { key: "minutes", label: "Menit" },
  { key: "seconds", label: "Detik" },
];

const Countdown: React.FC<Props> = ({ eventDate }) => {
  const targetMs = useMemo(() => {
    if (!eventDate) return null;
    const t = new Date(eventDate).getTime();
    return Number.isNaN(t) ? null : t;
  }, [eventDate]);

  const [timeLeft, setTimeLeft] = useState<TimeLeft | null>(() => (targetMs ? computeTimeLeft(targetMs) : null));

  useEffect(() => {
    if (!targetMs) return;
    const id = setInterval(() => setTimeLeft(computeTimeLeft(targetMs)), 1000);
    return () => clearInterval(id);
  }, [targetMs]);

  if (!targetMs || !timeLeft) {
    return (
      <motion.div variants={revealChild} className="text-center">
        <p className="font-display text-2xl sm:text-3xl font-semibold text-white">
          Tanggal Hari-H Akan Segera Diumumkan
        </p>
        <p className="mt-2 text-sm text-gray-300">
          Pantau terus info resmi panitia SMADARUN 2027 untuk update jadwal.
        </p>
      </motion.div>
    );
  }

  return (
    <motion.div variants={revealChild} className="flex items-center justify-center gap-4 sm:gap-10">
      {UNITS.map((u) => (
        <div key={u.key} className="text-center">
          <div className="font-display text-4xl sm:text-6xl font-bold text-primary tabular-nums leading-none">
            {String(timeLeft[u.key]).padStart(2, "0")}
          </div>
          <div className="mt-2 text-xs sm:text-sm uppercase tracking-wider text-gray-300">{u.label}</div>
        </div>
      ))}
    </motion.div>
  );
};

export default Countdown;

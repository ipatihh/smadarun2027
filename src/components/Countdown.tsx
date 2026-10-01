"use client";

import { useEffect, useMemo, useState } from "react";

interface Props {
  eventDate: string | null;
  /** Rata tengah — dipakai kalau panel tidak punya kolom fakta di sebelahnya. */
  centered?: boolean;
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

const Countdown: React.FC<Props> = ({ eventDate, centered = false }) => {
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
      <div>
        <p className="font-display text-xl sm:text-2xl md:text-3xl font-semibold leading-tight text-on-secondary">
          Tanggal hari-H segera diumumkan
        </p>
        <p className="mt-2 text-sm text-on-secondary-muted">
          Pantau info resmi panitia untuk kabar terbarunya.
        </p>
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-6 sm:gap-8 ${centered ? "justify-center" : ""}`}>
      {UNITS.map((u) => (
        <div key={u.key} className="text-center">
          <div className="font-display text-3xl sm:text-4xl md:text-5xl font-bold leading-none text-primary tabular-nums">
            {String(timeLeft[u.key]).padStart(2, "0")}
          </div>
          <div className="mt-2 text-sm text-on-secondary-muted">{u.label}</div>
        </div>
      ))}
    </div>
  );
};

export default Countdown;

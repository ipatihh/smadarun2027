"use client";

import { motion } from "framer-motion";
import { revealContainer, revealChild } from "@/lib/motion";

export interface TimelineEntry {
  title: string;
  time: string | null;
  detail: string | null;
}

interface Props {
  entries: TimelineEntry[];
}

const TimelineItems: React.FC<Props> = ({ entries }) => {
  return (
    <motion.div
      className="max-w-2xl mx-auto"
      variants={revealContainer}
      initial="offscreen"
      whileInView="onscreen"
      viewport={{ once: true }}
    >
      {entries.map((entry, index) => (
        <motion.div key={index} variants={revealChild} className="relative pl-10 pb-10 last:pb-0 border-l-2 border-border last:border-transparent">
          <span className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-primary border-4 border-background"></span>
          {entry.time && (
            <div className="font-display text-xl font-bold text-secondary tabular-nums">{entry.time}</div>
          )}
          <div className="mt-1 font-semibold text-foreground">{entry.title}</div>
          {entry.detail && (
            <div className="mt-1 text-sm text-foreground-accent">{entry.detail}</div>
          )}
        </motion.div>
      ))}
    </motion.div>
  );
};

export default TimelineItems;

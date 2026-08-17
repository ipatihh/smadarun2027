import type { Config } from "tailwindcss";

// Semua warna/radius/bayangan di sini memetakan token dari src/app/globals.css.
// Komponen HARUS memakai nama-nama ini, bukan palet Tailwind mentah (gray-*, zinc-*,
// amber-*, white, black) — supaya tema (termasuk mode gelap) bisa diganti dari satu tempat.
const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    // WAJIB: file di src/data ikut menulis kelas Tailwind (ukuran kotak logo sponsor di
    // sponsors.ts, warna ikon di stats.tsx, dll). Tanpa baris ini kelas-kelas tersebut
    // tidak pernah ikut di-generate dan elemennya diam-diam tampil tanpa ukuran.
    "./src/data/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        primary: "var(--primary)",
        secondary: "var(--secondary)",

        "primary-accent": "var(--primary-accent)",
        "secondary-accent": "var(--secondary-accent)",
        "foreground-accent": "var(--foreground-accent)",
        "hero-background": "var(--hero-background)",

        card: "var(--card)",
        "surface-sunken": "var(--surface-sunken)",
        border: "var(--border)",
        "border-strong": "var(--border-strong)",
        "muted-foreground": "var(--muted-foreground)",

        // Warna teks/ikon di atas permukaan brand
        "on-primary": "var(--on-primary)",
        "on-secondary": "var(--on-secondary)",
        "on-secondary-muted": "var(--on-secondary-muted)",

        // Semantik
        success: "var(--success)",
        "success-surface": "var(--success-surface)",
        warning: "var(--warning)",
        "warning-surface": "var(--warning-surface)",
        danger: "var(--danger)",
        "danger-surface": "var(--danger-surface)",

        overlay: "var(--overlay)",
      },
      // Skala radius: sebelumnya campur xl/2xl/3xl/full tanpa pola.
      borderRadius: {
        field: "0.75rem",
        card: "1.5rem",
        panel: "2rem",
      },
      // Cukup dua tingkat: keadaan diam & keadaan hover/aktif.
      boxShadow: {
        rest: "0 1px 2px rgb(23 23 23 / 0.06), 0 4px 12px rgb(23 23 23 / 0.04)",
        hover: "0 4px 10px rgb(23 23 23 / 0.08), 0 12px 28px rgb(23 23 23 / 0.10)",
      },
    },
  },
  plugins: [],
};
export default config;

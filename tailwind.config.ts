import type { Config } from "tailwindcss";

// Semua warna/radius/bayangan di sini memetakan token dari src/app/globals.css.
// Komponen HARUS memakai nama-nama ini, bukan palet Tailwind mentah (gray-*, zinc-*,
// amber-*, white, black) — supaya tema (termasuk mode gelap) bisa diganti dari satu tempat.
// Token ditulis sebagai kanal RGB supaya <alpha-value> bekerja (bg-card/90, ring-primary/25);
// lihat catatan FORMAT NILAI di globals.css.
const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    // WAJIB: file di src/data ikut menulis kelas Tailwind (ukuran kotak logo sponsor di
    // sponsors.ts, dll). Tanpa baris ini kelas-kelas tersebut
    // tidak pernah ikut di-generate dan elemennya diam-diam tampil tanpa ukuran.
    "./src/data/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "rgb(var(--background) / <alpha-value>)",
        foreground: "rgb(var(--foreground) / <alpha-value>)",
        primary: "rgb(var(--primary) / <alpha-value>)",
        secondary: "rgb(var(--secondary) / <alpha-value>)",

        "primary-accent": "rgb(var(--primary-accent) / <alpha-value>)",
        "secondary-accent": "rgb(var(--secondary-accent) / <alpha-value>)",
        "foreground-accent": "rgb(var(--foreground-accent) / <alpha-value>)",
        "hero-background": "rgb(var(--hero-background) / <alpha-value>)",

        card: "rgb(var(--card) / <alpha-value>)",
        "surface-sunken": "rgb(var(--surface-sunken) / <alpha-value>)",
        border: "rgb(var(--border) / <alpha-value>)",
        "border-strong": "rgb(var(--border-strong) / <alpha-value>)",
        "field-border": "rgb(var(--field-border) / <alpha-value>)",
        focus: "rgb(var(--focus) / <alpha-value>)",
        "muted-foreground": "rgb(var(--muted-foreground) / <alpha-value>)",

        // Warna teks/ikon di atas permukaan brand
        "on-primary": "rgb(var(--on-primary) / <alpha-value>)",
        "on-secondary": "rgb(var(--on-secondary) / <alpha-value>)",
        "on-secondary-muted": "rgb(var(--on-secondary-muted) / <alpha-value>)",

        // Semantik
        success: "rgb(var(--success) / <alpha-value>)",
        "success-surface": "rgb(var(--success-surface) / <alpha-value>)",
        warning: "rgb(var(--warning) / <alpha-value>)",
        "warning-surface": "rgb(var(--warning-surface) / <alpha-value>)",
        danger: "rgb(var(--danger) / <alpha-value>)",
        "danger-surface": "rgb(var(--danger-surface) / <alpha-value>)",

        "logo-surface": "rgb(var(--logo-surface) / <alpha-value>)",

        overlay: "var(--overlay)",
      },
      // Warna bawaan untuk `border`/`divide-*`/`ring` tanpa nama warna. Tanpa ini Tailwind
      // memakai gray-200 dan biru-500 — garis FAQ sempat jadi abu-abu terang yang mencolok
      // di mode gelap, dan cincin fokus input berwarna biru.
      borderColor: {
        DEFAULT: "rgb(var(--border))",
      },
      ringColor: {
        DEFAULT: "rgb(var(--primary))",
      },
      // Skala radius: sebelumnya campur xl/2xl/3xl/full tanpa pola.
      borderRadius: {
        field: "0.75rem",
        card: "1.5rem",
        panel: "2rem",
        // Foto dokumentasi: sudut nyaris tegas, ala majalah.
        photo: "0.25rem",
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

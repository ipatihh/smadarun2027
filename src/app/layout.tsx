import type { Metadata, Viewport } from "next";
import { GoogleAnalytics } from '@next/third-parties/google';
import { Analytics } from '@vercel/analytics/next';
import { Plus_Jakarta_Sans } from "next/font/google";

import Header from "@/components/Header";
import { getLiveEventData } from "@/lib/kembarinEvents";
import FooterLive from "@/components/FooterLive";
import { siteDetails } from '@/data/siteDetails';
import { jsonLdSitus, serialisasiJsonLd, NAMA_PENGEMBANG, URL_PENGEMBANG } from '@/lib/seo';

import "./globals.css";

const plusJakartaSans = Plus_Jakarta_Sans({ subsets: ['latin'], variable: '--font-plus-jakarta' });

// Warna bilah alamat browser ponsel (Chrome Android, Safari iOS) mengikuti gradien jersey.
export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#5A12D8" },
    { media: "(prefers-color-scheme: dark)", color: "#12062E" },
  ],
};

export const metadata: Metadata = {
  applicationName: siteDetails.siteName,
  authors: [{ name: "SMA Negeri 2 Nganjuk" }, { name: NAMA_PENGEMBANG, url: URL_PENGEMBANG }],
  creator: NAMA_PENGEMBANG,
  publisher: "SMA Negeri 2 Nganjuk",
  category: "sports",
  formatDetection: { telephone: false, email: false, address: false },
  // Izinkan Google memakai gambar besar & cuplikan penuh di hasil pencarian.
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1, "max-video-preview": -1 },
  },
  metadataBase: new URL(siteDetails.siteUrl),
  title: siteDetails.metadata.title,
  description: siteDetails.metadata.description,
  keywords: ["smada run", "smadarun", "smadarun 2027", "lomba lari nganjuk", "run event nganjuk", "event lari nganjuk", "sma negeri 2 nganjuk", "smadarun.id"],
  alternates: {
    canonical: siteDetails.siteUrl,
  },
  openGraph: {
    title: siteDetails.metadata.title,
    description: siteDetails.metadata.description,
    url: siteDetails.siteUrl,
    type: 'website',
    siteName: siteDetails.siteName,
    locale: 'id_ID',
    // Gambar pratinjau (og:image) SENGAJA tidak ditulis di sini: Next.js memasangnya otomatis
    // dari src/app/opengraph-image.jpg dan twitter-image.jpg bila filenya ada. Dulu di sini
    // menunjuk /images/og-image.jpg yang tidak pernah ada (404). Lihat docs/PANDUAN_ASET.md.
  },
  twitter: {
    card: 'summary_large_image',
    title: siteDetails.metadata.title,
    description: siteDetails.metadata.description,
  },
  // Verifikasi kepemilikan situs via meta tag Google Search Console — metode
  // cadangan di luar TXT record DNS (yang ditambahkan terpisah di panel
  // pengelola domain smadarun.id, bukan di kode ini). Kode verifikasi ini
  // memang dirancang publik, bukan secret.
  verification: {
    google: 'E-ajJkGSPmaPXLEWIkmpT2A9eDR76DEmry5JYmqlZZo',
  },
  // Meta tambahan: sinyal utama untuk Google tetap JSON-LD (lib/seo.ts); tag ini pelengkap
  // bagi crawler lain. Peran PT KEMBAR INOVASI INDONESIA: pengembang situs & mitra pendaftaran.
  other: {
    developer: NAMA_PENGEMBANG,
    "registration-partner": NAMA_PENGEMBANG,
    "ticketing-partner": NAMA_PENGEMBANG,
    "geo.region": "ID-JI",
    "geo.placename": "Nganjuk",
    "content-language": "id",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const live = await getLiveEventData();
  return (
    <html lang="id">
      <body
        className={`${plusJakartaSans.variable} antialiased`}
      >
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: serialisasiJsonLd(jsonLdSitus) }}
        />
        {siteDetails.googleAnalyticsId && <GoogleAnalytics gaId={siteDetails.googleAnalyticsId} />}
        {/* Skip link: pengguna keyboard/pembaca layar langsung ke konten tanpa melewati menu. */}
        <a
          href="#konten-utama"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded-full focus:bg-card focus:px-5 focus:py-3 focus:text-sm focus:font-bold focus:text-foreground focus:shadow-hover focus:outline-none focus:ring-2 focus:ring-focus"
        >
          Lewati ke konten utama
        </a>
        <Header comingSoon={live.comingSoon} />
        {/* overflow-x-clip di sini, BUKAN di body: overflow milik body dipindahkan browser ke
            viewport, dan Safari iOS tetap membiarkan halaman digeser ke samping walau body
            clip/hidden. Clip (bukan hidden) tidak mematikan position: sticky dan tetap
            menjaga lebar viewport ketika konten dekoratif melewati tepi halaman. */}
        <main id="konten-utama" tabIndex={-1} className="overflow-x-clip focus:outline-none">
          {children}
        </main>
        <FooterLive />
        <Analytics />
      </body>
    </html>
  );
}

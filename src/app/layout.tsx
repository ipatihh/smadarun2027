import type { Metadata } from "next";
import { GoogleAnalytics } from '@next/third-parties/google';
import { Oswald, Plus_Jakarta_Sans } from "next/font/google";

import Header from "@/components/Header";
import FooterLive from "@/components/FooterLive";
import { siteDetails } from '@/data/siteDetails';

import "./globals.css";

const oswald = Oswald({ subsets: ['latin'], weight: ['400', '500', '600', '700'], variable: '--font-oswald' });
const plusJakartaSans = Plus_Jakarta_Sans({ subsets: ['latin'], variable: '--font-plus-jakarta' });

export const metadata: Metadata = {
  metadataBase: new URL(siteDetails.siteUrl),
  title: siteDetails.metadata.title,
  description: siteDetails.metadata.description,
  keywords: ["smada run", "smadarun", "lomba lari", "lomba lari nganjuk", "smada run nganjuk", "sma negeri 2 nganjuk", "event lari nganjuk", "smadarun.id"],
  alternates: {
    canonical: siteDetails.siteUrl,
  },
  openGraph: {
    title: siteDetails.metadata.title,
    description: siteDetails.metadata.description,
    url: siteDetails.siteUrl,
    type: 'website',
    images: [
      {
        url: '/images/og-image.jpg',
        width: 1200,
        height: 675,
        alt: siteDetails.siteName,
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: siteDetails.metadata.title,
    description: siteDetails.metadata.description,
    images: ['/images/twitter-image.jpg'],
  },
  // Verifikasi kepemilikan situs via meta tag Google Search Console — metode
  // cadangan di luar TXT record DNS (yang ditambahkan terpisah di panel
  // pengelola domain smadarun.id, bukan di kode ini). Kode verifikasi ini
  // memang dirancang publik, bukan secret.
  verification: {
    google: 'E-ajJkGSPmaPXLEWIkmpT2A9eDR76DEmry5JYmqlZZo',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body
        className={`${oswald.variable} ${plusJakartaSans.variable} antialiased`}
      >
        {siteDetails.googleAnalyticsId && <GoogleAnalytics gaId={siteDetails.googleAnalyticsId} />}
        {/* Skip link: pengguna keyboard/pembaca layar langsung ke konten tanpa melewati menu. */}
        <a
          href="#konten-utama"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded-full focus:bg-card focus:px-5 focus:py-3 focus:text-sm focus:font-bold focus:text-foreground focus:shadow-hover focus:outline-none focus:ring-2 focus:ring-focus"
        >
          Lewati ke konten utama
        </a>
        <Header />
        {/* overflow-x-clip di sini, BUKAN di body: overflow milik body dipindahkan browser ke
            viewport, dan Safari iOS tetap membiarkan halaman digeser ke samping walau body
            clip/hidden. Clip (bukan hidden) tidak mematikan position: sticky dan tetap
            menjaga lebar viewport ketika konten dekoratif melewati tepi halaman. */}
        <main id="konten-utama" tabIndex={-1} className="overflow-x-clip focus:outline-none">
          {children}
        </main>
        <FooterLive />
      </body>
    </html>
  );
}

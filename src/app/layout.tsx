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
        <Header />
        <main>
          {children}
        </main>
        <FooterLive />
      </body>
    </html>
  );
}

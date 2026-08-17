import type { Metadata } from "next";
import { GoogleAnalytics } from '@next/third-parties/google';
import { Oswald, Plus_Jakarta_Sans } from "next/font/google";

import Header from "@/components/Header";
import Footer from "@/components/Footer";
import StickyDaftarBar from "@/components/StickyDaftarBar";
import { siteDetails } from '@/data/siteDetails';
import { getLiveEventData } from '@/lib/kembarinEvents';

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
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Harga termurah untuk bar aksi mobile — tetap live dari kembarin-v2, tidak di-hardcode.
  const live = await getLiveEventData();
  const lowestPrice = live.isOpen && live.ticketTypes.length > 0
    ? Math.min(...live.ticketTypes.map((t) => t.price))
    : null;

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
        <Footer adminFee={live.adminFee} />
        <StickyDaftarBar lowestPrice={lowestPrice} />
      </body>
    </html>
  );
}

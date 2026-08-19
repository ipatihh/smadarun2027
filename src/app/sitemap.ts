import type { MetadataRoute } from "next";
import { siteDetails } from "@/data/siteDetails";

// /daftar/status sengaja TIDAK dimasukkan — halaman personal pasca-pembayaran,
// sudah ditandai noindex (lihat metadata di app/daftar/status/page.tsx) dan
// dikecualikan juga di robots.ts.
export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = siteDetails.siteUrl.replace(/\/$/, "");
  const now = new Date();

  return [
    {
      url: `${baseUrl}/`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${baseUrl}/daftar`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.9,
    },
  ];
}

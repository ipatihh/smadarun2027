import type { MetadataRoute } from "next";
import { siteDetails } from "@/data/siteDetails";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // Halaman personal pasca-pembayaran, sudah ditandai noindex sendiri
        // (lihat metadata di app/daftar/status/page.tsx) — dikecualikan juga
        // di sini supaya konsisten dan tidak dirayapi sama sekali.
        disallow: ["/daftar/status"],
      },
    ],
    sitemap: `${siteDetails.siteUrl}sitemap.xml`,
  };
}

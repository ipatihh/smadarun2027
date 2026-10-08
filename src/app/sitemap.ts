import type { MetadataRoute } from "next";
import { siteDetails } from "@/data/siteDetails";

// /daftar/status sengaja TIDAK dimasukkan — halaman personal pasca-pembayaran,
// sudah ditandai noindex (lihat metadata di app/daftar/status/page.tsx) dan
// dikecualikan juga di robots.ts.
// lastModified sengaja tidak diisi: `new Date()` berubah tiap build sehingga Google belajar
// mengabaikannya. Isi hanya bila tanggal perubahan konten yang sebenarnya diketahui.
export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = siteDetails.siteUrl.replace(/\/$/, "");

  return [
    {
      url: `${baseUrl}/`,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${baseUrl}/daftar`,
      changeFrequency: "daily",
      priority: 0.9,
    },
  ];
}

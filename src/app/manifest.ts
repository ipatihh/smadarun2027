import type { MetadataRoute } from "next";

import { siteDetails } from "@/data/siteDetails";

// Manifest web: nama & ikon saat situs dipasang ke layar utama Android dan untuk mesin pencari.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: siteDetails.metadata.title,
    short_name: siteDetails.siteName,
    description: siteDetails.metadata.description,
    lang: "id",
    start_url: "/",
    display: "browser",
    background_color: "#F6F3FF",
    theme_color: "#5A12D8",
    icons: [{ src: "/icon.png", sizes: "512x512", type: "image/png" }],
  };
}

import { siteDetails } from "@/data/siteDetails";

/**
 * Entitas data terstruktur (schema.org) yang dipakai bersama layout & beranda.
 * Sumber tunggal supaya nama/URL pihak-pihak ini tidak berbeda antar halaman.
 *
 * Peran PT KEMBAR INOVASI INDONESIA dinyatakan eksplisit untuk Google:
 *   - pengembang situs  → WebSite.creator / WebSite.provider
 *   - mitra pendaftaran → Offer.seller & Event.organizer-pendamping (lihat page.tsx)
 */
export const NAMA_PENGEMBANG = "PT KEMBAR INOVASI INDONESIA";
export const URL_PENGEMBANG = "https://kembar.in";

const base = siteDetails.siteUrl.replace(/\/$/, "");

export const orgSekolah = {
  "@type": "Organization",
  "@id": `${base}/#sekolah`,
  name: "SMA Negeri 2 Nganjuk",
  alternateName: ["SMADA Nganjuk", "SMAN 2 Nganjuk"],
  url: base + "/",
  logo: `${base}/icon.png`,
  address: { "@type": "PostalAddress", addressLocality: "Nganjuk", addressRegion: "Jawa Timur", addressCountry: "ID" },
};

export const orgPengembang = {
  "@type": "Organization",
  "@id": `${URL_PENGEMBANG}/#organisasi`,
  name: NAMA_PENGEMBANG,
  legalName: NAMA_PENGEMBANG,
  alternateName: ["Kembar.in", "PT KEMBAR INOVASI"],
  url: URL_PENGEMBANG,
  description: "Pengembang situs smadarun.id sekaligus mitra resmi pendaftaran dan ticketing SMADARUN 2027.",
  address: { "@type": "PostalAddress", addressCountry: "ID" },
};

export const jsonLdSitus = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      "@id": `${base}/#situs`,
      name: siteDetails.siteName,
      alternateName: ["SMADARUN", "SMADA RUN", "smadarun.id"],
      url: base + "/",
      inLanguage: "id-ID",
      description: siteDetails.metadata.description,
      publisher: { "@id": orgSekolah["@id"] },
      creator: { "@id": orgPengembang["@id"] },
      provider: { "@id": orgPengembang["@id"] },
    },
    orgSekolah,
    orgPengembang,
  ],
};

/** "<" di-escape supaya teks dari core tidak bisa menutup tag script. */
export const serialisasiJsonLd = (data: unknown) => JSON.stringify(data).replace(/</g, "\\u003c");

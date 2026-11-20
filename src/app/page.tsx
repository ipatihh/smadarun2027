import Hero from "@/components/Hero";
import EventInfo from "@/components/EventInfo";
import Benefits from "@/components/Benefits/Benefits";
import Flyer from "@/components/Flyer";
import Gallery from "@/components/Gallery";
import Tiket from "@/components/Tiket/Tiket";
import FAQ from "@/components/FAQ";
import Logos from "@/components/Logos";
import Container from "@/components/Container";
import CTA from "@/components/CTA";
import { getLiveEventData } from "@/lib/kembarinEvents";
import { siteDetails } from "@/data/siteDetails";
import { orgSekolah, orgPengembang, serialisasiJsonLd } from "@/lib/seo";

/**
 * Urutan seksi mengikuti pertanyaan pengunjung: ini lomba apa & kapan (Hero, panel hari
 * lomba) → apa yang disiapkan (Benefits) → jersey, medali, string bag (Flyer) → suasananya (Gallery, foto tahun lalu) →
 * berapa & daftar di mana (Tiket) → keyakinan
 * (FAQ) → apresiasi sponsor → ajakan terakhir. Seksi Testimoni dicabut atas revisi panitia (Nov 2026).
 * Sponsor sengaja tidak di posisi atas: sebelumnya blok itu memakan layar persis saat
 * pengunjung sedang mencari harga dan jadwal.
 *
 * Setiap informasi punya SATU tempat. Isi race pack hanya di Tiket, jadwal hari-H hanya di
 * panel EventInfo — jangan menambah seksi yang mengulang salah satunya.
 */
const HomePage = async () => {
  const live = await getLiveEventData();
  // Tanggal & lokasi HANYA dari core; tidak diisi kalau belum ada atau masih Coming Soon,
  // supaya Google tidak menampilkan tanggal karangan.
  const mulai = !live.comingSoon && live.eventDate && !Number.isNaN(Date.parse(live.eventDate)) ? live.eventDate : null;
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SportsEvent",
    name: siteDetails.siteName,
    description: siteDetails.metadata.description,
    url: siteDetails.siteUrl,
    image: [`${siteDetails.siteUrl}opengraph-image.jpg`],
    sport: "Running",
    isAccessibleForFree: false,
    inLanguage: "id-ID",
    eventStatus: "https://schema.org/EventScheduled",
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    // Mitra resmi pendaftaran & ticketing; sekolah tetap penyelenggara utama.
    organizer: orgSekolah,
    contributor: orgPengembang,
    // Harga hanya dari core dan hanya saat pendaftaran benar-benar buka (bukan Coming Soon/tutup).
    ...(live.isOpen && live.ticketTypes.length > 0 && {
      offers: live.ticketTypes.map((t) => ({
        "@type": "Offer",
        name: t.categoryKey,
        price: t.price,
        priceCurrency: "IDR",
        availability: "https://schema.org/InStock",
        url: `${siteDetails.siteUrl}daftar`,
        seller: orgPengembang,
      })),
    }),
    ...(mulai && { startDate: mulai }),
    ...(live.location && {
      location: { "@type": "Place", name: live.location, address: live.location },
    }),
  };
  return (
    <>
      {/* "<" di-escape supaya teks dari core tidak bisa menutup tag script. */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serialisasiJsonLd(jsonLd) }}
      />
      <Hero />
      <EventInfo />
      <Container>
        <Benefits />

        <Flyer />

        <Gallery />

        <Tiket />

        <FAQ />
      </Container>

      <Logos />

      <Container>
        <CTA />
      </Container>
    </>
  );
};

export default HomePage;

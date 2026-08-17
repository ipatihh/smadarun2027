import Hero from "@/components/Hero";
import Testimonials from "@/components/Testimonials";
import Tiket from "@/components/Tiket/Tiket";
import FAQ from "@/components/FAQ";
import Logos from "@/components/Logos";
import Benefits from "@/components/Benefits/Benefits";
import Container from "@/components/Container";
import Stats from "@/components/Stats";
import CTA from "@/components/CTA";
import CountdownSection from "@/components/CountdownSection";
import Timeline from "@/components/Timeline";

/**
 * Urutan seksi mengikuti pertanyaan pengunjung: ini lomba apa & kapan (Hero, Countdown) →
 * kenapa layak diikuti (Stats, Benefits) → berapa & daftar di mana (Tiket) → detail
 * hari-H (Timeline) → keyakinan (Testimoni, FAQ) → apresiasi sponsor → ajakan terakhir.
 * Sponsor sengaja tidak lagi di posisi ketiga: sebelumnya blok itu memakan layar persis
 * saat pengunjung sedang mencari harga dan jadwal.
 */
const HomePage: React.FC = () => {
  return (
    <>
      <Hero />
      <CountdownSection />
      <Container>
        <Stats />

        <Benefits />

        <Tiket />

        <Timeline />

        <Testimonials />

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

import Hero from "@/components/Hero";
import EventInfo from "@/components/EventInfo";
import Benefits from "@/components/Benefits/Benefits";
import Flyer from "@/components/Flyer";
import Gallery from "@/components/Gallery";
import Tiket from "@/components/Tiket/Tiket";
import Testimonials from "@/components/Testimonials";
import FAQ from "@/components/FAQ";
import Logos from "@/components/Logos";
import Container from "@/components/Container";
import CTA from "@/components/CTA";

/**
 * Urutan seksi mengikuti pertanyaan pengunjung: ini lomba apa & kapan (Hero, panel hari
 * lomba) → apa yang disiapkan (Benefits) → rute, jersey, medali (Flyer) → suasananya (Gallery, foto tahun lalu) →
 * berapa & daftar di mana (Tiket) → keyakinan
 * (Testimoni + angka statistik, FAQ) → apresiasi sponsor → ajakan terakhir.
 * Sponsor sengaja tidak di posisi atas: sebelumnya blok itu memakan layar persis saat
 * pengunjung sedang mencari harga dan jadwal.
 *
 * Setiap informasi punya SATU tempat. Isi race pack hanya di Tiket, jadwal hari-H hanya di
 * panel EventInfo — jangan menambah seksi yang mengulang salah satunya.
 */
const HomePage: React.FC = () => {
  return (
    <>
      <Hero />
      <EventInfo />
      <Container>
        <Benefits />

        <Flyer />

        <Gallery />

        <Tiket />

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

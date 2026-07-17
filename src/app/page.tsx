import Hero from "@/components/Hero";
import Testimonials from "@/components/Testimonials";
// 1. PERBAIKAN IMPOR: Mengarah ke folder Pricing, tapi memanggil file Tiket
import Pricing from "@/components/Tiket/Tiket"; 
import FAQ from "@/components/FAQ";
import Logos from "@/components/Logos";
import Benefits from "@/components/Benefits/Benefits";
import Container from "@/components/Container";
import Section from "@/components/Section";
import Stats from "@/components/Stats";
import CTA from "@/components/CTA";

const HomePage: React.FC = () => {
  return (
    <>
      <Hero />
      <Logos />
      <Container>
        <Benefits />

        {/* 
           2. PERBAIKAN ID SEKSYEN: 
           Mengubah id="pricing" menjadi id="tiket" agar pas saat diklik dari menu "Kategori Tiket" di header 
        */}
        <Section
          id="tiket"
          title="Kategori Tiket"
          description="Amankan slot sekarang sebelum kehabisan!"
        >
          <Pricing />
        </Section>

        {/* Bagian Testimoni */}
        <Section
          id="testimonials"
          title="Apa Kata Mereka?"
          description="Kesan dan cerita seru dari para pelari yang telah bergabung di event kami sebelumnya."
        >
          <Testimonials />
        </Section>

        <FAQ />

        <Stats />
        
        <CTA />
      </Container>
    </>
  );
};

export default HomePage;
import { DifferentiatorsSection } from "@/components/differentiators-section";
import { FAQSection } from "@/components/faq-section";
import { Footer } from "@/components/footer";
import { Header } from "@/components/header";
import { HeroSection } from "@/components/hero-section";
import { ProblemSection } from "@/components/problem-section";
import { ProcessSection } from "@/components/process-section";
import { StakeholderSection } from "@/components/stakeholder-section";

export default function HomePage() {
  return (
    <div className="min-h-screen">
      <Header />
      <main>
        <HeroSection />
        <ProblemSection />
        <DifferentiatorsSection />
        <StakeholderSection />
        <ProcessSection />
        <FAQSection />
      </main>
      <Footer />
    </div>
  );
}

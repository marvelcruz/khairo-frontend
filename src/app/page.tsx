import type { Metadata } from "next";
import { HeroSection } from "@/components/sections/hero-section";
import { StatBand } from "@/components/sections/stat-band";
import { ManifestoSection } from "@/components/sections/manifesto-section";
import { MethodSection } from "@/components/sections/method-section";
import { HowItWorksSection } from "@/components/sections/how-it-works-section";
import { ScienceSection } from "@/components/sections/science-section";
import { ResultsSection } from "@/components/sections/results-section";
import { TestimonialsSection } from "@/components/sections/testimonials-section";
import { CoachSection } from "@/components/sections/coach-section";
import { PricingSection } from "@/components/sections/pricing-section";
import { FAQSection } from "@/components/sections/faq-section";
import { CTABand } from "@/components/sections/cta-band";
import { WebsiteContentProvider } from "@/components/website/WebsiteContentProvider";

export const metadata: Metadata = {
  title: "Khairo Diet Clinic — Medically Supervised Weight Loss for Women",
};

export default function HomePage() {
  return (
    <WebsiteContentProvider pageKey="home">
      <>
      <HeroSection />
      <StatBand />
      <ManifestoSection />
      <MethodSection />
      <HowItWorksSection />
      <ScienceSection />
      <ResultsSection />
      <TestimonialsSection />
      <CoachSection />
      <PricingSection />
      <FAQSection />
      <CTABand />
      </>
    </WebsiteContentProvider>
  );
}

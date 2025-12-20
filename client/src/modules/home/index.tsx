import CTASection from "./components/CTASection";
import Features from "./components/Features";
import HeroSection from "./components/HeroSection";
import PricingSection from "./components/PricingSection";
import Tools from "./components/Tools";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[hsl(var(--background))]">
      <HeroSection />
      <Features />
      <Tools />
      <PricingSection />
      <CTASection />
    </div>
  );
}

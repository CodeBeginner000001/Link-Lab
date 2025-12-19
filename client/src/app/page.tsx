import NavBar from "@/src/components/layouts/NavBar";
import HeroSection from "@/src/components/HeroSection";
import Features from "@/src/components/Features";
import Tools from "@/src/components/Tools";
import PricingSection from "../components/PricingSection";
import CTASection from "../components/CTASection";
import Footer from "../components/Footer";

export default function Home() {
  return (
    <div className="min-h-screen bg-[hsl(var(--background))]">
      <NavBar />
      <main>
        <HeroSection/>
        <Features/>
        <Tools/>
        <PricingSection/>
        <CTASection/>
      </main>
      <Footer/>
    </div>
  );
}

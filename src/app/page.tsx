import Navbar from "@/components/landing/Navbar";
import Hero from "@/components/landing/Hero";
import ModeSelect from "@/components/landing/ModeSelect";
import HowToPlay from "@/components/landing/HowToPlay";
import Features from "@/components/landing/Features";
import Footer from "@/components/landing/Footer";
import WickStrip from "@/components/landing/WickStrip";
import ForgeBanner from "@/components/landing/ForgeBanner";
import CityBanner from "@/components/landing/CityBanner";

export default function Home() {
  return (
    <div className="lp-root">
      <Navbar />
      <Hero />
      <WickStrip />
      <ForgeBanner />
      <CityBanner />
      <ModeSelect />
      <HowToPlay />
      <Features />
      <Footer />
    </div>
  );
}

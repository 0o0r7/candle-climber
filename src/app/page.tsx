import Navbar from "@/components/landing/Navbar";
import Hero from "@/components/landing/Hero";
import HowToPlay from "@/components/landing/HowToPlay";
import Features from "@/components/landing/Features";
import Footer from "@/components/landing/Footer";

export default function Home() {
  return (
    <div className="lp-root">
      <Navbar />
      <Hero />
      <HowToPlay />
      <Features />
      <Footer />
    </div>
  );
}

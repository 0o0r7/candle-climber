import Link from "next/link";

const LOGO_URL = "/landing/emblem-prism-icon.jpg";

export default function Navbar() {
  return (
    <nav className="lp-nav">
      <Link href="/" className="lp-nav-logo">
        <img src={LOGO_URL} alt="Candle Climber" />
        <span className="lp-nav-logo-text">CANDLE CLIMBER</span>
      </Link>
      <div className="lp-nav-links">
        <a href="#how-to-play" className="lp-nav-link">HOW TO PLAY</a>
        <a href="#features" className="lp-nav-link">FEATURES</a>
        <Link href="/partners" className="lp-nav-link">PARTNERS</Link>
        <Link href="/city" className="lp-nav-link" style={{ color: "#22d3ee" }}>CHAIN CITY ↗</Link>
        <Link href="/forge" className="lp-nav-link" style={{ color: "#B28DFF" }}>SIGNAL FORGE ↗</Link>
        <Link href="/play" className="lp-nav-link">PLAY</Link>
      </div>
      <Link href="/play" className="lp-btn-primary lp-btn-sm">PLAY NOW</Link>
    </nav>
  );
}

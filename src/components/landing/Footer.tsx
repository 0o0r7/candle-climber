import Link from "next/link";

export default function Footer() {
  return (
    <>
      <section className="lp-cta">
        <h2 className="lp-cta-title">
          READY TO <span className="lime">CLIMB?</span>
        </h2>
        <p className="lp-cta-sub">Today&apos;s chart is waiting. How high can you go?</p>
        <div className="lp-cta-btn">
          <Link href="/play" className="lp-btn-primary">PLAY NOW</Link>
        </div>
      </section>
      <footer className="lp-footer">
        <div className="lp-footer-links">
          <Link href="/play" className="lp-footer-link">PLAY</Link>
          <a href="#how-to-play" className="lp-footer-link">HOW TO PLAY</a>
          <a href="#features" className="lp-footer-link">FEATURES</a>
          <Link href="/partners" className="lp-footer-link">PARTNERS</Link>
          <Link href="/airdrop" className="lp-footer-link">AIRDROP</Link>
          <Link href="/privacy" className="lp-footer-link">PRIVACY</Link>
          <Link href="/terms" className="lp-footer-link">TERMS</Link>
        </div>
        <p className="lp-footer-copy">
          CANDLE CLIMBER · BUILT FOR THE VIBE/VIBE ECOSYSTEM ON ROBINHOOD CHAIN
          <br />
          $WICK is live on Robinhood Chain <b>TESTNET</b> — no real funds, nothing for sale, no
          returns promised. Launch 2026-10-05 · 0xE2cE0Be4e3D420C1e4b5C46493b3d5e03595216c
        </p>
      </footer>
    </>
  );
}

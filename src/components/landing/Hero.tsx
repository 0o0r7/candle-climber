import Link from "next/link";

export default function Hero() {
  return (
    <section className="lp-hero">
      <div className="lp-hero-bg" />
      <div className="lp-hero-overlay" />
      <div className="lp-hero-content">
        <div className="lp-hero-copy">
          <p className="lp-hero-eyebrow">A SKILL PLATFORMER · ONE DAILY CHART · EVERYONE WORLDWIDE</p>
          <h1 className="lp-hero-title">
            THE CHART<br />
            IS THE <span className="lime">LEVEL.</span>
          </h1>
          <p className="lp-hero-sub">
            Real candlestick data becomes the terrain. Green candles hold your weight —
            red ones crumble beneath you. Climb the day&apos;s chart, chain combos, and
            compete on a global leaderboard that resets at midnight UTC.
          </p>
          <div className="lp-hero-cta">
            <Link href="/play" className="lp-btn-primary">START CLIMBING</Link>
            <a href="#how-to-play" className="lp-btn-secondary">HOW TO PLAY</a>
          </div>
          <div className="lp-hero-stats">
            <div className="lp-hero-stat">
              <div className="lp-hero-stat-num">1</div>
              <div className="lp-hero-stat-label">DAILY CHART</div>
            </div>
            <div className="lp-hero-stat">
              <div className="lp-hero-stat-num">00:00</div>
              <div className="lp-hero-stat-label">UTC RESET</div>
            </div>
            <div className="lp-hero-stat">
              <div className="lp-hero-stat-num">∞</div>
              <div className="lp-hero-stat-label">RETRIES</div>
            </div>
          </div>
        </div>

        {/* Owner mascot art (profile A blockbot) as a clean transparent cutout.
            Provenance + the alpha rules it was made under: docs/BRAND-ASSETS.md */}
        <div className="lp-hero-visual">
          <div className="lp-hero-glow" aria-hidden="true" />
          <img
            className="lp-hero-mascot"
            src="/cc/brand/wick-action.webp"
            width={720}
            height={871}
            alt="Wick, the Candle Climber blockbot, mid-jump with its small companion"
          />
        </div>
      </div>
    </section>
  );
}

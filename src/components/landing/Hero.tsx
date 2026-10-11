import Link from "next/link";

export default function Hero() {
  return (
    <section className="lp-hero">
      <div className="lp-hero-bg" />
      <div className="lp-hero-overlay" />
      <div className="lp-hero-content">
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
    </section>
  );
}

import Link from "next/link";

/**
 * Landing-page mode selection — surfaces the three chart pools as first-class
 * choices BEFORE the visitor enters the game (council 2026-10-12, ruling B:
 * CRYPTO / STOCKS / LAUNCHPAD), so a browsing user discovers every data
 * source without needing to reach the play screen.
 *
 * Each card links to /play?mode=<crypto|stocks|launchpad>, which GameCanvas
 * reads to initialize the correct data source. The in-game ModeSelector
 * remains for mid-session switching; legacy ?mode=market links still work
 * (mapped to crypto inside the game).
 */
export default function ModeSelect() {
  return (
    <section className="lp-section" id="modes">
      <p className="lp-section-eyebrow">CHOOSE YOUR CHART</p>
      <h2 className="lp-section-title">Three ways to climb.</h2>
      <p className="lp-section-sub">
        Pick your terrain source before you play — or switch anytime in-game.
        Every chart is a level; every level is real market data.
      </p>
      <div className="lp-modes-grid">
        <Link href="/play?mode=crypto" className="lp-mode-card lp-mode-market">
          <div className="lp-mode-icon">🪙</div>
          <div className="lp-mode-tag">CRYPTO MODE</div>
          <h3 className="lp-mode-title">Established coins</h3>
          <p className="lp-mode-desc">
            Climb real candlestick charts from Binance and the CoinGecko
            top-30 — volatility-scored daily rotation, so the chart actually
            changes day to day. Resets at midnight UTC.
          </p>
          <span className="lp-mode-cta">PLAY CRYPTO →</span>
        </Link>
        <Link href="/play?mode=stocks" className="lp-mode-card lp-mode-stocks">
          <div className="lp-mode-icon">🏦</div>
          <div className="lp-mode-tag">STOCKS MODE</div>
          <h3 className="lp-mode-title">Real equities</h3>
          <p className="lp-mode-desc">
            Weekly candlestick terrain from real stock history (Yahoo/Stooq
            rails), with the official Robinhood Chain on-chain price read to
            verify the level. One equity serves each UTC day.
          </p>
          <span className="lp-mode-cta">PLAY STOCKS →</span>
        </Link>
        <Link href="/play?mode=launchpad" className="lp-mode-card lp-mode-launchpad">
          <div className="lp-mode-icon">🚀</div>
          <div className="lp-mode-tag">LAUNCHPAD MODE</div>
          <h3 className="lp-mode-title">On-chain launches</h3>
          <p className="lp-mode-desc">
            Terrain built from real VibeVibe token launches — every CurveBuy
            and CurveSell event shapes the level. Fresh, volatile, and driven
            by live on-chain trading activity.
          </p>
          <span className="lp-mode-cta">PLAY LAUNCHPAD →</span>
        </Link>
      </div>
    </section>
  );
}

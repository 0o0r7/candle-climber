import Link from "next/link";

/**
 * Landing-page mode selection — surfaces Market Mode and Launchpad Mode as
 * first-class choices BEFORE the visitor enters the game, so a browsing user
 * discovers both data sources without needing to reach the play screen.
 *
 * Each card links to /play?mode=<market|launchpad>, which GameCanvas reads
 * to initialize the correct data source. The in-game ModeSelector remains
 * for mid-session switching.
 */
export default function ModeSelect() {
  return (
    <section className="lp-section" id="modes">
      <p className="lp-section-eyebrow">CHOOSE YOUR CHART</p>
      <h2 className="lp-section-title">Two ways to climb.</h2>
      <p className="lp-section-sub">
        Pick your terrain source before you play — or switch anytime in-game.
        Every chart is a level; every level is real market data.
      </p>
      <div className="lp-modes-grid">
        <Link href="/play?mode=market" className="lp-mode-card lp-mode-market">
          <div className="lp-mode-icon">📈</div>
          <div className="lp-mode-tag">MARKET MODE</div>
          <h3 className="lp-mode-title">Established assets</h3>
          <p className="lp-mode-desc">
            Climb real candlestick charts from Binance, CoinGecko, and the
            Robinhood Chain. Volatility, trends, and gaps all become the
            terrain you climb — resets daily at midnight UTC.
          </p>
          <span className="lp-mode-cta">PLAY MARKET →</span>
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

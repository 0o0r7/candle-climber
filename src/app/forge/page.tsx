import Link from "next/link";

export const metadata = {
  title: "SIGNAL FORGE — The order book is the battlefield",
  description: "A top-down arena survival game where market depth becomes a glowing grid arena. Navigate bid/ask walls, manage margin, collect signals. An alternative concept to Candle Climber.",
};

export default function ForgePage() {
  return (
    <div className="sf-root">
      {/* Nav */}
      <nav className="sf-nav">
        <Link href="/forge" className="sf-nav-logo">
          <span className="sf-logo-mark">◈</span>
          <span className="sf-nav-logo-text">SIGNAL FORGE</span>
        </Link>
        <div className="sf-nav-links">
          <a href="#concept" className="sf-nav-link">CONCEPT</a>
          <a href="#gameplay" className="sf-nav-link">GAMEPLAY</a>
          <a href="#economy" className="sf-nav-link">ECONOMY</a>
          <Link href="/arena" className="sf-nav-link">PLAY</Link>
        </div>
        <Link href="/arena" className="sf-btn-primary sf-btn-sm">ENTER ARENA</Link>
      </nav>

      {/* Hero */}
      <section className="sf-hero">
        <div className="sf-hero-bg" />
        <div className="sf-hero-content">
          <p className="sf-hero-eyebrow">AN ALTERNATIVE CONCEPT · TOP-DOWN ARENA SURVIVAL · MARKET DATA GRID</p>
          <h1 className="sf-hero-title">
            THE ORDER BOOK<br />
            IS THE <span className="sf-mint">BATTLEFIELD.</span>
          </h1>
          <p className="sf-hero-sub">
            Real market data becomes a glowing grid arena. Green cells regenerate your
            margin, red cells drain it. Navigate the arena, collect signal fragments,
            and survive the volatility waves. One arena per day, seeded from the market.
          </p>
          <div className="sf-hero-cta">
            <Link href="/arena" className="sf-btn-primary">ENTER ARENA</Link>
            <a href="#concept" className="sf-btn-secondary">THE CONCEPT</a>
          </div>
          <div className="sf-hero-stats">
            <div className="sf-hero-stat">
              <div className="sf-hero-stat-num">16×12</div>
              <div className="sf-hero-stat-label">GRID ARENA</div>
            </div>
            <div className="sf-hero-stat">
              <div className="sf-hero-stat-num">100%</div>
              <div className="sf-hero-stat-label">MARGIN START</div>
            </div>
            <div className="sf-hero-stat">
              <div className="sf-hero-stat-num">∞</div>
              <div className="sf-hero-stat-label">RETRIES</div>
            </div>
          </div>
        </div>
      </section>

      {/* Concept */}
      <section id="concept" className="sf-section">
        <div className="sf-section-inner">
          <h2 className="sf-section-title">A DIFFERENT PROJECTION OF THE SAME DATA</h2>
          <p className="sf-section-lead">
            Candle Climber climbs a chart. Signal Forge navigates it. Same market data
            and the same daily seed — but the genre, perspective, and interaction model
            are completely different.
          </p>
          <div className="sf-comparison">
            <div className="sf-comp-card">
              <div className="sf-comp-label">CANDLE CLIMBER</div>
              <div className="sf-comp-genre">Vertical Platformer</div>
              <ul>
                <li>Climb UP a chart — green candles hold, red crumble</li>
                <li>1D market reading: price over time</li>
                <li>Binary death: fall off the screen</li>
                <li>Auto-scroll urgency: the chart moves, you keep up</li>
                <li>Dark cyber-lime aesthetic</li>
              </ul>
            </div>
            <div className="sf-comp-arrow">↔</div>
            <div className="sf-comp-card sf-comp-alt">
              <div className="sf-comp-label">SIGNAL FORGE</div>
              <div className="sf-comp-genre">Top-Down Arena Survival</div>
              <ul>
                <li>Navigate THROUGH a grid — green cells heal, red drain</li>
                <li>2D market reading: price direction + candle body shape</li>
                <li>Gradual death: margin erosion over time</li>
                <li>Spatial navigation: you choose where to be</li>
                <li>Voxel holographic neon aesthetic</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Gameplay */}
      <section id="gameplay" className="sf-section sf-section-dark">
        <div className="sf-section-inner">
          <h2 className="sf-section-title">HOW IT PLAYS</h2>
          <div className="sf-gameplay-grid">
            <div className="sf-gp-card">
              <div className="sf-gp-icon sf-gp-green">⬜</div>
              <h3>BID WALLS</h3>
              <p>Green cells regenerate your margin. Signal fragments spawn here. Safe ground — but don't get complacent.</p>
            </div>
            <div className="sf-gp-card">
              <div className="sf-gp-icon sf-gp-red">⬛</div>
              <h3>ASK WALLS</h3>
              <p>Red cells drain your margin. No signals here. Sometimes the shortest path requires crossing danger.</p>
            </div>
            <div className="sf-gp-card">
              <div className="sf-gp-icon sf-gp-magenta">〰️</div>
              <h3>VOLATILITY WAVES</h3>
              <p>Telegraphed 1.5s before arrival. They flip cell states — green becomes red, red becomes green. Adapt or die.</p>
            </div>
            <div className="sf-gp-card">
              <div className="sf-gp-icon sf-gp-purple">◆</div>
              <h3>SIGNAL FRAGMENTS</h3>
              <p>Collect on green cells for score. Chain 5 without touching red for a 2× multiplier. Greed = risk.</p>
            </div>
            <div className="sf-gp-card">
              <div className="sf-gp-icon sf-gp-cyan">✦</div>
              <h3>LIQUIDITY POOLS</h3>
              <p>Rare iridescent cells. Instant +15% margin. One-time use — they vanish after you touch them.</p>
            </div>
            <div className="sf-gp-card">
              <div className="sf-gp-icon sf-gp-gold">⏱️</div>
              <h3>MARGIN IS THE CLOCK</h3>
              <p>You don't fall — you bleed out. Every second on a red cell is a decision. Manage your margin or get liquidated.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Economy */}
      <section id="economy" className="sf-section">
        <div className="sf-section-inner">
          <h2 className="sf-section-title">A TOKEN ECONOMY WE&apos;RE EXPLORING — NOT LIVE</h2>
          <p className="sf-section-lead">
            Signal Forge runs today as a free, fully playable prototype — no token
            mechanics are live. The ideas below are directions under consideration,
            listed for transparency. Nothing here has shipped.
          </p>
          <div className="sf-econ-layers">
            <div className="sf-econ-layer">
              <div className="sf-econ-num">01</div>
              <div className="sf-econ-body">
                <h3>FREE BASE GAME</h3>
                <p>Fully playable with no token. A daily arena seed, all six mutations, and a local best score. Any future token would enhance — never gate.</p>
              </div>
            </div>
            <div className="sf-econ-layer">
              <div className="sf-econ-num">02</div>
              <div className="sf-econ-body">
                <h3>STAKE-TO-COMPETE</h3>
                <p>Planned: daily tournaments gated on a token holding, with rankings weighted by holding duration. Not live — no tournaments or rankings exist yet.</p>
              </div>
            </div>
            <div className="sf-econ-layer">
              <div className="sf-econ-num">03</div>
              <div className="sf-econ-body">
                <h3>MARGIN INSURANCE</h3>
                <p>Planned: a one-time margin recovery per run for token holders. Not live.</p>
              </div>
            </div>
            <div className="sf-econ-layer">
              <div className="sf-econ-num">04</div>
              <div className="sf-econ-body">
                <h3>COSMETIC FOUNDRY</h3>
                <p>Planned: cosmetic skins forged by burning tokens. Not live.</p>
              </div>
            </div>
            <div className="sf-econ-layer">
              <div className="sf-econ-num">05</div>
              <div className="sf-econ-body">
                <h3>SIGNAL PASS</h3>
                <p>Planned: a seasonal pass with cosmetic tracks. Not live.</p>
              </div>
            </div>
            <div className="sf-econ-layer">
              <div className="sf-econ-num">06</div>
              <div className="sf-econ-body">
                <h3>REVENUE BURN</h3>
                <p>Planned: a share of future tournament fees burned. Not live — there are no fees today.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="sf-cta">
        <div className="sf-cta-inner">
          <h2 className="sf-cta-title">READY TO ENTER THE ARENA?</h2>
          <p className="sf-cta-sub">Same daily chart. A different battlefield.</p>
          <Link href="/arena" className="sf-btn-primary sf-btn-lg">ENTER ARENA</Link>
          <div className="sf-cta-alt">
            <span>Or compare with the original:</span>
            <Link href="/" className="sf-cta-link">CANDLE CLIMBER →</Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="sf-footer">
        <div className="sf-footer-inner">
          <div className="sf-footer-brand">
            <span className="sf-logo-mark">◈</span> SIGNAL FORGE
          </div>
          <div className="sf-footer-note">
            An alternative game concept for the vibe/vibe ecosystem on Robinhood Chain.
            Same market data DNA, different genre, different economy.
          </div>
          <div className="sf-footer-links">
            <Link href="/forge">SIGNAL FORGE</Link>
            <Link href="/">CANDLE CLIMBER</Link>
            <Link href="/arena">PLAY</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

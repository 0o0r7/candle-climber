import Link from "next/link";

/**
 * Prominent banner on the Candle Climber home page that surfaces the
 * alternative Signal Forge concept. Placed directly below the hero so a
 * visitor cannot miss it.
 */
export default function ForgeBanner() {
  return (
    <section className="lp-section" id="forge-banner">
      <Link href="/forge" className="lp-forge-banner">
        <div className="lp-forge-glow" />
        <div className="lp-forge-content">
          <div className="lp-forge-eyebrow">◈ ALTERNATIVE CONCEPT · TOP-DOWN ARENA SURVIVAL</div>
          <h2 className="lp-forge-title">
            SIGNAL <span className="lp-forge-mint">FORGE</span>
          </h2>
          <p className="lp-forge-desc">
            The same market data — a completely different game. Navigate a
            glowing grid arena where green cells heal and red cells drain your
            margin. Survive the volatility waves and bank your best score.
            Try it now.
          </p>
          <span className="lp-forge-cta">ENTER SIGNAL FORGE →</span>
        </div>
        <div className="lp-forge-grid-bg" />
      </Link>
    </section>
  );
}

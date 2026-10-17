import Link from "next/link";

export default function CityBanner() {
  return (
    <section className="lp-section" style={{ paddingTop: 0, paddingBottom: 40 }}>
      <Link href="/city" className="city-banner-card">
        <div className="city-banner-glow" />
        <div className="city-banner-content">
          <div className="city-banner-eyebrow">NEW · ECONOMY BUILDER</div>
          <h2 className="city-banner-title">CHAIN CITY</h2>
          <p className="city-banner-desc">
            Build your city in 3D, powered by real market data. Every building runs
            on live stock token prices — NVDA foundries, TSLA depots, ETH markets.
            Grow your treasury; income follows the market. Progress saves locally —
            or online with a wallet. Join a guild with a ?guild= link — registered
            guilds grant a city income buff.
          </p>
          <span className="city-banner-cta">LAUNCH CITY →</span>
        </div>
        <div className="city-banner-grid" />
      </Link>
    </section>
  );
}

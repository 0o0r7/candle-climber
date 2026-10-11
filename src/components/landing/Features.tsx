const features = [
  {
    tag: "TERRAIN",
    title: "Real market data",
    desc: "Levels are built from actual candlestick charts. The shape of the market IS the shape of the level — volatility, trends, and gaps all become gameplay.",
  },
  {
    tag: "DAILY",
    title: "One chart per day",
    desc: "Every player worldwide climbs the exact same chart. The leaderboard resets at midnight UTC. Tomorrow brings a fresh mountain.",
  },
  {
    tag: "MUTATIONS",
    title: "Daily rule twists",
    desc: "Each day introduces a mutation that changes the rules — gravity shifts, wind picks up, volatility spikes. Adapt or fall.",
  },
  {
    tag: "COMPETE",
    title: "Global leaderboard",
    desc: "Submit your score and see where you rank. Link your wallet for the official wallet-bound lane with verified ownership proofs.",
  },
  {
    tag: "GHOSTS",
    title: "Race the best",
    desc: "The top climber's run replays as a translucent ghost on your screen. Chase their line, beat their time, take their crown.",
  },
  {
    tag: "ARCHIVE",
    title: "Replay history",
    desc: "Famous market days live forever as practice terrain. Replay brutal selloffs, legendary rallies, and everything in between.",
  },
];

export default function Features() {
  return (
    <section className="lp-section" id="features">
      <p className="lp-section-eyebrow">FEATURES</p>
      <h2 className="lp-section-title">More than a game.</h2>
      <p className="lp-section-sub">
        Candle Climber turns financial data into a skill-based platformer where the
        market itself shapes every jump, every combo, and every leaderboard rank.
      </p>
      <div className="lp-features-grid">
        {features.map((f) => (
          <div key={f.title} className="lp-feature-card">
            <div className="lp-feature-tag">{f.tag}</div>
            <h3 className="lp-feature-title">{f.title}</h3>
            <p className="lp-feature-desc">{f.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

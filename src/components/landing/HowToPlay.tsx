import { TrendingUp, TrendingDown, MousePointerClick, Zap, Flame, CalendarClock } from "lucide-react";
import GameplayDemo from "./GameplayDemo";

const instructions = [
  {
    icon: TrendingUp,
    color: "green" as const,
    label: "Green candles hold",
    desc: "Bullish candles are solid platforms. Land on them, stand on them, build your run.",
  },
  {
    icon: TrendingDown,
    color: "red" as const,
    label: "Red candles crumble",
    desc: "Bearish candles collapse the moment you touch them. Read the chart, plan your jumps.",
  },
  {
    icon: MousePointerClick,
    color: "lime" as const,
    label: "Tap to jump",
    desc: (
      <>
        <span className="lp-howto-key">TAP</span> or <span className="lp-howto-key">SPACE</span> = hop.
        Hold longer for a higher jump. Release early for a shorter one.
      </>
    ),
  },
  {
    icon: Zap,
    color: "lime" as const,
    label: "Rush mode",
    desc: (
      <>
        Hold <span className="lp-howto-key">SHIFT</span> to rush — climb faster and gain +25% score
        while held. Higher risk, higher reward.
      </>
    ),
  },
  {
    icon: Flame,
    color: "lime" as const,
    label: "Chain combos",
    desc: "Land consecutive candles without falling to build a combo multiplier. The longer the streak, the bigger the score.",
  },
  {
    icon: CalendarClock,
    color: "faint" as const,
    label: "Daily reset",
    desc: "A new chart drops at 00:00 UTC. Same level for every player worldwide. Tomorrow brings a new mountain to climb.",
  },
];

export default function HowToPlay() {
  return (
    <section className="lp-section" id="how-to-play">
      <p className="lp-section-eyebrow">HOW TO PLAY</p>
      <h2 className="lp-section-title">Read the chart. Don&apos;t fall.</h2>
      <p className="lp-section-sub">
        The terrain is the chart itself — every candle is a platform, every gap is a decision.
        Here&apos;s what you need to know before your first climb.
      </p>
      <GameplayDemo />
      <div className="lp-howto-grid">
        {instructions.map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.label} className="lp-howto-card">
              <div className={`lp-howto-icon ${item.color}`}>
                <Icon size={20} strokeWidth={2} />
              </div>
              <h3 className="lp-howto-label">{item.label}</h3>
              <p className="lp-howto-desc">{item.desc}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
}

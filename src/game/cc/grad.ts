// ART V4 graduation celebration — deterministic wax-confetti data.
// PURE DATA: no canvas, no DOM, no wall clock. The renderer consumes these
// params and the unit suite pins them (same seed ⇒ same celebration — the W5
// determinism spirit applied to the token-era visuals, ART-DIRECTION §7 V4).
import { hashString, mulberry32 } from "./rng";

export const CONFETTI_N = 46;      // shards in the summit volley
export const CONFETTI_LIFE = 3.2;  // seconds until the last shard fades
export const BEACON_ALPHA = 0.16;  // resting summit beacon after the burst

// Palette — locked (CC-PLAN §2). Lime leads; up-green carries the mass;
// purple accents; coral is a rare sparkle (red means DOWN in the market
// grammar, so it may never dominate a celebration); gold nods to the summit
// flag; wax-white is the shine chip.
const CONFETTI_COLORS = [
  "#CCFF00", "#5BD08A", "#5BD08A", "#6A63C8", "#E07856", "#E0B04E", "#F5F7FA",
];

export interface GradShard {
  x: number;     // spawn offset from the summit center (px)
  y: number;     // spawn offset from the summit cap (negative = above)
  vx: number;    // px/s
  vy: number;    // px/s (negative = up)
  g: number;     // px/s² gravity for this shard
  rot: number;   // initial rotation (rad)
  spin: number;  // rad/s
  w: number;     // shard width
  h: number;     // shard height
  wick: boolean; // candle-shard (rect + wick hairline) vs plain wax chip
  color: string;
  delay: number; // seconds before the shard spawns (staggered volley)
}

/** Deterministic confetti volley for a level seed. Same seed ⇒ same shards,
 *  same order, same numbers — a replay renders an identical celebration. */
export function gradConfetti(seedStr: string, n = CONFETTI_N): GradShard[] {
  const rnd = mulberry32(hashString("cc-grad:" + seedStr));
  const out: GradShard[] = [];
  for (let i = 0; i < n; i++) {
    out.push({
      x: (rnd() - 0.5) * 26,
      y: -4 - rnd() * 8,
      vx: (rnd() - 0.5) * 460,
      vy: -320 - rnd() * 380,
      g: 620 + rnd() * 300,
      rot: rnd() * Math.PI * 2,
      spin: (rnd() - 0.5) * 14,
      w: 3 + rnd() * 5,
      h: 6 + rnd() * 9,
      wick: rnd() < 0.28,
      color: CONFETTI_COLORS[Math.floor(rnd() * CONFETTI_COLORS.length)],
      delay: rnd() * 0.5,
    });
  }
  return out;
}

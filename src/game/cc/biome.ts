// BIOME SYSTEM — market-condition environments (desert/tundra/storm/temperate).
// Extends the H2 weather system: weather gives raw numbers (wind/fog/tremor),
// biome maps those + market direction into a distinct visual environment.
//
// PURE module: candles + seed in, biome out — no fetch, no Date.now(), no
// Math.random(). Same terrain ⇒ same biome (W5 invariant). The renderer may
// only VISUALIZE the biome; no biome effect may break market legibility.
import type { Candle } from "./types";
import { hashString } from "./rng";

export type BiomeId = "temperate" | "desert" | "tundra" | "storm";

export interface Biome {
  id: BiomeId;
  name: string;
  /** Sky tint applied over the base gradient (rgba). */
  skyTint: string;
  /** Ambient particle color (rgba). */
  particleColor: string;
  /** Vignette edge color (rgba). */
  vignetteColor: string;
  /** Number of ambient particles. */
  particleCount: number;
  /** Particle drift speed multiplier. */
  particleSpeed: number;
  /** Particle type for the renderer. */
  particleType: "dust" | "snow" | "rain" | "spark";
  /** Ground/abyss gradient color (rgba). */
  abyssColor: string;
}

const BIOMES: Record<BiomeId, Biome> = {
  temperate: {
    id: "temperate",
    name: "TEMPERATE",
    skyTint: "rgba(16,18,20,0)",
    particleColor: "rgba(204,255,0,0.15)",
    vignetteColor: "rgba(12,14,16,0.5)",
    particleCount: 26,
    particleSpeed: 1,
    particleType: "spark",
    abyssColor: "rgba(224,120,86,0.10)",
  },
  desert: {
    id: "desert",
    name: "RANGING · DESERT",
    skyTint: "rgba(180,140,70,0.06)",
    particleColor: "rgba(200,184,154,0.12)",
    vignetteColor: "rgba(60,40,10,0.55)",
    particleCount: 18,
    particleSpeed: 0.6,
    particleType: "dust",
    abyssColor: "rgba(180,140,70,0.08)",
  },
  tundra: {
    // crypto winter has to be unmistakable at a glance on video: a cold blue
    // cast over the frame, denser snow, icy floor. Cosmetic only — candle
    // reds/greens keep their own colours (legibility is gameplay).
    id: "tundra",
    name: "BEARISH · TUNDRA",
    skyTint: "rgba(120,170,210,0.08)",
    particleColor: "rgba(191,232,242,0.20)",
    vignetteColor: "rgba(20,40,60,0.6)",
    particleCount: 36,
    particleSpeed: 1.2,
    particleType: "snow",
    abyssColor: "rgba(80,130,170,0.15)",
  },
  storm: {
    id: "storm",
    name: "VOLATILE · STORM",
    skyTint: "rgba(40,40,60,0.08)",
    particleColor: "rgba(140,150,170,0.20)",
    vignetteColor: "rgba(8,10,14,0.6)",
    particleCount: 40,
    particleSpeed: 2.5,
    particleType: "rain",
    abyssColor: "rgba(224,120,86,0.14)",
  },
};

const TAIL = 12;

/**
 * Derive biome from market conditions:
 * - Low volatility + ranging → desert (boring market, stark environment)
 * - Bearish trend / high red ratio → tundra (crypto winter)
 * - High volatility → storm (chaotic market)
 * - Otherwise → temperate (default vibe)
 *
 * Selection is deterministic: same candles + same seed ⇒ same biome.
 */
export function deriveBiome(candles: Candle[], seedStr: string): Biome {
  if (!candles || candles.length < 2) return BIOMES.temperate;

  const tail = candles.slice(Math.max(0, candles.length - TAIL));
  const first = candles[0];
  const last = candles[candles.length - 1];
  const changePct = ((last.c - first.o) / (Math.abs(first.o) || 1)) * 100;

  // ATR (range ratio) over the tail
  let atrSum = 0;
  let red = 0;
  for (const c of tail) {
    const o = Math.abs(c.o) || 1;
    atrSum += (c.h - c.l) / o;
    if (c.c < c.o) red++;
  }
  const atr = atrSum / tail.length;
  const redRatio = red / tail.length;

  // Deterministic tiebreaker (never changes the biome for the same seed)
  const h = hashString("cc-biome:" + seedStr);

  // Storm: high volatility (ATR > 0.06)
  if (atr > 0.06) return BIOMES.storm;

  // Tundra: bearish trend (changePct < -5%) or high red ratio (> 0.55)
  if (changePct < -5 || redRatio > 0.55) return BIOMES.tundra;

  // Desert: low volatility ranging (ATR < 0.025 and |changePct| < 3)
  if (atr < 0.025 && Math.abs(changePct) < 3) return BIOMES.desert;

  // Temperate: everything else (the default vibe/vibe palette)
  void h;
  return BIOMES.temperate;
}

export function biomeById(id: BiomeId): Biome {
  return BIOMES[id] ?? BIOMES.temperate;
}

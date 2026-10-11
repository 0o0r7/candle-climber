// Landing-page showcase chart — a synthetic 1h series (NOT a real asset).
// Four back-to-back market moods, each paired with the biome + weather the
// real game would derive for that kind of market, so one ~30s loop of the
// demo walks through every environment: calm → sunny desert → storm → snow.
//
// Pure + deterministic (seeded PRNG): the same chart every load, so the demo
// pilot's run is identical in every browser (validated headlessly).
import type { Candle } from "@/game/cc/types";
import type { BiomeId } from "@/game/cc/biome";
import { windLabelOf, fogLabelOf, type Weather } from "@/game/cc/weather";
import { hashString, mulberry32 } from "@/game/cc/rng";
import { LAUNCH_PAD } from "@/game/cc/level";

export const DEMO_SEED = "2025-06-15SHOWCASE";
const HOUR = 3_600_000;

interface Section {
  biome: BiomeId;
  /** Candles in this section (≈7.5s of climbing each at demo speed). */
  count: number;
  /** One candle's close-to-close move as a fraction of price. */
  move: (rnd: () => number, k: number, price: number, anchor: number) => number;
  /** Wick size multiplier. */
  wick: number;
  weather: Pick<Weather, "wind" | "fog" | "tremor">;
}

const pick = (rnd: () => number, lo: number, hi: number) => lo + rnd() * (hi - lo);

const SECTIONS: Section[] = [
  {
    // calm bull run — mostly green steps with small pullbacks
    biome: "temperate",
    count: 12,
    move: (r) => (r() < 0.72 ? pick(r, 0.012, 0.028) : -pick(r, 0.008, 0.018)),
    wick: 0.4,
    weather: { wind: 0.08, fog: 0.12, tremor: 0.04 },
  },
  {
    // sideways range — price oscillates around an anchor (sunny desert)
    biome: "desert",
    count: 15,
    move: (r, k, price, anchor) => (anchor - price) / price * 0.6 + (k % 2 === 0 ? 1 : -1) * pick(r, 0.008, 0.016),
    wick: 0.3,
    weather: { wind: 0.25, fog: 0.3, tremor: 0.02 },
  },
  {
    // volatility spike — pump/dump clusters (storm)
    biome: "storm",
    count: 17,
    move: (r, k) => (Math.floor(k / 3) % 2 === 0 ? 1 : -1) * pick(r, 0.03, 0.06),
    wick: 0.9,
    weather: { wind: 0.85, fog: 0.5, tremor: 0.6 },
  },
  {
    // bearish slide with relief bounces (crypto winter)
    biome: "tundra",
    count: 40,
    move: (r) => (r() < 0.32 ? pick(r, 0.015, 0.03) : -pick(r, 0.012, 0.026)),
    wick: 0.5,
    weather: { wind: 0.45, fog: 0.35, tremor: 0.3 },
  },
];

export interface DemoZone {
  biome: BiomeId;
  /** First candle index of this zone (inclusive). */
  from: number;
  weather: Weather;
}

/** Biome zones by candle index — the weather follows the terrain under the player. */
export const DEMO_ZONES: DemoZone[] = (() => {
  let from = 0;
  return SECTIONS.map((s, n) => {
    const z: DemoZone = {
      biome: s.biome,
      from: n === 0 ? 0 : from,
      weather: {
        ...s.weather,
        windDir: n % 2 === 0 ? 1 : -1,
        atr: s.weather.wind * 0.12 + 0.03,
        windLabel: windLabelOf(s.weather.wind),
        fogLabel: fogLabelOf(s.weather.fog),
      },
    };
    from += (n === 0 ? LAUNCH_PAD : 0) + s.count;
    return z;
  });
})();

export function zoneAt(candleIdx: number): DemoZone {
  let z = DEMO_ZONES[0];
  for (const zone of DEMO_ZONES) if (candleIdx >= zone.from) z = zone;
  return z;
}

export function demoCandles(): Candle[] {
  const rnd = mulberry32(hashString("cc-demo-chart-v3"));
  const t0 = Date.parse("2025-06-11T00:00:00Z");
  const out: Candle[] = [];
  let price = 100;
  const push = (o: number, c: number, wick: number) => {
    const body = Math.abs(c - o) / o;
    const w = (body * 0.6 + 0.004) * wick;
    out.push({
      t: t0 + out.length * HOUR,
      o,
      c,
      h: Math.max(o, c) * (1 + w * (0.4 + rnd())),
      l: Math.min(o, c) * (1 - w * (0.4 + rnd())),
    });
  };

  // flat launch pad (the level builder flattens it anyway)
  for (let i = 0; i < LAUNCH_PAD; i++) push(price, price, 0.2);

  for (const s of SECTIONS) {
    const anchor = price;
    for (let k = 0; k < s.count; k++) {
      const o = price;
      const c = Math.max(1, o * (1 + s.move(rnd, k, o, anchor)));
      push(o, c, s.wick);
      price = c;
    }
  }
  return out;
}

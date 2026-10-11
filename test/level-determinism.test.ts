/// <reference types="bun-types" />
// W5 determinism pins for the level builder (bun test, zero deps).
// Extends 30-b's summit coverage: buildPlatforms must be a PURE function of
// (candles, seedString) — same inputs, byte-identical platforms; different
// seed, different terrain; summit still exactly on the LAST platform.
// Fixtures cover the three terrain shapes the app really feeds it:
//   - synthetic (the tokenless fallback, via syntheticCandles)
//   - stock-shaped (stooq weekly rails: steady uptrend, occasional red week)
//   - launch-shaped (vibe/vibe launch-of-the-day, via pure vibeLaunchCandles)
// No network: every fixture is generated locally.
import { describe, test, expect } from "bun:test";
import { buildPlatforms, LAUNCH_PAD, EASE_CANDLES, EASE_STEP, CANDLE_W, PLATFORM_W } from "@/game/cc/level";
import { syntheticCandles, LIMIT } from "@/game/cc/level-source";
import { vibeLaunchCandles, type VibeLaunch } from "@/lib/vibe-launch";
import type { Candle } from "@/game/cc/types";

/* ------------------------------- fixtures -------------------------------- */

const DAY_MS = 86_400_000;
const DATE = "2026-09-30";

// real-payload-shaped launch fixture (research-cache/launches_ALL.json shape)
const LAUNCH: VibeLaunch = {
  launchId: "cc-test-launch-001",
  symbol: "OFFL",
  createdAt: "2026-07-01T00:00:00.000Z", // exactly 91 full days before DATE T00:00 -> floor(91) -> count 151
  graduated: true,
  holderCount: 312,
  volume24hPairUnits: "1530000000000000000000", // 18-decimal units, ~1530 pair units
  buyCount24h: 812,
  sellCount24h: 733,
};

/** Stooq-shaped weekly candles: steady uptrend, a red week every 7th, real wicks. */
function stockShapedCandles(count: number): Candle[] {
  const out: Candle[] = [];
  let price = 12;
  const t0 = Date.parse("2022-07-01T00:00:00Z");
  for (let i = 0; i < count; i++) {
    const o = price;
    const move = 0.006 + (i % 7 === 3 ? -0.012 : 0); // mostly up, occasional red week
    const c = Math.max(1, o * (1 + move));
    const h = Math.max(o, c) * 1.008;
    const l = Math.min(o, c) * 0.992;
    out.push({ t: t0 + i * 7 * DAY_MS, o, h, l, c });
    price = c;
  }
  return out;
}

const FIXTURES: Array<{ name: string; candles: Candle[] }> = [
  { name: "synthetic 2026-09-30", candles: syntheticCandles(DATE, LIMIT) },
  { name: "synthetic 2026-01-15", candles: syntheticCandles("2026-01-15", LIMIT) },
  { name: "stock-shaped (stooq-like)", candles: stockShapedCandles(LIMIT) },
  { name: "launch-shaped (vibe/vibe)", candles: vibeLaunchCandles(LAUNCH, DATE) },
];

const SEEDS = [`${DATE}SOLUSDT`, `${DATE}TSLA`, `${DATE}OFFL`, "2026-01-15BTCUSDT"];

/* --------------------------------- tests --------------------------------- */

describe("W5 buildPlatforms determinism", () => {
  test("same candles + same seedString x2 -> byte-identical platform arrays", () => {
    for (const f of FIXTURES) {
      for (const seedStr of SEEDS) {
        const a = JSON.stringify(buildPlatforms(f.candles, seedStr));
        const b = JSON.stringify(buildPlatforms(f.candles, seedStr));
        expect(a).toBe(b); // byte-identical, not merely deep-equal
        expect(buildPlatforms(f.candles, seedStr)).toEqual(buildPlatforms(f.candles, seedStr));
      }
    }
  });

  test("different seed -> different terrain (per fixture)", () => {
    for (const f of FIXTURES) {
      const seeds = [`${DATE}SOLUSDT`, `${DATE}BTCUSDT`];
      const a = JSON.stringify(buildPlatforms(f.candles, seeds[0]));
      const b = JSON.stringify(buildPlatforms(f.candles, seeds[1]));
      expect(a).not.toBe(b);
    }
  });

  test("summit flag exactly on the LAST platform, for every fixture x seed", () => {
    for (const f of FIXTURES) {
      for (const seedStr of SEEDS) {
        const plats = buildPlatforms(f.candles, seedStr);
        expect(plats.length).toBe(f.candles.length);
        const summitIdx = plats.map((p, i) => (p.summit ? i : -1)).filter((i) => i >= 0);
        expect(summitIdx).toEqual([plats.length - 1]);
      }
    }
  });

  test("launch-shaped fixture really is launch terrain (length from real age)", () => {
    // 2026-07-01 -> 2026-09-30 = 91 days old -> count = clamp(60, 60+91, 219) = 151
    const candles = vibeLaunchCandles(LAUNCH, DATE);
    expect(candles.length).toBe(151);
    const plats = buildPlatforms(candles, `${DATE}OFFL`);
    expect(plats.length).toBe(candles.length);
    expect(plats[plats.length - 1].summit).toBe(true);
  });

  test("G2-F1 ease: pad flat+solid, first post-pad steps gentle (|Δy| <= EASE_STEP, gapless)", () => {
    for (const f of FIXTURES) {
      for (const seedStr of SEEDS) {
        const plats = buildPlatforms(f.candles, seedStr);
        // pad: first LAUNCH_PAD candles flat, contiguous (CANDLE_W wide), no gaps
        for (let i = 0; i < LAUNCH_PAD; i++) {
          expect(plats[i].w).toBe(CANDLE_W);
          expect(plats[i].state).toBe("solid");
          expect(plats[i].y).toBe(plats[0].y); // flat
        }
        // ease window: gapless + every close-platform step within EASE_STEP
        for (let i = LAUNCH_PAD; i < LAUNCH_PAD + EASE_CANDLES; i++) {
          expect(plats[i].w).toBe(PLATFORM_W); // not a full gap
          const dy = Math.abs(plats[i].y - plats[i - 1].y);
          expect(dy).toBeLessThanOrEqual(EASE_STEP + 1e-6);
        }
      }
    }
  });
});

// ── Daily rotation v2 (owner report 2026-10-11) ─────────────────────────────
// The legacy 6-crypto hash pick clustered (XRPUSDT served 2026-10-10 AND
// 2026-10-11 back-to-back) and the W3 stock rails never entered the daily
// level. From ROTATION_V2_FROM the daily symbol cycles ALL nine symbols
// (crypto + stocks) in a fixed shuffled order — no consecutive repeats.
import {
  ALL_SYMBOLS,
  ROTATION_ORDER,
  ROTATION_V2_FROM,
  STOCKS,
  WATCHLIST,
  pickSeed,
  rotationSymbol,
} from "@/game/cc/level-source";
import { hashString, mulberry32 } from "@/game/cc/rng";

describe("daily rotation v2 (crypto + stocks cycle)", () => {
  const addDays = (d: string, n: number) =>
    new Date(Date.parse(d + "T00:00:00Z") + n * 86_400_000).toISOString().slice(0, 10);

  test("cutoff + order pins: ROTATION_ORDER is a pure permutation of ALL_SYMBOLS", () => {
    expect(ROTATION_V2_FROM).toBe("2026-10-12");
    expect(ROTATION_ORDER).toHaveLength(ALL_SYMBOLS.length);
    expect([...ROTATION_ORDER].sort()).toEqual([...ALL_SYMBOLS].sort());
    // stocks really ride the daily level from the cutoff
    for (const s of STOCKS) expect(ROTATION_ORDER).toContain(s);
  });

  test("legacy dates keep the pinned hash pick (run tokens + archive replays stay valid)", () => {
    expect(pickSeed("2026-10-10").symbol).toBe("XRPUSDT"); // served live, token-pinned
    expect(pickSeed("2026-10-11").symbol).toBe("XRPUSDT");
    expect(pickSeed("2026-09-30").symbol).toBe("BNBUSDT");
    // the whole legacy era (60 days ending the day before the cutoff) stays crypto-only
    for (let i = 0; i < 60; i++) {
      expect(WATCHLIST).toContain(pickSeed(addDays("2026-08-13", i)).symbol);
    }
  });

  test("v2 era: whitelisted symbols, NO consecutive repeats, every 9-day window covers all 9", () => {
    let prev = "";
    for (let i = 0; i < 90; i++) {
      const s = pickSeed(addDays(ROTATION_V2_FROM, i)).symbol;
      expect(ALL_SYMBOLS).toContain(s);
      if (i > 0) expect(s).not.toBe(prev); // the owner-visible bug class: same chart twice in a row
      prev = s;
    }
    for (let w = 0; w + 9 <= 90; w += 9) {
      const window = new Set<string>();
      for (let i = w; i < w + 9; i++) window.add(pickSeed(addDays(ROTATION_V2_FROM, i)).symbol);
      expect([...window].sort()).toEqual([...ALL_SYMBOLS].sort());
    }
  });

  test("v2 pick IS the day-index round-robin over ROTATION_ORDER", () => {
    for (const d of ["2026-10-12", "2026-10-13", "2027-01-01", "2030-05-20"]) {
      expect(pickSeed(d).symbol).toBe(rotationSymbol(d));
    }
  });

  test("symbol versioning NEVER touches the synthetic rng stream (terrains stay byte-identical)", () => {
    // exactly ONE rnd() draw is consumed inside pickSeed in BOTH eras — the
    // stream syntheticCandles sees is unchanged for every date
    for (const d of ["2026-10-11", "2026-10-12", "2026-10-13"]) {
      const ref = mulberry32(hashString("cc-daily-v1:" + d));
      ref(); // the legacy symbol draw
      expect(pickSeed(d).rnd()).toBe(ref());
    }
  });
});

/// <reference types="bun-types" />
// P0.2 — deterministic difficulty director: contract tests (bun test, zero deps).
//
// Pins the invariants the design rests on (docs/DIFFICULTY-DIRECTOR.md):
//  1. PURITY — sectorAt/gapChanceAt are pure functions of (index, total); the
//     same candle index is the same sector for every player, which is what
//     keeps a shared daily board comparable (no per-player adaptation).
//  2. SHAPE — intro is solid, the three-phase cycle repeats, escalation is
//     capped, and the last SUMMIT_APPROACH candles are gap-free.
//  3. LEVEL WIRING — buildPlatforms honours the director: zero gaps in the
//     intro and the summit approach, never two gaps in a row, and still a pure
//     function of (candles, seed).
//  4. FAIRNESS — every gap the director can produce is crossable with the
//     engine's own jump math at the SLOWEST camera speed of the run.
import { describe, test, expect } from "bun:test";
import {
  sectorAt, gapChanceAt, sectorRoute, isFinaleCandle,
  INTRO_CANDLES, SUMMIT_APPROACH, SUMMIT_FINALE, CYCLE_LEN, TREND_LEN, SQUEEZE_LEN, BREATHER_LEN,
} from "@/game/cc/director";
import {
  buildPlatforms, CANDLE_W, PLATFORM_W, LAUNCH_PAD, EASE_CANDLES, MAX_UP, MAX_DOWN, FINALE_FUSE,
} from "@/game/cc/level";
import { syntheticCandles, LIMIT } from "@/game/cc/level-source";
import { vibeLaunchCandles, type VibeLaunch } from "@/lib/vibe-launch";
import { GRAVITY, JUMP_V, HANG_GRAVITY, CAM_BASE } from "@/game/cc/engine";
import type { Candle } from "@/game/cc/types";

const DATE = "2026-09-30";

/* ------------------------------- fixtures -------------------------------- */

const LAUNCH: VibeLaunch = {
  launchId: "cc-test-launch-001",
  symbol: "OFFL",
  createdAt: "2026-07-01T00:00:00.000Z",
  graduated: true,
  holderCount: 312,
  volume24hPairUnits: "1530000000000000000000",
  buyCount24h: 812,
  sellCount24h: 733,
};

function stockShapedCandles(count: number): Candle[] {
  const out: Candle[] = [];
  let price = 12;
  const t0 = Date.parse("2022-07-01T00:00:00Z");
  for (let i = 0; i < count; i++) {
    const o = price;
    const move = 0.006 + (i % 7 === 3 ? -0.012 : 0);
    const c = Math.max(1, o * (1 + move));
    out.push({ t: t0 + i * 7 * 86_400_000, o, h: Math.max(o, c) * 1.008, l: Math.min(o, c) * 0.992, c });
    price = c;
  }
  return out;
}

const FIXTURES: Array<{ name: string; candles: Candle[] }> = [
  { name: "synthetic", candles: syntheticCandles(DATE, LIMIT) },
  { name: "synthetic alt-date", candles: syntheticCandles("2026-01-15", LIMIT) },
  { name: "stock-shaped", candles: stockShapedCandles(LIMIT) },
  { name: "launch-shaped", candles: vibeLaunchCandles(LAUNCH, DATE) },
];

const SEEDS = [`${DATE}SOLUSDT`, `${DATE}TSLA`, "2026-01-15BTCUSDT"];

/* --------------------------- 1. purity & shape ---------------------------- */

describe("P0.2 director — pure, deterministic schedule", () => {
  test("same (index, total) ⇒ identical sector (no clock, no randomness)", () => {
    for (let i = 0; i < LIMIT; i++) {
      const a = sectorAt(i, LIMIT);
      const b = sectorAt(i, LIMIT);
      expect(JSON.stringify(a)).toBe(JSON.stringify(b));
      expect(gapChanceAt(i, LIMIT)).toBe(a.gap);
    }
  });

  test("opening is solid: no gaps before INTRO_CANDLES", () => {
    expect(INTRO_CANDLES).toBeGreaterThanOrEqual(LAUNCH_PAD + EASE_CANDLES);
    for (let i = 0; i < INTRO_CANDLES; i++) {
      expect(gapChanceAt(i, LIMIT)).toBe(0);
      expect(sectorAt(i, LIMIT).kind).toBe("intro");
    }
  });

  test("the last SUMMIT_APPROACH candles are gap-free (earned landing)", () => {
    for (let i = LIMIT - SUMMIT_APPROACH; i < LIMIT; i++) {
      expect(gapChanceAt(i, LIMIT)).toBe(0);
    }
    // P0.7: the approach is the clean runway; the 3 candles directly UNDER the
    // cap are the closing bell (a separate beat), and the cap stays SUMMIT.
    for (let i = LIMIT - SUMMIT_APPROACH; i < LIMIT - 1 - SUMMIT_FINALE; i++) {
      expect(sectorAt(i, LIMIT).kind).toBe("summit");
    }
    for (let i = LIMIT - 1 - SUMMIT_FINALE; i < LIMIT - 1; i++) {
      expect(sectorAt(i, LIMIT).kind).toBe("finale");
    }
    expect(sectorAt(LIMIT - 1, LIMIT).kind).toBe("summit"); // the cap never folds
    expect(sectorAt(LIMIT, 0).kind).not.toBe("summit"); // endless terrain: no summit
  });

  test("three-phase cycle repeats with a capped escalation", () => {
    // first cycle boundaries, measured from the end of the intro
    const base = INTRO_CANDLES;
    expect(sectorAt(base, LIMIT).kind).toBe("trend");
    expect(sectorAt(base + TREND_LEN, LIMIT).kind).toBe("squeeze");
    expect(sectorAt(base + TREND_LEN + SQUEEZE_LEN, LIMIT).kind).toBe("breather");
    expect(sectorAt(base + CYCLE_LEN, LIMIT).kind).toBe("trend");

    // inside a cycle: breather < trend < squeeze (one idea, harder, then release)
    const t = gapChanceAt(base, LIMIT);
    const s = gapChanceAt(base + TREND_LEN, LIMIT);
    const b = gapChanceAt(base + TREND_LEN + SQUEEZE_LEN, LIMIT);
    expect(b).toBeLessThan(t);
    expect(t).toBeLessThan(s);

    // escalation is monotonic but capped: cycle 3 and cycle 4 are identical
    expect(gapChanceAt(base + 4 * CYCLE_LEN, LIMIT)).toBe(gapChanceAt(base + 3 * CYCLE_LEN, LIMIT));
    expect(gapChanceAt(base + 3 * CYCLE_LEN, LIMIT)).toBeGreaterThan(gapChanceAt(base, LIMIT));
  });

  test("sectorRoute describes the day's climb in order, once per boundary", () => {
    const route = sectorRoute(LIMIT);
    expect(route[0].start).toBe(0);
    expect(route[0].sector.kind).toBe("intro");
    expect(route[route.length - 1].sector.kind).toBe("summit");
    expect(route[route.length - 1].start).toBe(LIMIT - 1);
    // P0.7: the summit approach → closing bell → cap sequence is its own shape.
    expect(route[route.length - 2].sector.kind).toBe("finale");
    expect(route[route.length - 2].start).toBe(LIMIT - 1 - SUMMIT_FINALE);
    expect(route[route.length - 3].sector.kind).toBe("summit");
    expect(route[route.length - 3].start).toBe(LIMIT - SUMMIT_APPROACH);
    // no duplicate consecutive sectors
    for (let i = 1; i < route.length; i++) expect(route[i].sector.id).not.toBe(route[i - 1].sector.id);
  });

  test("short levels (foreign/live feeds) never lose the intro", () => {
    for (const total of [0, 5, 13, 20, 24, 40]) {
      expect(sectorAt(0, total).kind).toBe("intro");
      if (total >= INTRO_CANDLES + SUMMIT_APPROACH) {
        expect(sectorAt(total - 1, total).kind).toBe("summit");
      }
    }
  });
});

/* ------------------------- 2. level wiring & purity ----------------------- */

describe("P0.2 director — buildPlatforms honours the schedule", () => {
  test("zero gaps in the intro and in the summit approach", () => {
    for (const f of FIXTURES) {
      for (const seed of SEEDS) {
        const plats = buildPlatforms(f.candles, seed);
        for (const p of plats) {
          const inIntro = p.i < INTRO_CANDLES;
          const inSummit = p.i >= plats.length - SUMMIT_APPROACH;
          if (inIntro || inSummit) expect(p.w).toBeGreaterThan(0);
        }
      }
    }
  });

  test("intro is a safe space: no gaps and nothing folds before INTRO_CANDLES", () => {
    for (const f of FIXTURES) {
      for (const seed of SEEDS) {
        const plats = buildPlatforms(f.candles, seed);
        for (const p of plats.slice(0, INTRO_CANDLES)) expect(p.crumble).toBe(false);
        // …and red candles DO fold again after it (the rule is delayed, not removed)
        expect(plats.slice(INTRO_CANDLES).some((p) => p.crumble)).toBe(true);
      }
    }
  });

  test("P0.7 closing bell: every candle under the cap folds, the cap never does", () => {
    for (const f of FIXTURES) {
      for (const seed of SEEDS) {
        const plats = buildPlatforms(f.candles, seed);
        const n = plats.length;
        for (let k = 1; k <= SUMMIT_FINALE; k++) {
          const p = plats[n - 1 - k];
          expect(isFinaleCandle(p.i, n)).toBe(true);
          expect(p.crumble).toBe(true); // colour-independent: green folds too
          expect(p.fuse).toBe(FINALE_FUSE);
          expect(p.w).toBeGreaterThan(0); // rhythm check, never a reach check
        }
        expect(plats[n - 1].fuse).toBeUndefined(); // the summit cap stays landable
        // exactly the authored finale carries a fuse — no drift into the rest
        expect(plats.filter((p) => p.fuse !== undefined).length).toBe(SUMMIT_FINALE);
      }
    }
  });

  test("never two gaps in a row (one gap = one jump the speed curve can pay for)", () => {
    for (const f of FIXTURES) {
      for (const seed of SEEDS) {
        const plats = buildPlatforms(f.candles, seed);
        for (let i = 1; i < plats.length; i++) {
          if (plats[i].w === 0) expect(plats[i - 1].w).toBeGreaterThan(0);
        }
      }
    }
  });

  test("the director actually delivers gaps in the mid-chart", () => {
    for (const f of FIXTURES) {
      const plats = buildPlatforms(f.candles, `${DATE}SOLUSDT`);
      const mid = plats.slice(INTRO_CANDLES, plats.length - SUMMIT_APPROACH).filter((p) => p.w === 0);
      expect(mid.length).toBeGreaterThan(0);
    }
  });

  test("still a pure function of (candles, seed): same inputs ⇒ byte-identical", () => {
    for (const f of FIXTURES) {
      const a = JSON.stringify(buildPlatforms(f.candles, `${DATE}SOLUSDT`));
      const b = JSON.stringify(buildPlatforms(f.candles, `${DATE}SOLUSDT`));
      expect(a).toBe(b);
      const c = JSON.stringify(buildPlatforms(f.candles, `${DATE}BTCUSDT`));
      expect(a).not.toBe(c);
    }
  });

  test("vertical fairness clamps still hold across every gap", () => {
    for (const f of FIXTURES) {
      const plats = buildPlatforms(f.candles, `${DATE}SOLUSDT`);
      for (let i = 1; i < plats.length; i++) {
        const dy = plats[i].y - plats[i - 1].y;
        expect(dy).toBeLessThanOrEqual(MAX_DOWN + 0.01);
        expect(dy).toBeGreaterThanOrEqual(-MAX_UP - 0.01);
      }
    }
  });
});

/* ----------------------------- 3. fairness -------------------------------- */

/** Airtime of a held (hang) jump — the engine's own numbers, no magic constants. */
function airtime(): number {
  const g = GRAVITY * HANG_GRAVITY; // half gravity while rising with jump held
  const rise = JUMP_V / g; // seconds to apex
  const apexH = (JUMP_V * JUMP_V) / (2 * g);
  const fall = Math.sqrt((2 * apexH) / GRAVITY);
  return rise + fall;
}

describe("P0.2 director — every gap is crossable at the slowest run speed", () => {
  test("gap jump cost is one candle of air, well inside the slowest reach", () => {
    const reach = CAM_BASE * airtime(); // px covered at the very start of a run
    // leaving the previous platform's right edge (w = PLATFORM_W) and landing on
    // the far platform one candle later: CANDLE_W + (CANDLE_W - PLATFORM_W)
    const cost = CANDLE_W + (CANDLE_W - PLATFORM_W);
    expect(reach).toBeGreaterThan(cost * 1.15); // ≥15% margin at CAM_BASE
  });
});

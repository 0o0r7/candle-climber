// P0.8 CHART v2 — the terrain repair contract.
// What this pins (docs/OPEN-ITEMS.md O-2):
//  1. The version is a pure function of the seed's DATE: a chart played before
//     the cutoff is byte-identical forever, so no ghost/replay/board entry is
//     invalidated by shipping v2.
//  2. v2 never re-scales a chart that already uses its band: an oscillating
//     chart (BTC/TSLA shape) comes back BYTE-IDENTICAL to v1 — the crypto and
//     stock lanes cannot move.
//  3. A drifting chart (launchpad shape) is stretched, and every stretched step
//     still respects the fairness clamps (MAX_UP / MAX_DOWN) the jump was
//     authored against.
//  4. The pad and its ease window are never touched, and the summit stays the
//     last platform.
import { describe, test, expect } from "bun:test";
import {
  buildPlatforms, chartVersionFor, CHART_V2_FROM, LAUNCH_PAD, EASE_CANDLES,
  MAX_UP, MAX_DOWN, TERRAIN_TARGET_SPAN,
} from "@/game/cc/level";
import type { Candle } from "@/game/cc/types";

/** Walk one direction with a tiny per-candle move: the launchpad shape, where a
 *  rolling window's min/max sit at the same end and the ratio never swings. */
function driftingCandles(count: number, stepPct = 0.002): Candle[] {
  const out: Candle[] = [];
  let p = 100;
  for (let i = 0; i < count; i++) {
    const o = p;
    const c = p * (1 + stepPct);
    out.push({ t: i, o, c, h: Math.max(o, c) * 1.004, l: Math.min(o, c) * 0.996 });
    p = c;
  }
  return out;
}

/** Alternating direction with a wide swing: the BTC/TSLA shape. */
function oscillatingCandles(count: number): Candle[] {
  const out: Candle[] = [];
  let p = 100;
  for (let i = 0; i < count; i++) {
    const o = p;
    const c = p * (i % 2 === 0 ? 1.06 : 0.94);
    out.push({ t: i, o, c, h: Math.max(o, c) * 1.01, l: Math.min(o, c) * 0.99 });
    p = c;
  }
  return out;
}

const solidSpan = (plats: ReturnType<typeof buildPlatforms>) => {
  const ys = plats.filter((p) => p.w > 0 && p.i >= LAUNCH_PAD + EASE_CANDLES).map((p) => p.y);
  return Math.max(...ys) - Math.min(...ys);
};

describe("P0.8 chart version — date gated, deterministic", () => {
  test("the version follows the seed's date, never a global switch", () => {
    expect(CHART_V2_FROM).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(chartVersionFor("2026-11-10MONKE")).toBe(1);
    expect(chartVersionFor("2026-01-16TESTUSDT")).toBe(1);
    expect(chartVersionFor(CHART_V2_FROM + "MONKE")).toBe(2);
    expect(chartVersionFor("2027-03-01BTCUSDT")).toBe(2);
    // no parseable date => the frozen v1 shape, never a silent upgrade
    expect(chartVersionFor("synthetic")).toBe(1);
  });

  test("v2 is deterministic: same candles + seed => byte-identical terrain", () => {
    const c = driftingCandles(72);
    const a = JSON.stringify(buildPlatforms(c, CHART_V2_FROM + "MONKE"));
    const b = JSON.stringify(buildPlatforms(c, CHART_V2_FROM + "MONKE"));
    expect(a).toBe(b);
  });
});

describe("P0.8 chart v2 — repair only, never a re-tune of a live band", () => {
  test("an oscillating chart is byte-identical to v1 (crypto/stock lanes cannot move)", () => {
    const c = oscillatingCandles(96);
    const v1 = buildPlatforms(c, "2026-11-10BTCUSDT", { version: 1 });
    const v2 = buildPlatforms(c, "2026-11-10BTCUSDT", { version: 2 });
    expect(JSON.stringify(v2)).toBe(JSON.stringify(v1));
    expect(solidSpan(v1)).toBeGreaterThanOrEqual(TERRAIN_TARGET_SPAN);
  });

  test("a drifting chart is stretched into a usable range", () => {
    const c = driftingCandles(72);
    const v1 = buildPlatforms(c, "2026-11-10MONKE", { version: 1 });
    const v2 = buildPlatforms(c, "2026-11-10MONKE", { version: 2 });
    expect(solidSpan(v1)).toBeLessThan(TERRAIN_TARGET_SPAN); // the defect v2 exists for
    expect(solidSpan(v2)).toBeGreaterThan(solidSpan(v1));
    // approached, not matched: the per-step clamps may absorb part of the stretch
    expect(solidSpan(v2)).toBeGreaterThanOrEqual(TERRAIN_TARGET_SPAN * 0.6);
  });

  test("every stretched step stays inside the shipped fairness clamps", () => {
    const c = driftingCandles(80, 0.004);
    const v2 = buildPlatforms(c, CHART_V2_FROM + "MONKE");
    // The clamp expression in buildPlatforms (v1, unchanged by v2) is
    //   y = max(prev - MAX_DOWN, min(prev + MAX_UP, raw))
    // and y grows DOWNWARD, so a DROP may be at most MAX_UP and a CLIMB at most
    // MAX_DOWN. The test mirrors the shipped expression rather than re-deriving
    // the semantics: v2 must not widen a window the jump was authored against.
    for (let i = 1; i < v2.length; i++) {
      const d = v2[i].y - v2[i - 1].y; // +down, -up
      expect(d).toBeLessThanOrEqual(MAX_UP + 1e-9);
      expect(d).toBeGreaterThanOrEqual(-MAX_DOWN - 1e-9);
    }
  });

  test("the pad and ease window keep their exact v1 geometry; summit stays last", () => {
    const c = driftingCandles(72);
    const v1 = buildPlatforms(c, "2026-11-10MONKE", { version: 1 });
    const v2 = buildPlatforms(c, "2026-11-10MONKE", { version: 2 });
    for (let i = 0; i < LAUNCH_PAD + EASE_CANDLES; i++) {
      expect(v2[i].y).toBe(v1[i].y);
      expect(v2[i].w).toBe(v1[i].w);
      expect(v2[i].state).toBe(v1[i].state);
    }
    expect(v2[v2.length - 1].summit).toBe(true);
    // gaps are authored BEFORE the stretch, so hazard placement never changes
    expect(v2.map((p) => p.w === 0)).toEqual(v1.map((p) => p.w === 0));
    expect(v2.map((p) => p.crumble)).toEqual(v1.map((p) => p.crumble));
  });

  test("a stretched candle keeps its body/wick shape (only its y moves)", () => {
    const c = driftingCandles(72);
    const v1 = buildPlatforms(c, "2026-11-10MONKE", { version: 1 });
    const v2 = buildPlatforms(c, "2026-11-10MONKE", { version: 2 });
    for (let i = 0; i < v2.length; i++) {
      // the drawn shape is defined relative to y — stretching must not squash it
      expect(v2[i].bodyTop - v2[i].y).toBeCloseTo(v1[i].bodyTop - v1[i].y, 6);
      expect(v2[i].bodyBottom - v2[i].y).toBeCloseTo(v1[i].bodyBottom - v1[i].y, 6);
      expect(v2[i].wickTop - v2[i].y).toBeCloseTo(v1[i].wickTop - v1[i].y, 6);
      expect(v2[i].wickBottom - v2[i].y).toBeCloseTo(v1[i].wickBottom - v1[i].y, 6);
    }
  });
});

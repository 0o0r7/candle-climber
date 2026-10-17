/// <reference types="bun-types" />
// W5 — Route Prediction contract tests (E2.3/P4.6, bun test, zero deps).
// Pins docs/WICK-ECONOMY-SPEC.md §7.2 row 3: call shape, deterministic tier
// math (dir 4 / vol 3 / tail 3 = ≤10), tomorrow-only targeting, and the
// "same call + same candle ⇒ same points" determinism rule.
import { describe, test, expect } from "bun:test";
import {
  validateCall,
  scorePrediction,
  volTier,
  tailSide,
  bodyPct,
  nextUtcDate,
  PREDICT_MAX_POINTS,
  PREDICT_DIR_POINTS,
  PREDICT_VOL_POINTS,
  PREDICT_TAIL_POINTS,
  type DailyCandle,
} from "@/lib/prediction";
import { PREDICTION_DAILY_CAP } from "@/lib/weights";

describe("prediction · call shape", () => {
  test("accepts a well-formed call", () => {
    expect(validateCall({ dir: "up", vol: "mid", tail: "top" })).toEqual({
      dir: "up", vol: "mid", tail: "top",
    });
  });
  test("rejects malformed / missing / extra-enum fields", () => {
    expect(validateCall(null)).toBeNull();
    expect(validateCall({ dir: "sideways", vol: "mid", tail: "top" })).toBeNull();
    expect(validateCall({ dir: "up", vol: "huge", tail: "top" })).toBeNull();
    expect(validateCall({ dir: "up", vol: "mid", tail: "left" })).toBeNull();
    expect(validateCall({ dir: "up", vol: "mid" })).toBeNull();
    expect(validateCall("up/mid/top")).toBeNull();
  });
});

describe("prediction · tier math", () => {
  test("bodyPct is |close-open| relative to open", () => {
    expect(bodyPct({ o: 100, h: 101, l: 99, c: 101 })).toBeCloseTo(1);
    expect(bodyPct({ o: 100, h: 100, l: 100, c: 100 })).toBe(0);
  });
  test("vol tiers: <1% low · 1–3% mid · >3% high (boundaries pinned)", () => {
    const c = (move: number): DailyCandle => ({ o: 100, h: 100 + move, l: 100 - move, c: 100 + move });
    expect(volTier(c(0.5))).toBe("low");
    expect(volTier({ o: 100, h: 101, l: 99, c: 101 })).toBe("mid"); // exactly 1% → mid
    expect(volTier({ o: 100, h: 103, l: 97, c: 103 })).toBe("mid"); // exactly 3% → mid
    expect(volTier({ o: 100, h: 103.5, l: 96.5, c: 103.5 })).toBe("high");
  });
  test("tail: dominant side wins; sub-floor both sides = none", () => {
    expect(tailSide({ o: 100, h: 102, l: 99, c: 100.5 })).toBe("top"); // top tail 1.5%, bottom 1.5%? → tie → top
    expect(tailSide({ o: 100, h: 100.4, l: 97, c: 100.2 })).toBe("bottom");
    expect(tailSide({ o: 100, h: 100.01, l: 99.99, c: 100 })).toBe("none");
  });
  test("tail none threshold is 0.05% of price", () => {
    expect(tailSide({ o: 100, h: 100.06, l: 100, c: 100 })).toBe("top");
    expect(tailSide({ o: 100, h: 100.04, l: 100, c: 100 })).toBe("none");
  });
});

describe("prediction · scoring", () => {
  const UP_MID_TOP: DailyCandle = { o: 100, h: 104, l: 99.5, c: 102 }; // ~2% body, top tail 2%, bottom .5%
  test("a perfect call scores the max 10", () => {
    const s = scorePrediction({ dir: "up", vol: "mid", tail: "top" }, UP_MID_TOP);
    expect(s.dirOk).toBe(true);
    expect(s.volOk).toBe(true);
    expect(s.tailOk).toBe(true);
    expect(s.points).toBe(PREDICT_MAX_POINTS);
    expect(PREDICT_MAX_POINTS).toBe(PREDICTION_DAILY_CAP); // spec: ≤10/day
  });
  test("wrong direction can still bank vol + tail (tiered, not all-or-nothing)", () => {
    const s = scorePrediction({ dir: "down", vol: "mid", tail: "top" }, UP_MID_TOP);
    expect(s.dirOk).toBe(false);
    expect(s.points).toBe(PREDICT_VOL_POINTS + PREDICT_TAIL_POINTS);
  });
  test("tier points sum from their own constants", () => {
    expect(PREDICT_DIR_POINTS + PREDICT_VOL_POINTS + PREDICT_TAIL_POINTS).toBe(PREDICT_MAX_POINTS);
  });
  test("doji (close == open) reads as an up candle — deterministic grace", () => {
    const s = scorePrediction({ dir: "up", vol: "low", tail: "none" }, { o: 100, h: 100, l: 100, c: 100 });
    expect(s.dirOk).toBe(true);
    expect(s.volOk).toBe(true);
    expect(s.tailOk).toBe(true);
    expect(s.points).toBe(10);
  });
  test("determinism: same call + same candle ⇒ identical score", () => {
    const call = { dir: "down" as const, vol: "high" as const, tail: "bottom" as const };
    expect(JSON.stringify(scorePrediction(call, UP_MID_TOP)))
      .toBe(JSON.stringify(scorePrediction(call, UP_MID_TOP)));
  });
});

describe("prediction · targeting", () => {
  test("nextUtcDate: tomorrow only, across month/year boundaries", () => {
    expect(nextUtcDate("2026-10-08")).toBe("2026-10-09");
    expect(nextUtcDate("2026-10-31")).toBe("2026-11-01");
    expect(nextUtcDate("2025-12-31")).toBe("2026-01-01");
    expect(nextUtcDate("2024-02-28")).toBe("2024-02-29"); // leap year
  });
});

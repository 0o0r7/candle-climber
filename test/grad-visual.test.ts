// ART V4: graduation celebration data — determinism + physics-envelope pins.
// The celebration is pure decoration, but its DATA is deterministic per seed
// (same level ⇒ same confetti) and stays inside the render budget: no NaNs,
// no unbounded values, palette-locked colors only.
import { describe, expect, test } from "bun:test";
import { BEACON_ALPHA, CONFETTI_N, gradConfetti } from "../src/game/cc/grad";

describe("grad celebration data (ART V4)", () => {
  test("same seed ⇒ bit-identical shards (order + values)", () => {
    const a = gradConfetti("2026-10-12BTCUSDT");
    const b = gradConfetti("2026-10-12BTCUSDT");
    expect(a.length).toBe(CONFETTI_N);
    expect(b.length).toBe(CONFETTI_N);
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
  });

  test("different seeds ⇒ different volleys", () => {
    const a = gradConfetti("2026-10-12BTCUSDT");
    const b = gradConfetti("2026-10-13BTCUSDT");
    expect(JSON.stringify(a)).not.toBe(JSON.stringify(b));
  });

  test("shards launch upward and spread outward — never downward at spawn", () => {
    for (const s of gradConfetti("seed-x")) {
      expect(s.vy).toBeLessThan(0); // every shard leaves the chest rising
      expect(Math.abs(s.vx)).toBeGreaterThan(0); // no dead-vertical chips
      expect(s.g).toBeGreaterThan(0); // gravity pulls the fall back
      expect(s.delay).toBeGreaterThanOrEqual(0);
      expect(s.delay).toBeLessThanOrEqual(0.5);
    }
  });

  test("ballistics stay inside the celebration envelope (t=3.2s no runaway)", () => {
    // Worst-case lateral drift at CONFETTI_LIFE must stay within roughly one
    // viewport width (800px) so shards never sweep the whole frame.
    for (const s of gradConfetti("seed-y")) {
      const t = 3.2 - s.delay;
      const x = s.vx * t;
      const y = s.y + s.vy * t + 0.5 * s.g * t * t;
      expect(Number.isFinite(x)).toBe(true);
      expect(Number.isFinite(y)).toBe(true);
      expect(Math.abs(x)).toBeLessThan(800);
      // falls below the summit cap by the end (gravity wins) — no floating shards
      expect(y).toBeGreaterThan(0);
    }
  });

  test("palette lock — every color is from the locked set", () => {
    const allowed = new Set([
      "#CCFF00", "#5BD08A", "#6A63C8", "#E07856", "#E0B04E", "#F5F7FA",
    ]);
    for (const s of gradConfetti("seed-z")) expect(allowed.has(s.color)).toBe(true);
    expect(BEACON_ALPHA).toBeGreaterThan(0);
    expect(BEACON_ALPHA).toBeLessThan(0.3); // beacon stays subtle after the burst
  });

  test("candle-shard mix exists (wick shards are the celebration's signature)", () => {
    const shards = gradConfetti("seed-w");
    expect(shards.some((s) => s.wick)).toBe(true);
    expect(shards.some((s) => !s.wick)).toBe(true);
  });
});

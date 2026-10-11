// Per-device stats ledger — record-once semantics, clamped parsing, purity.
import { describe, expect, test } from "bun:test";
import {
  emptyLedger,
  loadLedger,
  recordRun,
  saveLedger,
  STATS_KEY,
  type StatsLedger,
} from "../src/lib/stats-ledger";

const run = (over: Partial<Parameters<typeof recordRun>[1]> = {}) => ({
  score: 195,
  candlesPassed: 13,
  bestStreak: 5,
  graduated: false,
  died: true,
  ...over,
});

describe("stats ledger", () => {
  test("empty ledger is all zeros", () => {
    const l = emptyLedger();
    expect(l.runs).toBe(0);
    expect(l.totalScore).toBe(0);
    expect(l.deaths).toBe(0);
    expect(l.graduations).toBe(0);
  });

  test("recordRun folds one finished run", () => {
    const l = recordRun(emptyLedger(), run(), 1000);
    expect(l.runs).toBe(1);
    expect(l.totalScore).toBe(195);
    expect(l.totalCandles).toBe(13);
    expect(l.deaths).toBe(1);
    expect(l.graduations).toBe(0);
    expect(l.bestStreak).toBe(5);
    expect(l.bestCandles).toBe(13);
    expect(l.updated).toBe(1000);
  });

  test("graduated-but-not-died run counts a graduation, not a death", () => {
    const l = recordRun(emptyLedger(), run({ died: false, graduated: true }), 1);
    expect(l.deaths).toBe(0);
    expect(l.graduations).toBe(1);
  });

  test("bests accumulate across runs", () => {
    let l: StatsLedger = emptyLedger();
    l = recordRun(l, run({ score: 100, candlesPassed: 10, bestStreak: 3 }), 1);
    l = recordRun(l, run({ score: 500, candlesPassed: 30, bestStreak: 9 }), 2);
    expect(l.runs).toBe(2);
    expect(l.totalScore).toBe(600);
    expect(l.totalCandles).toBe(40);
    expect(l.bestStreak).toBe(9);
    expect(l.bestCandles).toBe(30);
  });

  test("negative/fractional inputs are clamped", () => {
    const l = recordRun(emptyLedger(), run({ score: -50.9, candlesPassed: 2.9, bestStreak: -3 }), 1);
    expect(l.totalScore).toBe(0);
    expect(l.totalCandles).toBe(2);
    expect(l.bestStreak).toBe(0);
  });

  test("loadLedger survives garbage", () => {
    expect(loadLedger(null)).toEqual(emptyLedger());
    expect(loadLedger("")).toEqual(emptyLedger());
    expect(loadLedger("garbage{")).toEqual(emptyLedger());
    expect(loadLedger("null")).toEqual(emptyLedger());
    expect(loadLedger('{"runs":-5,"totalScore":1e13}').runs).toBe(0);
    // absurd values are CLAMPED to the cap, not zeroed (keep honest history)
    expect(loadLedger('{"runs":-5,"totalScore":1e13}').totalScore).toBe(1e12);
  });

  test("save → load roundtrip", () => {
    const l = recordRun(emptyLedger(), run({ graduated: true, died: false }), 42);
    const back = loadLedger(saveLedger(l));
    expect(back).toEqual(l);
  });

  test("storage posture: pure module, no network, no direct localStorage calls", async () => {
    const src = await Bun.file(new URL("../src/lib/stats-ledger.ts", import.meta.url)).text();
    expect(src).not.toContain("fetch(");
    expect(src).not.toMatch(/localStorage\.(getItem|setItem|removeItem)/);
    expect(STATS_KEY).toBe("cc_stats_v1");
  });
});

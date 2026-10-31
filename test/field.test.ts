// Field statistics contract (reference-study P1 — docs/reference-study/02-proposals.md).
// Pure math only: no network, no clock. If a band, a percentile or the wall rule
// changes, this file must change with it.
import { describe, test, expect } from "bun:test";
import { summarizeField, bandLabel } from "@/lib/field";

const rows = (n: number[]) => n.map((candlesPassed) => ({ candlesPassed }));

describe("summarizeField — empty and degenerate lanes", () => {
  test("no rows is an honest empty field, never a zero score", () => {
    const s = summarizeField([]);
    expect(s.count).toBe(0);
    expect(s.medianCandles).toBeNull();
    expect(s.p90Candles).toBeNull();
    expect(s.bestCandles).toBeNull();
    expect(s.wall).toBeNull();
    expect(s.bands).toEqual([]);
  });

  test("malformed rows are ignored, never repaired into a percentile", () => {
    const s = summarizeField([...rows([12]), { candlesPassed: -3 }, { candlesPassed: NaN }]);
    expect(s.count).toBe(1);
    expect(s.medianCandles).toBe(12);
    expect(s.bestCandles).toBe(12);
  });

  test("a single climb is its own median and p90", () => {
    const s = summarizeField(rows([37]));
    expect(s.count).toBe(1);
    expect(s.medianCandles).toBe(37);
    expect(s.p90Candles).toBe(37);
    expect(s.wall?.from).toBe(25); // 37 lands in the 25–49 band
  });
});

describe("summarizeField — percentiles", () => {
  test("median uses nearest rank on the sorted list", () => {
    expect(summarizeField(rows([5, 30, 400])).medianCandles).toBe(30);
    expect(summarizeField(rows([5, 10, 30, 400])).medianCandles).toBe(10); // ceil(0.5*4)=2 → index 1
    expect(summarizeField(rows([1, 2, 3, 4, 5, 6, 7, 8, 9, 10])).medianCandles).toBe(5);
  });

  test("p90 sits near the top, best is the maximum", () => {
    const s = summarizeField(rows([1, 2, 3, 4, 5, 6, 7, 8, 9, 100]));
    expect(s.p90Candles).toBe(9); // nearest rank of 10 → 9th value; the outlier is NOT the p90
    expect(s.bestCandles).toBe(100);
    const s2 = summarizeField(rows(Array.from({ length: 100 }, (_, i) => i)));
    expect(s2.p90Candles).toBe(89);
    expect(s2.medianCandles).toBe(49);
  });
});

describe("summarizeField — bands and the wall", () => {
  test("bands cover every value exactly once and percentages sum to ~100", () => {
    const s = summarizeField(rows([0, 9, 10, 24, 25, 49, 50, 99, 100, 199, 200, 9999]));
    expect(s.bands.map((b) => b.count)).toEqual([2, 2, 2, 2, 2, 2]);
    const total = s.bands.reduce((n, b) => n + b.count, 0);
    expect(total).toBe(s.count);
    const pct = s.bands.reduce((n, b) => n + b.pct, 0);
    expect(pct).toBeGreaterThanOrEqual(97);
    expect(pct).toBeLessThanOrEqual(103);
  });

  test("the wall is the band where most climbs end", () => {
    const s = summarizeField(rows([30, 31, 32, 33, 5, 400]));
    expect(s.wall?.count).toBe(4);
    expect(s.wall?.from).toBe(25);
    expect(s.wall?.to).toBe(50);
  });

  test("a tie keeps the lower band so the wall never flips between reads", () => {
    const s = summarizeField(rows([5, 5, 60, 60]));
    expect(s.wall?.from).toBe(0);
    expect(s.wall?.label).toBe("0–10");
  });

  test("band labels read as ranges and an open top", () => {
    expect(bandLabel(25, 50)).toBe("25–50");
    expect(bandLabel(200, null)).toBe("200+");
  });
});

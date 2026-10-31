// Day-identity contract (reference-study P1). PURE: `today` is injected, so
// these assertions never depend on when the suite runs.
//
// Note what is NOT asserted here: the day's symbol. /api/candles picks it at
// request time from live tickers, so the page must never pre-compute it — that
// regression is exactly what this file documents.
import { describe, test, expect } from "bun:test";
import { resolveDay } from "@/lib/day-chart";

const TODAY = "2026-10-31";

describe("resolveDay — what the product offers", () => {
  test("today is flagged as today", () => {
    const day = resolveDay(TODAY, TODAY);
    expect(day).toEqual({ date: TODAY, today: TODAY, isToday: true });
  });

  test("a past day inside the archive window is not today", () => {
    const day = resolveDay("2020-03-16", TODAY);
    expect(day?.isToday).toBe(false);
    expect(day?.date).toBe("2020-03-16");
  });

  test("the same date always yields the same identity", () => {
    expect(resolveDay("2024-11-04", TODAY)).toEqual(resolveDay("2024-11-04", TODAY));
  });
});

describe("resolveDay — what it refuses", () => {
  test("future dates never resolve (no future terrain)", () => {
    expect(resolveDay("2026-11-01", TODAY)).toBeNull();
  });

  test("malformed and impossible dates never resolve", () => {
    expect(resolveDay("2026-13-01", TODAY)).toBeNull();
    expect(resolveDay("2026-02-30", TODAY)).toBeNull(); // Date.parse would normalize it
    expect(resolveDay("31-10-2026", TODAY)).toBeNull();
    expect(resolveDay("", TODAY)).toBeNull();
    expect(resolveDay("2026-10-31T00:00:00Z", TODAY)).toBeNull();
  });

  test("dates before the archive floor never resolve", () => {
    expect(resolveDay("2016-12-31", TODAY)).toBeNull();
    expect(resolveDay("2017-01-01", TODAY)).not.toBeNull();
  });
});

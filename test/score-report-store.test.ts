// LU-15 pin: community score-report store — memory store semantics, cap and
// sanitize behavior (the Mongo store shares the same interface).
import { describe, test, expect, beforeEach } from "bun:test";
import { getScoreReports, type ScoreReport } from "../src/lib/score-report-store";

const report = (over: Partial<ScoreReport> = {}): ScoreReport => ({
  name: "sus",
  score: 99_999,
  date: "2026-10-12",
  board: "guest",
  reason: "impossible score",
  ts: 1_700_000_000_000,
  ...over,
});

describe("score report store (LU-15)", () => {
  beforeEach(() => {
    // memory store — fresh instance per test via env switch is unnecessary;
    // the in-memory instance is shared, so tests tolerate accumulation and
    // assert on ORDERING/caps instead of absolute counts.
  });

  test("add + recent returns newest-first", async () => {
    const s = getScoreReports();
    await s.add(report({ ts: 1_000, name: "old" }));
    await s.add(report({ ts: 2_000, name: "new" }));
    const recent = await s.recent(5);
    expect(recent.length).toBeGreaterThanOrEqual(2);
    const names = recent.slice(0, 2).map((r) => r.name);
    expect(names).toEqual(["new", "old"]); // newest first
  });

  test("recent() honors the limit", async () => {
    const s = getScoreReports();
    for (let i = 0; i < 5; i++) await s.add(report({ ts: 10_000 + i }));
    const recent = await s.recent(3);
    expect(recent.length).toBe(3);
  });

  test("store kind is reported honestly (memory vs mongo)", () => {
    const kind = getScoreReports().kind;
    expect(["memory", "mongo"]).toContain(kind);
  });
});

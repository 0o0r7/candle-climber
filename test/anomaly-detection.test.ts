// LU-7 pin: statistical anomaly detection — top-1% outliers (>2× median) get
// flagged for review, small boards stay silent, zero medians never divide.
import { describe, test, expect } from "bun:test";
import { detectAnomalies, wouldBeAnomaly } from "../src/lib/anomaly-detection";
import type { BoardEntry } from "../src/lib/leaderboard-store";

let seq = 0;
const entry = (score: number, over: Partial<BoardEntry> = {}): BoardEntry => ({
  name: `player-${seq++}`,
  score,
  date: "2026-10-12",
  ts: 1_700_000_000_000 + seq,
  ...over,
} as BoardEntry);

/** 30 entries tightly clustered around 1,000 — a healthy board. */
const healthyBoard = () => Array.from({ length: 30 }, () => entry(900 + (seq % 200)));

describe("anomaly detection (LU-7)", () => {
  test("boards under 10 entries are never flagged", () => {
    const small = Array.from({ length: 9 }, () => entry(5_000_000)); // absurd scores
    expect(detectAnomalies(small).size).toBe(0);
  });

  test("a >2× median top score is flagged", () => {
    const board = healthyBoard();
    const outlier = entry(10_000); // median ~1,000 → 10× outlier
    const flagged = detectAnomalies([...board, outlier]);
    expect(flagged.size).toBe(1);
  });

  test("a score within 2× median is NOT flagged", () => {
    const board = healthyBoard();
    const borderline = entry(1_900); // < 2× median
    expect(detectAnomalies([...board, borderline]).size).toBe(0);
  });

  test("zero median disables flagging (no division-by-zero nonsense)", () => {
    const board = Array.from({ length: 12 }, () => entry(0));
    board.push(entry(999_999));
    expect(detectAnomalies(board).size).toBe(0);
  });

  test("wouldBeAnomaly matches the composite key of the exact entry", () => {
    const board = healthyBoard();
    const outlier = entry(50_000);
    expect(wouldBeAnomaly(outlier, board)).toBe(true);
    const normal = entry(1_050);
    expect(wouldBeAnomaly(normal, board)).toBe(false);
  });

  test("flagging is deterministic — same input, same result", () => {
    const board = [...healthyBoard(), entry(42_000)];
    expect(detectAnomalies(board).size).toBe(detectAnomalies([...board].reverse()).size);
  });
});

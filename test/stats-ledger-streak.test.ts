// Daily-streak fold in the stats ledger (LU wave) — UTC-day semantics:
// first play = 1, consecutive day = +1, gap = reset to 1, same-day = unchanged.
import { describe, test, expect } from "bun:test";
import { emptyLedger, recordRun } from "../src/lib/stats-ledger";

const DAY = 86_400_000;
const at = (utcDate: string) => new Date(`${utcDate}T12:00:00Z`).getTime();
const run = { score: 100, candlesPassed: 5, bestStreak: 2, graduated: false, died: true };

describe("stats ledger daily streak", () => {
  test("first ever play starts a streak of 1", () => {
    const l = recordRun(emptyLedger(), run, at("2026-10-10"));
    expect(l.currentStreak).toBe(1);
    expect(l.bestDailyStreak).toBe(1);
    expect(l.lastPlayedDate).toBe("2026-10-10");
  });

  test("playing the next UTC day extends the streak", () => {
    let l = recordRun(emptyLedger(), run, at("2026-10-10"));
    l = recordRun(l, run, at("2026-10-11"));
    l = recordRun(l, run, at("2026-10-12"));
    expect(l.currentStreak).toBe(3);
    expect(l.bestDailyStreak).toBe(3);
  });

  test("a gap day resets the streak to 1", () => {
    let l = recordRun(emptyLedger(), run, at("2026-10-10"));
    l = recordRun(l, run, at("2026-10-11"));
    l = recordRun(l, run, at("2026-10-13")); // skipped 10-12
    expect(l.currentStreak).toBe(1);
    expect(l.bestDailyStreak).toBe(2); // best is remembered
  });

  test("multiple runs on the same day keep the streak unchanged", () => {
    let l = recordRun(emptyLedger(), run, at("2026-10-10"));
    const afterFirst = l.currentStreak;
    l = recordRun(l, run, at("2026-10-10") + 3_600_000); // same UTC day, later hour
    expect(l.currentStreak).toBe(afterFirst);
    expect(l.runs).toBe(2); // the run itself is still recorded
  });

  test("streak is computed on UTC boundaries, not local time", () => {
    // 23:59 UTC Oct 10 and 12:01 UTC Oct 11 are DIFFERENT days
    let l = recordRun(emptyLedger(), run, at("2026-10-10") - 60_000);
    l = recordRun(l, run, at("2026-10-11") + 60_000);
    expect(l.currentStreak).toBe(2);
  });

  test("ledger fold stays pure — input ledger is not mutated", () => {
    const l0 = emptyLedger();
    const snapshot = JSON.stringify(l0);
    recordRun(l0, run, at("2026-10-10"));
    expect(JSON.stringify(l0)).toBe(snapshot);
  });
});

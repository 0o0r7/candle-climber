/// <reference types="bun-types" />
// P0.7 CAREER — the meta-progression lane. Pins the two things that make it
// safe to ship on a shared daily board:
//   1. it is PURE and CLAMPED (a hand-edited save can only inflate a badge);
//   2. it is COSMETIC — nothing here is an input to score, physics or the
//      leaderboard (there is no score/multiplier field in Career at all).
import { describe, test, expect } from "bun:test";
import {
  emptyCareer, loadCareer, saveCareer, xpForRun, rankFor, applyRun,
  RANKS, CAREER_KEY,
  XP_FOR_RUN, XP_PER_CANDLE, XP_PER_STYLE, XP_PER_STREAK,
  XP_GRADUATION, XP_WORLD2, MAX_RUN_XP,
  type CareerRunInput,
} from "@/lib/career";

const run = (over: Partial<CareerRunInput> = {}): CareerRunInput => ({
  candlesPassed: 20,
  bestStreak: 4,
  style: 6,
  graduated: false,
  world2: false,
  died: true,
  ...over,
});

describe("career — persistence", () => {
  test("malformed saves fall back to empty, never throw", () => {
    for (const raw of [null, "", "{", "[]", '"x"', "null", '{"xp":-5}']) {
      const c = loadCareer(raw);
      expect(c.xp).toBeGreaterThanOrEqual(0);
      expect(c.v).toBe(1);
    }
    expect(loadCareer(null).xp).toBe(0);
  });

  test("absurd values are clamped, and the round-trip is stable", () => {
    const c = loadCareer('{"v":1,"xp":1e30,"runs":-2,"updated":"x"}');
    expect(c.xp).toBeLessThanOrEqual(1e9);
    expect(c.runs).toBe(0);
    expect(loadCareer(saveCareer(c))).toEqual(c);
  });

  test("the storage key is stable (a rename would orphan every profile)", () => {
    expect(CAREER_KEY).toBe("cc_career_v1");
  });
});

describe("career — XP is a pure function of the run", () => {
  test("base line adds up exactly", () => {
    expect(xpForRun(run())).toBe(
      XP_FOR_RUN + 20 * XP_PER_CANDLE + 6 * XP_PER_STYLE + 4 * XP_PER_STREAK,
    );
  });

  test("deeper climbs and better combos never earn less", () => {
    const base = xpForRun(run());
    expect(xpForRun(run({ candlesPassed: 40 }))).toBeGreaterThan(base);
    expect(xpForRun(run({ bestStreak: 10 }))).toBeGreaterThan(base);
    expect(xpForRun(run({ style: 20 }))).toBeGreaterThan(base);
  });

  test("milestones pay their own way", () => {
    const plain = xpForRun(run());
    expect(xpForRun(run({ graduated: true }))).toBe(plain + XP_GRADUATION);
    expect(xpForRun(run({ graduated: true, world2: true }))).toBe(plain + XP_GRADUATION + XP_WORLD2);
  });

  test("one run can never mint more than MAX_RUN_XP", () => {
    expect(xpForRun(run({ candlesPassed: 999_999, bestStreak: 999, style: 999, graduated: true, world2: true })))
      .toBe(MAX_RUN_XP);
  });

  test("garbage input contributes zero, not NaN", () => {
    const xp = xpForRun(run({ candlesPassed: -40, bestStreak: NaN, style: undefined }));
    expect(xp).toBe(XP_FOR_RUN);
  });
});

describe("career — ranks", () => {
  test("0 XP is rank 1 at the bottom of its bar", () => {
    const r = rankFor(0);
    expect(r.level).toBe(1);
    expect(r.name).toBe(RANKS[0].name);
    expect(r.share).toBe(0);
    expect(r.next).toBe(RANKS[1].name);
  });

  test("every threshold enters its own rank, one XP below stays behind", () => {
    for (let i = 0; i < RANKS.length; i++) {
      expect(rankFor(RANKS[i].at).level).toBe(i + 1);
      if (i > 0) expect(rankFor(RANKS[i].at - 1).level).toBe(i);
    }
  });

  test("the bar fills monotonically inside a rank", () => {
    const mid = Math.floor((RANKS[1].at + RANKS[2].at) / 2);
    expect(rankFor(mid).share).toBeGreaterThan(rankFor(RANKS[1].at).share);
    expect(rankFor(mid).share).toBeLessThan(1);
    expect(rankFor(mid).toNext).toBeGreaterThan(0);
  });

  test("the top rank reports no next rank and a full bar", () => {
    const top = rankFor(RANKS[RANKS.length - 1].at + 5_000);
    expect(top.level).toBe(RANKS.length);
    expect(top.next).toBeNull();
    expect(top.share).toBe(1);
    expect(top.toNext).toBe(0);
  });
});

describe("career — folding a run", () => {
  test("applyRun accumulates without mutating its input", () => {
    const before = emptyCareer();
    const snapshot = JSON.stringify(before);
    const out = applyRun(before, run(), 1_700_000_000_000);
    expect(JSON.stringify(before)).toBe(snapshot);
    expect(out.career.xp).toBe(out.gained);
    expect(out.career.runs).toBe(1);
    expect(out.career.updated).toBe(1_700_000_000_000);
  });

  test("a rank-up is reported exactly at the boundary", () => {
    // one XP short of rank 2 …
    const almost = { ...emptyCareer(), xp: RANKS[1].at - 1 };
    const out = applyRun(almost, run(), 0);
    expect(out.levelBefore).toBe(1);
    expect(out.rankedUp).toBe(true);
    expect(out.levelAfter).toBe(rankFor(out.career.xp).level);
    expect(out.levelAfter).toBeGreaterThanOrEqual(2);
    // … and no rank-up mid-rank
    const mid = { ...emptyCareer(), xp: RANKS[1].at + 10 };
    const flat = applyRun(mid, run({ candlesPassed: 1, style: 0, bestStreak: 0 }), 0);
    expect(flat.levelAfter).toBe(flat.levelBefore);
    expect(flat.rankedUp).toBe(false);
  });
});

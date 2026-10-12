// Achievement pins — thresholds, the DIAMOND HANDS honesty rule (no RUSH),
// and merge semantics for the local unlock set.
import { describe, test, expect } from "bun:test";
import {
  ACHIEVEMENT_DEFS,
  checkAchievements,
  loadUnlocked,
  mergeUnlocked,
  saveUnlocked,
  defsFor,
} from "../src/lib/achievements";

const base = {
  score: 0,
  candlesPassed: 0,
  bestStreak: 0,
  graduated: false,
  died: false,
  usedRush: false,
  enteredWorld2: false,
  currentStreak: 0,
  duelWins: 0,
};

describe("achievements", () => {
  test("all 10 definitions are unique and well-formed", () => {
    expect(ACHIEVEMENT_DEFS.length).toBe(10);
    expect(new Set(ACHIEVEMENT_DEFS.map((d) => d.id)).size).toBe(10);
    for (const d of ACHIEVEMENT_DEFS) {
      expect(d.name.length).toBeGreaterThan(0);
      expect(d.desc.length).toBeGreaterThan(0);
    }
  });

  test("DIAMOND HANDS requires graduation WITHOUT rush — usedRush:true never unlocks it", () => {
    const rushed = checkAchievements({ ...base, graduated: true, usedRush: true });
    expect(rushed).not.toContain("no_rush_clear");
    const clean = checkAchievements({ ...base, graduated: true, usedRush: false });
    expect(clean).toContain("no_rush_clear");
  });

  test("combo thresholds pin at 10 and the 12x cap", () => {
    expect(checkAchievements({ ...base, bestStreak: 9 })).not.toContain("combo_10");
    expect(checkAchievements({ ...base, bestStreak: 10 })).toContain("combo_10");
    expect(checkAchievements({ ...base, bestStreak: 12 })).toContain("combo_12");
  });

  test("candle-count medals at 50 / 100", () => {
    expect(checkAchievements({ ...base, candlesPassed: 49 })).not.toContain("candles_50");
    expect(checkAchievements({ ...base, candlesPassed: 50 })).toContain("candles_50");
    expect(checkAchievements({ ...base, candlesPassed: 100 })).toContain("candles_100");
  });

  test("streak / duel / world2 / death pins", () => {
    const r = checkAchievements({ ...base, currentStreak: 7, duelWins: 1, enteredWorld2: true, died: true });
    expect(r).toContain("streak_7");
    expect(r).toContain("duel_win_1");
    expect(r).toContain("world2");
    expect(r).toContain("first_blood");
  });

  test("mergeUnlocked reports only the NEW ids and dedupes the set", () => {
    const existing = loadUnlocked(saveUnlocked(["first_blood"]));
    const { newlyUnlocked, all } = mergeUnlocked(existing, ["first_blood", "first_grad"]);
    expect(newlyUnlocked).toEqual(["first_grad"]);
    expect(new Set(all).size).toBe(all.length);
    expect(all).toContain("first_blood");
  });

  test("roundtrip: save → load preserves the unlock set", () => {
    const raw = saveUnlocked(["first_blood", "combo_10"]);
    expect(loadUnlocked(raw).has("combo_10")).toBe(true);
    expect(loadUnlocked(raw).size).toBe(2);
  });

  test("loadUnlocked is robust to garbage input", () => {
    expect(loadUnlocked(null).size).toBe(0);
    expect(loadUnlocked("not json").size).toBe(0);
    expect(loadUnlocked('{"obj":1}').size).toBe(0);
    expect(loadUnlocked('[1, "first_blood", null]').has("first_blood")).toBe(true);
    expect(loadUnlocked('[1, "first_blood", null]').size).toBe(1);
  });

  test("defsFor maps ids to definitions in order, dropping unknowns", () => {
    const defs = defsFor(["first_grad", "nope", "world2"]);
    expect(defs.length).toBe(2);
    expect(defs[0].id).toBe("first_grad");
    expect(defs[1].id).toBe("world2");
  });
});

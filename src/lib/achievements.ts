// Achievements — medal definitions + unlock logic.
// POSTURE: pure functions, localStorage touched only by the caller.

export const ACHIEVEMENTS_KEY = "cc_achievements_v1";

export interface AchievementDef {
  id: string;
  name: string;
  desc: string;
}

export interface AchievementCheckInput {
  score: number;
  candlesPassed: number;
  bestStreak: number;
  graduated: boolean;
  died: boolean;
  usedRush: boolean;
  enteredWorld2: boolean;
  currentStreak: number; // daily streak (days)
  duelWins: number;
}

export const ACHIEVEMENT_DEFS: AchievementDef[] = [
  { id: "first_blood", name: "FIRST LIQUIDATION", desc: "Die for the first time" },
  { id: "first_grad", name: "SUMMIT REACHED", desc: "Graduate (reach the summit)" },
  // Sweep 4 (2026-10-14) honesty fix: the old descs said "10x / 12x combo
  // multiplier/cap" — wrong numbers. Truth (src/lib/scoring.ts): the streak
  // caps at COMBO_CAP=12 candles and the multiplier formula is
  // 1 + min(streak, 12) × COMBO_STEP(0.5) ⇒ max ×7 (the tutorial's "up to ×7").
  { id: "combo_10", name: "ON FIRE", desc: "Land a 10-candle combo streak (×6 multiplier)" },
  { id: "combo_12", name: "MAX LEVERAGE", desc: "Max the combo: 12-streak cap, ×7 multiplier" },
  { id: "candles_50", name: "HALF CHART", desc: "Pass 50 candles in one run" },
  { id: "candles_100", name: "CENTURY CLIMBER", desc: "Pass 100 candles in one run" },
  { id: "no_rush_clear", name: "DIAMOND HANDS", desc: "Graduate without using RUSH" },
  { id: "streak_7", name: "WEEKLY WARRIOR", desc: "Play 7 days in a row" },
  { id: "duel_win_1", name: "CHART CHALLENGER", desc: "Win your first duel" },
  { id: "world2", name: "BUYBACK KING", desc: "Enter World 2 (post-graduation)" },
];

/** Which achievements are satisfied by this run's stats? */
export function checkAchievements(input: AchievementCheckInput): string[] {
  const unlocked: string[] = [];
  if (input.died) unlocked.push("first_blood");
  if (input.graduated) unlocked.push("first_grad");
  if (input.bestStreak >= 10) unlocked.push("combo_10");
  if (input.bestStreak >= 12) unlocked.push("combo_12");
  if (input.candlesPassed >= 50) unlocked.push("candles_50");
  if (input.candlesPassed >= 100) unlocked.push("candles_100");
  if (input.graduated && !input.usedRush) unlocked.push("no_rush_clear");
  if (input.currentStreak >= 7) unlocked.push("streak_7");
  if (input.duelWins >= 1) unlocked.push("duel_win_1");
  if (input.enteredWorld2) unlocked.push("world2");
  return unlocked;
}

/** Load the set of already-unlocked achievement ids. */
export function loadUnlocked(raw: string | null): Set<string> {
  if (!raw) return new Set();
  try {
    const arr = JSON.parse(raw);
    if (!Array.isArray(arr)) return new Set();
    return new Set(arr.filter((x) => typeof x === "string"));
  } catch {
    return new Set();
  }
}

/** Merge new unlocks into the existing set. Returns { newlyUnlocked, all }. */
export function mergeUnlocked(
  existing: Set<string>,
  newlySatisfied: string[]
): { newlyUnlocked: string[]; all: string[] } {
  const newlyUnlocked: string[] = [];
  for (const id of newlySatisfied) {
    if (!existing.has(id)) newlyUnlocked.push(id);
  }
  const all = [...new Set([...existing, ...newlySatisfied])];
  return { newlyUnlocked, all };
}

export function saveUnlocked(all: string[]): string {
  return JSON.stringify(all);
}

/** Get the AchievementDef for a list of ids (for display). */
export function defsFor(ids: string[]): AchievementDef[] {
  const map = new Map(ACHIEVEMENT_DEFS.map((d) => [d.id, d]));
  return ids.map((id) => map.get(id)).filter((d): d is AchievementDef => !!d);
}

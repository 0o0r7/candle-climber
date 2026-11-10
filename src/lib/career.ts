// P0.7 CAREER — the long-horizon progression lane.
//
// WHY (ten-pattern #5, the weakest remaining pattern in
// docs/PATTERN-AUDIT-2026-11-10.md): achievements existed, but they were a flat
// checklist with no accumulation — nothing measured "how far have I come".
//
// THE FAIRNESS LINE, stated once: career XP is COSMETIC. It never enters the
// score, the leaderboard, the physics, the terrain or the ranked lane
// (docs/ECONOMY-LAWS.md). Two players with different ranks climb the identical
// chart from the identical physics; the rank says how much they have played,
// never how strong they are. That is the only progression a shared daily board
// can carry without invalidating its own comparison.
//
// POSTURE: pure functions, localStorage touched only by the caller, and every
// input clamped — a hand-edited save can inflate its own badge and nothing else.
// Contract tests: test/career.test.ts.

export const CAREER_KEY = "cc_career_v1";

export interface Career {
  v: 1;
  xp: number;
  runs: number;
  updated: number;
}

export interface CareerRunInput {
  candlesPassed: number;
  /** Best combo of the run — the "how well", not just "how far". */
  bestStreak: number;
  style?: number;
  graduated: boolean;
  world2: boolean;
  died: boolean;
}

/** XP values — one place, so the curve can be tuned without hunting callers. */
export const XP_PER_CANDLE = 3;
export const XP_PER_STYLE = 2;
export const XP_PER_STREAK = 5;
export const XP_FOR_RUN = 10; // showing up counts; the climb counts more
export const XP_GRADUATION = 250;
export const XP_WORLD2 = 400;
/** A single run can never mint more than this (clamps absurd local saves). */
export const MAX_RUN_XP = 5_000;

export interface RankDef {
  /** total XP needed to ENTER the rank */
  at: number;
  name: string;
}

/** Ten ranks, trading-ladder vocabulary, thresholds widening as they go so the
 *  early levels teach the loop and the late ones mark real commitment. */
export const RANKS: readonly RankDef[] = [
  { at: 0, name: "PAPER HANDS" },
  { at: 400, name: "RETAIL" },
  { at: 1_000, name: "DAY TRADER" },
  { at: 2_000, name: "SWING TRADER" },
  { at: 3_500, name: "POSITION TRADER" },
  { at: 5_500, name: "WHALE WATCHER" },
  { at: 8_000, name: "MARKET MAKER" },
  { at: 11_500, name: "LIQUIDITY KING" },
  { at: 16_000, name: "CHART ORACLE" },
  { at: 22_000, name: "CANDLE TYCOON" },
];

export function emptyCareer(): Career {
  return { v: 1, xp: 0, runs: 0, updated: 0 };
}

const clampInt = (v: unknown, max: number): number => {
  const n = Math.floor(Number(v));
  return Number.isFinite(n) && n > 0 ? Math.min(n, max) : 0;
};

/** Parse a persisted career; any malformed shape falls back to empty. */
export function loadCareer(raw: string | null): Career {
  if (!raw) return emptyCareer();
  try {
    const j = JSON.parse(raw) as Partial<Career> | null;
    if (!j || typeof j !== "object") return emptyCareer();
    return {
      v: 1,
      xp: clampInt(j.xp, 1e9),
      runs: clampInt(j.runs, 1e6),
      updated: clampInt(j.updated, 8.64e15),
    };
  } catch {
    return emptyCareer();
  }
}

export function saveCareer(c: Career): string {
  return JSON.stringify(c);
}

/** XP for ONE finished run — a pure function of what the run did.
 *  Volume (candles) and combo dominate, quality (STYLE) is the bonus axis, and
 *  the milestones are worth a run of their own. */
export function xpForRun(r: CareerRunInput): number {
  const candles = clampInt(r.candlesPassed, 10_000);
  const style = clampInt(r.style, 10_000);
  const streak = clampInt(r.bestStreak, 10_000);
  let xp = XP_FOR_RUN + candles * XP_PER_CANDLE + style * XP_PER_STYLE + streak * XP_PER_STREAK;
  if (r.graduated) xp += XP_GRADUATION;
  if (r.world2) xp += XP_WORLD2;
  return Math.min(MAX_RUN_XP, xp);
}

export interface RankProgress {
  /** 1-based level shown to the player (rank index + 1). */
  level: number;
  name: string;
  /** XP earned inside the current rank. */
  xpInto: number;
  /** XP the current rank spans (0 at max rank). */
  xpSpan: number;
  /** 0..1 progress inside the current rank (1 at max rank). */
  share: number;
  next: string | null;
  toNext: number;
}

/** Rank + bar position for a total XP value. Pure. */
export function rankFor(xp: number): RankProgress {
  const total = clampInt(xp, 1e9);
  let idx = 0;
  for (let i = 0; i < RANKS.length; i++) if (total >= RANKS[i].at) idx = i;
  const current = RANKS[idx];
  const following = RANKS[idx + 1];
  if (!following) {
    return { level: idx + 1, name: current.name, xpInto: total - current.at, xpSpan: 0, share: 1, next: null, toNext: 0 };
  }
  const xpInto = total - current.at;
  const xpSpan = following.at - current.at;
  return {
    level: idx + 1,
    name: current.name,
    xpInto,
    xpSpan,
    share: xpSpan > 0 ? Math.min(1, xpInto / xpSpan) : 1,
    next: following.name,
    toNext: Math.max(0, following.at - total),
  };
}

/** Fold one finished run into the career. Pure — returns the NEXT career plus
 *  what changed, so the UI can toast a rank-up without recomputing anything. */
export function applyRun(
  c: Career,
  r: CareerRunInput,
  now: number,
): { career: Career; gained: number; levelBefore: number; levelAfter: number; rankedUp: boolean } {
  const gained = xpForRun(r);
  const next: Career = {
    v: 1,
    xp: c.xp + gained,
    runs: c.runs + 1,
    updated: Math.max(0, Math.floor(now)),
  };
  const levelBefore = rankFor(c.xp).level;
  const levelAfter = rankFor(next.xp).level;
  return { career: next, gained, levelBefore, levelAfter, rankedUp: levelAfter > levelBefore };
}

// Per-device lifetime stats ledger — the data behind the /stats page.
//
// POSTURE: pure functions, ZERO network, localStorage touched only by the
// caller (GameCanvas records a finished run once; /stats reads). Everything
// here is honest-local: clearing site data erases it, and the page says so.
//
// Recording contract: a run is recorded EXACTLY ONCE, at its true end. A run
// ends either (a) at death — onDeath fires once, or (b) at graduation when the
// player retries from the summit panel (a graduated engine that is abandoned
// never fires onDeath). The caller guards with a per-run flag; recordRun is
// idempotent-by-value only in the sense that the caller must not double-apply.

export const STATS_KEY = "cc_stats_v1";

export interface StatsLedger {
  v: 1;
  /** finished runs recorded (death or abandoned-after-graduation) */
  runs: number;
  totalScore: number;
  totalCandles: number;
  deaths: number;
  graduations: number;
  bestStreak: number;
  bestCandles: number;
  updated: number;
  /** daily-streak: consecutive UTC days with at least one finished run */
  currentStreak: number;
  bestDailyStreak: number;
  /** last UTC date string (YYYY-MM-DD) a run was recorded */
  lastPlayedDate: string | null;
}

export interface RunRecordInput {
  score: number;
  candlesPassed: number;
  bestStreak: number;
  graduated: boolean;
  died: boolean;
}

export function emptyLedger(): StatsLedger {
  return {
    v: 1,
    runs: 0,
    totalScore: 0,
    totalCandles: 0,
    deaths: 0,
    graduations: 0,
    bestStreak: 0,
    bestCandles: 0,
    updated: 0,
    currentStreak: 0,
    bestDailyStreak: 0,
    lastPlayedDate: null,
  };
}

/** Parse the persisted ledger — any malformed shape falls back to empty. */
export function loadLedger(raw: string | null): StatsLedger {
  if (!raw) return emptyLedger();
  try {
    const j = JSON.parse(raw) as Partial<StatsLedger> | null;
    if (!j || typeof j !== "object") return emptyLedger();
    const num = (v: unknown, max: number) => {
      const n = Math.floor(Number(v));
      return Number.isFinite(n) && n >= 0 ? Math.min(n, max) : 0;
    };
    return {
      v: 1,
      runs: num(j.runs, 1e6),
      totalScore: num(j.totalScore, 1e12),
      totalCandles: num(j.totalCandles, 1e9),
      deaths: num(j.deaths, 1e6),
      graduations: num(j.graduations, 1e6),
      bestStreak: num(j.bestStreak, 1e4),
      bestCandles: num(j.bestCandles, 1e6),
      updated: num(j.updated, 8.64e15),
      currentStreak: num(j.currentStreak, 1e4),
      bestDailyStreak: num(j.bestDailyStreak, 1e4),
      lastPlayedDate: typeof j.lastPlayedDate === "string" ? j.lastPlayedDate : null,
    };
  } catch {
    return emptyLedger();
  }
}

/** Fold one finished run into the ledger. Pure — returns the NEXT ledger.
 *  Also updates the daily streak: +1 if yesterday was the last play day,
 *  1 if it's a new streak (gap > 1 day), unchanged if already played today. */
export function recordRun(l: StatsLedger, r: RunRecordInput, now: number): StatsLedger {
  const score = Math.max(0, Math.floor(r.score) || 0);
  const candles = Math.max(0, Math.floor(r.candlesPassed) || 0);
  const streak = Math.max(0, Math.floor(r.bestStreak) || 0);

  // ── daily streak logic ──
  const todayStr = new Date(now).toISOString().slice(0, 10); // YYYY-MM-DD UTC
  let currentStreak = l.currentStreak;
  let bestDailyStreak = l.bestDailyStreak;
  if (l.lastPlayedDate !== todayStr) {
    // not yet played today — check if yesterday was the last play
    if (l.lastPlayedDate) {
      const last = new Date(l.lastPlayedDate + "T00:00:00Z").getTime();
      const today = new Date(todayStr + "T00:00:00Z").getTime();
      const dayMs = 86_400_000;
      if (today - last === dayMs) {
        // consecutive day
        currentStreak = l.currentStreak + 1;
      } else {
        // gap — reset
        currentStreak = 1;
      }
    } else {
      // first ever play
      currentStreak = 1;
    }
    bestDailyStreak = Math.max(bestDailyStreak, currentStreak);
  }

  return {
    v: 1,
    runs: l.runs + 1,
    totalScore: l.totalScore + score,
    totalCandles: l.totalCandles + candles,
    deaths: l.deaths + (r.died ? 1 : 0),
    graduations: l.graduations + (r.graduated ? 1 : 0),
    bestStreak: Math.max(l.bestStreak, streak),
    bestCandles: Math.max(l.bestCandles, candles),
    updated: now,
    currentStreak,
    bestDailyStreak,
    lastPlayedDate: todayStr,
  };
}

export function saveLedger(l: StatsLedger): string {
  return JSON.stringify(l);
}

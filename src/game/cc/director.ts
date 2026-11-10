// Deterministic difficulty director (P0.2) — the daily chart's authored pacing.
//
// WHY a pure function of the candle index: Candle Climber is a shared daily
// board, so two players must face the SAME climb (`docs/GAME-DESIGN-REFERENCES.md`
// §2 — no per-player adaptation; Hunicke's DDA would break comparability).
// The director therefore authors *pace*, never *personal difficulty*: every
// player meets the same sector at the same candle.
//
// GRAMMAR (Matt Thorson, "Designing Celeste", GDC 2017 — one idea at a time):
//   MARKET OPEN  → solid runway. No gaps: learn jump + the crumble tell.
//   TREND        → the first idea arrives: GAPS. Wide spacing, low density.
//   SQUEEZE      → the same idea, tighter: gap density up, no new hazard.
//   CONSOLIDATION→ breather. Density drops hard so the combo can be rebuilt
//                  (tension needs a release or the whole climb reads flat).
//   …then the three-phase cycle repeats, one small notch harder per cycle
//   (capped at +3 notches, so the late chart is hard, never unfair).
//   THE SUMMIT   → the last SUMMIT_APPROACH candles are gap-free: the final
//                  landing is a skill check, not a coin flip.
//
// Nothing here touches geometry that `level.ts` does not already clamp, and the
// RNG draw order in `buildPlatforms` is unchanged — the level stays a pure
// function of (candles, seed).
export type SectorKind = "intro" | "trend" | "squeeze" | "breather" | "summit" | "finale";

/** Display name per kind — the banner in-game and the /ops rows read the same
 *  string (one label, no drift between what players see and what ops reports). */
export const SECTOR_LABELS: Record<SectorKind, string> = {
  intro: "MARKET OPEN",
  trend: "TREND",
  squeeze: "SQUEEZE",
  breather: "CONSOLIDATION",
  summit: "THE SUMMIT",
  finale: "CLOSING BELL",
};

export interface Sector {
  /** Stable id — changes at every sector boundary (HUD banner key). */
  id: string;
  kind: SectorKind;
  /** Short name shown on the sector banner. */
  name: string;
  /** One-line telegraph: what this sector asks of the player. */
  hint: string;
  /** Probability that a platform in this sector is a gap (0 = solid runway). */
  gap: number;
}

/** Solid opening: the existing launch pad + ease window, plus a learn beat. */
export const INTRO_CANDLES = 12;
/** Gap-free run-in to the summit — the last landing is earned, not gambled. */
export const SUMMIT_APPROACH = 12;
/** P0.7 THE CLOSING BELL: the candles directly under the summit cap FOLD.
 *  Before this the summit approach was a flat 12-candle runway and the summit
 *  itself was only a landing (`docs/PATTERN-AUDIT-2026-11-10.md` #1 "the summit
 *  is still a landing"). The finale is a set-piece with ONE idea — "no more
 *  standing still" — authored from the index alone, so it stays identical for
 *  every player and every replay. Gaps stay 0 there: the skill asked for is
 *  rhythm, not reach, so the difficulty priors are untouched. */
export const SUMMIT_FINALE = 3;
export const TREND_LEN = 16;
export const SQUEEZE_LEN = 14;
export const BREATHER_LEN = 10;
export const CYCLE_LEN = TREND_LEN + SQUEEZE_LEN + BREATHER_LEN; // 40

const ESCALATION_STEP = 0.02; // gap density notch per completed cycle
const ESCALATION_CAP = 3; // …capped: no cycle is harder than this many notches

const INTRO: Sector = {
  id: "intro",
  kind: "intro",
  name: SECTOR_LABELS.intro,
  hint: "solid tape · learn the jump and the crumble tell",
  gap: 0,
};

const SUMMIT: Sector = {
  id: "summit",
  kind: "summit",
  name: SECTOR_LABELS.summit,
  hint: "clean runway to the top · land it",
  gap: 0,
};

const FINALE: Sector = {
  id: "finale",
  kind: "finale",
  name: SECTOR_LABELS.finale,
  hint: "every candle folds now · keep the rhythm, no stopping",
  gap: 0,
};

function trend(cycle: number): Sector {
  const k = Math.min(cycle, ESCALATION_CAP);
  return {
    id: `trend-${cycle}`,
    kind: "trend",
    name: SECTOR_LABELS.trend,
    hint: "gaps ahead · jump early, land centered",
    gap: 0.12 + k * ESCALATION_STEP,
  };
}

function squeeze(cycle: number): Sector {
  const k = Math.min(cycle, ESCALATION_CAP);
  return {
    id: `squeeze-${cycle}`,
    kind: "squeeze",
    name: SECTOR_LABELS.squeeze,
    hint: "tight tape · plan two platforms ahead",
    gap: 0.22 + k * ESCALATION_STEP,
  };
}

function breather(cycle: number): Sector {
  return {
    id: `breather-${cycle}`,
    kind: "breather",
    name: SECTOR_LABELS.breather,
    hint: "breather · rebuild the combo",
    gap: 0.04,
  };
}

/**
 * The sector a given candle index belongs to. Pure: same (index, total) ⇒ same
 * sector, for every client and every replay. `total` is the number of candles
 * in the daily level; pass 0 (or any unknown) for endless/derived terrain, in
 * which case only the opening applies and the cycle runs on.
 */
export function sectorAt(index: number, total = 0): Sector {
  const i = Math.max(0, Math.floor(index));
  if (i < INTRO_CANDLES) return INTRO;
  if (total >= INTRO_CANDLES + SUMMIT_APPROACH) {
    const summitIdx = total - 1; // the LAST platform carries the summit marker
    // P0.7: the three candles UNDER the cap are the set-piece; the cap itself
    // is not (a collapsing summit would undercut the moment it celebrates).
    if (i >= summitIdx - SUMMIT_FINALE && i < summitIdx) return FINALE;
    if (i >= total - SUMMIT_APPROACH) return SUMMIT;
  }

  const c = i - INTRO_CANDLES;
  const cycle = Math.floor(c / CYCLE_LEN);
  const phase = c - cycle * CYCLE_LEN;
  if (phase < TREND_LEN) return trend(cycle);
  if (phase < TREND_LEN + SQUEEZE_LEN) return squeeze(cycle);
  return breather(cycle);
}

/** Gap probability for a candle index — the only knob `level.ts` consumes. */
export function gapChanceAt(index: number, total = 0): number {
  return sectorAt(index, total).gap;
}

/** True for the closing-bell candles (folding, gap-free, directly under the
 *  summit cap). The level builder is the only consumer. */
export function isFinaleCandle(index: number, total = 0): boolean {
  return sectorAt(index, total).kind === "finale";
}

/**
 * The sectors the player will actually cross, in order, for a level of `total`
 * candles. Documented + tested shape of the day's climb (one entry per sector
 * boundary; the last entry is the summit approach when the level is long
 * enough). Pure — used by docs/tests, never to drive the run.
 */
export function sectorRoute(total: number): Array<{ start: number; sector: Sector }> {
  const out: Array<{ start: number; sector: Sector }> = [];
  let prevId = "";
  for (let i = 0; i < total; i++) {
    const s = sectorAt(i, total);
    if (s.id !== prevId) {
      out.push({ start: i, sector: s });
      prevId = s.id;
    }
  }
  return out;
}

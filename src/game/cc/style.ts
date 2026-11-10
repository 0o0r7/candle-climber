// STYLE score (P0.4) — the quality axis beside "how high".
//
// WHY it exists: the run score is height × combo × rush, so a lucky climb and a
// precise one read identically. The ten-pattern analysis
// (docs/GAME-DESIGN-REFERENCES.md §1 #3, §3) names a quality score as the missing
// axis — "how you climbed" should be visible next to "how far you climbed".
//
// WHAT it counts — only things the player CHOSE, never volume (volume is score):
//   LATE  +3  the jump left from the last STYLE_LATE_RUNWAY px of a platform.
//             You rode the platform to its edge: risk taken.
//   SAVE  +2  the jump only fired because of coyote time or the input buffer.
//             You were already off the ledge / still in the air: risk recovered.
//
// Both are pure functions of engine state (position + input history), so STYLE
// is replay-exact like every other number in the run. It is deliberately NOT
// part of the leaderboard score or its anti-cheat cap (lib/scoring.ts): a new
// scoring lane must never change what an existing score means (docs/ECONOMY-LAWS.md).
// Keeping the safe line — jump early, never get saved — earns 0 STYLE by design.
//
// Contract tests: test/style.test.ts. Design note: docs/STYLE-SCORE.md.

/** px of platform left under the player when a LATE hop counts. */
export const STYLE_LATE_RUNWAY = 20;

/** Points per event — the single source of truth for the tally. */
export const STYLE_POINTS = { late: 3, save: 2 } as const;

export type StyleEvent = keyof typeof STYLE_POINTS;

/** Style floats are gold: distinct from score (+lime) and losses (grey/orange). */
export const STYLE_COLOR = "#E0B04E";

export interface StyleTally {
  late: number;
  save: number;
}

export function emptyStyle(): StyleTally {
  return { late: 0, save: 0 };
}

/** The style value of one event. */
export function styleGain(e: StyleEvent): number {
  return STYLE_POINTS[e];
}

/** Weighted STYLE total for a tally. */
export function styleScore(t: StyleTally): number {
  return t.late * STYLE_POINTS.late + t.save * STYLE_POINTS.save;
}

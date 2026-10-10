// Seasons — PURE season math (LAW 1.2 Option B build, 2026-10-10).
// The official competitive layer is season-scoped: official records and the
// official board are stamped with the season their UTC date falls in, so a
// season can later be closed, archived, and ranked without touching the data.
// No I/O here (W5 purity rule): deterministic, same date ⇒ same season, always.
// LAWS (docs/ECONOMY-LAWS.md): seasons never gate PLAY — guest play is free,
// walletless, forever (LAW 1.2 substance); a season only scopes OFFICIAL surfaces.

/** Season 1 opens on the day the wallet-identity amendment was adopted. */
export const SEASON_1_START = "2026-10-10";

/**
 * Season registry — append-only. A season is `{ id, start, end? }` with
 * UTC dates; `end === null` means "still open". To close Season 1, set its
 * `end` and append the next row. Never rewrite history: past seasons keep
 * their exact bounds so official records stay reproducible.
 */
export interface Season {
  id: string;
  start: string; // inclusive, UTC YYYY-MM-DD
  end: string | null; // inclusive, UTC YYYY-MM-DD; null = open
}

export const SEASONS: Season[] = [{ id: "S1", start: SEASON_1_START, end: null }];

function utcMs(date: string): number {
  return Date.parse(date + "T00:00:00Z");
}

/**
 * Season id for a UTC date ("YYYY-MM-DD"), or null when the date predates
 * every season (pre-season play — still scored on the guest board, but it is
 * never an official record). Malformed dates return null (never guess).
 */
export function seasonOf(date: string): string | null {
  if (typeof date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return null;
  const t = utcMs(date);
  if (!Number.isFinite(t)) return null;
  for (const s of SEASONS) {
    if (t < utcMs(s.start)) continue;
    if (s.end !== null && t > utcMs(s.end)) continue;
    return s.id;
  }
  return null;
}

/** Season id for "now" (UTC) — the season live submissions stamp into. */
export function currentSeason(now: number = Date.now()): string | null {
  return seasonOf(new Date(now).toISOString().slice(0, 10));
}

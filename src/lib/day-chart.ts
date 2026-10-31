// The day's identity — PURE validation shared by /chart/[date], its link
// preview card and their tests.
//
// Deliberately DOES NOT resolve the symbol or mutation. /api/candles chooses
// the day's symbol at request time (volatility-scored `selectDailySymbol`,
// falling back to the seeded rotation), so any server-side guess here would be
// a second, drifting source of truth: the page would confidently print a
// ticker the level does not use. The chart page therefore renders the day and
// lets the client show whatever the feed actually served — verified against the
// live API while building this (a pure rotation predicted ETHUSDT on
// 2026-10-31 while the level really served BTCUSDT).
//
// No I/O: `today` is an argument (callers pass utcDateStr()).
import { isArchiveDate } from "@/game/cc/archive";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export interface DayIdentity {
  date: string;
  today: string;
  isToday: boolean;
}

/**
 * Validate a UTC date as a chart the product actually offers.
 * Returns null for malformed/impossible dates, future dates (W1: no future
 * terrain) and dates before the archive floor.
 */
export function resolveDay(date: string, today: string): DayIdentity | null {
  if (typeof date !== "string" || !DATE_RE.test(date)) return null;
  const ms = Date.parse(`${date}T00:00:00Z`);
  if (!Number.isFinite(ms)) return null;
  // Round-trip guard: Date.parse normalizes impossible dates (2026-02-30 →
  // 2026-03-02), which would quietly serve a different day's terrain.
  if (new Date(ms).toISOString().slice(0, 10) !== date) return null;
  if (date > today) return null;
  const isToday = date === today;
  if (!isToday && !isArchiveDate(date, today)) return null;
  return { date, today, isToday };
}

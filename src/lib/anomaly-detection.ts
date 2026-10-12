// Statistical anomaly detection (LU-7).
// Scores in the top 1% of a lane+date+interval board are flagged for manual
// review — the same community-driven approach Trackmania uses. A flagged entry
// is NOT rejected (false positives would block legit runs); it carries a
// `flagged: true` stamp visible in /ops so an operator can investigate.
//
// This is defense-in-depth: the existing physical caps (LU-3 layer) catch
// impossible scores, but a plausible-but-fabricated score that passes caps
// still shows up as an outlier in the score distribution. This module surfaces
// those outliers cheaply.
import type { BoardEntry } from "@/lib/leaderboard-store";

/** Entries in the top ~1% of a sorted list (minimum 10 entries to flag). */
export function detectAnomalies(entries: BoardEntry[]): Set<string> {
  if (entries.length < 10) return new Set();
  const sorted = [...entries].sort((a, b) => b.score - a.score);
  const top1pct = Math.max(1, Math.ceil(sorted.length * 0.01));
  // Flag only if the top entry's score is >2× the median — a real outlier.
  const mid = Math.floor(sorted.length / 2);
  const median = sorted[mid]?.score ?? 0;
  if (median === 0) return new Set();
  const flagged = new Set<string>();
  for (let i = 0; i < top1pct; i++) {
    const e = sorted[i];
    if (e.score > median * 2) {
      // use ts+name+score as a composite key (no _id in BoardEntry)
      flagged.add(`${e.ts}-${e.name}-${e.score}`);
    }
  }
  return flagged;
}

/** Check if a single new entry would be an anomaly given existing entries. */
export function wouldBeAnomaly(entry: BoardEntry, existing: BoardEntry[]): boolean {
  const combined = [...existing, entry];
  const flagged = detectAnomalies(combined);
  return flagged.has(`${entry.ts}-${entry.name}-${entry.score}`);
}

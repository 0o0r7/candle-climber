// The FIELD — crowd statistics over one day's scored climbs.
//
// Why this exists (docs/reference-study/02-proposals.md, P1): the board answers
// "who won"; the field answers "what is normal here" — the question a stranger
// actually asks before pressing START, and the one a mid-table player never
// gets answered. Everything below is derived from rows we ALREADY store
// (`candlesPassed` / `score`), so there is no new write path, no schema change
// and no anti-cheat surface added.
//
// PURE module: no fetch, no clock, no randomness. The day page, the /api/field
// route and the tests all import these functions so they can never disagree.
//
// LANE DISCIPLINE (ECONOMY-LAWS LAW 1.2): a summary describes ONE lane. The
// caller names the lane; nothing here blends guest and official rows, and no
// blended number may be presented as a board.

export interface FieldRow {
  candlesPassed: number;
}

export interface FieldBand {
  from: number;
  to: number | null; // null = open-ended top band
  count: number;
  pct: number; // 0-100, rounded
  label: string; // "25–49" / "200+"
}

export interface FieldSummary {
  count: number;
  medianCandles: number | null;
  p90Candles: number | null;
  bestCandles: number | null;
  /** The band where the most climbs ended — "the wall". Null when empty. */
  wall: FieldBand | null;
  bands: FieldBand[];
}

/** Fixed bands, low to high. Stable across days so two days are comparable. */
const BANDS: ReadonlyArray<{ from: number; to: number | null }> = [
  { from: 0, to: 10 },
  { from: 10, to: 25 },
  { from: 25, to: 50 },
  { from: 50, to: 100 },
  { from: 100, to: 200 },
  { from: 200, to: null },
];

export function bandLabel(from: number, to: number | null): string {
  return to === null ? `${from}+` : `${from}–${to}`;
}

/**
 * Summarise one lane's climbs. Rows with a non-finite or negative
 * `candlesPassed` are ignored rather than repaired — a malformed row must
 * never move a percentile (the same "never guess" rule the board validates on).
 */
export function summarizeField(rows: readonly FieldRow[]): FieldSummary {
  const vals = rows
    .map((r) => r.candlesPassed)
    .filter((v) => Number.isFinite(v) && v >= 0)
    .sort((a, b) => a - b);
  const count = vals.length;
  if (count === 0) {
    return { count: 0, medianCandles: null, p90Candles: null, bestCandles: null, wall: null, bands: [] };
  }

  // Nearest-rank percentile on the sorted list (no interpolation, no float
  // drift; for 0 < p <= 1).
  const at = (p: number) => vals[Math.min(count - 1, Math.max(0, Math.ceil(p * count) - 1))];

  const bands: FieldBand[] = BANDS.map((b) => {
    const n = vals.filter((v) => v >= b.from && (b.to === null || v < b.to)).length;
    return {
      from: b.from,
      to: b.to,
      count: n,
      pct: Math.round((n / count) * 100),
      label: bandLabel(b.from, b.to),
    };
  });

  // The wall: the band with the most endings. Ties keep the LOWER band — the
  // earlier the crowd stops, the more useful the warning, and a tie must not
  // flip between reads.
  let wall = bands[0];
  for (const b of bands) if (b.count > wall.count) wall = b;

  return {
    count,
    medianCandles: at(0.5),
    p90Candles: at(0.9),
    bestCandles: vals[count - 1],
    wall,
    bands,
  };
}

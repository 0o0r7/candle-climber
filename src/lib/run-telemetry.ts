// P0.1 — gameplay telemetry: the death histogram.
//
// WHY: today the only product signal is Sentry error volume; /ops literally
// says "needs analytics". Without a distribution of WHERE runs end, difficulty
// changes are guesses (Drachen et al., "Spatial Game Analytics": death heatmaps
// are the cheapest evidence that a level is unfair — see
// docs/GAME-DESIGN-REFERENCES.md §2).
//
// CONTRACT: aggregate, PII-free counters only. No name, wallet, address, IP,
// user-agent or exact timestamp is stored — a run contributes an index, a cause
// and coarse mode/input labels, nothing that identifies a person.
//
// This module is PURE (no DB, no Next runtime) so the normalization + summary
// math is unit-testable; src/lib/run-telemetry-store.ts persists it and
// /api/telemetry/run accepts it from the client.
import type { DeathCause } from "@/game/cc/types";
import type { GameInterval } from "@/game/cc/level-source";
import {
  sectorAt,
  SECTOR_LABELS,
  INTRO_CANDLES,
  SUMMIT_APPROACH,
  CYCLE_LEN,
  type SectorKind,
} from "@/game/cc/director";
import { styleScore } from "@/game/cc/style";

/** A finished run. `abandoned` = summit reached, player retried from the
 *  graduated panel (a run that ended without dying — not a difficulty signal). */
export type TelemetryCause = DeathCause | "abandoned";
export type TelemetryMode = "crypto" | "stocks" | "launchpad";
export type TelemetryDevice = "touch" | "keyboard";

export interface RunTelemetryEvent {
  /** candle index the run ended on (0 = died before the first pass) */
  candle: number;
  score: number;
  streak: number;
  cause: TelemetryCause;
  graduated: boolean;
  world2: boolean;
  rush: boolean; // RUSH was used during the run
  device: TelemetryDevice;
  mode: TelemetryMode;
  interval: GameInterval;
  /** P0.4 STYLE events at run end (counts, not points — points are derived from
   *  game/cc/style.ts so the scale has ONE definition). Absent on rows written
   *  before P0.5: treated as zero, never as "unknown". */
  styleLate?: number;
  styleSave?: number;
  /** Candles in the daily level. The death index alone cannot say WHICH sector
   *  a run died in, because the summit approach is a function of (index, total).
   *  0 = unknown/endless ⇒ the director's cycle applies with no summit band. */
  total?: number;
  /** server-side receive time (client clock is never trusted) */
  ts: number;
}

/** A run this short is the "first 1–2 candles" complaint measured. */
export const EARLY_DEATH_CANDLE = 10;
/** Physical ceiling for a stored index: the daily level is ~220 candles and
 *  world 2 is endless, so clamps are generous but bounded. */
export const MAX_CANDLE = 600;
export const MAX_SCORE = 10_000_000;
/** STYLE events are at most one per platform passed, so the ceiling follows
 *  the candle ceiling — generous, but bounded so a forged payload cannot skew
 *  the mean. */
export const MAX_STYLE_EVENTS = 1_000;
/** Histogram bin width (death indexes) and the open-ended overflow bin. */
export const HISTOGRAM_BIN = 20;
export const HISTOGRAM_MAX_BIN = 240;

const CAUSES: readonly TelemetryCause[] = ["fell", "crumbled", "wicked", "abandoned"];
const MODES: readonly TelemetryMode[] = ["crypto", "stocks", "launchpad"];
const DEVICES: readonly TelemetryDevice[] = ["touch", "keyboard"];
const INTERVALS: readonly GameInterval[] = ["1w", "1d", "4h", "1h"];

const pick = <T extends string>(allowed: readonly T[], v: unknown, fallback: T): T =>
  typeof v === "string" && (allowed as readonly string[]).includes(v) ? (v as T) : fallback;

const clampInt = (v: unknown, max: number): number => {
  const n = Math.floor(Number(v));
  if (!Number.isFinite(n) || n < 0) return 0;
  return Math.min(n, max);
};

/** Validate + clamp one untrusted event. Returns null when the payload is not
 *  an object or carries no usable candle index — the route then rejects it and
 *  the game never notices (fire-and-forget lane, LAW 1). */
export function normalizeRunEvent(raw: unknown, now = Date.now()): RunTelemetryEvent | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const r = raw as Record<string, unknown>;
  // `candle` is the one field the histogram cannot invent: require a number.
  if (typeof r.candle !== "number" || !Number.isFinite(r.candle)) return null;
  return {
    candle: clampInt(r.candle, MAX_CANDLE),
    score: clampInt(r.score, MAX_SCORE),
    streak: clampInt(r.streak, 10_000),
    cause: pick(CAUSES, r.cause, "fell"),
    graduated: r.graduated === true,
    world2: r.world2 === true,
    rush: r.rush === true,
    device: pick(DEVICES, r.device, "keyboard"),
    mode: pick(MODES, r.mode, "crypto"),
    interval: pick(INTERVALS, r.interval, "1w"),
    styleLate: clampInt(r.styleLate, MAX_STYLE_EVENTS),
    styleSave: clampInt(r.styleSave, MAX_STYLE_EVENTS),
    total: clampInt(r.total, MAX_CANDLE),
    ts: now,
  };
}

export interface HistogramBin {
  bucket: number; // 0, 20, 40 … 240 (= 240+)
  count: number;
}

/** P0.5 — is the quality axis used at all, and how generously? */
export interface StyleTelemetry {
  runs: number; // finished runs with at least one LATE or SAVE
  share: number; // 0..1 of finished runs
  mean: number; // STYLE points per finished run (all runs, zeros included)
  median: number; // median among runs that scored any (0 when none did)
  p90: number; // the precise tail among those runs
  late: number; // total LATE events
  save: number; // total SAVE events
}

/** P0.5 — sector hazard. `reached` is the exposure denominator: runs that got
 *  as far as a sector of this kind. A sector with few deaths but a high `rate`
 *  is the sharp one. */
export interface SectorTelemetry {
  kind: SectorKind;
  label: string;
  deaths: number; // runs whose last candle is inside this kind (abandoned excluded)
  reached: number; // runs that entered at least one sector of this kind
  rate: number; // deaths / reached (0 when nothing reached it)
}

export interface TelemetrySummary {
  total: number; // every recorded finished run
  deaths: number; // runs that ended by dying
  graduations: number; // runs that reached the summit (died later or not)
  medianDeathCandle: number | null;
  p90DeathCandle: number | null;
  earlyDeaths: number; // deaths at candle <= EARLY_DEATH_CANDLE
  earlyDeathRate: number; // 0..1 (0 when there are no deaths)
  rushShare: number; // 0..1
  touchShare: number; // 0..1
  causeCounts: Record<TelemetryCause, number>;
  histogram: HistogramBin[]; // deaths only
  style: StyleTelemetry; // P0.4 axis, measured (P0.5)
  sectors: SectorTelemetry[]; // P0.2 director sectors, measured (P0.5)
}

const EMPTY_STYLE: StyleTelemetry = {
  runs: 0, share: 0, mean: 0, median: 0, p90: 0, late: 0, save: 0,
};

/** Fixed display order — the same order the player crosses them. */
const SECTOR_ORDER: readonly SectorKind[] = ["intro", "trend", "squeeze", "breather", "summit"];

export const EMPTY_TELEMETRY_SUMMARY: TelemetrySummary = {
  total: 0,
  deaths: 0,
  graduations: 0,
  medianDeathCandle: null,
  p90DeathCandle: null,
  earlyDeaths: 0,
  earlyDeathRate: 0,
  rushShare: 0,
  touchShare: 0,
  causeCounts: { fell: 0, crumbled: 0, wicked: 0, abandoned: 0 },
  histogram: [],
  style: EMPTY_STYLE,
  sectors: [],
};

/** The effective level length for sector classification: past the last candle
 *  the run is in the endless post-summit world, where the summit band no longer
 *  applies — classify it with the plain cycle (total = 0). */
function effectiveTotal(candle: number, total: number): number {
  return total > 0 && candle >= total ? 0 : total;
}

/** Sector kinds traversed by candle `candle` (the exposure denominator).
 *  Bounded work per event: once the intro + one full cycle have passed, every
 *  cycling kind has been seen, so only the summit band needs its own check.
 *  `test/run-telemetry.test.ts` cross-checks this against a brute-force walk. */
function kindsReached(candle: number, total: number): SectorKind[] {
  const eff = effectiveTotal(candle, total);
  const kinds = new Set<SectorKind>();
  const limit = Math.min(candle, INTRO_CANDLES + CYCLE_LEN - 1);
  for (let i = 0; i <= limit; i++) kinds.add(sectorAt(i, eff).kind);
  if (eff >= INTRO_CANDLES + SUMMIT_APPROACH) {
    const summitStart = Math.max(INTRO_CANDLES, eff - SUMMIT_APPROACH);
    if (candle >= summitStart) kinds.add("summit");
  }
  return [...kinds];
}


function percentile(sorted: readonly number[], p: number): number | null {
  if (sorted.length === 0) return null;
  const idx = Math.min(sorted.length - 1, Math.max(0, Math.ceil(p * sorted.length) - 1));
  return sorted[idx];
}

/** Fold a set of events into the numbers /ops reports. Death percentiles use
 *  DEATHS only: an abandoned summit run is a success, including it would drag
 *  the difficulty signal down. */
export function summarizeRunEvents(events: readonly RunTelemetryEvent[]): TelemetrySummary {
  if (events.length === 0) return EMPTY_TELEMETRY_SUMMARY;

  const deathCandles: number[] = [];
  const causeCounts: Record<TelemetryCause, number> = { fell: 0, crumbled: 0, wicked: 0, abandoned: 0 };
  const bins = new Map<number, number>();
  let graduations = 0;
  let rush = 0;
  let touch = 0;
  // P0.5
  const styleScores: number[] = []; // runs that scored any STYLE, for percentiles
  let styleTotal = 0;
  let styleLate = 0;
  let styleSave = 0;
  const sectorDeaths: Record<SectorKind, number> = { intro: 0, trend: 0, squeeze: 0, breather: 0, summit: 0 };
  const sectorReached: Record<SectorKind, number> = { intro: 0, trend: 0, squeeze: 0, breather: 0, summit: 0 };

  for (const e of events) {
    if (e.graduated) graduations++;
    if (e.rush) rush++;
    if (e.device === "touch") touch++;
    causeCounts[e.cause] = (causeCounts[e.cause] ?? 0) + 1;

    // P0.5 STYLE — the points scale comes from game/cc/style.ts, never a copy.
    const late = e.styleLate ?? 0;
    const save = e.styleSave ?? 0;
    styleLate += late;
    styleSave += save;
    const pts = styleScore({ late, save });
    styleTotal += pts;
    if (pts > 0) styleScores.push(pts);

    // P0.5 SECTORS — every run is exposure for the sectors it crossed; only
    // deaths are attributed to the sector the run ENDED in.
    const total = e.total ?? 0;
    for (const kind of kindsReached(e.candle, total)) sectorReached[kind]++;
    if (e.cause !== "abandoned") {
      sectorDeaths[sectorAt(e.candle, effectiveTotal(e.candle, total)).kind]++;
    }

    if (e.cause === "abandoned") continue;
    deathCandles.push(e.candle);
    const bucket = Math.min(HISTOGRAM_MAX_BIN, Math.floor(e.candle / HISTOGRAM_BIN) * HISTOGRAM_BIN);
    bins.set(bucket, (bins.get(bucket) ?? 0) + 1);
  }

  deathCandles.sort((a, b) => a - b);
  styleScores.sort((a, b) => a - b);
  const deaths = deathCandles.length;
  const earlyDeaths = deathCandles.filter((c) => c <= EARLY_DEATH_CANDLE).length;
  const histogram: HistogramBin[] = [];
  for (let b = 0; b <= HISTOGRAM_MAX_BIN; b += HISTOGRAM_BIN) {
    histogram.push({ bucket: b, count: bins.get(b) ?? 0 });
  }
  const style: StyleTelemetry = {
    runs: styleScores.length,
    share: styleScores.length / events.length,
    mean: styleTotal / events.length,
    median: percentile(styleScores, 0.5) ?? 0,
    p90: percentile(styleScores, 0.9) ?? 0,
    late: styleLate,
    save: styleSave,
  };
  const sectors: SectorTelemetry[] = SECTOR_ORDER.map((kind) => ({
    kind,
    label: SECTOR_LABELS[kind],
    deaths: sectorDeaths[kind],
    reached: sectorReached[kind],
    rate: sectorReached[kind] > 0 ? sectorDeaths[kind] / sectorReached[kind] : 0,
  }));

  return {
    total: events.length,
    deaths,
    graduations,
    medianDeathCandle: percentile(deathCandles, 0.5),
    p90DeathCandle: percentile(deathCandles, 0.9),
    earlyDeaths,
    earlyDeathRate: deaths > 0 ? earlyDeaths / deaths : 0,
    rushShare: rush / events.length,
    touchShare: touch / events.length,
    causeCounts,
    histogram,
    style,
    sectors,
  };
}

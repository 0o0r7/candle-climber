// Route Prediction — PURE math core (E2.3 / P4.6 / H5, spec: docs/WICK-ECONOMY-SPEC.md §7.2).
// No I/O here (W5 purity rule): the route feeds a verified real daily candle in,
// this module decides what the call was worth. Deterministic: same call + same
// candle ⇒ same points, always. Language law applies — a call "builds weights",
// never "earns", nothing "guaranteed".
import { PREDICTION_DAILY_CAP } from "@/lib/weights";

/* ------------------------------ shape of a call ------------------------------ */

export type Dir = "up" | "down";
export type Vol = "low" | "mid" | "high"; // |close-open| / open tier
export type Tail = "top" | "bottom" | "none"; // dominant wick side

export interface PredictionCall {
  dir: Dir;
  vol: Vol;
  tail: Tail;
}

// Tiered points (spec §7.2 "tiered, ≤10/day"): dir 4 + vol 3 + tail 3 = 10 max.
export const PREDICT_DIR_POINTS = 4;
export const PREDICT_VOL_POINTS = 3;
export const PREDICT_TAIL_POINTS = 3;
export const PREDICT_MAX_POINTS = PREDICT_DIR_POINTS + PREDICT_VOL_POINTS + PREDICT_TAIL_POINTS;
export { PREDICTION_DAILY_CAP }; // re-export: the route pins the cap from ONE module

const DIRS: readonly Dir[] = ["up", "down"];
const VOLS: readonly Vol[] = ["low", "mid", "high"];
const TAILS: readonly Tail[] = ["top", "bottom", "none"];

function oneOf<T extends string>(v: unknown, list: readonly T[]): v is T {
  return typeof v === "string" && (list as readonly string[]).includes(v);
}

/** Strict shape check — anything malformed is rejected, never guessed. */
export function validateCall(raw: unknown): PredictionCall | null {
  if (typeof raw !== "object" || raw === null) return null;
  const r = raw as Record<string, unknown>;
  if (!oneOf(r.dir, DIRS) || !oneOf(r.vol, VOLS) || !oneOf(r.tail, TAILS)) return null;
  return { dir: r.dir, vol: r.vol, tail: r.tail };
}

/* --------------------------------- date math --------------------------------- */

/** The UTC date after `date` (predictions always target exactly tomorrow). */
export function nextUtcDate(date: string): string {
  return new Date(Date.parse(date + "T00:00:00Z") + 86_400_000).toISOString().slice(0, 10);
}

/* ------------------------------ candle tier math ----------------------------- */

export interface DailyCandle {
  o: number;
  h: number;
  l: number;
  c: number;
}

/** Body size as % of open — the volatility tier input. */
export function bodyPct(c: DailyCandle): number {
  if (!(c.o > 0)) return 0;
  return (Math.abs(c.c - c.o) / c.o) * 100;
}

/** |close-open|/open < 1% = low · 1–3% = mid · > 3% = high. */
export function volTier(c: DailyCandle): Vol {
  const p = bodyPct(c);
  if (p < 1) return "low";
  if (p <= 3) return "mid";
  return "high";
}

/**
 * Dominant wick side. Tails are measured relative to the open; a side counts
 * only when it sticks out ≥ 0.05% of price — below that the candle "has no
 * tail" (dead-flat candles score `none`). Exact ties score `top` (deterministic).
 */
export function tailSide(c: DailyCandle): Tail {
  if (!(c.o > 0)) return "none";
  const top = (c.h - Math.max(c.o, c.c)) / c.o;
  const bot = (Math.min(c.o, c.c) - c.l) / c.o;
  const FLOOR = 0.0005;
  if (top < FLOOR && bot < FLOOR) return "none";
  return top >= bot ? "top" : "bottom";
}

/* --------------------------------- scoring ---------------------------------- */

export interface PredictionScore {
  dirOk: boolean;
  volOk: boolean;
  tailOk: boolean;
  points: number;
}

/**
 * Score one locked call against the REAL closed daily candle of the target
 * date. A doji (close == open) is read as an up candle — deterministic and
 * documented; perfect equality is measure-zero on real feeds anyway.
 */
export function scorePrediction(call: PredictionCall, c: DailyCandle): PredictionScore {
  const actualDir: Dir = c.c >= c.o ? "up" : "down";
  const dirOk = call.dir === actualDir;
  const volOk = call.vol === volTier(c);
  const tailOk = call.tail === tailSide(c);
  const points =
    (dirOk ? PREDICT_DIR_POINTS : 0) +
    (volOk ? PREDICT_VOL_POINTS : 0) +
    (tailOk ? PREDICT_TAIL_POINTS : 0);
  return { dirOk, volOk, tailOk, points: Math.min(points, PREDICTION_DAILY_CAP) };
}

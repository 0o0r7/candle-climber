/**
 * Deterministic synthetic candle data.
 *
 * Guardrail: every candle comes from mulberry32 seeded with 1337 — never
 * Math.random() — so all five etudes render the identical chart on every load.
 * This is a design mockup; the numbers carry no market meaning.
 */

export const SEED = 1337;
export const CANDLE_COUNT = 60;
export const ALTITUDE_MAX = 100;

export type CandleState = "up" | "down";

export interface Candle {
  index: number;
  open: number;
  high: number;
  low: number;
  close: number;
  state: CandleState;
}

/** mulberry32 — tiny deterministic PRNG. Same seed → same sequence, every run. */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), 1 | t);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));
const round1 = (value: number) => Math.round(value * 10) / 10;

export function generateCandles(
  seed = SEED,
  count = CANDLE_COUNT,
): Candle[] {
  const rand = mulberry32(seed);
  const candles: Candle[] = [];
  let previousClose = 22;

  for (let index = 0; index < count; index += 1) {
    const open = previousClose;
    // Slight upward bias so the walk reads like a climb rather than noise.
    const close = clamp(open + (rand() - 0.46) * 7.5, 6, 94);
    const high = clamp(Math.max(open, close) + 0.6 + rand() * 3.4, 0, ALTITUDE_MAX);
    const low = clamp(Math.min(open, close) - 0.6 - rand() * 3.4, 0, ALTITUDE_MAX);

    const roundedOpen = round1(open);
    const roundedClose = round1(close);
    const roundedHigh = round1(high);
    const roundedLow = round1(low);

    candles.push({
      index,
      open: roundedOpen,
      high: Math.max(roundedHigh, roundedOpen, roundedClose),
      low: Math.min(roundedLow, roundedOpen, roundedClose),
      close: roundedClose,
      state: roundedClose >= roundedOpen ? "up" : "down",
    });
    previousClose = close;
  }

  return candles;
}

/** One shared array, reused by all five etudes. */
export const CANDLES = generateCandles();

export function deltaPercent(candle: Candle): number {
  return ((candle.close - candle.open) / candle.open) * 100;
}

/** Descriptive body-vs-range shape only — no buy/sell meaning. */
export function shapeWord(candle: Candle): "Strong" | "Neutral" | "Weak" {
  const range = Math.max(candle.high - candle.low, 0.1);
  const body = Math.abs(candle.close - candle.open);
  const ratio = body / range;
  if (ratio >= 0.6) return "Strong";
  if (ratio >= 0.35) return "Neutral";
  return "Weak";
}

export function candleAriaLabel(candle: Candle): string {
  return `Candle ${candle.index + 1}: open ${candle.open}, high ${candle.high}, low ${candle.low}, close ${candle.close}, ${candle.state} candle`;
}

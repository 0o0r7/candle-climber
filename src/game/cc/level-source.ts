// Level source — single authority for "which chart is today's level" and the
// deterministic synthetic fallback. Used by the server proxy (/api/candles) AND
// by the client when the API is unreachable, so the game is always playable
// and every client derives identical data from the same seed.
// E2 note (ECOSYSTEM_BAR): this module is the future plug point for the
// vibe/vibe launch feed — platform-launched tokens become level inputs here,
// without touching the engine or the API contract.
import { hashString, mulberry32 } from "./rng";
import type { Candle, SeedInfo } from "./types";

export const WATCHLIST = ["BTCUSDT", "ETHUSDT", "SOLUSDT", "DOGEUSDT", "XRPUSDT", "BNBUSDT"];
// Stock rails (W3): real weekly candles from stooq — same engine, same rules.
export const STOCKS = ["TSLA", "AMZN", "NFLX"];
// Everything a deep link (?symbol=) may pin: crypto rotation + stock rails.
export const ALL_SYMBOLS = [...WATCHLIST, ...STOCKS];
export const INTERVAL = "1w";
export const LIMIT = 220;

// P3.5 timeframe selector (owner proposal, tech-reviewed ACCEPT): the classic
// weekly level stays the default; 1d/4h/1h re-shape the SAME daily symbol
// rotation into shorter windows. Seed keys carry the interval so every
// timeframe is its own deterministic terrain; leaderboards never mix tfs.
export const INTERVALS = ["1w", "1d", "4h", "1h"] as const;
export type GameInterval = (typeof INTERVALS)[number];
export function isInterval(v: unknown): v is GameInterval {
  return typeof v === "string" && (INTERVALS as readonly string[]).includes(v);
}
export const INTERVAL_MS: Record<GameInterval, number> = {
  "1h": 3_600_000,
  "4h": 14_400_000,
  "1d": 86_400_000,
  "1w": 604_800_000,
};

export function pickSeed(date: string) {
  const h = hashString("cc-daily-v1:" + date);
  const rnd = mulberry32(h);
  // One rnd() draw ALWAYS (even on v2 days): keeps the synthetic-fallback byte
  // stream identical to the legacy pick for every date — only the SYMBOL
  // choice is versioned, never the terrain shape.
  const legacySymbol = WATCHLIST[Math.floor(rnd() * WATCHLIST.length)];
  const symbol = date >= ROTATION_V2_FROM ? rotationSymbol(date) : legacySymbol;
  return { symbol, rnd };
}

// ── Daily rotation v2 (owner report 2026-10-11) ─────────────────────────────
// The legacy 6-crypto hash pick clustered (XRPUSDT served 2026-10-10 AND
// 2026-10-11 back-to-back; ETHUSDT 3 of 5 days) and the W3 stock rails never
// entered the daily level — they were reachable only via deep link. From the
// cutoff below the daily symbol cycles ALL nine symbols (crypto + stocks) in
// a fixed deterministic shuffled order: every symbol serves every 9 days and
// two consecutive days can NEVER repeat. Terrains before the cutoff keep the
// legacy pick — leaderboard run tokens, archive replays and pinned tests all
// stay byte-valid (the cutoff pattern mirrors "legacy 1w byte-identical").
export const ROTATION_V2_FROM = "2026-10-12";

// Fixed shuffle (deterministic across server + every client): Fisher-Yates
// over ALL_SYMBOLS seeded by a constant — NOT the daily hash, so the order is
// stable forever and the cycle never depends on when it is evaluated.
function fixedShuffle(symbols: readonly string[], seedLabel: string): readonly string[] {
  const rnd = mulberry32(hashString(seedLabel));
  const arr = [...symbols];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export const ROTATION_ORDER: readonly string[] = fixedShuffle(ALL_SYMBOLS, "cc-rotation-v2");

/** v2 daily schedule: day-index round-robin over the fixed ROTATION_ORDER. */
export function rotationSymbol(date: string): string {
  const days = Math.floor(Date.parse(date + "T00:00:00Z") / 86_400_000);
  return ROTATION_ORDER[((days % ROTATION_ORDER.length) + ROTATION_ORDER.length) % ROTATION_ORDER.length];
}

// ── Per-pool rotations (3-mode restructure, council 2026-10-12 ruling B) ────
// CRYPTO mode and STOCKS mode each rotate their OWN pool: the all-symbol v2
// order above stays for bare legacy requests (byte-compat), but a mode-scoped
// level must never serve a symbol outside its pool (STOCKS mode serving BTC
// would be a labeling lie; CRYPTO mode serving TSLA breaks the niche promise).
// Same fixed-shuffle pattern, distinct seed labels — stable forever, and the
// day-index round-robin guarantees no consecutive-day repeats within a pool.
export const CRYPTO_ROTATION_ORDER: readonly string[] = fixedShuffle(WATCHLIST, "cc-rotation-v2-crypto");
export const STOCK_ROTATION_ORDER: readonly string[] = fixedShuffle(STOCKS, "cc-rotation-v2-stocks");

/** Day-index round-robin over any fixed order (shared schedule math). */
export function poolRotationSymbol(order: readonly string[], date: string): string {
  const days = Math.floor(Date.parse(date + "T00:00:00Z") / 86_400_000);
  return order[((days % order.length) + order.length) % order.length];
}

/** CRYPTO mode's default symbol of the day (crypto-only pool). */
export function cryptoRotation(date: string): string {
  return poolRotationSymbol(CRYPTO_ROTATION_ORDER, date);
}

/** STOCKS mode's default symbol of the day (equities-only pool). */
export function stocksRotation(date: string): string {
  return poolRotationSymbol(STOCK_ROTATION_ORDER, date);
}

// Merge-back wave 1 (VARIANT-REVIEW-2026-10-05) — provenance badge. The ONE
// shared mapping from a terrain seed's source field to the always-visible HUD
// label. Both seed producers route through this module (the server proxy's
// feed chain and the client-side offline fallback), so the badge reflects
// whatever actually served the level and flips the moment a fallback does.
export function provenanceLabel(
  source: SeedInfo["source"],
  symbol: string,
): { real: boolean; kind: "live" | "onchain" | "synthetic"; long: string; short: string } {
  if (source === "synthetic") {
    return { real: false, kind: "synthetic", long: "SYNTHETIC FALLBACK", short: "SYNTHETIC" };
  }
  // W6: no reachable OHLC for this stock, but the official Chainlink price WAS
  // read on-chain — the terrain is anchored to that real price. Shape derived,
  // anchor official: labeled as such, never "live data".
  if (source === "robinhood") {
    return { real: true, kind: "onchain", long: `OFFICIAL PRICE · ${symbol}`, short: `ON-CHAIN · ${symbol}` };
  }
  return { real: true, kind: "live", long: `REAL FEED · ${symbol}`, short: `REAL · ${symbol}` };
}

/** W6 stock anchoring: the deterministic terrain shape (identical to the
 *  synthetic seed for the same date/interval) is rescaled so its final close
 *  EQUALS the official on-chain price. The shape is derived; the price is real
 *  and cited. Used only when no real OHLC feed could serve the stock. */
export function anchoredCandles(
  date: string,
  count: number,
  anchorPrice: number,
  interval: GameInterval = "1w",
): Candle[] {
  const shape = syntheticCandles(date, count, interval);
  const last = shape[shape.length - 1]?.c;
  if (!last || !Number.isFinite(anchorPrice) || anchorPrice <= 0) return shape;
  const k = anchorPrice / last;
  return shape.map((c) => ({ t: c.t, o: c.o * k, h: c.h * k, l: c.l * k, c: c.c * k }));
}

// interval-aware synthetic fallback (P3.5): "1w" keeps the legacy seed path
// BYTE-IDENTICAL (existing pinned terrains/tests), other tfs seed on
// `date|interval` so 1h/4h/1d of the same day are distinct terrains.
export function syntheticCandles(date: string, count: number, interval: GameInterval = "1w"): Candle[] {
  const { rnd } = pickSeed(interval === "1w" ? date : `${date}|${interval}`);
  const step = INTERVAL_MS[interval];
  const out: Candle[] = [];
  let price = 100 + rnd() * 400;
  let drift = (rnd() - 0.5) * 0.02;
  let t = Date.parse(date + "T00:00:00Z") - count * step;
  for (let i = 0; i < count; i++) {
    if (rnd() < 0.08) drift = (rnd() - 0.5) * 0.04; // trend shifts
    const o = price;
    const move = drift + (rnd() - 0.5) * 0.06;
    const c = Math.max(1, o * (1 + move));
    const wick = Math.abs(move) * (0.4 + rnd()) + rnd() * 0.01;
    const h = Math.max(o, c) * (1 + wick);
    const l = Math.min(o, c) * (1 - wick);
    out.push({ t: t + i * step, o, h, l, c });
    price = c;
  }
  return out;
}

// Candle Climber — core types
export interface Candle {
  t: number; // open time (ms)
  o: number; // open
  h: number; // high
  l: number; // low
  c: number; // close
  /** Volume (base asset), when the feed provides it (binance/stooq). Absent
   *  for synthetic/derived terrain — weather fog falls back to a baseline.
   *  Optional since P2.3; JSON.stringify drops undefined, so candle JSON and
   *  run-token fingerprints stay stable for feeds without volume. */
  v?: number;
}

/** W6: the official Robinhood Chain read that backs a stock level. `verified`
 *  means the served terrain's final price AGREES with the live Chainlink feed
 *  (or WAS anchored to it) and the quote is fresh — never a fabricated claim. */
export interface OnchainVerification {
  chainId: number; // 4663 (mainnet — where the production feeds live)
  feed: string; // Chainlink feed proxy address that was read
  feedSource: 'directory' | 'snapshot';
  price: number; // official USD price of one token
  decimals: number; // feed decimals, read on-chain
  updatedAt: number; // unix seconds of the round
  ageSec: number; // now - updatedAt
  stale: boolean; // older than the staleness bound
  roundId: string;
  anchorPrice: number | null; // last close of the served terrain
  deltaPct: number | null; // terrain close vs official price, %
  verified: boolean; // fresh AND terrain agrees with the official price
}

export interface SeedInfo {
  date: string; // UTC YYYY-MM-DD
  symbol: string; // e.g. BTCUSDT / TSLA / launch ticker
  interval: string; // e.g. 1w; "derived" for vibe-launch terrain
  source: 'binance' | 'stooq' | 'yahoo' | 'vibe-launch' | 'robinhood' | 'synthetic';
  /** Present for stock levels when the official mainnet Chainlink feed was
   *  read; absent when the ticker has no official feed or the read failed. */
  onchain?: OnchainVerification;
}

export interface CandleData {
  seed: SeedInfo;
  candles: Candle[];
  /** HMAC attestation from /api/candles binding symbol+date+terrain.
   *  Absent for synthetic fallback terrain — those runs are unscored. */
  runToken?: string;
}

export interface Platform {
  i: number; // candle index
  x: number; // world x (left edge)
  w: number; // width
  y: number; // top y (world, y grows downward)
  bodyTop: number;
  bodyBottom: number;
  wickTop: number;
  wickBottom: number;
  up: boolean; // green candle
  crumble: boolean; // red candles crumble
  state: 'solid' | 'crumbling' | 'gone';
  crumbleT: number; // seconds since crumble started
  passed: boolean; // camera already passed it
  /** W4 graduation arc: the FINAL platform of the daily level is the summit —
   *  landing on it (or passing its x) graduates the run. Purely derived from
   *  the seed-derived platform list, so it stays deterministic. */
  summit?: boolean;
}

export interface Particle {
  x: number; y: number; vx: number; vy: number;
  life: number; maxLife: number; size: number; color: string;
}

export type DeathCause = 'fell' | 'crumbled' | 'wicked';

export interface RunResult {
  score: number;
  candlesPassed: number;
  bestStreak: number;
  /** Absent while the run is still live (e.g. the GRADUATED snapshot). */
  cause?: DeathCause;
  candleIndex: number;
  /** W4 graduation arc: milestone flags carried into the death card + UI. */
  graduated?: boolean;
  world2?: boolean;
}

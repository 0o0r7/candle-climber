// CoinGecko market data client — Market Mode's broader asset pool.
//
// The existing Market Mode uses a fixed 6-coin Binance watchlist. CoinGecko's
// free, keyless /coins/markets endpoint gives us the top N coins by market cap
// with 24h price-change %, volume, and high/low — enough to run the same
// volatility-based scoring as market-selector.ts but across a MUCH wider pool,
// so the daily chart isn't always BTC/ETH/SOL.
//
// Honesty rules (same as every feed in this repo):
// - Data is REAL market data from CoinGecko's public API.
// - Failure degrades to the existing Binance watchlist path (market-selector.ts).
// - No API key required for the free tier (30 calls/min, more than enough).
//
// API docs: https://docs.coingecko.com/reference/coins-markets
import type { Candle } from "@/game/cc/types";
import { hashString, mulberry32, utcDateStr } from "@/game/cc/rng";

const COINGECKO_HOST = "https://api.coingecko.com";
const COINGECKO_HOSTS = [COINGECKO_HOST, "https://api.coingecko.com/api/v3"];

export interface CoinMarket {
  id: string;          // CoinGecko coin id ("bitcoin")
  symbol: string;      // ticker ("btc")
  name: string;        // display name ("Bitcoin")
  currentPrice: number;
  marketCap: number;
  totalVolume: number;
  priceChange24h: number;     // percent
  priceChangePercentage24h: number;
  high24h: number;
  low24h: number;
  sparkline7d?: number[];      // 7d price samples (when include_sparkline=true)
}

export interface ScoredCoin {
  coinId: string;
  symbol: string;     // uppercase ticker ("BTC")
  name: string;
  score: number;
  volatility: number;
  volume: number;
  changePct: number;
}

const MARKET_CACHE_TTL = 60 * 60 * 1000; // 1h — same cadence as vibe-launch raw cache
let marketCache: { bucket: number; coins: CoinMarket[] } | null = null;

function hourBucket(now: number): number {
  return Math.floor(now / 3_600_000);
}

/**
 * Fetch the top N coins by market cap from CoinGecko.
 * Returns null on failure (caller falls back to the Binance watchlist).
 */
export async function fetchTopCoins(perPage = 30): Promise<CoinMarket[] | null> {
  const bucket = hourBucket(Date.now());
  if (marketCache && marketCache.bucket === bucket) return marketCache.coins;

  for (const host of COINGECKO_HOSTS) {
    try {
      const params = new URLSearchParams({
        vs_currency: "usd",
        order: "market_cap_desc",
        per_page: String(perPage),
        page: "1",
        sparkline: "true",
        price_change_percentage: "24h",
      });
      const url = `${host}/api/v3/coins/markets?${params}`;
      const res = await fetch(url, {
        cache: "no-store",
        signal: AbortSignal.timeout(8000),
        headers: { accept: "application/json" },
      });
      if (!res.ok) {
        console.error("[coingecko]", host, "HTTP", res.status);
        continue;
      }
      const data = (await res.json()) as Record<string, unknown>[];
      if (!Array.isArray(data)) continue;
      const coins: CoinMarket[] = [];
      for (const d of data) {
        const r = d as Record<string, unknown>;
        if (
          typeof r.id !== "string" || !r.id ||
          typeof r.symbol !== "string" || !r.symbol ||
          typeof r.current_price !== "number" ||
          typeof r.market_cap !== "number" ||
          typeof r.total_volume !== "number"
        ) continue;
        const spark = r.sparkline_in_7d as { price?: number[] } | undefined;
        coins.push({
          id: r.id,
          symbol: r.symbol,
          name: typeof r.name === "string" ? r.name : r.symbol,
          currentPrice: r.current_price,
          marketCap: r.market_cap,
          totalVolume: r.total_volume,
          priceChange24h: typeof r.price_change_percentage_24h === "number" ? r.price_change_percentage_24h : 0,
          priceChangePercentage24h: typeof r.price_change_percentage_24h === "number" ? r.price_change_percentage_24h : 0,
          high24h: typeof r.high_24h === "number" ? r.high_24h : r.current_price,
          low24h: typeof r.low_24h === "number" ? r.low_24h : r.current_price,
          sparkline7d: spark?.price,
        });
      }
      if (coins.length === 0) {
        console.error("[coingecko] empty/invalid markets payload");
        continue;
      }
      marketCache = { bucket, coins };
      return coins;
    } catch (err) {
      console.error("[coingecko]", host, "fetch failed:", (err as Error).message);
      continue;
    }
  }
  return null;
}

// Exclude stablecoins (USDT, USDC, DAI, etc.) — their flat charts make boring terrain.
const STABLECOIN_SYMBOLS = new Set(["USDT", "USDC", "DAI", "TUSD", "BUSD", "FDUSD", "USDE", "PAXG"]);

/**
 * Score coins by how interesting their market conditions are for gameplay.
 * Same philosophy as market-selector.ts: volatility shapes terrain, volume is a
 * minor liquidity preference, extreme moves get a bonus.
 *
 * Deterministic per date: ties broken by the date's hash.
 */
export function scoreCoins(coins: CoinMarket[], dateStr: string): ScoredCoin[] {
  const filtered = coins.filter((c) => !STABLECOIN_SYMBOLS.has(c.symbol.toUpperCase()));
  if (filtered.length === 0) return [];
  const maxVol = Math.max(...filtered.map((c) => c.totalVolume), 1);

  const scored = filtered.map((c) => {
    const changePct = Math.abs(c.priceChangePercentage24h);
    const rangeRatio = c.currentPrice > 0 ? (c.high24h - c.low24h) / c.currentPrice : 0;
    const volatility = Math.min(1, (changePct / 15 + rangeRatio / 0.1) / 2);
    const volume = Math.log(1 + c.totalVolume) / Math.log(1 + maxVol);
    const directionalBonus = changePct > 5 ? 0.3 : 0;
    const score = volatility * 0.6 + volume * 0.1 + directionalBonus;
    return {
      coinId: c.id,
      symbol: c.symbol.toUpperCase(),
      name: c.name,
      score,
      volatility,
      volume,
      changePct: c.priceChangePercentage24h,
    };
  });

  const tiebreak = (sym: string) => hashString(`cc-cg-select:${dateStr}:${sym}`);
  scored.sort((a, b) => {
    if (Math.abs(a.score - b.score) < 0.01) {
      return tiebreak(b.symbol) - tiebreak(a.symbol);
    }
    return b.score - a.score;
  });

  return scored;
}

const ROTATION_POOL = 3;

/**
 * Select today's Market Mode coin from CoinGecko's broader pool.
 * Returns a CoinGecko coin id + display symbol, or null if the API is
 * unreachable (caller falls back to the Binance watchlist in market-selector.ts).
 */
export async function selectDailyCoin(
  dateStr: string = utcDateStr(),
): Promise<{ coinId: string; symbol: string; name: string } | null> {
  const coins = await fetchTopCoins();
  if (!coins) return null;
  const scored = scoreCoins(coins, dateStr);
  if (scored.length === 0) return null;
  const pool = scored.slice(0, Math.min(ROTATION_POOL, scored.length));
  const idx = hashString(`cc-cg-pick:${dateStr}`) % pool.length;
  const pick = pool[idx];
  return { coinId: pick.coinId, symbol: pick.symbol, name: pick.name };
}

// ---------------------------------------------------------------------------
// Derive playable terrain from a CoinGecko coin's 7d sparkline.
// The sparkline is REAL price data (7 days of hourly samples). We resample it
// into weekly candles the engine can consume. When the sparkline is absent or
// too short, we fall back to the synthetic generator (same as every other feed).
// ---------------------------------------------------------------------------

const MIN_SPARKLINE_POINTS = 50;

/**
 * Build Candle[] from a CoinGecko 7d sparkline (hourly price samples).
 * Groups the samples into ~7 candles (one per day) to match the weekly
 * interval shape the engine expects. Returns null when the sparkline is
 * too short or absent — the caller uses the synthetic fallback.
 */
export function sparklineToCandles(
  sparkline: number[] | undefined,
  dateStr: string = utcDateStr(),
): Candle[] | null {
  if (!sparkline || sparkline.length < MIN_SPARKLINE_POINTS) return null;
  const step = INTERVAL_MS_DAILY;
  const dayMs = 86_400_000;
  const samplesPerDay = Math.max(1, Math.floor(sparkline.length / 7));
  const out: Candle[] = [];
  const startT = Date.parse(dateStr + "T00:00:00Z") - 7 * dayMs;

  for (let d = 0; d < 7; d++) {
    const slice = sparkline.slice(d * samplesPerDay, (d + 1) * samplesPerDay);
    if (slice.length === 0) break;
    const o = slice[0];
    const c = slice[slice.length - 1];
    const h = Math.max(...slice);
    const l = Math.min(...slice);
    if (![o, h, l, c].every(Number.isFinite) || o <= 0) break;
    out.push({ t: startT + d * step, o, h, l, c });
  }
  return out.length >= 5 ? out : null;
}

const INTERVAL_MS_DAILY = 86_400_000;

/**
 * Fetch a CoinGecko coin's 7d sparkline and convert it to playable candles.
 * This is Market Mode's CoinGecko path: real price data → terrain.
 * Returns null on any failure (caller uses synthetic fallback).
 */
export async function fetchCoinGeckoCandles(coinId: string): Promise<Candle[] | null> {
  try {
    const params = new URLSearchParams({
      vs_currency: "usd",
      days: "7",
      interval: "hourly",
    });
    const url = `${COINGECKO_HOST}/api/v3/coins/${coinId}/market_chart?${params}`;
    const res = await fetch(url, {
      cache: "no-store",
      signal: AbortSignal.timeout(8000),
      headers: { accept: "application/json" },
    });
    if (!res.ok) {
      console.error("[coingecko]", "market_chart HTTP", res.status);
      return null;
    }
    const body = (await res.json()) as { prices?: [number, number][] };
    if (!body.prices || !Array.isArray(body.prices)) return null;
    const sparkline = body.prices.map((p) => p[1]).filter((v) => Number.isFinite(v) && v > 0);
    return sparklineToCandles(sparkline);
  } catch (err) {
    console.error("[coingecko]", "market_chart failed:", (err as Error).message);
    return null;
  }
}

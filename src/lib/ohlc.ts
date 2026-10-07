// Server-side read of ONE closed daily candle from Binance (E2.3 prediction scoring).
// Same host strategy as /api/candles (api.binance.com first — it geo-blocks some
// datacenter IPs — then the official mirror data-api.binance.vision). Returns the
// candle whose openTime is exactly the UTC midnight of `date`, i.e. a CLOSED
// candle only: today's in-progress daily candle never scores a prediction.
// Closed daily candles are immutable → the per-key cache never expires (bounded).
import { WATCHLIST } from "@/game/cc/level-source";
import type { DailyCandle } from "@/lib/prediction";

const HOSTS = ["https://api.binance.com", "https://data-api.binance.vision"];
const cache = new Map<string, DailyCandle | null>();
const CACHE_MAX = 5_000; // crude memory guard

function dayStartMs(date: string): number {
  return Date.parse(date + "T00:00:00Z");
}

/**
 * The closed 1d candle for (symbol, UTC date), or null when unavailable
 * (feed failure, non-whitelisted symbol, future/incomplete day).
 */
export async function fetchDailyCandle(symbol: string, date: string): Promise<DailyCandle | null> {
  if (!WATCHLIST.includes(symbol)) return null; // predictions target the daily rotation (crypto only)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return null;
  const key = `${symbol}|${date}`;
  if (cache.has(key)) return cache.get(key) ?? null;

  const start = dayStartMs(date);
  const end = start + 86_400_000 - 1;
  for (const host of HOSTS) {
    try {
      const url = `${host}/api/v3/klines?symbol=${symbol}&interval=1d&startTime=${start}&endTime=${end}&limit=2`;
      const res = await fetch(url, { cache: "no-store", signal: AbortSignal.timeout(8000) });
      if (!res.ok) {
        console.error("[ohlc]", host, "HTTP", res.status);
        continue;
      }
      const rows = (await res.json()) as unknown;
      if (!Array.isArray(rows)) continue;
      const row = (rows as (string | number)[]).find(
        (r) => Number(r?.[0]) === start && Number(r?.[6]) <= Date.now(),
      );
      if (!row) break; // day not closed yet (or no data) — do not retry other hosts
      const o = Number(row[1]);
      const h = Number(row[2]);
      const l = Number(row[3]);
      const c = Number(row[4]);
      if (![o, h, l, c].every(Number.isFinite) || o <= 0) break;
      const candle: DailyCandle = { o, h, l, c };
      if (cache.size > CACHE_MAX) cache.clear();
      cache.set(key, candle);
      return candle;
    } catch (err) {
      console.error("[ohlc]", host, "fetch failed:", (err as Error).message);
      continue;
    }
  }
  return null; // NOT cached — an unavailable feed must retry on the next scoring pass
}

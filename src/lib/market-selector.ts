// VOLATILITY-BASED DAILY SYMBOL SELECTION
// Instead of random rotation from a watchlist, this module fetches 24h ticker
// stats for all watchlist symbols and picks the one with the most interesting
// volatility/volume profile for that day's level.
//
// Selection is deterministic for a given UTC date: the scoring function uses
// the date as a tiebreaker, so every player worldwide sees the same chart.
// The result is cached for 24h (same as candle data).

import { hashString } from "@/game/cc/rng";

export interface TickerStat {
  symbol: string;
  priceChangePercent: number; // 24h change %
  quoteVolume: number; // 24h volume in quote asset
  highPrice: number;
  lowPrice: number;
  lastPrice: number;
}

export interface ScoredSymbol {
  symbol: string;
  score: number;
  volatility: number;
  volume: number;
  changePct: number;
}

// Score weights — higher volatility = more interesting terrain,
// higher volume = more liquid (preferred), extreme moves get a bonus.
const VOL_WEIGHT = 0.5;
const VOL_WEIGHT_SCALED = 0.3;
const CHANGE_BONUS = 0.2;

/**
 * Fetch 24h ticker stats for all watchlist symbols from Binance.
 * Single API call — /api/v3/ticker/24hr with symbols parameter.
 * Returns null on failure (caller falls back to random rotation).
 */
export async function fetchTickerStats(symbols: string[]): Promise<TickerStat[] | null> {
  if (symbols.length === 0) return null;
  // Binance accepts symbols as a JSON array in the query string
  const symbolsParam = JSON.stringify(symbols);
  const hosts = [
    "https://api.binance.com",
    "https://data-api.binance.vision",
  ];
  for (const host of hosts) {
    try {
      const url = `${host}/api/v3/ticker/24hr?symbols=${encodeURIComponent(symbolsParam)}`;
      const res = await fetch(url, {
        cache: "no-store",
        signal: AbortSignal.timeout(8000),
      });
      if (!res.ok) continue;
      const data = await res.json();
      if (!Array.isArray(data)) continue;
      return data.map((d: Record<string, string>) => ({
        symbol: d.symbol,
        priceChangePercent: parseFloat(d.priceChangePercent) || 0,
        quoteVolume: parseFloat(d.quoteVolume) || 0,
        highPrice: parseFloat(d.highPrice) || 0,
        lowPrice: parseFloat(d.lowPrice) || 0,
        lastPrice: parseFloat(d.lastPrice) || 0,
      }));
    } catch {
      continue;
    }
  }
  return null;
}

/**
 * Score each symbol by how interesting its market conditions are for gameplay.
 * We want: moderate-to-high volatility (interesting terrain), decent volume
 * (real market), and a directional bias (up or down — flat is boring desert).
 *
 * Scoring is deterministic for a given date: ties are broken by the date's
 * hash so the same date always picks the same symbol.
 */
export function scoreSymbols(stats: TickerStat[], dateStr: string): ScoredSymbol[] {
  // Normalize volume across candidates (0..1)
  const maxVol = Math.max(...stats.map((s) => s.quoteVolume), 1);

  const scored = stats.map((s) => {
    // Volatility proxy: |24h change %| — higher = more interesting terrain
    const changePct = Math.abs(s.priceChangePercent);
    // Range ratio: (high - low) / last — another volatility measure
    const rangeRatio = s.lastPrice > 0 ? (s.highPrice - s.lowPrice) / s.lastPrice : 0;
    // Combined volatility score (normalized 0..1, clamped)
    const volatility = Math.min(1, (changePct / 15 + rangeRatio / 0.1) / 2);
    // Volume score (normalized 0..1)
    const volume = s.quoteVolume / maxVol;
    // Directional bonus: extreme moves (>5% up or down) get a boost
    const directionalBonus = changePct > 5 ? CHANGE_BONUS : 0;

    // Final score: weighted combination
    const score = volatility * VOL_WEIGHT + volume * VOL_WEIGHT_SCALED + directionalBonus;

    return {
      symbol: s.symbol,
      score,
      volatility,
      volume,
      changePct: s.priceChangePercent,
    };
  });

  // Sort by score descending; tiebreaker is deterministic via date hash
  const tiebreak = (sym: string) => hashString(`cc-select:${dateStr}:${sym}`);
  scored.sort((a, b) => {
    if (Math.abs(a.score - b.score) < 0.01) {
      return tiebreak(b.symbol) - tiebreak(a.symbol);
    }
    return b.score - a.score;
  });

  return scored;
}

/**
 * Select today's symbol based on market volatility/volume.
 * Returns the winning symbol, or null if stats couldn't be fetched
 * (caller falls back to the legacy random rotation).
 */
export async function selectDailySymbol(
  watchlist: string[],
  dateStr: string,
): Promise<string | null> {
  const stats = await fetchTickerStats(watchlist);
  if (!stats || stats.length === 0) return null;
  const scored = scoreSymbols(stats, dateStr);
  return scored[0]?.symbol ?? null;
}

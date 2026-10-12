/// <reference types="bun-types" />
// Two-mode update (base44 sandbox rescue 2026-10-12) — pins for the NEW pure
// functions the Market/Launchpad modes are built from. No network: every
// fixture is generated locally, mirroring the real payload shapes.
//
// What these pins protect:
//  - market-selector v2 scoring: volatility PRIMARY, volume LOG-scaled (the
//    owner's BTC-monotony fix) + top-3 pool pick — deterministic per date.
//  - coingecko client: stablecoin exclusion + sparkline→daily candles shape.
//  - launchpad-indexer: eligibility threshold, most-active aggregation,
//    deterministic (token, date) terrain with bounded length.
import { describe, test, expect } from "bun:test";
import { scoreSymbols, type TickerStat } from "@/lib/market-selector";
import { scoreCoins, sparklineToCandles, type CoinMarket } from "@/lib/coingecko";
import {
  aggregateActivity,
  launchpadCandles,
  MIN_TRADE_COUNT,
  type TradeEvent,
} from "@/lib/launchpad-indexer";

const DATE = "2026-10-12";

/* ---------------------------- market-selector v2 ------------------------- */

function stat(symbol: string, changePct: number, quoteVolume: number, hiLoPct = 4): TickerStat {
  const lastPrice = 100;
  return {
    symbol,
    priceChangePercent: changePct,
    quoteVolume,
    highPrice: lastPrice * (1 + hiLoPct / 200),
    lowPrice: lastPrice * (1 - hiLoPct / 200),
    lastPrice,
  };
}

describe("market-selector v2 — the anti-BTC-monotony condition", () => {
  test("log-scaled volume: 10x raw volume no longer outranks 2x volatility", () => {
    // BTC-like: huge volume, tame chart. Small cap: modest volume, wild chart.
    const stats = [
      stat("BTCUSDT", 1.2, 50_000_000_000),
      stat("PEPEUSDT", 9.0, 900_000_000, 14),
    ];
    const dayA = scoreSymbols(stats, DATE);
    const dayB = scoreSymbols(stats, "2026-10-13");
    const pepe = dayA.find((s) => s.symbol === "PEPEUSDT")!;
    const btc = dayA.find((s) => s.symbol === "BTCUSDT")!;
    expect(pepe.score).toBeGreaterThan(btc.score);
    // determinism: same date -> same order, different date -> same scores
    expect(dayA.map((s) => s.symbol)).toEqual(dayB.map((s) => s.symbol));
    expect(dayA[0].score).toBe(dayB[0].score);
  });

  test("score order is stable per date and the pool excludes the bottom scorer", () => {
    const stats = ["AAAUSDT", "BBBUSDT", "CCCUSDT", "DDDUSDT"].map((s, i) =>
      stat(s, 9 - i, 1_000_000_000 - i * 100_000_000),
    );
    for (let d = 0; d < 30; d++) {
      const day = new Date(Date.parse(DATE + "T00:00:00Z") + d * 86_400_000)
        .toISOString().slice(0, 10);
      const scored = scoreSymbols(stats, day);
      // the ROTATION_POOL (top-3) that selectDailySymbol draws from = the three
      // highest scorers; ties inside 0.01 are broken by the date hash only
      // INSIDE the band, so a clear-score ordering must never reshuffle.
      const top3 = scored.slice(0, 3).map((s) => s.symbol).sort();
      expect(top3).toEqual(["AAAUSDT", "BBBUSDT", "CCCUSDT"]);
      expect(scored[3].symbol).toBe("DDDUSDT");
    }
  });
});

/* ------------------------------- coingecko ------------------------------- */

function coin(id: string, symbol: string, changePct: number, volume: number): CoinMarket {
  return {
    id,
    symbol,
    name: id,
    currentPrice: 2.5,
    marketCap: 1e9,
    totalVolume: volume,
    priceChange24h: changePct,
    priceChangePercentage24h: changePct,
    high24h: 2.75,
    low24h: 2.25,
  };
}

describe("coingecko client — pure scoring + sparkline terrain", () => {
  test("stablecoins never enter the scoring pool", () => {
    const scored = scoreCoins(
      [coin("tether", "USDT", 0.01, 9e9), coin("dai", "DAI", 0.02, 5e8),
       coin("solana", "SOL", 7.5, 2e9)],
      DATE,
    );
    expect(scored.map((c) => c.symbol)).toEqual(["SOL"]);
  });

  test("168-sample 7d sparkline becomes 7 daily candles; short input is rejected", () => {
    const spark: number[] = [];
    for (let i = 0; i < 168; i++) spark.push(100 + i * 0.5 + (i % 7) * 0.1);
    const out = sparklineToCandles(spark, DATE);
    expect(out).not.toBeNull();
    expect(out!.length).toBe(7);
    for (const c of out!) {
      expect(c.h).toBeGreaterThanOrEqual(c.o);
      expect(c.h).toBeGreaterThanOrEqual(c.c);
      expect(c.l).toBeLessThanOrEqual(c.o);
      expect(c.l).toBeLessThanOrEqual(c.c);
    }
    // daily spacing
    expect(out![1].t - out![0].t).toBe(86_400_000);
    expect(sparklineToCandles(spark.slice(0, 20), DATE)).toBeNull();
    expect(sparklineToCandles(undefined, DATE)).toBeNull();
  });
});

/* --------------------------- launchpad-indexer --------------------------- */

function trade(type: "buy" | "sell", token: string, amountEth: number, costEth: number): TradeEvent {
  const W = 10n ** 18n;
  return {
    type,
    amount: BigInt(Math.round(amountEth)) * W,
    cost: BigInt(Math.round(costEth)) * W,
    token,
    blockNumber: 1,
    txHash: "0xdead",
  };
}

describe("launchpad-indexer — eligibility, aggregation, deterministic terrain", () => {
  const TOKEN_A = "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";
  const TOKEN_B = "0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb";

  test("activity threshold: under MIN_TRADE_COUNT is ineligible, over is eligible", () => {
    const quiet = Array.from({ length: MIN_TRADE_COUNT - 1 }, () => trade("buy", TOKEN_A, 5, 1));
    const quietAgg = aggregateActivity(quiet)!;
    expect(quietAgg.eligible).toBe(false);
    const busy = [...quiet, trade("buy", TOKEN_A, 5, 1)];
    const busyAgg = aggregateActivity(busy)!;
    expect(busyAgg.eligible).toBe(true);
    expect(busyAgg.buyCount).toBe(MIN_TRADE_COUNT);
    expect(busyAgg.sellCount).toBe(0);
  });

  test("most-active token wins aggregation; netFlow = buys - sells", () => {
    const events = [
      ...Array.from({ length: 14 }, () => trade("buy", TOKEN_A, 4, 1)),
      ...Array.from({ length: 4 }, () => trade("sell", TOKEN_A, 1, 1)),
      ...Array.from({ length: 3 }, () => trade("buy", TOKEN_B, 9, 9)),
    ];
    const agg = aggregateActivity(events, "TEST")!;
    expect(agg.token).toBe(TOKEN_A);
    expect(agg.netFlow).toBe((14n * 4n - 4n) * 10n ** 18n); // 14 buys of 4 minus 4 sells of 1
    expect(agg.eligible).toBe(true);
  });

  test("terrain is a pure function of (token, date): same seed identical, date flips it", () => {
    const agg = aggregateActivity(
      Array.from({ length: 40 }, (_, i) => trade(i % 3 === 0 ? "sell" : "buy", TOKEN_A, 6, 2)),
    )!;
    const t1 = launchpadCandles(agg, DATE);
    const t2 = launchpadCandles(agg, DATE);
    const t3 = launchpadCandles(agg, "2026-10-13");
    expect(JSON.stringify(t1)).toBe(JSON.stringify(t2));
    expect(JSON.stringify(t1)).not.toBe(JSON.stringify(t3));
    // length bounds: 60 + events, clamped to [60, 219]
    expect(t1.length).toBeGreaterThanOrEqual(60);
    expect(t1.length).toBeLessThanOrEqual(219);
    // OHLC sanity on every candle
    for (const c of t1) {
      expect(c.h).toBeGreaterThanOrEqual(Math.max(c.o, c.c));
      expect(c.l).toBeLessThanOrEqual(Math.min(c.o, c.c));
      expect(c.c).toBeGreaterThan(0);
    }
  });
});

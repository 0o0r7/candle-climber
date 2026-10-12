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
import {
  scoreCoins,
  sparklineToCandles,
  pricesToClosedDayCandles,
  utcDayStart,
  type CoinMarket,
} from "@/lib/coingecko";
import {
  aggregateActivity,
  launchpadCandles,
  MIN_TRADE_COUNT,
  type TradeEvent,
} from "@/lib/launchpad-indexer";
import {
  WATCHLIST,
  STOCKS,
  cryptoRotation,
  stocksRotation,
} from "@/game/cc/level-source";

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

/* ----------------- 3-mode pools (council 2026-10-12, ruling B) ----------------- */

describe("per-pool rotations — CRYPTO and STOCKS never leak into each other", () => {
  test("each pool rotates only its own symbols, deterministically", () => {
    for (let d = 0; d < 30; d++) {
      const date = new Date(Date.parse(DATE + "T00:00:00Z") + d * 86_400_000)
        .toISOString()
        .slice(0, 10);
      expect(WATCHLIST).toContain(cryptoRotation(date));
      expect(STOCKS).toContain(stocksRotation(date));
      // determinism: same date, same pick — server, client and offline fallback agree
      expect(cryptoRotation(date)).toBe(cryptoRotation(date));
      expect(stocksRotation(date)).toBe(stocksRotation(date));
    }
  });

  test("no consecutive-day repeats inside a pool (the anti-replay guarantee)", () => {
    for (let d = 0; d < 29; d++) {
      const a = new Date(Date.parse(DATE + "T00:00:00Z") + d * 86_400_000).toISOString().slice(0, 10);
      const b = new Date(Date.parse(DATE + "T00:00:00Z") + (d + 1) * 86_400_000).toISOString().slice(0, 10);
      expect(stocksRotation(b)).not.toBe(stocksRotation(a));
      expect(cryptoRotation(b)).not.toBe(cryptoRotation(a));
    }
  });

  test("every pool member serves within one cycle (equity rails all reachable)", () => {
    const seenStocks = new Set<string>();
    for (let d = 0; d < STOCKS.length; d++) {
      const date = new Date(Date.parse(DATE + "T00:00:00Z") + d * 86_400_000).toISOString().slice(0, 10);
      seenStocks.add(stocksRotation(date));
    }
    expect(seenStocks.size).toBe(STOCKS.length);
  });
});

/* ------------------- P4-2: CoinGecko closed-day determinism ------------------- */

describe("pricesToClosedDayCandles — terrain can no longer move within its day", () => {
  // Build 6 CLOSED days + a partial 7th (today): hourly samples ending mid-day.
  const NOW = Date.parse("2026-10-12T15:04:05Z");
  const todayStart = utcDayStart(NOW);
  function samplePrices(): [number, number][] {
    const out: [number, number][] = [];
    for (let day = 6; day >= 1; day--) {
      const start = todayStart - day * 86_400_000;
      for (let h = 0; h < 24; h++) {
        out.push([start + h * 3_600_000, 100 + (6 - day) * 10 + h * 0.5]);
      }
    }
    // today's partial data — MUST be dropped
    for (let h = 0; h <= 15; h++) {
      out.push([todayStart + h * 3_600_000, 999 + h]);
    }
    return out;
  }

  test("drops the in-progress day; every surviving candle is a CLOSED UTC day", () => {
    const out = pricesToClosedDayCandles(samplePrices(), NOW);
    expect(out).not.toBeNull();
    expect(out!.length).toBe(6);
    for (const c of out!) {
      expect(c.t).toBeLessThan(todayStart);
      expect(c.t % 86_400_000).toBe(0);
      // today's 999+ prices never leak in
      expect(Math.max(c.h, c.o, c.c, c.l)).toBeLessThan(999);
    }
    // OHLC sanity
    for (const c of out!) {
      expect(c.h).toBeGreaterThanOrEqual(c.o);
      expect(c.h).toBeGreaterThanOrEqual(c.c);
      expect(c.l).toBeLessThanOrEqual(c.o);
      expect(c.l).toBeLessThanOrEqual(c.c);
    }
  });

  test("byte-identical across restarts: any `now` within the same day → same terrain", () => {
    const morning = pricesToClosedDayCandles(samplePrices(), Date.parse("2026-10-12T00:00:01Z"));
    const evening = pricesToClosedDayCandles(samplePrices(), Date.parse("2026-10-12T23:59:59Z"));
    expect(JSON.stringify(morning)).toBe(JSON.stringify(evening));
  });

  test("fewer than 5 closed days → null (feed failure path, like every other rail)", () => {
    const NOW2 = Date.parse("2026-10-12T12:00:00Z");
    const start = utcDayStart(NOW2);
    const thin: [number, number][] = [];
    for (let day = 3; day >= 1; day--) {
      for (let h = 0; h < 24; h++) thin.push([start - day * 86_400_000 + h * 3_600_000, 50 + h]);
    }
    expect(pricesToClosedDayCandles(thin, NOW2)).toBeNull();
  });

  test("garbage samples are skipped, not fatal", () => {
    const NOW2 = Date.parse("2026-10-12T12:00:00Z");
    const start = utcDayStart(NOW2);
    const noisy: [number, number][] = [
      [NaN, 100],
      [start - 86_400_000, -5], // non-positive price
      [start - 3_600_000, 5], // today — dropped anyway
    ];
    for (let day = 6; day >= 1; day--) {
      for (let h = 0; h < 24; h++) noisy.push([start - day * 86_400_000 + h * 3_600_000, 100 + h]);
    }
    const out = pricesToClosedDayCandles(noisy, NOW2);
    expect(out).not.toBeNull();
    expect(out!.length).toBe(6);
  });
});

/* --------------- P3-1 RESOLVED: real curve event parsing ----------------
 * The live-log test (2026-10-12) disproved the old topic-3 ABI assumption
 * and captured REAL events from launch "Trust Me Bro" (curve
 * 0x7ddb4a8b…, chain 46630). These fixtures are byte-for-byte the live
 * logs — they pin the parser to the WIRE, not to a guessed ABI. */
import { parseTradeEvent } from "@/lib/launchpad-indexer";

const TOKEN = "0x2a4476685c4a01716c3a68acd9f94fdb45162733";

describe("parseTradeEvent — verified against live captured logs", () => {
  // Captured live 2026-10-12, block 133461814: a quoted-pair CurveBuy.
  const LIVE_CURVE_BUY = {
    topics: [
      "0x55867fe9a84ea30ad247ef1bb703eba47fd9af476149002512a2814b1e3d8fb5",
      "0x0000000000000000000000002784448c519d01d3ae257c0aac0b7cdad8acceb1",
      "0x000000000000000000000000e60b8924984feaf245aa4d80839c5b2c771eeac2",
    ],
    data:
      "0x" +
      (235548239728706535784115795n).toString(16).padStart(64, "0") +
      (232533222260179092126079113n).toString(16).padStart(64, "0") +
      (3015017468527443658036682n).toString(16).padStart(64, "0") +
      (2446230996686973695897n).toString(16).padStart(64, "0") +
      (17612863176146210610n).toString(16).padStart(64, "0") +
      (200n).toString(16).padStart(64, "0"),
    blockNumber: "0x7f4a86",
    transactionHash: "0xdead",
  };

  test("live CurveBuy decodes to (amount=grossTokens, cost=pairCost)", () => {
    const ev = parseTradeEvent(LIVE_CURVE_BUY, TOKEN);
    expect(ev).not.toBeNull();
    expect(ev!.type).toBe("buy");
    expect(ev!.amount).toBe(235548239728706535784115795n);
    expect(ev!.cost).toBe(2446230996686973695897n);
    expect(ev!.token).toBe(TOKEN);
  });

  test("unknown topic0 → null (never a fabricated trade)", () => {
    const ev = parseTradeEvent({ ...LIVE_CURVE_BUY, topics: ["0x" + "ab".repeat(32), ...LIVE_CURVE_BUY.topics.slice(1)] }, TOKEN);
    expect(ev).toBeNull();
  });

  test("truncated data → null (word() refuses a partial word)", () => {
    const ev = parseTradeEvent({ ...LIVE_CURVE_BUY, data: "0x" + "11".repeat(40) }, TOKEN);
    expect(ev).toBeNull();
  });

  test("quoted CurveSell shape decodes (amount, pairProceeds)", () => {
    const sell = {
      topics: [
        "0x3899b2b9ba4dfe77b54ff5e6f921672b2a7563ade468f2a106b25a4b808d60de",
        "0x0000000000000000000000002784448c519d01d3ae257c0aac0b7cdad8acceb1",
        "0x0000000000000000000000002784448c519d01d3ae257c0aac0b7cdad8acceb1",
      ],
      data:
        "0x" +
        (1000n).toString(16).padStart(64, "0") +
        (900n).toString(16).padStart(64, "0") +
        (100n).toString(16).padStart(64, "0") +
        (5n).toString(16).padStart(64, "0") +
        (1n).toString(16).padStart(64, "0"),
      blockNumber: "0x1",
      transactionHash: "0xdead",
    };
    const ev = parseTradeEvent(sell, TOKEN);
    expect(ev!.type).toBe("sell");
    expect(ev!.amount).toBe(1000n);
    expect(ev!.cost).toBe(5n);
  });

  test("ETH-pair Bought/Sold families decode (tokenAmount ↔ ethUsed/ethReceived)", () => {
    const bought = {
      topics: [
        "0x8a5254432535d4192429d2cc163283a57784eac274295fcda17cc659c1ee414c",
        "0x0000000000000000000000002784448c519d01d3ae257c0aac0b7cdad8acceb1",
        "0x0000000000000000000000002784448c519d01d3ae257c0aac0b7cdad8acceb1",
      ],
      data:
        "0x" +
        (10n ** 18n).toString(16).padStart(64, "0") + // grossEthUsed
        (0n).toString(16).padStart(64, "0") + // curveQuote
        (500n).toString(16).padStart(64, "0") + // tokenAmount
        (0n).toString(16).padStart(64, "0") +
        (0n).toString(16).padStart(64, "0"),
      blockNumber: "0x1",
      transactionHash: "0xdead",
    };
    const ev = parseTradeEvent(bought, TOKEN);
    expect(ev!.type).toBe("buy");
    expect(ev!.amount).toBe(500n);
    expect(ev!.cost).toBe(10n ** 18n);

    const sold = {
      topics: [
        "0x917d0fe1b6c3328f12a0177d25bf1b7d9e963116addad0bfc06b0cdcb6427603",
        "0x0000000000000000000000002784448c519d01d3ae257c0aac0b7cdad8acceb1",
      ],
      data:
        "0x" +
        (300n).toString(16).padStart(64, "0") + // tokenAmount
        (0n).toString(16).padStart(64, "0") +
        (4n).toString(16).padStart(64, "0") + // ethReceived
        (0n).toString(16).padStart(64, "0") +
        (0n).toString(16).padStart(64, "0"),
      blockNumber: "0x1",
      transactionHash: "0xdead",
    };
    const ev2 = parseTradeEvent(sold, TOKEN);
    expect(ev2!.type).toBe("sell");
    expect(ev2!.amount).toBe(300n);
    expect(ev2!.cost).toBe(4n);
  });
});

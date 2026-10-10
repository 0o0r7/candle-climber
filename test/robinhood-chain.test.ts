/// <reference types="bun-types" />
// W6 official-Robinhood-Chain contract tests (bun test, zero deps, ZERO
// network — fixtures only; no RPC or directory is ever contacted here).
//
//  - src/lib/robinhood-chain.ts: the ABI decoders and the honesty gate
//    (validateRoundData). Fixtures are the EXACT eth_call payloads captured
//    live from mainnet (chain 4663) on 2026-10-07 — see
//    docs/ROBINHOOD-CHAIN-INTEGRATION.md for the raw evidence.
//  - src/game/cc/level-source.ts anchoredCandles: the derived-shape /
//    official-anchor terrain used when no OHLC feed can serve a stock.
import { describe, test, expect } from "bun:test";
import {
  decodeAbiString,
  decodeDecimals,
  decodeInt256,
  decodeLatestRoundData,
  feedSymbolFromName,
  priceFromAnswer,
  validateRoundData,
  wordAt,
  VERIFIED_STOCK_FEEDS,
  TESTNET_FAUCET_TOKENS,
  MAX_QUOTE_AGE_SEC,
  ROBINHOOD_MAINNET,
  ROBINHOOD_TESTNET,
} from "@/lib/robinhood-chain";
import { anchoredCandles } from "@/game/cc/level-source";
import { signRunToken, verifyRunToken } from "@/lib/run-token";

/* ------------------- exact live eth_call payloads (2026-10-07) ------------- */

// Robinhood TSLA / USD feed 0x7A6b81ba7FbCB90104d8C496158Cf383cD7233b1
const TSLA_ROUND =
  "0x00000000000000000000000000000000000000000000000000000000000005c0" +
  "00000000000000000000000000000000000000000000000000000008c31a0240" +
  "000000000000000000000000000000000000000000000000000000006ac65160" +
  "000000000000000000000000000000000000000000000000000000006ac6516c" +
  "00000000000000000000000000000000000000000000000000000000000005c0";

// Robinhood AMZN / USD feed 0x93503dFc97157cdB8aADcCaf70452621d598FDeb
const AMZN_ROUND =
  "0x000000000000000000000000000000000000000000000000000000000000037d" +
  "00000000000000000000000000000000000000000000000000000006096de200" +
  "000000000000000000000000000000000000000000000000000000006ac67130" +
  "000000000000000000000000000000000000000000000000000000006ac6713c" +
  "000000000000000000000000000000000000000000000000000000000000037d";

// decimals() — both feeds report 8.
const EIGHT_DECIMALS = "0x0000000000000000000000000000000000000000000000000000000000000008";

// symbol() on the TESTNET faucet TSLA token (chain 46630) → "TSLA"
const TESTNET_TSLA_SYMBOL =
  "0x0000000000000000000000000000000000000000000000000000000000000020" +
  "0000000000000000000000000000000000000000000000000000000000000004" +
  "54534c4100000000000000000000000000000000000000000000000000000000";

// symbol() on the MAINNET AMZN token → "AMZN"
const MAINNET_AMZN_SYMBOL =
  "0x0000000000000000000000000000000000000000000000000000000000000020" +
  "0000000000000000000000000000000000000000000000000000000000000004" +
  "414d5a4e00000000000000000000000000000000000000000000000000000000";

describe("robinhood-chain — networks & registries", () => {
  test("network ids match the official docs", () => {
    expect(ROBINHOOD_MAINNET.chainId).toBe(4663);
    expect(ROBINHOOD_TESTNET.chainId).toBe(46630);
    expect(ROBINHOOD_MAINNET.rpc).toBe("https://rpc.mainnet.chain.robinhood.com");
    expect(ROBINHOOD_TESTNET.rpc).toBe("https://rpc.testnet.chain.robinhood.com");
  });

  test("testnet faucet tokens are a DIFFERENT contract set from the mainnet feeds", () => {
    // The whole point of W6: ecosystem/faucet testnet tokens must never be
    // mistaken for the canonical set the mainnet feeds price.
    for (const sym of Object.keys(TESTNET_FAUCET_TOKENS)) {
      const feed = VERIFIED_STOCK_FEEDS[sym];
      if (feed) expect(feed.toLowerCase()).not.toBe(TESTNET_FAUCET_TOKENS[sym].toLowerCase());
    }
    expect(TESTNET_FAUCET_TOKENS.TSLA).not.toBe(VERIFIED_STOCK_FEEDS.TSLA);
  });

  test("every registered address is a well-formed address", () => {
    for (const a of [...Object.values(VERIFIED_STOCK_FEEDS), ...Object.values(TESTNET_FAUCET_TOKENS)]) {
      expect(a).toMatch(/^0x[0-9a-fA-F]{40}$/);
    }
  });
});

describe("robinhood-chain — ABI decoding", () => {
  test("wordAt returns the i-th word and rejects short payloads", () => {
    expect(wordAt(TSLA_ROUND, 0)).toBe("00000000000000000000000000000000000000000000000000000000000005c0");
    expect(wordAt(TSLA_ROUND, 4)).toBe("00000000000000000000000000000000000000000000000000000000000005c0");
    expect(wordAt(TSLA_ROUND, 5)).toBeNull();
    expect(wordAt("0xdead", 0)).toBeNull();
  });

  test("decodeLatestRoundData on the live TSLA payload", () => {
    const rd = decodeLatestRoundData(TSLA_ROUND);
    expect(rd).not.toBeNull();
    expect(rd!.roundId).toBe(1472n);
    expect(rd!.answer).toBe(37_633_000_000n);
    expect(rd!.startedAt).toBe(1_791_381_856);
    expect(rd!.updatedAt).toBe(1_791_381_868);
  });

  test("decodeLatestRoundData on the live AMZN payload", () => {
    const rd = decodeLatestRoundData(AMZN_ROUND);
    expect(rd!.roundId).toBe(893n);
    expect(rd!.answer).toBe(25_928_000_000n);
    expect(rd!.startedAt).toBe(1_791_390_000);
    expect(rd!.updatedAt).toBe(1_791_390_012);
  });

  test("decodeLatestRoundData returns null on malformed input", () => {
    expect(decodeLatestRoundData("0x")).toBeNull();
    expect(decodeLatestRoundData("0x1234")).toBeNull();
  });

  test("decodeInt256 handles two's complement", () => {
    const minusOne = "f".repeat(64);
    expect(decodeInt256(minusOne)).toBe(-1n);
    expect(decodeInt256("0".repeat(64))).toBe(0n);
  });

  test("decodeDecimals reads the on-chain value and range-checks it", () => {
    expect(decodeDecimals(EIGHT_DECIMALS)).toBe(8);
    // 37 decimals is not a plausible feed precision -> rejected, never assumed.
    expect(decodeDecimals("0x" + (37).toString(16).padStart(64, "0"))).toBeNull();
    expect(decodeDecimals("0x00")).toBeNull();
  });

  test("priceFromAnswer scales with the feed's own decimals", () => {
    expect(priceFromAnswer(37_633_000_000n, 8)).toBeCloseTo(376.33, 2);
    expect(priceFromAnswer(25_928_000_000n, 8)).toBeCloseTo(259.28, 2);
    expect(priceFromAnswer(30_000_000_000n, 8)).toBe(300);
  });

  test("decodeAbiString decodes token symbols", () => {
    expect(decodeAbiString(TESTNET_TSLA_SYMBOL)).toBe("TSLA");
    expect(decodeAbiString(MAINNET_AMZN_SYMBOL)).toBe("AMZN");
    expect(decodeAbiString("0x")).toBeNull();
  });
});

describe("robinhood-chain — the honesty gate", () => {
  const chain = ROBINHOOD_MAINNET.chainId;
  const fresh = { roundId: 1472n, answer: 37_633_000_000n, startedAt: 1_791_381_856, updatedAt: 1_791_381_868 };
  const NOW = 1_791_382_000; // ~2 minutes after the captured round

  test("accepts a fresh, positive, complete round on the expected chain", () => {
    const v = validateRoundData(fresh, { expectedChainId: chain, chainId: chain, now: NOW });
    expect(v.ok).toBe(true);
    if (v.ok) {
      expect(v.stale).toBe(false);
      expect(v.ageSec).toBe(132);
    }
  });

  test("rejects a chain mismatch (never trusts a foreign chain's feed)", () => {
    const v = validateRoundData(fresh, { expectedChainId: chain, chainId: ROBINHOOD_TESTNET.chainId, now: NOW });
    expect(v.ok).toBe(false);
  });

  test("rejects a non-positive answer instead of publishing a zero price", () => {
    const v = validateRoundData({ ...fresh, answer: 0n }, { expectedChainId: chain, chainId: chain, now: NOW });
    expect(v.ok).toBe(false);
  });

  test("rejects an incomplete round", () => {
    const v = validateRoundData({ ...fresh, updatedAt: 0 }, { expectedChainId: chain, chainId: chain, now: NOW });
    expect(v.ok).toBe(false);
  });

  test("marks a quote stale past the bound BUT still returns its age", () => {
    const old = { ...fresh, updatedAt: NOW - MAX_QUOTE_AGE_SEC - 1 };
    const v = validateRoundData(old, { expectedChainId: chain, chainId: chain, now: NOW });
    expect(v.ok).toBe(true);
    if (v.ok) {
      expect(v.stale).toBe(true);
      expect(v.ageSec).toBe(MAX_QUOTE_AGE_SEC + 1);
    }
  });

  test("tolerates a closed equity market inside the bound (24/5 feeds hold)", () => {
    // A long weekend/holiday must not be mistaken for a dead feed.
    const weekend = { ...fresh, updatedAt: NOW - 3 * 24 * 60 * 60 };
    const v = validateRoundData(weekend, { expectedChainId: chain, chainId: chain, now: NOW });
    expect(v.ok && v.stale).toBe(false);
    expect(MAX_QUOTE_AGE_SEC).toBeGreaterThanOrEqual(4 * 24 * 60 * 60);
  });

  test("rejects a future timestamp", () => {
    const v = validateRoundData({ ...fresh, updatedAt: NOW + 3600 }, { expectedChainId: chain, chainId: chain, now: NOW });
    expect(v.ok).toBe(false);
  });
});

describe("robinhood-chain — directory feed naming", () => {
  test("maps directory entries to their ticker", () => {
    expect(feedSymbolFromName("Robinhood TSLA / USD")).toBe("TSLA");
    expect(feedSymbolFromName("Robinhood NVDA / USD")).toBe("NVDA");
    expect(feedSymbolFromName("Robinhood SGOV-USD")).toBe("SGOV");
    expect(feedSymbolFromName("Robinhood USAR-USD")).toBe("USAR");
  });

  test("ignores non-stock and exchange-rate entries", () => {
    expect(feedSymbolFromName("BTC / USD")).toBeNull();
    expect(feedSymbolFromName("Robinhood SYRUPUSDC / USDC Exchange Rate")).toBeNull();
    expect(feedSymbolFromName("")).toBeNull();
  });
});

describe("level-source — official-anchor terrain (W6)", () => {
  test("anchoredCandles ends exactly on the official on-chain price", () => {
    const out = anchoredCandles("2026-10-07", 40, 376.33);
    expect(out).toHaveLength(40);
    expect(out[out.length - 1].c).toBeCloseTo(376.33, 6);
    // shape is preserved (OHLC ordering intact after scaling)
    for (const c of out) {
      expect(c.h).toBeGreaterThanOrEqual(Math.max(c.o, c.c));
      expect(c.l).toBeLessThanOrEqual(Math.min(c.o, c.c));
      expect(c.c).toBeGreaterThan(0);
    }
  });

  test("anchoredCandles is deterministic per date and rejects a bad anchor", () => {
    const a = anchoredCandles("2026-10-07", 12, 100);
    const b = anchoredCandles("2026-10-07", 12, 100);
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
    // a nonsense anchor falls back to the unanchored shape rather than NaN
    const bad = anchoredCandles("2026-10-07", 12, 0);
    expect(bad.every((c) => Number.isFinite(c.c))).toBe(true);
  });

  // F1 (2026-10-10, owner-delegated decision): the anchored "robinhood" terrain
  // stays SCOREABLE — the candles route's pre-existing non-synthetic run-token
  // gate covers it (vibe-launch precedent: derived-but-real feeds are
  // scoreable; UI says ON-CHAIN, never "live data"). This pins the lib side of
  // that contract: a token signed over the exact anchored shape verifies, and
  // the token lib carries no source discrimination.
  test("F1: anchored terrain is scoreable — run-token contract accepts it end-to-end", () => {
    const saved = process.env.RUN_TOKEN_SECRET;
    process.env.RUN_TOKEN_SECRET = "f1-pin-secret";
    try {
      const candles = anchoredCandles("2026-10-07", 220, 376.33);
      const candleJson = JSON.stringify(candles);
      const token = signRunToken("TSLA", "2026-10-07", candles.length, candleJson, "1w");
      expect(typeof token).toBe("string");
      expect(token.includes(".")).toBe(true);
      // roundtrip on the identical payload (what the leaderboard does)
      expect(verifyRunToken(token)).not.toBeNull();
      // a flipped signature char is rejected (the anti-cheat core)
      const forged = token.replace(/.$/, (ch) => (ch === "A" ? "B" : "A"));
      expect(forged).not.toBe(token);
      expect(verifyRunToken(forged)).toBeNull();
      // and the anchored terrain itself is anchor-sensitive (not a fixed shape)
      expect(JSON.stringify(anchoredCandles("2026-10-07", 220, 376.34))).not.toBe(candleJson);
    } finally {
      if (saved === undefined) delete process.env.RUN_TOKEN_SECRET;
      else process.env.RUN_TOKEN_SECRET = saved;
    }
  });
});

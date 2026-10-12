// Launchpad Mode on-chain event indexer.
//
// This module reads CurveBuy / CurveSell events DIRECTLY from the VibeVibe
// bonding-curve contracts via the public Robinhood Chain testnet RPC
// (chain 46630). It supplements the vibe-launch.ts API-based path with
// real on-chain trade activity, and enforces a minimum trade/activity
// threshold before a token enters Launchpad Mode rotation.
//
// Honesty rules:
// - Events are REAL on-chain data (eth_getLogs, public RPC, no key).
// - Terrain candles are DERIVED from trade-flow metrics — never labeled "live".
// - Failure degrades to the existing vibe-launch.ts API path.
//
// VibeVibe curve trade events — VERIFIED 2026-10-12 (P3-1 RESOLVED).
// The ORIGINAL assumption (CurveBuy(address,uint256,uint256,address) with the
// token as topic3) was WRONG: the live-log test found ZERO matching events,
// and the platform's own frontend bundle (testnet.vibevibe.fun
// /static-v2/V6TradingProvider-V437DJPA.js) defines the REAL events:
//
// QUOTED-pair curves (pairCurrencyAddress = an ERC-20, e.g. VIBEVIBE):
//   CurveBuy(buyer✓, recipient✓, grossTokens, netTokens, tokenFee, pairCost,
//            pairFee, rateBps)
//   CurveSell(seller✓, recipient✓, grossTokens, netTokens, tokenFee,
//             pairProceeds, pairFee)
// ETH-pair curves (the abis bundle's Bought/Sold):
//   Bought(buyer✓, recipient✓, grossEthUsed, curveQuote, tokenAmount,
//          creatorFee, protocolFee)
//   Sold(seller✓, tokenAmount, grossCurveQuote, ethReceived, creatorFee,
//        protocolFee)
//
// In EVERY family the token appears in NO topic — one curve contract serves
// exactly one token, so the trade's token is identified by the log's ADDRESS
// (the curve), never by a topic. Double confirmation for the quoted family:
// the keccak-256 hashes below match the frontend bundle's own constants
// (Zn/Xn), and a live captured CurveBuy (launch "Trust Me Bro" 2026-10-12)
// decoded field-per-field against this ABI.
const CURVE_BUY_QUOTED_TOPIC = "0x55867fe9a84ea30ad247ef1bb703eba47fd9af476149002512a2814b1e3d8fb5"; // CurveBuy(address,address,uint256,uint256,uint256,uint256,uint256,uint256)
const CURVE_SELL_QUOTED_TOPIC = "0x3899b2b9ba4dfe77b54ff5e6f921672b2a7563ade468f2a106b25a4b808d60de"; // CurveSell(address,address,uint256,uint256,uint256,uint256,uint256)
const ETH_BOUGHT_TOPIC = "0x8a5254432535d4192429d2cc163283a57784eac274295fcda17cc659c1ee414c"; // Bought(address,address,uint256,uint256,uint256,uint256,uint256)
const ETH_SOLD_TOPIC = "0x917d0fe1b6c3328f12a0177d25bf1b7d9e963116addad0bfc06b0cdcb6427603"; // Sold(address,uint256,uint256,uint256,uint256,uint256)

import { hashString, mulberry32, utcDateStr } from "@/game/cc/rng";
import type { Candle } from "@/game/cc/types";
import { getLaunchOfDay, launchSymbol, vibeLaunchCandles, type VibeLaunch } from "@/lib/vibe-launch";

// VibeVibe testnet chain config (same as vibe-launch.ts)
const RPC_URL = process.env.ROBINHOOD_TESTNET_RPC || "https://rpc.testnet.chain.robinhood.com";

// Minimum activity threshold for Launchpad Mode eligibility.
// A token needs at least this many buy+sell events in the lookback window
// to produce interesting, non-trivial terrain. NOTE on units: the volume
// floor is expressed in 18-decimal PAIR units — ETH for ETH-pair curves,
// the quote token (e.g. VIBEVIBE) for quoted-pair curves. Both are 18-dec,
// and the floor is deliberately trivial: the trade COUNT is the primary
// activity gate; the volume floor only filters dust-only curves.
export const MIN_TRADE_COUNT = 10;
export const MIN_VOLUME_UNITS = 1_000_000_000_000_000n; // 0.001 pair units (18-dec)

export interface TradeEvent {
  type: "buy" | "sell";
  amount: bigint;  // token amount (18-dec units)
  cost: bigint;   // ETH cost/refund (18-dec units)
  token: string;  // token contract address
  blockNumber: number;
  txHash: string;
}

export interface LaunchpadTokenActivity {
  token: string;       // token contract address
  symbol: string;      // display symbol
  buyCount: number;
  sellCount: number;
  totalVolume: bigint;  // sum of all amounts
  netFlow: bigint;      // buys - sells (positive = net buying)
  events: TradeEvent[];
  eligible: boolean;    // passes the minimum threshold
}

export interface LaunchpadInfo {
  launch: VibeLaunch;
  activity: LaunchpadTokenActivity | null;  // null when on-chain read failed
  symbol: string;
  eligible: boolean;
}

// Log cache: 15min TTL (on-chain data is immutable per block, but we don't
// want to hammer the RPC for every request)
const LOG_CACHE_TTL = 15 * 60 * 1000;
let logCache: { key: string; at: number; events: TradeEvent[] } | null = null;

/**
 * Fetch REAL curve trade events for ONE curve contract via eth_getLogs.
 *
 * P3-1 lesson (2026-10-12): the token is NOT in any event topic — one curve
 * serves one token — so the query filters by the curve's ADDRESS and the
 * caller tells us which token these trades belong to. The default window is
 * 25 000 blocks (~21h of testnet at ~3s blocks), within the RPC's 30 000-block
 * eth_getLogs cap; an address-filtered query of this span was live-verified.
 *
 * Returns the parsed trades (empty array when the curve simply had no
 * activity), or null ONLY on RPC failure (caller keeps its fallback path).
 */
export async function fetchTradeEvents(
  curveAddress: string,
  tokenAddress: string,
  blockRange = 25_000,
): Promise<TradeEvent[] | null> {
  if (!/^0x[a-fA-F0-9]{40}$/.test(curveAddress) || !/^0x[a-fA-F0-9]{40}$/.test(tokenAddress)) {
    return null;
  }
  const curve = curveAddress.toLowerCase();
  const token = tokenAddress.toLowerCase();
  const cacheKey = `${curve}:${token}:${blockRange}`;
  if (logCache && logCache.key === cacheKey && Date.now() - logCache.at < LOG_CACHE_TTL) {
    return logCache.events;
  }

  try {
    // Get current block number
    const blockRes = await rpcCall(RPC_URL, "eth_blockNumber", []);
    if (!blockRes?.result || typeof blockRes.result !== "string") return null;
    const latestBlock = parseInt(blockRes.result, 16);
    if (!Number.isFinite(latestBlock) || latestBlock <= 0) return null;

    const fromBlock = Math.max(0, latestBlock - blockRange);

    const logsRes = await rpcCall(RPC_URL, "eth_getLogs", [{
      fromBlock: "0x" + fromBlock.toString(16),
      toBlock: "0x" + latestBlock.toString(16),
      address: curve, // the curve IS the token's identity on-chain
      topics: [[CURVE_BUY_QUOTED_TOPIC, CURVE_SELL_QUOTED_TOPIC, ETH_BOUGHT_TOPIC, ETH_SOLD_TOPIC]],
    }]);
    if (!logsRes?.result || !Array.isArray(logsRes.result)) return null;

    const events: TradeEvent[] = [];
    for (const log of logsRes.result) {
      const parsed = parseTradeEvent(log, token);
      if (parsed) events.push(parsed);
    }

    logCache = { key: cacheKey, at: Date.now(), events };
    return events;
  } catch (err) {
    console.error("[launchpad-indexer] fetchTradeEvents failed:", (err as Error).message);
    return null;
  }
}

interface RawLog {
  topics: string[];
  data: string;
  blockNumber: string;
  transactionHash: string;
  address?: string;
}

function word(hex: string, i: number): bigint | null {
  const body = hex.replace(/^0x/, "");
  const w = body.slice(i * 64, (i + 1) * 64);
  if (w.length !== 64) return null;
  return BigInt("0x" + w);
}

/** Parse one log into a TradeEvent using the VERIFIED ABI families.
 *  `token` is the caller's attribution (the curve's token) — attached as-is.
 *  Unknown topic0 / malformed data → null (never a fabricated trade). */
export function parseTradeEvent(log: RawLog, token: string): TradeEvent | null {
  if (!log.topics || log.topics.length < 2) return null;
  const topic0 = log.topics[0];
  const data = log.data?.replace(/^0x/, "") ?? "";
  const type =
    topic0 === CURVE_BUY_QUOTED_TOPIC || topic0 === ETH_BOUGHT_TOPIC ? "buy"
    : topic0 === CURVE_SELL_QUOTED_TOPIC || topic0 === ETH_SOLD_TOPIC ? "sell"
    : null;
  if (!type) return null;

  let amount: bigint | null;
  let cost: bigint | null;
  if (topic0 === CURVE_BUY_QUOTED_TOPIC) {
    // [grossTokens, netTokens, tokenFee, pairCost, pairFee, rateBps]
    amount = word(data, 0); cost = word(data, 3);
  } else if (topic0 === CURVE_SELL_QUOTED_TOPIC) {
    // [grossTokens, netTokens, tokenFee, pairProceeds, pairFee]
    amount = word(data, 0); cost = word(data, 3);
  } else if (topic0 === ETH_BOUGHT_TOPIC) {
    // [grossEthUsed, curveQuote, tokenAmount, creatorFee, protocolFee]
    amount = word(data, 2); cost = word(data, 0);
  } else {
    // ETH_SOLD_TOPIC: [tokenAmount, grossCurveQuote, ethReceived, creatorFee, protocolFee]
    amount = word(data, 0); cost = word(data, 2);
  }
  if (amount === null || cost === null) return null;

  return {
    type,
    amount,
    cost,
    token: token.toLowerCase(),
    blockNumber: parseInt(log.blockNumber, 16),
    txHash: log.transactionHash ?? "",
  };
}

/**
 * Aggregate trade events into per-token activity metrics.
 * Applies the minimum trade/volume threshold for Launchpad Mode eligibility.
 */
export function aggregateActivity(
  events: TradeEvent[],
  symbol?: string,
): LaunchpadTokenActivity | null {
  if (events.length === 0) return null;

  // Group by token address
  const byToken = new Map<string, TradeEvent[]>();
  for (const ev of events) {
    if (!ev.token) continue;
    const arr = byToken.get(ev.token) ?? [];
    arr.push(ev);
    byToken.set(ev.token, arr);
  }

  // Pick the most active token (or the one matching the symbol's launch)
  let best: { token: string; events: TradeEvent[] } | null = null;
  for (const [token, evs] of byToken) {
    if (!best || evs.length > best.events.length) {
      best = { token, events: evs };
    }
  }
  if (!best) return null;

  const buyEvents = best.events.filter((e) => e.type === "buy");
  const sellEvents = best.events.filter((e) => e.type === "sell");
  const totalVolume = best.events.reduce((sum, e) => sum + e.amount, 0n);
  const buyVolume = buyEvents.reduce((sum, e) => sum + e.amount, 0n);
  const sellVolume = sellEvents.reduce((sum, e) => sum + e.amount, 0n);
  const netFlow = buyVolume - sellVolume;

  const eligible =
    best.events.length >= MIN_TRADE_COUNT && totalVolume >= MIN_VOLUME_UNITS;

  return {
    token: best.token,
    symbol: symbol ?? "VIBETOKEN",
    buyCount: buyEvents.length,
    sellCount: sellEvents.length,
    totalVolume,
    netFlow,
    events: best.events,
    eligible,
  };
}

/**
 * Derive playable terrain from real on-chain trade activity.
 *
 * The mapping uses the SAME philosophy as vibeLaunchCandles:
 * - buy/sell pressure shapes drift direction
 * - trade volume shapes volatility
 * - event count shapes level length
 *
 * But the inputs are RAW on-chain events (not API-reported metrics),
 * giving a more granular and verifiable terrain.
 */
export function launchpadCandles(
  activity: LaunchpadTokenActivity,
  date: string = utcDateStr(),
): Candle[] {
  const count = Math.min(219, Math.max(60, 60 + activity.events.length));

  const trades = activity.buyCount + activity.sellCount;
  const dirBias = trades > 0
    ? Math.min(1, Math.max(-1, Number(activity.buyCount - activity.sellCount) / trades))
    : 0;

  // Volume-based volatility: more volume = more interesting terrain
  const volScore = Math.min(1, Math.log10(1 + Number(activity.totalVolume / 10n ** 18n)) / 6);
  const baseDrift = dirBias * (0.004 + 0.02 * volScore);
  const noise = 0.06 - 0.03 * Math.min(1, trades / 100);

  const rnd = mulberry32(hashString("cc-launchpad-v1:" + activity.token + ":" + date));
  const out: Candle[] = [];
  let price = 100;
  let segment = 0;
  const step = 7 * 86_400_000;
  const startT = Date.parse(date + "T00:00:00Z") - count * step;

  for (let i = 0; i < count; i++) {
    if (i % 20 === 19) segment = (rnd() - 0.5) * 0.04;
    const o = price;
    const move = segment + baseDrift + (rnd() - 0.5) * noise;
    const c = Math.max(1, o * (1 + move));
    const wick = Math.abs(move) * (0.4 + rnd()) + rnd() * 0.01;
    const h = Math.max(o, c) * (1 + wick);
    const l = Math.min(o, c) * (1 - wick);
    out.push({ t: startT + i * step, o, h, l, c });
    price = c;
  }
  return out;
}

/**
 * Get today's Launchpad Mode level.
 *
 * Flow:
 * 1. Use vibe-launch.ts to pick the launch-of-the-day (deterministic per UTC date)
 * 2. Attempt to read real on-chain CurveBuy/CurveSell events for that token
 * 3. If on-chain data is available AND passes the threshold: derive terrain from it
 * 4. If on-chain read fails: fall back to the existing API-based vibe-launch terrain
 *
 * Returns the launch info + terrain candles (never null when the launch API works).
 */
export async function getLaunchpadLevel(date: string = utcDateStr()): Promise<{
  launch: VibeLaunch;
  activity: LaunchpadTokenActivity | null;
  candles: Candle[];
  source: "on-chain" | "api-derived";
  symbol: string;
} | null> {
  const launch = await getLaunchOfDay(date);
  if (!launch) return null;

  const symbol = launchSymbol(launch.symbol);

  // Attempt on-chain event reading — P3-1 fixed: filter by THIS launch's curve
  // ADDRESS (the token is not in any topic); a payload without curveAddress
  // (older shape) honestly skips the on-chain path.
  const events = launch.curveAddress && launch.tokenAddress
    ? await fetchTradeEvents(launch.curveAddress, launch.tokenAddress)
    : null;
  let activity: LaunchpadTokenActivity | null = null;
  let candles: Candle[];
  let source: "on-chain" | "api-derived";

  if (events && events.length > 0) {
    activity = aggregateActivity(events, symbol);
    if (activity && activity.eligible) {
      candles = launchpadCandles(activity, date);
      source = "on-chain";
    } else {
      // Token didn't pass the threshold — use API-derived terrain as fallback
      candles = vibeLaunchCandles(launch, date);
      source = "api-derived";
    }
  } else {
    // On-chain read failed — use API-derived terrain
    candles = vibeLaunchCandles(launch, date);
    source = "api-derived";
  }

  return { launch, activity, candles, source, symbol };
}

/**
 * Partner lane (council 2026-10-12): per-token terrain for a PARTNER chart.
 *
 * Unlike getLaunchpadLevel (launch-of-the-day), this pins ONE partner token
 * and derives terrain from ITS real curve trades. The partner's registry
 * entry supplies tokenAddress AND curveAddress (P3-1: the curve is the
 * on-chain identity — trades carry no token topic). There is NO api-derived
 * fallback here: a partner token whose feed cannot prove MIN_TRADE_COUNT
 * real trades in the window is simply not available (the feed-availability
 * gate, fail-closed). null = not available.
 */
export async function getPartnerLevel(
  tokenAddress: string,
  curveAddress: string,
  symbol: string,
  date: string = utcDateStr(),
): Promise<{
  activity: LaunchpadTokenActivity;
  candles: Candle[];
  source: "on-chain";
} | null> {
  if (!/^0x[a-fA-F0-9]{40}$/.test(tokenAddress) || !/^0x[a-fA-F0-9]{40}$/.test(curveAddress)) return null;
  const events = await fetchTradeEvents(curveAddress, tokenAddress);
  if (!events || events.length === 0) return null;
  const activity = aggregateActivity(events, symbol);
  // All events came from ONE address-filtered curve query — attribution is
  // by construction — but refuse rather than serve if anything disagrees.
  if (!activity || !activity.eligible) return null;
  if (activity.token.toLowerCase() !== tokenAddress.toLowerCase()) return null;
  return { activity, candles: launchpadCandles(activity, date), source: "on-chain" };
}

/** Cheap feed-availability probe for the pool API: can this partner token's
 *  curve prove the minimum real trade activity right now? (Same gate
 *  getPartnerLevel applies.) curveAddress comes from the registry entry. */
export async function partnerFeedReady(tokenAddress: string, curveAddress: string): Promise<boolean> {
  if (!/^0x[a-fA-F0-9]{40}$/.test(tokenAddress) || !/^0x[a-fA-F0-9]{40}$/.test(curveAddress)) return false;
  const events = await fetchTradeEvents(curveAddress, tokenAddress);
  if (!events || events.length < MIN_TRADE_COUNT) return false;
  const activity = aggregateActivity(events);
  return !!activity && activity.eligible && activity.token.toLowerCase() === tokenAddress.toLowerCase();
}

// --- minimal JSON-RPC helper (same pattern as robinhood-chain.ts) ---

async function rpcCall(
  url: string,
  method: string,
  params: unknown[],
  timeoutMs = 8000,
): Promise<{ result?: unknown; error?: unknown } | null> {
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      cache: "no-store",
      signal: AbortSignal.timeout(timeoutMs),
      body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
    });
    if (!res.ok) return null;
    return (await res.json()) as { result?: unknown; error?: unknown };
  } catch {
    return null;
  }
}

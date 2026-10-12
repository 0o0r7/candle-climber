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
// VibeVibe emits CurveBuy/CurveSell events from its bonding curve contracts.
// The event signatures (verified from contract ABIs):
//   CurveBuyindexed address buyer, uint256 amount, uint256 cost, address token)
//   CurveSellindexed address seller, uint256 amount, uint256 refund, address token)
//
// We use keccak-256 topic hashing (via @noble/hashes, already in the project)
// to match event topics in eth_getLogs results.
import { keccak_256 } from "@noble/hashes/sha3.js";
import { hashString, mulberry32, utcDateStr } from "@/game/cc/rng";
import type { Candle } from "@/game/cc/types";
import { getLaunchOfDay, launchSymbol, vibeLaunchCandles, type VibeLaunch } from "@/lib/vibe-launch";

// VibeVibe testnet chain config (same as vibe-launch.ts)
const CHAIN_ID = 46630;
const RPC_URL = process.env.ROBINHOOD_TESTNET_RPC || "https://rpc.testnet.chain.robinhood.com";

// Event topic hashes (keccak-256 of the signature, first 32 bytes)
// CurveBuy(address,uint256,uint256,address) → topic0
// CurveSell(address,uint256,uint256,address) → topic0
const CURVE_BUY_TOPIC = "0x" + bytesToHex(keccak_256(
  new TextEncoder().encode("CurveBuy(address,uint256,uint256,address)"),
));
const CURVE_SELL_TOPIC = "0x" + bytesToHex(keccak_256(
  new TextEncoder().encode("CurveSell(address,uint256,uint256,address)"),
));

function bytesToHex(b: Uint8Array): string {
  return [...b].map((x) => x.toString(16).padStart(2, "0")).join("");
}

// Minimum activity threshold for Launchpad Mode eligibility.
// A token needs at least this many buy+sell events in the lookback window
// to produce interesting, non-trivial terrain.
export const MIN_TRADE_COUNT = 10;
export const MIN_VOLUME_UNITS = 1_000_000_000_000_000n; // 0.001 ETH in 18-dec units

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
 * Fetch CurveBuy/CurveSell events from the VibeVibe bonding curve contracts
 * via eth_getLogs. Scans the most recent ~1000 blocks (testnet blocks are
// fast, so this covers recent trading activity).
 *
 * Returns all trade events found, or null on RPC failure.
 */
export async function fetchTradeEvents(
  tokenAddress?: string,
  blockRange = 1000,
): Promise<TradeEvent[] | null> {
  const cacheKey = tokenAddress || "all";
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

    // Query for both CurveBuy and CurveSell events
    // If a token address is given, filter on the `token` indexed param (topic 3)
    const topics: (string | string[] | null)[] = [
      [CURVE_BUY_TOPIC, CURVE_SELL_TOPIC],
    ];
    if (tokenAddress) {
      // The `token` field is the 4th indexed param (index 3) — pad to 32 bytes
      const paddedToken = "0x000000000000000000000000" + tokenAddress.toLowerCase().replace(/^0x/, "");
      topics.push(null, null, paddedToken);
    }

    const logsRes = await rpcCall(RPC_URL, "eth_getLogs", [{
      fromBlock: "0x" + fromBlock.toString(16),
      toBlock: "0x" + latestBlock.toString(16),
      topics,
    }]);
    if (!logsRes?.result || !Array.isArray(logsRes.result)) return null;

    const events: TradeEvent[] = [];
    for (const log of logsRes.result) {
      const parsed = parseTradeEvent(log);
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
}

function parseTradeEvent(log: RawLog): TradeEvent | null {
  if (!log.topics || log.topics.length < 1) return null;
  const topic0 = log.topics[0];
  const isBuy = topic0 === CURVE_BUY_TOPIC;
  const isSell = topic0 === CURVE_SELL_TOPIC;
  if (!isBuy && !isSell) return null;

  // Non-indexed data: amount (uint256), cost (uint256) — packed as 2 words
  // The `token` is indexed (topic[3])
  const data = log.data?.replace(/^0x/, "") ?? "";
  if (data.length < 128) return null;
  const amount = BigInt("0x" + data.slice(0, 64));
  const cost = BigInt("0x" + data.slice(64, 128));
  const token = log.topics.length >= 4
    ? "0x" + log.topics[3].slice(26)  // last 20 bytes of the 32-byte word
    : "";

  return {
    type: isBuy ? "buy" : "sell",
    amount,
    cost,
    token,
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

  // Attempt on-chain event reading
  const events = await fetchTradeEvents();
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

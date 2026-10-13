// $WICK price reader — the platform's OWN curve formula, on the platform's
// OWN public feed (keyless, same endpoint meter.ts already trusts).
//
// WHY THIS EXISTS (owner correction 2026-10-12, recorded):
// $WICK is LIVE since 2026-10-05 (launchId 5963, lifecycle CURVE_TRADING) —
// the launch record is pinned at docs/evidence/wick-launch-record.json with
// tokenAddress 0xe2ce0be4e3d420c1e4b5c46493b3d5e03595216c and curveAddress
// 0x9e00b42b8a9c12acde9974054a05852dc692640c. The v0 verifier waited for a
// hand-set price; that wait was wrong. This reader derives the price the same
// way the VibeVibe UI does — zero guessing, LAW 4 clean.
//
// THE FORMULA (established from the platform's own frontend bundle,
// domain-shared chunk, transcribed EXACTLY — same methodology as P3-1):
//   curveCapFraction(sold, target) = { num: 80·target·he², den: (16·he − 15·sold)² }
//   displayPriceEthPerToken        = num / (den · he) = 80·target·he / (16·he − 15·sold)²
// with he = 1e27 raw units (1B supply × 1e18) and target = targetPairUnits
// (WICK: 4e18 = the launch's own 4 ETH cap — docs/evidence/wick-launch-record.json).
//
// VALIDATION AGAINST REAL CHAIN STATE (docs/PARTNER-LANE-DESIGN.md §2):
// the companion reserve model r(s) = 5·target·sold / (16·he − 15·sold) was
// fitted against BOTH pinned real states and matches to dust level:
//   launch record (block 129495061): r_actual 0.0992851 vs model 0.0992849 (+6e-5)
//   live pull 2026-10-12:            r_actual 0.0068582 vs model 0.0068581 (+1e-5)
// The reader re-checks this invariant on EVERY fetch and fails closed when the
// state does not match the model (wrong token, post-graduation drift, bad data).
//
// CONSERVATISM: the display price is the curve's marginal price BEFORE sell
// fees. What a holder can actually realize is less (curve fee 125 bps per the
// platform's own constants + the launch's 200 bps tax worst-case on the ETH
// leg). Value checks use realizablePriceEth = display × (1 − SELL_FEE_BPS/1e4)
// — the fail-closed direction (an honest partner may need to hold slightly
// more; a gamed check can never overstate value).
//
// ─── POST-GRADUATION: THE DEX POOL READER (2026-10-12, owner directive) ─────
// When the launch graduates, its liquidity moves into a Uniswap-v4-style pool
// (config API → deployments.poolManager) and the curve formula stops
// describing reality. The pool's slot0.sqrtPriceX96 IS the price — read
// ON-CHAIN through the PoolManager's own extsload at storage key
// keccak256(poolId ++ uint256(POOLS_STORAGE_SLOT)), decoded with the v4 Slot0
// packing. Every figure is evidence-pinned in
// test/fixtures/vibe-graduated-beef-20261012.json (a real graduated launch):
//   · encoding direction/scale: (poolInitialSqrtPriceX96/2^96)² equals the
//     launch record's own tokenUnits/pairUnits at graduation (exact), and
//     poolLiquidity² = pairUnits · tokenUnits (exact)
//   · three independent sources agree byte-exact on the live word: the
//     platform's list-feed market.poolSqrtPriceX96, the V4 Swap event log,
//     and the on-chain extsload read
//   · the DEX sell fee is MEASURED from two real POOL_SWAP fee events
//     (128.0 + 71.5 = 199.5 bps → pinned at 200, rounded up = fail-closed)
// Fail-closed everywhere: missing pool binding, invariant drift, RPC outage,
// or zeroed sqrtPrice all refuse to produce a price (the env override, if
// the owner sets one, still carries the verified figure).

import { DEFAULT_RPC_URL } from "@/lib/wallet";
import { keccak256Hex } from "@/lib/keccak";

const LAUNCH_URL =
  process.env.PAD_API_URL ??
  "https://testnet.vibevibe.fun/api/v1/chains/46630/v6/launches/0xe2ce0be4e3d420c1e4b5c46493b3d5e03595216c";

/** Total launch supply in raw units — 1B tokens × 1e18 (bundle constant:
 *  zC = 1000000000n·pn, and he = 1e9·gn with gn = 1e18). */
export const HE_SUPPLY_RAW = 10n ** 27n;

/** Curve sell-side fees, worst case, in bps: 125 (platform curve fee, bundle
 *  constant Kn) + 200 (WICK launch taxBps, launch record). */
export const SELL_FEE_BPS = 325;

/** Max relative deviation allowed between the actual pairReserve and the
 *  curve model r(s). Measured residuals are ≤ 6e-5; 5% catches wrong-token or
 *  structurally-different states while tolerating fee dust. */
const RESERVE_INVARIANCE_TOLERANCE = 0.05;

export type WickPriceSource = "curve" | "dex-pool" | "env-override";

/* ──────────── post-graduation DEX pool reader (evidence-pinned) ─────────── */

export const TWO_96 = 2n ** 96n;
const TWO_160 = 1n << 160n;

/** The platform's own V4 PoolManager (config API /chains/46630/config →
 *  deployments.poolManager; explorer-verified source, 2026-10-12). */
export const V4_POOL_MANAGER = "0x8366a39cc670b4001a1121b8f6a443a643e40951";

/** Storage slot of the `_pools` mapping inside PoolManager. v4-core does not
 *  document slot indices (and the verified explorer sources omit
 *  PoolManagerStorage), so this was DISCOVERED EMPIRICALLY: the key
 *  keccak256(poolId ++ uint256(6)) returned the byte-exact slot0 word for the
 *  graduated BEEF pool — matching BOTH the platform's own feed and the V4
 *  Swap event (fixture: vibe-graduated-beef-20261012.json). Pinned with an
 *  end-to-end keccak test so a wrong slot can never silently misprice. */
export const POOLS_STORAGE_SLOT = 6n;

/** extsload(bytes32) selector — keccak256("extsload(bytes32)")[0:4]. */
const EXTSLOAD_SELECTOR = "0x1e2eaeaf";

/** DEX sell-side fee, worst case, bps — MEASURED, not invented: the feeHook
 *  charges both legs of a POOL_SWAP; two real sells on the graduated BEEF
 *  pool measured 128.0 bps (token leg) + 71.5 bps (ETH leg) = 199.5 combined,
 *  pinned at 200 (rounded UP = fail-closed direction). Evidence:
 *  fixture feeEvidence (two explorer tx hashes). Re-verify at WICK's own
 *  graduation — the hook's fee is configurable (updateDynamicLPFee). */
export const DEX_SELL_FEE_BPS = 200;

/** Graduation-time invariant tolerances (see validateGraduationPool). */
const GRADUATION_PRICE_TOLERANCE = 0.001; // 0.1% — measured: exact
const GRADUATION_LIQUIDITY_TOLERANCE = 1e-9; // measured: exact (integer √)

export interface GraduationShape {
  poolId?: string;
  pairUnits?: string;
  tokenUnits?: string;
  poolLiquidity?: string;
  poolInitialSqrtPriceX96?: string;
  blockNumber?: string;
  at?: string;
  leftoverBurnedUnits?: string;
}

/** ETH per 1 token for an 18-dec launch token pooled against native ETH,
 *  from the pool's sqrtPriceX96. Encoding validated against the platform's
 *  OWN graduation math: (sqrtInit/2^96)² = tokenUnits/pairUnits, i.e.
 *  sqrtPriceX96 encodes √(token-per-ETH) — so ETH-per-token = (2^96/sqrtP)².
 *  BigInt-exact; float only at the final division. Null when unusable. */
export function dexPriceEthPerToken(sqrtPriceX96: bigint): { num: bigint; den: bigint } | null {
  if (sqrtPriceX96 <= 0n) return null;
  return { num: TWO_96 * TWO_96, den: sqrtPriceX96 * sqrtPriceX96 };
}

/** Decode a raw PoolManager slot0 storage word — v4 Slot0 packing:
 *  sqrtPriceX96 (uint160, bits 0-159) | tick (int24, 160-183) |
 *  protocolFee (uint24, 184-207) | lpFee (uint24, 208-231). */
export function decodeSlot0Word(word: bigint): {
  sqrtPriceX96: bigint;
  tick: number;
  protocolFee: number;
  lpFee: number;
} {
  let tick = Number((word >> 160n) & 0xffffffn);
  if (tick >= 1 << 23) tick -= 1 << 24; // int24 two's complement
  return {
    sqrtPriceX96: word & (TWO_160 - 1n),
    tick,
    protocolFee: Number((word >> 184n) & 0xffffffn),
    lpFee: Number((word >> 208n) & 0xffffffn),
  };
}

/** The extsload key for a pool's slot0 word: keccak256(poolId ++ slot). */
export function poolStateKeyHex(poolId: string): string {
  const id = poolId.toLowerCase().replace(/^0x/, "");
  if (!/^[0-9a-f]{64}$/.test(id)) throw new Error("malformed poolId");
  return keccak256Hex(id + POOLS_STORAGE_SLOT.toString(16).padStart(64, "0"));
}

/** Graduation-time invariants — validate the sqrt encoding's scale, direction
 *  and units against the launch record's OWN graduation math:
 *  1. (poolInitialSqrtPriceX96/2^96)² ≈ pairUnits/tokenUnits (the initial
 *     pool price IS the graduation ratio)
 *  2. poolLiquidity² ≈ pairUnits · tokenUnits (L = √(x·y))
 *  A wrong token, a structurally different pool, or corrupted figures can
 *  never pass both. Mirrors the curve reader's reserve-model invariant. */
export function validateGraduationPool(
  grad: GraduationShape,
): { ok: true } | { ok: false; reason: string } {
  try {
    const pair = BigInt(grad.pairUnits ?? "");
    const token = BigInt(grad.tokenUnits ?? "");
    const liq = BigInt(grad.poolLiquidity ?? "");
    const initSqrt = BigInt(grad.poolInitialSqrtPriceX96 ?? "");
    if (pair <= 0n || token <= 0n || liq <= 0n || initSqrt <= 0n) {
      return { ok: false, reason: "non-positive pool figure" };
    }
    const q = dexPriceEthPerToken(initSqrt);
    if (!q) return { ok: false, reason: "bad initial sqrt" };
    const price0 = Number(q.num) / Number(q.den);
    const ratio = Number(pair) / Number(token);
    const drift = Math.abs(price0 - ratio) / ratio;
    if (!(drift <= GRADUATION_PRICE_TOLERANCE)) {
      return { ok: false, reason: `initial-price drift ${(drift * 100).toFixed(4)}%` };
    }
    const l2 = liq * liq;
    const xy = pair * token;
    const rel = Number(l2 > xy ? l2 - xy : xy - l2) / Number(xy);
    if (!(rel <= GRADUATION_LIQUIDITY_TOLERANCE)) {
      return { ok: false, reason: `liquidity mismatch (rel ${rel.toExponential(2)})` };
    }
    return { ok: true };
  } catch {
    return { ok: false, reason: "unparseable graduation pool figures" };
  }
}

async function defaultPoolEthCall(to: string, data: string): Promise<string | null> {
  const rpcUrl =
    process.env.ROBINHOOD_RPC_URL ??
    process.env.NEXT_PUBLIC_ROBINHOOD_RPC_URL ??
    DEFAULT_RPC_URL;
  try {
    const res = await fetch(rpcUrl, {
      method: "POST",
      headers: { "content-type": "application/json" },
      cache: "no-store",
      signal: AbortSignal.timeout(8000),
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "eth_call",
        params: [{ to, data }, "latest"],
      }),
    });
    if (!res.ok) return null;
    const json = (await res.json()) as { result?: unknown; error?: unknown };
    if (typeof json.result !== "string" || json.error) return null;
    return json.result;
  } catch {
    return null;
  }
}

/** The owner-verified static $WICK price in ETH (env override), or null when
 *  unset. A present-but-invalid value is treated as unset (fail-closed).
 *  Lives here (not in the verifier) so the reader and the verifier share one
 *  definition without a circular import; the verifier re-exports it. */
export function readWickPriceEth(env: Record<string, string | undefined> = process.env): number | null {
  const raw = env.WICK_ETH_PRICE;
  if (!raw) return null;
  const p = Number(raw);
  return Number.isFinite(p) && p > 0 ? p : null;
}

export interface WickPriceRead {
  ok: boolean;
  /** Display price (the number the token page shows), ETH per 1 WICK token. */
  priceEth: number | null;
  /** Conservative price for VALUE checks: display minus worst-case sell fees
   *  for curve-source reads; equals display for an env override. */
  realizablePriceEth: number | null;
  source: WickPriceSource | null;
  lifecycle: string | null;
  graduated: boolean | null;
  curvePhase: boolean;
  /** pairReserve / targetPairUnits × 100 — the graduation meter. */
  meterPct: number;
  reserveWei: string | null;
  targetWei: string | null;
  /** tokensSoldGrossUnits from the launch state (raw 18-dec). */
  soldUnits: string | null;
  /** The graduated pool's V4 poolId (dex-pool reads only). */
  poolId?: string | null;
  error?: string;
}

const CACHE_MS = 60 * 60 * 1000; // 1h — council cadence; price moves are slow on this curve
let cache: { at: number; payload: WickPriceRead } | null = null;

export function resetWickPriceCache(): void {
  cache = null;
}

/** Curve display price from the platform's own formula (BigInt-exact, float
 *  only at the final division). Null when the state cannot produce a price
 *  (curve exhausted / bad input). */
export function curvePriceEthPerToken(
  soldRaw: bigint,
  targetWeiRaw: bigint,
): { num: bigint; den: bigint } | null {
  const den0 = 16n * HE_SUPPLY_RAW - 15n * soldRaw;
  if (targetWeiRaw <= 0n || den0 <= 0n) return null;
  const num = 80n * targetWeiRaw * HE_SUPPLY_RAW;
  return { num, den: den0 * den0 };
}

/** Model reserve r(s) = 5·target·sold / (16·he − 15·sold) in wei, or null when
 *  the state is outside the curve's domain. */
export function curveModelReserveWei(soldRaw: bigint, targetWeiRaw: bigint): bigint | null {
  const den0 = 16n * HE_SUPPLY_RAW - 15n * soldRaw;
  if (targetWeiRaw <= 0n || soldRaw <= 0n || den0 <= 0n) return null;
  return (5n * targetWeiRaw * soldRaw) / den0;
}

export interface LaunchShape {
  lifecycle?: string;
  graduated?: boolean;
  targetPairUnits?: string;
  curve?: { tokensSoldGrossUnits?: string; pairReserveUnits?: string };
  /** Present (complete) once the launch graduates off the curve — the pool
   *  binding the DEX reader verifies against (BEEF-shaped, see fixture). */
  graduation?: GraduationShape | null;
}

async function defaultFetchLaunch(url: string): Promise<LaunchShape | null> {
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "candle-climber/partner-lane" },
      signal: AbortSignal.timeout(8000),
      cache: "no-store",
    });
    if (!res.ok) return null;
    const json = (await res.json()) as { data?: { launch?: LaunchShape } };
    return json?.data?.launch ?? null;
  } catch {
    return null;
  }
}

/** Read the live $WICK price + curve/pool state. Never throws; fail-closed
 *  shape. Priority: env WICK_ETH_PRICE (owner-verified override) → live read
 *  (curve phase: the platform's own formula; graduated: the on-chain pool). */
export async function fetchWickPrice(opts: {
  fetchLaunch?: (url: string) => Promise<LaunchShape | null>;
  /** injectable on-chain transport (tests) — returns the raw eth_call result */
  ethCall?: (to: string, data: string) => Promise<string | null>;
  now?: number;
} = {}): Promise<WickPriceRead> {
  const now = opts.now ?? Date.now();
  if (cache && now - cache.at < CACHE_MS) return cache.payload;

  const payload = await readFresh(opts);
  if (payload.ok) cache = { at: now, payload };
  return payload;
}

async function readFresh(opts: {
  fetchLaunch?: (url: string) => Promise<LaunchShape | null>;
  ethCall?: (to: string, data: string) => Promise<string | null>;
}): Promise<WickPriceRead> {
  const envPrice = readWickPriceEth();
  const fail = (error: string): WickPriceRead => ({
    ok: false,
    priceEth: null,
    realizablePriceEth: null,
    source: null,
    lifecycle: null,
    graduated: null,
    curvePhase: false,
    meterPct: 0,
    reserveWei: null,
    targetWei: null,
    soldUnits: null,
    error,
  });

  const launch = await (opts.fetchLaunch ?? defaultFetchLaunch)(LAUNCH_URL);
  if (!launch) {
    // Feed down — the env override (if set) still carries the verified figure.
    if (envPrice !== null) return envOverrideRead(envPrice, "feed-unavailable (env override active)");
    return fail("feed-unavailable");
  }

  const lifecycle = launch.lifecycle ?? null;
  const graduated = launch.graduated === true;
  const targetRaw = launch.targetPairUnits ? BigInt(launch.targetPairUnits) : 0n;
  const soldRaw = launch.curve?.tokensSoldGrossUnits ? BigInt(launch.curve.tokensSoldGrossUnits) : 0n;
  const reserveRaw = launch.curve?.pairReserveUnits ? BigInt(launch.curve.pairReserveUnits) : 0n;

  const meterPct = targetRaw > 0n && reserveRaw > 0n
    ? (Number(reserveRaw) / Number(targetRaw)) * 100
    : 0;

  if (lifecycle !== "CURVE_TRADING" || graduated) {
    // Post-graduation the curve formula no longer describes the price — the
    // on-chain DEX pool reader takes over (design doc §4b).
    if (!(graduated || lifecycle === "GRADUATED")) {
      // an unknown future lifecycle — never guess (LAW 4)
      if (envPrice !== null) return envOverrideRead(envPrice, `lifecycle=${lifecycle ?? "?"} (env override active)`);
      return { ...fail(`unsupported lifecycle (lifecycle=${lifecycle ?? "?"})`), lifecycle, graduated, meterPct };
    }
    return await readGraduatedPrice(launch, lifecycle, envPrice, opts);
  }
  if (targetRaw <= 0n || soldRaw <= 0n || reserveRaw <= 0n) {
    if (envPrice !== null) return envOverrideRead(envPrice, "degenerate curve state (env override active)");
    return { ...fail("degenerate curve state"), lifecycle, graduated, meterPct };
  }

  // Invariant self-check: the real reserve must match the curve model.
  const modelReserve = curveModelReserveWei(soldRaw, targetRaw);
  if (modelReserve === null || modelReserve <= 0n) {
    return { ...fail("curve model domain violation"), lifecycle, graduated, meterPct, targetWei: targetRaw.toString(), soldUnits: soldRaw.toString() };
  }
  const drift = Number(
    (reserveRaw > modelReserve ? reserveRaw - modelReserve : modelReserve - reserveRaw) * 10_000n / modelReserve,
  ) / 10_000;
  if (drift > RESERVE_INVARIANCE_TOLERANCE) {
    return {
      ...fail(`curve-state-inconsistent (reserve drift ${(drift * 100).toFixed(2)}%)`),
      lifecycle, graduated, meterPct, reserveWei: reserveRaw.toString(),
      targetWei: targetRaw.toString(), soldUnits: soldRaw.toString(),
    };
  }

  const quote = curvePriceEthPerToken(soldRaw, targetRaw);
  if (quote === null) {
    return { ...fail("curve price domain violation"), lifecycle, graduated, meterPct, reserveWei: reserveRaw.toString(), targetWei: targetRaw.toString(), soldUnits: soldRaw.toString() };
  }
  const priceEth = Number(quote.num) / Number(quote.den); // ETH per 1 WICK token
  if (!Number.isFinite(priceEth) || priceEth <= 0) {
    return { ...fail("curve price underflow"), lifecycle, graduated, meterPct, reserveWei: reserveRaw.toString(), targetWei: targetRaw.toString(), soldUnits: soldRaw.toString() };
  }
  const realizable = priceEth * (1 - SELL_FEE_BPS / 10_000);

  return {
    ok: true,
    priceEth,
    realizablePriceEth: realizable,
    source: "curve",
    lifecycle,
    graduated,
    curvePhase: true,
    meterPct,
    reserveWei: reserveRaw.toString(),
    targetWei: targetRaw.toString(),
    soldUnits: soldRaw.toString(),
  };
}

/** Post-graduation price read: the launch's OWN pool, live on-chain.
 *  Chain of trust (all evidence-pinned in vibe-graduated-beef-20261012.json):
 *  launch record graduation figures → structural invariants → extsload of the
 *  pool's slot0 on the platform's own PoolManager → (2^96/sqrtP)² ETH/token.
 *  Every failure is fail-closed; the env override still carries the figure. */
async function readGraduatedPrice(
  launch: LaunchShape,
  lifecycle: string | null,
  envPrice: number | null,
  opts: {
    ethCall?: (to: string, data: string) => Promise<string | null>;
  },
): Promise<WickPriceRead> {
  const grad = launch.graduation;
  const soldUnits = launch.curve?.tokensSoldGrossUnits ?? null;
  const base = (error: string, poolId: string | null = null): WickPriceRead => ({
    ok: false,
    priceEth: null,
    realizablePriceEth: null,
    source: null,
    lifecycle,
    graduated: true,
    curvePhase: false,
    meterPct: 100, // graduation already happened — true regardless of read health
    reserveWei: null,
    targetWei: null,
    soldUnits,
    poolId,
    error,
  });

  if (!grad?.poolId || !grad.pairUnits || !grad.tokenUnits || !grad.poolLiquidity || !grad.poolInitialSqrtPriceX96) {
    if (envPrice !== null) return envOverrideRead(envPrice, "graduated (env override active — pool binding incomplete)");
    return base("graduated-state-incomplete (launch record carries no complete pool binding)");
  }
  if (!/^[0-9a-f]{64}$/i.test(grad.poolId.replace(/^0x/, ""))) {
    if (envPrice !== null) return envOverrideRead(envPrice, "graduated (env override active — malformed poolId)");
    return base("graduated-state-incomplete (malformed poolId)");
  }
  const shape = validateGraduationPool(grad);
  if (!shape.ok) {
    if (envPrice !== null) return envOverrideRead(envPrice, `graduated (env override active — ${shape.reason})`);
    return base(`graduated-state-inconsistent (${shape.reason})`, grad.poolId);
  }

  // Live slot0 — straight from the platform's own PoolManager storage.
  let word: bigint | null = null;
  try {
    const key = poolStateKeyHex(grad.poolId);
    const ethCall = opts.ethCall ?? defaultPoolEthCall;
    const hex = await ethCall(V4_POOL_MANAGER, EXTSLOAD_SELECTOR + key.replace(/^0x/, ""));
    if (hex) {
      const body = hex.replace(/^0x/, "");
      if (body.length >= 64) word = BigInt("0x" + body.slice(0, 64));
    }
  } catch {
    word = null;
  }
  if (word === null) {
    if (envPrice !== null) return envOverrideRead(envPrice, "graduated (env override active — dex rpc unavailable)");
    return base("dex-rpc-unavailable", grad.poolId);
  }

  const s0 = decodeSlot0Word(word);
  const quote = dexPriceEthPerToken(s0.sqrtPriceX96);
  if (!quote) {
    return base("dex-state-inconsistent (sqrtPriceX96 = 0)", grad.poolId);
  }
  const priceEth = Number(quote.num) / Number(quote.den);
  if (!Number.isFinite(priceEth) || priceEth <= 0) {
    return base("dex price underflow", grad.poolId);
  }
  const realizable = priceEth * (1 - DEX_SELL_FEE_BPS / 10_000);

  return {
    ok: true,
    priceEth,
    realizablePriceEth: realizable,
    source: "dex-pool",
    lifecycle,
    graduated: true,
    curvePhase: false,
    meterPct: 100,
    reserveWei: null,
    targetWei: null,
    soldUnits,
    poolId: grad.poolId,
  };
}

function envOverrideRead(price: number, note: string): WickPriceRead {
  // G5 (129-c #15): the override path now applies the same sell-side haircut as
  // the live readers — both phases measure ≈2% (curve taxBps 200, DEX fee 200),
  // so the realizable figure is consistent no matter which lifecycle holds.
  const realizable = price * (1 - SELL_FEE_BPS / 10_000);
  return {
    ok: true,
    priceEth: price,
    realizablePriceEth: realizable,
    source: "env-override",
    lifecycle: null,
    graduated: null,
    curvePhase: false,
    meterPct: 0,
    reserveWei: null,
    targetWei: null,
    soldUnits: null,
    error: note,
  };
}

/** Where partners buy/trade $WICK right now (the token's own page on the
 *  launch platform). Pinned from the launch record's platform + owner-provided
 *  trade link, 2026-10-12. */
export const WICK_TRADE_URL =
  "https://testnet.vibevibe.fun/token/0xe2ce0be4e3d420c1e4b5c46493b3d5e03595216c";

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

export type WickPriceSource = "curve" | "env-override";

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

/** Read the live $WICK price + curve state. Never throws; fail-closed shape.
 *  Priority: env WICK_ETH_PRICE (owner-verified override) → live curve read. */
export async function fetchWickPrice(opts: {
  fetchLaunch?: (url: string) => Promise<LaunchShape | null>;
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
    // DEX pool reader is the queued follow-up (design doc §6). Fail closed.
    if (envPrice !== null) return envOverrideRead(envPrice, `lifecycle=${lifecycle ?? "?"} (env override active)`);
    return { ...fail(`curve-phase-only (lifecycle=${lifecycle ?? "?"}) — dex price reader queued`), lifecycle, graduated, meterPct };
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

function envOverrideRead(price: number, note: string): WickPriceRead {
  return {
    ok: true,
    priceEth: price,
    realizablePriceEth: price,
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

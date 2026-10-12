// Partner verifier — the on-chain HOLD check of the PARTNER lane
// (council 2026-10-12 red line: "continuous balanceOf verification via public
// RPC + grace period, then delist").
//
// THE CONTRACT
// For every registry entry (partner-registry.ts) this module answers exactly
// one question: does the registered wallet hold ≥ MIN_PARTNER_HOLD_ETH worth
// of $WICK right now? The answer drives a small, fail-closed state machine:
//
//   verified  — balance meets the threshold at the current price
//   grace     — a DEFINITIVE check found the balance below threshold; the
//               partner keeps the slot for GRACE_DAYS (7) before delisting
//   delisted  — grace exhausted; the pool API stops listing the chart
//   unverified— the check could NOT be made (no usable price, RPC down) —
//               treated as NOT verified, but the grace clock does NOT advance
//               (an infra outage must never delist a partner)
//
// FAIL-CLOSED EVERYWHERE (same philosophy as partner-threshold.ts):
// an unknown price or a failed balance read never auto-passes. A partner
// whose state cannot be proven is simply not listed while the failure lasts.
//
// PRICE SOURCE + RULE (honest, LAW 4 — live since 2026-10-12):
// $WICK IS LIVE (launchId 5963, 2026-10-05, docs/evidence/
// wick-launch-record.json). The v0 "wait for the owner to set WICK_ETH_PRICE"
// stance is retired: wick-price.ts derives the price from the platform's OWN
// feed using the platform's OWN curve formula (validated to ≤6e-5 against two
// pinned chain states — docs/PARTNER-LANE-DESIGN.md §2). The env var remains
// as an optional owner override only.
// THE RULE IS PHASE-AWARE (partner-threshold.ts):
//   · CURVE TRADING → the curve-phase rule: hold the platform's own maximum
//     per-wallet commitment (19.6M WICK = 20M cap × 0.98 net-of-tax). No price
//     needed — the requirement is in units, reachable by construction.
//   · GRADUATED → the value rule: ≥ 1.25 ETH at the realizable price
//     (transfers unlock; DEX pricing begins; curve-phase haircuts apply to
//     curve-sourced prices only).
//   · unreadable state / no usable price → fail-closed (never auto-pass),
//     and the grace clock never advances on infra failures.
//
// GRACE CLOCK PERSISTENCE (v0 note): belowSince lives in process memory.
// With zero partners this is fine; the day the first real partner is
// approved, the clock must move into mongo (same pattern as ghost-store) —
// queued as the lane's persistence step. A restart RESETS grace (fail-closed
// direction: a restart can never extend a partner's grace beyond 7d; it can
// only re-verify from scratch).

import {
  WICK_TOKEN_ADDRESS,
  DEFAULT_RPC_URL,
  encodeBalanceOf,
  decodeHexQuantity,
} from "@/lib/wallet";
import {
  GRACE_DAYS,
  meetsThreshold,
  meetsThresholdCurvePhase,
} from "@/lib/partner-threshold";
import {
  fetchWickPrice,
  readWickPriceEth,
  type WickPriceRead,
} from "@/lib/wick-price";
import type { PartnerEntry } from "@/lib/partner-registry";

// Re-exported for compatibility (the env-parse lives in wick-price.ts now —
// one definition, no circular import).
export { readWickPriceEth };

export type PartnerStatus = "verified" | "grace" | "delisted" | "unverified";

export interface PartnerVerification {
  id: string;
  walletAddress: string;
  /** null = the check could not be made (fail-closed) */
  meets: boolean | null;
  status: PartnerStatus;
  /** $WICK balance in 18-dec units as decimal string (null when unreadable) */
  balanceUnits: string | null;
  /** epoch ms of the first DEFINITIVE below-threshold check (grace clock) */
  belowSince: number | null;
  /** epoch ms when grace ends (null unless status === "grace") */
  graceEndsAt: number | null;
  lastCheckedAt: number;
  reason?: string;
}

const DAY_MS = 86_400_000;
export const GRACE_MS = GRACE_DAYS * DAY_MS;

/** Pure status machine — no I/O, fully testable.
 *  `meets === null` never advances or clears the grace clock. */
export function partnerStatus(
  meets: boolean | null,
  belowSince: number | null,
  now: number,
): { status: PartnerStatus; belowSince: number | null; graceEndsAt: number | null } {
  if (meets === true) {
    // recovery (or continued eligibility) — the grace clock clears
    return { status: "verified", belowSince: null, graceEndsAt: null };
  }
  if (meets === null) {
    // unverifiable — keep whatever state existed; never auto-pass, never punish
    if (belowSince === null) return { status: "unverified", belowSince: null, graceEndsAt: null };
    const expired = now - belowSince >= GRACE_MS;
    return {
      status: expired ? "delisted" : "grace",
      belowSince,
      graceEndsAt: expired ? null : belowSince + GRACE_MS,
    };
  }
  // definitive below-threshold check
  const since = belowSince ?? now; // first definitive miss starts the clock
  const expired = now - since >= GRACE_MS;
  return {
    status: expired ? "delisted" : "grace",
    belowSince: since,
    graceEndsAt: expired ? null : since + GRACE_MS,
  };
}

/* ------------------------------- balance read ------------------------------ */

const BALANCE_CACHE_MS = 60 * 60 * 1000; // 1h — council-specified cadence
const balanceCache = new Map<string, { at: number; units: bigint | null }>();

export interface VerifyOpts {
  now?: number;
  /** injectable price for the VALUE rule (tests / forced env figure).
   *  Present (even when null) selects the value rule without any live read —
   *  keeps legacy call sites and tests offline-deterministic. */
  priceEth?: number | null;
  /** injectable phase flag: true = CURVE_TRADING (units rule), false =
   *  graduated/other (value rule). Undefined = resolve via the price reader. */
  curvePhase?: boolean;
  /** injectable full price-read (tests); default fetchWickPrice() (1h cache) */
  wickPrice?: WickPriceRead;
  /** injectable RPC url (tests) */
  rpcUrl?: string;
  /** injectable transport (tests) — returns the raw eth_call result hex */
  ethCall?: (to: string, data: string) => Promise<string | null>;
  /** injectable cache (tests) */
  cache?: Map<string, { at: number; units: bigint | null }>;
}

async function defaultEthCall(rpcUrl: string, to: string, data: string): Promise<string | null> {
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

async function readBalanceUnits(
  walletAddress: string,
  opts: VerifyOpts,
): Promise<{ units: bigint | null; reason?: string }> {
  const key = walletAddress.toLowerCase();
  const cache = opts.cache ?? balanceCache;
  const now = opts.now ?? Date.now();
  const hit = cache.get(key);
  if (hit && now - hit.at < BALANCE_CACHE_MS) {
    return hit.units === null
      ? { units: null, reason: "cached rpc-unavailable" }
      : { units: hit.units };
  }
  const rpcUrl = opts.rpcUrl
    ?? process.env.ROBINHOOD_RPC_URL
    ?? process.env.NEXT_PUBLIC_ROBINHOOD_RPC_URL
    ?? DEFAULT_RPC_URL;
  const ethCall = opts.ethCall ?? ((to: string, data: string) => defaultEthCall(rpcUrl, to, data));
  let hex: string | null = null;
  try {
    hex = await ethCall(WICK_TOKEN_ADDRESS, encodeBalanceOf(key));
  } catch {
    hex = null;
  }
  let units: bigint | null = null;
  if (hex) {
    try {
      units = decodeHexQuantity(hex);
    } catch {
      units = null;
    }
  }
  cache.set(key, { at: now, units });
  return units === null
    ? { units: null, reason: "rpc-unavailable" }
    : { units };
}

/** Verify one registry entry. Never throws — every failure lands in the
 *  fail-closed state machine. Side-effect: advances/clears the in-memory
 *  grace clock for the entry (only on DEFINITIVE checks). */
export async function verifyPartner(entry: PartnerEntry, opts: VerifyOpts = {}): Promise<PartnerVerification> {
  const now = opts.now ?? Date.now();
  const { units, reason } = await readBalanceUnits(entry.walletAddress, opts);

  // Rule resolution (phase-aware, offline-safe for injected opts):
  //   1. curvePhase === true                       → units rule (no price)
  //   2. curvePhase === false OR priceEth injected → value rule (price ?? env)
  //   3. otherwise                                 → live read (fetchWickPrice)
  let rule: "units" | "value";
  let price: number | null;
  let readerError: string | undefined;
  if (opts.curvePhase === true) {
    rule = "units";
    price = opts.priceEth !== undefined ? opts.priceEth : null;
  } else if (opts.curvePhase === false || opts.priceEth !== undefined) {
    rule = "value";
    price = opts.priceEth !== undefined ? opts.priceEth : readWickPriceEth();
  } else {
    const read = opts.wickPrice !== undefined ? opts.wickPrice : await fetchWickPrice();
    if (read.ok && read.curvePhase) {
      rule = "units";
      price = null;
    } else if (read.ok) {
      rule = "value";
      price = read.realizablePriceEth;
    } else {
      // Reader failed — fall back to the owner-verified env figure if present,
      // else fail closed. The reader's reason is surfaced for honest display.
      rule = "value";
      price = readWickPriceEth();
      readerError = read.error;
    }
  }

  let meets: boolean | null = null;
  let balanceUnits: string | null = null;
  let failReason: string | undefined = reason;

  if (rule === "units") {
    if (units === null) {
      failReason = failReason ?? "rpc-unavailable";
    } else {
      balanceUnits = units.toString();
      meets = meetsThresholdCurvePhase(units);
    }
  } else if (price === null) {
    failReason = readerError ? `price-reader: ${readerError}` : "no-verified-price";
  } else if (units === null) {
    failReason = failReason ?? "rpc-unavailable";
  } else {
    balanceUnits = units.toString();
    meets = meetsThreshold(units, price);
  }

  const prev = graceClock.get(entry.id) ?? null;
  const state = partnerStatus(meets, prev, now);
  // persist the clock only for definitive states; unverifiable checks keep it
  if (meets === true) graceClock.delete(entry.id);
  else if (meets === false) graceClock.set(entry.id, state.belowSince as number);

  return {
    id: entry.id,
    walletAddress: entry.walletAddress,
    meets,
    status: state.status,
    balanceUnits,
    belowSince: state.belowSince,
    graceEndsAt: state.graceEndsAt,
    lastCheckedAt: now,
    ...(failReason ? { reason: failReason } : {}),
  };
}

/** id → first definitive below-threshold timestamp (the grace clock). */
const graceClock = new Map<string, number>();

/** Test hook — reset the process-level clocks (grace + balance cache). */
export function resetVerifierState(): void {
  graceClock.clear();
  balanceCache.clear();
}

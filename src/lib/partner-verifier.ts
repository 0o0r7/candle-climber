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
// PRICE SOURCE (honest, LAW 4):
// v0 reads WICK_ETH_PRICE from the environment — a VERIFIED figure the owner
// sets from the VibeVibe launchpad UI once $WICK is live (the launchpad shows
// the curve price; post-graduation the DEX price takes over). There is no
// automated curve-price reader yet, and inventing one that guesses would
// violate the honesty rules. When the price is unset, NO partner can be
// listed — the feature is honest-by-default: it lights up when the token
// exists, not before. Parameterized so a future on-chain price reader can
// replace the env var without touching the state machine.
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
import { GRACE_DAYS, meetsThreshold } from "@/lib/partner-threshold";
import type { PartnerEntry } from "@/lib/partner-registry";

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

/** The verified $WICK price in ETH (owner-set env figure), or null when unset.
 *  A present-but-invalid value is treated as unset (fail-closed). */
export function readWickPriceEth(env: Record<string, string | undefined> = process.env): number | null {
  const raw = env.WICK_ETH_PRICE;
  if (!raw) return null;
  const p = Number(raw);
  return Number.isFinite(p) && p > 0 ? p : null;
}

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
  /** injectable price (tests); default reads WICK_ETH_PRICE */
  priceEth?: number | null;
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
  const price = opts.priceEth !== undefined ? opts.priceEth : readWickPriceEth();
  const { units, reason } = await readBalanceUnits(entry.walletAddress, opts);

  let meets: boolean | null = null;
  let balanceUnits: string | null = null;
  let failReason: string | undefined = reason;

  if (price === null) {
    failReason = "no-verified-price"; // the token is not live yet — honest default
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

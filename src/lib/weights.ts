// Airdrop-weights — PURE math core (E2.2 / P4.4, spec: docs/WICK-ECONOMY-SPEC.md §7).
// No I/O here (W5 purity rule): the store feeds rows in, this module decides what
// they are worth. Deterministic: same event log ⇒ same weights, always.
// LAWS (docs/ECONOMY-LAWS.md): weights are entitlements to future distributions —
// they NEVER touch score, rank, or base access. Language: "builds weights", never
// "earn/guaranteed" (LAW 3.2/4).
import { isValidAddress } from "@/lib/wallet";

/* --------------------------- constants [PROVISIONAL] --------------------------- */
// Spec §7.2/§7.3 — shippable defaults pending O-S sign-off; changing a number is
// a one-line diff here + test update. Never hardcode these anywhere else.

export const STREAK_MAX = 10; // day-10+ streak adds a flat 10
export const RUN_DAILY_CAP = 10; // one run event per identity per UTC date (idempotent)
export const WALLET_SNAPSHOT_CAP = 600; // per-wallet cap at snapshot time (60 days × 10)
export const WALLET_IDENTITY_LIMIT = 2; // >2 identities per wallet = anomaly flag

/* --------------------------------- date math ---------------------------------- */

/** UTC YYYY-MM-DD for a timestamp (single authority for "today" in the ledger). */
export function utcDate(ts: number = Date.now()): string {
  return new Date(ts).toISOString().slice(0, 10);
}

function utcMs(date: string): number {
  return Date.parse(date + "T00:00:00Z");
}

/**
 * Consecutive-day streak INCLUDING `today`, given the identity's current chain
 * state (prevStreakDays + most recent prior run date). Same-day re-runs hold the
 * chain value (the store dedupes the event — points never double). Handles
 * month/year boundaries via UTC parse (exactly 86_400_000 ms per day).
 */
export function nextStreakDays(
  prevStreakDays: number,
  lastRunDate: string | null,
  today: string,
): number {
  if (!lastRunDate) return 1;
  if (lastRunDate === today) return Math.max(1, prevStreakDays);
  const delta = (utcMs(today) - utcMs(lastRunDate)) / 86_400_000;
  return delta === 1 ? Math.max(1, prevStreakDays) + 1 : 1;
}

/** Points a `run` event is worth on day N of the streak (spec §7.2). */
export function runPoints(streakDays: number): number {
  return Math.min(Math.max(1, Math.floor(streakDays)), STREAK_MAX);
}

/* ------------------------------- wallet linking ------------------------------- */

/** Valid address or null — the ledger never stores a malformed wallet string. */
export function normalizeWallet(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const a = raw.trim();
  return isValidAddress(a) ? a.toLowerCase() : null;
}

/* ------------------------------- pure snapshot -------------------------------- */

export interface WeightRow {
  name: string;
  points: number;
  wallet?: string | null;
}

export interface WalletSnapshot {
  wallet: string;
  points: number; // capped
  identities: number;
  flagged: boolean; // identities > WALLET_IDENTITY_LIMIT
}

/**
 * Per-wallet snapshot (spec §7.3): linked rows only, summed, capped per wallet,
 * anomaly-flagged when one wallet serves too many identities. Pure — W5-pinned.
 */
export function snapshotFromRows(
  rows: WeightRow[],
  cap: number = WALLET_SNAPSHOT_CAP,
): WalletSnapshot[] {
  const acc = new Map<string, { points: number; identities: Set<string> }>();
  for (const r of rows) {
    if (!r.wallet) continue; // unlinked identities are excluded from any snapshot
    const w = acc.get(r.wallet) ?? { points: 0, identities: new Set<string>() };
    w.points += Math.max(0, r.points);
    w.identities.add(r.name);
    acc.set(r.wallet, w);
  }
  return [...acc.entries()]
    .map(([wallet, v]) => ({
      wallet,
      points: Math.min(v.points, cap),
      identities: v.identities.size,
      flagged: v.identities.size > WALLET_IDENTITY_LIMIT,
    }))
    .sort((a, b) => b.points - a.points);
}

/** Identity-linked rows only (used by the snapshot export path). */
export function linkedRows(rows: WeightRow[]): WeightRow[] {
  return rows.filter((r) => !!r.wallet);
}

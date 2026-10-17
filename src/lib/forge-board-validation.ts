// Signal Forge leaderboard POST validation — PURE decision core (Phase 1).
//
// Anti-cheat contract (mirrors the classic board's W5 extraction so it can be
// pinned by test/forge-board.test.ts):
//   1. MUTATION/SEED validation — the submitted mutation id MUST equal the one
//      the server derives from the verified token's (date, symbol). A client
//      cannot choose a friendlier mutation for its run.
//   2. PHYSICAL CAPS — score, survival time, signals and chain are bounded by
//      what the engine can physically produce per second, so a hand-crafted
//      "score: 9999999" body is rejected even with a genuine run token.
//
// Client-claimed symbol/date/mutation never reach a stored entry: symbol/date
// come from the verified token payload and the mutation is re-derived here.
import { dailyMutation, MUTATION_LIST } from "@/game/vg/mutations";
import { sanitizeName } from "@/lib/board-validation";
import type { ForgeTokenPayload } from "@/lib/forge-token";

export interface ForgeBoardEntry {
  name: string;
  score: number;
  survivalTime: number; // seconds
  signalsCollected: number;
  maxChain: number;
  mutation: string; // mutation id (server-derived, never the client's claim)
  symbol: string; // pinned from the verified token
  date: string; // pinned from the verified token
  ts: number;
  board?: "guest" | "official"; // absent on legacy rows ⇒ treated as guest
  wallet?: string | null; // lowercase address on official rows; null on guest
}

export type ForgeBoardFilter = "guest" | "official";

// ---- physical caps ----------------------------------------------------------
// Engine worst case: survival 1/s × multiplier (≤2) + signals every ≥2.5s
// (≤0.4/s) worth ≤75 × 2 (chain) × multiplier (≤2) = 300 each ⇒ ≈122/s.
// 200/s is a generous ceiling that still rejects fantasy scores outright.
export const MAX_FORGE_SURVIVAL = 3_600; // seconds — a 1h arena run
export const MAX_SCORE_PER_SEC = 200;
export const MAX_SIGNALS_PER_SEC = 0.5;
export const MAX_SIGNALS = 2_000;
export const MAX_CHAIN = 2_000;

export type ForgeSubmissionVerdict =
  | { ok: true; entry: ForgeBoardEntry }
  | { ok: false; error: string; status: number };

const VALID_MUTATIONS = new Set(MUTATION_LIST.map((m) => m.id));

export function sanitizeMutation(raw: unknown): string {
  return typeof raw === "string" && VALID_MUTATIONS.has(raw as never) ? raw : "";
}

/**
 * Validate a Forge submission against the already-verified token payload.
 * `wallet` is the NORMALIZED address (or null) — a proven wallet stamps the
 * run onto the official lane; no/invalid wallet stamps the guest lane
 * (fail-open to guest — play is never blocked by wallet state).
 */
export function validateForgeSubmission(
  body: Partial<ForgeBoardEntry> & { runToken?: unknown },
  tok: ForgeTokenPayload,
  now: number = Date.now(),
  wallet: string | null = null,
): ForgeSubmissionVerdict {
  const claimedMutation = sanitizeMutation(body.mutation);
  // anti-cheat: the arena's mutation is fixed per (date, symbol) — the client
  // must not be able to pick one.
  const expectedMutation = dailyMutation(tok.date, tok.symbol).id;
  if (claimedMutation !== expectedMutation) {
    return { ok: false, error: "mutation does not match daily seed", status: 403 };
  }

  const entry: ForgeBoardEntry = {
    name: sanitizeName(body.name),
    score: Math.floor(Number(body.score)),
    survivalTime: Math.floor(Number(body.survivalTime)),
    signalsCollected: Math.floor(Number(body.signalsCollected)),
    maxChain: Math.floor(Number(body.maxChain)),
    mutation: expectedMutation,
    symbol: tok.symbol,
    date: tok.date,
    ts: now,
    board: wallet ? "official" : "guest",
    wallet,
  };

  // shape validation
  if (!Number.isFinite(entry.score) || entry.score < 0 || entry.score > 10_000_000) {
    return { ok: false, error: "invalid score", status: 400 };
  }
  if (!Number.isFinite(entry.survivalTime) || entry.survivalTime < 0 || entry.survivalTime > MAX_FORGE_SURVIVAL) {
    return { ok: false, error: "invalid survival time", status: 400 };
  }
  if (!Number.isFinite(entry.signalsCollected) || entry.signalsCollected < 0 || entry.signalsCollected > MAX_SIGNALS) {
    return { ok: false, error: "invalid signals", status: 400 };
  }
  if (!Number.isFinite(entry.maxChain) || entry.maxChain < 0 || entry.maxChain > MAX_CHAIN) {
    return { ok: false, error: "invalid chain", status: 400 };
  }

  // anti-cheat: score must be physically reachable from the survival time
  if (entry.score > entry.survivalTime * MAX_SCORE_PER_SEC + 50) {
    return { ok: false, error: "score inconsistent with run", status: 400 };
  }
  // anti-cheat: signals are spawned at a bounded rate
  if (entry.signalsCollected > entry.survivalTime * MAX_SIGNALS_PER_SEC + 3) {
    return { ok: false, error: "signals inconsistent with run", status: 400 };
  }
  // anti-cheat: a chain can never exceed the signals that were collected
  if (entry.maxChain > entry.signalsCollected) {
    return { ok: false, error: "chain inconsistent with run", status: 400 };
  }

  return { ok: true, entry };
}

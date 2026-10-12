// Per-submission unique nonce (LU-8).
// The run token is deterministic and SHARED by every player on the same terrain
// (by design, W1) — so a token alone cannot identify a submitter, and replaying
// it under new names was previously unlimited (mitigated only by velocity caps).
// A per-submission nonce closes the replay gap: each POST must carry a unique
// single-use nonce; once seen, it is rejected on the next attempt within its
// TTL window. This does NOT replace the run token (which pins terrain) — it
// augments it so one token cannot back unlimited submissions.
//
// In-memory per instance (same accepted tradeoff as the rate limiter). When
// MongoDB is active, nonces could be persisted, but the velocity caps + physical
// caps + best-run-per-wallet dedupe already constrain the blast radius of a
// replayed token to the guest lane, where the name cap (8/IP/day) further
// limits it. The nonce makes even that residual vector impossible.
import { randomBytes } from "node:crypto";

const NONCE_TTL_MS = 5 * 60_000; // 5-minute window — generous for slow networks
const MAX_NONCES = 10_000; // memory guard

/** Issue a fresh nonce string. */
export function issueNonce(): string {
  return randomBytes(16).toString("hex");
}

// In-process store of consumed nonces: nonce → expiry ms.
const consumed = new Map<string, number>();

/** Returns true if the nonce was already consumed (replay attempt). */
export function isNonceConsumed(nonce: string, now: number = Date.now()): boolean {
  cleanup(now);
  return consumed.has(nonce);
}

/**
 * Atomically claim a nonce (set-if-absent). Returns false when the nonce was
 * already claimed — the caller must reject the request. Claiming early (before
 * the expensive validation steps) closes the check-then-consume race where two
 * concurrent submissions with the same nonce could both pass a plain
 * isNonceConsumed() check. A claim that ends in a rejected request is released
 * by releaseNonce() so rejected submissions do not burn the nonce.
 */
export function claimNonce(nonce: string, now: number = Date.now()): boolean {
  cleanup(now);
  if (consumed.has(nonce)) return false;
  consumed.set(nonce, now + NONCE_TTL_MS);
  if (consumed.size > MAX_NONCES) cleanup(now);
  return true;
}

/** Release a claim made by claimNonce() — used when the request is rejected
 *  after claiming, so a failed submission does not consume the nonce. */
export function releaseNonce(nonce: string): void {
  consumed.delete(nonce);
}

/** Mark a nonce as consumed so it cannot be reused. */
export function consumeNonce(nonce: string, now: number = Date.now()): void {
  consumed.set(nonce, now + NONCE_TTL_MS);
  if (consumed.size > MAX_NONCES) cleanup(now);
}

/** Test-only: reset the store. */
export function _resetNonces(): void {
  consumed.clear();
}

function cleanup(now: number = Date.now()): void {
  for (const [k, exp] of consumed) {
    if (exp <= now) consumed.delete(k);
  }
}

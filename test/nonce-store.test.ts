// LU-8 pin: per-submission nonce store — atomic claim, replay rejection,
// release-on-reject semantics, TTL expiry, memory guard.
import { describe, test, expect, beforeEach } from "bun:test";
import {
  claimNonce,
  releaseNonce,
  consumeNonce,
  isNonceConsumed,
  issueNonce,
  _resetNonces,
} from "../src/lib/nonce-store";

const T0 = 1_700_000_000_000;

describe("nonce store (LU-8)", () => {
  beforeEach(() => _resetNonces());

  test("issueNonce returns usable random strings", () => {
    const a = issueNonce();
    const b = issueNonce();
    expect(a).not.toBe(b);
    expect(a.length).toBe(32); // 16 random bytes hex-encoded
  });

  test("claim is atomic: second claim of the same nonce fails (replay)", () => {
    expect(claimNonce("nonce-1", T0)).toBe(true);
    expect(claimNonce("nonce-1", T0 + 1)).toBe(false); // no check-then-consume race
    expect(isNonceConsumed("nonce-1", T0 + 1)).toBe(true);
  });

  test("consumeNonce marks single-use; replay is rejected until TTL", () => {
    consumeNonce("nonce-2", T0);
    expect(isNonceConsumed("nonce-2", T0 + 1)).toBe(true);
    expect(claimNonce("nonce-2", T0 + 1)).toBe(false); // cannot re-claim either
  });

  test("releaseNonce un-claims so a rejected request does not burn the nonce", () => {
    expect(claimNonce("nonce-3", T0)).toBe(true);
    releaseNonce("nonce-3");
    expect(isNonceConsumed("nonce-3")).toBe(false);
    expect(claimNonce("nonce-3", T0 + 1)).toBe(true); // reusable after release
  });

  test("claims expire after the 5-minute TTL window", () => {
    expect(claimNonce("nonce-4", T0)).toBe(true);
    const TTL = 5 * 60_000;
    expect(claimNonce("nonce-4", T0 + TTL - 1)).toBe(false); // still held
    expect(claimNonce("nonce-4", T0 + TTL + 1_000)).toBe(true); // expired → reclaimable
  });

  test("unknown nonces are never consumed", () => {
    expect(isNonceConsumed("never-seen")).toBe(false);
  });
});

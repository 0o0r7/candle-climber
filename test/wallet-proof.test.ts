/// <reference types="bun-types" />
// LAW 1.2 hardening — ownership-proof unit pins (bun test).
// Pins the promises verifyOfficialProof makes:
//  1. ROUNDTRIP — a personal_sign (EIP-191) signature by the wallet's key
//     over the canonical message verifies for that wallet.
//  2. SINGLE-USE BY CONSTRUCTION — every run field is inside the signed
//     message; changing ANY of them (or the wallet) invalidates the proof.
//  3. FRESHNESS — the signed client timestamp must be within ±10 min.
//  4. FAIL-CLOSED ON INPUTS, never a throw — malformed anything ⇒ ok:false.
// Signatures here are produced with the same audited primitives the verifier
// uses (@noble/secp256k1) — the EIP-191 envelope is built by hand in this file
// so the prefix format itself is pinned independently of wallet-proof.ts.
import { describe, test, expect } from "bun:test";
import { sign, getPublicKey, hashes as secpHashes } from "@noble/secp256k1";
import { hmac } from "@noble/hashes/hmac.js";
import { sha256 } from "@noble/hashes/sha2.js";
import { keccak_256 } from "@noble/hashes/sha3.js";
import { buildProofMessage, type ProofFields } from "@/lib/proof-message";
import { verifyOfficialProof, PROOF_WINDOW_MS } from "@/lib/wallet-proof";

// noble v3 sync sign needs RFC6979 providers wired explicitly
secpHashes.sha256 = (m) => sha256(m);
secpHashes.hmacSha256 = (k, m) => hmac(sha256, k, m);

const enc = new TextEncoder();
const hexToBytes = (h: string) => {
  const s = h.replace(/^0x/, "");
  const out = new Uint8Array(s.length / 2);
  for (let i = 0; i < out.length; i++) out[i] = parseInt(s.slice(i * 2, i * 2 + 2), 16);
  return out;
};
const bytesToHex = (b: Uint8Array) => [...b].map((x) => x.toString(16).padStart(2, "0")).join("");

/** Independent EIP-191 personal_sign (test-side envelope construction).
 *  noble v3 "recovered" format is recid‖r‖s; Ethereum personal_sign emits
 *  r‖s‖v (v = recid + 27) — this builder converts between the two layouts. */
function personalSign(message: string, priv: Uint8Array, vBase: 0 | 27 = 27): string {
  const bytes = enc.encode(message);
  const prefix = enc.encode(`\x19Ethereum Signed Message:\n${bytes.length}`);
  const hash = keccak_256(new Uint8Array([...prefix, ...bytes]));
  const rec = sign(hash, priv, { prehash: false, format: "recovered" }); // [recid][r][s]
  if (rec[0] > 1) throw new Error(`unexpected recid ${rec[0]} (astronomically rare — investigate)`);
  const out = new Uint8Array(65);
  out.set(rec.slice(1, 65), 0); // r‖s
  out[64] = rec[0] + vBase; // v LAST (Ethereum order)
  return "0x" + bytesToHex(out);
}

/** Ethereum address for a test private key (keccak of uncompressed key). */
function addressFor(priv: Uint8Array): string {
  return "0x" + bytesToHex(keccak_256(getPublicKey(priv, false).slice(1)).slice(-20));
}

const PRIV_A = hexToBytes("0x" + "11".repeat(32));
const PRIV_B = hexToBytes("0x" + "22".repeat(32));
const WALLET_A = addressFor(PRIV_A);
const NOW = Date.parse("2026-10-10T12:00:00Z");
const TS = NOW - 5_000; // signed 5s ago

const FIELDS: ProofFields = {
  score: 1234,
  candlesPassed: 40,
  bestStreak: 7,
  date: "2026-10-10",
  interval: "1w",
  wallet: WALLET_A,
};

describe("proof message template", () => {
  test("canonical, lowercase, clamped — the exact bytes both sides must agree on", () => {
    const m = buildProofMessage(
      { score: 99.9, candlesPassed: 12.2, bestStreak: 5000, date: "2026-10-10", interval: "1w", wallet: "0xAbC" },
      1760000000000,
    );
    expect(m).toBe(
      [
        "Candle Climber — official board proof",
        "Sign once to bind this run to your wallet.",
        "",
        "Score: 99",
        "Candles passed: 12",
        "Best streak: 999",
        "Date: 2026-10-10",
        "Interval: 1w",
        "Run time: 1760000000000",
        "Wallet: 0xabc",
      ].join("\n"),
    );
  });
});

describe("verifyOfficialProof — roundtrip", () => {
  test("signature by the wallet's key over the canonical message verifies", () => {
    const msg = buildProofMessage(FIELDS, TS);
    expect(verifyOfficialProof(WALLET_A, personalSign(msg, PRIV_A), FIELDS, TS, NOW)).toEqual({ ok: true });
  });

  test("checksummed claim address is accepted (comparison is lowercase)", () => {
    const upper = "0x" + WALLET_A.slice(2).toUpperCase();
    const msg = buildProofMessage(FIELDS, TS);
    expect(verifyOfficialProof(upper, personalSign(msg, PRIV_A), FIELDS, TS, NOW)).toEqual({ ok: true });
  });

  test("v encoded as 0/1 (some providers) is accepted", () => {
    const msg = buildProofMessage(FIELDS, TS);
    const sig = personalSign(msg, PRIV_A, 0);
    expect(sig.slice(-2)).toMatch(/^0|1$/);
    expect(verifyOfficialProof(WALLET_A, sig, FIELDS, TS, NOW)).toEqual({ ok: true });
  });
});

describe("verifyOfficialProof — single-use by construction (tamper matrix)", () => {
  const msg = buildProofMessage(FIELDS, TS);
  const sig = personalSign(msg, PRIV_A);

  test.each([
    ["score", { ...FIELDS, score: FIELDS.score + 1 }],
    ["candlesPassed", { ...FIELDS, candlesPassed: FIELDS.candlesPassed - 1 }],
    ["bestStreak", { ...FIELDS, bestStreak: FIELDS.bestStreak + 1 }],
    ["date", { ...FIELDS, date: "2026-10-09" }],
    ["interval", { ...FIELDS, interval: "1h" }],
    ["wallet", { ...FIELDS, wallet: addressFor(PRIV_B) }],
  ])("tampered %s invalidates the proof", (_label, fields) => {
    const v = verifyOfficialProof(WALLET_A, sig, fields, TS, NOW);
    expect(v.ok).toBe(false);
  });

  test("signature by a DIFFERENT key claiming wallet A is rejected", () => {
    const v = verifyOfficialProof(WALLET_A, personalSign(msg, PRIV_B), FIELDS, TS, NOW);
    expect(v).toEqual({ ok: false, reason: "address-mismatch" });
  });
});

describe("verifyOfficialProof — freshness window", () => {
  const msg = (ts: number) => buildProofMessage(FIELDS, ts);
  const sigFor = (ts: number) => personalSign(msg(ts), PRIV_A);

  test("inside the window passes (both directions)", () => {
    expect(verifyOfficialProof(WALLET_A, sigFor(NOW - 60_000), FIELDS, NOW - 60_000, NOW)).toEqual({ ok: true });
    expect(verifyOfficialProof(WALLET_A, sigFor(NOW + 60_000), FIELDS, NOW + 60_000, NOW)).toEqual({ ok: true });
  });

  test("exactly ±10 min is still inside; 1ms beyond is stale", () => {
    expect(verifyOfficialProof(WALLET_A, sigFor(NOW - PROOF_WINDOW_MS), FIELDS, NOW - PROOF_WINDOW_MS, NOW)).toEqual({ ok: true });
    const beyond = PROOF_WINDOW_MS + 1;
    expect(verifyOfficialProof(WALLET_A, sigFor(NOW - beyond), FIELDS, NOW - beyond, NOW)).toEqual({
      ok: false,
      reason: "stale",
    });
    expect(verifyOfficialProof(WALLET_A, sigFor(NOW + beyond), FIELDS, NOW + beyond, NOW)).toEqual({
      ok: false,
      reason: "stale",
    });
  });

  test("a timestamp outside the message never verifies (mismatch, not stale)", () => {
    // signed with TS but verified against a different ts → different message
    const v = verifyOfficialProof(WALLET_A, sigFor(TS), FIELDS, TS + 1, NOW);
    expect(v.ok).toBe(false);
  });
});

describe("verifyOfficialProof — fail-closed on malformed inputs (never throws)", () => {
  const msg = buildProofMessage(FIELDS, TS);
  const sig = personalSign(msg, PRIV_A);

  test("bad wallet / timestamp / signature shapes are rejected with reasons", () => {
    expect(verifyOfficialProof("0x123", sig, FIELDS, TS, NOW)).toEqual({ ok: false, reason: "wallet" });
    expect(verifyOfficialProof(WALLET_A, sig, FIELDS, undefined, NOW)).toEqual({ ok: false, reason: "timestamp" });
    expect(verifyOfficialProof(WALLET_A, sig, FIELDS, "1760000000000", NOW)).toEqual({ ok: false, reason: "timestamp" });
    expect(verifyOfficialProof(WALLET_A, sig, FIELDS, 1.5, NOW)).toEqual({ ok: false, reason: "timestamp" });
    expect(verifyOfficialProof(WALLET_A, undefined, FIELDS, TS, NOW)).toEqual({ ok: false, reason: "signature" });
    expect(verifyOfficialProof(WALLET_A, "", FIELDS, TS, NOW)).toEqual({ ok: false, reason: "signature" });
    expect(verifyOfficialProof(WALLET_A, sig.slice(0, 100), FIELDS, TS, NOW)).toEqual({ ok: false, reason: "signature" });
    expect(verifyOfficialProof(WALLET_A, "0x" + "zz".repeat(65), FIELDS, TS, NOW)).toEqual({ ok: false, reason: "signature" });
  });

  test("v = 2 (invalid recovery id) is rejected, not thrown", () => {
    const bad = sig.slice(0, -2) + "02";
    expect(verifyOfficialProof(WALLET_A, bad, FIELDS, TS, NOW)).toEqual({ ok: false, reason: "recovery-id" });
  });

  test("well-formed garbage signature resolves to an unrelated address", () => {
    const garbage = "0x" + "ab".repeat(64) + "1b";
    expect(verifyOfficialProof(WALLET_A, garbage, FIELDS, TS, NOW).ok).toBe(false);
  });
});

// Official-board ownership proof — SERVER-SIDE VERIFY (LAW 1.2 hardening).
// Closes the known limit recorded in the 2026-10-10 dated note: the official
// lane previously trusted a shape-valid client-provided address. Now an official
// submission must carry a personal_sign (EIP-191) signature made by the claimed
// wallet's key over the canonical run-binding message (proof-message.ts).
//
// Fail-open to GUEST, never an error: any missing/invalid/stale proof silently
// downgrades the run to the guest lane (play is never blocked by wallet state —
// LAW 1.2 substance). The route surfaces a one-line honest note when a claimed
// official run was degraded.
//
// Crypto: ECDSA secp256k1 public-key recovery + keccak-256 — audited primitives
// (@noble/secp256k1 + @noble/hashes), NOT hand-rolled: a subtle recovery bug
// would silently accept forged proofs, the exact failure this gate prevents.
// Isomorphic byte-safe code (Uint8Array only) — runs in bun tests and Next.js
// server runtime alike.
import { recoverPublicKey } from "@noble/secp256k1";
import { keccak_256 } from "@noble/hashes/sha3.js";
import { buildProofMessage, buildMintProofMessage, type ProofFields } from "@/lib/proof-message";
import { isValidAddress } from "@/lib/wallet";

/** Clock-skew + replay window for the client timestamp inside the message. */
export const PROOF_WINDOW_MS = 10 * 60 * 1000;

export type ProofVerdict = { ok: true } | { ok: false; reason: ProofRejectReason };

export type ProofRejectReason =
  | "wallet"
  | "timestamp"
  | "stale"
  | "signature"
  | "recovery-id"
  | "recover"
  | "address-mismatch";

function hexToBytes(hex: string): Uint8Array {
  const h = hex.replace(/^0x/, "");
  const out = new Uint8Array(h.length / 2);
  for (let i = 0; i < out.length; i++) out[i] = parseInt(h.slice(i * 2, i * 2 + 2), 16);
  return out;
}

function bytesToHex(b: Uint8Array): string {
  return [...b].map((x) => x.toString(16).padStart(2, "0")).join("");
}

function concat(...parts: Uint8Array[]): Uint8Array {
  const out = new Uint8Array(parts.reduce((n, p) => n + p.length, 0));
  let o = 0;
  for (const p of parts) {
    out.set(p, o);
    o += p.length;
  }
  return out;
}

/** Shared EIP-191 gate: shape → freshness → keccak envelope → key recovery →
 *  address comparison. `messageBuilder` selects the purpose's canonical
 *  template (board proof vs Death Card mint) — everything else is identical,
 *  audited, and pinned by the same test files. */
function verifyPersonalSignProof(
  wallet: string,
  signature: unknown,
  message: string,
  clientTs: unknown,
  now: number,
): ProofVerdict {
  if (!isValidAddress(wallet)) return { ok: false, reason: "wallet" };
  if (typeof clientTs !== "number" || !Number.isInteger(clientTs)) {
    return { ok: false, reason: "timestamp" };
  }
  if (Math.abs(now - clientTs) > PROOF_WINDOW_MS) return { ok: false, reason: "stale" };
  if (typeof signature !== "string" || !/^0x[0-9a-fA-F]{130}$/.test(signature)) {
    return { ok: false, reason: "signature" };
  }

  // EIP-191: keccak256("\x19Ethereum Signed Message:\n" + len(bytes) + bytes)
  const msgBytes = new TextEncoder().encode(message);
  const prefix = new TextEncoder().encode(`\x19Ethereum Signed Message:\n${msgBytes.length}`);
  const hash = keccak_256(concat(prefix, msgBytes));

  const sig = hexToBytes(signature);
  let recid = sig[64];
  if (recid >= 27) recid -= 27; // personal_sign v-notation → recovery id
  if (recid > 1) return { ok: false, reason: "recovery-id" };

  // Ethereum layout is r‖s‖v; noble v3 expects recid‖r‖s (recovery byte FIRST,
  // see Signature.fromBytes with format "recovered") — repack before recovering.
  const noble = new Uint8Array(65);
  noble[0] = recid;
  noble.set(sig.slice(0, 32), 1); // r
  noble.set(sig.slice(32, 64), 33); // s

  let pub: Uint8Array;
  try {
    // 65-byte uncompressed key (0x04‖X‖Y); prehash:false — `hash` IS the digest
    pub = recoverPublicKey(noble, hash, { prehash: false, isCompressed: false });
  } catch {
    return { ok: false, reason: "recover" };
  }
  // ethereum address = last 20 bytes of keccak256(uncompressed key sans 0x04 prefix)
  const recovered = "0x" + bytesToHex(keccak_256(pub.slice(1)).slice(-20));
  return recovered === wallet.toLowerCase()
    ? { ok: true }
    : { ok: false, reason: "address-mismatch" };
}

/**
 * Verify a personal_sign ownership proof.
 *   signature — 0x-prefixed 65-byte hex (r‖s‖v), v = 27/28 (some providers emit 0/1)
 *   fields    — the submission's CLAMPED values (same numbers the entry stores);
 *               the message is rebuilt from them, so a tampered body invalidates
 *               the proof even when the signature itself is genuine
 *   clientTs  — the "Run time" value inside the signed message (ms epoch)
 *   now       — server clock, injectable for tests
 */
export function verifyOfficialProof(
  wallet: string,
  signature: unknown,
  fields: ProofFields,
  clientTs: unknown,
  now: number = Date.now(),
): ProofVerdict {
  return verifyPersonalSignProof(wallet, signature, buildProofMessage(fields, Number(clientTs)), clientTs, now);
}

/**
 * Verify a Death Card MINT authorization (purpose-separated from the board
 * proof — a different canonical template, so neither signature can be replayed
 * into the other's route). Same clamps, same freshness window, same recovery.
 */
export function verifyMintProof(
  wallet: string,
  signature: unknown,
  fields: ProofFields,
  clientTs: unknown,
  now: number = Date.now(),
): ProofVerdict {
  return verifyPersonalSignProof(wallet, signature, buildMintProofMessage(fields, Number(clientTs)), clientTs, now);
}

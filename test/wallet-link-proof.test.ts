// LU-2 pin: wallet-link proof — purpose-separated canonical message, byte-exact
// template, and end-to-end personal_sign verification via the audited verifier.
// The EIP-191 envelope is built test-side (same approach as wallet-proof.test.ts)
// so the format itself stays pinned independently.
import { describe, test, expect } from "bun:test";
import { sign, getPublicKey, hashes as secpHashes } from "@noble/secp256k1";
import { hmac } from "@noble/hashes/hmac.js";
import { sha256 } from "@noble/hashes/sha2.js";
import { keccak_256 } from "@noble/hashes/sha3.js";
import {
  buildWalletLinkProofMessage,
  buildProofMessage,
  type WalletLinkFields,
} from "@/lib/proof-message";
import { verifyWalletLinkProof } from "@/lib/wallet-proof";

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
const bytesToHex = (b: Uint8Array) => Array.from(b).map((x) => x.toString(16).padStart(2, "0")).join("");

function personalSign(message: string, priv: Uint8Array, vBase: 0 | 27 = 27): string {
  const bytes = enc.encode(message);
  const prefix = enc.encode(`\x19Ethereum Signed Message:\n${bytes.length}`);
  const hash = keccak_256(new Uint8Array([...prefix, ...bytes]));
  const rec = sign(hash, priv, { prehash: false, format: "recovered" }); // (recid)(r)(s)
  if (rec[0] > 1) throw new Error("unexpected recid");
  const out = new Uint8Array(65);
  out.set(rec.slice(1, 65), 0);
  out[64] = rec[0] + vBase;
  return "0x" + bytesToHex(out);
}

function addressFor(priv: Uint8Array): string {
  return "0x" + bytesToHex(keccak_256(getPublicKey(priv, false).slice(1)).slice(-20));
}

const PRIV = hexToBytes("0x" + "11".repeat(32));
const WALLET = addressFor(PRIV).toLowerCase();
const NOW = 1_700_000_000_000;
const fields: WalletLinkFields = { wallet: WALLET, purpose: "vault", date: "2026-10-12" };

describe("wallet-link proof (LU-2)", () => {
  test("canonical message is byte-exact and lowercases the wallet", () => {
    const msg = buildWalletLinkProofMessage(fields, NOW);
    const lines = msg.split("\n");
    expect(lines[0]).toBe("Candle Climber — wallet link proof");
    expect(lines.join("\n")).toBe(msg); // stable
    expect(msg).toContain(`Purpose: vault`);
    expect(msg).toContain(`Date: 2026-10-12`);
    expect(msg).toContain(`Run time: ${NOW}`);
    expect(msg).toContain(`Wallet: ${WALLET}`);
    expect(msg).not.toContain(WALLET.toUpperCase().slice(2)); // lowercased
  });

  test("PURPOSE SEPARATION: a wallet-link message can never equal a board message", () => {
    const link = buildWalletLinkProofMessage(fields, NOW);
    const board = buildProofMessage(
      { score: 1, candlesPassed: 1, bestStreak: 1, date: "2026-10-12", interval: "1w", wallet: WALLET },
      NOW,
    );
    expect(link).not.toBe(board);
    expect(link).not.toContain(board.split("\n")[0]);
  });

  test("ROUNDTRIP: a correct personal_sign verifies for the owning wallet", () => {
    const msg = buildWalletLinkProofMessage(fields, NOW);
    const sig = personalSign(msg, PRIV);
    const v = verifyWalletLinkProof(WALLET, sig, fields, NOW, NOW + 1_000);
    expect(v.ok).toBe(true);
  });

  test("REPLAY-SAFE: the same signature is rejected for a different purpose", () => {
    const msg = buildWalletLinkProofMessage(fields, NOW);
    const sig = personalSign(msg, PRIV);
    const other = verifyWalletLinkProof(WALLET, sig, { ...fields, purpose: "practice" }, NOW, NOW + 1_000);
    expect(other.ok).toBe(false);
  });

  test("BINDING: swapping the bound wallet or date invalidates the proof", () => {
    const msg = buildWalletLinkProofMessage(fields, NOW);
    const sig = personalSign(msg, PRIV);
    expect(verifyWalletLinkProof(WALLET, sig, { ...fields, date: "2026-10-13" }, NOW, NOW + 1_000).ok).toBe(false);
    const otherPriv = hexToBytes("0x" + "22".repeat(32));
    const otherWallet = addressFor(otherPriv).toLowerCase();
    expect(verifyWalletLinkProof(otherWallet, sig, fields, NOW, NOW + 1_000).ok).toBe(false);
  });

  test("FRESHNESS: stale client timestamps are rejected", () => {
    const msg = buildWalletLinkProofMessage(fields, NOW);
    const sig = personalSign(msg, PRIV);
    const late = verifyWalletLinkProof(WALLET, sig, fields, NOW, NOW + 60 * 60_000);
    expect(late.ok).toBe(false);
  });

  test("FAIL-CLOSED: malformed signature never throws, only ok:false", () => {
    expect(verifyWalletLinkProof(WALLET, "0xdeadbeef", fields, NOW, NOW).ok).toBe(false);
    expect(verifyWalletLinkProof(WALLET, null, fields, NOW, NOW).ok).toBe(false);
    expect(verifyWalletLinkProof(WALLET, 12345, fields, NOW, NOW).ok).toBe(false);
  });
});

/// <reference types="bun-types" />
// Death Card claim core — unit pins (bun test).
// Covers: purpose-separated mint message, runKey determinism, metadata honesty,
// request shape gate, verifyMintProof roundtrip/rejections, receipt tokenId decode.
// Signatures are produced with the same audited primitives the verifier uses
// (@noble/secp256k1), mirroring test/wallet-proof.test.ts's independent builder.
import { describe, test, expect } from "bun:test";
import { sign, getPublicKey, hashes as secpHashes } from "@noble/secp256k1";
import { hmac } from "@noble/hashes/hmac.js";
import { sha256 } from "@noble/hashes/sha2.js";
import { keccak_256 } from "@noble/hashes/sha3.js";
import { buildMintProofMessage, buildProofMessage, type ProofFields } from "@/lib/proof-message";
import { verifyMintProof, verifyOfficialProof, PROOF_WINDOW_MS } from "@/lib/wallet-proof";
import {
  MINTS_PER_WALLET_PER_DAY,
  buildDeathCardMetadata,
  decodeDeathCardMetadata,
  decodeMintedTokenId,
  deriveRunKey,
  explorerTxUrl,
  runKeyHex,
  validateMintBody,
} from "@/lib/deathcard-claim";

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

function personalSign(message: string, priv: Uint8Array): string {
  const bytes = enc.encode(message);
  const prefix = enc.encode(`\x19Ethereum Signed Message:\n${bytes.length}`);
  const hash = keccak_256(new Uint8Array([...prefix, ...bytes]));
  const rec = sign(hash, priv, { prehash: false, format: "recovered" });
  if (rec[0] > 1) throw new Error(`unexpected recid ${rec[0]}`);
  const out = new Uint8Array(65);
  out.set(rec.slice(1, 65), 0);
  out[64] = rec[0] + 27;
  return "0x" + bytesToHex(out);
}

function addressFor(priv: Uint8Array): string {
  return "0x" + bytesToHex(keccak_256(getPublicKey(priv, false).slice(1)).slice(-20));
}

const PRIV_A = hexToBytes("0x" + "33".repeat(32));
const PRIV_B = hexToBytes("0x" + "44".repeat(32));
const WALLET_A = addressFor(PRIV_A);
const NOW = Date.parse("2026-10-11T12:00:00Z");
const TS = NOW - 5_000;

const FIELDS: ProofFields = {
  score: 1234,
  candlesPassed: 42,
  bestStreak: 7,
  date: "2026-10-11",
  interval: "1w",
  wallet: WALLET_A,
};

const TOK = { symbol: "TSLA", date: "2026-10-11", interval: "1w", count: 260, h: "abcdef0123456789" };

describe("mint proof message (purpose separation)", () => {
  test("template is byte-exact and includes the TESTNET honesty line", () => {
    const msg = buildMintProofMessage(FIELDS, TS);
    expect(msg).toBe(
      [
        "Candle Climber — Death Card mint (TESTNET)",
        "Sign once to mint this run's Death Card to your wallet.",
        "Minting is free — the server pays testnet gas. No value is implied.",
        "",
        "Score: 1234",
        "Candles passed: 42",
        "Best streak: 7",
        "Date: 2026-10-11",
        "Interval: 1w",
        `Run time: ${TS}`,
        `Wallet: ${WALLET_A}`,
      ].join("\n"),
    );
  });

  test("mint message differs from the board message for the same fields", () => {
    expect(buildMintProofMessage(FIELDS, TS)).not.toBe(buildProofMessage(FIELDS, TS));
  });
});

describe("verifyMintProof", () => {
  test("roundtrip: a personal_sign by the wallet's key verifies", () => {
    const sig = personalSign(buildMintProofMessage(FIELDS, TS), PRIV_A);
    expect(verifyMintProof(WALLET_A, sig, FIELDS, TS, NOW)).toEqual({ ok: true });
  });

  test("purpose separation: a BOARD signature is rejected as a mint proof", () => {
    const boardSig = personalSign(buildProofMessage(FIELDS, TS), PRIV_A);
    const v = verifyMintProof(WALLET_A, boardSig, FIELDS, TS, NOW);
    expect(v).toEqual({ ok: false, reason: "address-mismatch" });
  });

  test("purpose separation: a MINT signature is rejected as a board proof", () => {
    const mintSig = personalSign(buildMintProofMessage(FIELDS, TS), PRIV_A);
    expect(verifyOfficialProof(WALLET_A, mintSig, FIELDS, TS, NOW)).toEqual({
      ok: false,
      reason: "address-mismatch",
    });
  });

  test("tampered field invalidates the proof", () => {
    const sig = personalSign(buildMintProofMessage(FIELDS, TS), PRIV_A);
    const tampered = { ...FIELDS, score: 1235 };
    expect(verifyMintProof(WALLET_A, sig, tampered, TS, NOW)).toEqual({
      ok: false,
      reason: "address-mismatch",
    });
  });

  test("wrong wallet key rejected; stale ts rejected; garbage fails closed", () => {
    const sig = personalSign(buildMintProofMessage(FIELDS, TS), PRIV_A);
    expect(verifyMintProof(addressFor(PRIV_B), sig, FIELDS, TS, NOW)).toEqual({
      ok: false,
      reason: "address-mismatch",
    });
    expect(verifyMintProof(WALLET_A, sig, FIELDS, TS - PROOF_WINDOW_MS - 1, NOW)).toEqual({
      ok: false,
      reason: "stale",
    });
    expect(verifyMintProof(WALLET_A, "0xdeadbeef", FIELDS, TS, NOW)).toEqual({
      ok: false,
      reason: "signature",
    });
    expect(verifyMintProof("not-an-address", sig, FIELDS, TS, NOW)).toEqual({
      ok: false,
      reason: "wallet",
    });
  });
});

describe("deriveRunKey", () => {
  test("32 bytes, deterministic, wallet case-normalized", () => {
    const a = deriveRunKey(WALLET_A, TOK, { score: 100, candlesPassed: 10, bestStreak: 3 });
    const b = deriveRunKey(WALLET_A, TOK, { score: 100, candlesPassed: 10, bestStreak: 3 });
    const c = deriveRunKey(WALLET_A.toUpperCase().replace("0X", "0x"), TOK, { score: 100, candlesPassed: 10, bestStreak: 3 });
    expect(a.length).toBe(32);
    expect(bytesToHex(a)).toBe(bytesToHex(b));
    expect(bytesToHex(a)).toBe(bytesToHex(c));
  });

  test("any changed fact yields a fresh mintable key", () => {
    const base = deriveRunKey(WALLET_A, TOK, { score: 100, candlesPassed: 10, bestStreak: 3 });
    const variants = [
      deriveRunKey(WALLET_A, TOK, { score: 101, candlesPassed: 10, bestStreak: 3 }),
      deriveRunKey(WALLET_A, TOK, { score: 100, candlesPassed: 11, bestStreak: 3 }),
      deriveRunKey(WALLET_A, TOK, { score: 100, candlesPassed: 10, bestStreak: 4 }),
      deriveRunKey(addressFor(PRIV_B), TOK, { score: 100, candlesPassed: 10, bestStreak: 3 }),
      deriveRunKey(WALLET_A, { ...TOK, date: "2026-10-12" }, { score: 100, candlesPassed: 10, bestStreak: 3 }),
      deriveRunKey(WALLET_A, { ...TOK, interval: "1d" }, { score: 100, candlesPassed: 10, bestStreak: 3 }),
      deriveRunKey(WALLET_A, { ...TOK, symbol: "AAPL" }, { score: 100, candlesPassed: 10, bestStreak: 3 }),
    ];
    const hexes = new Set([bytesToHex(base), ...variants.map(bytesToHex)]);
    expect(hexes.size).toBe(8);
  });

  test("runKeyHex is 0x-prefixed 64 hex", () => {
    expect(runKeyHex(deriveRunKey(WALLET_A, TOK, { score: 1, candlesPassed: 1, bestStreak: 1 }))).toMatch(/^0x[0-9a-f]{64}$/);
  });
});

describe("metadata (honest facts only)", () => {
  test("roundtrips through the data URI and carries exactly the run's facts", () => {
    const uri = buildDeathCardMetadata({
      symbol: "TSLA",
      date: "2026-10-11",
      interval: "1w",
      score: 4321,
      candlesPassed: 55,
      bestStreak: 12,
      mintedAt: "2026-10-11T20:00:00.000Z",
    });
    expect(uri.startsWith("data:application/json;base64,")).toBe(true);
    const j = decodeDeathCardMetadata(uri) as {
      name: string;
      description: string;
      attributes: { trait_type: string; value: string | number }[];
    };
    expect(j.name).toBe("Death Card — TSLA 2026-10-11");
    expect(j.description.toLowerCase()).toContain("no monetary value");
    const attrs = Object.fromEntries(j.attributes.map((a) => [a.trait_type, a.value]));
    expect(attrs).toEqual({
      Ticker: "TSLA",
      Terrain: "2026-10-11",
      Timeframe: "1w",
      "Peak Height": 4321,
      Candles: 55,
      "Best Streak": 12,
      Minted: "2026-10-11T20:00:00.000Z",
    });
  });

  test("clamps streak above 999 (mirrors board-validation)", () => {
    const uri = buildDeathCardMetadata({
      symbol: "X", date: "2026-10-11", interval: "1h",
      score: 1.9, candlesPassed: 2.9, bestStreak: 5000, mintedAt: "2026-10-11T00:00:00.000Z",
    });
    const attrs = Object.fromEntries(
      (decodeDeathCardMetadata(uri).attributes as { trait_type: string; value: number }[]).map((a) => [a.trait_type, a.value]),
    );
    expect(attrs["Peak Height"]).toBe(1);
    expect(attrs["Candles"]).toBe(2);
    expect(attrs["Best Streak"]).toBe(999);
  });
});

describe("validateMintBody", () => {
  const good = {
    address: WALLET_A,
    signature: "0x" + "ab".repeat(65),
    ts: TS,
    score: 100,
    candlesPassed: 10,
    bestStreak: 3,
  };

  test("accepts a well-formed body and clamps numbers", () => {
    const v = validateMintBody({ ...good, score: 12.9, bestStreak: 4.7 });
    expect(v.ok).toBe(true);
    if (v.ok) {
      expect(v.score).toBe(12);
      expect(v.bestStreak).toBe(4);
      expect(v.address).toBe(WALLET_A.toLowerCase());
    }
  });

  test("rejects malformed wallet / signature / ts / score / candles", () => {
    for (const [k, bad] of [
      ["address", "0x1234"],
      ["signature", "0xshort"],
      ["ts", "not-a-number"],
      ["score", -5],
      ["score", 10_000_001],
      ["candlesPassed", 5001],
      ["candlesPassed", NaN],
    ] as const) {
      const v = validateMintBody({ ...good, [k]: bad });
      expect(v.ok).toBe(false);
    }
  });
});

describe("decodeMintedTokenId", () => {
  const CONTRACT = "0x3e2735c670ac6d6412a79153602d7e9c58640c64";
  // canonical ERC-20/721 Transfer topic — pinning the decoder to the real
  // constant (not a self-computed value) keeps it honest against drift
  const topic0 = "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef";
  const tokenIdWord = 41n.toString(16).padStart(64, "0");

  test("decodes the mint Transfer log's tokenId", () => {
    const receipt = {
      status: "0x1",
      logs: [
        { address: "0xother", topics: [topic0, "0x" + "0".repeat(64), "0x" + "1".padStart(64, "0"), "0x" + tokenIdWord] },
        { address: CONTRACT, topics: [topic0, "0x" + "0".repeat(64), "0x" + "2".padStart(64, "0"), "0x" + tokenIdWord] },
      ],
    };
    expect(decodeMintedTokenId(receipt, CONTRACT)).toBe(41);
  });

  test("fails closed: failed status / missing log / wrong contract", () => {
    expect(decodeMintedTokenId({ status: "0x0", logs: [] }, CONTRACT)).toBeNull();
    expect(decodeMintedTokenId({ status: "0x1", logs: [] }, CONTRACT)).toBeNull();
    expect(decodeMintedTokenId({ status: "0x1", logs: [{ address: CONTRACT, topics: [topic0] }] }, CONTRACT)).toBeNull();
  });
});

describe("constants + explorer url", () => {
  test("daily cap is bounded and explorer host is the verified one", () => {
    expect(MINTS_PER_WALLET_PER_DAY).toBeGreaterThanOrEqual(1);
    expect(MINTS_PER_WALLET_PER_DAY).toBeLessThanOrEqual(10);
    expect(explorerTxUrl("0x" + "ab".repeat(32))).toBe(
      "https://explorer.testnet.chain.robinhood.com/tx/0x" + "ab".repeat(32),
    );
  });
});

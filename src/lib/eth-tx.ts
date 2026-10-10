// eth-tx — minimal raw Ethereum transaction signer (EIP-155 legacy) + tiny ABI
// helpers for the Death Card mint path. Zero heavy deps: RLP by hand, crypto via
// the already-audited @noble/secp256k1 + @noble/hashes (same primitives as
// wallet-proof.ts). Isomorphic (Uint8Array only) — bun tests, deploy scripts and
// the Next.js server runtime all run the exact same code.
//
// Correctness contract: test/eth-tx.test.ts pins the CANONICAL EIP-155 example
// from the spec itself (signing hash, v/r/s, raw bytes, sender address) — any
// RLP or signing bug fails loudly there, not on a live chain.
import { sign, getPublicKey, hashes as secpHashes } from "@noble/secp256k1";
import { keccak_256 } from "@noble/hashes/sha3.js";
import { sha256 } from "@noble/hashes/sha2.js";
import { hmac } from "@noble/hashes/hmac.js";

// noble v3 ships crypto-free: the sync signing path needs its RFC-6979 HMAC
// wired to an audited implementation. One-time module-level setup.
secpHashes.sha256 = (m: Uint8Array) => sha256(m);
secpHashes.hmacSha256 = (k: Uint8Array, m: Uint8Array) => hmac(sha256, k, m);

export type TxFields = {
  nonce: bigint;
  gasPrice: bigint; // wei
  gas: bigint; // gas limit
  to: string | null; // null = contract creation
  value: bigint; // wei
  data: Uint8Array | string; // calldata / creation code (empty for plain transfers) — hex string accepted and normalized
  chainId: number;
};

export type SignedTx = {
  raw: Uint8Array;
  rawHex: string; // 0x-prefixed, eth_sendRawTransaction-ready
  txHash: string; // 0x-prefixed keccak256 of the signed tx
  v: bigint;
  r: bigint;
  s: bigint;
  signingHash: string; // 0x-prefixed (diagnostics)
  sender: string; // 0x-prefixed recovered-from-key derived address (lowercase)
};

// ---------------------------------------------------------------- byte utils

export function hexToBytes(hex: string): Uint8Array {
  const h = hex.replace(/^0x/, "");
  if (h.length % 2 !== 0) throw new Error("odd-length hex");
  const out = new Uint8Array(h.length / 2);
  for (let i = 0; i < out.length; i++) out[i] = parseInt(h.slice(i * 2, i * 2 + 2), 16);
  return out;
}

/**
 * Quantity-tolerant variant for RPC NUMERIC fields (balances, nonces, gas,
 * block numbers): nodes emit minimal odd-length hex ("0x0", "0x123").
 * Left-padding is correct ONLY for numbers — never use for data.
 */
export function hexQuantityToBytes(hex: string): Uint8Array {
  let h = hex.replace(/^0x/, "");
  if (h.length % 2 !== 0) h = "0" + h;
  return hexToBytes(h);
}

export function bytesToHex(b: Uint8Array): string {
  return [...b].map((x) => x.toString(16).padStart(2, "0")).join("");
}

/** Minimal big-endian bytes for a non-negative bigint (0 → empty, RLP-canonical). */
export function bigintToBytes(n: bigint): Uint8Array {
  if (n < 0n) throw new Error("negative bigint");
  if (n === 0n) return new Uint8Array(0);
  let hex = n.toString(16);
  if (hex.length % 2 !== 0) hex = "0" + hex;
  return hexToBytes(hex);
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

// ----------------------------------------------------------------------- RLP

type RlpItem = Uint8Array | RlpItem[];

/**
 * RLP-encode bytes or nested lists (EIP-RLP canonical rules).
 *  - single byte < 0x80 → itself
 *  - string ≤ 55 bytes  → 0x80+len prefix
 *  - longer             → 0xb7+lenOfLen, len, payload
 *  - list ≤ 55 bytes    → 0xc0+len prefix
 *  - longer             → 0xf7+lenOfLen, len, payload
 */
export function rlpEncode(item: RlpItem): Uint8Array {
  if (item instanceof Uint8Array) {
    if (item.length === 1 && item[0] < 0x80) return item;
    if (item.length <= 55) return concat(new Uint8Array([0x80 + item.length]), item);
    const len = bigintToBytes(BigInt(item.length));
    return concat(new Uint8Array([0xb7 + len.length]), len, item);
  }
  if (!Array.isArray(item)) {
    // Fail LOUD on a hex string or other non-list — the observed live bug was a
    // string calldata reaching here and dying as "item.map is not a function".
    throw new Error(
      `rlpEncode: expected Uint8Array or list, got ${typeof item} — normalize hex strings with hexToBytes() first`,
    );
  }
  const payload = concat(...item.map(rlpEncode));
  if (payload.length <= 55) return concat(new Uint8Array([0xc0 + payload.length]), payload);
  const len = bigintToBytes(BigInt(payload.length));
  return concat(new Uint8Array([0xf7 + len.length]), len, payload);
}

// ------------------------------------------------------------------ identity

/** Ethereum address (lowercase 0x…) for a 32-byte private key. */
export function deriveAddress(privKey: Uint8Array): string {
  if (privKey.length !== 32) throw new Error("private key must be 32 bytes");
  const pub = getPublicKey(privKey, false); // 65 bytes, 0x04-prefixed
  return "0x" + bytesToHex(keccak_256(pub.slice(1)).slice(-20));
}

// -------------------------------------------------------------- legacy signer

function addrBytes(to: string | null): Uint8Array {
  if (to === null) return new Uint8Array(0); // creation → empty string
  const b = hexToBytes(to);
  if (b.length !== 20) throw new Error("to must be a 20-byte address or null");
  return b;
}

/** Calldata normalizer: accepts hex string ("", "0x…") or raw bytes. */
function dataBytes(d: Uint8Array | string): Uint8Array {
  if (typeof d !== "string") return d;
  if (d === "" || d === "0x") return new Uint8Array(0);
  return hexToBytes(d); // throws on odd length / non-hex — loud, early
}

/**
 * Sign a legacy (type-0) transaction with EIP-155 replay protection.
 * Universally accepted — including Arbitrum-Orbit chains (Robinhood Chain
 * testnet, chainId 46630). Deterministic RFC-6979 nonces via noble.
 */
export function signLegacyTx(tx: TxFields, privKey: Uint8Array): SignedTx {
  const sender = deriveAddress(privKey);

  // EIP-155 signing payload: [nonce, gasPrice, gas, to, value, data, chainId, 0, 0]
  const signingPayload = rlpEncode([
    bigintToBytes(tx.nonce),
    bigintToBytes(tx.gasPrice),
    bigintToBytes(tx.gas),
    addrBytes(tx.to),
    bigintToBytes(tx.value),
    dataBytes(tx.data),
    bigintToBytes(BigInt(tx.chainId)),
    bigintToBytes(0n),
    bigintToBytes(0n),
  ]);
  const hash = keccak_256(signingPayload);

  // noble v3 returns BYTES; 'recovered' format = [recid, r(32), s(32)] — the
  // exact layout wallet-proof.ts documents for recoverPublicKey.
  const sigBytes = sign(hash, privKey, { prehash: false, format: "recovered" });
  const recid = sigBytes[0];
  if (recid > 1) throw new Error("bad recovery id");
  const v = 35n + BigInt(tx.chainId) * 2n + BigInt(recid);
  const r = bytesToBigint(sigBytes.slice(1, 33));
  const s = bytesToBigint(sigBytes.slice(33, 65));

  const signed = rlpEncode([
    bigintToBytes(tx.nonce),
    bigintToBytes(tx.gasPrice),
    bigintToBytes(tx.gas),
    addrBytes(tx.to),
    bigintToBytes(tx.value),
    dataBytes(tx.data),
    bigintToBytes(v),
    bigintToBytes(r),
    bigintToBytes(s),
  ]);

  return {
    raw: signed,
    rawHex: "0x" + bytesToHex(signed),
    txHash: "0x" + bytesToHex(keccak_256(signed)),
    v,
    r,
    s,
    signingHash: "0x" + bytesToHex(hash),
    sender,
  };
}

// ------------------------------------------------- minimal ABI (mint + reads)

const word = (b: Uint8Array): Uint8Array => {
  if (b.length > 32) throw new Error("abi word overflow");
  return concat(new Uint8Array(32 - b.length), b);
};

/** Zero-right-pad data to the next multiple of 32 (ABI dynamic data rules). */
function pad32Data(b: Uint8Array): Uint8Array {
  const rem = b.length % 32;
  return rem === 0 ? b : concat(b, new Uint8Array(32 - rem));
}

/**
 * abi.encodeWithSelector("mint(address,bytes32,string)") for CCDeathCard.
 * Static head (3 words) + tail (string length + zero-padded data), per ABI spec.
 */
export function encodeMintCalldata(to: string, runKey: Uint8Array, metadata: string): string {
  if (!/^0x[0-9a-fA-F]{40}$/.test(to)) throw new Error("invalid mint address");
  if (runKey.length !== 32) throw new Error("runKey must be 32 bytes");
  const strBytes = new TextEncoder().encode(metadata);
  const head = concat(
    hex4("0x517e7514"),
    word(hexToBytes(to)),
    word(runKey),
    word(bigintToBytes(0x60n)),
  );
  const tail = concat(word(bigintToBytes(BigInt(strBytes.length))), pad32Data(strBytes));
  return "0x" + bytesToHex(concat(head, tail));
}

function hex4(sel: string): Uint8Array {
  return hexToBytes(sel);
}

/** Decode an ABI dynamic-string return value: [offset=0x20][length][padded data]. */
export function decodeAbiString(retHex: string): string {
  const b = hexToBytes(retHex);
  if (b.length < 64) throw new Error("abi string too short");
  const off = Number(bytesToBigint(b.slice(0, 32)));
  if (off % 32 !== 0 || off + 32 > b.length) throw new Error("abi offset out of range");
  const len = Number(bytesToBigint(b.slice(off, off + 32)));
  if (off + 32 + len > b.length) throw new Error("abi string length out of range");
  return new TextDecoder().decode(b.slice(off + 32, off + 32 + len));
}

export function bytesToBigint(b: Uint8Array): bigint {
  let n = 0n;
  for (const x of b) n = (n << 8n) | BigInt(x);
  return n;
}

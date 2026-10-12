// keccak256 — pure TypeScript (BigInt lanes), zero dependencies.
//
// WHY THIS EXISTS: the post-graduation DEX price reader (wick-price.ts) reads
// the V4 PoolManager's pool state through `extsload(bytes32)` at storage key
// keccak256(poolId ++ uint256(POOLS_STORAGE_SLOT)). The repo has no keccak
// dependency (frozen bun.lock, zero-dep policy), and WebCrypto's SHA-3 is a
// DIFFERENT function (NIST padding) that would silently produce wrong keys —
// so the project carries one small, fully pinned implementation instead.
//
// PINNED BY test/keccak.test.ts:
//   · standard vectors (keccak256("") and keccak256("abc"))
//   · a multi-block vector (input spanning 2+ absorb blocks)
//   · the END-TO-END BEEF vector: keccak256(poolId ++ slot6) =
//     de07ce3b984fa22bbf085d62f6a2b7cdf584c1dcd181e6aa8dbefb6636c907d1 — the
//     key that returned the byte-exact slot0 word on-chain (see
//     test/fixtures/vibe-graduated-beef-20261012.json).

const MASK64 = (1n << 64n) - 1n;

/** Keccak-f[1600] round constants (24 rounds). */
const RC: readonly bigint[] = [
  0x0000000000000001n, 0x0000000000008082n, 0x800000000000808an, 0x8000000080008000n,
  0x000000000000808bn, 0x0000000080000001n, 0x8000000080008081n, 0x8000000000008009n,
  0x000000000000008an, 0x0000000000000088n, 0x0000000080008009n, 0x000000008000000an,
  0x000000008000808bn, 0x800000000000008bn, 0x8000000000008089n, 0x8000000000008003n,
  0x8000000000008002n, 0x8000000000000080n, 0x000000000000800an, 0x800000008000000an,
  0x8000000080008081n, 0x8000000000008080n, 0x0000000080000001n, 0x8000000080008008n,
];

/** π step permutation targets paired with ρ rotation offsets. */
const PILN: readonly number[] = [
  10, 7, 11, 17, 18, 3, 5, 16, 8, 21, 24, 4, 15, 23, 19, 13, 12, 2, 20, 14, 22, 9, 6, 1,
];
const ROTC: readonly number[] = [
  1, 3, 6, 10, 15, 21, 28, 36, 45, 55, 2, 14, 27, 41, 56, 8, 25, 43, 62, 18, 39, 61, 20, 44,
];

function rotl64(x: bigint, n: number): bigint {
  const N = BigInt(n);
  return ((x << N) & MASK64) | (x >> (64n - N));
}

function keccakF(lanes: bigint[]): void {
  for (let round = 0; round < 24; round++) {
    // θ
    const c: bigint[] = new Array(5);
    for (let x = 0; x < 5; x++) {
      c[x] = (lanes[x] ^ lanes[x + 5] ^ lanes[x + 10] ^ lanes[x + 15] ^ lanes[x + 20]) & MASK64;
    }
    for (let x = 0; x < 5; x++) {
      const d = c[(x + 4) % 5] ^ rotl64(c[(x + 1) % 5], 1);
      for (let y = 0; y < 25; y += 5) lanes[y + x] = (lanes[y + x] ^ d) & MASK64;
    }
    // ρ + π
    let last = lanes[1];
    for (let i = 0; i < 24; i++) {
      const j = PILN[i];
      const tmp = lanes[j];
      lanes[j] = rotl64(last, ROTC[i]);
      last = tmp;
    }
    // χ
    for (let y = 0; y < 25; y += 5) {
      const row = [lanes[y], lanes[y + 1], lanes[y + 2], lanes[y + 3], lanes[y + 4]];
      for (let x = 0; x < 5; x++) {
        lanes[y + x] = (row[x] ^ (~row[(x + 1) % 5] & MASK64 & row[(x + 2) % 5])) & MASK64;
      }
    }
    // ι
    lanes[0] = (lanes[0] ^ RC[round]) & MASK64;
  }
}

/** Keccak-256 (original Keccak padding 0x01 — NOT NIST SHA-3) over raw bytes. */
export function keccak256Bytes(input: Uint8Array): Uint8Array {
  const RATE = 136; // 1088-bit rate for 256-bit output
  const padded = new Uint8Array(Math.ceil((input.length + 1) / RATE) * RATE);
  padded.set(input);
  padded[input.length] = 0x01; // multi-rate padding (Keccak legacy, not SHA-3's 0x06)
  padded[padded.length - 1] |= 0x80;

  const lanes: bigint[] = new Array(25).fill(0n);
  for (let off = 0; off < padded.length; off += RATE) {
    for (let i = 0; i < RATE / 8; i++) {
      let lane = 0n;
      for (let b = 7; b >= 0; b--) lane = (lane << 8n) | BigInt(padded[off + i * 8 + b]);
      lanes[i] = (lanes[i] ^ lane) & MASK64;
    }
    keccakF(lanes);
  }

  const out = new Uint8Array(32);
  for (let i = 0; i < 4; i++) {
    let lane = lanes[i];
    for (let b = 0; b < 8; b++) {
      out[i * 8 + b] = Number(lane & 0xffn);
      lane >>= 8n;
    }
  }
  return out;
}

export function bytesToHex(bytes: Uint8Array): string {
  let s = "";
  for (const b of bytes) s += b.toString(16).padStart(2, "0");
  return "0x" + s;
}

/** Hex string (0x optional, even length) → bytes. Throws on malformed input. */
export function hexToBytes(hex: string): Uint8Array {
  const h = hex.toLowerCase().replace(/^0x/, "");
  if (!/^[0-9a-f]*$/.test(h) || h.length % 2 !== 0) throw new Error("malformed hex");
  const out = new Uint8Array(h.length / 2);
  for (let i = 0; i < out.length; i++) out[i] = parseInt(h.slice(i * 2, i * 2 + 2), 16);
  return out;
}

/** keccak256 of a hex-encoded byte string → 0x-prefixed 32-byte digest hex. */
export function keccak256Hex(hex: string): string {
  return bytesToHex(keccak256Bytes(hexToBytes(hex)));
}

/** keccak256 of a UTF-8 string → 0x-prefixed 32-byte digest hex. */
export function keccak256Utf8(text: string): string {
  return bytesToHex(keccak256Bytes(new TextEncoder().encode(text)));
}

// keccak.ts — dependency-free keccak-256, pinned against external truth.
// The END-TO-END BEEF vector is the strongest pin: its digest is the storage
// key that returned the byte-exact slot0 word on-chain (2026-10-12), so any
// drift in this implementation breaks a test BEFORE it can misprice a pool.
import { describe, expect, test } from "bun:test";
import { hexToBytes, keccak256Hex, keccak256Utf8 } from "@/lib/keccak";

describe("keccak256 (pure TS, zero deps)", () => {
  test("standard vectors", () => {
    expect(keccak256Utf8("")).toBe(
      "0xc5d2460186f7233c927e7db2dcc703c0e500b653ca82273b7bfad8045d85a470",
    );
    expect(keccak256Utf8("abc")).toBe(
      "0x4e03657aea45a94fc7d47ba826c8d667c0d1e6e33a64a036ec44f58fa12d6c45",
    );
  });

  test("absorb-block boundary (135/136/137 bytes — padding edge cases)", () => {
    const a3 = "a3".repeat(137);
    expect(keccak256Hex(a3.slice(0, 270))).toBe(
      "0x3d28d08c3dacab77392064a939f3e7f8d03f2e02e2c664ac08a05f63ac652626",
    );
    expect(keccak256Hex(a3.slice(0, 272))).toBe(
      "0xb82d89d96e5575d11a9e1f4cabb2a45e60899e69a19a724cd796bdcf13511018",
    );
    expect(keccak256Hex(a3)).toBe(
      "0xec8008a74e50bc7d6b22c3ad85402bf10e6d4449f3c8618e36c461b8a44eeafb",
    );
  });

  test("multi-block vector (200 bytes spanning 2+ absorb blocks)", () => {
    const input =
      "0x000102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f" +
      "202122232425262728292a2b2c2d2e2f303132333435363738393a3b3c3d3e3f40" +
      "4142434445464748494a4b4c4d4e4f505152535455565758595a5b5c5d5e5f6061" +
      "62636465666768696a6b6c6d6e6f707172737475767778797a7b7c7d7e7f808182" +
      "838485868788898a8b8c8d8e8f909192939495969798999a9b9c9d9e9fa0a1a2a3" +
      "a4a5a6a7a8a9aaabacadaeafb0b1b2b3b4b5b6b7b8b9babbbcbdbebfc0c1c2c3c4" +
      "c5c6c7";
    expect(keccak256Hex(input)).toBe(
      "0xbfb0aa97863e797943cf7c33bb7e880bb4543f3d2703c0923c6901c2af57b890",
    );
  });

  test("END-TO-END BEEF vector — the on-chain storage key (poolId ++ slot6)", () => {
    const poolId = "ee45030beb16063a1ab2c0a18fb39344b942a2bd9c6a20bb103cf9cf1ce267df";
    const slot = (6n).toString(16).padStart(64, "0");
    expect(keccak256Hex(poolId + slot)).toBe(
      "0xde07ce3b984fa22bbf085d62f6a2b7cdf584c1dcd181e6aa8dbefb6636c907d1",
    );
  });

  test("hexToBytes rejects malformed input (fail-closed helpers)", () => {
    expect(() => hexToBytes("0xabc")).toThrow(); // odd length
    expect(() => hexToBytes("0xzz")).toThrow(); // non-hex
    expect(Array.from(hexToBytes("0x0102"))).toEqual([0x01, 0x02]);
    expect(Array.from(hexToBytes("0102"))).toEqual([0x01, 0x02]); // 0x optional
  });
});

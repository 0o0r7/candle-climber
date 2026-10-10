// eth-tx correctness contract — pinned to the CANONICAL EIP-155 example from the
// EIP spec itself (https://eips.ethereum.org/EIPS/eip-155) plus canonical RLP
// cases from the Ethereum wiki. If RLP, signing, or ABI encoding drifts, THESE
// fail — long before anything touches a live chain.
import { describe, expect, test } from "bun:test";
import {
  bigintToBytes,
  bytesToHex,
  bytesToBigint,
  decodeAbiString,
  deriveAddress,
  encodeMintCalldata,
  hexToBytes,
  rlpEncode,
  signLegacyTx,
} from "@/lib/eth-tx";

const concat = (...parts: Uint8Array[]): Uint8Array => {
  const out = new Uint8Array(parts.reduce((n, p) => n + p.length, 0));
  let o = 0;
  for (const p of parts) {
    out.set(p, o);
    o += p.length;
  }
  return out;
};

describe("RLP canonical cases", () => {
  test("short string", () => {
    expect(bytesToHex(rlpEncode(new TextEncoder().encode("dog")))).toBe("83646f67");
  });
  test("list of two strings", () => {
    expect(
      bytesToHex(
        rlpEncode([new TextEncoder().encode("cat"), new TextEncoder().encode("dog")]),
      ),
    ).toBe("c88363617483646f67");
  });
  test("empty bytes → 0x80 (integer 0 case)", () => {
    expect(bytesToHex(rlpEncode(new Uint8Array(0)))).toBe("80");
  });
  test("single byte < 0x80 encodes as itself", () => {
    expect(bytesToHex(rlpEncode(new Uint8Array([0x0f])))).toBe("0f");
    expect(bytesToHex(rlpEncode(new Uint8Array([0x00])))).toBe("00");
  });
  test("1024 → 0x820400", () => {
    expect(bytesToHex(rlpEncode(bigintToBytes(1024n)))).toBe("820400");
  });
  test("nested empty lists (empty LIST → 0xc0, unlike empty bytes → 0x80)", () => {
    expect(bytesToHex(rlpEncode([[], [[]], [[], [[]]]]))).toBe("c7c0c1c0c3c0c1c0");
  });
  test("56-byte string → long form 0xb8 0x38", () => {
    const s = new TextEncoder().encode("Lorem ipsum dolor sit amet, consectetur adipiscing elit.");
    expect(s.length).toBe(56);
    expect(bytesToHex(rlpEncode(s))).toBe("b838" + bytesToHex(s));
  });
  test("1000-byte string → 0xb9 0x03e8", () => {
    const s = new Uint8Array(1000).fill(0x61);
    expect(bytesToHex(rlpEncode(s))).toBe("b903e8" + bytesToHex(s));
  });
});

describe("EIP-155 canonical example (from the EIP spec)", () => {
  // private key = 32 bytes of 0x46
  const KEY = new Uint8Array(32).fill(0x46);
  const TO = "0x3535353535353535353535353535353535353535";

  const signed = signLegacyTx(
    {
      nonce: 9n,
      gasPrice: 20_000_000_000n,
      gas: 21_000n,
      to: TO,
      value: 1_000_000_000_000_000_000n,
      data: new Uint8Array(0),
      chainId: 1,
    },
    KEY,
  );

  test("signing hash matches the spec", () => {
    expect(signed.signingHash).toBe(
      "0xdaf5a779ae972f972197303d7b574746c7ef83eadac0f2791ad23db92e4c8e53",
    );
  });

  test("v/r/s match the spec", () => {
    expect(signed.v).toBe(37n);
    expect(signed.r.toString(16)).toBe(
      "28ef61340bd939bc2195fe537567866003e1a15d3c71ff63e1590620aa636276",
    );
    expect(signed.s.toString(16)).toBe(
      "67cbe9d8997f761aecb703304b3800ccf555c9f3dc64214b297fb1966a3b6d83",
    );
  });

  test("raw signed tx bytes match the spec", () => {
    expect(signed.rawHex).toBe(
      "0xf86c098504a817c800825208943535353535353535353535353535353535353535" +
        "880de0b6b3a76400008025a028ef61340bd939bc2195fe537567866003e1a15d3c71ff63e1590620aa636276" +
        "a067cbe9d8997f761aecb703304b3800ccf555c9f3dc64214b297fb1966a3b6d83",
    );
  });

  test("sender derivation matches the spec", () => {
    expect(signed.sender).toBe("0x9d8a62f656a8d1615c1294fd71e9cfb3e4855a4f");
    expect(deriveAddress(KEY)).toBe("0x9d8a62f656a8d1615c1294fd71e9cfb3e4855a4f");
  });

  test("txHash is keccak256 of the raw bytes (32 bytes, 0x-prefixed)", () => {
    expect(signed.txHash).toMatch(/^0x[0-9a-f]{64}$/);
  });
});

describe("CCDeathCard mint calldata encoder", () => {
  test("hand-computed exact encoding for a minimal case", () => {
    const to = "0x1111111111111111111111111111111111111111";
    const runKey = hexToBytes("0xab" + "00".repeat(31));
    const cd = encodeMintCalldata(to, runKey, "A");
    expect(cd).toBe(
      "0x517e7514" +
        "0000000000000000000000001111111111111111111111111111111111111111" +
        "ab00000000000000000000000000000000000000000000000000000000000000" +
        "0000000000000000000000000000000000000000000000000000000000000060" +
        "0000000000000000000000000000000000000000000000000000000000000001" +
        "4100000000000000000000000000000000000000000000000000000000000000",
    );
  });

  test("realistic metadata JSON roundtrips through decodeAbiString", () => {
    const meta = JSON.stringify({
      name: "Death Card — TSLA 2026-10-10",
      description: "Candle Climber testnet demo card. Proves the loop; has no value.",
      attributes: [
        { trait_type: "Ticker", value: "TSLA" },
        { trait_type: "Peak Height", value: 312 },
      ],
    });
    const to = "0x" + "ab".repeat(20);
    const runKey = hexToBytes("0x" + "cd".repeat(32));
    const cd = encodeMintCalldata(to, runKey, meta);
    // structure: 4-byte selector + 3 head words + (1 length + padded data) tail — in UTF-8 BYTES
    const metaBytes = new TextEncoder().encode(meta).length;
    const paddedWords = Math.ceil(metaBytes / 32);
    expect((cd.length - 2) / 2).toBe(4 + 3 * 32 + 32 + paddedWords * 32);
    // realistic return shape: [offset=0x20][length][padded data] — like tokenURI() returns
    const tailHex = cd.slice(2 + 8 + 64 + 64 + 64); // strip selector + address + runKey + offset words
    const ret = "0x" + (0x20).toString(16).padStart(64, "0") + tailHex;
    expect(decodeAbiString(ret)).toBe(meta);
  });

  test("rejects invalid inputs", () => {
    expect(() => encodeMintCalldata("0x1234", new Uint8Array(32), "x")).toThrow();
    expect(() => encodeMintCalldata("0x" + "11".repeat(20), new Uint8Array(31), "x")).toThrow();
  });
});

describe("bytes helpers", () => {
  test("bigint roundtrip", () => {
    for (const n of [0n, 1n, 127n, 128n, 255n, 256n, 2n ** 256n - 1n]) {
      expect(bytesToBigint(bigintToBytes(n))).toBe(n);
    }
  });
  test("concat-free import hygiene: hexToBytes rejects odd hex", () => {
    expect(() => hexToBytes("0xabc")).toThrow();
  });
  test("concat is not exported but helpers compose", () => {
    expect(bytesToHex(concat(new Uint8Array([1]), new Uint8Array([2, 3])))).toBe("010203");
  });
});

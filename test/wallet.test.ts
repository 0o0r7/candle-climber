import { describe, expect, it } from "bun:test";
import {
  DEFAULT_RPC_URL,
  ROBINHOOD_CHAIN_ID,
  TIER_HOLD_WEI,
  TIER_WHALE_WEI,
  WICK_DECIMALS,
  WICK_TOKEN_ADDRESS,
  balanceToTier,
  decodeHexQuantity,
  encodeBalanceOf,
  formatWick,
  isValidAddress,
} from "@/lib/wallet";

// P4.2 (E2) — pure helpers for the cosmetic-only $WICK Balance Gate.
// LAW: nothing here touches scoring — these tests pin the GATE math only.

describe("P4.2 wallet helpers", () => {
  it("launch-record constants are pinned (drift = loud failure)", () => {
    expect(WICK_TOKEN_ADDRESS).toBe("0xe2ce0be4e3d420c1e4b5c46493b3d5e03595216c");
    expect(ROBINHOOD_CHAIN_ID).toBe(46630); // 0xb626, verified live 2026-10-06
    expect(DEFAULT_RPC_URL).toBe("https://rpc.testnet.chain.robinhood.com");
    expect(WICK_DECIMALS).toBe(18n);
  });

  it("isValidAddress: shape-only, case-tolerant, rejects non-strings", () => {
    expect(isValidAddress("0xE2cE0Be4e3D420C1e4b5C46493b3d5e03595216c")).toBe(true);
    expect(isValidAddress("0x" + "ab".repeat(20))).toBe(true); // lower hex
    expect(isValidAddress("0x" + "AB".repeat(20))).toBe(true); // upper hex
    expect(isValidAddress("0x123")).toBe(false); // too short
    expect(isValidAddress("0x" + "gg".repeat(20))).toBe(false); // non-hex
    expect(isValidAddress("E2cE0Be4e3D420C1e4b5C46493b3d5e03595216c")).toBe(false); // no 0x
    expect(isValidAddress(42)).toBe(false); // non-string
    expect(isValidAddress(null)).toBe(false);
    expect(isValidAddress(undefined)).toBe(false);
  });

  it("encodeBalanceOf: ERC-20 selector + zero-left-padded address", () => {
    const a = "0xE2cE0Be4e3D420C1e4b5C46493b3d5e03595216c";
    const data = encodeBalanceOf(a);
    expect(data.startsWith("0x70a08231")).toBe(true); // balanceOf(address)
    expect(data).toHaveLength(74); // 10 selector chars + 64 hex chars
    expect(data.endsWith(a.toLowerCase().slice(2).padStart(64, "0"))).toBe(true);
    // same address, different case → identical calldata
    expect(encodeBalanceOf(a.toLowerCase())).toBe(data);
  });

  it("encodeBalanceOf rejects malformed input before any network call", () => {
    expect(() => encodeBalanceOf("0x123")).toThrow();
    expect(() => encodeBalanceOf("not-an-address")).toThrow();
  });

  it("decodeHexQuantity: quantity hex (incl. 0-length) → bigint", () => {
    expect(decodeHexQuantity("0x0")).toBe(0n);
    expect(decodeHexQuantity("0x12")).toBe(18n);
    expect(
      decodeHexQuantity("0x00000000000000000000000000000000000000000000f449f0c9d03d255ca461"),
    ).toBe(1153621384765574689367137n);
  });

  it("balanceToTier: exact boundaries (never rounds a holder up)", () => {
    expect(balanceToTier(0n)).toBe("none");
    expect(balanceToTier(1n)).toBe("none");
    expect(balanceToTier(TIER_HOLD_WEI - 1n)).toBe("none");
    expect(balanceToTier(TIER_HOLD_WEI)).toBe("holder");
    expect(balanceToTier(TIER_WHALE_WEI - 1n)).toBe("holder");
    expect(balanceToTier(TIER_WHALE_WEI)).toBe("whale");
    expect(balanceToTier(TIER_WHALE_WEI * 999n)).toBe("whale");
  });

  it("formatWick: whole numbers, 3-decimal truncation (no rounding), grouping", () => {
    expect(formatWick(0n)).toBe("0");
    expect(formatWick(10n ** 18n)).toBe("1");
    expect(formatWick(1234n * 10n ** 18n + 5n * 10n ** 17n)).toBe("1,234.500");
    // 0.9999 → truncates to 0.999, never rounds to 1.000
    expect(formatWick(9999n * 10n ** 14n)).toBe("0.999");
    expect(formatWick(TIER_HOLD_WEI)).toBe("1,000");
  });
});

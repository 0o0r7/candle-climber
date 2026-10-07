/// <reference types="bun-types" />
// W5 — burn feed formatting contract (E2.6/P6.5, bun test, zero deps, no RPC).
// The route's chain read is fail-open and exercised on prod E2E; here we pin
// the pure pieces: the burn address constant and human formatting of wei.
import { describe, test, expect } from "bun:test";
import { BURN_ADDRESS } from "@/lib/burn";
import { formatWick, encodeBalanceOf, balanceToTier } from "@/lib/wallet";

describe("burn · constants", () => {
  test("burn address is the canonical 0x…dEaD", () => {
    expect(BURN_ADDRESS).toBe("0x000000000000000000000000000000000000dead");
  });
});

describe("burn · formatting", () => {
  test("wei → human $WICK, 3-decimal truncated", () => {
    expect(formatWick(164944n * 10n ** 18n)).toBe("164,944");
    expect(formatWick(1234n * 10n ** 18n + 567n * 10n ** 15n)).toBe("1,234.567");
    expect(formatWick(1n)).toBe("0"); // whole amounts print without decimals
  });
  test("burn address balanceOf calldata is well-formed", () => {
    const data = encodeBalanceOf(BURN_ADDRESS);
    expect(data.startsWith("0x70a08231")).toBe(true);
    expect(data).toHaveLength(74); // selector + 32-byte padded address
  });
  test("the burn pile itself tiers as WHALE (≥100k WICK)", () => {
    expect(balanceToTier(164944n * 10n ** 18n)).toBe("whale");
  });
});

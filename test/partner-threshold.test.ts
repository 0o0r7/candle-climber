// Partner threshold math pins (PARTNER lane — council 2026-10-12).
// The constants are policy: 5 ETH verified graduation target / 4-partner
// cohort = 1.25 ETH value per partner. Value-denominated, fail-closed on
// unusable price. If any of these pins break, the policy changed — say so
// in the commit, loudly.
import { describe, expect, test } from "bun:test";
import {
  GRADUATION_TARGET_ETH,
  MIN_PARTNER_HOLD_ETH,
  PARTNERS_TO_COVER_CAP,
  GRACE_DAYS,
  meetsThreshold,
  minPartnerHoldUnits,
} from "@/lib/partner-threshold";

describe("partner threshold constants", () => {
  test("policy constants are the council-signed values", () => {
    expect(GRADUATION_TARGET_ETH).toBe(5); // verified platform figure
    expect(PARTNERS_TO_COVER_CAP).toBe(4);
    expect(MIN_PARTNER_HOLD_ETH).toBeCloseTo(1.25);
    expect(GRACE_DAYS).toBe(7);
  });

  test("min units = 1.25 ETH worth of WICK at the given price", () => {
    // price 0.001 ETH/WICK → 1250 WICK = 1.25e21 units
    expect(minPartnerHoldUnits(0.001)).toBe(1_250_000_000_000_000_000_000n);
    // price 0.5 ETH/WICK → 2.5 WICK = 2.5e18 units
    expect(minPartnerHoldUnits(0.5)).toBe(2_500_000_000_000_000_000n);
  });

  test("unusable price → 0n sentinel (fail-closed), never a free pass", () => {
    expect(minPartnerHoldUnits(0)).toBe(0n);
    expect(minPartnerHoldUnits(-1)).toBe(0n);
    expect(minPartnerHoldUnits(Number.NaN)).toBe(0n);
    expect(minPartnerHoldUnits(Number.POSITIVE_INFINITY)).toBe(0n);
  });
});

describe("meetsThreshold", () => {
  test("at/below/above the value line at a normal price", () => {
    const price = 0.001; // 1.25 ETH ⇒ 1250 WICK
    const exact = 1_250_000_000_000_000_000_000n;
    expect(meetsThreshold(exact, price)).toBe(true); // >= passes
    expect(meetsThreshold(exact - 1n, price)).toBe(false); // one unit short
    expect(meetsThreshold(exact * 2n, price)).toBe(true);
  });

  test("value-denominated: same VALUE passes at any price (no cheap-token gaming)", () => {
    // 2.5 WICK at 0.5 ETH ≡ 1250 WICK at 0.001 ETH — both are 1.25 ETH of value
    expect(meetsThreshold(2_500_000_000_000_000_000n, 0.5)).toBe(true);
    expect(meetsThreshold(1_250_000_000_000_000_000_000n, 0.001)).toBe(true);
  });

  test("zero balance and unknown price are rejections", () => {
    expect(meetsThreshold(0n, 0.001)).toBe(false);
    expect(meetsThreshold(10n ** 30n, 0)).toBe(false); // no price → fail-closed
    expect(meetsThreshold(-5n, 0.001)).toBe(false);
  });

  test("cohort property: 4 entries at the threshold = the full graduation raise", () => {
    // The design property the owner asked for ("easily surpass the cap"):
    // each partner holds 1.25 ETH of value → 4 partners ≈ 5 ETH raise target.
    const price = 0.001;
    const one = minPartnerHoldUnits(price);
    const wick = Number(one) / 1e18; // ≈ 1250 WICK
    expect(wick * 4 * price).toBeCloseTo(5);
  });
});

// Partner threshold math pins (PARTNER lane — council 2026-10-12 + the
// 2026-10-12 curve-price discovery). Phase-aware rules:
//   · curve phase  → hold the platform's own max per-wallet position (19.6M)
//   · graduated    → 1.25 ETH value (5 ETH sizing basis / 4-partner cohort)
// If any of these pins break, the policy changed — say so in the commit,
// loudly. Full derivation: the partner-lane design doc.
import { describe, expect, test } from "bun:test";
import {
  GRADUATION_TARGET_ETH,
  MIN_PARTNER_HOLD_ETH,
  PARTNERS_TO_COVER_CAP,
  GRACE_DAYS,
  CURVE_WALLET_CAP_BPS,
  LAUNCH_TAX_BPS,
  CURVE_PHASE_MIN_UNITS,
  meetsThreshold,
  meetsThresholdCurvePhase,
  minPartnerHoldUnits,
} from "@/lib/partner-threshold";

describe("partner threshold constants", () => {
  test("policy constants are the council-signed values", () => {
    expect(GRADUATION_TARGET_ETH).toBe(5); // verified platform figure (sizing basis)
    expect(PARTNERS_TO_COVER_CAP).toBe(4);
    expect(MIN_PARTNER_HOLD_ETH).toBeCloseTo(1.25);
    expect(GRACE_DAYS).toBe(7);
  });

  test("curve-phase constants are the platform's own cap figures", () => {
    expect(CURVE_WALLET_CAP_BPS).toBe(200); // bundle ni = 20M of 1B supply
    expect(LAUNCH_TAX_BPS).toBe(200); // launch record taxBps
    // 1B supply × 2% cap = 20M gross → × 0.98 net-of-tax = 19.6M tokens
    expect(CURVE_PHASE_MIN_UNITS).toBe(19_600_000n * 10n ** 18n);
  });

  test("min units = 1.25 ETH worth of WICK at the given price", () => {
    // price 0.001 ETH/WICK → 1250 WICK = 1.25e21 units
    expect(minPartnerHoldUnits(0.001)).toBe(1_250_000_000_000_000_000_000n);
    // price 0.5 ETH/WICK → 2.5 WICK = 2.5e18 units
    expect(minPartnerHoldUnits(0.5)).toBe(2_500_000_000_000_000_000n);
  });

  test("REAL curve price scale no longer zeroes the value math (1e6-scale bug)", () => {
    // 1.26 gwei — the actual live curve price magnitude. The v0 1e6 fixed
    // point rounded this to 0n (universal fail-closed). The 1e18 scale keeps
    // ~7 significant figures: ≈ 991.5M WICK for 1.25 ETH.
    const price = 1.2629e-9;
    const units = minPartnerHoldUnits(price);
    const wick = Number(units) / 1e18;
    expect(wick).toBeGreaterThan(9.88e8);
    expect(wick).toBeLessThan(9.91e8);
  });

  test("unusable price → 0n sentinel (fail-closed), never a free pass", () => {
    expect(minPartnerHoldUnits(0)).toBe(0n);
    expect(minPartnerHoldUnits(-1)).toBe(0n);
    expect(minPartnerHoldUnits(Number.NaN)).toBe(0n);
    expect(minPartnerHoldUnits(Number.POSITIVE_INFINITY)).toBe(0n);
  });
});

describe("meetsThresholdCurvePhase (the reachable bar)", () => {
  const MIN = 19_600_000n * 10n ** 18n;

  test("at/below/above the curve-phase line", () => {
    expect(meetsThresholdCurvePhase(MIN)).toBe(true);
    expect(meetsThresholdCurvePhase(MIN - 1n)).toBe(false);
    expect(meetsThresholdCurvePhase(20_000_000n * 10n ** 18n)).toBe(true);
  });

  test("the bar is physically reachable: full-cap net proceeds pass, nothing above exists", () => {
    // A wallet buying the full 20M cap receives exactly 19.6M net (2% tax) —
    // the threshold equals the maximum any wallet can hold pre-graduation.
    expect(20_000_000n * 10n ** 18n * 98n / 100n).toBe(MIN);
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
    // each partner holds 1.25 ETH of value → 4 partners ≈ 5 ETH raise target
    // ≥ WICK's own 4 ETH cap with +25% margin (launch record targetPairUnits).
    const price = 0.001;
    const one = minPartnerHoldUnits(price);
    const wick = Number(one) / 1e18; // ≈ 1250 WICK
    expect(wick * 4 * price).toBeCloseTo(5);
  });
});

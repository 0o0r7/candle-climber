// wick-price.ts — the platform's OWN curve formula, pinned against REAL chain
// state. The fixture (wick-launch-live-20261012.json) is the actual live API
// response captured 2026-10-12; the expected figures are re-derived inside the
// test from BigInt first principles rather than trusting the implementation.
// Full derivation: docs/PARTNER-LANE-DESIGN.md §2.
import { describe, expect, test, beforeEach } from "bun:test";
import {
  curvePriceEthPerToken,
  curveModelReserveWei,
  fetchWickPrice,
  resetWickPriceCache,
  HE_SUPPLY_RAW,
  SELL_FEE_BPS,
  WICK_TRADE_URL,
  type LaunchShape,
  type WickPriceRead,
} from "@/lib/wick-price";
import liveFixture from "./fixtures/wick-launch-live-20261012.json";

interface LaunchFixture extends LaunchShape {
  lifecycle: string;
  graduated: boolean;
  targetPairUnits: string;
  curve: { tokensSoldGrossUnits: string; pairReserveUnits: string };
}

const LAUNCH = (liveFixture as { data: { launch: LaunchFixture } }).data.launch;
const TARGET = 4n * 10n ** 18n; // WICK launch record: targetPairUnits = 4 ETH

/** Feed stub returning a fixed launch payload regardless of URL. */
function feed(launch: LaunchShape): (url: string) => Promise<LaunchShape | null> {
  return async () => launch;
}

function okRead(partial: Partial<WickPriceRead>): WickPriceRead {
  return {
    ok: true,
    priceEth: 1.26e-9,
    realizablePriceEth: 1.26e-9,
    source: "curve",
    lifecycle: "CURVE_TRADING",
    graduated: false,
    curvePhase: true,
    meterPct: 0.17,
    reserveWei: "0",
    targetWei: "0",
    soldUnits: "0",
    ...partial,
  };
}

beforeEach(() => {
  resetWickPriceCache();
  delete process.env.WICK_ETH_PRICE;
});

describe("curve formula primitives (BigInt-exact)", () => {
  test("he = 1e27 (1B supply × 1e18)", () => {
    expect(HE_SUPPLY_RAW).toBe(10n ** 27n);
  });

  test("model reserve reproduces BOTH pinned real states to dust level", () => {
    // State 1 — launch record (docs/evidence/wick-launch-record.json):
    const soldA = 73923489188689706025336220n;
    const reserveA = 99285146942017474n; // wei
    const modelA = curveModelReserveWei(soldA, TARGET)!;
    const driftA = Number((absDiff(modelA, reserveA) * 10000n) / reserveA) / 10000;
    expect(driftA).toBeLessThan(0.001); // measured +6e-5

    // State 2 — live fixture (2026-10-12):
    const soldB = BigInt(LAUNCH.curve.tokensSoldGrossUnits as string);
    const reserveB = BigInt(LAUNCH.curve.pairReserveUnits as string);
    const modelB = curveModelReserveWei(soldB, TARGET)!;
    const driftB = Number((absDiff(modelB, reserveB) * 10000n) / reserveB) / 10000;
    expect(driftB).toBeLessThan(0.001); // measured +1e-5
  });

  test("display price matches the platform's curveCapFraction transcription", () => {
    const sold = BigInt(LAUNCH.curve.tokensSoldGrossUnits as string);
    const q = curvePriceEthPerToken(sold, TARGET) as { num: bigint; den: bigint };
    const den0 = 16n * HE_SUPPLY_RAW - 15n * sold;
    expect(q.num).toBe(80n * TARGET * HE_SUPPLY_RAW);
    expect(q.den).toBe(den0 * den0);
    // ETH per token ≈ 1.26 gwei (independently derived)
    const price = Number(q.num) / Number(q.den);
    expect(price).toBeGreaterThan(1.25e-9);
    expect(price).toBeLessThan(1.28e-9);
  });

  test("domain: s=0 is the VALID initial price; past-curve / bad target → null", () => {
    // The platform's own Id() treats sold=0 as the curve's initial state:
    // 80·E/(256·he) = 1.25e-9 ETH/token for E = 4 ETH (a nice pin).
    const initial = curvePriceEthPerToken(0n, TARGET) as { num: bigint; den: bigint };
    expect(Number(initial.num) / Number(initial.den)).toBeCloseTo(1.25e-9, 20);
    expect(curvePriceEthPerToken(2n * HE_SUPPLY_RAW, TARGET)).toBeNull(); // 16he−15s < 0
    expect(curvePriceEthPerToken(10n ** 18n, 0n)).toBeNull(); // zero target
    expect(curveModelReserveWei(0n, TARGET)).toBeNull(); // no sold ⇒ no reserve claim
  });
});

function absDiff(a: bigint, b: bigint): bigint {
  return a > b ? a - b : b - a;
}

describe("fetchWickPrice (live reader, injected feed)", () => {
  test("live fixture → ok, curve source, honest meter + realizable haircut", async () => {
    const read = await fetchWickPrice({ fetchLaunch: feed(LAUNCH) });
    expect(read.ok).toBe(true);
    expect(read.source).toBe("curve");
    expect(read.curvePhase).toBe(true);
    expect(read.lifecycle).toBe("CURVE_TRADING");
    expect(read.graduated).toBe(false);
    expect(read.soldUnits).toBe(LAUNCH.curve.tokensSoldGrossUnits);
    expect(read.reserveWei).toBe(LAUNCH.curve.pairReserveUnits);
    // meter: 6858236637546522 / 4e18 × 100 = 0.1714…%
    expect(read.meterPct).toBeCloseTo(0.1715, 3);
    // realizable = display × (1 − 325/10000)
    expect(read.realizablePriceEth!).toBeCloseTo(read.priceEth! * (1 - SELL_FEE_BPS / 10_000), 20);
  });

  test("reserve invariant violation → fail-closed with reason", async () => {
    const tampered: LaunchFixture = {
      ...LAUNCH,
      curve: { ...LAUNCH.curve, pairReserveUnits: "99900000000000000" }, // ~46% off
    };
    const read = await fetchWickPrice({ fetchLaunch: feed(tampered) });
    expect(read.ok).toBe(false);
    expect(read.error).toContain("curve-state-inconsistent");
  });

  test("graduated lifecycle → curve-phase-only fail-closed (DEX reader queued)", async () => {
    const grad: LaunchFixture = { ...LAUNCH, lifecycle: "GRADUATED", graduated: true };
    const read = await fetchWickPrice({ fetchLaunch: feed(grad) });
    expect(read.ok).toBe(false);
    expect(read.error).toContain("curve-phase-only");
  });

  test("feed down + env override → override wins (owner-verified figure)", async () => {
    process.env.WICK_ETH_PRICE = "0.000000002";
    const read = await fetchWickPrice({ fetchLaunch: async () => null });
    expect(read.ok).toBe(true);
    expect(read.source).toBe("env-override");
    expect(read.priceEth).toBe(2e-9);
    // env override is used as-is for value checks (no curve haircut)
    expect(read.realizablePriceEth).toBe(2e-9);
  });

  test("feed down + no env → fail-closed", async () => {
    const read = await fetchWickPrice({ fetchLaunch: async () => null });
    expect(read.ok).toBe(false);
    expect(read.error).toContain("feed-unavailable");
  });

  test("1h cache: second call does not re-fetch (same payload object)", async () => {
    let calls = 0;
    const f: (url: string) => Promise<LaunchShape | null> = async () => {
      calls += 1;
      return LAUNCH;
    };
    const a = await fetchWickPrice({ fetchLaunch: f });
    const b = await fetchWickPrice({ fetchLaunch: f });
    expect(calls).toBe(1);
    expect(b).toBe(a);
  });
});

describe("verifier wiring (phase-aware, offline)", () => {
  const rpcPad = (n: bigint) => `0x${n.toString(16).padStart(64, "0")}`;
  const rpcAlways = (hex: string) => async () => hex;
  const MIN_CURVE = 19_600_000n * 10n ** 18n;

  test("curve phase → units rule without any price", async () => {
    const { verifyPartner, resetVerifierState } = await import("@/lib/partner-verifier");
    resetVerifierState(); // balance cache is per-wallet + 1h — keep tests independent
    const entry = { id: "w1", walletAddress: "0xAbC0000000000000000000000000000000000001" } as never;
    const v1 = await verifyPartner(entry, { curvePhase: true, ethCall: rpcAlways(rpcPad(MIN_CURVE)) });
    expect(v1.meets).toBe(true);
    resetVerifierState();
    const v2 = await verifyPartner(entry, { curvePhase: true, ethCall: rpcAlways(rpcPad(MIN_CURVE - 1n)) });
    expect(v2.meets).toBe(false);
  });

  test("live read (injected) → curve-phase rule selected from the read", async () => {
    const { verifyPartner, resetVerifierState } = await import("@/lib/partner-verifier");
    resetVerifierState();
    const entry = { id: "w2", walletAddress: "0xAbC0000000000000000000000000000000000002" } as never;
    const v = await verifyPartner(entry, {
      wickPrice: okRead({ curvePhase: true }),
      ethCall: rpcAlways(rpcPad(MIN_CURVE)),
    });
    expect(v.meets).toBe(true);
    expect(v.balanceUnits).toBe(MIN_CURVE.toString());
  });

  test("graduated read → value rule with the reader's realizable price", async () => {
    const { verifyPartner, resetVerifierState } = await import("@/lib/partner-verifier");
    resetVerifierState();
    const entry = { id: "w3", walletAddress: "0xAbC0000000000000000000000000000000000003" } as never;
    // 1.25 ETH at 1e-9 ETH/WICK ⇒ 1.25e27 units required (ceil)
    const v = await verifyPartner(entry, {
      wickPrice: okRead({ curvePhase: false, graduated: true, lifecycle: "GRADUATED", realizablePriceEth: 1e-9 }),
      ethCall: rpcAlways(rpcPad(1_250_000_000_000_000_000_000_000_000n)),
    });
    expect(v.meets).toBe(true);
    resetVerifierState(); // fresh balance for the below-threshold case
    const vShort = await verifyPartner(entry, {
      wickPrice: okRead({ curvePhase: false, graduated: true, lifecycle: "GRADUATED", realizablePriceEth: 1e-9 }),
      ethCall: rpcAlways(rpcPad(1_249_999_999_999_999_999_999_999_999n)),
    });
    expect(vShort.meets).toBe(false);
  });

  test("live read fails + no env → fail-closed with reader reason", async () => {
    const { verifyPartner, resetVerifierState } = await import("@/lib/partner-verifier");
    resetVerifierState();
    const entry = { id: "w4", walletAddress: "0xAbC0000000000000000000000000000000000004" } as never;
    const v = await verifyPartner(entry, {
      wickPrice: {
        ok: false, priceEth: null, realizablePriceEth: null, source: null,
        lifecycle: null, graduated: null, curvePhase: false, meterPct: 0,
        reserveWei: null, targetWei: null, soldUnits: null, error: "feed-unavailable",
      },
      ethCall: async () => "0x00",
    });
    expect(v.meets).toBeNull();
    expect(v.reason).toContain("price-reader: feed-unavailable");
  });
});

describe("constants", () => {
  test("trade URL is the token's own page on the launch platform", () => {
    expect(WICK_TRADE_URL).toBe("https://testnet.vibevibe.fun/token/0xe2ce0be4e3d420c1e4b5c46493b3d5e03595216c");
  });
});

// wick-price.ts — the platform's OWN prices, pinned against REAL chain state.
// Curve phase: the platform's own formula, fixture = the actual live API
// response captured 2026-10-12; expected figures re-derived inside the test
// from BigInt first principles rather than trusting the implementation.
// Graduated phase: the launch's OWN V4 pool read live on-chain (PoolManager
// extsload slot0), pinned byte-exact against THREE independent sources via
// the real graduated launch fixture (vibe-graduated-beef-20261012.json).
// Full derivation: docs/PARTNER-LANE-DESIGN.md §2 + §4b.
import { describe, expect, test, beforeEach } from "bun:test";
import {
  curvePriceEthPerToken,
  curveModelReserveWei,
  dexPriceEthPerToken,
  decodeSlot0Word,
  poolStateKeyHex,
  validateGraduationPool,
  fetchWickPrice,
  resetWickPriceCache,
  HE_SUPPLY_RAW,
  SELL_FEE_BPS,
  DEX_SELL_FEE_BPS,
  TWO_96,
  WICK_TRADE_URL,
  type LaunchShape,
  type WickPriceRead,
} from "@/lib/wick-price";
import liveFixture from "./fixtures/wick-launch-live-20261012.json";
import beefFixture from "./fixtures/vibe-graduated-beef-20261012.json";

interface LaunchFixture extends LaunchShape {
  lifecycle: string;
  graduated: boolean;
  targetPairUnits: string;
  curve: { tokensSoldGrossUnits: string; pairReserveUnits: string };
}

interface GradFixture {
  poolId: string;
  pairUnits: string;
  tokenUnits: string;
  poolLiquidity: string;
  poolInitialSqrtPriceX96: string;
}

const LAUNCH = (liveFixture as { data: { launch: LaunchFixture } }).data.launch;
const TARGET = 4n * 10n ** 18n; // WICK launch record: targetPairUnits = 4 ETH

/** The REAL graduated launch (BEEF) — three-source byte-exact evidence. */
const BEEF = beefFixture as {
  launch: LaunchFixture & { graduation: GradFixture };
  onchain: {
    storageKeyHex: string;
    slot0Word: string;
    decoded: { sqrtPriceX96: string; tick: number; protocolFee: number; lpFee: number };
  };
  swapEvent: { sqrtPriceX96: string; tick: number; fee: number };
  feeEvidence: { pinnedConservativeBps: number };
};

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

  test("graduated launch without a pool binding → fail-closed (no guessing)", async () => {
    const grad: LaunchFixture = { ...LAUNCH, lifecycle: "GRADUATED", graduated: true };
    const read = await fetchWickPrice({ fetchLaunch: feed(grad) });
    expect(read.ok).toBe(false);
    expect(read.error).toContain("graduated-state-incomplete");
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

describe("dex pool reader (post-graduation, BEEF evidence)", () => {
  const GRAD = BEEF.launch.graduation;
  const WORD = BigInt(BEEF.onchain.slot0Word);

  test("encoding validated against the platform's OWN graduation math", () => {
    // (sqrtInit/2^96)² must equal pairUnits/tokenUnits — the initial pool
    // price IS the graduation ratio (both from the launch record itself).
    const q0 = dexPriceEthPerToken(BigInt(GRAD.poolInitialSqrtPriceX96))!;
    const price0 = Number(q0.num) / Number(q0.den);
    const ratio = Number(BigInt(GRAD.pairUnits)) / Number(BigInt(GRAD.tokenUnits));
    expect(Math.abs(price0 - ratio) / ratio).toBeLessThan(1e-6); // measured: exact
    expect(ratio).toBeCloseTo(2e-8, 15); // 4 ETH / 200M tokens

    // poolLiquidity² = pairUnits · tokenUnits (L = √(x·y))
    const liq = BigInt(GRAD.poolLiquidity);
    const rel = Number(liq * liq - BigInt(GRAD.pairUnits) * BigInt(GRAD.tokenUnits));
    expect(Math.abs(rel) / Number(BigInt(GRAD.pairUnits) * BigInt(GRAD.tokenUnits))).toBeLessThan(1e-9);
  });

  test("slot0 word decodes to the same sqrtPriceX96 + tick as the V4 Swap event", () => {
    const s0 = decodeSlot0Word(WORD);
    expect(s0.sqrtPriceX96).toBe(BigInt(BEEF.swapEvent.sqrtPriceX96));
    expect(s0.sqrtPriceX96).toBe(BigInt(BEEF.onchain.decoded.sqrtPriceX96));
    expect(s0.tick).toBe(BEEF.swapEvent.tick);
    expect(s0.protocolFee).toBe(0);
    expect(s0.lpFee).toBe(0); // fees are hook-charged — pinned in feeEvidence
  });

  test("live price derivation (BigInt first principles, float only at the end)", () => {
    const s0 = decodeSlot0Word(WORD);
    const q = dexPriceEthPerToken(s0.sqrtPriceX96)!;
    // re-derive by hand: (2^96 / sqrtP)²
    const hand = Number(TWO_96 * TWO_96) / Number(s0.sqrtPriceX96 * s0.sqrtPriceX96);
    expect(Number(q.num) / Number(q.den)).toBeCloseTo(hand, 30);
    // BEEF live: ≈ 1.06e-9 ETH/token (down from the 2e-8 graduation price)
    expect(hand).toBeGreaterThan(1.05e-9);
    expect(hand).toBeLessThan(1.07e-9);
    expect(dexPriceEthPerToken(0n)).toBeNull();
  });

  test("poolStateKeyHex reproduces the on-chain-proven storage key", () => {
    expect(poolStateKeyHex(GRAD.poolId)).toBe(BEEF.onchain.storageKeyHex);
    expect(() => poolStateKeyHex("0x1234")).toThrow(); // malformed poolId
  });

  test("validateGraduationPool: real launch passes, tampering fails", () => {
    expect(validateGraduationPool(GRAD).ok).toBe(true);
    const drift: GradFixture = {
      ...GRAD,
      poolInitialSqrtPriceX96: (BigInt(GRAD.poolInitialSqrtPriceX96) * 11n / 10n).toString(),
    };
    const r1 = validateGraduationPool(drift);
    expect(r1.ok).toBe(false);
    if (!r1.ok) expect(r1.reason).toContain("initial-price drift");
    const liq: GradFixture = { ...GRAD, poolLiquidity: (BigInt(GRAD.poolLiquidity) * 101n / 100n).toString() };
    const r2 = validateGraduationPool(liq);
    expect(r2.ok).toBe(false);
    if (!r2.ok) expect(r2.reason).toContain("liquidity mismatch");
    expect(validateGraduationPool({ poolId: GRAD.poolId }).ok).toBe(false);
  });

  test("fetchWickPrice: graduated launch + on-chain slot0 → ok dex-pool read", async () => {
    const read = await fetchWickPrice({
      fetchLaunch: feed(BEEF.launch),
      ethCall: async () => BEEF.onchain.slot0Word,
    });
    expect(read.ok).toBe(true);
    expect(read.source).toBe("dex-pool");
    expect(read.curvePhase).toBe(false);
    expect(read.graduated).toBe(true);
    expect(read.meterPct).toBe(100);
    expect(read.poolId).toBe(GRAD.poolId);
    const s0 = decodeSlot0Word(WORD);
    const expected = Number(TWO_96 * TWO_96) / Number(s0.sqrtPriceX96 * s0.sqrtPriceX96);
    expect(read.priceEth).toBeCloseTo(expected, 30);
    // realizable = display × (1 − 200/10000) — the MEASURED worst-case fee
    expect(read.realizablePriceEth).toBeCloseTo(expected * (1 - DEX_SELL_FEE_BPS / 10_000), 30);
    expect(DEX_SELL_FEE_BPS).toBe(BEEF.feeEvidence.pinnedConservativeBps);
  });

  test("dex rpc down → fail-closed; env override still carries the figure", async () => {
    const read = await fetchWickPrice({ fetchLaunch: feed(BEEF.launch), ethCall: async () => null });
    expect(read.ok).toBe(false);
    expect(read.error).toContain("dex-rpc-unavailable");
    expect(read.poolId).toBe(GRAD.poolId);

    process.env.WICK_ETH_PRICE = "0.000000002";
    const overridden = await fetchWickPrice({ fetchLaunch: feed(BEEF.launch), ethCall: async () => null });
    expect(overridden.ok).toBe(true);
    expect(overridden.source).toBe("env-override");
  });

  test("zeroed slot0 → fail-closed (unknown poolId on-chain)", async () => {
    const zeroWord = "0x" + "00".repeat(32);
    const read = await fetchWickPrice({ fetchLaunch: feed(BEEF.launch), ethCall: async () => zeroWord });
    expect(read.ok).toBe(false);
    expect(read.error).toContain("dex-state-inconsistent");
  });

  test("inconsistent graduation figures → fail-closed before any RPC call", async () => {
    let rpcCalled = 0;
    const tampered = {
      ...BEEF.launch,
      graduation: { ...GRAD, poolInitialSqrtPriceX96: (BigInt(GRAD.poolInitialSqrtPriceX96) * 2n).toString() },
    };
    const read = await fetchWickPrice({
      fetchLaunch: feed(tampered),
      ethCall: async () => {
        rpcCalled += 1;
        return BEEF.onchain.slot0Word;
      },
    });
    expect(read.ok).toBe(false);
    expect(read.error).toContain("graduated-state-inconsistent");
    expect(rpcCalled).toBe(0); // never trusted the pool after the invariant failed
  });

  test("unknown future lifecycle → fail-closed (never guess)", async () => {
    const weird: LaunchFixture = { ...LAUNCH, lifecycle: "MIGRATING", graduated: false };
    const read = await fetchWickPrice({ fetchLaunch: feed(weird) });
    expect(read.ok).toBe(false);
    expect(read.error).toContain("unsupported lifecycle");
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

  test("dex-pool read → value rule with the reader's realizable price", async () => {
    const { verifyPartner, resetVerifierState } = await import("@/lib/partner-verifier");
    resetVerifierState();
    const entry = { id: "w5", walletAddress: "0xAbC0000000000000000000000000000000000005" } as never;
    const v = await verifyPartner(entry, {
      wickPrice: okRead({ source: "dex-pool", curvePhase: false, graduated: true, lifecycle: "GRADUATED", realizablePriceEth: 1e-9 }),
      ethCall: rpcAlways(rpcPad(1_250_000_000_000_000_000_000_000_000n)),
    });
    expect(v.meets).toBe(true);
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

// Partner-verifier contract (PARTNER lane, council 2026-10-12).
// Pins the fail-closed guarantees end to end:
//  - the pure status machine (verified / grace / delisted / unverified)
//  - an unverifiable check NEVER advances or clears the grace clock
//  - an unprovable state never lists a partner (no price → no listing)
//  - the threshold integration (meetsThreshold ↔ minPartnerHoldUnits)
// No network: the eth_call transport and the price are injected per test.
import { describe, expect, test, beforeEach } from "bun:test";
import {
  partnerStatus,
  verifyPartner,
  readWickPriceEth,
  resetVerifierState,
  GRACE_MS,
} from "@/lib/partner-verifier";
import { minPartnerHoldUnits } from "@/lib/partner-threshold";
import type { PartnerEntry } from "@/lib/partner-registry";

const NOW = 1_791_900_000_000; // fixed epoch ms — no Date.now() anywhere
const DAY = 86_400_000;

const ENTRY: PartnerEntry = {
  id: "test-guild",
  projectName: "Test Guild",
  symbol: "TST",
  tokenAddress: "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa1",
  walletAddress: "0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb2",
  addedAt: "2026-10-12",
};

// WICK price used across tests: 0.001 ETH per WICK → 1.25 ETH = 1250 WICK
const PRICE = 0.001;

function weiResult(units: bigint): string {
  return "0x" + units.toString(16);
}

/** An eth_call transport that always answers with `units` of $WICK. */
function rpcAlways(units: bigint) {
  return async (_to: string, _data: string) => weiResult(units);
}
const rpcDead = async () => null;

describe("partnerStatus (pure state machine)", () => {
  test("meets → verified; the clock clears", () => {
    const s = partnerStatus(true, 1000, NOW);
    expect(s.status).toBe("verified");
    expect(s.belowSince).toBeNull();
    expect(s.graceEndsAt).toBeNull();
  });

  test("first definitive miss starts the 7-day grace clock", () => {
    const s = partnerStatus(false, null, NOW);
    expect(s.status).toBe("grace");
    expect(s.belowSince).toBe(NOW);
    expect(s.graceEndsAt).toBe(NOW + GRACE_MS);
  });

  test("within grace the slot survives with an end date", () => {
    const s = partnerStatus(false, NOW - 3 * DAY, NOW);
    expect(s.status).toBe("grace");
    expect(s.graceEndsAt).toBe(NOW - 3 * DAY + GRACE_MS);
  });

  test("grace exhausted → delisted", () => {
    expect(partnerStatus(false, NOW - GRACE_MS, NOW).status).toBe("delisted");
    expect(partnerStatus(false, NOW - 8 * DAY, NOW).status).toBe("delisted");
  });

  test("unverifiable check (meets=null) never starts the clock", () => {
    const s = partnerStatus(null, null, NOW);
    expect(s.status).toBe("unverified");
    expect(s.belowSince).toBeNull();
  });

  test("unverifiable check during active grace PRESERVES the state — infra outages never delist", () => {
    const belowSince = NOW - 3 * DAY;
    const s = partnerStatus(null, belowSince, NOW);
    expect(s.status).toBe("grace");
    expect(s.belowSince).toBe(belowSince);
    // and it can never EXTEND beyond the original 7 days either
    const expired = partnerStatus(null, NOW - GRACE_MS - 1, NOW);
    expect(expired.status).toBe("delisted");
  });
});

describe("verifyPartner (injected transport — fail-closed end to end)", () => {
  beforeEach(() => resetVerifierState());

  test("balance at exactly the threshold passes (>= is the rule)", async () => {
    const units = minPartnerHoldUnits(PRICE); // exact threshold in 18-dec units
    expect(units > 0n).toBe(true);
    const v = await verifyPartner(ENTRY, { now: NOW, priceEth: PRICE, ethCall: rpcAlways(units) });
    expect(v.meets).toBe(true);
    expect(v.status).toBe("verified");
    expect(v.balanceUnits).toBe(units.toString());
    expect(v.reason).toBeUndefined();
  });

  test("one unit below the threshold fails into grace, not delisted", async () => {
    const units = minPartnerHoldUnits(PRICE) - 1n;
    const v = await verifyPartner(ENTRY, { now: NOW, priceEth: PRICE, ethCall: rpcAlways(units) });
    expect(v.meets).toBe(false);
    expect(v.status).toBe("grace");
    expect(v.belowSince).toBe(NOW);
    expect(v.graceEndsAt).toBe(NOW + GRACE_MS);
  });

  test("recovery: a later passing check clears the grace clock", async () => {
    const low = minPartnerHoldUnits(PRICE) - 1n;
    const high = minPartnerHoldUnits(PRICE);
    await verifyPartner(ENTRY, { now: NOW, priceEth: PRICE, ethCall: rpcAlways(low) });
    const v2 = await verifyPartner(ENTRY, { now: NOW + DAY, priceEth: PRICE, ethCall: rpcAlways(high) });
    expect(v2.status).toBe("verified");
    expect(v2.belowSince).toBeNull();
  });

  test("definitive miss held past GRACE_DAYS delists", async () => {
    const low = minPartnerHoldUnits(PRICE) - 1n;
    const first = await verifyPartner(ENTRY, { now: NOW, priceEth: PRICE, ethCall: rpcAlways(low) });
    expect(first.status).toBe("grace");
    const later = await verifyPartner(ENTRY, {
      now: NOW + GRACE_MS + DAY,
      priceEth: PRICE,
      ethCall: rpcAlways(low),
      cache: new Map(), // fresh balance read, same definitive answer
    });
    expect(later.status).toBe("delisted");
    expect(later.graceEndsAt).toBeNull();
  });

  test("no verified price → unverified even with a whale balance (honest-by-default)", async () => {
    const v = await verifyPartner(ENTRY, {
      now: NOW,
      priceEth: null,
      ethCall: rpcAlways(10n ** 24n),
    });
    expect(v.meets).toBeNull();
    expect(v.status).toBe("unverified");
    expect(v.reason).toBe("no-verified-price");
    expect(v.balanceUnits).toBeNull();
    // and the clock did NOT start — an unlisted token cannot punish anyone
    expect(v.belowSince).toBeNull();
  });

  test("RPC failure → unverified, clock untouched", async () => {
    // establish an active grace clock first
    const low = minPartnerHoldUnits(PRICE) - 1n;
    await verifyPartner(ENTRY, { now: NOW, priceEth: PRICE, ethCall: rpcAlways(low) });
    // then the RPC dies — the partner keeps grace with the ORIGINAL clock
    const v = await verifyPartner(ENTRY, {
      now: NOW + DAY,
      priceEth: PRICE,
      ethCall: rpcDead,
      cache: new Map(),
    });
    expect(v.meets).toBeNull();
    expect(v.status).toBe("grace");
    expect(v.reason).toBe("rpc-unavailable");
    expect(v.belowSince).toBe(NOW);
  });

  test("price sanity: the threshold moves inversely with the verified price", () => {
    // documents WHY the threshold is value-denominated — the units check is a
    // moving target, the VALUE (1.25 ETH) is the invariant
    const cheap = minPartnerHoldUnits(0.0001);
    const pricey = minPartnerHoldUnits(0.01);
    expect(cheap > pricey).toBe(true);
  });
});

describe("readWickPriceEth (env hygiene)", () => {
  test("unset → null; garbage → null (fail-closed); valid → number", () => {
    expect(readWickPriceEth({})).toBeNull();
    expect(readWickPriceEth({ WICK_ETH_PRICE: "" })).toBeNull();
    expect(readWickPriceEth({ WICK_ETH_PRICE: "abc" })).toBeNull();
    expect(readWickPriceEth({ WICK_ETH_PRICE: "-1" })).toBeNull();
    expect(readWickPriceEth({ WICK_ETH_PRICE: "0" })).toBeNull();
    expect(readWickPriceEth({ WICK_ETH_PRICE: "0.001" })).toBe(0.001);
  });
});

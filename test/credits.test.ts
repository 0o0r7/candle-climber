/// <reference types="bun-types" />
// RESCUE economy — contract tests (bun test).
// Pins the rules documented in docs/RESCUE-ECONOMY.md:
//  1. Credits are a SEPARATE number from the ranked score: earned by play only,
//     never bought, never a token, never able to raise reach or physics.
//  2. One price, one cap: a fixed rescue cost that a normal run can reach by
//     climbing, and ONE rescue per run.
//  3. The wallet can never go negative and never be inflated by a malformed
//     save; a spend refuses rather than overdrawing.
//  4. The engine's live accrual and the wallet's bank use the SAME curve.
import { describe, test, expect } from "bun:test";
import {
  CREDIT_PER_CANDLE, CREDIT_PER_STYLE, CREDIT_RUN_BONUS, CREDIT_GRADUATION,
  CREDIT_WORLD2, MAX_BALANCE, MAX_RESCUES_PER_RUN, RESCUE_COST,
  addCredits, creditsForRun, emptyWallet, loadWallet, planRescue, saveWallet,
  spendCredits,
} from "@/lib/credits";
import { Engine } from "@/game/cc/engine";
import { MAX_RESCUE_TAG, validateSubmission } from "@/lib/board-validation";
import { COSMETICS, buyCosmetic, cosmeticById, loadOwned } from "@/lib/cosmetics";
import { PLATFORM_W } from "@/game/cc/level";
import type { Platform } from "@/game/cc/types";

const DT = 1 / 60;
const NOW = 1_700_000_000_000;

function plat(i: number, y = 0): Platform {
  return {
    i, x: i * PLATFORM_W, y, w: PLATFORM_W, up: true,
    state: "solid", passed: false, crumble: false,
  } as Platform;
}

function flatPlats(n: number) {
  const out: Platform[] = [];
  for (let i = 0; i < n; i++) out.push(plat(i));
  return out;
}

describe("credit curve", () => {
  test("a run mints bonus + candles + STYLE events, and the milestones pay once", () => {
    expect(creditsForRun({ candlesPassed: 0, graduated: false, world2: false })).toBe(CREDIT_RUN_BONUS);
    expect(creditsForRun({ candlesPassed: 10, styleEvents: 2, graduated: false, world2: false }))
      .toBe(CREDIT_RUN_BONUS + 10 * CREDIT_PER_CANDLE + 2 * CREDIT_PER_STYLE);
    expect(creditsForRun({ candlesPassed: 10, graduated: true, world2: false }))
      .toBe(CREDIT_RUN_BONUS + 10 * CREDIT_PER_CANDLE + CREDIT_GRADUATION);
    expect(creditsForRun({ candlesPassed: 10, graduated: true, world2: true }))
      .toBe(CREDIT_RUN_BONUS + 10 * CREDIT_PER_CANDLE + CREDIT_GRADUATION + CREDIT_WORLD2);
  });

  test("junk input can never mint credits", () => {
    expect(creditsForRun({ candlesPassed: -50, styleEvents: -3, graduated: false, world2: false }))
      .toBe(CREDIT_RUN_BONUS);
    expect(creditsForRun({ candlesPassed: NaN, graduated: false, world2: false })).toBe(CREDIT_RUN_BONUS);
  });

  test("the rescue price is reachable from play alone (no purchase path exists)", () => {
    // 10 bonus + 40 candles × 2 = exactly the price
    expect(creditsForRun({ candlesPassed: 40, graduated: false, world2: false })).toBe(RESCUE_COST);
    expect(MAX_RESCUES_PER_RUN).toBe(1);
  });

  test("the engine accrues the SAME curve it is banked with", () => {
    const e = new Engine(flatPlats(80), { onDeath: () => {}, onScore: () => {} }, undefined, "credits-curve");
    for (let i = 0; i < 300; i++) e.step(DT);
    const styleEvents = e.styleLate + e.styleSave;
    expect(e.credits).toBe(
      CREDIT_RUN_BONUS + e.candlesPassed * CREDIT_PER_CANDLE + styleEvents * CREDIT_PER_STYLE,
    );
    expect(e.credits).toBe(creditsForRun({
      candlesPassed: e.candlesPassed,
      styleEvents,
      graduated: e.graduated,
      world2: e.world2,
    }));
  });
});

describe("wallet", () => {
  test("starts empty and survives a malformed save", () => {
    expect(loadWallet(null)).toEqual(emptyWallet());
    expect(loadWallet("not json").balance).toBe(0);
    expect(loadWallet(JSON.stringify({ balance: "999999999999" })).balance).toBe(MAX_BALANCE);
    expect(loadWallet(JSON.stringify({ balance: -10 })).balance).toBe(0);
  });

  test("banking adds to balance and lifetime earnings, and round-trips", () => {
    const w = addCredits(emptyWallet(), 90, NOW);
    expect(w.balance).toBe(90);
    expect(w.earned).toBe(90);
    expect(loadWallet(saveWallet(w))).toEqual(w);
  });

  test("spending refuses to overdraw — the wallet never goes negative", () => {
    const broke = loadWallet(JSON.stringify({ balance: 50 }));
    const refused = spendCredits(broke, RESCUE_COST, NOW);
    expect(refused.ok).toBe(false);
    if (!refused.ok) expect(refused.shortfall).toBe(RESCUE_COST - 50);

    const rich = addCredits(emptyWallet(), 200, NOW);
    const paid = spendCredits(rich, RESCUE_COST, NOW);
    expect(paid.ok).toBe(true);
    if (paid.ok) {
      expect(paid.wallet.balance).toBe(200 - RESCUE_COST);
      expect(paid.wallet.spent).toBe(RESCUE_COST);
      expect(paid.wallet.earned).toBe(200);
    }
  });
});

describe("board tagging (the score is never altered)", () => {
  const tok = { symbol: "ETHUSDT", date: "2026-11-11", interval: "1w", count: 220 } as never;
  const base = { name: "TESTER", score: 900, candlesPassed: 40, bestStreak: 3 };

  test("a rescued run is tagged, and its score is untouched", () => {
    const v = validateSubmission({ ...base, rescues: 1 }, tok, NOW, null);
    expect(v.ok).toBe(true);
    if (v.ok) {
      expect(v.entry.rescues).toBe(1);
      expect(v.entry.score).toBe(base.score); // tagging never changes the score
      expect(v.entry.board).toBe("guest");
    }
  });

  test("a clean run carries no tag (legacy rows stay byte-identical)", () => {
    const v = validateSubmission({ ...base, rescues: 0 }, tok, NOW, null);
    expect(v.ok).toBe(true);
    if (v.ok) expect("rescues" in v.entry).toBe(false);
  });

  test("a forged count is clamped and still cannot inflate a score", () => {
    const v = validateSubmission({ ...base, rescues: 999 }, tok, NOW, null);
    expect(v.ok).toBe(true);
    if (v.ok) expect(v.entry.rescues).toBe(MAX_RESCUE_TAG);
  });
});

describe("trophy case (the non-competitive sink)", () => {
  test("a cosmetic costs credits and gives back only a decoration", () => {
    const wallet = addCredits(emptyWallet(), 500, NOW);
    const res = buyCosmetic(wallet, [], "flare", NOW);
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.owned).toEqual(["flare"]);
      expect(res.wallet.balance).toBe(500 - (COSMETICS[0].cost ?? 0));
      expect(res.wallet.spent).toBe(COSMETICS[0].cost ?? 0);
    }
  });

  test("no double-buy, no unknown id, and a short wallet is refused untouched", () => {
    const wallet = addCredits(emptyWallet(), 200, NOW);
    expect(buyCosmetic(wallet, ["flare"], "flare", NOW)).toEqual({ ok: false, reason: "owned", def: cosmeticById("flare") });
    expect(buyCosmetic(wallet, [], "nope", NOW).ok).toBe(false);

    const rich = addCredits(emptyWallet(), 200, NOW);
    const short = buyCosmetic(wallet, [], "oath", NOW); // 480 > 200
    expect(short.ok).toBe(false);
    if (!short.ok) expect(short.reason).toBe("short");
    expect(rich.balance).toBe(200); // the wallet passed in is never mutated
  });

  test("a hand-edited owned list cannot smuggle in unknown ids", () => {
    expect(loadOwned(JSON.stringify(["flare", "hack", "flare", 42]))).toEqual(["flare"]);
    expect(loadOwned("not json")).toEqual([]);
    expect(loadOwned(null)).toEqual([]);
  });
});

describe("rescue purchase plan", () => {
  test("run credits are spent first, the wallet covers the rest", () => {
    const wallet = addCredits(emptyWallet(), 300, NOW);
    expect(planRescue(50, wallet)).toEqual({ fromRun: 50, fromWallet: RESCUE_COST - 50 });
    expect(planRescue(500, wallet)).toEqual({ fromRun: RESCUE_COST, fromWallet: 0 });
  });

  test("an unaffordable purchase plans nothing (the panel disables the button)", () => {
    expect(planRescue(0, emptyWallet())).toBeNull();
    expect(planRescue(20, addCredits(emptyWallet(), 20, NOW))).toBeNull();
  });
});

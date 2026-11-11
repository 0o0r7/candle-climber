// CLIMB CREDITS — the spendable in-game currency behind the RESCUE mechanic.
//
// WHY IT EXISTS (docs/RESCUE-ECONOMY.md): the ranked score is, by law, a
// skill-only number you cannot buy into (ECONOMY-LAWS LAW 1.3). A player's
// performance therefore had no *spendable* counterpart — nothing to save,
// nothing to decide. Credits are that counterpart: earned by climbing, spent on
// ONE voluntary second chance per run, never purchasable, never a token, and
// never able to raise reach, speed or the physics any run is played on.
//
// THREE SEPARATE NUMBERS, stated once so no caller can blur them:
//   score    — the ranked number (leaderboard, skill only, never spent)
//   credits  — this wallet (earned from play, spent on rescues)
//   token    — the product token ($WICK, a different system; NOTHING here touches it)
//
// POSTURE: pure functions, no clock, no storage, every input clamped — same
// contract style as lib/career.ts. The caller owns localStorage, so a
// hand-edited save can inflate its own credits and its own rescue count, but
// never the submitted score (the run token pins that).

export const CREDITS_KEY = "cc_credits_v1";

/** Earning curve — ONE definition, imported by the engine (live accrual) and by
 *  creditsForRun (the contract total the tests compare against). */
export const CREDIT_PER_CANDLE = 2;
export const CREDIT_PER_STYLE = 3; // per STYLE event (LATE hop / SAVE)
export const CREDIT_RUN_BONUS = 10; // showing up counts
export const CREDIT_GRADUATION = 100;
export const CREDIT_WORLD2 = 100;
/** A single run can never mint more than this (clamps absurd local saves and a
 *  forged int somewhere down the line). */
export const MAX_RUN_CREDITS = 100_000;

/** Rescue price — FIXED for the first version, deliberately reachable from play
 *  alone: 10 (run bonus) + 40 candles × 2 = exactly 90. A player who reaches
 *  candle 40 earns one rescue inside that same run. */
export const RESCUE_COST = 90;
/** One rescue per run: the second chance is a decision, not a life counter. */
export const MAX_RESCUES_PER_RUN = 1;
/** Wallet ceiling — generous, bounded (nothing in the game can reach it). */
export const MAX_BALANCE = 1_000_000;

export interface CreditWallet {
  v: 1;
  balance: number;
  /** lifetime minted / burned, display + /ops material */
  earned: number;
  spent: number;
  updated: number;
}

export function emptyWallet(): CreditWallet {
  return { v: 1, balance: 0, earned: 0, spent: 0, updated: 0 };
}

const clampInt = (v: unknown, max: number): number => {
  const n = Math.floor(Number(v));
  return Number.isFinite(n) && n > 0 ? Math.min(n, max) : 0;
};

/** Parse a persisted wallet; any malformed shape falls back to empty. */
export function loadWallet(raw: string | null): CreditWallet {
  if (!raw) return emptyWallet();
  try {
    const j = JSON.parse(raw) as Partial<CreditWallet> | null;
    if (!j || typeof j !== "object") return emptyWallet();
    return {
      v: 1,
      balance: clampInt(j.balance, MAX_BALANCE),
      earned: clampInt(j.earned, 1e9),
      spent: clampInt(j.spent, 1e9),
      updated: clampInt(j.updated, 8.64e15),
    };
  } catch {
    return emptyWallet();
  }
}

export function saveWallet(w: CreditWallet): string {
  return JSON.stringify(w);
}

/** Bank credits earned by play. Pure — returns the NEXT wallet. */
export function addCredits(w: CreditWallet, amount: number, now: number): CreditWallet {
  const gain = clampInt(amount, MAX_RUN_CREDITS);
  if (gain === 0) return w;
  const balance = Math.min(MAX_BALANCE, w.balance + gain);
  return {
    v: 1,
    balance,
    earned: w.earned + gain,
    spent: w.spent,
    updated: Math.max(0, Math.floor(now)),
  };
}

export type SpendResult =
  | { ok: true; wallet: CreditWallet; spent: number }
  | { ok: false; wallet: CreditWallet; shortfall: number };

/** Spend credits. Refuses (ok:false) rather than going negative — the guard
 *  against a double-click buying two rescues is the engine's own rescue cap,
 *  this is the balance guard. */
export function spendCredits(w: CreditWallet, amount: number, now: number): SpendResult {
  const cost = clampInt(amount, MAX_BALANCE);
  if (cost === 0) return { ok: true, wallet: w, spent: 0 };
  if (w.balance < cost) return { ok: false, wallet: w, shortfall: cost - w.balance };
  return {
    ok: true,
    spent: cost,
    wallet: {
      v: 1,
      balance: w.balance - cost,
      earned: w.earned,
      spent: w.spent + cost,
      updated: Math.max(0, Math.floor(now)),
    },
  };
}

/** One rescue purchase, split across what the run has minted so far and what
 *  the wallet already holds (run credits are spent first — they exist only for
 *  this run and would otherwise be banked at its end).
 *  Returns null when the two pools cannot cover the price. */
export function planRescue(
  runCredits: number,
  wallet: CreditWallet,
): { fromRun: number; fromWallet: number } | null {
  const run = clampInt(runCredits, MAX_RUN_CREDITS);
  const fromRun = Math.min(run, RESCUE_COST);
  const fromWallet = RESCUE_COST - fromRun;
  if (wallet.balance < fromWallet) return null;
  return { fromRun, fromWallet };
}

export interface CreditRunInput {
  candlesPassed: number;
  /** STYLE events (LATE + SAVE counts, not points). */
  styleEvents?: number;
  graduated: boolean;
  world2: boolean;
}

/** Credits ONE finished run minted — the contract total. The engine accrues the
 *  same value live through the same constants (test/credits.test.ts pins the
 *  two together, so the HUD can never drift from the bank). */
export function creditsForRun(r: CreditRunInput): number {
  const candles = clampInt(r.candlesPassed, 10_000);
  const style = clampInt(r.styleEvents, 10_000);
  let total = CREDIT_RUN_BONUS + candles * CREDIT_PER_CANDLE + style * CREDIT_PER_STYLE;
  if (r.graduated) total += CREDIT_GRADUATION;
  if (r.world2) total += CREDIT_WORLD2;
  return Math.min(MAX_RUN_CREDITS, total);
}

// Graduation gate (E6.2 — ECONOMY-CHECKLIST: "post-grad flags staged: coded
// behind a `graduated` gate, flipped only after the tx"). Pre-grad facts that
// pin this design (WICK-ECONOMY-SPEC §1/§8):
//   · lifecycle CURVE_TRADING, transfersUnlocked false — spend/burn lanes are
//     ILLEGAL pre-grad, so every post-grad lane must default CLOSED.
//   · the graduation signal is the pad API launch record (`graduated` /
//     `lifecycle`), verified live 2026-10-10 (shape pinned in
//     docs/evidence/econ-snapshot-latest.json).
// Fail-CLOSED on purpose: an API outage must never look like a graduation —
// the gate opens ONLY on a positive pad-API `graduated:true` (or the operator
// env override GRADUATED=1 for staging/tests after the tx is confirmed).
import { WICK_TOKEN_ADDRESS } from "@/lib/wallet";

const PAD_LAUNCH_URL =
  process.env.PAD_API_URL ??
  `https://testnet.vibevibe.fun/api/v1/chains/46630/v6/launches/${WICK_TOKEN_ADDRESS}`;

const CACHE_MS = 15 * 60_000; // graduation is a one-way event — 15 min is plenty
let cache: { t: number; value: boolean } | null = null;

export interface GradState {
  graduated: boolean;
  source: "env-override" | "pad-api" | "default-pre-grad";
  checkedAt: number;
}

/** Pure decision: env override wins, else the cached pad read, else pre-grad. */
export function gradFromInputs(envGrad: string | undefined, padGraduated: boolean | null): Omit<GradState, "checkedAt"> {
  if (envGrad === "1" || envGrad === "true") return { graduated: true, source: "env-override" };
  if (padGraduated === true) return { graduated: true, source: "pad-api" };
  if (padGraduated === false) return { graduated: false, source: "pad-api" };
  return { graduated: false, source: "default-pre-grad" }; // fail-closed (API down/unknown)
}

async function readPadGraduated(): Promise<boolean | null> {
  try {
    const res = await fetch(PAD_LAUNCH_URL, {
      headers: { "User-Agent": "candle-climber/grad-gate" },
      signal: AbortSignal.timeout(8_000),
    });
    if (!res.ok) return null;
    const json = (await res.json()) as {
      data?: { launch?: { graduated?: boolean; lifecycle?: string } };
    };
    const l = json?.data?.launch;
    if (typeof l?.graduated === "boolean") return l.graduated;
    if (l?.lifecycle) return l.lifecycle !== "CURVE_TRADING";
    return null;
  } catch {
    return null; // fail-closed — an outage never graduates the token
  }
}

export async function graduationState(now: number = Date.now()): Promise<GradState> {
  if (cache && now - cache.t < CACHE_MS) {
    return {
      ...gradFromInputs(process.env.GRADUATED, cache.value),
      checkedAt: cache.t,
    };
  }
  const pad = await readPadGraduated();
  cache = { t: now, value: pad ?? false };
  return { ...gradFromInputs(process.env.GRADUATED, pad), checkedAt: now };
}

/**
 * E6.1 freeze etiquette: during the graduation-snapshot window the operator sets
 * WEIGHTS_FROZEN=1 — weight events pause with an HONEST response while scores
 * keep flowing (the game is never blocked, LAW 1.2 substance). The Merkle
 * snapshot then reads a frozen, consistent ledger (runbook: docs/council/).
 */
export function weightsFrozen(): boolean {
  return process.env.WEIGHTS_FROZEN === "1";
}

/** Honest pause payload shared by the three lane routes. */
export const WEIGHTS_FROZEN_RESPONSE = {
  ok: false,
  frozen: true,
  error: "airdrop-weights snapshot in progress — your run still scores on the board",
} as const;

/**
 * Post-graduation lane registry (spec §8): staged now, activated at graduation.
 * Numbers/payouts are deliberately NOT coded — they land at graduation with the
 * council sign-off (E1.5: "lanes fixed now, numbers at graduation").
 */
export const POST_GRAD_LANES = [
  { id: "mirror", label: "H6 MIRROR — $WICK's own chart as a level", status: "staged" },
  { id: "spend-burn", label: "run entries / revives / cosmetics (transfers unlock)", status: "staged" },
  { id: "tournaments", label: "treasury-funded tournaments (20% cash share)", status: "staged" },
  { id: "burn-counter-hud", label: "fee-EVENT burn attribution HUD (P6.5)", status: "staged" },
] as const;

export type PostGradLaneId = (typeof POST_GRAD_LANES)[number]["id"];

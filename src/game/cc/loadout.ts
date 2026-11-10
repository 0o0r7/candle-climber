// Practice loadouts (P0.6) — the missing BUILD CHOICE (ten-pattern #2).
//
// WHY this shape and not a power-up: Candle Climber's daily board is a shared
// chart with one number (docs/GAME-DESIGN-REFERENCES.md §2 — no per-player
// difficulty). A build that adds reach or changes score would make two equal
// scores mean different things. So the loadout trades one FORGIVENESS window
// against another and never touches power:
//
//   reach(shipped air jump) = AIR_JUMP_V² / (2·GRAVITY) ≈ 104px < MAX_UP (112px)
//   reach(any loadout)      = unchanged — the loadouts only move WHEN a press
//                             is accepted, never HOW FAR it flies.
//
// WHERE it applies: the PRACTICE lane only (archive terrain, `/play?date=<past>`,
// submissions already suppressed). The ranked daily lane always runs STANDARD,
// so the leaderboard keeps one physics. That is the design prior already written
// down in docs/GAME-DESIGN-REFERENCES.md §3 ("casual lane only, ranked lane
// stays baseline") — this module is that sentence made executable.
//
// A trade-off is only a decision if both sides are real (Sid Meier, "Interesting
// Decisions", GDC 2012). Each option therefore LOSES something a player wants:
//   GROUNDED  wider ledge grace, but no mid-air correction
//   STANDARD  the shipped balance (and the only ranked one)
//   AERIAL    second jump + long input buffer, but a sharp ledge window
//
// Contract tests: test/loadout.test.ts. Design note: docs/PRACTICE-LOADOUTS.md.
import { AIR_JUMPS, COYOTE, BUFFER, type RecoveryProfile } from "./engine";

export type LoadoutId = "grounded" | "standard" | "aerial";

export interface Loadout {
  id: LoadoutId;
  name: string;
  /** What you get. */
  gain: string;
  /** What you give up — the other half of the trade-off. */
  cost: string;
  recovery: RecoveryProfile;
}

/** Multipliers are authored as numbers, not prose, so the trade-off is exact. */
export const LOADOUTS: Record<LoadoutId, Loadout> = {
  grounded: {
    id: "grounded",
    name: "GROUNDED",
    gain: `ledge grace ×1.5 (${(COYOTE * 1.5).toFixed(2)}s coyote)`,
    cost: `shorter buffer (${(BUFFER * 0.6).toFixed(2)}s) · no air jump`,
    recovery: { coyote: COYOTE * 1.5, buffer: BUFFER * 0.6, airJumps: 0 },
  },
  standard: {
    id: "standard",
    name: "STANDARD",
    gain: "the shipped balance",
    cost: "no edge in any direction",
    // Literally the engine defaults — one source of truth, no drift.
    recovery: { coyote: COYOTE, buffer: BUFFER, airJumps: AIR_JUMPS },
  },
  aerial: {
    id: "aerial",
    name: "AERIAL",
    gain: `air jump + long buffer (${(BUFFER * 1.5).toFixed(2)}s)`,
    cost: `sharp ledge window (${(COYOTE * 0.6).toFixed(2)}s coyote)`,
    recovery: { coyote: COYOTE * 0.6, buffer: BUFFER * 1.5, airJumps: AIR_JUMPS },
  },
};

/** Display order for the picker — STANDARD first (the safe default). */
export const LOADOUT_ORDER: readonly LoadoutId[] = ["standard", "grounded", "aerial"];

export const DEFAULT_LOADOUT: LoadoutId = "standard";

export function loadoutById(id: LoadoutId | string | null | undefined): Loadout {
  if (id && id in LOADOUTS) return LOADOUTS[id as LoadoutId];
  return LOADOUTS[DEFAULT_LOADOUT];
}

/** The ranked lane's law: a run that can reach the board always climbs STANDARD. */
export function recoveryForRun(practice: boolean, id: LoadoutId | string | null | undefined): RecoveryProfile {
  return practice ? loadoutById(id).recovery : LOADOUTS.standard.recovery;
}

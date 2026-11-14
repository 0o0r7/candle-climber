// P2 — the death panel must DIAGNOSE, not just count.
//
// WHY: `RunResult.cause` has been produced since P0.1 and shipped to telemetry
// and the Death Card, but the panel a player actually stares at never showed it
// (audit 2026-11-11 §2 finding 5). The player therefore learns nothing from the
// run that just ended. Benchmark: Lane Runner ("Step out of the red") and
// Wildclaw both hand the player "what happened + what to do" at the moment of
// failure; Caveman's "You collapsed… nothing lost" is the same shape.
//
// WHAT THIS MODULE IS: a fixed, exhaustive mapping `DeathCause → words`, plus
// the run's place on the day's chart (candle + director sector). Pure — no
// engine, no DOM, no i18n runtime — so the copy is pin-testable and a new cause
// cannot ship without words (`test/death-hints.test.ts` walks the enum).
import type { DeathCause, RunResult } from "./types";
import { sectorAt } from "./director";

export interface CauseCopy {
  /** One word, uppercase — the same word the cause is called everywhere else. */
  label: string;
  /** What the engine actually did, in the player's language. */
  what: string;
  /** The one instruction for the next attempt. Never a score promise. */
  hint: string;
}

/** Every cause. `satisfies` fails the build when a new DeathCause is added
 *  without copy — the panel can never render a blank diagnosis. */
export const CAUSE_COPY = {
  // Missed the gap: the player fell past the view without a platform under
  // them (engine.ts "death: fell below view", last landing was a solid candle).
  fell: {
    label: "FELL",
    what: "You dropped past the chart — nothing solid was under you.",
    hint: "Jump a beat earlier, and spend the air jump only once you are committed to the gap.",
  },
  // Landed on a red candle and rode it until the fuse ran out.
  crumbled: {
    label: "CRUMBLED",
    what: "The red candle you landed on folded under you.",
    hint: "Red candles hold until the fuse ends — land on one and leave on the very next beat.",
  },
  // Reserved: the wick-spike death path is in the card/telemetry vocabulary.
  wicked: {
    label: "WICKED",
    what: "A wick spiked you off the candle you were standing on.",
    hint: "Land centered, not on the edge — the wick hits the outer lip first.",
  },
} satisfies Record<DeathCause, CauseCopy>;

export interface DeathDiagnosis {
  cause: DeathCause;
  label: string;
  what: string;
  hint: string;
  /** Candle the run ended on (1-based, what the HUD counted). */
  candle: number;
  /** Director sector label at that candle ("TREND", "THE SUMMIT", …). */
  sector: string;
}

/**
 * The three-line diagnosis for a finished run. `total` is the day's level
 * length; pass 0 when unknown and the director's cycle applies with no summit
 * band — exactly the rule telemetry uses, so the panel and `/ops` never
 * disagree about which sector a death happened in.
 */
export function explainDeath(
  result: Pick<RunResult, "cause" | "candlesPassed">,
  total = 0,
): DeathDiagnosis {
  const cause: DeathCause = result.cause ?? "fell";
  const copy = CAUSE_COPY[cause];
  return {
    cause,
    label: copy.label,
    what: copy.what,
    hint: copy.hint,
    candle: Math.max(1, Math.floor(result.candlesPassed)),
    sector: sectorAt(result.candlesPassed, total).name,
  };
}

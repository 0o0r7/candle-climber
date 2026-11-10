// O-3 LANDING TELEGRAPH — "which candle will this arc come down on?"
//
// WHY (docs/OPEN-ITEMS.md O-3): the 26-candle wall is a READABILITY problem, not
// a reach problem. Chart v2 authored the terrain inside the jump's reach, but the
// arc is long relative to the 96 px candle spacing, so a player cannot see where
// it will be intercepted — the decision degrades into a guess. This module
// answers that single question from the SAME forward simulation the rival bot
// already runs (rival/planner.ts), so the tell can never disagree with the
// physics it describes:
//   · grounded  -> the arc of a full-hold press taken NOW (the committed jump);
//   · airborne  -> the arc already in the air, honouring the real `jumpHeld`
//                  state (release/cut and the gravity-hang it ends).
//
// PRESENTATION ONLY. Nothing here writes engine state, consumes RNG, or touches
// score/candles/terrain: the same engine state returns the same tell, so replays,
// ghosts and the ranked board are untouched (pinned by test/telegraph.test.ts).
import { PLAYER_W, type Engine } from "./engine";
import { CANDLE_W } from "./level";
import { evalArc, evalPressNow, type BotSnapshot, type PressEval } from "./rival/planner";

export interface LandingTell {
  /** Platform index the arc is predicted to meet. */
  idx: number;
  /** Sim ticks until that landing — "how long do I have". */
  ticks: number;
  /** Target is a red candle: it starts folding the moment it takes weight. */
  risky: boolean;
}

/** Rebuild the planner snapshot from the live engine (reads only). */
function snapshot(e: Engine): BotSnapshot {
  // Candles are one CANDLE_W apart (`x = i * CANDLE_W`), so the lane the player
  // is in IS the index floor: a landing at or behind it is not a new candle.
  const lane = Math.floor((e.px + PLAYER_W / 2) / CANDLE_W);
  return {
    px: e.px,
    py: e.py,
    vy: e.vy,
    grounded: e.grounded,
    groundIdx: Math.max(0, Math.min(e.plats.length - 1, lane)),
    time: e.time,
    rush: e.rush,
    sinceLand: 0, // unused by the rollout (patience is the press DECISION, not the arc)
  };
}

/** The platform the current arc will meet — null when there is nothing honest to
 *  tell (dead, or the arc falls inside the lane the player already occupies). */
export function landingTell(e: Engine): LandingTell | null {
  if (e.dead || e.plats.length === 0) return null;
  const s = snapshot(e);
  const ev: PressEval = e.grounded
    ? evalPressNow(s, e.plats, e.mods, e.rush).full
    : evalArc(s, e.plats, e.mods, e.rush, e.jumpHeld);
  if (!ev.ok || ev.landIdx < 0 || ev.landIdx >= e.plats.length) return null;
  const p = e.plats[ev.landIdx];
  if (p.state !== "solid" || p.w <= 0) return null;
  return { idx: ev.landIdx, ticks: ev.ticksToLand, risky: ev.risky };
}

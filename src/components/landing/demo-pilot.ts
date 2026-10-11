// Landing-page demo autopilot — drives a silent Engine for the showcase only
// (never used in real runs, never posts scores).
//
// Why not RivalBot: the engine ungrounds the player the same tick they touch a
// red candle (a crumbling platform is no longer "solid"), leaving only the
// coyote window to jump. RivalBot re-arms its jump only on a grounded landing,
// so it never jumps off a red candle. This pilot re-arms on every landing and
// plans the whole take-off window (walk / coyote) at once.
//
// Deterministic: physics depends only on the number of fixed steps, so the
// run is identical in every browser (and in the headless validation).
import { Engine, GRAVITY, PLAYER_W, PLAYER_H, CAM_BASE, CAM_ACCEL, CAM_MAX } from "@/game/cc/engine";
import { buildPlatforms } from "@/game/cc/level";
import { BASE_MODS } from "@/game/cc/mutations";
import { evalPressNow, FIXED_DT, type PressEval } from "@/game/cc/rival/planner";
import type { Candle, Platform } from "@/game/cc/types";

/** Below this landing margin (px) an option counts as "edgy". */
const SAFE_MARGIN = 10;
/** Longest take-off window we plan over (ticks). */
const MAX_WAIT = 300;

interface Plan { wait: number; hold: boolean }

export class DemoPilot {
  readonly eng: Engine;
  private armed = false;
  private baseIdx = -1;
  private plan: Plan | null = null;
  private cutPending = false;

  constructor(candles: Candle[], seed: string) {
    this.eng = new Engine(buildPlatforms(candles, seed), { onDeath: () => {}, onScore: () => {} }, BASE_MODS, seed);
  }

  tick() {
    const e = this.eng;
    if (e.dead) return;
    if (this.cutPending) {
      e.release(); // jump-cut one tick after the press (planner's cut variant)
      this.cutPending = false;
    } else if (this.armed) {
      if (!this.plan) this.plan = this.makePlan();
      if (this.plan.wait <= 0) {
        e.press();
        if (!this.plan.hold) this.cutPending = true;
        this.armed = false;
        this.plan = null;
      } else {
        this.plan.wait--;
      }
    }
    e.step(FIXED_DT);
    // the engine zeroes vy only when the feet touch a platform
    if (e.vy === 0 && !this.armed && !this.cutPending) this.onLanded();
  }

  private onLanded() {
    const e = this.eng;
    const feet = e.py + PLAYER_H;
    const p = e.plats.find((q) => q.w > 0 && Math.abs(q.y - feet) < 0.5 && e.px + PLAYER_W > q.x + 6 && e.px < q.x + q.w - 2);
    this.baseIdx = p ? p.i : this.baseIdx;
    this.armed = true;
    this.plan = null;
  }

  private standingOn(px: number, feet: number): Platform | undefined {
    const plats = this.eng.plats;
    for (let i = Math.max(0, this.baseIdx); i < Math.min(plats.length, this.baseIdx + 4); i++) {
      const q = plats[i];
      if (q.state === "solid" && !q.crumble && Math.abs(q.y - feet) < 0.5 && px + PLAYER_W > q.x + 6 && px < q.x + q.w - 2) return q;
    }
    return undefined;
  }

  /** Scan every press moment in the take-off window; take the most centered landing. */
  private makePlan(): Plan {
    const e = this.eng;
    let px = e.px, py = e.py, vy = e.vy, t = e.time, coyote = e.coyote;
    let best: { wait: number; hold: boolean; score: number } | null = null;
    let lastValid = 0;

    for (let wait = 0; wait <= MAX_WAIT; wait++) {
      // the press is valid if the jump can still execute in the next step
      const onGround = !!this.standingOn(px + speedAt(t + FIXED_DT) * FIXED_DT, py + PLAYER_H);
      if (!onGround && coyote - FIXED_DT <= 0) break;
      lastValid = wait;

      const ev = evalPressNow(
        { px, py, vy, grounded: true, groundIdx: this.baseIdx, time: t, rush: false, sinceLand: 1 },
        e.plats, e.mods, false,
      );
      for (const [c, hold] of [[ev.full, true], [ev.cut, false]] as [PressEval, boolean][]) {
        if (!c.ok) continue;
        // centered landings win; green targets get a bonus (reds force an instant re-jump)
        const score = Math.min(c.margin, 30) + (c.risky ? 0 : 6) + (c.margin >= SAFE_MARGIN ? 20 : 0);
        if (!best || score > best.score) best = { wait, hold, score };
      }

      // advance one idle tick (mirror of engine.step without a press)
      t += FIXED_DT;
      px += speedAt(t) * FIXED_DT;
      coyote = Math.max(0, coyote - FIXED_DT);
      if (this.standingOn(px, py + PLAYER_H)) {
        vy = 0;
        coyote = 0.12;
      } else {
        vy += GRAVITY * FIXED_DT;
        py += vy * FIXED_DT;
      }
    }
    // nothing lands — jump at the last possible moment (go out jumping)
    return best ?? { wait: lastValid, hold: true };
  }
}

function speedAt(time: number): number {
  return Math.min(CAM_MAX, CAM_BASE + time * CAM_ACCEL);
}

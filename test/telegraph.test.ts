/// <reference types="bun-types" />
// O-3 LANDING TELEGRAPH — the tell must never lie.
//
// The telegraph is only worth having if it is EXACT, so these tests are written
// against the engine itself rather than against the planner: the tell is taken
// from a live Engine, the jump is then actually flown by that engine, and the
// platform the engine lands on is compared with the platform the tell named.
//
// Covered (docs/OPEN-ITEMS.md O-3):
//  a) presentation only — reading the tell mutates nothing (ghosts/board safe);
//  b) airborne fidelity — the arc's predicted target IS the landing, for a full
//     hold AND for a cut jump (the hang/release gate must mirror the engine);
//  c) take-off fidelity — the grounded "press now" target IS where the real
//     press lands;
//  d) it never marks the candle the player already occupies;
//  e) two identical runs produce identical tells (deterministic, zero RNG).
import { describe, test, expect } from "bun:test";
import { buildPlatforms, CANDLE_W } from "@/game/cc/level";
import { syntheticCandles, LIMIT } from "@/game/cc/level-source";
import { Engine, PLAYER_W } from "@/game/cc/engine";
import { landingTell } from "@/game/cc/telegraph";
import { FIXED_DT } from "@/game/cc/rival/planner";
import type { Platform } from "@/game/cc/types";

// Chart v2 terrain (2026-11-12+) — the lane O-3 was opened against.
const DATE = "2026-11-12";

function makeEngine(seedStr = `${DATE}SOLUSDT`): { e: Engine; plats: Platform[] } {
  const candles = syntheticCandles(DATE, LIMIT);
  const plats = buildPlatforms(candles, seedStr);
  const e = new Engine(plats, { onDeath: () => {}, onScore: () => {} }, undefined, seedStr);
  return { e, plats };
}

/** Fall from the spawn point onto the pad (the engine starts 140px above it). */
function settle(e: Engine) {
  for (let i = 0; i < 400 && !e.grounded && !e.dead; i++) e.step(FIXED_DT);
}

const laneOf = (e: Engine) => Math.floor((e.px + PLAYER_W / 2) / CANDLE_W);

/** Fly one jump (held for `holdTicks`, then released) and report the landing:
 *  every tell taken in the air with its tick, plus the platform actually met.
 *  The tick matters: `release()` is the only mid-air input that bends the arc,
 *  so a tell taken BEFORE it describes a different (uncut) flight. */
function flyJump(e: Engine, holdTicks: number) {
  e.press();
  const airborne: { k: number; idx: number }[] = [];
  let landed = -1;
  for (let k = 0; k < 240; k++) {
    if (k === holdTicks) e.release();
    e.step(FIXED_DT);
    if (e.dead) break;
    if (e.grounded) {
      landed = e.groundPlat ? e.groundPlat.i : -1;
      break;
    }
    const t = landingTell(e);
    if (t) airborne.push({ k, idx: t.idx });
  }
  return { airborne, landed };
}

describe("O-3 landing telegraph", () => {
  test("a) reading the tell mutates no engine state", () => {
    const { e } = makeEngine();
    settle(e);
    e.press();
    for (let k = 0; k < 8; k++) e.step(FIXED_DT);

    const before = {
      py: e.py, vy: e.vy, time: e.time, score: e.score,
      camX: e.camX, camY: e.camY, grounded: e.grounded,
      candlesPassed: e.candlesPassed,
    };
    const tell = landingTell(e);
    expect(tell).not.toBeNull(); // mid-arc over a real chart there IS a target
    expect({
      py: e.py, vy: e.vy, time: e.time, score: e.score,
      camX: e.camX, camY: e.camY, grounded: e.grounded,
      candlesPassed: e.candlesPassed,
    }).toEqual(before);
  });

  test("b) + c) the predicted platform is the platform the engine lands on", () => {
    const { e, plats } = makeEngine();
    settle(e);

    let airborneChecks = 0;
    let takeoffChecks = 0;
    let cutChecks = 0;

    for (let jump = 0; jump < 8 && !e.dead; jump++) {
      // even jumps are held to the end, odd ones are cut at tick 26 — the
      // release is the only mid-air input, so each case pins a different gate
      const fullHold = jump % 2 === 0;
      const holdTicks = fullHold ? 240 : 26;

      // c) take-off fidelity: the grounded tell names the arc of a COMMITTED
      // (full-hold) press, so it is compared on the jumps flown that way
      const takeoff = landingTell(e);
      if (takeoff) {
        expect(takeoff.idx).toBeGreaterThan(laneOf(e)); // d) never behind us
        expect(takeoff.risky).toBe(plats[takeoff.idx].crumble);
      }

      const { airborne, landed } = flyJump(e, holdTicks);
      if (landed < 0) break; // died or ran out of arc — nothing to compare

      if (takeoff && fullHold) {
        expect(takeoff.idx).toBe(landed);
        takeoffChecks++;
      }
      for (const { k, idx } of airborne) {
        // answers given BEFORE the release describe the uncut arc (a different
        // flight on purpose); every answer from the release onward is this one
        if (fullHold || k >= holdTicks) {
          expect(idx).toBe(landed);
          airborneChecks++;
        } else {
          cutChecks++;
        }
      }
    }

    // the test must have actually exercised both gates
    expect(airborneChecks).toBeGreaterThan(10);
    expect(takeoffChecks).toBeGreaterThan(2);
    expect(cutChecks).toBeGreaterThan(0); // pre-release answers really existed
  });

  test("d) it never marks a chasm or a candle behind the player", () => {
    const { e } = makeEngine();
    settle(e);
    for (let jump = 0; jump < 6 && !e.dead; jump++) {
      const t = landingTell(e);
      if (t) {
        expect(t.idx).toBeGreaterThan(laneOf(e));
        expect(e.plats[t.idx].state).toBe("solid");
        expect(e.plats[t.idx].w).toBeGreaterThan(0);
      }
      flyJump(e, jump % 2 === 0 ? 240 : 30);
    }
  });

  test("e) deterministic: same seed + same steps ⇒ same tells, no RNG", () => {
    const run = () => {
      const { e } = makeEngine();
      settle(e);
      const out: (number | null)[] = [];
      for (let jump = 0; jump < 4 && !e.dead; jump++) {
        out.push(landingTell(e)?.idx ?? null);
        e.press();
        for (let k = 0; k < 240; k++) {
          if (k === 30) e.release();
          e.step(FIXED_DT);
          if (e.grounded || e.dead) break;
          out.push(landingTell(e)?.idx ?? null);
        }
      }
      return out;
    };
    const a = run();
    const b = run();
    expect(a.length).toBeGreaterThan(8);
    expect(b).toEqual(a);
  });
});

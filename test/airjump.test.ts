/// <reference types="bun-types" />
// P0.3 air jump (second jump) — contract tests (bun test).
// Pins the design law documented in docs/AIR-JUMP.md:
//  1. One air jump per airborne period, refilled by a landing.
//  2. The air jump is WEAKER than the ground jump: its reach stays under
//     MAX_UP, so the level's authored steps still need the FIRST jump and the
//     daily chart keeps its difficulty priors (no MAX_UP re-tune).
//  3. Same forgiveness windows as the ground jump: coyote keeps the air jump,
//     a press with no jump left stays buffered for the landing, jump-cut works.
//  4. The air jump earns no STYLE — it is a verb, not a fudged timing window.
//  5. Replay-exact: identical inputs ⇒ identical state on every tick.
import { describe, test, expect } from "bun:test";
import {
  Engine, VIEW_W, PLAYER_W, PLAYER_H, PLAYER_X_FRAC, COYOTE,
  GRAVITY, JUMP_V, JUMP_CUT, AIR_JUMP_V, AIR_JUMPS,
} from "@/game/cc/engine";
import { PLATFORM_W, MAX_UP } from "./../src/game/cc/level";
import type { Platform } from "@/game/cc/types";

const SEED = "p03-airjump";
const DT = 1 / 60;
const ANCHOR = VIEW_W * PLAYER_X_FRAC - PLAYER_W / 2;
const AIR_REACH = (AIR_JUMP_V * AIR_JUMP_V) / (2 * GRAVITY);
const GROUND_REACH = (JUMP_V * JUMP_V) / (2 * GRAVITY);

function plat(i: number, y = 0): Platform {
  return {
    i, x: i * PLATFORM_W, y, w: PLATFORM_W, up: true,
    state: "solid", passed: false, crumble: false,
  } as Platform;
}

/** Flat all-green runway: contiguous platforms, no gaps, no terrain deaths. */
function flatPlats(n: number) {
  const out: Platform[] = [];
  for (let i = 0; i < n; i++) out.push(plat(i));
  return out;
}

/** Same runway with a one-platform hole, so a real ledge can be walked off. */
function gappedPlats(n: number, hole: number) {
  const out: Platform[] = [];
  for (let i = 0; i < n; i++) if (i !== hole) out.push(plat(i));
  return out;
}

function makeEngine(plats: Platform[] = flatPlats(400)): Engine {
  return new Engine(plats, { onDeath: () => {}, onScore: () => {} }, undefined, SEED);
}

function settle(e: Engine) {
  for (let i = 0; i < 400 && !e.grounded; i++) e.step(DT);
  expect(e.grounded).toBe(true);
}

/** Ground jump from a settled stance: the jump executes at the end of one step. */
function groundJump(e: Engine) {
  e.press();
  e.step(DT);
  expect(e.grounded).toBe(false);
  expect(e.vy).toBeCloseTo(-JUMP_V, 6);
}

/** Park the player on its platform with an exact runway (px) still ahead. */
function setRunway(e: Engine, runway: number) {
  const p = e.groundPlat as Platform;
  e.camX = p.x + p.w - runway - PLAYER_W - ANCHOR;
}

/** Lift the player into a long airborne fall (fixture setup, not a game path). */
function hangHigh(e: Engine, height: number) {
  e.py = -height;
  e.vy = 0;
  e.grounded = false;
  e.groundPlat = null;
  e.coyote = 0;
}

describe("P0.3 — the fairness arithmetic", () => {
  test("one air jump per airborne period", () => {
    expect(AIR_JUMPS).toBe(1);
  });

  test("ground jump still clears MAX_UP (terrain stays authored)", () => {
    expect(GROUND_REACH).toBeGreaterThan(MAX_UP);
  });

  test("air jump reach stays UNDER MAX_UP — it can never replace a ground jump", () => {
    expect(AIR_REACH).toBeLessThan(MAX_UP);
  });
});

describe("P0.3 — one impulse per airborne period", () => {
  test("a press in the air fires the second jump exactly once", () => {
    const e = makeEngine();
    settle(e);
    groundJump(e);
    expect(e.airJumpsLeft).toBe(AIR_JUMPS);

    e.press();
    e.step(DT);
    expect(e.airJumpsLeft).toBe(0);
    expect(e.vy).toBeCloseTo(-AIR_JUMP_V, 6);
  });

  test("a third press while airborne delivers nothing (but is not lost)", () => {
    const e = makeEngine();
    settle(e);
    groundJump(e);

    e.press(); e.step(DT);      // air jump
    const vyAfterAir = e.vy;
    e.press(); e.step(DT);      // nothing left
    expect(e.airJumpsLeft).toBe(0);
    // only gravity acted — no new upward impulse
    expect(e.vy).toBeGreaterThan(vyAfterAir);
    expect(e.buffer).toBeGreaterThan(0); // still buffered for the landing
  });

  test("landing refills the air jump", () => {
    const e = makeEngine();
    settle(e);
    groundJump(e);
    e.press(); e.step(DT); // spend it
    expect(e.airJumpsLeft).toBe(0);
    e.release();
    for (let i = 0; i < 400 && !e.grounded; i++) e.step(DT);
    expect(e.grounded).toBe(true);
    expect(e.airJumpsLeft).toBe(AIR_JUMPS);
  });
});

describe("P0.3 — the same forgiveness windows as the ground jump", () => {
  test("coyote keeps the air jump: a ledge save is still a GROUND jump", () => {
    const e = makeEngine(gappedPlats(400, 3));
    settle(e);
    // walk off the ledge — real path: the platform runs out from underfoot
    let ticks = 0;
    while (e.grounded && ticks++ < 900) e.step(DT);
    expect(ticks).toBeLessThan(900);
    expect(e.grounded).toBe(false);
    expect(e.coyote).toBeGreaterThan(0);

    e.press();
    e.step(DT);
    expect(e.vy).toBeCloseTo(-JUMP_V, 6);   // ground-strength jump
    expect(e.airJumpsLeft).toBe(AIR_JUMPS); // not spent

    e.press();
    e.step(DT);
    expect(e.airJumpsLeft).toBe(0);         // the second jump is still available
    expect(e.vy).toBeCloseTo(-AIR_JUMP_V, 6);
  });

  test("a press with no jump left is buffered and fires on landing", () => {
    const e = makeEngine();
    settle(e);
    hangHigh(e, 400); // long fall, one air jump in hand
    e.press();
    e.step(DT);                              // spend the air jump
    expect(e.airJumpsLeft).toBe(0);
    e.release();

    // fall to ~0.05s above the ground — inside the 0.16s buffer window
    let guard = 0;
    while (e.py + PLAYER_H <= -60 && guard++ < 600) e.step(DT);
    expect(guard).toBeLessThan(600);
    expect(e.grounded).toBe(false);
    expect(e.coyote).toBe(0);

    e.press();
    e.step(DT);
    expect(e.airJumpsLeft).toBe(0); // nothing fires mid-air with no jump left

    let fired = false;
    for (let i = 0; i < 40; i++) {
      e.step(DT);
      if (e.vy <= -JUMP_V + 1e-6) { fired = true; break; }
    }
    expect(fired).toBe(true);              // the buffered press became a jump
    expect(e.airJumpsLeft).toBe(AIR_JUMPS); // refilled by that landing
  });

  test("jump-cut applies to the air jump (variable height)", () => {
    const e = makeEngine();
    settle(e);
    groundJump(e);
    e.press(); e.step(DT);
    const vyRising = e.vy;
    expect(vyRising).toBeCloseTo(-AIR_JUMP_V, 6);
    e.release(); // cut
    expect(e.vy).toBeCloseTo(vyRising * JUMP_CUT, 6);
  });
});

describe("P0.3 — STYLE and replay integrity", () => {
  test("the air jump earns no STYLE on a safe runway", () => {
    const e = makeEngine();
    settle(e);
    setRunway(e, 200); // mid-platform: a careful first jump
    groundJump(e);
    e.press(); e.step(DT); // air jump
    expect(e.style).toBe(0);
    expect(e.styleLate).toBe(0);
    expect(e.styleSave).toBe(0);
  });

  test("replay-exact: identical inputs ⇒ identical state every tick", () => {
    const run = () => {
      const e = makeEngine();
      settle(e);
      const trace: number[] = [];
      for (let t = 0; t < 240; t++) {
        if (t === 0 || t === 20 || t === 70 || t === 71) e.press();
        if (t === 40 || t === 90) e.release();
        e.step(DT);
        trace.push(e.py, e.vy, e.airJumpsLeft, e.style);
      }
      return trace;
    };
    expect(run()).toEqual(run());
  });
});

/// <reference types="bun-types" />
// RESCUE mechanic — contract tests (bun test).
// Pins the rules documented in docs/RESCUE-ECONOMY.md:
//  1. A revive is only possible AFTER a death, and at most ONCE per run.
//  2. The revive returns the player to a SAFE foothold (the last solid,
//     non-folding platform), never mid-air and never onto a gone candle.
//  3. Score, candles and credits are KEPT — that is what the credits bought —
//     but the combo breaks, and already-passed terrain can never pay twice.
//  4. Deterministic: the same fall resumes in the same pose.
import { describe, test, expect } from "bun:test";
import { Engine, VIEW_H, VIEW_W, PLAYER_H, PLAYER_W, PLAYER_X_FRAC } from "@/game/cc/engine";
import { PLATFORM_W } from "@/game/cc/level";
import type { Platform } from "@/game/cc/types";

const DT = 1 / 60;
const SEED = "rescue-contract";

function plat(i: number, over: Partial<Platform> = {}): Platform {
  return {
    i, x: i * PLATFORM_W, y: 0, w: PLATFORM_W, up: true,
    state: "solid", passed: false, crumble: false, crumbleT: 0,
    ...over,
  } as Platform;
}

function flatPlats(n: number) {
  const out: Platform[] = [];
  for (let i = 0; i < n; i++) out.push(plat(i));
  return out;
}

function makeEngine(plats: Platform[]): Engine {
  return new Engine(plats, { onDeath: () => {}, onScore: () => {} }, undefined, SEED);
}

/** No input: the camera carries the player along the runway until the terrain
 *  ends and the fall crosses the death line. */
function runToDeath(e: Engine, maxTicks = 60 * 30) {
  for (let i = 0; i < maxTicks && !e.dead; i++) e.step(DT);
  expect(e.dead).toBe(true);
}

describe("rescue availability", () => {
  test("a live run cannot be revived", () => {
    const e = makeEngine(flatPlats(10));
    expect(e.dead).toBe(false);
    expect(e.rescueAvailable()).toBe(false);
    expect(e.revive()).toBe(false);
    expect(e.rescues).toBe(0);
  });

  test("one revive per run — a second death offers nothing", () => {
    const e = makeEngine(flatPlats(10));
    runToDeath(e);
    expect(e.rescueAvailable()).toBe(true);
    expect(e.revive()).toBe(true);
    expect(e.rescues).toBe(1);
    expect(e.rescueAvailable()).toBe(false);
    runToDeath(e);
    expect(e.rescueAvailable()).toBe(false);
    expect(e.revive()).toBe(false);
    expect(e.rescues).toBe(1);
  });
});

describe("revive pose", () => {
  test("returns to the last solid platform, standing, with the combo broken", () => {
    const e = makeEngine(flatPlats(10));
    runToDeath(e);
    const scoreBefore = e.score;
    const candlesBefore = e.candlesPassed;
    const creditsBefore = e.credits;
    const bestBefore = e.bestStreak;

    expect(e.revive()).toBe(true);

    const safe = e.groundPlat;
    expect(safe).not.toBeNull();
    expect(safe!.state).toBe("solid");
    // standing exactly on the surface
    expect(e.py).toBe(safe!.y - PLAYER_H);
    expect(e.grounded).toBe(true);
    expect(e.vy).toBe(0);
    expect(e.dead).toBe(false);
    // the player is anchored over the platform they resume on
    expect(e.px + PLAYER_W / 2).toBeCloseTo(safe!.x + safe!.w / 2, 5);
    expect(e.px).toBeCloseTo(e.camX + VIEW_W * PLAYER_X_FRAC - PLAYER_W / 2, 5);

    // kept: the credits bought the position, not a fresh start
    expect(e.score).toBe(scoreBefore);
    expect(e.candlesPassed).toBe(candlesBefore);
    expect(e.credits).toBe(creditsBefore);
    // lost: the running combo (the best streak already earned still counts)
    expect(e.streak).toBe(0);
    expect(e.bestStreak).toBe(bestBefore);
  });

  test("never resumes on a gone/folding candle when a solid one exists", () => {
    const plats = flatPlats(10);
    const e = makeEngine(plats);
    runToDeath(e);
    // the last three candles folded away while the player was down
    for (const p of plats) if (p.i >= 7) p.state = "gone";
    expect(e.revive()).toBe(true);
    const safe = e.groundPlat!;
    expect(safe.state).toBe("solid");
    expect(safe.crumble).toBe(false);
    expect(safe.i).toBe(6);
  });

  test("a resumed run cannot re-score terrain it already passed", () => {
    const e = makeEngine(flatPlats(10));
    runToDeath(e);
    const passed = e.candlesPassed;
    const score = e.score;
    expect(e.revive()).toBe(true);
    // the camera is behind again: stepping must not re-award the same candles
    for (let i = 0; i < 30; i++) e.step(DT);
    expect(e.candlesPassed).toBe(passed);
    expect(e.score).toBe(score);
  });
});

describe("determinism", () => {
  test("the same fall resumes in the same pose", () => {
    const a = makeEngine(flatPlats(10));
    const b = makeEngine(flatPlats(10));
    runToDeath(a);
    runToDeath(b);
    a.revive();
    b.revive();
    expect(a.px).toBe(b.px);
    expect(a.py).toBe(b.py);
    expect(a.camX).toBe(b.camX);
    expect(a.camY).toBe(b.camY);
    expect(a.camY).toBeLessThanOrEqual(0);
    expect(a.py).toBeLessThan(a.camY + VIEW_H);
  });
});

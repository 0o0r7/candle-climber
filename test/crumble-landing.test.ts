/// <reference types="bun-types" />
// Red candles ("red candles crumble") — the landing contract.
//
// A crumble candle is a TIMED surface: it starts folding the moment it takes
// weight, holds for its fuse, then drops the player. The engine's "did I slip
// off the edge?" re-check used to ask `state === "solid"` there, so the landing
// tick itself un-grounded the player on every red candle — the fuse, the tell
// and the fold never ran in a real run, and any red candle an arc came down on
// was a fall-through death no input could avoid (a launchpad chart became
// unwinnable at its first cluster of red candles). These tests pin the surface.
//
// Note: the camera auto-scrolls, so the player always slides across a runway —
// every fixture here is a flat contiguous row of candles, exactly like the
// level's launch pad, so a test never confuses "slid off a lone candle" with
// "the fold did/didn't work".
import { describe, test, expect } from "bun:test";
import { Engine, PLAYER_H } from "@/game/cc/engine";
import { PLATFORM_W } from "./../src/game/cc/level";
import type { Platform } from "@/game/cc/types";

const SEED = "crumble-landing";
const DT = 1 / 60;

function plat(i: number, y = 0, crumble = false): Platform {
  return {
    i, x: i * PLATFORM_W, y, w: PLATFORM_W, up: !crumble,
    state: "solid", passed: false, crumble,
  } as Platform;
}

function makeEngine(plats: Platform[]) {
  return new Engine(plats, { onDeath: () => {}, onScore: () => {} }, undefined, SEED);
}

/** Spawn is 140px above the first platform — step until a landing resolves. */
function untilLanded(e: Engine) {
  for (let i = 0; i < 240 && !e.grounded; i++) e.step(DT);
}

/** Flat runway: [green, red, green…] so the fold can play out without a death. */
function runway(length: number, redAt: number[]) {
  const out: Platform[] = [];
  for (let i = 0; i < length; i++) out.push(plat(i, 0, redAt.includes(i)));
  return out;
}

describe("red candles crumble after they take weight", () => {
  test("the landing tick holds — the player stands on the folding candle", () => {
    const red = plat(1, 0, true);
    const e = makeEngine([plat(0), red, plat(2), plat(3)]);
    untilLanded(e);
    // approach the red candle on foot (the camera carries the player)
    for (let i = 0; i < 240 && e.groundPlat !== red && !e.dead; i++) e.step(DT);
    expect(e.dead).toBe(false);
    expect(e.groundPlat).toBe(red);
    expect(red.state).toBe("crumbling");
    expect(e.py).toBeCloseTo(red.y - PLAYER_H, 6);
  });

  test("a press right after landing fires the jump — it is a surface, not a hole", () => {
    const red = plat(1, 0, true);
    const e = makeEngine([plat(0), red, plat(2), plat(3)]);
    untilLanded(e);
    for (let i = 0; i < 240 && e.groundPlat !== red && !e.dead; i++) e.step(DT);
    expect(e.groundPlat).toBe(red);
    e.press();
    e.step(DT);
    expect(e.vy).toBeLessThan(0);
    expect(e.grounded).toBe(false);
  });

  test("the fuse runs out: the candle is gone and no longer carries the player", () => {
    const red = plat(1, 0, true);
    const e = makeEngine([plat(0), red, plat(2), plat(3), plat(4)]);
    untilLanded(e);
    for (let i = 0; i < 240 && e.groundPlat !== red && !e.dead; i++) e.step(DT);
    expect(red.state).toBe("crumbling");
    for (let i = 0; i < 40; i++) e.step(DT); // 0.66s > the 0.26s base fuse
    expect(red.state).toBe("gone");
    expect(e.dead).toBe(false); // the player moved on — the fold is not instant death
  });

  test("control: green candles never fold", () => {
    const e = makeEngine(runway(8, []));
    untilLanded(e);
    for (let i = 0; i < 90; i++) e.step(DT);
    expect(e.dead).toBe(false);
    expect(e.plats.every((p) => p.state === "solid")).toBe(true);
  });
});

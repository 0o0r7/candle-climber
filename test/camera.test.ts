/// <reference types="bun-types" />
// CAMERA-FRAME contract (owner report 2026-10-11: "high jump pushes the
// candles and the playfield out of the screen frame").
// Pins the asymmetric camera follow in engine.ts:
//  1. A full hold-jump must NEVER slide the takeoff platform out of the frame
//     bottom (hard CAM_GROUND_STRIP guarantee, base AND low-G mutation mods).
//  2. The player must NEVER exit the top of the frame during the arc.
//  3. While rising INSIDE the frame the camera holds still (terrain read).
//  4. After landing higher, the camera re-centers (the floor never freezes it).
//  5. Falling deaths still trigger (the floor must not break the fell check).
import { describe, test, expect } from "bun:test";
import {
  Engine, VIEW_W, VIEW_H,
  CAM_TOP_WINDOW, CAM_GROUND_STRIP,
} from "@/game/cc/engine";
import { buildPlatforms, PLATFORM_W } from "./../src/game/cc/level";
import { syntheticCandles } from "@/game/cc/level-source";
import { BASE_MODS, type MutationMods } from "@/game/cc/mutations";
import type { Platform } from "@/game/cc/types";

const DT = 1 / 60;
const LOW_G: MutationMods = { gravity: 0.68, jump: 0.92, camSpeed: 1, crumbleTime: 0.26 };

function dailyEngine(date: string, mods: MutationMods): Engine {
  const plats = buildPlatforms(syntheticCandles(date, 220), date);
  return new Engine(plats, { onDeath: () => {}, onScore: () => {} }, mods, date);
}

function settle(e: Engine) {
  for (let i = 0; i < 240 && !e.grounded; i++) e.step(DT);
  expect(e.grounded).toBe(true);
}

/** Full hold-jump arc: returns the worst frame violations over the whole arc. */
function holdJumpArc(e: Engine) {
  const takeoff = e.groundPlat!;
  e.press(); // jumpHeld stays true through the entire rise (max-height jump)
  let worstPlatformDepth = -Infinity; // >0 ⇒ takeoff top below the frame bottom
  let playerAbove = -Infinity;        // >0 ⇒ player top above the frame top
  for (let i = 0; i < 150; i++) { // 2.5s > rise + fall of any reachable arc
    e.step(DT);
    if (e.dead) break;
    worstPlatformDepth = Math.max(worstPlatformDepth, takeoff.y - e.camY - VIEW_H);
    playerAbove = Math.max(playerAbove, -(e.py - e.camY));
    if (e.vy > 0 && e.py + 40 > takeoff.y + 8) break; // landed back / below takeoff
  }
  return { worstPlatformDepth, playerAbove };
}

describe("camera-frame (owner report 2026-10-11)", () => {
  test("full hold-jump keeps the takeoff platform in frame (base mods, 5 daily seeds)", () => {
    for (const date of ["2026-10-11", "2026-10-10", "2026-10-09", "2026-10-08", "2026-10-07"]) {
      const e = dailyEngine(date, BASE_MODS);
      settle(e);
      const { worstPlatformDepth, playerAbove } = holdJumpArc(e);
      // a CAM_GROUND_STRIP-wide strip of the takeoff platform stays visible
      expect(worstPlatformDepth).toBeLessThanOrEqual(-CAM_GROUND_STRIP);
      expect(playerAbove).toBeLessThanOrEqual(0);
    }
  });

  test("full hold-jump keeps the takeoff platform in frame (low-G mutation)", () => {
    for (const date of ["2026-10-11", "2026-10-10", "2026-10-09", "2026-10-08", "2026-10-07"]) {
      const e = dailyEngine(date, LOW_G);
      settle(e);
      const { worstPlatformDepth, playerAbove } = holdJumpArc(e);
      expect(worstPlatformDepth).toBeLessThanOrEqual(-CAM_GROUND_STRIP);
      expect(playerAbove).toBeLessThanOrEqual(0);
    }
  });

  test("rising inside the frame holds the camera still (terrain read)", () => {
    const e = dailyEngine("2026-10-11", BASE_MODS);
    settle(e);
    const camY0 = e.camY;
    e.press();
    // first phase of the rise: player between the anchor (52%) and the top
    // window (30%) — the camera must never move UP (terrain stays put); a
    // residual settle DOWN from the pre-jump pose is allowed
    for (let i = 0; i < 60; i++) {
      e.step(DT);
      if (e.vy >= 0) break;
      if (e.py >= e.camY + VIEW_H * CAM_TOP_WINDOW) {
        expect(e.camY).toBeGreaterThanOrEqual(camY0 - 1e-9);
      } else break;
    }
  });

  test("after a full jump the camera re-centers (floor never freezes it)", () => {
    const plats: Platform[] = [];
    for (let i = 0; i < 40; i++) {
      plats.push({
        i, x: i * PLATFORM_W, y: 0, w: PLATFORM_W, up: true,
        state: "solid", passed: false, crumble: false,
      } as Platform);
    }
    const e = new Engine(plats, { onDeath: () => {}, onScore: () => {} }, BASE_MODS, "flat-recenter");
    settle(e);
    e.press(); // full hold-jump on a flat runway: floor binds at apex, then
    for (let i = 0; i < 150 && !(e.vy > 0 && e.py + 40 >= -8); i++) e.step(DT);
    for (let i = 0; i < 240; i++) e.step(DT); // settle back to the anchor
    expect(e.grounded).toBe(true);
    expect(e.dead).toBe(false);
    const groundTopScreenY = e.groundPlat!.y - e.camY;
    expect(Math.abs(groundTopScreenY - (VIEW_H * 0.52 + 40))).toBeLessThan(30);
  });

  test("falling deaths still trigger with the camera floor in place", () => {
    const plats: Platform[] = [];
    for (let i = 0; i < 40; i++) {
      plats.push({
        i, x: i * PLATFORM_W, y: 0, w: i < 6 ? PLATFORM_W : 0, up: true,
        state: "solid", passed: false, crumble: false,
      } as Platform);
    }
    const e = new Engine(plats, { onDeath: () => {}, onScore: () => {} }, BASE_MODS, "fall-test");
    settle(e);
    for (let i = 0; i < 600 && !e.dead; i++) e.step(DT);
    expect(e.dead).toBe(true);
    expect(e.deathCause).toBe("fell");
  });
});

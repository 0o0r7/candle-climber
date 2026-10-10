/// <reference types="bun-types" />
// CAMERA-FRAME contract v2 (owner report 2026-10-11, two passes:
// "high jump pushes the candles/playfield out of the frame" → fixed with the
// asymmetric follow → "STILL exits the bottom on very high jumps" → fixed with
// the capped rise budget + renderer zoom contract).
// Engine pins:
//  1. The takeoff platform can NEVER slide out of the frame bottom
//     (hard CAM_GROUND_STRIP floor), base AND low-G mutation mods.
//  2. The camera drifts up at most CAM_RISE_BUDGET px per airborne arc —
//     the terrain barely moves while the player arcs (zoom covers the rest,
//     render-only, see GameCanvas + render-v2 CamZoom).
//  3. While the player top is still below the engage line, the camera never
//     moves up at all.
//  4. After a full jump the camera re-centers (budget/floor never freeze it).
//  5. Falling deaths still trigger with the floor in place.
import { describe, test, expect } from "bun:test";
import {
  Engine, VIEW_W, VIEW_H,
  CAM_RISE_ENGAGE, CAM_RISE_BUDGET, CAM_RISE_RATE, CAM_GROUND_STRIP,
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

/** Full hold-jump arc: worst frame violations + camera drift over the arc. */
function holdJumpArc(e: Engine) {
  const takeoff = e.groundPlat!;
  const camY0 = e.camY;
  e.press(); // jumpHeld stays true through the entire rise (max-height jump)
  let worstPlatformDepth = -Infinity; // >0 ⇒ takeoff top below the frame bottom
  let camRise = 0;                    // total upward camera drift during the arc
  for (let i = 0; i < 150; i++) { // 2.5s > rise + fall of any reachable arc
    e.step(DT);
    if (e.dead) break;
    worstPlatformDepth = Math.max(worstPlatformDepth, takeoff.y - e.camY - VIEW_H);
    camRise = Math.max(camRise, camY0 - e.camY);
    if (e.vy > 0 && e.py + 40 > takeoff.y + 8) break; // landed back / below takeoff
  }
  return { worstPlatformDepth, camRise };
}

describe("camera-frame v2 (owner report 2026-10-11)", () => {
  test("full hold-jump keeps the takeoff platform in frame (base mods, 5 daily seeds)", () => {
    for (const date of ["2026-10-11", "2026-10-10", "2026-10-09", "2026-10-08", "2026-10-07"]) {
      const e = dailyEngine(date, BASE_MODS);
      settle(e);
      const { worstPlatformDepth, camRise } = holdJumpArc(e);
      expect(worstPlatformDepth).toBeLessThanOrEqual(-CAM_GROUND_STRIP);
      // terrain barely moves: the whole arc drifts at most one budget
      expect(camRise).toBeLessThanOrEqual(CAM_RISE_BUDGET + 1);
    }
  });

  test("full hold-jump keeps the takeoff platform in frame (low-G mutation)", () => {
    for (const date of ["2026-10-11", "2026-10-10", "2026-10-09", "2026-10-08", "2026-10-07"]) {
      const e = dailyEngine(date, LOW_G);
      settle(e);
      const { worstPlatformDepth, camRise } = holdJumpArc(e);
      expect(worstPlatformDepth).toBeLessThanOrEqual(-CAM_GROUND_STRIP);
      expect(camRise).toBeLessThanOrEqual(CAM_RISE_BUDGET + 1);
    }
  });

  test("upward camera motion is rate-limited and only near the top edge", () => {
    const e = dailyEngine("2026-10-11", BASE_MODS);
    settle(e);
    const camY0 = e.camY;
    e.press();
    let moved = false;
    for (let i = 0; i < 60; i++) {
      e.step(DT);
      if (e.vy >= 0) break;
      if (e.camY < camY0 - 1e-9) {
        moved = true;
        const drop = camY0 - e.camY; // px the camera moved up this tick
        // rate-limited: never a snap, at most one tick of CAM_RISE_RATE
        expect(drop).toBeLessThanOrEqual(CAM_RISE_RATE * DT + 1e-9);
        // engage contract: the engine fires on its PRE-move player position —
        // reconstruct it (py - (camY + drop)) and require it near the top edge
        const preMoveP = e.py - (e.camY + drop);
        expect(preMoveP).toBeLessThan(CAM_RISE_ENGAGE + 20);
        break;
      }
    }
    expect(moved).toBe(true); // a full hold-jump DOES eventually use the drift
  });

  test("after a full jump the camera re-centers (budget never freezes it)", () => {
    const plats: Platform[] = [];
    for (let i = 0; i < 40; i++) {
      plats.push({
        i, x: i * PLATFORM_W, y: 0, w: PLATFORM_W, up: true,
        state: "solid", passed: false, crumble: false,
      } as Platform);
    }
    const e = new Engine(plats, { onDeath: () => {}, onScore: () => {} }, BASE_MODS, "flat-recenter");
    settle(e);
    e.press(); // full hold-jump on a flat runway
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

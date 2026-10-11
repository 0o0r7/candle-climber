/// <reference types="bun-types" />
// CAMERA-FRAME contract v3 (owner report 2026-10-11, three passes:
// "high jump pushes the candles/playfield out of the frame" → asymmetric
// follow → "STILL exits" → drift budget + render zoom → OWNER REJECTED v2:
// «تصویر دیگه روان نیست، لگ میزنه، غیر طبیعی شده» — the budget machinery plus
// the double-applied render zoom broke the frame's smoothness).
//
// v3 = the ORIGINAL single-lerp camera with the takeoff-platform guard folded
// INTO the follow target (Math.max — continuous, no mode switches, no clamps,
// no render zoom). Engine pins:
//  1. FEEL: with the guard inactive (short hops), the camY trace is
//     BIT-IDENTICAL to the original shipped law (reference implemented here).
//  2. The takeoff platform can NEVER slide out of the frame bottom — a
//     CAM_GROUND_STRIP strip stays visible through any arc (base + low-G).
//  3. The player top NEVER leaves the frame top on the same arcs
//     (geometry: apex margin = VIEW_H - PLAYER_H - STRIP - reach ≥ 29px).
//  4. SMOOTHNESS: every per-tick camera move is exactly what one lerp can
//     produce (|ΔcamY| ≤ |desired−camY|·CAM_LERP·dt) — snap clamps forbidden.
//  5. After a full jump the camera re-centers (nothing freezes it).
//  6. Falling deaths still trigger; deterministic runs give identical traces.
import { describe, test, expect } from "bun:test";
import {
  Engine, VIEW_H, CAM_LERP, CAM_GROUND_STRIP,
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

/** The ORIGINAL shipped camera law (pre-camera-frame), verbatim — including
 *  the start-of-level anchor clamp (camY may never go positive). */
function originalCameraStep(e: { py: number; camY: number }, dt: number): number {
  const desired = e.py - VIEW_H * 0.52;
  let camY = e.camY + (desired - e.camY) * Math.min(1, dt * CAM_LERP);
  if (camY > 0) camY = 0;
  return camY;
}

/** Full hold-jump arc: worst frame violations across rise + fall. */
function holdJumpArc(e: Engine) {
  const takeoff = e.groundPlat!;
  e.press(); // jumpHeld stays true through the entire rise (max-height jump)
  let worstPlatformDepth = -Infinity; // >0 ⇒ takeoff top below the frame bottom
  let minPlayerTop = Infinity;        // <0 ⇒ player top above the frame top
  for (let i = 0; i < 150; i++) { // 2.5s > rise + fall of any reachable arc
    e.step(DT);
    if (e.dead) break;
    worstPlatformDepth = Math.max(worstPlatformDepth, takeoff.y - e.camY - VIEW_H);
    minPlayerTop = Math.min(minPlayerTop, e.py - e.camY);
    if (e.vy > 0 && e.py + 40 > takeoff.y + 8) break; // landed back / below takeoff
  }
  return { worstPlatformDepth, minPlayerTop };
}

describe("camera-frame v3 (owner report 2026-10-11, smoothness restored)", () => {
  test("FEEL: short-hop camY trace is bit-identical to the original law (guard never fires)", () => {
    for (const date of ["2026-10-11", "2026-10-10", "2026-10-09"]) {
      const e = dailyEngine(date, BASE_MODS);
      settle(e); // camera reaches its steady anchor before the compared script
      let guardFired = false;
      // NOTE: the engine's camera code consumes the POST-physics py/lastGroundY
      // of the same step — so the reference reads them AFTER e.step(), paired
      // with the PRE-step camY. That pair is exactly the law's real input.
      const checkTick = () => {
        const camBefore = e.camY;
        e.step(DT);
        const guardActive = e.py - VIEW_H * 0.52 < e.lastGroundY - VIEW_H + CAM_GROUND_STRIP;
        if (guardActive) guardFired = true;
        else expect(e.camY).toBe(originalCameraStep({ py: e.py, camY: camBefore }, DT));
      };
      for (let hop = 0; hop < 6 && !e.dead; hop++) {
        e.press();
        e.step(DT); // jump executes (physics+camera in one tick — checked below)
        e.release(); // immediate cut ⇒ short hop, floor stays inactive
        for (let i = 0; i < 120 && !e.grounded && !e.dead; i++) checkTick();
        for (let i = 0; i < 120 && !e.dead; i++) checkTick(); // grounded settle — compared too
      }
      expect(guardFired).toBe(false);
    }
  });

  test("full hold-jump keeps the takeoff platform in frame (base mods, 5 daily seeds)", () => {
    for (const date of ["2026-10-11", "2026-10-10", "2026-10-09", "2026-10-08", "2026-10-07"]) {
      const e = dailyEngine(date, BASE_MODS);
      settle(e);
      const { worstPlatformDepth } = holdJumpArc(e);
      expect(worstPlatformDepth).toBeLessThanOrEqual(-CAM_GROUND_STRIP);
    }
  });

  test("full hold-jump keeps the takeoff platform in frame (low-G mutation)", () => {
    for (const date of ["2026-10-11", "2026-10-10", "2026-10-09", "2026-10-08", "2026-10-07"]) {
      const e = dailyEngine(date, LOW_G);
      settle(e);
      const { worstPlatformDepth } = holdJumpArc(e);
      expect(worstPlatformDepth).toBeLessThanOrEqual(-CAM_GROUND_STRIP);
    }
  });

  test("player top never leaves the frame top on max arcs (base + low-G, 5 daily seeds)", () => {
    for (const mods of [BASE_MODS, LOW_G]) {
      for (const date of ["2026-10-11", "2026-10-10", "2026-10-09", "2026-10-08", "2026-10-07"]) {
        const e = dailyEngine(date, mods);
        settle(e);
        const { minPlayerTop } = holdJumpArc(e);
        expect(minPlayerTop).toBeGreaterThanOrEqual(0);
      }
    }
  });

  test("SMOOTHNESS: every camera move is exactly the single lerp — snaps forbidden", () => {
    for (const mods of [BASE_MODS, LOW_G]) {
      const e = dailyEngine("2026-10-11", mods);
      settle(e);
      e.press(); // one full hold-jump, watched tick by tick
      for (let i = 0; i < 150; i++) {
        const camBefore = e.camY;
        e.step(DT);
        if (e.dead) break;
        // v3 law, recomputed exactly from the engine's real inputs (post-
        // physics py/lastGroundY + pre-step camY): one lerp toward
        // max(desired, floor). ANY faster move (snap clamp / drift) fails.
        const target = Math.max(e.py - VIEW_H * 0.52, e.lastGroundY - VIEW_H + CAM_GROUND_STRIP);
        const allowed = Math.abs(target - camBefore) * Math.min(1, DT * CAM_LERP) + 1e-9;
        expect(Math.abs(e.camY - camBefore)).toBeLessThanOrEqual(allowed);
        if (e.vy > 0 && e.grounded) break;
      }
    }
  });

  test("after a full jump the camera re-centers (nothing freezes it)", () => {
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

  test("falling deaths still trigger with the soft ground guard in place", () => {
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

  test("determinism: identical daily runs produce identical camera traces", () => {
    const trace = (mods: MutationMods) => {
      const e = dailyEngine("2026-10-11", mods);
      settle(e);
      const out: number[] = [];
      e.press();
      for (let i = 0; i < 150; i++) {
        e.step(DT);
        out.push(Math.round(e.camY * 1e6) / 1e6);
        if (e.vy > 0 && e.grounded) break;
      }
      return out;
    };
    for (const mods of [BASE_MODS, LOW_G]) {
      expect(trace(mods)).toEqual(trace(mods));
    }
  });
});

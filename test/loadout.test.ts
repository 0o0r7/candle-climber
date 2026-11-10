/// <reference types="bun-types" />
// P0.6 practice loadouts + audio variety — contract tests.
// Pins the design law in docs/PRACTICE-LOADOUTS.md:
//  1. Every loadout moves WHEN a press is accepted, never HOW FAR it flies:
//     no option may add air jumps or exceed the shipped air-jump reach, so the
//     level's authored steps (MAX_UP) stay the only way up.
//  2. STANDARD is literally the engine defaults — no second copy to drift.
//  3. Each alternative LOSES something (a real trade-off, not a power-up).
//  4. The ranked lane always climbs STANDARD, whatever the picker says.
import { describe, test, expect } from "bun:test";
import {
  Engine, AIR_JUMP_V, AIR_JUMPS, BUFFER, COYOTE, DEFAULT_RECOVERY, GRAVITY,
  VIEW_W, PLAYER_W, PLAYER_X_FRAC, type RecoveryProfile, type SfxName,
} from "@/game/cc/engine";
import { LOADOUTS, LOADOUT_ORDER, loadoutById, recoveryForRun } from "@/game/cc/loadout";
import { MAX_UP, PLATFORM_W } from "@/game/cc/level";
import type { Platform } from "@/game/cc/types";

const DT = 1 / 60;
const AIR_REACH = (AIR_JUMP_V * AIR_JUMP_V) / (2 * GRAVITY);
const ANCHOR = VIEW_W * PLAYER_X_FRAC - PLAYER_W / 2;

function flatPlats(n: number): Platform[] {
  const out: Platform[] = [];
  for (let i = 0; i < n; i++) {
    out.push({
      i, x: i * PLATFORM_W, y: 0, w: PLATFORM_W, up: true,
      state: "solid", passed: false, crumble: false,
    } as Platform);
  }
  return out;
}

function engineWith(recovery?: RecoveryProfile, heard?: SfxName[]) {
  return new Engine(
    flatPlats(400),
    {
      onDeath: () => {},
      onScore: () => {},
      ...(heard ? { onSfx: (s: SfxName) => heard.push(s) } : {}),
    },
    undefined,
    "p06-loadout",
    recovery,
  );
}

function settle(e: Engine) {
  for (let i = 0; i < 400 && !e.grounded; i++) e.step(DT);
  expect(e.grounded).toBe(true);
}

describe("P0.6 — the fairness law holds for every loadout", () => {
  test("the air-jump reach is unchanged and still under MAX_UP", () => {
    expect(AIR_REACH).toBeLessThan(MAX_UP);
    for (const id of LOADOUT_ORDER) {
      // No loadout may raise the verb count above the shipped one: two air
      // jumps would stack to ~208px and defeat MAX_UP outright.
      expect(LOADOUTS[id].recovery.airJumps).toBeLessThanOrEqual(AIR_JUMPS);
    }
  });

  test("STANDARD is the engine defaults, not a copy", () => {
    expect(LOADOUTS.standard.recovery).toEqual({ coyote: COYOTE, buffer: BUFFER, airJumps: AIR_JUMPS });
    expect(DEFAULT_RECOVERY).toEqual(LOADOUTS.standard.recovery);
  });

  test("every option wins one window and loses another", () => {
    const { grounded, aerial, standard } = LOADOUTS;
    // GROUNDED: more ledge grace, less input grace, and the verb is gone.
    expect(grounded.recovery.coyote).toBeGreaterThan(standard.recovery.coyote);
    expect(grounded.recovery.buffer).toBeLessThan(standard.recovery.buffer);
    expect(grounded.recovery.airJumps).toBe(0);
    // AERIAL: the verb + a long buffer, at the cost of the ledge window.
    expect(aerial.recovery.airJumps).toBe(AIR_JUMPS);
    expect(aerial.recovery.buffer).toBeGreaterThan(standard.recovery.buffer);
    expect(aerial.recovery.coyote).toBeLessThan(standard.recovery.coyote);
  });

  test("the ranked lane always climbs STANDARD", () => {
    for (const id of LOADOUT_ORDER) {
      expect(recoveryForRun(false, id)).toEqual(LOADOUTS.standard.recovery);
      expect(recoveryForRun(true, id)).toEqual(LOADOUTS[id].recovery);
    }
  });

  test("unknown ids fall back to STANDARD (never to an easier profile)", () => {
    expect(loadoutById("nope").id).toBe("standard");
    expect(loadoutById(null).id).toBe("standard");
    expect(loadoutById(undefined).id).toBe("standard");
  });
});

describe("P0.6 — the engine actually consumes the profile", () => {
  test("the input buffer comes from the profile", () => {
    const e = engineWith({ coyote: COYOTE, buffer: 0.4, airJumps: 1 });
    e.press();
    expect(e.buffer).toBeCloseTo(0.4, 6);
  });

  test("the coyote window is refilled on landing from the profile", () => {
    const e = engineWith({ coyote: 0.3, buffer: BUFFER, airJumps: 1 });
    settle(e);
    expect(e.coyote).toBeGreaterThan(0.25);
  });

  test("an airJumps:0 profile never fires the second jump", () => {
    const e = engineWith({ coyote: COYOTE, buffer: BUFFER, airJumps: 0 });
    settle(e);
    e.press();
    e.step(DT);                       // ground jump executes at the end of this step
    for (let i = 0; i < 10; i++) e.step(DT);
    const vyBefore = e.vy;
    e.press();                        // no verb left — must not add an impulse
    e.step(DT);
    expect(e.airJumpsLeft).toBe(0);
    expect(e.vy).toBeGreaterThan(vyBefore); // gravity only, no new impulse
  });

  test("the default constructor keeps the shipped windows (no behaviour drift)", () => {
    const e = engineWith();
    expect(e.recovery).toEqual({ coyote: COYOTE, buffer: BUFFER, airJumps: AIR_JUMPS });
    expect(e.airJumpsLeft).toBe(AIR_JUMPS);
  });
});

describe("P0.6 — audio variety wiring", () => {
  test("the air jump gets its own voice, not the ground jump's", () => {
    const heard: SfxName[] = [];
    const e = engineWith({ coyote: COYOTE, buffer: BUFFER, airJumps: 1 }, heard);
    settle(e);
    e.press();
    e.step(DT);
    expect(heard).toContain("jump");
    for (let i = 0; i < 20; i++) e.step(DT);
    e.press();
    e.step(DT);
    expect(heard).toContain("air");
    expect(heard.filter((s) => s === "jump").length).toBe(1); // the ground jump only
  });

  test("a STYLE event plays the gold chime", () => {
    const heard: SfxName[] = [];
    const e = engineWith({ coyote: COYOTE, buffer: BUFFER, airJumps: 1 }, heard);
    settle(e);
    // Park the player on the last 5px of its platform: a LATE hop by definition.
    const p = e.groundPlat as Platform;
    e.camX = p.x + p.w - 5 - PLAYER_W - ANCHOR;
    e.press();
    e.step(DT);
    expect(heard).toContain("style");
  });
});

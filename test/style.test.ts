/// <reference types="bun-types" />
// P0.4 STYLE score — contract tests (bun test).
// Pins the quality axis defined in src/game/cc/style.ts and documented in
// docs/STYLE-SCORE.md:
//  1. STYLE counts only CHOSEN risk: a LATE hop (+3) or a forgiveness SAVE (+2).
//  2. A careful jump — plenty of platform left — earns nothing.
//  3. STYLE is input-derived: same inputs ⇒ identical tally (replay-exact).
//  4. STYLE never feeds the score or the leaderboard cap.
import { describe, test, expect } from "bun:test";
import { Engine, VIEW_W, PLAYER_W, PLAYER_X_FRAC, COYOTE } from "@/game/cc/engine";
import { PLATFORM_W } from "./../src/game/cc/level";
import type { Platform } from "@/game/cc/types";
import { STYLE_LATE_RUNWAY, STYLE_POINTS, styleGain, styleScore, emptyStyle } from "@/game/cc/style";

const SEED = "p04-style";
const DT = 1 / 60;
const ANCHOR = VIEW_W * PLAYER_X_FRAC - PLAYER_W / 2; // world px offset from camX

/** Flat all-green runway: contiguous platforms, no gaps, no deaths by terrain. */
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

function makeEngine(): Engine {
  return new Engine(flatPlats(400), { onDeath: () => {}, onScore: () => {} }, undefined, SEED);
}

function settle(e: Engine) {
  for (let i = 0; i < 400 && !e.grounded; i++) e.step(DT);
  expect(e.grounded).toBe(true);
}

/** Park the player on its current platform with an exact runway ahead of it. */
function setRunway(e: Engine, runway: number) {
  const p = e.groundPlat as Platform;
  e.camX = p.x + p.w - runway - PLAYER_W - ANCHOR;
}

describe("P0.4 STYLE — pure math", () => {
  test("point table is the documented one (late 3, save 2)", () => {
    expect(STYLE_POINTS).toEqual({ late: 3, save: 2 });
    expect(styleGain("late")).toBe(3);
    expect(styleGain("save")).toBe(2);
  });

  test("tally totals are the weighted sum, empty tally is 0", () => {
    expect(styleScore(emptyStyle())).toBe(0);
    expect(styleScore({ late: 2, save: 3 })).toBe(2 * 3 + 3 * 2);
  });

  test("late window is a positive px budget", () => {
    expect(STYLE_LATE_RUNWAY).toBeGreaterThan(0);
    expect(STYLE_LATE_RUNWAY).toBeLessThan(PLATFORM_W);
  });
});

describe("P0.4 STYLE — engine events", () => {
  test("careful jump (platform to spare) earns NO style", () => {
    const e = makeEngine();
    settle(e);
    setRunway(e, STYLE_LATE_RUNWAY + 30);
    e.press();
    e.step(DT);
    expect(e.grounded).toBe(false); // the jump did fire
    expect(e.style).toBe(0);
    expect(e.styleLate).toBe(0);
    expect(e.styleSave).toBe(0);
  });

  test("LATE hop from the last px of a platform earns +3", () => {
    const e = makeEngine();
    settle(e);
    setRunway(e, STYLE_LATE_RUNWAY - 4);
    e.press();
    e.step(DT);
    expect(e.styleLate).toBe(1);
    expect(e.style).toBe(STYLE_POINTS.late);
  });

  test("the late window is inclusive at its boundary", () => {
    const e = makeEngine();
    settle(e);
    setRunway(e, STYLE_LATE_RUNWAY);
    e.press();
    e.step(DT);
    expect(e.styleLate).toBe(1);
  });

  test("a jump rescued by the input buffer is a SAVE (+2), not a LATE", () => {
    const e = makeEngine();
    settle(e);
    setRunway(e, STYLE_LATE_RUNWAY + 30);
    e.press(); // normal jump — no style
    e.step(DT);
    expect(e.style).toBe(0);
    // fall, then press a few px above the ground: the buffer carries it to the
    // landing frame, and only that grace makes the jump happen at all
    let pressedInAir = false;
    for (let i = 0; i < 400 && !e.grounded; i++) {
      if (e.vy > 0 && e.py + 40 > -30) { e.press(); pressedInAir = true; break; }
      e.step(DT);
    }
    expect(pressedInAir).toBe(true);
    expect(e.grounded).toBe(false);
    for (let i = 0; i < 60 && e.style === 0; i++) e.step(DT);
    expect(e.styleSave).toBe(1);
    expect(e.style).toBe(STYLE_POINTS.save);
    expect(e.styleLate).toBe(0);
  });

  test("a coyote jump (already off the ledge) is a SAVE", () => {
    const e = makeEngine();
    settle(e);
    setRunway(e, STYLE_LATE_RUNWAY + 30);
    // walk off the edge: camera carries the platform out from under the player
    for (let i = 0; i < 400 && (e.grounded || e.coyote <= 0); i++) {
      if (e.grounded) setRunway(e, -PLAYER_W - 2); // platform ends under the feet
      e.step(DT);
      // keep the platform's edge just behind once airborne
      if (!e.grounded && e.coyote > 0) break;
    }
    expect(e.grounded).toBe(false);
    expect(e.coyote).toBeGreaterThan(0);
    expect(e.coyote).toBeLessThanOrEqual(COYOTE);
    e.press();
    e.step(DT);
    expect(e.styleSave).toBe(1);
    expect(e.style).toBe(STYLE_POINTS.save);
  });

  test("determinism: identical inputs ⇒ identical style tally", () => {
    const a = makeEngine();
    const b = makeEngine();
    for (const e of [a, b]) {
      settle(e);
      setRunway(e, STYLE_LATE_RUNWAY - 2);
      e.press();
    }
    for (let i = 0; i < 240; i++) {
      if (i === 60) { a.press(); b.press(); }
      if (i === 90) { a.release(); b.release(); }
      a.step(DT); b.step(DT);
    }
    expect(b.style).toBe(a.style);
    expect(b.styleLate).toBe(a.styleLate);
    expect(b.styleSave).toBe(a.styleSave);
    expect(b.score).toBe(a.score);
  });
});

describe("P0.4 STYLE — the death payload", () => {
  test("RunResult carries the tally; score stays the score", () => {
    let seen: { style?: number; score: number } | null = null;
    const e = new Engine(
      flatPlats(12), // short runway: the terrain ends and the run genuinely dies
      { onDeath: (r) => { seen = { style: r.style, score: r.score }; }, onScore: () => {} },
      undefined,
      SEED,
    );
    settle(e);
    setRunway(e, STYLE_LATE_RUNWAY - 5);
    e.press();
    e.step(DT);
    // let the run end: never press again, the camera outruns the platforms
    for (let i = 0; i < 4000 && !e.dead; i++) e.step(DT);
    expect(e.dead).toBe(true);
    expect(seen).not.toBeNull();
    expect(seen!.style).toBe(STYLE_POINTS.late);
    expect(seen!.score).toBe(Math.floor(e.score));
  });
});

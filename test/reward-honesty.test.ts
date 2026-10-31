/// <reference types="bun-types" />
// Reward honesty (2026-10-31) — pins the contract behind the score change:
//   A candle pays ONLY when the climber actually lands on it. Camera distance
//   and the launch pad pay nothing, so standing still can never buy points.
// Before this contract a zero-input run banked ~90 pts on the daily level.
import { describe, test, expect } from "bun:test";
import { Engine, VIEW_W, PLAYER_H } from "@/game/cc/engine";
import { CANDLE_W, PLATFORM_W, LAUNCH_PAD } from "@/game/cc/level";
import type { Platform } from "@/game/cc/types";

const SEED = "reward-honesty-test";
const DT = 1 / 60;

function mk(i: number, w: number, y = 0): Platform {
  return {
    i, x: i * CANDLE_W, y, w, up: true,
    state: w > 0 ? "solid" : "gone", passed: false, crumble: false,
  } as Platform;
}

/** Pad (the only gapless stretch a level builds) followed by void. */
function padThenVoid(n: number, solidFrom?: number): Platform[] {
  const out: Platform[] = [];
  for (let i = 0; i < n; i++) {
    const launch = i < LAUNCH_PAD;
    const solid = launch || (solidFrom !== undefined && i === solidFrom);
    out.push(mk(i, launch ? CANDLE_W : solid ? PLATFORM_W : 0));
  }
  return out;
}

function makeEngine(plats: Platform[]): Engine {
  return new Engine(plats, { onDeath: () => {}, onScore: () => {} }, undefined, SEED);
}

describe("reward honesty — only landings pay", () => {
  test("the pad pays nothing: camera passage alone moves no score", () => {
    const e = makeEngine(padThenVoid(80));
    for (let s = 0; s < 600; s++) e.step(DT); // 10s of doing nothing
    expect(e.candlesPassed).toBeGreaterThanOrEqual(LAUNCH_PAD);
    expect(e.climbed).toBe(0);
    expect(e.score).toBe(0);
  });

  test("standing on a pad candle never pays", () => {
    const e = makeEngine(padThenVoid(80));
    const p = e.plats[2]; // inside the launch pad
    e.camX = p.x + p.w / 2 - VIEW_W * 0.3;
    e.py = p.y - PLAYER_H - 6;
    e.vy = 200;
    for (let s = 0; s < 400 && !e.grounded; s++) e.step(DT);
    expect(e.grounded).toBe(true);
    expect(e.climbed).toBe(0);
    expect(e.score).toBe(0);
  });

  test("one landing pays once; no second payment without a new landing", () => {
    const e = makeEngine(padThenVoid(80, LAUNCH_PAD + 4));
    const p = e.plats[LAUNCH_PAD + 4];
    e.camX = p.x + p.w / 2 - VIEW_W * 0.3;
    e.py = p.y - PLAYER_H - 6;
    e.vy = 200;
    for (let s = 0; s < 400 && e.climbed === 0; s++) e.step(DT);
    expect(e.climbed).toBe(1);
    const paid = e.score;
    expect(paid).toBeGreaterThan(0);
    for (let s = 0; s < 60; s++) e.step(DT); // one second on the same candle
    expect(e.climbed).toBe(1);
    expect(e.score).toBeCloseTo(paid, 9);
  });
});

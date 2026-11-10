/// <reference types="bun-types" />
// P0.6 gamepad input — contract tests for the pure mapping layer.
// The law (docs/GAMEPAD.md): a pad press is the SAME Engine.press() a key press
// is — same windows, same determinism, no scoring surface. These tests pin the
// mapping (standard layout), the deadzone, and the edge detection the polling
// loop relies on, so a wrong button index cannot ship silently.
import { describe, test, expect } from "bun:test";
import {
  PAD_DEADZONE, PAD_INDEX, padEdges, pickActivePad, readPadIntent,
  type PadIntent, type PadSnapshot,
} from "@/game/cc/gamepad";

function pad(down: number[] = [], axes: number[] = [0, 0]): PadSnapshot {
  return { buttons: Array.from({ length: 17 }, (_, i) => ({ pressed: down.includes(i) })), axes };
}

const NONE: PadIntent = { jump: false, rush: false, pause: false };

describe("P0.6 gamepad — mapping", () => {
  test("no pad means nothing held (never a throw)", () => {
    expect(readPadIntent(null)).toEqual(NONE);
    expect(readPadIntent(undefined)).toEqual(NONE);
  });

  test("an idle pad means nothing held", () => {
    expect(readPadIntent(pad())).toEqual(NONE);
  });

  test("A, X and D-pad up all jump", () => {
    for (const button of [PAD_INDEX.jumpA, PAD_INDEX.jumpX, PAD_INDEX.dpadUp]) {
      expect(readPadIntent(pad([button])).jump).toBe(true);
    }
  });

  test("the left stick jumps only past the deadzone", () => {
    expect(readPadIntent(pad([], [0, -PAD_DEADZONE])).jump).toBe(false);
    expect(readPadIntent(pad([], [0, -0.9])).jump).toBe(true);
  });

  test("RT and RB are RUSH; START is pause", () => {
    expect(readPadIntent(pad([PAD_INDEX.rushRT])).rush).toBe(true);
    expect(readPadIntent(pad([PAD_INDEX.rushRB])).rush).toBe(true);
    expect(readPadIntent(pad([PAD_INDEX.pauseStart])).pause).toBe(true);
    // …and none of them leak into jump
    expect(readPadIntent(pad([PAD_INDEX.rushRT, PAD_INDEX.pauseStart])).jump).toBe(false);
  });
});

describe("P0.6 gamepad — edges", () => {
  test("holding jump reports one press, then one release", () => {
    const down = readPadIntent(pad([PAD_INDEX.jumpA]));
    expect(padEdges(NONE, down)).toEqual({
      jumpPressed: true, jumpReleased: false,
      rushPressed: false, rushReleased: false, pausePressed: false,
    });
    expect(padEdges(down, down)).toEqual({
      jumpPressed: false, jumpReleased: false,
      rushPressed: false, rushReleased: false, pausePressed: false,
    });
    expect(padEdges(down, NONE).jumpReleased).toBe(true);
  });

  test("RUSH and pause are edge-detected too (no repeated toggles)", () => {
    const rush = readPadIntent(pad([PAD_INDEX.rushRT]));
    const pause = readPadIntent(pad([PAD_INDEX.pauseStart]));
    expect(padEdges(NONE, rush).rushPressed).toBe(true);
    expect(padEdges(rush, rush).rushPressed).toBe(false);
    expect(padEdges(NONE, pause).pausePressed).toBe(true);
    expect(padEdges(pause, pause).pausePressed).toBe(false);
  });
});

describe("P0.6 gamepad — pad selection", () => {
  test("no connected pads → null; idle pad still counts", () => {
    expect(pickActivePad([null, undefined])).toBeNull();
    expect(pickActivePad([pad()])).not.toBeNull();
  });

  test("the pad the player is actually touching wins", () => {
    const idle = pad();
    const active = pad([PAD_INDEX.jumpA]);
    expect(pickActivePad([idle, active])).toBe(active);
  });
});

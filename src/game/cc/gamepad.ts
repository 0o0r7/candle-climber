// Gamepad input (P0.6) — the missing INPUT breadth (ten-pattern #6).
//
// WHY: the audit's input row read "jump + RUSH, no gamepad". A browser game
// whose whole skill expression is a timing press should accept the device that
// players already hold for this genre. The mapping is the platform STANDARD
// mapping, so nothing here is bespoke:
//
//   A (0) · X (2) · D-pad ↑ (12) · left stick ↑   → jump / start / continue
//   RT (7) · RB (5)                                → RUSH (hold)
//   START (9)                                      → pause / resume
//
// PURE by construction: `readPadIntent` maps a snapshot to intent, `padEdges`
// derives the rising/falling edges. No navigator access here, so both are
// unit-testable without a browser (test/gamepad.test.ts); the polling loop lives
// in GameCanvas and does nothing else.
//
// NO BALANCE SURFACE: a pad press is the same `Engine.press()` a key press is —
// same coyote/buffer windows, same determinism. Input breadth must never become
// a scoring advantage.

export interface PadButtonState {
  pressed: boolean;
}

export interface PadSnapshot {
  buttons: readonly PadButtonState[];
  axes: readonly number[];
}

/** What one frame of the pad asks the game to do (held state, not edges). */
export interface PadIntent {
  jump: boolean;
  rush: boolean;
  pause: boolean;
}

/** Standard-mapping button indices — named so the mapping is not a magic array. */
export const PAD_INDEX = {
  jumpA: 0,
  jumpX: 2,
  rushRB: 5,
  rushRT: 7,
  pauseStart: 9,
  dpadUp: 12,
} as const;

/** Left stick counts as "up" past this deflection (platform-typical). */
export const PAD_DEADZONE = 0.5;

const EMPTY: PadIntent = { jump: false, rush: false, pause: false };

const held = (pad: PadSnapshot, i: number): boolean => Boolean(pad.buttons[i]?.pressed);

/** Map a pad snapshot to intent. A missing pad is "nothing held", never a throw. */
export function readPadIntent(pad: PadSnapshot | null | undefined): PadIntent {
  if (!pad) return EMPTY;
  const stickUp = typeof pad.axes[1] === "number" && pad.axes[1] < -PAD_DEADZONE;
  return {
    jump: held(pad, PAD_INDEX.jumpA) || held(pad, PAD_INDEX.jumpX) || held(pad, PAD_INDEX.dpadUp) || stickUp,
    rush: held(pad, PAD_INDEX.rushRT) || held(pad, PAD_INDEX.rushRB),
    pause: held(pad, PAD_INDEX.pauseStart),
  };
}

/** Edges between two frames — the caller keeps the previous intent. */
export interface PadEdges {
  jumpPressed: boolean;
  jumpReleased: boolean;
  rushPressed: boolean;
  rushReleased: boolean;
  pausePressed: boolean;
}

export function padEdges(prev: PadIntent, next: PadIntent): PadEdges {
  return {
    jumpPressed: next.jump && !prev.jump,
    jumpReleased: !next.jump && prev.jump,
    rushPressed: next.rush && !prev.rush,
    rushReleased: !next.rush && prev.rush,
    pausePressed: next.pause && !prev.pause,
  };
}

/**
 * The pad to read: the first connected one that reports any held input, else the
 * first connected one (so "connected but idle" still counts as present for the
 * caller's hint logic). `null` when nothing is connected.
 */
export function pickActivePad(pads: readonly (PadSnapshot | null | undefined)[]): PadSnapshot | null {
  const connected = pads.filter((p): p is PadSnapshot => Boolean(p));
  if (connected.length === 0) return null;
  return connected.find((p) => p.buttons.some((b) => b.pressed)) ?? connected[0];
}

# GAMEPAD — input breadth without a balance surface

**Status:** shipped 2026-11-10 (P0.6). Code: `src/game/cc/gamepad.ts`.
Poll loop: `GameCanvas.tsx`. Tests: `test/gamepad.test.ts`.

## The gap it closes

The ten-pattern audit's input row read *"jump + RUSH, no gamepad"* — odd for a
game whose entire skill expression is one well-timed press, in a genre players
already hold a pad for. Keyboard and touch remain the primary paths; the pad is
an addition, never a replacement.

## Mapping (platform standard layout)

| Input | Button | Action |
|---|---|---|
| A · X · D-pad ↑ · left stick ↑ | 0 · 2 · 12 · axes[1] < −0.5 | jump / start / continue |
| RT · RB | 7 · 5 | RUSH (hold) |
| START | 9 | pause / resume |

Indices are named constants (`PAD_INDEX`), not magic numbers, so a wrong mapping
is a one-line bug rather than a hunt. The stick needs `PAD_DEADZONE` (0.5)
deflection, the platform-typical threshold — pinned by a test.

## Why it cannot change the game

A pad press calls the **same** `Engine.press()` the Space key calls: same coyote
window, same input buffer, same fixed-timestep determinism, so a replay recorded
from a pad is byte-identical to one from a keyboard. Edge detection
(`padEdges`) exists purely so a held A does not restart a run every frame.

Two parity details carried over from the keyboard handler on purpose:

- **RUSH only counts while a run is live** — pressing RT on the ready screen must
  not mark `usedRushRef` and silently forfeit DIAMOND HANDS (the same bug class
  G5 fixed for the Shift key).
- **The tutorial owns the first press**, so a pad press cannot start a run behind
  the wizard.

## Structure

- `readPadIntent(snapshot)` — pure mapping, no `navigator` access.
- `padEdges(prev, next)` — rising/falling edges.
- `pickActivePad(pads)` — the pad the player is touching wins; an idle connected
  pad still counts as present.
- The polling loop lives in `GameCanvas.tsx` and does nothing but translate edges
  into the existing verbs; it exits early when `navigator.getGamepads` is absent
  (Safari/iOS), so no polyfill or fallback is needed.

## Verification

- `test/gamepad.test.ts` — 9 cases: null/idle pad, all three jump buttons, the
  deadzone boundary, RUSH/pause mapping and non-leakage into jump, edge detection
  for hold/release, and pad selection.
- `bun test` → 707 pass / 0 fail; `tsc --noEmit` clean.
- **Not automatically verified:** a physical pad talking to a browser. The mapping
  and edge logic are unit-tested, but a real controller must be tried by hand.

## Not done (on purpose)

Remapping UI, rumble, and pad-specific HUD prompts. The first two are feature
work nobody asked for yet; the third would mislead if a pad is connected but not
used.

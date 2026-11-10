# ACCESSIBILITY PALETTE — why the up/down pair was retuned

> Written 2026-11-10. Closes the known issue "color-blind contrast ratios for
> up/down candles need optimization" from the 2026-11-10 game-design analysis.
> Code: `src/game/cc/palette.ts` (single definition) ·
> Contract test: `test/palette.test.ts`. Source rule this must never break:
> `docs/ART-DIRECTION.md` §1 — "up-green and down-coral always mean up/down".

## 1. The problem, measured

Green (`#5BD08A`) and coral (`#E07856`) are the one piece of information a
player cannot get wrong: a down platform is a threat, an up platform is a step.
Under **deuteranopia** — the most common color-vision deficiency, ~6% of men —
those two hues collapse toward the same yellow-grey. Measured with the Machado,
Oliveira & Fernandes (2009) severity-1.0 simulation in linear RGB and WCAG
relative luminance:

| Pair | Normal | Protanopia | Deuteranopia | Tritanopia |
|---|---|---|---|---|
| old body `#5BD08A` vs `#E07856` | 1.55:1 | 2.00:1 | **1.34:1** | 1.55:1 |
| old cap `#CCFF00` vs `#F0A48E` | 1.72:1 | 1.87:1 | **1.56:1** | 1.70:1 |

A 1.34:1 difference is indistinguishable. The game was relying on hue, plus the
opt-in hatch toggle — color alone was carrying the meaning by default.

## 2. The fix: separate by luminance, keep the hue family

Hue is what CVD removes; luminance is what survives every simulation. So the
pair was re-tuned to be far apart in **lightness** while staying inside the same
families (green = up, warm red = down). Nothing else about the material changed:
veins, charred cracks, the ink outline and the hatch toggle are all still there,
so the shapes say it a second way.

| Surface | Old | New | Contrast vs bg `#101214` |
|---|---|---|---|
| up body | `#5BD08A` | **`#66DE9A`** | 11.16:1 |
| down body | `#E07856` | **`#A24C2F`** | 3.23:1 |
| up cap (walkable) | `#CCFF00` | `#CCFF00` (unchanged) | 15.98:1 |
| down cap (walkable) | `#F0A48E` | **`#BC8057`** | 5.69:1 |

Resulting separation (same simulation as above):

| Pair | Normal | Protanopia | Deuteranopia | Tritanopia |
|---|---|---|---|---|
| new body | 3.46:1 | 4.49:1 | **2.98:1** | 3.42:1 |
| new cap | 2.81:1 | 3.04:1 | **2.55:1** | 2.77:1 |

Every platform surface also clears WCAG 1.4.11's **3:1 non-text floor** against
the background, and each cap is still the brightest part of its platform
(`cap/body` = 1.43:1 up, 1.76:1 down) — the walkable edge reads first, which is
the thing a jump needs.

## 2.1 Two reds, on purpose

Darkening the down surface costs contrast on **text**, so the red was split into
two tokens instead of one being pushed out of range:

| Token | Value | Use | Contrast vs bg |
|---|---|---|---|
| `PLATFORM_DOWN` | `#A24C2F` | candle bodies, wicks, wreckage, HUD fills | 3.23:1 (non-text floor) |
| `ACCENT_DOWN` / `--cc-down-ink` | `#E07856` | small text and accents: "CRUMBLES", the Death Card's cause line, the liquidated headline, the mascot's scarf | 6.25:1 (body-text AA) |

Green did not need the split: the retuned up-green is brighter than the old one,
so it clears body-text contrast in both roles.

## 3. What is pinned by the test

`bun test test/palette.test.ts` fails if anyone:

- pushes a platform surface below 3:1 against the background;
- reduces up-vs-down or cap-vs-cap separation below **2.5:1** under any of the
  three simulated deficiencies;
- makes a cap darker than its body;
- moves the pair outside its semantic hue family (up 120–170°, down 5–30°) —
  the ART-DIRECTION §1 rule, now enforced by a number instead of a comment;
- lets the `r,g,b` alpha strings drift from the hex constants.

## 4. One definition, six call sites

The pair used to be copied as a literal into the v1 renderer, the v2 renderer,
the candle rain, the wreckage tint, the Death Card and the mini chart. They now
all import `game/cc/palette.ts`. Character auras and the vault chest keep their
own accents on purpose: they are material identity, not market semantics.

## 5. Limits (honest)

- Machado's matrices are a **population model**, not an individual's vision. The
  test proves a separation that holds for the simulated severity; it cannot
  prove readability for a specific player. The hatch toggle remains the
  per-player escape hatch.
- 2.5:1 is this game's internal target for large, spatially separated platform
  surfaces, **not** a WCAG text or component requirement — 3:1 is, and the
  bodies/caps are checked against that for the background only.
- The caps are 8 px strips. Their separation improved, but they are still small;
  the ink outline is what keeps them legible, as before.

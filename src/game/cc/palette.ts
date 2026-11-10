// Candle material palette — the two colors the GAME depends on.
//
// WHY one module: the same up/down pair was copied as a literal into the v1
// renderer, the v2 renderer, the candle rain, the wreckage tint, the death card
// and the mini chart. That copy is how a palette drifts, and the pair is the
// one thing in this game that must never drift: it is how a player knows
// whether a platform is safe before they commit a jump (ART-DIRECTION §1,
// "semantic rule (inviolable): up-green and down-coral always mean up/down").
//
// ACCESSIBILITY (retuned 2026-11-10, docs/ACCESSIBILITY-PALETTE.md):
//   · every platform surface keeps ≥3:1 contrast against the bg (#101214) —
//     WCAG 1.4.11's non-text floor;
//   · up and down stay ≥2.5:1 apart AFTER simulated protanopia, deuteranopia
//     and tritanopia, so the meaning survives the common color-vision
//     deficiencies by LUMINANCE, not by hue;
//   · the walkable cap stays the brightest part of the platform in both cases:
//     lime on up, a light terracotta on down (outlined in ink, as before).
// The shapes still say it a second way (up = live veins, down = charred cracks,
// plus the optional hatch in settings) — color is never the only channel.
//
// Contract test: test/palette.test.ts. Every renderer reads these constants;
// never paste a hex copy of a platform color again.
export const PLATFORM_UP = "#66DE9A";
export const PLATFORM_DOWN = "#A24C2F";
/** Walkable cap (the `p.y` surface strip). CAP_UP is the locked lime. */
export const PLATFORM_CAP_UP = "#CCFF00";
export const PLATFORM_CAP_DOWN = "#BC8057";
/** Same colors as `r,g,b` for the rgba() strings alpha work needs. */
export const PLATFORM_UP_RGB = "102,222,154";
export const PLATFORM_DOWN_RGB = "162,76,47";

/** The red for TEXT and small accents (labels, the Death Card's cause line, the
 *  mascot's scarf): 6.25:1 on the dark bg. The platform surface above is tuned
 *  for shape separation and is deliberately darker — do not set small text in
 *  it (WCAG AA body text needs 4.5:1). */
export const ACCENT_DOWN = "#E07856";

export function platformColor(up: boolean): string {
  return up ? PLATFORM_UP : PLATFORM_DOWN;
}

export function platformCapColor(up: boolean): string {
  return up ? PLATFORM_CAP_UP : PLATFORM_CAP_DOWN;
}

export function platformRgb(up: boolean): string {
  return up ? PLATFORM_UP_RGB : PLATFORM_DOWN_RGB;
}

export function platformRgba(up: boolean, alpha: number): string {
  return `rgba(${platformRgb(up)},${alpha})`;
}

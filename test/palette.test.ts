// Palette contract (docs/ACCESSIBILITY-PALETTE.md) — the up/down pair is
// gameplay information, so its readability is pinned by numbers, not taste.
//
// The CVD check simulates color-vision deficiency with the Machado, Oliveira &
// Fernandes (2009) severity-1.0 matrices applied in linear RGB, then compares
// WCAG relative luminance. Hue collapses under those simulations; luminance
// does not — which is why the pair is tuned on luminance separation.
import { describe, expect, test } from "bun:test";
import {
  ACCENT_DOWN,
  PLATFORM_UP,
  PLATFORM_DOWN,
  PLATFORM_CAP_UP,
  PLATFORM_CAP_DOWN,
  PLATFORM_UP_RGB,
  PLATFORM_DOWN_RGB,
  platformColor,
  platformCapColor,
  platformRgb,
  platformRgba,
} from "../src/game/cc/palette";

const BG = "#101214";
/** WCAG 1.4.11 non-text floor: adjacent UI information needs 3:1. */
const MIN_VS_BG = 3;
/** Internal target for the up/down pair after CVD simulation. */
const MIN_CVD_PAIR = 2.5;

const toLin = (c: number) => {
  const v = c / 255;
  return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
};
const rgbOf = (hex: string) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
const lum = (hex: string) => {
  const [r, g, b] = rgbOf(hex).map(toLin);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const contrast = (a: string, b: string) => {
  const la = lum(a) + 0.05;
  const lb = lum(b) + 0.05;
  return Math.max(la, lb) / Math.min(la, lb);
};

const CVD = {
  protanopia: [
    [0.152286, 1.052583, -0.204868],
    [0.114503, 0.786281, 0.099216],
    [-0.003882, -0.048116, 1.051998],
  ],
  deuteranopia: [
    [0.367322, 0.860646, -0.227968],
    [0.280085, 0.672501, 0.047413],
    [-0.01182, 0.04294, 0.968881],
  ],
  tritanopia: [
    [1.255528, -0.076749, -0.178779],
    [-0.078411, 0.930809, 0.147602],
    [0.004733, 0.691367, 0.3039],
  ],
} as const;

const encode = (v: number) =>
  Math.max(0, Math.min(255, Math.round((v <= 0.0031308 ? 12.92 * v : 1.055 * Math.pow(Math.max(0, v), 1 / 2.4) - 0.055) * 255)));
const simulate = (hex: string, kind: keyof typeof CVD) => {
  const lin = rgbOf(hex).map(toLin);
  const out = CVD[kind].map((row) => row[0] * lin[0] + row[1] * lin[1] + row[2] * lin[2]);
  return `#${out.map((v) => encode(v).toString(16).padStart(2, "0")).join("")}`;
};
const simulatedPairContrast = (a: string, b: string) =>
  Math.min(...(Object.keys(CVD) as Array<keyof typeof CVD>).map((k) => contrast(simulate(a, k), simulate(b, k))));

/** Hue in degrees (0–360), for the semantic-family check only. */
function hue(hex: string): number {
  const [r, g, b] = rgbOf(hex).map((c) => c / 255);
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const d = max - min;
  if (d === 0) return 0;
  const h = max === r ? ((g - b) / d) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return (h * 60 + 360) % 360;
}

describe("candle palette readability", () => {
  test("every platform surface clears the 3:1 non-text floor against the bg", () => {
    expect(contrast(PLATFORM_UP, BG)).toBeGreaterThanOrEqual(7);
    expect(contrast(PLATFORM_DOWN, BG)).toBeGreaterThanOrEqual(MIN_VS_BG);
    expect(contrast(PLATFORM_CAP_DOWN, BG)).toBeGreaterThanOrEqual(4.5);
    expect(contrast(PLATFORM_CAP_UP, BG)).toBeGreaterThanOrEqual(4.5);
  });

  test("up and down stay apart by luminance under protan/deutan/tritan simulation", () => {
    expect(simulatedPairContrast(PLATFORM_UP, PLATFORM_DOWN)).toBeGreaterThanOrEqual(MIN_CVD_PAIR);
    // the walkable caps carry the same meaning one step brighter — same rule
    expect(simulatedPairContrast(PLATFORM_CAP_UP, PLATFORM_CAP_DOWN)).toBeGreaterThanOrEqual(MIN_CVD_PAIR);
  });

  test("the cap is the brightest part of the platform in both directions", () => {
    expect(lum(PLATFORM_CAP_UP)).toBeGreaterThan(lum(PLATFORM_UP));
    expect(lum(PLATFORM_CAP_DOWN)).toBeGreaterThan(lum(PLATFORM_DOWN));
  });

  test("the text red clears the 4.5:1 body-text floor (surface red is too dark for it)", () => {
    expect(contrast(ACCENT_DOWN, BG)).toBeGreaterThanOrEqual(4.5);
    expect(lum(ACCENT_DOWN)).toBeGreaterThan(lum(PLATFORM_DOWN));
  });

  test("semantic rule holds: green means up, red means down", () => {
    expect(hue(PLATFORM_UP)).toBeGreaterThanOrEqual(120);
    expect(hue(PLATFORM_UP)).toBeLessThanOrEqual(170);
    expect(hue(PLATFORM_DOWN)).toBeGreaterThanOrEqual(5);
    expect(hue(PLATFORM_DOWN)).toBeLessThanOrEqual(30);
  });

  test("the accessors and the rgb strings cannot disagree", () => {
    expect(platformColor(true)).toBe(PLATFORM_UP);
    expect(platformColor(false)).toBe(PLATFORM_DOWN);
    expect(platformCapColor(true)).toBe(PLATFORM_CAP_UP);
    expect(platformCapColor(false)).toBe(PLATFORM_CAP_DOWN);
    expect(platformRgb(true)).toBe(PLATFORM_UP_RGB);
    expect(platformRgb(false)).toBe(PLATFORM_DOWN_RGB);
    expect(`rgba(${PLATFORM_UP_RGB},0.45)`).toBe(platformRgba(true, 0.45));
    expect(rgbOf(PLATFORM_UP).join(",")).toBe(PLATFORM_UP_RGB);
    expect(rgbOf(PLATFORM_DOWN).join(",")).toBe(PLATFORM_DOWN_RGB);
  });
});

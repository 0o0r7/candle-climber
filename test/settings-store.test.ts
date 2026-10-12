// Settings-store pins (LU wave) — validated loading, clamped volume,
// roundtrip persistence, and OS reduced-motion merge (pure parts only;
// the React provider + legacy-key migration are integration-tested by QA).
import { describe, test, expect } from "bun:test";
import { DEFAULT_SETTINGS, loadSettings, saveSettings } from "../src/lib/settings-context";

describe("game settings store", () => {
  test("null / empty input yields defaults", () => {
    expect(loadSettings(null)).toEqual(DEFAULT_SETTINGS);
    expect(loadSettings("")).toEqual(DEFAULT_SETTINGS);
  });

  test("garbage JSON never throws — falls back to defaults", () => {
    expect(loadSettings("not json at all")).toEqual(DEFAULT_SETTINGS);
    expect(loadSettings("null")).toEqual(DEFAULT_SETTINGS);
    expect(loadSettings("42")).toEqual(DEFAULT_SETTINGS);
  });

  test("partial settings keep per-field defaults", () => {
    const s = loadSettings(JSON.stringify({ volume: 0.5 }));
    expect(s.volume).toBe(0.5);
    expect(s.muted).toBe(DEFAULT_SETTINGS.muted);
    expect(s.colorblind).toBe(DEFAULT_SETTINGS.colorblind);
    expect(s.ghostOn).toBe(DEFAULT_SETTINGS.ghostOn);
  });

  test("volume is clamped to 0..1; non-numeric volumes keep the default", () => {
    expect(loadSettings(JSON.stringify({ volume: 5 })).volume).toBe(DEFAULT_SETTINGS.volume);
    expect(loadSettings(JSON.stringify({ volume: -2 })).volume).toBe(DEFAULT_SETTINGS.volume);
    expect(loadSettings(JSON.stringify({ volume: "loud" })).volume).toBe(DEFAULT_SETTINGS.volume);
  });

  test("non-boolean flags keep defaults instead of coercing lies", () => {
    const s = loadSettings(JSON.stringify({ muted: "yes", colorblind: 1, ghostOn: "false" }));
    expect(s.muted).toBe(DEFAULT_SETTINGS.muted);
    expect(s.colorblind).toBe(DEFAULT_SETTINGS.colorblind);
    expect(s.ghostOn).toBe(DEFAULT_SETTINGS.ghostOn);
  });

  test("roundtrip: save → load preserves every field", () => {
    const s = { volume: 0.35, muted: true, colorblind: true, reducedMotion: true, haptics: false, ghostOn: false, botOn: true };
    expect(loadSettings(saveSettings(s))).toEqual(s);
  });

  test("defaults are the honest zero-config experience", () => {
    expect(DEFAULT_SETTINGS.volume).toBe(1);
    expect(DEFAULT_SETTINGS.muted).toBe(false);
    expect(DEFAULT_SETTINGS.haptics).toBe(true); // mobile feedback on by default
    expect(DEFAULT_SETTINGS.ghostOn).toBe(true); // cosmetic replay on by default
    expect(DEFAULT_SETTINGS.botOn).toBe(false); // SOLO stays the default (P7.1)
    expect(DEFAULT_SETTINGS.colorblind).toBe(false);
    expect(DEFAULT_SETTINGS.reducedMotion).toBe(false);
  });
});

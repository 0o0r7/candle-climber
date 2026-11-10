/// <reference types="bun-types" />
// MUSIC BED — contract tests (docs/MUSIC.md).
// The synth itself is browser-only, so this pins the SCORE, not the waveform:
// the bed is data (`barPlan`), it is deterministic per (biome, bar), every
// section is audible and quiet enough that it cannot fight the jump/land sfx,
// and the four sections are genuinely different pieces of music — not one loop
// with a different name.
import { describe, test, expect } from "bun:test";
import { barPlan, hz } from "@/game/cc/music";
import type { BiomeId } from "@/game/cc/biome";

const BIOMES: BiomeId[] = ["temperate", "desert", "tundra", "storm"];

describe("music bed", () => {
  test("every biome has a section with notes in it", () => {
    for (const b of BIOMES) {
      const bar = barPlan(b, 0);
      expect(bar.events.length).toBeGreaterThan(3);
      expect(bar.bpm).toBeGreaterThan(60);
      expect(bar.bpm).toBeLessThan(180);
      expect(bar.beats).toBeGreaterThan(0);
    }
  });

  test("the score is deterministic — a replay sounds like the run it recorded", () => {
    for (const b of BIOMES) {
      for (let bar = 0; bar < 8; bar++) {
        expect(barPlan(b, bar)).toEqual(barPlan(b, bar));
      }
    }
  });

  test("notes are audible, and quiet enough not to mask the sfx", () => {
    for (const b of BIOMES) {
      for (let bar = 0; bar < 4; bar++) {
        for (const ev of barPlan(b, bar).events) {
          expect(ev.gain).toBeGreaterThan(0);
          expect(ev.gain).toBeLessThanOrEqual(0.08); // bed, never a lead voice
          expect(ev.at).toBeGreaterThanOrEqual(0);
          expect(ev.dur).toBeGreaterThan(0);
          if (ev.kind === "tone") {
            const f = hz(ev.midi);
            expect(f).toBeGreaterThan(25);
            expect(f).toBeLessThan(3000);
          }
        }
      }
    }
  });

  test("every event lands inside its own bar (no bleed into the next one)", () => {
    for (const b of BIOMES) {
      for (let bar = 0; bar < 4; bar++) {
        const { bpm, beats, events } = barPlan(b, bar);
        const barSeconds = (60 / bpm) * beats;
        for (const ev of events) expect(ev.at).toBeLessThan(barSeconds);
      }
    }
  });

  test("the four sections are four different pieces of music", () => {
    const signature = (b: BiomeId) => {
      const bar = barPlan(b, 0);
      return `${bar.bpm}/${bar.beats}/` + bar.events.map((e) => (e.kind === "tone" ? e.midi : "h")).join(",");
    };
    const sigs = BIOMES.map(signature);
    expect(new Set(sigs).size).toBe(BIOMES.length);
    // tempo is the cheapest proof the stages escalate: calm → walk → storm,
    // with the cold section the slowest by design.
    const bpm = (b: BiomeId) => barPlan(b, 0).bpm;
    expect(bpm("tundra")).toBeLessThan(bpm("temperate"));
    expect(bpm("storm")).toBeGreaterThan(bpm("desert"));
  });

  test("chord progressions cycle instead of repeating one bar forever", () => {
    for (const b of BIOMES) {
      const first = JSON.stringify(barPlan(b, 0).events);
      const later = [1, 2, 3].some((i) => JSON.stringify(barPlan(b, i).events) !== first);
      expect(later).toBe(true);
    }
  });
});

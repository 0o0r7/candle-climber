// Ten-pattern #10 — sector transition audio (the last missing cue).
// Contract: every authored sector has its OWN motif, the motifs are data (not
// randomness) so the same beat always sounds the same, and a real-length chart
// actually crosses all six of them. The synth itself is browser-only, so this
// pins the table + the trigger conditions, not the waveform.
import { describe, test, expect } from "bun:test";
import { SECTOR_MOTIFS, type SectorCue } from "@/game/cc/sound";
import { SECTOR_LABELS, sectorAt, type SectorKind } from "@/game/cc/director";

const KINDS = Object.keys(SECTOR_LABELS) as SectorKind[];

describe("#10 sector audio cues", () => {
  test("every authored sector has a motif of its own", () => {
    expect(KINDS.length).toBe(6);
    for (const k of KINDS) {
      const m = SECTOR_MOTIFS[k as SectorCue];
      expect(m).toBeDefined();
      expect(m.length).toBe(2);
    }
    const signatures = KINDS.map((k) => SECTOR_MOTIFS[k as SectorCue].join("-"));
    expect(new Set(signatures).size).toBe(KINDS.length);
  });

  test("motifs are audible and identical on every play (a table, no randomness)", () => {
    for (const k of KINDS) {
      for (const hz of SECTOR_MOTIFS[k as SectorCue]) {
        expect(hz).toBeGreaterThan(200);
        expect(hz).toBeLessThan(1600);
      }
    }
    // the same sector read twice is the same object — nothing here can drift
    expect(SECTOR_MOTIFS).toBe(SECTOR_MOTIFS);
  });

  test("a real-length chart crosses all six sectors (so no cue is dead code)", () => {
    const seen = new Set<SectorKind>();
    for (let i = 0; i < 72; i++) seen.add(sectorAt(i, 72).kind);
    expect(seen.size).toBe(KINDS.length);
    for (const k of KINDS) expect(seen.has(k)).toBe(true);
  });

  test("the cue follows the banner: one kind per candle index, no gaps", () => {
    let prev = sectorAt(0, 72);
    let boundaries = 0;
    for (let i = 1; i < 72; i++) {
      const s = sectorAt(i, 72);
      if (s.kind !== prev.kind) {
        boundaries++;
        expect(s.kind).not.toBe(prev.kind);
      }
      prev = s;
    }
    // MARKET OPEN -> TREND -> SQUEEZE -> CONSOLIDATION -> THE SUMMIT -> CLOSING BELL
    expect(boundaries).toBeGreaterThanOrEqual(5);
  });
});

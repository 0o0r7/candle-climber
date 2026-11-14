// P2 pin: every DeathCause must have player-facing copy, and the diagnosis must
// place the death on the SAME sector the terrain (and /ops) would.
//
// Without the exhaustiveness check a new cause would ship a blank panel — the
// exact defect P2 exists to remove. Without the sector cross-check the panel and
// the telemetry histogram could disagree about where a run ended.
import { describe, test, expect } from "bun:test";
import { CAUSE_COPY, explainDeath } from "../src/game/cc/death-hints";
import { sectorAt, SECTOR_LABELS } from "../src/game/cc/director";
import type { DeathCause } from "../src/game/cc/types";

const CAUSES: DeathCause[] = ["fell", "crumbled", "wicked"];

describe("death-hints — copy coverage", () => {
  test("every DeathCause has a label, a what and a next-step hint", () => {
    for (const cause of CAUSES) {
      const copy = CAUSE_COPY[cause];
      expect(copy).toBeDefined();
      expect(copy.label.length).toBeGreaterThan(0);
      expect(copy.what.length).toBeGreaterThan(10);
      // The hint is the whole point: it must say what to do, not what happened.
      expect(copy.hint.length).toBeGreaterThan(10);
      expect(copy.hint.toLowerCase()).toMatch(/jump|land|leave|beat|centered/);
    }
  });

  test("the mapping has no extra keys the engine cannot produce", () => {
    expect(Object.keys(CAUSE_COPY).sort()).toEqual([...CAUSES].sort());
  });
});

describe("death-hints — diagnosis", () => {
  test("names the cause, the candle and the director sector", () => {
    // candle 0 is the MARKET OPEN runway of a 220-candle day.
    const d = explainDeath({ cause: "crumbled", candlesPassed: 0 }, 220);
    expect(d.cause).toBe("crumbled");
    expect(d.label).toBe("CRUMBLED");
    expect(d.candle).toBe(1); // a run always shows at least candle 1
    expect(d.sector).toBe(SECTOR_LABELS.intro);
  });

  test("a missing cause degrades to 'fell' instead of an empty panel", () => {
    const d = explainDeath({ candlesPassed: 19 }, 220);
    expect(d.cause).toBe("fell");
    expect(d.what).toBe(CAUSE_COPY.fell.what);
  });

  test("sector agrees with sectorAt for every candle of a real day", () => {
    const total = 220;
    for (const index of [0, 11, 12, 40, 51, 52, 80, 160, 206, 207, 219]) {
      const d = explainDeath({ cause: "fell", candlesPassed: index }, total);
      expect(d.sector).toBe(sectorAt(index, total).name);
    }
  });

  test("an endless run (total unknown) never pretends to be at the summit", () => {
    // Past the last candle of a 220-candle day, the summit band does not apply.
    const d = explainDeath({ cause: "fell", candlesPassed: 400 }, 0);
    expect(d.sector).not.toBe(SECTOR_LABELS.summit);
    expect(d.sector).not.toBe(SECTOR_LABELS.finale);
  });
});

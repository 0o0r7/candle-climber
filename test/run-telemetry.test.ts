// P0.1 pin: run telemetry — untrusted-input normalization and the death
// histogram math /ops reports. Pure functions + the memory store (the default
// backend) prove the contract without a database or a browser.
import { describe, test, expect } from "bun:test";
import {
  normalizeRunEvent,
  summarizeRunEvents,
  EMPTY_TELEMETRY_SUMMARY,
  MAX_CANDLE,
  MAX_SCORE,
  MAX_STYLE_EVENTS,
  type RunTelemetryEvent,
} from "../src/lib/run-telemetry";
import { MemoryRunTelemetryStore } from "../src/lib/run-telemetry-store";
import { sectorAt } from "../src/game/cc/director";

const ev = (over: Partial<RunTelemetryEvent> = {}): RunTelemetryEvent => ({
  candle: 10,
  score: 500,
  streak: 3,
  cause: "fell",
  graduated: false,
  world2: false,
  rush: false,
  device: "keyboard",
  mode: "crypto",
  interval: "1w",
  styleLate: 0,
  styleSave: 0,
  total: 0,
  ts: 1_700_000_000_000,
  ...over,
});

describe("normalizeRunEvent (P0.1)", () => {
  test("rejects payloads that cannot describe a run", () => {
    expect(normalizeRunEvent(null)).toBeNull();
    expect(normalizeRunEvent("nope")).toBeNull();
    expect(normalizeRunEvent([1, 2, 3])).toBeNull();
    expect(normalizeRunEvent({ score: 10 })).toBeNull(); // no candle index
    expect(normalizeRunEvent({ candle: "12" })).toBeNull(); // string is not a number
    expect(normalizeRunEvent({ candle: NaN })).toBeNull();
  });

  test("clamps out-of-range numbers instead of trusting the client", () => {
    const e = normalizeRunEvent({ candle: 99_999, score: 1e12, streak: -5 }, 123);
    expect(e).not.toBeNull();
    expect(e!.candle).toBe(MAX_CANDLE);
    expect(e!.score).toBe(MAX_SCORE);
    expect(e!.streak).toBe(0); // negatives never become histogram data
    expect(e!.ts).toBe(123); // server clock, never the client's
  });

  test("unknown enum values fall back to the safe label", () => {
    const e = normalizeRunEvent({ candle: 4, cause: "vibes", device: "toaster", mode: "nft", interval: "5m" });
    expect(e!.cause).toBe("fell");
    expect(e!.device).toBe("keyboard");
    expect(e!.mode).toBe("crypto");
    expect(e!.interval).toBe("1w");
  });

  test("boolean flags are true only when really true", () => {
    const e = normalizeRunEvent({ candle: 4, graduated: 1, world2: "yes", rush: true });
    expect(e!.graduated).toBe(false);
    expect(e!.world2).toBe(false);
    expect(e!.rush).toBe(true);
  });
});

describe("summarizeRunEvents (P0.1 death histogram)", () => {
  test("empty sample reports the honest empty shape", () => {
    expect(summarizeRunEvents([])).toEqual(EMPTY_TELEMETRY_SUMMARY);
  });

  test("medians, early-death rate, shares and bins", () => {
    const s = summarizeRunEvents([
      ev({ candle: 3, cause: "fell" }), // early death
      ev({ candle: 12, cause: "fell", rush: true }),
      ev({ candle: 45, cause: "crumbled", device: "touch", graduated: true }),
      ev({ candle: 260, cause: "wicked", device: "touch" }),
      ev({ candle: 220, cause: "abandoned" }), // summit retry — not a death
    ]);

    expect(s.total).toBe(5);
    expect(s.deaths).toBe(4);
    expect(s.graduations).toBe(1);
    expect(s.medianDeathCandle).toBe(12); // sorted [3,12,45,260]
    expect(s.p90DeathCandle).toBe(260);
    expect(s.earlyDeaths).toBe(1);
    expect(s.earlyDeathRate).toBe(0.25);
    expect(s.rushShare).toBe(0.2);
    expect(s.touchShare).toBe(0.4);
    expect(s.causeCounts).toEqual({ fell: 2, crumbled: 1, wicked: 1, abandoned: 1 });

    const bins = Object.fromEntries(s.histogram.map((b) => [b.bucket, b.count]));
    expect(bins[0]).toBe(2); // 3 + 12
    expect(bins[40]).toBe(1); // 45
    expect(bins[240]).toBe(1); // 260 overflows into 240+
    expect(s.histogram.reduce((n, b) => n + b.count, 0)).toBe(4); // deaths only
  });

  test("a sample of only abandoned runs has no death signal", () => {
    const s = summarizeRunEvents([ev({ cause: "abandoned" }), ev({ cause: "abandoned" })]);
    expect(s.deaths).toBe(0);
    expect(s.medianDeathCandle).toBeNull();
    expect(s.earlyDeathRate).toBe(0);
  });
});

describe("MemoryRunTelemetryStore (P0.1)", () => {
  test("keeps the 7-day window and reports its backend", async () => {
    const store = new MemoryRunTelemetryStore();
    const now = 1_800_000_000_000;
    await store.record(ev({ ts: now - 1_000, candle: 30 }));
    await store.record(ev({ ts: now - 8 * 86_400_000, candle: 2 })); // outside window

    const s = await store.summary(now);
    expect(store.kind).toBe("memory");
    expect(s.total).toBe(1);
    expect(s.medianDeathCandle).toBe(30);
  });
});

// P0.5 — the two metrics the roadmap asked for: does anyone use the STYLE
// axis, and WHICH director sector kills? Both are pure folds of the same
// PII-free event, so the contract is provable without a database.
describe("normalizeRunEvent (P0.5 fields)", () => {
  test("STYLE counts and level length are clamped, absent means zero", () => {
    const e = normalizeRunEvent({ candle: 10, styleLate: 9e9, styleSave: -4, total: 99_999 });
    expect(e!.styleLate).toBe(MAX_STYLE_EVENTS);
    expect(e!.styleSave).toBe(0);
    expect(e!.total).toBe(MAX_CANDLE);

    const bare = normalizeRunEvent({ candle: 10 });
    expect(bare!.styleLate).toBe(0);
    expect(bare!.styleSave).toBe(0);
    expect(bare!.total).toBe(0);
  });
});

describe("summarizeRunEvents (P0.5 STYLE)", () => {
  test("engagement share, mean over all runs, percentiles over engaged runs", () => {
    const s = summarizeRunEvents([
      ev({ styleLate: 2, styleSave: 1 }), // 8 pts
      ev({ styleLate: 1 }), // 3 pts
      ev(), // 0 — a safe climb earns nothing by design
      ev(), // 0
    ]).style;

    expect(s.runs).toBe(2);
    expect(s.share).toBe(0.5);
    expect(s.mean).toBe((8 + 3) / 4); // zeros count: mean is per finished run
    expect(s.median).toBe(3);
    expect(s.p90).toBe(8);
    expect(s.late).toBe(3);
    expect(s.save).toBe(1);
  });

  test("a sample with no STYLE reports zeros, not n/a", () => {
    const s = summarizeRunEvents([ev(), ev()]).style;
    expect(s).toEqual({ runs: 0, share: 0, mean: 0, median: 0, p90: 0, late: 0, save: 0 });
  });
});

describe("summarizeRunEvents (P0.5 sectors)", () => {
  // Level of 100 candles: intro 0–11, summit approach 88–99, cycle between.
  const TOTAL = 100;
  const sample = () =>
    summarizeRunEvents([
      ev({ candle: 5, total: TOTAL }), // died in MARKET OPEN
      ev({ candle: 20, total: TOTAL }), // died in TREND
      ev({ candle: 30, total: TOTAL }), // died in SQUEEZE
      ev({ candle: 45, total: TOTAL }), // died in CONSOLIDATION
      ev({ candle: 95, total: TOTAL, cause: "abandoned", graduated: true }), // reached the summit
      ev({ candle: 150, total: TOTAL }), // past the level ⇒ endless world: cycle, no summit band
    ]);
  const row = (s: ReturnType<typeof sample>, kind: string) => s.sectors.find((x) => x.kind === kind)!;

  test("deaths are attributed to the sector the run ENDED in", () => {
    const s = sample();
    expect(row(s, "intro").deaths).toBe(1);
    expect(row(s, "trend").deaths).toBe(1); // candle 20
    expect(row(s, "squeeze").deaths).toBe(2); // candle 30 + the post-summit candle 150
    expect(row(s, "breather").deaths).toBe(1);
    expect(row(s, "summit").deaths).toBe(0); // the approach killed nobody here
    expect(s.sectors.reduce((n, x) => n + x.deaths, 0)).toBe(s.deaths);
  });

  test("every run that got there is exposure — including the graduated one", () => {
    const s = sample();
    expect(row(s, "intro").reached).toBe(6);
    expect(row(s, "trend").reached).toBe(5);
    expect(row(s, "squeeze").reached).toBe(4);
    expect(row(s, "breather").reached).toBe(3);
    // only the run that actually entered the summit approach is exposed to it
    expect(row(s, "summit").reached).toBe(1);
  });

  test("rate is deaths over runs that reached the sector", () => {
    const s = sample();
    expect(row(s, "summit").rate).toBe(0);
    expect(row(s, "trend").rate).toBeCloseTo(1 / 5, 10);
    expect(row(s, "intro").rate).toBeCloseTo(1 / 6, 10);
    for (const x of s.sectors) expect(x.rate).toBeGreaterThanOrEqual(0);
  });

  test("labels come from the director, in traversal order", () => {
    const s = sample();
    // P0.7: the closing bell sits between the last breather and the cap.
    expect(s.sectors.map((x) => x.kind)).toEqual(["intro", "trend", "squeeze", "breather", "finale", "summit"]);
    expect(s.sectors.map((x) => x.label)).toEqual([
      "MARKET OPEN", "TREND", "SQUEEZE", "CONSOLIDATION", "CLOSING BELL", "THE SUMMIT",
    ]);
  });

  test("an abandoned-only sample has no deaths but real exposure", () => {
    const s = summarizeRunEvents([ev({ candle: 30, cause: "abandoned", graduated: true })]);
    expect(s.deaths).toBe(0);
    expect(s.sectors.every((x) => x.deaths === 0)).toBe(true);
    expect(s.sectors.find((x) => x.kind === "squeeze")!.reached).toBe(1);
  });

  test("unknown level length keeps the cycle and never invents a summit", () => {
    const s = summarizeRunEvents([ev({ candle: 300 })]);
    expect(s.sectors.find((x) => x.kind === "summit")!.reached).toBe(0);
    expect(s.sectors.find((x) => x.kind === "summit")!.deaths).toBe(0);
  });

  test("exposure matches a brute-force walk of every candle index", () => {
    // The summary walks a bounded window (intro + one cycle + the summit band)
    // instead of every index. This pins that shortcut against the literal walk.
    const KINDS = ["intro", "trend", "squeeze", "breather", "summit"] as const;
    for (const total of [0, 20, 30, 50, 100, 220, 600]) {
      for (const candle of [0, 5, 12, 27, 28, 44, 60, 87, 88, 99, 120, 300, 599]) {
        const s = summarizeRunEvents([ev({ candle, total })]);
        const eff = total > 0 && candle >= total ? 0 : total;
        const brute = new Set<string>();
        for (let i = 0; i <= candle; i++) brute.add(sectorAt(i, eff).kind);
        for (const kind of KINDS) {
          const row = s.sectors.find((x) => x.kind === kind)!;
          expect({ total, candle, kind, reached: row.reached })
            .toEqual({ total, candle, kind, reached: brute.has(kind) ? 1 : 0 });
        }
      }
    }
  });
});

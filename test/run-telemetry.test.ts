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
  type RunTelemetryEvent,
} from "../src/lib/run-telemetry";
import { MemoryRunTelemetryStore } from "../src/lib/run-telemetry-store";

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

// P1 pin: the funnel lane — untrusted-input normalization, the summary /ops
// reads, and the 7-day window. Pure functions + the memory store prove the
// contract without a browser or disk.
import { describe, test, expect } from "bun:test";
import {
  normalizeFunnelEvent,
  summarizeFunnelEvents,
  EMPTY_FUNNEL_SUMMARY,
  TUTORIAL_STEPS,
  type FunnelEvent,
} from "../src/lib/funnel-telemetry";
import { MemoryFunnelStore } from "../src/lib/funnel-telemetry-store";

const ev = (over: Partial<FunnelEvent> = {}): FunnelEvent => ({
  name: "run_start",
  ts: 1_000,
  ...over,
});

describe("funnel-telemetry — normalization", () => {
  test("accepts the three known gates and stamps the server clock", () => {
    for (const name of ["run_start", "tutorial_complete", "retry"] as const) {
      const e = normalizeFunnelEvent({ name }, 5_000);
      expect(e?.name).toBe(name);
      expect(e?.ts).toBe(5_000); // never the client's timestamp
    }
  });

  test("rejects an unknown or missing name instead of guessing", () => {
    expect(normalizeFunnelEvent({ name: "death" })).toBeNull();
    expect(normalizeFunnelEvent({})).toBeNull();
    expect(normalizeFunnelEvent(null)).toBeNull();
    expect(normalizeFunnelEvent("run_start")).toBeNull();
  });

  test("clamps tutorial fields and ignores them on other gates", () => {
    const done = normalizeFunnelEvent({ name: "tutorial_complete", steps: 99, skipped: true });
    expect(done?.steps).toBe(TUTORIAL_STEPS);
    expect(done?.skipped).toBe(true);

    const negative = normalizeFunnelEvent({ name: "tutorial_complete", steps: -3 });
    expect(negative?.steps).toBe(0);
    expect(negative?.skipped).toBe(false);

    const start = normalizeFunnelEvent({ name: "run_start", steps: 4, skipped: true });
    expect(start?.steps).toBeUndefined();
    expect(start?.skipped).toBeUndefined();
  });
});

describe("funnel-telemetry — summary", () => {
  test("counts each gate and splits tutorial completions by how they ended", () => {
    const s = summarizeFunnelEvents([
      ev({ name: "tutorial_complete", steps: 5, skipped: false }),
      ev({ name: "tutorial_complete", steps: 2, skipped: true }),
      ev({ name: "run_start" }),
      ev({ name: "run_start" }),
      ev({ name: "retry" }),
    ]);
    expect(s.total).toBe(5);
    expect(s.counts).toEqual({ run_start: 2, tutorial_complete: 2, retry: 1 });
    expect(s.tutorialDone).toBe(2);
    expect(s.tutorialSkipped).toBe(1);
    expect(s.medianTutorialSteps).toBe(2); // lower-middle of [2, 5]
  });

  test("an empty sample is not a zero rate — it is no sample at all", () => {
    expect(summarizeFunnelEvents([])).toBe(EMPTY_FUNNEL_SUMMARY);
    expect(EMPTY_FUNNEL_SUMMARY.medianTutorialSteps).toBeNull();
  });
});

describe("funnel store — 7-day window", () => {
  test("drops events outside the window and keeps the ones inside", async () => {
    const store = new MemoryFunnelStore();
    const now = 10 * 86_400_000;
    await store.record(ev({ name: "run_start", ts: now - 8 * 86_400_000 })); // outside
    await store.record(ev({ name: "run_start", ts: now - 1_000 }));
    await store.record(ev({ name: "retry", ts: now - 500 }));

    const s = await store.summary(now);
    expect(s.total).toBe(2);
    expect(s.counts.run_start).toBe(1);
    expect(s.counts.retry).toBe(1);
  });
});

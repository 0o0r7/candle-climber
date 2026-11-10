/// <reference types="bun-types" />
// P0.7 — durable telemetry WITHOUT a database. Pins the two promises that made
// the in-memory default unacceptable for difficulty work (`docs/TELEMETRY.md`):
//   1. a restart keeps the sample (a NEW store instance on the same directory
//      reads the rows the previous process appended);
//   2. the read contract is identical to the memory/Mongo backends (window
//      filter + the same summarizer), and a torn line is never fatal.
import { describe, test, expect, afterAll } from "bun:test";
import { mkdtemp, rm, appendFile, readFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import {
  FileRunTelemetryStore,
  createFileTelemetryStore,
  defaultTelemetryDir,
} from "@/lib/run-telemetry-file";
import type { RunTelemetryEvent } from "@/lib/run-telemetry";

const DIRS: string[] = [];
const DAY = 86_400_000;

async function tmpDir(): Promise<string> {
  const d = await mkdtemp(path.join(os.tmpdir(), "cc-telemetry-test-"));
  DIRS.push(d);
  return d;
}

afterAll(async () => {
  for (const d of DIRS) await rm(d, { recursive: true, force: true });
});

function ev(over: Partial<RunTelemetryEvent> = {}): RunTelemetryEvent {
  return {
    candle: 12,
    score: 900,
    streak: 4,
    cause: "fell",
    graduated: false,
    world2: false,
    rush: false,
    device: "keyboard",
    mode: "crypto",
    interval: "1w",
    styleLate: 1,
    styleSave: 2,
    total: 40,
    ts: 1_700_000_000_000,
    ...over,
  };
}

describe("FileRunTelemetryStore (P0.7)", () => {
  test("rows survive a process restart (new instance, same directory)", async () => {
    const dir = await tmpDir();
    const first = new FileRunTelemetryStore({ dir });
    await first.record(ev({ candle: 7 }));
    await first.record(ev({ candle: 33, cause: "crumbled" }));

    // a NEW process only shares the directory
    const second = new FileRunTelemetryStore({ dir });
    const s = await second.summary(1_700_000_100_000, 7);
    expect(second.lastError).toBeUndefined();
    expect(s.total).toBe(2);
    expect(s.deaths).toBe(2);
    expect(s.causeCounts.fell).toBe(1);
    expect(s.causeCounts.crumbled).toBe(1);
  });

  test("the same window contract as the memory store (7 days default)", async () => {
    const dir = await tmpDir();
    const store = new FileRunTelemetryStore({ dir });
    const now = 1_800_000_000_000;
    await store.record(ev({ ts: now - 1 * DAY, candle: 10 }));
    await store.record(ev({ ts: now - 30 * DAY, candle: 20 })); // outside the window
    const s = await store.summary(now);
    expect(s.total).toBe(1);
    expect(s.medianDeathCandle).toBe(10);
  });

  test("a torn line (killed mid-write) is skipped, not fatal", async () => {
    const dir = await tmpDir();
    const store = new FileRunTelemetryStore({ dir });
    await store.record(ev({ candle: 9 }));
    const file = path.join(dir, "runs.ndjson");
    await appendFile(file, '{"candle":11,"score":', "utf8"); // half a row
    const s = await store.summary(1_700_000_100_000);
    expect(s.total).toBe(1);
    expect(store.lastError).toBeUndefined();
  });

  test("writes are serialized — concurrent records all land", async () => {
    const dir = await tmpDir();
    const store = new FileRunTelemetryStore({ dir });
    await Promise.all(Array.from({ length: 25 }, (_, i) => store.record(ev({ candle: i }))));
    const raw = await readFile(path.join(dir, "runs.ndjson"), "utf8");
    const lines = raw.split("\n").filter(Boolean);
    expect(lines.length).toBe(25);
    // every line is complete JSON (no interleaved writes)
    for (const l of lines) expect(() => JSON.parse(l)).not.toThrow();
  });

  test("the default directory lives outside the repository", () => {
    const dir = defaultTelemetryDir({});
    expect(dir).toContain(os.tmpdir());
    expect(dir).not.toContain("node_modules");
    // an explicit override is honoured verbatim (sandbox/CI control)
    expect(defaultTelemetryDir({ CC_TELEMETRY_DIR: "/var/tmp/cc" })).toBe("/var/tmp/cc");
  });

  test("createFileTelemetryStore probes writability instead of pretending", async () => {
    const dir = await tmpDir();
    const store = createFileTelemetryStore({ dir });
    expect(store).not.toBeNull();
    expect(store!.kind).toBe("file");
    await store!.record(ev());
    expect((await store!.summary(1_700_000_100_000)).total).toBe(1);
  });
});

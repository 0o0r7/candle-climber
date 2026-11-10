// P0.7 — durable run telemetry WITHOUT a database.
//
// WHY: the P0.5 audit measured STYLE usage and sector deaths, but the default
// store was in-memory, so every dev-server restart erased the sample the
// numbers were computed from (`docs/TELEMETRY.md` §4 "known limits"). Editing a
// difficulty curve against a histogram that resets is guesswork. A Mongo URI
// already fixes that in production; this file is the zero-infra middle rung:
// append-only NDJSON on the server's own disk, so the numbers survive a
// restart, a hot reload and a redeploy of the same machine.
//
// POSTURE: identical to the other stores — every write is fire-and-forget,
// never throws into the request, and a broken disk degrades to "no telemetry",
// never to a blocked run (LAW 1).
import { appendFile, mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { mkdirSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import {
  summarizeRunEvents,
  EMPTY_TELEMETRY_SUMMARY,
  type RunTelemetryEvent,
  type TelemetrySummary,
} from "@/lib/run-telemetry";

const DAY_MS = 86_400_000;
const WINDOW_DAYS = 7;
/** Same bounded read as the Mongo store: weeks of play at this scale. */
const MAX_ROWS = 20_000;
/** Compact after this many appends — bounds the file without a stat per write. */
const COMPACT_EVERY = 250;

const FILE_NAME = "runs.ndjson";

/** Where the append log lives. Deliberately OUTSIDE the repo: telemetry is
 *  runtime state, never a source artifact. Override with CC_TELEMETRY_DIR. */
export function defaultTelemetryDir(env: Record<string, string | undefined> = process.env): string {
  const custom = env.CC_TELEMETRY_DIR?.trim();
  if (custom) return custom;
  return path.join(os.tmpdir(), "candleclimber-telemetry");
}

export interface FileTelemetryOptions {
  dir?: string;
  /** Injectable clock-free io for tests — defaults to node:fs/promises. */
  fileName?: string;
}

/**
 * Append-only NDJSON store. One event per line keeps a crash mid-write from
 * corrupting earlier rows, and makes the file inspectable with `wc -l` /
 * `tail`. Rows older than the window are filtered on read, exactly like the
 * memory store, so the summary contract is identical across backends.
 */
export class FileRunTelemetryStore {
  readonly kind = "file" as const;
  lastError: string | undefined;
  private readonly file: string;
  private readonly dir: string;
  private writes = 0;
  /** Serialises appends/compactions: two interleaved writes could tear a line. */
  private queue: Promise<void> = Promise.resolve();

  constructor(opts: FileTelemetryOptions = {}) {
    this.dir = opts.dir ?? defaultTelemetryDir();
    this.file = path.join(this.dir, opts.fileName ?? FILE_NAME);
  }

  async record(e: RunTelemetryEvent): Promise<void> {
    const line = JSON.stringify(e) + "\n";
    this.queue = this.queue.then(async () => {
      try {
        await mkdir(this.dir, { recursive: true });
        await appendFile(this.file, line, "utf8");
        this.writes++;
        if (this.writes >= COMPACT_EVERY) {
          this.writes = 0;
          await this.compact();
        }
      } catch (err) {
        this.lastError = String(err);
      }
    });
    await this.queue;
  }

  async summary(now: number, windowDays = WINDOW_DAYS): Promise<TelemetrySummary> {
    try {
      // Read AFTER pending writes land, so a summary never races an append.
      await this.queue;
      const rows = await this.read();
      const since = now - windowDays * DAY_MS;
      return summarizeRunEvents(rows.filter((e) => e.ts >= since));
    } catch (err) {
      this.lastError = String(err);
      return EMPTY_TELEMETRY_SUMMARY;
    }
  }

  private async read(): Promise<RunTelemetryEvent[]> {
    let raw: string;
    try {
      raw = await readFile(this.file, "utf8");
    } catch (err) {
      // A missing file is a fresh install, not a failure.
      if ((err as NodeJS.ErrnoException).code === "ENOENT") return [];
      throw err;
    }
    const out: RunTelemetryEvent[] = [];
    for (const line of raw.split("\n")) {
      if (!line) continue;
      try {
        out.push(JSON.parse(line) as RunTelemetryEvent);
      } catch {
        // A torn line (killed mid-write) is skipped, never fatal.
      }
    }
    return out.slice(-MAX_ROWS);
  }

  /** Keep the newest MAX_ROWS lines; write-then-rename so a crash cannot leave
   *  a half-truncated log behind. */
  private async compact(): Promise<void> {
    const rows = await this.read();
    if (rows.length < MAX_ROWS) return;
    const keep = rows.slice(-MAX_ROWS);
    const tmp = `${this.file}.tmp`;
    await writeFile(tmp, keep.map((r) => JSON.stringify(r)).join("\n") + "\n", "utf8");
    await rename(tmp, this.file);
  }
}

/**
 * Build the file-backed store when the directory is actually writable.
 * Returns null otherwise, so the caller can fall back to memory instead of
 * pretending telemetry is being persisted.
 */
export function createFileTelemetryStore(opts: FileTelemetryOptions = {}): FileRunTelemetryStore | null {
  const dir = opts.dir ?? defaultTelemetryDir();
  try {
    mkdirSync(dir, { recursive: true });
  } catch {
    return null;
  }
  return new FileRunTelemetryStore({ ...opts, dir });
}

// P1 — funnel event store. Same shape and posture as the run lane
// (src/lib/run-telemetry-file.ts): append-only NDJSON on the server's own disk,
// in the SAME directory (so one CC_TELEMETRY_DIR holds both lanes), outside the
// repository. A broken disk degrades to "no funnel data" and never blocks a
// start, a tutorial or a retry (LAW 1).
//
// No Mongo backend on purpose: the funnel answers dev-time questions ("do
// newcomers reach the first run?") and the file is enough for that. When a
// persistent production funnel is needed, the contract is already line-shaped
// and can move to a collection without changing the event or the summary.
import { appendFile, mkdir, readFile } from "node:fs/promises";
import path from "node:path";
import { defaultTelemetryDir } from "@/lib/run-telemetry-file";
import {
  summarizeFunnelEvents,
  EMPTY_FUNNEL_SUMMARY,
  type FunnelEvent,
  type FunnelSummary,
} from "@/lib/funnel-telemetry";

const DAY_MS = 86_400_000;
const WINDOW_DAYS = 7;
/** Same bounded read as the run lane: weeks of play at this game's scale. */
const MAX_ROWS = 20_000;
const FILE_NAME = "funnel.ndjson";

export interface FunnelStore {
  readonly kind: "file" | "memory";
  record(e: FunnelEvent): Promise<void>;
  summary(now: number, windowDays?: number): Promise<FunnelSummary>;
}

export class FileFunnelStore implements FunnelStore {
  readonly kind = "file" as const;
  lastError: string | undefined;
  private readonly file: string;
  private readonly dir: string;
  private queue: Promise<void> = Promise.resolve();

  constructor(dir = defaultTelemetryDir()) {
    this.dir = dir;
    this.file = path.join(dir, FILE_NAME);
  }

  async record(e: FunnelEvent): Promise<void> {
    const line = JSON.stringify(e) + "\n";
    this.queue = this.queue.then(async () => {
      try {
        await mkdir(this.dir, { recursive: true });
        await appendFile(this.file, line, "utf8");
      } catch (err) {
        this.lastError = String(err);
      }
    });
    await this.queue;
  }

  async summary(now: number, windowDays = WINDOW_DAYS): Promise<FunnelSummary> {
    try {
      await this.queue; // read AFTER pending writes land
      const raw = await readFile(this.file, "utf8");
      const rows: FunnelEvent[] = [];
      // Newest MAX_ROWS lines only — the tail is what the window needs.
      const lines = raw.split("\n").filter(Boolean).slice(-MAX_ROWS);
      for (const line of lines) {
        try {
          rows.push(JSON.parse(line) as FunnelEvent);
        } catch {
          // A torn line (killed mid-write) is skipped, never fatal.
        }
      }
      const since = now - windowDays * DAY_MS;
      return summarizeFunnelEvents(rows.filter((r) => r.ts >= since));
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code === "ENOENT") return EMPTY_FUNNEL_SUMMARY;
      this.lastError = String(err);
      return EMPTY_FUNNEL_SUMMARY;
    }
  }
}

/** Memory fallback: only used when the telemetry directory cannot be written.
 *  Exported so tests can pin the windowing without touching disk. */
export class MemoryFunnelStore implements FunnelStore {
  readonly kind = "memory" as const;
  private rows: FunnelEvent[] = [];
  private readonly max = 5_000;

  async record(e: FunnelEvent): Promise<void> {
    this.rows.push(e);
    if (this.rows.length > this.max) this.rows.splice(0, this.rows.length - this.max);
  }

  async summary(now: number, windowDays = WINDOW_DAYS): Promise<FunnelSummary> {
    const since = now - windowDays * DAY_MS;
    return summarizeFunnelEvents(this.rows.filter((e) => e.ts >= since));
  }
}

// Next bundles each route/page entry separately, so the singleton lives on
// globalThis — the intake route and /ops must count the same events.
const GLOBAL_KEY = "__ccFunnelStore";

export function getFunnel(): FunnelStore {
  const g = globalThis as typeof globalThis & { [GLOBAL_KEY]?: FunnelStore };
  if (g[GLOBAL_KEY]) return g[GLOBAL_KEY];
  g[GLOBAL_KEY] = new FileFunnelStore();
  return g[GLOBAL_KEY];
}

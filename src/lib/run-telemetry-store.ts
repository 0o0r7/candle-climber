// P0.1 — run telemetry store (death histogram).
//
// Memory by default (resets on restart, same accepted tradeoff as the
// leaderboard/report stores). When DATABASE_URL is a MongoDB URI, events persist
// in a dedicated collection with a 90-day TTL — the histogram then survives
// restarts and describes real player behavior instead of one sandbox session.
//
// Every write is fire-and-forget from the game's point of view: failures are
// captured as economy-path P2 alerts and NEVER thrown back into the run (LAW 1:
// play is never blocked by an integration).
import { captureError } from "@/lib/telemetry";
import { createFileTelemetryStore } from "@/lib/run-telemetry-file";
import {
  summarizeRunEvents,
  EMPTY_TELEMETRY_SUMMARY,
  type RunTelemetryEvent,
  type TelemetrySummary,
} from "@/lib/run-telemetry";

export interface RunTelemetryStore {
  readonly kind: "memory" | "mongo" | "file";
  record(e: RunTelemetryEvent): Promise<void>;
  /** Aggregate over events received in the last `windowDays` (default 7). */
  summary(now: number, windowDays?: number): Promise<TelemetrySummary>;
  readonly lastError?: string;
}

const DAY_MS = 86_400_000;
const WINDOW_DAYS = 7;

/* ---------------------------------- memory --------------------------------- */

/** Exported for tests (W5-style contract pins): the memory store is the default
 *  backend, so its windowing semantics must be provable without a database. */
export class MemoryRunTelemetryStore implements RunTelemetryStore {
  readonly kind = "memory" as const;
  private rows: RunTelemetryEvent[] = [];
  private readonly max = 5_000;

  async record(e: RunTelemetryEvent): Promise<void> {
    this.rows.push(e);
    if (this.rows.length > this.max) this.rows.splice(0, this.rows.length - this.max);
  }

  async summary(now: number, windowDays = WINDOW_DAYS): Promise<TelemetrySummary> {
    const since = now - windowDays * DAY_MS;
    return summarizeRunEvents(this.rows.filter((e) => e.ts >= since));
  }
}

/* ----------------------------------- mongo --------------------------------- */

const MONGO_DB = "candleclimber";
const MONGO_COLL = "run_telemetry";

class MongoRunTelemetryStore implements RunTelemetryStore {
  readonly kind = "mongo" as const;
  lastError: string | undefined;
  private coll: import("mongodb").Collection<RunTelemetryEvent> | null = null;
  private connecting: Promise<import("mongodb").Collection<RunTelemetryEvent> | null> | null = null;
  private disabled = false;

  private async connect() {
    if (this.coll) return this.coll;
    if (this.disabled) return null;
    if (this.connecting) return this.connecting;
    this.connecting = (async () => {
      try {
        const { MongoClient } = await import("mongodb");
        const client = new MongoClient(process.env.DATABASE_URL as string, {
          serverSelectionTimeoutMS: 4000,
        });
        await client.connect();
        const coll = client.db(MONGO_DB).collection<RunTelemetryEvent>(MONGO_COLL);
        // Telemetry is behavioral data with a shelf life: 90 days is enough to
        // tune a difficulty curve and bounded enough to stay privacy-sane.
        await coll.createIndex({ ts: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 });
        this.coll = coll;
        return coll;
      } catch (err) {
        this.disabled = true;
        this.lastError = String(err);
        captureError(err, { lane: "run-telemetry", op: "connect" });
        return null;
      } finally {
        this.connecting = null;
      }
    })();
    return this.connecting;
  }

  async record(e: RunTelemetryEvent): Promise<void> {
    try {
      const coll = await this.connect();
      if (!coll) return;
      await coll.insertOne(e);
    } catch (err) {
      this.lastError = String(err);
      captureError(err, { lane: "run-telemetry", op: "record" });
    }
  }

  async summary(now: number, windowDays = WINDOW_DAYS): Promise<TelemetrySummary> {
    try {
      const coll = await this.connect();
      if (!coll) return EMPTY_TELEMETRY_SUMMARY;
      // Bounded read: a free-tier cluster must never be asked for an unbounded
      // join. 20k events is weeks of play at this game's scale.
      const rows = await coll
        .find({ ts: { $gte: now - windowDays * DAY_MS } })
        .limit(20_000)
        .toArray();
      return summarizeRunEvents(rows);
    } catch (err) {
      this.lastError = String(err);
      captureError(err, { lane: "run-telemetry", op: "summary" });
      return EMPTY_TELEMETRY_SUMMARY;
    }
  }
}

/* --------------------------------- singleton ------------------------------- */

// Next bundles each route/page entry separately, so a plain module-level
// singleton is duplicated per bundle: the intake route would count events in a
// different instance than /ops reads. A globalThis slot is shared by every
// bundle in the same server process (dev server, single-node `next start`),
// which is exactly the lifetime of the in-memory backend. Multi-instance
// deployments need DATABASE_URL — same rule as every other memory store.
const GLOBAL_KEY = "__ccRunTelemetryStore";

export function getRunTelemetry(): RunTelemetryStore {
  const g = globalThis as typeof globalThis & { [GLOBAL_KEY]?: RunTelemetryStore };
  if (g[GLOBAL_KEY]) return g[GLOBAL_KEY];
  const uri = process.env.DATABASE_URL ?? "";
  if (uri.startsWith("mongodb://") || uri.startsWith("mongodb+srv://")) {
    g[GLOBAL_KEY] = new MongoRunTelemetryStore();
  } else {
    // P0.7: no database is not the same as no memory. The append-only file
    // store survives a dev-server restart, which is what the difficulty work
    // actually needs; memory is only the last resort for a read-only disk.
    g[GLOBAL_KEY] = createFileTelemetryStore() ?? new MemoryRunTelemetryStore();
  }
  return g[GLOBAL_KEY];
}

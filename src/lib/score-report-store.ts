// LU-15: Community score-moderation store — players can report suspicious
// leaderboard entries for review. Reports are append-only and never delete or
// alter the reported entry; they feed an ops review queue.
//
// Memory by default (resets on restart, same tradeoff as the leaderboard store).
// When DATABASE_URL is a MongoDB URI, reports persist in a dedicated collection.
import { captureError } from "@/lib/telemetry";

export interface ScoreReport {
  /** The reported entry's name (as it appeared on the board). */
  name: string;
  /** The reported entry's score. */
  score: number;
  /** The reported entry's date (UTC). */
  date: string;
  /** Which lane the entry was on. */
  board: "guest" | "official";
  /** Optional: the reporter's name (for context only — never used for action). */
  reporter?: string;
  /** Optional: the reporter's wallet (official lane reporters only). */
  reporterWallet?: string | null;
  /** Free-text reason (sanitized, capped). */
  reason: string;
  /** When the report was filed (ms epoch). */
  ts: number;
}

export interface ScoreReportStore {
  readonly kind: "memory" | "mongo";
  add(report: ScoreReport): Promise<void>;
  /** Recent reports for the ops review queue (most recent first). */
  recent(limit?: number): Promise<ScoreReport[]>;
  readonly lastError?: string;
}

/* ---------------------------------- memory --------------------------------- */

class MemoryReportStore implements ScoreReportStore {
  readonly kind = "memory" as const;
  private reports: ScoreReport[] = [];
  private readonly max = 500;

  async add(report: ScoreReport): Promise<void> {
    this.reports.push(report);
    if (this.reports.length > this.max) this.reports.splice(0, this.reports.length - this.max);
  }

  async recent(limit = 50): Promise<ScoreReport[]> {
    return [...this.reports].reverse().slice(0, limit);
  }
}

/* ----------------------------------- mongo --------------------------------- */

const MONGO_DB = "candleclimber";
const MONGO_COLL = "score_reports";

class MongoReportStore implements ScoreReportStore {
  readonly kind = "mongo" as const;
  lastError: string | undefined;
  private coll: import("mongodb").Collection<ScoreReport> | null = null;
  private connecting: Promise<import("mongodb").Collection<ScoreReport> | null> | null = null;
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
        const coll = client.db(MONGO_DB).collection<ScoreReport>(MONGO_COLL);
        await coll.createIndex({ ts: -1 });
        await coll.createIndex({ date: 1, name: 1 });
        this.coll = coll;
        return coll;
      } catch (err) {
        const msg = (err as Error).message;
        console.error("[score-reports] mongo unavailable, falling back to memory:", msg);
        this.lastError = msg;
        captureError(err, { component: "score-reports", op: "mongo-connect" });
        this.disabled = true;
        return null;
      }
    })();
    return this.connecting;
  }

  async add(report: ScoreReport): Promise<void> {
    const coll = await this.connect();
    if (!coll) return; // route falls back to memory store
    await coll.insertOne({ ...report });
  }

  async recent(limit = 50): Promise<ScoreReport[]> {
    const coll = await this.connect();
    if (!coll) return [];
    return coll.find({}).sort({ ts: -1 }).limit(limit).toArray();
  }
}

/* --------------------------------- singleton -------------------------------- */

let memoryFallback: MemoryReportStore | null = null;
let mongoStore: MongoReportStore | null = null;

export function getScoreReports(): ScoreReportStore {
  const url = process.env.DATABASE_URL ?? "";
  if (url.startsWith("mongodb://") || url.startsWith("mongodb+srv://")) {
    if (!mongoStore) mongoStore = new MongoReportStore();
    return mongoStore;
  }
  if (!memoryFallback) memoryFallback = new MemoryReportStore();
  return memoryFallback;
}

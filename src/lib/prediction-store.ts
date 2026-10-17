// Prediction ledger storage (E2.3 — spec: docs/WICK-ECONOMY-SPEC.md §7.2 row 3).
// Same contract pattern as weights-store: MemoryStore default, MongoStore when
// DATABASE_URL is a mongodb:// URI. One prediction per identity per target date
// (unique index). Predictions are STORED SERVER-SIDE at lock time and scored
// later against the real closed daily candle — a caller can never restate a call
// after the market moved. Failures degrade gracefully and never touch the game.
import { type PredictionCall, type PredictionScore } from "@/lib/prediction";

export interface PredictionRow {
  name: string;
  submitDate: string; // UTC date the call was locked
  targetDate: string; // UTC date the call scores against (always submitDate + 1)
  symbol: string; // server-pinned daily-rotation symbol for the target date
  call: PredictionCall;
  wallet: string | null;
  status: "open" | "scored" | "void";
  result: PredictionScore | null;
  ts: number;
  scoredTs?: number;
}

export interface PredictionStore {
  readonly kind: "memory" | "mongo";
  /** Insert; null when (name, targetDate) already exists. */
  submit(row: PredictionRow): Promise<PredictionRow | null>;
  /** Latest N predictions for one identity (any status). */
  mine(name: string, limit?: number): Promise<PredictionRow[]>;
  /** All scored predictions for one target date (public scoreboard). */
  forTargetDate(targetDate: string): Promise<PredictionRow[]>;
  /** Open predictions whose target date has passed (scoring queue). */
  dueOpen(today: string, limit?: number): Promise<PredictionRow[]>;
  /** Mark scored (idempotent — only open rows flip). */
  markScored(name: string, targetDate: string, result: PredictionScore, ts: number): Promise<void>;
  readonly lastError?: string;
}

/* ---------------------------------- memory ---------------------------------- */

export class MemoryPredictionStore implements PredictionStore {
  readonly kind = "memory" as const;
  private rows: PredictionRow[] = [];

  async submit(row: PredictionRow): Promise<PredictionRow | null> {
    if (this.rows.some((r) => r.name === row.name && r.targetDate === row.targetDate)) return null;
    this.rows.push({ ...row });
    return row;
  }

  async mine(name: string, limit = 10): Promise<PredictionRow[]> {
    return this.rows
      .filter((r) => r.name === name)
      .sort((a, b) => b.ts - a.ts)
      .slice(0, limit);
  }

  async forTargetDate(targetDate: string): Promise<PredictionRow[]> {
    return this.rows.filter((r) => r.targetDate === targetDate && r.status === "scored");
  }

  async dueOpen(today: string, limit = 25): Promise<PredictionRow[]> {
    return this.rows
      .filter((r) => r.status === "open" && r.targetDate < today)
      .slice(0, limit);
  }

  async markScored(name: string, targetDate: string, result: PredictionScore, ts: number): Promise<void> {
    const r = this.rows.find((x) => x.name === name && x.targetDate === targetDate && x.status === "open");
    if (r) {
      r.status = "scored";
      r.result = result;
      r.scoredTs = ts;
    }
  }
}

/* ----------------------------------- mongo ----------------------------------- */

const MONGO_DB = "candleclimber";
const MONGO_COLL = "predictions";

class MongoPredictionStore implements PredictionStore {
  readonly kind = "mongo" as const;
  lastError: string | undefined;
  private coll: import("mongodb").Collection<PredictionRow> | null = null;
  private connecting: Promise<import("mongodb").Collection<PredictionRow> | null> | null = null;
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
        const coll = client.db(MONGO_DB).collection<PredictionRow>(MONGO_COLL);
        await coll.createIndex({ name: 1, targetDate: 1 }, { unique: true });
        await coll.createIndex({ status: 1, targetDate: 1 });
        this.coll = coll;
        return coll;
      } catch (err) {
        const msg = (err as Error).message;
        console.error("[predictions] mongo unavailable, falling back to memory:", msg);
        this.lastError = msg;
        this.disabled = true;
        return null;
      }
    })();
    return this.connecting;
  }

  async submit(row: PredictionRow): Promise<PredictionRow | null> {
    const coll = await this.connect();
    if (!coll) return null;
    try {
      await coll.insertOne({ ...row });
      return row;
    } catch (err) {
      if ((err as { code?: number }).code === 11000) return null;
      throw err;
    }
  }

  async mine(name: string, limit = 10): Promise<PredictionRow[]> {
    const coll = await this.connect();
    if (!coll) return [];
    return coll
      .find({ name }, { projection: { _id: 0 } })
      .sort({ ts: -1 })
      .limit(limit)
      .toArray();
  }

  async forTargetDate(targetDate: string): Promise<PredictionRow[]> {
    const coll = await this.connect();
    if (!coll) return [];
    return coll
      .find({ targetDate, status: "scored" }, { projection: { _id: 0 } })
      .limit(200)
      .toArray();
  }

  async dueOpen(today: string, limit = 25): Promise<PredictionRow[]> {
    const coll = await this.connect();
    if (!coll) return [];
    return coll
      .find({ status: "open", targetDate: { $lt: today } }, { projection: { _id: 0 } })
      .limit(limit)
      .toArray();
  }

  async markScored(name: string, targetDate: string, result: PredictionScore, ts: number): Promise<void> {
    const coll = await this.connect();
    if (!coll) return;
    await coll.updateOne(
      { name, targetDate, status: "open" },
      { $set: { status: "scored", result, scoredTs: ts } },
    );
  }
}

/* --------------------------------- singleton --------------------------------- */

let memoryFallback: MemoryPredictionStore | null = null;
let mongoStore: MongoPredictionStore | null = null;

export function getPredictions(): PredictionStore {
  const url = process.env.DATABASE_URL ?? "";
  if (url.startsWith("mongodb://") || url.startsWith("mongodb+srv://")) {
    if (!mongoStore) mongoStore = new MongoPredictionStore();
    return mongoStore;
  }
  if (!memoryFallback) memoryFallback = new MemoryPredictionStore();
  return memoryFallback;
}

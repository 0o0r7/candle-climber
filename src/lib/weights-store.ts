// Airdrop-weights ledger storage (E2.2 / P4.4 — spec: docs/WICK-ECONOMY-SPEC.md §7).
// Same contract as leaderboard-store: MemoryStore default (zero-config), MongoStore
// auto-activates when DATABASE_URL is a mongodb:// URI (Atlas M0 — verified serving
// prod since 2026-10-08). Every failure degrades gracefully; the ledger NEVER blocks
// or alters the game (ECONOMY-LAWS LAW 1).
import {
  nextStreakDays,
  runPoints,
  snapshotFromRows,
  utcDate,
  type WeightRow,
  type WalletSnapshot,
} from "@/lib/weights";

export interface RunRecord {
  name: string;
  date: string; // UTC date of the run event (== the verified token's level date)
  streakDays: number; // consecutive-day chain including this date (server-computed)
  points: number; // server-computed — clients never send points
  wallet: string | null; // optional link (lowercase address) at event time
  ts: number;
}

export interface IdentitySummary {
  name: string;
  streakDays: number;
  totalPoints: number;
  lastRunDate: string | null;
  wallet: string | null;
}

export interface WeightsStore {
  readonly kind: "memory" | "mongo";
  /** Returns the stored record, or null when the same-day event was a duplicate. */
  recordRun(rec: RunRecord): Promise<RunRecord | null>;
  /** Attach/refresh a wallet link for the identity (idempotent). */
  linkWallet(name: string, wallet: string): Promise<void>;
  summary(name: string): Promise<IdentitySummary>;
  /** Per-wallet snapshot rows (bounded read) + capped/anomaly-flagged totals. */
  snapshot(cap: number): Promise<{ rowCount: number; wallets: WalletSnapshot[] }>;
  readonly lastError?: string;
}

/* ---------------------------------- memory ---------------------------------- */

export class MemoryWeightsStore implements WeightsStore {
  readonly kind = "memory" as const;
  private rows: RunRecord[] = [];

  async recordRun(rec: RunRecord): Promise<RunRecord | null> {
    if (this.rows.some((r) => r.name === rec.name && r.date === rec.date)) return null;
    this.rows.push(rec);
    return rec;
  }

  async linkWallet(name: string, wallet: string): Promise<void> {
    for (let i = this.rows.length - 1; i >= 0; i--) {
      if (this.rows[i].name === name && !this.rows[i].wallet) this.rows[i].wallet = wallet;
    }
  }

  async summary(name: string): Promise<IdentitySummary> {
    const mine = this.rows.filter((r) => r.name === name);
    if (mine.length === 0) {
      return { name, streakDays: 0, totalPoints: 0, lastRunDate: null, wallet: null };
    }
    const last = mine.reduce((a, b) => (a.date > b.date ? a : b));
    return {
      name,
      streakDays: last.streakDays,
      totalPoints: mine.reduce((s, r) => s + r.points, 0),
      lastRunDate: last.date,
      wallet: last.wallet ?? null,
    };
  }

  async snapshot(cap: number): Promise<{ rowCount: number; wallets: WalletSnapshot[] }> {
    const rows: WeightRow[] = this.rows.map((r) => ({
      name: r.name,
      points: r.points,
      wallet: r.wallet,
    }));
    return { rowCount: rows.length, wallets: snapshotFromRows(rows, cap) };
  }
}

/* ----------------------------------- mongo ----------------------------------- */

const MONGO_DB = "candleclimber";
const MONGO_COLL = "weights_runs";
const SNAPSHOT_READ_LIMIT = 20_000; // bounded v1 read; aggregation replaces this if it ever binds

class MongoWeightsStore implements WeightsStore {
  readonly kind = "mongo" as const;
  lastError: string | undefined;
  private coll: import("mongodb").Collection<RunRecord> | null = null;
  private connecting: Promise<import("mongodb").Collection<RunRecord> | null> | null = null;
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
        const coll = client.db(MONGO_DB).collection<RunRecord>(MONGO_COLL);
        // idempotency at the DB level: one run event per identity per UTC date
        await coll.createIndex({ name: 1, date: 1 }, { unique: true });
        this.coll = coll;
        return coll;
      } catch (err) {
        const msg = (err as Error).message;
        console.error("[weights] mongo unavailable, falling back to memory:", msg);
        this.lastError = msg;
        this.disabled = true;
        return null;
      }
    })();
    return this.connecting;
  }

  async recordRun(rec: RunRecord): Promise<RunRecord | null> {
    const coll = await this.connect();
    if (!coll) return null;
    try {
      await coll.insertOne({ ...rec }); // RunRecord has no _id → driver auto-generates
      return rec;
    } catch (err) {
      if ((err as { code?: number }).code === 11000) return null; // duplicate same-day event
      throw err;
    }
  }

  async linkWallet(name: string, wallet: string): Promise<void> {
    const coll = await this.connect();
    if (!coll) return;
    await coll.updateMany({ name, $or: [{ wallet: null }, { wallet: { $exists: false } }] }, {
      $set: { wallet },
    });
  }

  async summary(name: string): Promise<IdentitySummary> {
    const coll = await this.connect();
    if (!coll) return { name, streakDays: 0, totalPoints: 0, lastRunDate: null, wallet: null };
    const mine = await coll.find({ name }).toArray();
    if (mine.length === 0) {
      return { name, streakDays: 0, totalPoints: 0, lastRunDate: null, wallet: null };
    }
    const last = mine.reduce((a, b) => (a.date > b.date ? a : b));
    return {
      name,
      streakDays: last.streakDays,
      totalPoints: mine.reduce((s, r) => s + r.points, 0),
      lastRunDate: last.date,
      wallet: last.wallet ?? null,
    };
  }

  async snapshot(cap: number): Promise<{ rowCount: number; wallets: WalletSnapshot[] }> {
    const coll = await this.connect();
    if (!coll) return { rowCount: 0, wallets: [] };
    const rows = await coll
      .find({}, { projection: { name: 1, points: 1, wallet: 1, _id: 0 } })
      .limit(SNAPSHOT_READ_LIMIT)
      .toArray();
    return { rowCount: rows.length, wallets: snapshotFromRows(rows as WeightRow[], cap) };
  }
}

/* --------------------------------- singleton --------------------------------- */

// Memoized like leaderboard-store: a fresh store per request would mean a fresh
// MongoClient per request (Atlas M0 caps connections — AUDIT finding F3).
let memoryFallback: MemoryWeightsStore | null = null;
let mongoStore: MongoWeightsStore | null = null;

export function getWeights(): WeightsStore {
  const url = process.env.DATABASE_URL ?? "";
  if (url.startsWith("mongodb://") || url.startsWith("mongodb+srv://")) {
    if (!mongoStore) mongoStore = new MongoWeightsStore();
    return mongoStore;
  }
  if (!memoryFallback) memoryFallback = new MemoryWeightsStore();
  return memoryFallback;
}

/**
 * One-stop ledger entry for the leaderboard route: a verified submission on
 * TODAY's classic (1w) level builds weights. Best-effort by contract — callers
 * `void` it and never await it in the game response path (LAW 1).
 */
export async function recordClassicRun(
  name: string,
  date: string,
  wallet: string | null,
  now: number = Date.now(),
): Promise<RunRecord | null> {
  if (date !== utcDate(now)) return null; // today's level only (spec §7.2)
  const store = getWeights();
  const s = await store.summary(name);
  const streak = nextStreakDays(s.streakDays, s.lastRunDate, date);
  const rec: RunRecord = {
    name,
    date,
    streakDays: streak,
    points: runPoints(streak),
    wallet,
    ts: now,
  };
  const saved = await store.recordRun(rec);
  if (!saved && wallet) await store.linkWallet(name, wallet); // same-day re-run still links
  return saved;
}

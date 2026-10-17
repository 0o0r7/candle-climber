// Signal Forge leaderboard storage (Phase 1).
// - MemoryStore: default, zero-config. Resets on restart — fine for dev/preview.
// - MongoStore:  auto-activated when DATABASE_URL is a mongodb:// or
//   mongodb+srv:// URI. Mirrors src/lib/leaderboard-store.ts (same singleton +
//   circuit-breaker posture, same lane semantics) but scoped to Forge runs,
//   whose entries carry survival/signal/chain fields the classic board has no
//   place for. Kept as its OWN collection so neither board can ever mix rows.
//
// Lanes (same LAW 1.2 Option B promise as the classic board):
//   guest    = walletless typed-name play (free, forever)
//   official = wallet-bound records, BEST run per wallet per date (replace-if-better)
import { captureError } from "@/lib/telemetry";
import type { ForgeBoardEntry, ForgeBoardFilter } from "@/lib/forge-board-validation";

export interface ForgeBoardStore {
  readonly kind: "memory" | "mongo";
  add(entry: ForgeBoardEntry): Promise<number>; // returns 1-based rank within the entry's own lane
  top(date: string | null, n: number, board?: ForgeBoardFilter): Promise<ForgeBoardEntry[]>;
  readonly lastError?: string;
}

/* ---------------------------------- memory --------------------------------- */

export class ForgeMemoryStore implements ForgeBoardStore {
  readonly kind = "memory" as const;
  private rows: ForgeBoardEntry[] = [];
  private readonly max = 2000;

  async add(entry: ForgeBoardEntry): Promise<number> {
    if (entry.board === "official") return this.addOfficial(entry);
    this.rows.push(entry);
    if (this.rows.length > this.max) this.rows.splice(0, this.rows.length - this.max);
    const better = this.rows.filter(
      (r) => r.board !== "official" && r.date === entry.date && r.score > entry.score,
    ).length;
    return better + 1;
  }

  /** official lane: best run per wallet per date — replace-if-better. */
  private addOfficial(entry: ForgeBoardEntry): number {
    const existing = entry.wallet
      ? this.rows.findIndex(
          (r) => r.board === "official" && r.wallet === entry.wallet && r.date === entry.date,
        )
      : -1;
    if (existing >= 0) {
      const prev = this.rows[existing];
      if (prev.score >= entry.score) {
        const better = this.rows.filter(
          (r) => r.board === "official" && r.date === prev.date && r.score > prev.score,
        ).length;
        return better + 1;
      }
      this.rows.splice(existing, 1); // better run replaces the wallet's old record
    }
    this.rows.push(entry);
    if (this.rows.length > this.max) this.rows.splice(0, this.rows.length - this.max);
    const better = this.rows.filter(
      (r) => r.board === "official" && r.date === entry.date && r.score > entry.score,
    ).length;
    return better + 1;
  }

  async top(date: string | null, n: number, board: ForgeBoardFilter = "guest"): Promise<ForgeBoardEntry[]> {
    return this.rows
      .filter((r) => {
        if (board === "official" && r.board !== "official") return false;
        if (board === "guest" && r.board === "official") return false;
        return !date || r.date === date;
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, n);
  }
}

/* ----------------------------------- mongo ---------------------------------- */

const MONGO_DB = "candleclimber";
const MONGO_COLL = "forge_scores";

// `$ne: "official"` matches missing fields too, so legacy docs read as guest rows.
const GUEST_Q = { board: { $ne: "official" } } as const;
const OFFICIAL_Q = { board: "official" } as const;

class ForgeMongoStore implements ForgeBoardStore {
  readonly kind = "mongo" as const;
  lastError: string | undefined;
  private coll: import("mongodb").Collection<ForgeBoardEntry> | null = null;
  private connecting: Promise<import("mongodb").Collection<ForgeBoardEntry> | null> | null = null;
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
        const coll = client.db(MONGO_DB).collection<ForgeBoardEntry>(MONGO_COLL);
        await coll.createIndex({ date: 1, score: -1 });
        await coll.createIndex({ board: 1, wallet: 1, date: 1 });
        this.coll = coll;
        return coll;
      } catch (err) {
        const msg = (err as Error).message;
        console.error("[forge-board] mongo unavailable, falling back to memory:", msg);
        this.lastError = msg;
        captureError(err, { lane: "forge-board", op: "mongo-connect", store: this.kind });
        this.disabled = true;
        return null;
      }
    })();
    return this.connecting;
  }

  async add(entry: ForgeBoardEntry): Promise<number> {
    const coll = await this.connect();
    if (!coll) return 1;
    if (entry.board === "official") {
      const prev =
        entry.wallet
          ? await coll.findOne({ board: "official", wallet: entry.wallet, date: entry.date })
          : null;
      if (prev) {
        if (prev.score >= entry.score) {
          const better = await coll.countDocuments({
            board: "official",
            date: prev.date,
            score: { $gt: prev.score },
          });
          return better + 1;
        }
        await coll.replaceOne({ _id: prev._id }, { ...entry });
      } else {
        await coll.insertOne({ ...entry });
      }
      const better = await coll.countDocuments({
        board: "official",
        date: entry.date,
        score: { $gt: entry.score },
      });
      return better + 1;
    }
    await coll.insertOne({ ...entry });
    const better = await coll.countDocuments({
      ...GUEST_Q,
      date: entry.date,
      score: { $gt: entry.score },
    });
    return better + 1;
  }

  async top(date: string | null, n: number, board: ForgeBoardFilter = "guest"): Promise<ForgeBoardEntry[]> {
    const coll = await this.connect();
    if (!coll) return [];
    const lane = board === "official" ? OFFICIAL_Q : GUEST_Q;
    const q = { ...lane, ...(date ? { date } : {}) };
    return coll.find(q).sort({ score: -1 }).limit(n).toArray();
  }
}

/* --------------------------------- singleton -------------------------------- */

let memoryFallback: ForgeMemoryStore | null = null;
let mongoStore: ForgeMongoStore | null = null;

export function getForgeBoard(): ForgeBoardStore {
  const url = process.env.DATABASE_URL ?? "";
  if (url.startsWith("mongodb://") || url.startsWith("mongodb+srv://")) {
    if (!mongoStore) mongoStore = new ForgeMongoStore();
    return mongoStore;
  }
  if (!memoryFallback) memoryFallback = new ForgeMemoryStore();
  return memoryFallback;
}

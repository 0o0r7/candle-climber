// Global daily leaderboard storage.
// - MemoryStore: default, zero-config. Resets on restart — fine for dev/preview.
// - MongoStore:  auto-activated when DATABASE_URL is a mongodb:// or mongodb+srv://
//   URI (MongoDB Atlas M0 via GitHub Student Pack, phase p1). No code changes needed:
//   set the env var and restart; every failure falls back to memory gracefully.
//
// LAW 1.2 Option B (dated note 2026-10-10, docs/ECONOMY-LAWS.md): boards are
// split into two lanes that never mix —
//   guest    = walletless typed-name play (LAW 1.2 substance: free, forever).
//              Legacy entries (no `board` field) ARE guest rows; the classic
//              board's semantics are byte-preserved.
//   official = wallet-bound competitive records. `add` keeps the BEST run per
//              wallet per date+interval (replace-if-better) so one wallet can
//              never flood the official board; rank math scopes to its own lane.
// A guest row never appears on the official board and vice versa — same
// "no board mixing" promise P3.5 already made for timeframes.
// E4.4 (2026-10-10): store failures on this path are economy-path alerts too —
// a leaderboard write failure loses BOTH a score and a weights-lane trigger.
import { captureError } from "@/lib/telemetry";

export interface BoardEntry {
  name: string;
  score: number;
  candlesPassed: number;
  bestStreak?: number;
  mutation?: string;
  symbol: string;
  date: string;
  interval?: string; // P3.5: leaderboard boards are PER-TIMEFRAME ("1w" when absent — legacy entries)
  ts: number;
  // Option B identity fields (stamped by board-validation at write time):
  board?: "guest" | "official"; // absent on legacy rows ⇒ treated as guest
  wallet?: string | null; // lowercase address on official rows; null on guest
  season?: string | null; // seasonOf(date) on new rows (pre-season dates ⇒ null)
  ref?: string; // E5.5: opaque referral stamp (sanitizeRef-bounded); metadata only
}

export type BoardFilter = "guest" | "official" | "all";

const IV = (e: Pick<BoardEntry, "interval">) => e.interval ?? "1w";

/** E4.1 ops-dashboard lane aggregates — COUNTS ONLY, zero names/addresses. */
export interface LaneStats {
  guestRows: number; // every guest submission ever stored (legacy included)
  officialRows: number; // best-run-per-wallet records
  distinctGuests: number; // distinct guest names
  distinctWallets: number; // distinct official-lane wallets
  todayGuest: number;
  todayOfficial: number;
  topRefs: { ref: string; count: number }[]; // E5.5: top referral stamps, last 7d
}

export interface BoardStore {
  readonly kind: "memory" | "mongo";
  add(entry: BoardEntry): Promise<number>; // returns rank (1-based) within the entry's own lane + interval
  top(date: string | null, n: number, interval?: string, board?: BoardFilter): Promise<BoardEntry[]>;
  /** E4.1: privacy-safe lane aggregates for the /ops page (counts only). */
  laneStats(now: number): Promise<LaneStats>;
  /** last connection error when a backing store is down (diagnostics) */
  readonly lastError?: string;
}

/* ---------------------------------- memory --------------------------------- */

// exported for W5 contract tests (P3.5 per-timeframe board separation)
export class MemoryStore implements BoardStore {
  readonly kind = "memory" as const;
  private rows: BoardEntry[] = [];
  private readonly max = 2000;

  async add(entry: BoardEntry): Promise<number> {
    if (entry.board === "official") return this.addOfficial(entry);
    // guest lane — legacy semantics byte-preserved (every submission stored)
    this.rows.push(entry);
    if (this.rows.length > this.max) this.rows.splice(0, this.rows.length - this.max);
    const iv = IV(entry);
    const better = this.rows.filter(
      (r) =>
        r.board !== "official" &&
        r.date === entry.date &&
        IV(r) === iv &&
        r.score > entry.score,
    ).length;
    return better + 1;
  }

  /** official lane: best run per wallet per date+interval — replace-if-better. */
  private addOfficial(entry: BoardEntry): number {
    const iv = IV(entry);
    const existing = entry.wallet
      ? this.rows.findIndex(
          (r) =>
            r.board === "official" &&
            r.wallet === entry.wallet &&
            r.date === entry.date &&
            IV(r) === iv,
        )
      : -1;
    if (existing >= 0) {
      const prev = this.rows[existing];
      if (prev.score >= entry.score) {
        // worse/equal repeat: board keeps its best; report the best's live rank
        const better = this.rows.filter(
          (r) => r.board === "official" && r.date === prev.date && IV(r) === iv && r.score > prev.score,
        ).length;
        return better + 1;
      }
      this.rows.splice(existing, 1); // better run replaces the wallet's old record
    }
    this.rows.push(entry);
    if (this.rows.length > this.max) this.rows.splice(0, this.rows.length - this.max);
    const better = this.rows.filter(
      (r) =>
        r.board === "official" &&
        r.date === entry.date &&
        IV(r) === iv &&
        r.score > entry.score,
    ).length;
    return better + 1;
  }

  async top(
    date: string | null,
    n: number,
    interval: string = "1w",
    board: BoardFilter = "guest",
  ): Promise<BoardEntry[]> {
    return this.rows
      .filter((r) => {
        if (board === "official" && r.board !== "official") return false;
        if (board === "guest" && r.board === "official") return false;
        return (!date || r.date === date) && IV(r) === interval;
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, n);
  }

  async laneStats(now: number): Promise<LaneStats> {
    const today = new Date(now).toISOString().slice(0, 10);
    const week = new Date(now - 7 * 86_400_000).toISOString().slice(0, 10);
    const guest = this.rows.filter((r) => r.board !== "official");
    const official = this.rows.filter((r) => r.board === "official");
    const refCount = new Map<string, number>();
    for (const r of this.rows) {
      if (!r.ref) continue;
      const d = new Date(r.ts).toISOString().slice(0, 10);
      if (d >= week && d <= today) refCount.set(r.ref, (refCount.get(r.ref) ?? 0) + 1);
    }
    return {
      guestRows: guest.length,
      officialRows: official.length,
      distinctGuests: new Set(guest.map((r) => r.name)).size,
      distinctWallets: new Set(official.map((r) => r.wallet).filter((w): w is string => !!w)).size,
      todayGuest: guest.filter((r) => r.date === today).length,
      todayOfficial: official.filter((r) => r.date === today).length,
      topRefs: [...refCount.entries()]
        .map(([ref, count]) => ({ ref, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5),
    };
  }
}

/* ----------------------------------- mongo ---------------------------------- */

const MONGO_DB = "candleclimber";
const MONGO_COLL = "scores";

// Mongo lane predicates — `$ne: "official"` matches missing fields too, so
// legacy docs (pre-Option B, no `board`) read as guest rows, same as memory.
const GUEST_Q = { board: { $ne: "official" } } as const;
const OFFICIAL_Q = { board: "official" } as const;

class MongoStore implements BoardStore {
  readonly kind = "mongo" as const;
  lastError: string | undefined;
  private coll: import("mongodb").Collection<BoardEntry> | null = null;
  private connecting: Promise<import("mongodb").Collection<BoardEntry> | null> | null = null;
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
        const coll = client.db(MONGO_DB).collection<BoardEntry>(MONGO_COLL);
        await coll.createIndex({ date: 1, score: -1 });
        // official lane lookups (best-per-wallet) + lane filters stay indexed
        await coll.createIndex({ board: 1, wallet: 1, date: 1, interval: 1 });
        this.coll = coll;
        return coll;
      } catch (err) {
        const msg = (err as Error).message;
        console.error("[leaderboard] mongo unavailable, falling back to memory:", msg);
        this.lastError = msg;
        captureError(err, { lane: "leaderboard", op: "mongo-connect", store: this.kind }); // E4.4 P2
        this.disabled = true;
        return null;
      }
    })();
    return this.connecting;
  }

  async add(entry: BoardEntry): Promise<number> {
    const coll = await this.connect();
    if (!coll) return 1; // unreachable in practice — route falls back to memory store
    const iv = IV(entry);
    const ivq =
      iv === "1w"
        ? { $or: [{ interval: "1w" }, { interval: { $exists: false } }] }
        : { interval: iv };
    if (entry.board === "official") {
      // official lane: best run per wallet per date+interval — replace-if-better
      const prev =
        entry.wallet
          ? await coll.findOne({
              board: "official",
              wallet: entry.wallet,
              date: entry.date,
              ...ivq,
            })
          : null;
      if (prev) {
        if (prev.score >= entry.score) {
          const better = await coll.countDocuments({
            board: "official",
            date: prev.date,
            ...ivq,
            score: { $gt: prev.score },
          });
          return better + 1;
        }
        await coll.replaceOne({ _id: prev._id }, { ...entry }); // BoardEntry has no _id field
      } else {
        await coll.insertOne({ ...entry });
      }
      const better = await coll.countDocuments({
        board: "official",
        date: entry.date,
        ...ivq,
        score: { $gt: entry.score },
      });
      return better + 1;
    }
    // guest lane — legacy semantics byte-preserved (every submission stored)
    await coll.insertOne({ ...entry }); // BoardEntry has no _id field → driver auto-generates
    // rank within the entry's own lane + timeframe board ("no board mixing", P3.5);
    // legacy docs (no interval field) count as "1w"
    const better = await coll.countDocuments({
      ...GUEST_Q,
      date: entry.date,
      ...ivq,
      score: { $gt: entry.score },
    });
    return better + 1;
  }

  async top(
    date: string | null,
    n: number,
    interval: string = "1w",
    board: BoardFilter = "guest",
  ): Promise<BoardEntry[]> {
    const coll = await this.connect();
    if (!coll) return [];
    // legacy entries predate the interval field — they are "1w" boards
    const ivq =
      interval === "1w"
        ? { $or: [{ interval: "1w" }, { interval: { $exists: false } }] }
        : { interval };
    const lane = board === "official" ? OFFICIAL_Q : board === "all" ? {} : GUEST_Q;
    const q = { ...lane, ...(date ? { date } : {}), ...ivq };
    return coll.find(q).sort({ score: -1 }).limit(n).toArray();
  }

  async laneStats(now: number): Promise<LaneStats> {
    const coll = await this.connect();
    if (!coll) {
      return { guestRows: 0, officialRows: 0, distinctGuests: 0, distinctWallets: 0, todayGuest: 0, todayOfficial: 0, topRefs: [] };
    }
    const today = new Date(now).toISOString().slice(0, 10);
    const weekMs = now - 7 * 86_400_000;
    const week = new Date(weekMs).toISOString().slice(0, 10);
    const [guestRows, officialRows, distinctGuests, distinctWallets, todayGuest, todayOfficial, refAgg] =
      await Promise.all([
        coll.countDocuments(GUEST_Q),
        coll.countDocuments(OFFICIAL_Q),
        coll.distinct("name", GUEST_Q),
        coll.distinct("wallet", { ...OFFICIAL_Q, wallet: { $type: "string", $ne: null } }),
        coll.countDocuments({ ...GUEST_Q, date: today }),
        coll.countDocuments({ ...OFFICIAL_Q, date: today }),
        // E5.5 rollup: top referral stamps across the last 7 UTC dates (ts is ms)
        coll
          .aggregate<{ _id: string; count: number }>([
            { $match: { ref: { $type: "string", $exists: true }, ts: { $gte: weekMs, $lte: now } } },
            { $group: { _id: "$ref", count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 5 },
          ])
          .toArray(),
      ]);
    return {
      guestRows,
      officialRows,
      distinctGuests: distinctGuests.length,
      distinctWallets: distinctWallets.length,
      todayGuest,
      todayOfficial,
      topRefs: refAgg.map((r) => ({ ref: r._id, count: r.count })),
    };
  }
}

/* --------------------------------- singleton -------------------------------- */

// Memoize BOTH stores: a fresh MongoStore per request would mean a fresh MongoClient
// per request (Atlas M0 caps connections, and the per-instance 'disabled' circuit-
// breaker would reset every call — AUDIT finding F3).
let memoryFallback: MemoryStore | null = null;
let mongoStore: MongoStore | null = null;

export function getBoard(): BoardStore {
  const url = process.env.DATABASE_URL ?? "";
  if (url.startsWith("mongodb://") || url.startsWith("mongodb+srv://")) {
    if (!mongoStore) mongoStore = new MongoStore();
    return mongoStore;
  }
  if (!memoryFallback) memoryFallback = new MemoryStore();
  return memoryFallback;
}

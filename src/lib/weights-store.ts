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
  PRACTICE_POINTS,
  PRACTICE_DAILY_CAP,
  PREDICTION_DAILY_CAP,
  VAULT_POINTS,
  type WeightEventKind,
  type WeightRow,
  type WalletSnapshot,
} from "@/lib/weights";
// E4.4: ledger write errors are P2 alerts, never silent (spec §9)
import { captureError } from "@/lib/telemetry";

export interface RunRecord {
  name: string;
  date: string; // UTC date of the run event (== the verified token's level date)
  streakDays: number; // consecutive-day chain including this date (server-computed)
  points: number; // server-computed — clients never send points
  wallet: string | null; // optional link (lowercase address) at event time
  ts: number;
}

/**
 * E2.3/E2.4 ledger events (spec §7.2 rows 2/3/5). One folded row per
 * (name, date, kind): practice ACCUMULATES 0.5/run up to the 2/day cap;
 * prediction and vault are unique inserts (duplicate → null).
 */
export interface WeightEvent {
  name: string;
  date: string; // UTC date the weight accrues on (today for practice/vault, target date for prediction)
  kind: WeightEventKind;
  points: number; // server-computed — never client-sent
  wallet: string | null;
  ts: number;
  meta?: { runs?: number; symbol?: string; tier?: string }; // practice run count / context
}

export interface IdentitySummary {
  name: string;
  streakDays: number;
  totalPoints: number; // runs + events — the distribution-relevant total
  eventPoints: number; // E2.3/E2.4 lanes only (practice/prediction/vault)
  lastRunDate: string | null;
  wallet: string | null;
}

/** E4.1 ops-dashboard aggregates — COUNTS ONLY, zero identities/addresses. */
export interface WeightsStats {
  runRows: number; // classic-run events (one per identity per UTC date)
  eventRows: number; // practice/prediction/vault rows
  identities: number; // distinct names across runs ∪ events
  linkedWallets: number; // distinct non-null wallets
  totalPoints: number; // sum over both collections
  todayRuns: number; // run rows stamped today (UTC)
  weekRuns: number; // run rows within the last 7 UTC dates
}

export interface WeightsStore {
  readonly kind: "memory" | "mongo";
  /** Returns the stored record, or null when the same-day event was a duplicate. */
  recordRun(rec: RunRecord): Promise<RunRecord | null>;
  /** Folded practice row: +0.5 per call, capped at PRACTICE_DAILY_CAP. Returns the stored row. */
  addPractice(name: string, date: string, wallet: string | null, ts: number): Promise<WeightEvent>;
  /** Unique event insert (prediction/vault) — null when (name, date, kind) already exists. */
  recordEvent(ev: WeightEvent): Promise<WeightEvent | null>;
  /** Attach/refresh a wallet link for the identity across runs AND events (idempotent). */
  linkWallet(name: string, wallet: string): Promise<void>;
  summary(name: string): Promise<IdentitySummary>;
  /** Per-wallet snapshot rows (bounded read) + capped/anomaly-flagged totals. */
  snapshot(cap: number): Promise<{ rowCount: number; wallets: WalletSnapshot[] }>;
  /** E4.1: privacy-safe aggregates for the /ops page (counts only). */
  stats(now: number): Promise<WeightsStats>;
  readonly lastError?: string;
}

/* ---------------------------------- memory ---------------------------------- */

export class MemoryWeightsStore implements WeightsStore {
  readonly kind = "memory" as const;
  private rows: RunRecord[] = [];
  private events: WeightEvent[] = [];

  async recordRun(rec: RunRecord): Promise<RunRecord | null> {
    if (this.rows.some((r) => r.name === rec.name && r.date === rec.date)) return null;
    this.rows.push(rec);
    return rec;
  }

  async addPractice(name: string, date: string, wallet: string | null, ts: number): Promise<WeightEvent> {
    const i = this.events.findIndex((e) => e.name === name && e.date === date && e.kind === "practice");
    if (i === -1) {
      const row: WeightEvent = {
        name, date, kind: "practice", points: PRACTICE_POINTS, wallet, ts, meta: { runs: 1 },
      };
      this.events.push(row);
      return row;
    }
    const row = { ...this.events[i] };
    row.meta = { ...(row.meta ?? {}), runs: (row.meta?.runs ?? 0) + 1 };
    row.points = Math.min((row.meta.runs ?? 0) * PRACTICE_POINTS, PRACTICE_DAILY_CAP);
    if (wallet && !row.wallet) row.wallet = wallet;
    row.ts = ts;
    this.events[i] = row;
    return row;
  }

  async recordEvent(ev: WeightEvent): Promise<WeightEvent | null> {
    if (ev.kind === "practice") return this.addPractice(ev.name, ev.date, ev.wallet, ev.ts);
    if (this.events.some((e) => e.name === ev.name && e.date === ev.date && e.kind === ev.kind)) return null;
    this.events.push({ ...ev });
    return ev;
  }

  async linkWallet(name: string, wallet: string): Promise<void> {
    for (let i = this.rows.length - 1; i >= 0; i--) {
      if (this.rows[i].name === name && !this.rows[i].wallet) this.rows[i].wallet = wallet;
    }
    for (const e of this.events) {
      if (e.name === name && !e.wallet) e.wallet = wallet;
    }
  }

  async summary(name: string): Promise<IdentitySummary> {
    const mine = this.rows.filter((r) => r.name === name);
    const evts = this.events.filter((e) => e.name === name);
    const eventPoints = evts.reduce((s, e) => s + e.points, 0);
    if (mine.length === 0) {
      return { name, streakDays: 0, totalPoints: eventPoints, eventPoints, lastRunDate: null, wallet: evts.at(-1)?.wallet ?? null };
    }
    const last = mine.reduce((a, b) => (a.date > b.date ? a : b));
    return {
      name,
      streakDays: last.streakDays,
      totalPoints: mine.reduce((s, r) => s + r.points, 0) + eventPoints,
      eventPoints,
      lastRunDate: last.date,
      wallet: last.wallet ?? evts.at(-1)?.wallet ?? null,
    };
  }

  async snapshot(cap: number): Promise<{ rowCount: number; wallets: WalletSnapshot[] }> {
    const rows: WeightRow[] = [
      ...this.rows.map((r) => ({ name: r.name, points: r.points, wallet: r.wallet })),
      ...this.events.map((e) => ({ name: e.name, points: e.points, wallet: e.wallet, kind: e.kind })),
    ];
    return { rowCount: rows.length, wallets: snapshotFromRows(rows, cap) };
  }

  async stats(now: number): Promise<WeightsStats> {
    const names = new Set<string>();
    const wallets = new Set<string>();
    let totalPoints = 0;
    for (const r of this.rows) {
      names.add(r.name);
      if (r.wallet) wallets.add(r.wallet);
      totalPoints += r.points;
    }
    for (const e of this.events) {
      names.add(e.name);
      if (e.wallet) wallets.add(e.wallet);
      totalPoints += e.points;
    }
    const today = utcDate(now);
    const week = new Date(now - 7 * 86_400_000).toISOString().slice(0, 10);
    return {
      runRows: this.rows.length,
      eventRows: this.events.length,
      identities: names.size,
      linkedWallets: wallets.size,
      totalPoints,
      todayRuns: this.rows.filter((r) => r.date === today).length,
      weekRuns: this.rows.filter((r) => r.date >= week && r.date <= today).length,
    };
  }
}

/* ----------------------------------- mongo ----------------------------------- */

const MONGO_DB = "candleclimber";
const MONGO_COLL = "weights_runs";
const MONGO_EVENTS = "weights_events"; // E2.3/E2.4: practice/prediction/vault rows
const SNAPSHOT_READ_LIMIT = 20_000; // bounded v1 read; aggregation replaces this if it ever binds

class MongoWeightsStore implements WeightsStore {
  readonly kind = "mongo" as const;
  lastError: string | undefined;
  private coll: import("mongodb").Collection<RunRecord> | null = null;
  private evColl: import("mongodb").Collection<WeightEvent> | null = null;
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
        const db = client.db(MONGO_DB);
        const coll = db.collection<RunRecord>(MONGO_COLL);
        // idempotency at the DB level: one run event per identity per UTC date
        await coll.createIndex({ name: 1, date: 1 }, { unique: true });
        this.coll = coll;
        // E2.3/E2.4 events: one folded row per identity per UTC date per kind
        const evColl = db.collection<WeightEvent>(MONGO_EVENTS);
        await evColl.createIndex({ name: 1, date: 1, kind: 1 }, { unique: true });
        this.evColl = evColl;
        return coll;
      } catch (err) {
        const msg = (err as Error).message;
        console.error("[weights] mongo unavailable, falling back to memory:", msg);
        this.lastError = msg;
        // E4.4: weights going memory-only is a P2 alert (spec §9) — events would
        // silently reset on restart, which is exactly the trust failure to surface
        captureError(err, { lane: "weights", op: "mongo-connect", store: this.kind });
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
      captureError(err, { lane: "weights", op: "recordRun", store: this.kind }); // E4.4 P2
      throw err;
    }
  }

  async addPractice(name: string, date: string, wallet: string | null, ts: number): Promise<WeightEvent> {
    const coll = await this.connect();
    if (!coll || !this.evColl) {
      // fail-open mirror of the memory path so callers always get a row back
      return { name, date, kind: "practice", points: PRACTICE_POINTS, wallet, ts, meta: { runs: 1 } };
    }
    try {
      // Pipeline update: fold runs into ONE row per (name, date, "practice") —
      // points = min(runs × 0.5, 2/day). Race-safe enough at v1 scale; the cap
      // is re-derived from meta.runs on every write, so a lost update can only
      // undercount, never exceed the cap.
      const res = await this.evColl.findOneAndUpdate(
        { name, date, kind: "practice" },
        [
          {
            $set: {
              name,
              date,
              kind: "practice" as const,
              wallet: { $ifNull: ["$wallet", wallet] },
              ts,
              meta: { runs: { $add: [{ $ifNull: ["$meta.runs", 0] }, 1] } },
            },
          },
          {
            $set: {
              points: { $min: [{ $multiply: ["$meta.runs", PRACTICE_POINTS] }, PRACTICE_DAILY_CAP] },
            },
          },
        ],
        { upsert: true, returnDocument: "after" },
      );
      return (res as unknown as WeightEvent) ?? {
        name, date, kind: "practice", points: PRACTICE_POINTS, wallet, ts, meta: { runs: 1 },
      };
    } catch (err) {
      this.lastError = (err as Error).message;
      console.error("[weights] addPractice failed:", this.lastError);
      captureError(err, { lane: "weights", op: "addPractice", store: this.kind }); // E4.4 P2
      return { name, date, kind: "practice", points: 0, wallet, ts, meta: { runs: 0 } };
    }
  }

  async recordEvent(ev: WeightEvent): Promise<WeightEvent | null> {
    if (ev.kind === "practice") return this.addPractice(ev.name, ev.date, ev.wallet, ev.ts);
    const coll = await this.connect();
    if (!coll || !this.evColl) return null; // unavailable ledger = no event (never blocks the game)
    try {
      await this.evColl.insertOne({ ...ev });
      return ev;
    } catch (err) {
      if ((err as { code?: number }).code === 11000) return null; // duplicate (name, date, kind)
      captureError(err, { lane: "weights", op: "recordEvent", kind: ev.kind, store: this.kind }); // E4.4 P2
      throw err;
    }
  }

  async linkWallet(name: string, wallet: string): Promise<void> {
    const coll = await this.connect();
    if (!coll) return;
    const linkQ = { name, $or: [{ wallet: null }, { wallet: { $exists: false } }] };
    await coll.updateMany(linkQ, { $set: { wallet } });
    if (this.evColl) await this.evColl.updateMany(linkQ, { $set: { wallet } });
  }

  async summary(name: string): Promise<IdentitySummary> {
    const coll = await this.connect();
    if (!coll) return { name, streakDays: 0, totalPoints: 0, eventPoints: 0, lastRunDate: null, wallet: null };
    const mine = await coll.find({ name }).toArray();
    const evts = this.evColl ? await this.evColl.find({ name }).toArray() : [];
    const eventPoints = evts.reduce((s, e) => s + e.points, 0);
    if (mine.length === 0) {
      return { name, streakDays: 0, totalPoints: eventPoints, eventPoints, lastRunDate: null, wallet: evts.at(-1)?.wallet ?? null };
    }
    const last = mine.reduce((a, b) => (a.date > b.date ? a : b));
    return {
      name,
      streakDays: last.streakDays,
      totalPoints: mine.reduce((s, r) => s + r.points, 0) + eventPoints,
      eventPoints,
      lastRunDate: last.date,
      wallet: last.wallet ?? evts.at(-1)?.wallet ?? null,
    };
  }

  async snapshot(cap: number): Promise<{ rowCount: number; wallets: WalletSnapshot[] }> {
    const coll = await this.connect();
    if (!coll) return { rowCount: 0, wallets: [] };
    const rows = await coll
      .find({}, { projection: { name: 1, points: 1, wallet: 1, _id: 0 } })
      .limit(SNAPSHOT_READ_LIMIT)
      .toArray();
    const evRows = this.evColl
      ? await this.evColl
          .find({}, { projection: { name: 1, points: 1, wallet: 1, kind: 1, _id: 0 } })
          .limit(SNAPSHOT_READ_LIMIT)
          .toArray()
      : [];
    const all: WeightRow[] = [
      ...(rows as WeightRow[]),
      ...evRows.map((e) => ({ name: e.name, points: e.points, wallet: e.wallet, kind: e.kind })),
    ];
    return { rowCount: all.length, wallets: snapshotFromRows(all, cap) };
  }

  async stats(now: number): Promise<WeightsStats> {
    const coll = await this.connect();
    if (!coll) {
      return { runRows: 0, eventRows: 0, identities: 0, linkedWallets: 0, totalPoints: 0, todayRuns: 0, weekRuns: 0 };
    }
    const today = utcDate(now);
    const week = new Date(now - 7 * 86_400_000).toISOString().slice(0, 10);
    const [runRows, eventRows, identities, evNames, linkedWallets, evWallets, pointsAgg, evPointsAgg, todayRuns, weekRuns] =
      await Promise.all([
        coll.countDocuments({}),
        this.evColl ? this.evColl.countDocuments({}) : Promise.resolve(0),
        coll.distinct("name"),
        this.evColl ? this.evColl.distinct("name") : Promise.resolve([] as string[]),
        coll.distinct("wallet", { wallet: { $type: "string", $ne: null } }),
        this.evColl ? this.evColl.distinct("wallet", { wallet: { $type: "string", $ne: null } }) : Promise.resolve([] as string[]),
        coll.aggregate<{ total: number }>([{ $group: { _id: null, total: { $sum: "$points" } } }]).toArray(),
        this.evColl
          ? this.evColl.aggregate<{ total: number }>([{ $group: { _id: null, total: { $sum: "$points" } } }]).toArray()
          : Promise.resolve([] as { total: number }[]),
        coll.countDocuments({ date: today }),
        coll.countDocuments({ date: { $gte: week, $lte: today } }),
      ]);
    const walletSet = new Set([...linkedWallets, ...evWallets]);
    return {
      runRows,
      eventRows,
      identities: new Set([...identities, ...evNames]).size,
      linkedWallets: walletSet.size,
      totalPoints: (pointsAgg[0]?.total ?? 0) + (evPointsAgg[0]?.total ?? 0),
      todayRuns,
      weekRuns,
    };
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

/** E2.3 practice lane: a verified ARCHIVE run banks 0.5 weight, capped 2/day. */
export async function recordPracticeRun(
  name: string,
  wallet: string | null,
  now: number = Date.now(),
): Promise<WeightEvent> {
  return getWeights().addPractice(name, utcDate(now), wallet, now);
}

/** E2.3 prediction lane: scored call lands its points on the TARGET date. */
export async function recordPredictionPoints(
  name: string,
  date: string,
  points: number,
  wallet: string | null,
  meta: { symbol?: string } = {},
  now: number = Date.now(),
): Promise<WeightEvent | null> {
  return getWeights().recordEvent({
    name, date, kind: "prediction", points: Math.max(0, Math.min(PREDICTION_DAILY_CAP, points)),
    wallet, ts: now, meta,
  });
}

/** E2.4 vault lane: one grant per identity per day (weights + cosmetic). */
export async function recordVaultGrant(
  name: string,
  wallet: string | null,
  meta: { tier?: string } = {},
  now: number = Date.now(),
): Promise<WeightEvent | null> {
  return getWeights().recordEvent({
    name, date: utcDate(now), kind: "vault", points: VAULT_POINTS, wallet, ts: now, meta,
  });
}

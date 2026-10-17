// Chain City — server-side save store (Phase 2, v1).
// - MemoryStore: default, zero-config. Resets on restart — fine for dev/preview.
// - MongoStore:  auto-activated when DATABASE_URL is a mongodb:// / mongodb+srv://
//   URI. Same singleton + circuit-breaker posture as leaderboard-store.ts, but a
//   DIFFERENT collection: a city row is one-per-wallet durable state, not a
//   score list.
//
// One row per wallet (replace on every save — a city is a living state, not a
// history). The board reads rank by city level, treasury as tie-break.
import { captureError } from "@/lib/telemetry";
import { cityScore, type CitySaveEntry } from "@/lib/city-save";

export interface CitySaveStore {
  readonly kind: "memory" | "mongo";
  /** Upsert one wallet's city. Returns the wallet's 1-based board rank. */
  put(entry: CitySaveEntry): Promise<number>;
  /** The stored city for a wallet (full state), or null. */
  get(wallet: string): Promise<CitySaveEntry | null>;
  /** Top n cities, best first. */
  top(n: number): Promise<CitySaveEntry[]>;
  readonly lastError?: string;
}

function rankOf(rows: CitySaveEntry[], entry: CitySaveEntry): number {
  const mine = cityScore(entry.cityLevel, entry.treasury);
  return rows.filter((r) => cityScore(r.cityLevel, r.treasury) > mine).length + 1;
}

/* ---------------------------------- memory --------------------------------- */

export class CityMemoryStore implements CitySaveStore {
  readonly kind = "memory" as const;
  private rows = new Map<string, CitySaveEntry>();

  async put(entry: CitySaveEntry): Promise<number> {
    this.rows.set(entry.wallet, entry);
    return rankOf([...this.rows.values()], entry);
  }

  async get(wallet: string): Promise<CitySaveEntry | null> {
    return this.rows.get(wallet) ?? null;
  }

  async top(n: number): Promise<CitySaveEntry[]> {
    return [...this.rows.values()]
      .sort((a, b) => cityScore(b.cityLevel, b.treasury) - cityScore(a.cityLevel, a.treasury))
      .slice(0, n);
  }
}

/* ----------------------------------- mongo ---------------------------------- */

const MONGO_DB = "candleclimber";
const MONGO_COLL = "city_saves";

class CityMongoStore implements CitySaveStore {
  readonly kind = "mongo" as const;
  lastError: string | undefined;
  private coll: import("mongodb").Collection<CitySaveEntry> | null = null;
  private connecting: Promise<import("mongodb").Collection<CitySaveEntry> | null> | null = null;
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
        const coll = client.db(MONGO_DB).collection<CitySaveEntry>(MONGO_COLL);
        await coll.createIndex({ wallet: 1 }, { unique: true }); // one city per wallet
        await coll.createIndex({ cityLevel: -1, treasury: -1 });
        this.coll = coll;
        return coll;
      } catch (err) {
        const msg = (err as Error).message;
        console.error("[city-save] mongo unavailable, falling back to memory:", msg);
        this.lastError = msg;
        captureError(err, { lane: "city-save", op: "mongo-connect", store: this.kind });
        this.disabled = true;
        return null;
      }
    })();
    return this.connecting;
  }

  async put(entry: CitySaveEntry): Promise<number> {
    const coll = await this.connect();
    if (!coll) return 1;
    await coll.replaceOne({ wallet: entry.wallet }, { ...entry }, { upsert: true });
    const better = await coll.countDocuments({
      $or: [
        { cityLevel: { $gt: entry.cityLevel } },
        { cityLevel: entry.cityLevel, treasury: { $gt: entry.treasury } },
      ],
    });
    return better + 1;
  }

  async get(wallet: string): Promise<CitySaveEntry | null> {
    const coll = await this.connect();
    if (!coll) return null;
    return coll.findOne({ wallet });
  }

  async top(n: number): Promise<CitySaveEntry[]> {
    const coll = await this.connect();
    if (!coll) return [];
    return coll.find({}).sort({ cityLevel: -1, treasury: -1 }).limit(n).toArray();
  }
}

/* --------------------------------- singleton -------------------------------- */

let memoryFallback: CityMemoryStore | null = null;
let mongoStore: CityMongoStore | null = null;

export function getCityStore(): CitySaveStore {
  const url = process.env.DATABASE_URL ?? "";
  if (url.startsWith("mongodb://") || url.startsWith("mongodb+srv://")) {
    if (!mongoStore) mongoStore = new CityMongoStore();
    return mongoStore;
  }
  if (!memoryFallback) memoryFallback = new CityMemoryStore();
  return memoryFallback;
}

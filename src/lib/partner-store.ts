// Partner application store (PARTNER lane — council 2026-10-12).
// Mirrors ghost-store.ts exactly (which mirrors leaderboard-store.ts):
// - MemoryPartnerStore: default, zero-config. Resets on restart — fine for dev.
// - MongoPartnerStore: auto-activated when DATABASE_URL is a mongodb:// URI.
//   Applications are LEADS — they must outlive restarts, so mongo is the real
//   store in production; every failure falls back to memory gracefully.
//
// PII RULES: applications carry contact details (discord/twitter/email) that
// are PRIVATE BY DEFAULT. There is no public read route for this store in v0 —
// the only consumer is the curator review flow. Nothing here is ever rendered
// on a public page (public pages show the aggregate "pool" only, and v0's pool
// starts empty until the owner approves partners).

export type PartnerAppStatus = "pending" | "reviewed" | "approved" | "rejected";

export interface PartnerApplication {
  projectName: string;
  walletAddress: string; // the wallet that will hold $WICK (verification target)
  tokenContract?: string; // optional at apply time; a feed is required before listing
  communitySize: string; // "<100" | "100-1k" | "1k-10k" | "10k+"
  discord: string;
  twitter?: string;
  email: string;
  links?: string;
  message?: string;
  ts: number;
  status: PartnerAppStatus;
}

interface PartnerStore {
  readonly kind: "memory" | "mongo";
  add(app: PartnerApplication): Promise<void>;
  count(): Promise<number>;
}

/* ---------------------------------- memory --------------------------------- */

export class MemoryPartnerStore implements PartnerStore {
  readonly kind = "memory" as const;
  private apps: PartnerApplication[] = [];

  async add(app: PartnerApplication): Promise<void> {
    this.apps.push(app);
  }
  async count(): Promise<number> {
    return this.apps.length;
  }
}

/* ----------------------------------- mongo ---------------------------------- */

const MONGO_DB = "candleclimber";
const MONGO_COLL = "partner_applications";

class MongoPartnerStore implements PartnerStore {
  readonly kind = "mongo" as const;
  lastError: string | undefined;
  private coll: import("mongodb").Collection<PartnerApplication> | null = null;
  private connecting: Promise<import("mongodb").Collection<PartnerApplication> | null> | null = null;
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
        const coll = client.db(MONGO_DB).collection<PartnerApplication>(MONGO_COLL);
        await coll.createIndex({ ts: -1 });
        await coll.createIndex({ walletAddress: 1 });
        await coll.createIndex({ status: 1, ts: -1 });
        this.coll = coll;
        return coll;
      } catch (err) {
        const msg = (err as Error).message;
        console.error("[partners] mongo unavailable, falling back to memory:", msg);
        this.lastError = msg;
        this.disabled = true;
        return null;
      }
    })();
    return this.connecting;
  }

  async add(app: PartnerApplication): Promise<void> {
    const coll = await this.connect();
    if (!coll) return; // route falls back to memory store when null
    await coll.insertOne({ ...app });
  }
  async count(): Promise<number> {
    const coll = await this.connect();
    if (!coll) return 0;
    return coll.countDocuments({});
  }
}

/* --------------------------------- singleton -------------------------------- */

// Memoized exactly like getGhostStore() — a fresh store per request would mean
// a fresh MongoClient per request (Atlas M0 caps connections; AUDIT F3).
let memoryFallback: MemoryPartnerStore | null = null;
let mongoStore: MongoPartnerStore | null = null;

export function getPartnerStore(): PartnerStore {
  const url = process.env.DATABASE_URL ?? "";
  if (url.startsWith("mongodb://") || url.startsWith("mongodb+srv://")) {
    if (!mongoStore) mongoStore = new MongoPartnerStore();
    return mongoStore;
  }
  if (!memoryFallback) memoryFallback = new MemoryPartnerStore();
  return memoryFallback;
}

/* ------------------------------ sanitization -------------------------------- */

// Same strict-char-class philosophy as sanitizeRef (leaderboard-store).
const SAFE = /^[A-Za-z0-9 _.-]*$/;
const HEX_ADDR = /^0x[a-fA-F0-9]{40}$/;

export function sanitizePartnerField(raw: unknown, maxLen: number): string {
  if (typeof raw !== "string") return "";
  const trimmed = raw.trim().replace(/\s+/g, " ");
  if (!trimmed || trimmed.length > maxLen) return "";
  if (!SAFE.test(trimmed)) return ""; // reject control chars / angle brackets outright
  return trimmed;
}

export function sanitizeEmail(raw: unknown): string {
  if (typeof raw !== "string") return "";
  const t = raw.trim().toLowerCase();
  return /^[A-Za-z0-9._%+-]{1,64}@[A-Za-z0-9.-]{1,120}\.[A-Za-z]{2,14}$/.test(t) && t.length <= 200 ? t : "";
}

export function sanitizeHexAddress(raw: unknown): string {
  return typeof raw === "string" && HEX_ADDR.test(raw.trim()) ? raw.trim().toLowerCase() : "";
}

export const COMMUNITY_SIZES = ["<100", "100-1k", "1k-10k", "10k+"] as const;
export function sanitizeCommunitySize(raw: unknown): string {
  return typeof raw === "string" && (COMMUNITY_SIZES as readonly string[]).includes(raw) ? raw : "";
}

/** Build a store-ready application from raw body; returns null when required
 *  fields fail. Every string field is sanitized; optional fields may be "".
 *  The honeypot is handled by the route (silently), not here. */
export function buildPartnerApplication(body: Record<string, unknown>): PartnerApplication | null {
  const projectName = sanitizePartnerField(body.projectName, 60);
  const walletAddress = sanitizeHexAddress(body.walletAddress);
  const communitySize = sanitizeCommunitySize(body.communitySize);
  const discord = sanitizePartnerField(body.discord, 60);
  const email = sanitizeEmail(body.email);
  if (!projectName || !walletAddress || !communitySize || !discord || !email) return null;
  const tokenContract = sanitizeHexAddress(body.tokenContract);
  const twitter = sanitizePartnerField(body.twitter, 60);
  const links = sanitizePartnerField(body.links, 200);
  const message = sanitizePartnerField(body.message, 1000);
  return {
    projectName,
    walletAddress,
    tokenContract: tokenContract || undefined,
    communitySize,
    discord,
    twitter: twitter || undefined,
    email,
    links: links || undefined,
    message: message || undefined,
    ts: Date.now(),
    status: "pending",
  };
}

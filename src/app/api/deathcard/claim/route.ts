// /api/deathcard/claim — Death Card NFT mint (TESTNET), architecture B:
// the SERVER minter submits the tx and pays testnet gas; the user pays nothing
// and only proves wallet ownership (personal_sign) + run authenticity (runToken).
// docs/DEATHCARD-NFT-TESTNET-NOTE.md §0.1 — contract 0x3e27…0c64, chainId 46630.
//
// Gates, in order (fail honestly, never half-truths):
//   1. shape + clamps           validateMintBody (mirrors board-validation)
//   2. run token                HMAC-verified, not stale (verifyRunToken)
//   3. TODAY-ONLY               tok.date === utcDateStr() — server-enforced
//                               archive/practice exclusion (a past-date token
//                               is indistinguishable from an archive replay,
//                               so the honest rule is: today's runs only)
//   4. ownership proof          verifyMintProof — purpose-separated EIP-191
//                               message (buildMintProofMessage), 10-min window
//   5. idempotency              runKey unique (Mongo index / per-instance map)
//                               + on-chain mintedByRun (final authority)
//   6. per-wallet daily cap     MINTS_PER_WALLET_PER_DAY distinct runs/day
//   7. minter tx                nonce-mutexed, gasPrice×2, estimate+20%,
//                               poll ≤ MINT_POLL_MS → pending fallback
//
// GET ?txHash=0x… — stateless receipt poll for "pending" answers.
import { NextResponse } from "next/server";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  MINTS_PER_WALLET_PER_DAY,
  MINT_POLL_MS,
  buildDeathCardMetadata,
  decodeMintedTokenId,
  deriveRunKey,
  explorerTxUrl,
  runKeyHex,
  validateMintBody,
  type ReceiptLike,
} from "@/lib/deathcard-claim";
import { verifyRunToken, isTokenStale, type RunTokenPayload } from "@/lib/run-token";
import { verifyMintProof } from "@/lib/wallet-proof";
import { captureError } from "@/lib/telemetry";
import { utcDateStr } from "@/game/cc/rng";
import { deriveAddress, encodeMintCalldata, hexQuantityToBytes, bytesToBigint, hexToBytes, signLegacyTx } from "@/lib/eth-tx";

const RPC = "https://rpc.testnet.chain.robinhood.com";
const CHAIN_ID = 46630;
const CONTRACT = (
  JSON.parse(readFileSync(join(process.cwd(), "src/lib/deathcard/address.json"), "utf8")) as { address: string }
).address.toLowerCase();

/* per-IP rate limit: 10 mint requests / minute / instance */
const hits = new Map<string, number[]>();
function rateLimited(ip: string): boolean {
  const now = Date.now();
  const arr = (hits.get(ip) ?? []).filter((t) => now - t < 60_000);
  if (arr.length >= 10) return true;
  arr.push(now);
  hits.set(ip, arr);
  if (hits.size > 5000) hits.clear();
  return false;
}

// --------------------------------------------------------------- mint record

interface MintDoc {
  runKey: string; // 0x…32 bytes — unique
  wallet: string;
  symbol: string;
  date: string; // token date (== UTC today at claim time)
  interval: string;
  score: number;
  candlesPassed: number;
  bestStreak: number;
  txHash: string;
  tokenId: number | null;
  status: "pending" | "mined" | "failed";
  ts: number;
}

type Store = {
  kind: "memory" | "mongo";
  find(runKey: string): Promise<MintDoc | null>;
  insert(doc: MintDoc): Promise<void>; // throws on duplicate runKey
  mark(runKey: string, patch: Partial<MintDoc>): Promise<void>;
  countWalletDay(wallet: string, date: string): Promise<number>;
  lastError?: string;
};

/* memory store — dev/preview fallback; idempotency is per-instance only
   (the on-chain mintedByRun mapping remains the final authority either way) */
const memRows = new Map<string, MintDoc>();
const memoryStore: Store = {
  kind: "memory",
  async find(runKey) {
    return memRows.get(runKey) ?? null;
  },
  async insert(doc) {
    if (memRows.has(doc.runKey)) throw new Error("duplicate runKey");
    memRows.set(doc.runKey, doc);
  },
  async mark(runKey, patch) {
    const d = memRows.get(runKey);
    if (d) Object.assign(d, patch);
  },
  async countWalletDay(wallet, date) {
    return [...memRows.values()].filter((d) => d.wallet === wallet && d.date === date).length;
  },
};

/* mongo store — auto-activated when DATABASE_URL is a mongo URI (same
   convention as the leaderboard store; failures degrade, never throw) */
class DeathMongoStore implements Store {
  readonly kind = "mongo" as const;
  lastError: string | undefined;
  private coll: import("mongodb").Collection<MintDoc> | null = null;
  private connecting: Promise<import("mongodb").Collection<MintDoc> | null> | null = null;
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
        const coll = client.db("candleclimber").collection<MintDoc>("deathmints");
        await coll.createIndex({ runKey: 1 }, { unique: true });
        await coll.createIndex({ wallet: 1, date: 1 });
        this.coll = coll;
        return coll;
      } catch (err) {
        this.lastError = (err as Error).message;
        console.error("[deathcard] mongo unavailable, falling back to memory:", this.lastError);
        captureError(err as Error, { path: "deathcard/claim:mongo-connect" });
        this.disabled = true;
        return null;
      } finally {
        this.connecting = null;
      }
    })();
    return this.connecting;
  }

  async find(runKey: string) {
    const c = await this.connect();
    if (!c) return memoryStore.find(runKey);
    return (await c.findOne({ runKey })) ?? null;
  }
  async insert(doc: MintDoc) {
    const c = await this.connect();
    if (!c) return memoryStore.insert(doc);
    try {
      await c.insertOne({ ...doc });
    } catch (err) {
      // duplicate runKey (E11000) surfaces as a claim re-run — rethrow so the
      // caller re-reads the original doc; other failures degrade to memory
      if ((err as { code?: number }).code === 11000) throw err;
      this.lastError = (err as Error).message;
      return memoryStore.insert(doc);
    }
  }
  async mark(runKey: string, patch: Partial<MintDoc>) {
    const c = await this.connect();
    if (!c) return memoryStore.mark(runKey, patch);
    try {
      await c.updateOne({ runKey }, { $set: patch });
    } catch (err) {
      this.lastError = (err as Error).message;
      return memoryStore.mark(runKey, patch);
    }
  }
  async countWalletDay(wallet: string, date: string) {
    const c = await this.connect();
    if (!c) return memoryStore.countWalletDay(wallet, date);
    try {
      return await c.countDocuments({ wallet, date });
    } catch (err) {
      this.lastError = (err as Error).message;
      return memoryStore.countWalletDay(wallet, date);
    }
  }
}

function getStore(): Store {
  const url = process.env.DATABASE_URL ?? "";
  return /^mongodb(\+srv)?:\/\//.test(url) ? new DeathMongoStore() : memoryStore;
}

// --------------------------------------------------------------- minter key

function loadMinterKey(): Uint8Array | null {
  const env = process.env.MINTER_KEY?.trim().replace(/^0x/, "");
  if (env && /^[0-9a-fA-F]{64}$/.test(env)) return hexToBytes("0x" + env);
  try {
    const raw = readFileSync(process.env.HOME + "/.cc-minter-key", "utf8").trim().replace(/^0x/, "");
    return /^[0-9a-f]{64}$/.test(raw) ? hexToBytes("0x" + raw) : null;
  } catch {
    return null;
  }
}

// ------------------------------------------------------------------ RPC I/O

let reqId = 0;
async function rpc<T = unknown>(method: string, params: unknown[] = [], tries = 3): Promise<T> {
  for (let i = 0; i < tries; i++) {
    try {
      const res = await fetch(RPC, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jsonrpc: "2.0", id: ++reqId, method, params }),
        signal: AbortSignal.timeout(15_000),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const j = (await res.json()) as { result?: T; error?: { message: string } };
      if (j.error) throw new Error(`RPC ${method}: ${j.error.message}`);
      return j.result as T;
    } catch (e) {
      if (i === tries - 1) throw e;
      await new Promise((r) => setTimeout(r, 800 * (i + 1)));
    }
  }
  throw new Error("unreachable");
}

/* one mint at a time per instance — the minter EOA's nonce is sequential */
let mintChain: Promise<unknown> = Promise.resolve();

async function sendMintTx(
  key: Uint8Array,
  minter: string,
  to: string,
  runKey: Uint8Array,
  metadata: string,
): Promise<{ txHash: string; receipt: ReceiptLike | null }> {
  const data = encodeMintCalldata(to, runKey, metadata);
  // serialize: nonce contention on the shared EOA is the one thing that can
  // silently brick a second mint — chain every send behind the previous one
  const run = mintChain.then(async () => {
    const nonce = bytesToBigint(
      hexQuantityToBytes((await rpc<string>("eth_getTransactionCount", [minter, "pending"])) as string),
    );
    const gasPrice = bytesToBigint(hexQuantityToBytes((await rpc<string>("eth_gasPrice")) as string)) * 2n;
    let gas = 300_000n; // mint ≈ 130k; headroom for a bigger metadata blob
    try {
      const est = await rpc<string>("eth_estimateGas", [{ from: minter, to: CONTRACT, data }]);
      gas = bytesToBigint(hexQuantityToBytes(est));
      gas = (gas * 120n) / 100n;
    } catch {
      /* fallback stands */
    }
    const tx = signLegacyTx({ nonce, gasPrice, gas, to: CONTRACT, value: 0n, data, chainId: CHAIN_ID }, key);
    const hash = (await rpc<string>("eth_sendRawTransaction", [tx.rawHex])) as string;
    return hash;
  });
  mintChain = run.catch(() => {}); // keep the chain alive after a failure
  const txHash = await run;

  // poll for the receipt inside the request window; beyond it → "pending"
  const deadline = Date.now() + MINT_POLL_MS;
  while (Date.now() < deadline) {
    await new Promise((r) => setTimeout(r, 1200));
    const receipt = await rpc<ReceiptLike | null>("eth_getTransactionReceipt", [txHash]);
    if (receipt) return { txHash, receipt };
  }
  return { txHash, receipt: null };
}

// -------------------------------------------------------------------- POST

export async function POST(req: Request) {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "local";
  if (rateLimited(ip)) {
    return NextResponse.json({ error: "slow down" }, { status: 429 });
  }

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "bad request" }, { status: 400 });
  }

  // 1 — shape + clamps
  const shape = validateMintBody(body);
  if (!shape.ok) {
    return NextResponse.json({ error: shape.error }, { status: shape.status });
  }

  // 2 — run token (same HMAC the leaderboard trusts)
  const tok: RunTokenPayload | null = verifyRunToken(body.runToken);
  if (!tok) {
    return NextResponse.json({ error: "invalid run token" }, { status: 403 });
  }
  if (isTokenStale(tok.date)) {
    return NextResponse.json({ error: "run token expired" }, { status: 403 });
  }

  // 3 — TODAY-ONLY: a past-date token is byte-identical to an archive replay's
  // token, so the only honest server rule is "today's runs mint, period".
  const today = utcDateStr();
  if (tok.date !== today) {
    return NextResponse.json(
      {
        error: "only today's runs are mintable",
        note: "archive/practice runs are not mintable — this is enforced server-side, not just hidden in the UI",
      },
      { status: 403 },
    );
  }

  // 4 — ownership proof (purpose-separated mint message)
  const verdict = verifyMintProof(
    shape.address,
    shape.signature,
    {
      score: shape.score,
      candlesPassed: shape.candlesPassed,
      bestStreak: shape.bestStreak,
      date: tok.date,
      interval: tok.interval,
      wallet: shape.address,
    },
    shape.ts,
    Date.now(),
  );
  if (!verdict.ok) {
    return NextResponse.json({ error: `mint proof rejected (${verdict.reason})` }, { status: 403 });
  }

  // 5 — idempotency: deterministic run key
  const runKey = deriveRunKey(shape.address, tok, {
    score: shape.score,
    candlesPassed: shape.candlesPassed,
    bestStreak: shape.bestStreak,
  });
  const rkHex = runKeyHex(runKey);

  const store = getStore();
  try {
    const existing = await store.find(rkHex);
    if (existing) {
      return NextResponse.json({
        ok: true,
        already: true,
        status: existing.status,
        txHash: existing.txHash,
        ...(existing.tokenId != null ? { tokenId: existing.tokenId } : {}),
        ...(existing.status === "mined" ? { explorerUrl: explorerTxUrl(existing.txHash) } : {}),
        store: store.kind,
      });
    }

    // 6 — per-wallet daily cap (distinct-run mints today)
    const mintedToday = await store.countWalletDay(shape.address, today);
    if (mintedToday >= MINTS_PER_WALLET_PER_DAY) {
      return NextResponse.json(
        { error: `daily mint limit reached (${MINTS_PER_WALLET_PER_DAY} cards per day)` },
        { status: 429 },
      );
    }

    // 7 — the minter tx
    const key = loadMinterKey();
    if (!key) {
      return NextResponse.json(
        { error: "minter not configured", note: "the server cannot reach the minter key — minting is down, play is unaffected" },
        { status: 503 },
      );
    }
    const minter = deriveAddress(key);
    const bal = bytesToBigint(
      hexQuantityToBytes((await rpc<string>("eth_getBalance", [minter, "latest"])) as string),
    );
    if (bal === 0n) {
      captureError(new Error("deathcard minter unfunded"), { path: "deathcard/claim", minter });
      return NextResponse.json(
        { error: "minter unfunded", note: "the testnet gas tank is empty — minting pauses honestly until it is refilled" },
        { status: 503 },
      );
    }

    const metadata = buildDeathCardMetadata({
      symbol: tok.symbol,
      date: tok.date,
      interval: tok.interval,
      score: shape.score,
      candlesPassed: shape.candlesPassed,
      bestStreak: shape.bestStreak,
      mintedAt: new Date().toISOString(),
    });

    let txHash: string;
    let receipt: ReceiptLike | null;
    try {
      ({ txHash, receipt } = await sendMintTx(key, minter, shape.address, runKey, metadata));
    } catch (err) {
      captureError(err as Error, { path: "deathcard/claim:tx", runKey: rkHex });
      const msg = (err as Error).message || "";
      const honest = msg.includes("RUN_MINTED")
        ? "this run already minted a card (on-chain)"
        : "the mint transaction was rejected by the chain";
      return NextResponse.json({ error: honest }, { status: 502 });
    }

    const tokenId = receipt ? decodeMintedTokenId(receipt, CONTRACT) : null;
    const status: MintDoc["status"] = receipt ? (receipt.status === "0x1" ? "mined" : "failed") : "pending";
    await store.insert({
      runKey: rkHex,
      wallet: shape.address,
      symbol: tok.symbol,
      date: tok.date,
      interval: tok.interval,
      score: shape.score,
      candlesPassed: shape.candlesPassed,
      bestStreak: shape.bestStreak,
      txHash,
      tokenId,
      status,
      ts: Date.now(),
    });

    if (status === "failed") {
      return NextResponse.json({ error: "mint failed on-chain", txHash }, { status: 502 });
    }

    return NextResponse.json({
      ok: true,
      status,
      txHash,
      ...(tokenId != null ? { tokenId } : {}),
      ...(status === "mined" ? { explorerUrl: explorerTxUrl(txHash) } : {}),
      contract: CONTRACT,
      store: store.kind,
      ...(store.lastError ? { dbError: store.lastError } : {}),
    });
  } catch (err) {
    // duplicate runKey raced through insert — re-read and answer idempotently
    if ((err as { code?: number }).code === 11000 || /duplicate runKey/.test((err as Error).message)) {
      const existing = await store.find(rkHex);
      if (existing) {
        return NextResponse.json({
          ok: true,
          already: true,
          status: existing.status,
          txHash: existing.txHash,
          ...(existing.tokenId != null ? { tokenId: existing.tokenId } : {}),
          store: store.kind,
        });
      }
    }
    captureError(err as Error, { path: "deathcard/claim", runKey: rkHex });
    return NextResponse.json({ error: "claim failed — try again" }, { status: 500 });
  }
}

// --------------------------------------------------------------------- GET

/** Stateless pending-mint poll: GET ?txHash=0x… → receipt-derived status. */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const txHash = searchParams.get("txHash") ?? "";
  if (!/^0x[0-9a-fA-F]{64}$/.test(txHash)) {
    return NextResponse.json({ error: "invalid txHash" }, { status: 400 });
  }
  try {
    const receipt = await rpc<ReceiptLike | null>("eth_getTransactionReceipt", [txHash]);
    if (!receipt) {
      return NextResponse.json({ status: "pending", txHash });
    }
    if (receipt.status !== "0x1") {
      return NextResponse.json({ status: "failed", txHash });
    }
    const tokenId = decodeMintedTokenId(receipt, CONTRACT);
    return NextResponse.json({
      status: "mined",
      txHash,
      ...(tokenId != null ? { tokenId } : {}),
      explorerUrl: explorerTxUrl(txHash),
    });
  } catch (err) {
    captureError(err as Error, { path: "deathcard/claim:get", txHash });
    return NextResponse.json({ error: "status check failed" }, { status: 502 });
  }
}

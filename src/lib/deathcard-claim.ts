// Death Card claim — PURE CORE (server-side, architecture B / server minter).
// Everything that can be pinned by unit tests lives here; the route only wires
// I/O (RPC, Mongo, key file) around these functions.
//
// Honesty laws carried over from the death-card design (docs/DEATHCARD-NFT-TESTNET-NOTE.md):
// - metadata = the run's OWN facts only (ticker, terrain date, timeframe, peak
//   height, candles, streak). Nothing invented, no scarcity/utility language.
// - archive/practice exclusion is SERVER-enforced (today-only rule) — the
//   client gate alone is never trusted.
// - idempotent mint-once per run key: derived deterministically from the run's
//   canonical facts + claiming wallet, enforced on-chain (mintedByRun) AND
//   server-side (unique index).
// - testnet-only framing: zero monetary value, the point is proving the loop.
import { keccak_256 } from "@noble/hashes/sha3.js";
import { bytesToHex } from "@/lib/eth-tx";
import type { RunTokenPayload } from "@/lib/run-token";

/** One wallet can mint at most this many DISTINCT-run cards per UTC day.
 *  Anti gas-drain bound for the shared minter balance — distinct runs only
 *  (runKey uniqueness applies on top). */
export const MINTS_PER_WALLET_PER_DAY = 3;

/** How long the POST route waits for a receipt before answering "pending". */
export const MINT_POLL_MS = 24_000;

/** Deterministic ERC-721 run key — keccak256 over the canonical fact line.
 *  Same facts + same wallet ⇒ same key ⇒ on-chain mint-once; any changed
 *  field ⇒ a new, mintable run. Wallet case is normalized away. */
export function deriveRunKey(
  wallet: string,
  tok: Pick<RunTokenPayload, "symbol" | "date" | "interval">,
  facts: { score: number; candlesPassed: number; bestStreak: number },
): Uint8Array {
  const line = [
    "ccdc-v1",
    wallet.toLowerCase(),
    tok.symbol,
    tok.date,
    tok.interval,
    Math.floor(Number(facts.score)),
    Math.floor(Number(facts.candlesPassed)),
    Math.max(0, Math.min(999, Math.floor(Number(facts.bestStreak)))),
  ].join("|");
  return keccak_256(new TextEncoder().encode(line));
}

export function runKeyHex(runKey: Uint8Array): string {
  return "0x" + bytesToHex(runKey);
}

/** The contract stores the string verbatim and tokenURI() returns it — a
 *  proper data-URI keeps indexers/wallets happy without any external host. */
export function buildDeathCardMetadata(o: {
  symbol: string;
  date: string;
  interval: string;
  score: number;
  candlesPassed: number;
  bestStreak: number;
  mintedAt: string; // ISO — the only non-run fact, recorded at mint time
}): string {
  const json = JSON.stringify({
    name: `Death Card — ${o.symbol} ${o.date}`,
    description:
      "Candle Climber Death Card (Robinhood Chain TESTNET demo). Proves one real run on the chart — has no monetary value.",
    attributes: [
      { trait_type: "Ticker", value: o.symbol },
      { trait_type: "Terrain", value: o.date },
      { trait_type: "Timeframe", value: o.interval },
      { trait_type: "Peak Height", value: Math.floor(Number(o.score)) },
      { trait_type: "Candles", value: Math.floor(Number(o.candlesPassed)) },
      { trait_type: "Best Streak", value: Math.max(0, Math.min(999, Math.floor(Number(o.bestStreak)))) },
      { trait_type: "Minted", value: o.mintedAt },
    ],
  });
  return "data:application/json;base64," + Buffer.from(json, "utf8").toString("base64");
}

/** Decode a mint data-URI back to its JSON (tests + diagnostics). */
export function decodeDeathCardMetadata(uri: string): Record<string, unknown> {
  const m = /^data:application\/json;base64,(.+)$/.exec(uri);
  if (!m) throw new Error("not a death-card data URI");
  return JSON.parse(Buffer.from(m[1], "base64").toString("utf8")) as Record<string, unknown>;
}

// ------------------------------------------------------------- request shape

export interface MintBodyOk {
  ok: true;
  score: number;
  candlesPassed: number;
  bestStreak: number;
  address: string;
  signature: string;
  ts: number;
}

/** Shape + clamp gate BEFORE any crypto — mirrors board-validation's clamps
 *  (Math.floor score/candles, 0..999 streak) so the proof message the client
 *  signed and the values the server clamps are always the same bytes. */
export function validateMintBody(body: Record<string, unknown>): { ok: false; error: string; status: number } | MintBodyOk {
  const address = typeof body.address === "string" ? body.address.trim().toLowerCase() : "";
  if (!/^0x[0-9a-f]{40}$/.test(address)) {
    return { ok: false, error: "invalid wallet address", status: 400 };
  }
  const signature = typeof body.signature === "string" ? body.signature : "";
  if (!/^0x[0-9a-fA-F]{130}$/.test(signature)) {
    return { ok: false, error: "invalid signature", status: 400 };
  }
  if (typeof body.ts !== "number" || !Number.isInteger(body.ts)) {
    return { ok: false, error: "invalid timestamp", status: 400 };
  }
  const score = Math.floor(Number(body.score));
  const candlesPassed = Math.floor(Number(body.candlesPassed));
  const bestStreak = Math.max(0, Math.min(999, Math.floor(Number(body.bestStreak ?? 0))));
  if (!Number.isFinite(score) || score < 0 || score > 10_000_000) {
    return { ok: false, error: "invalid score", status: 400 };
  }
  if (!Number.isFinite(candlesPassed) || candlesPassed < 0 || candlesPassed > 5000) {
    return { ok: false, error: "invalid candles", status: 400 };
  }
  return { ok: true, score, candlesPassed, bestStreak, address, signature, ts: body.ts };
}

// ------------------------------------------------------------ receipt decode

const TRANSFER_TOPIC = () => {
  // keccak256("Transfer(address,address,uint256)") — computed lazily, cached
  let t: string | null = null;
  return () => {
    if (!t) {
      t = "0x" + bytesToHex(keccak_256(new TextEncoder().encode("Transfer(address,address,uint256)")));
    }
    return t;
  };
};
const transferTopic = TRANSFER_TOPIC();

export interface ReceiptLike {
  status?: string;
  logs?: Array<{ address?: string; topics?: string[] }>;
}

/** tokenId = the last indexed word of the contract's mint Transfer log. */
export function decodeMintedTokenId(receipt: ReceiptLike, contract: string): number | null {
  if (receipt.status !== "0x1" || !Array.isArray(receipt.logs)) return null;
  const c = contract.toLowerCase();
  const topic = transferTopic();
  for (const log of receipt.logs) {
    if ((log.address ?? "").toLowerCase() !== c) continue;
    if (log.topics?.[0] !== topic) continue;
    const t = log.topics[3];
    if (!/^0x[0-9a-f]{64}$/.test(t)) continue;
    const id = Number(BigInt(t));
    return Number.isFinite(id) ? id : null;
  }
  return null;
}

/** Explorer URL for a transaction (verified host — used by route + client). */
export function explorerTxUrl(txHash: string): string {
  return `https://explorer.testnet.chain.robinhood.com/tx/${txHash}`;
}

// Official Robinhood Chain connection (workstream W6) — reads the CANONICAL
// on-chain stock data published by Robinhood Chain itself.
//
// WHY THIS FILE EXISTS (honesty law, see docs/FEEDS.md):
// - The ONLY official, machine-readable stock price on Robinhood Chain is the
//   per-ticker Chainlink price feed (AggregatorV3Interface), reachable over the
//   chain's PUBLIC JSON-RPC with no key. There is NO official on-chain OHLC
//   history, so this module provides a verified SPOT PRICE — never a fabricated
//   candle series. Anything built on top of it is labeled DERIVED.
// - Testnet Stock Tokens (chain 46630, faucet) are REAL ERC-20s, but they are
//   NOT the mainnet Robinhood Stock Tokens and their price feeds are MOCK (the
//   production Chainlink feeds exist on mainnet only). Feed prices therefore
//   come from MAINNET (chain 4663); testnet reads are used only to prove token
//   identity — never as a price source.
// - Zero new dependencies: plain JSON-RPC fetch, same pattern as src/lib/wallet.ts.
//
// Sources of truth (re-verified live 2026-10-07, see
// docs/ROBINHOOD-CHAIN-INTEGRATION.md for the raw eth_call evidence):
//   networks   https://docs.robinhood.com/chain/connecting
//   contracts  https://docs.robinhood.com/chain/contracts
//   feeds      https://docs.chain.link/data-feeds/tokenized-equity-feeds/robinhood
//   directory  https://reference-data-directory.vercel.app/feeds-robinhood-mainnet.json

export interface RobinhoodNetwork {
  name: string;
  chainId: number;
  rpc: string;
  explorer: string;
}

// Public and keyless by default. The optional overrides exist only to survive
// provider rate limits — a keyed provider URL is a secret, so it is read from
// the environment and never committed (see .env.example).
export const ROBINHOOD_MAINNET: RobinhoodNetwork = {
  name: "Robinhood Chain",
  chainId: 4663,
  rpc: process.env.ROBINHOOD_MAINNET_RPC || "https://rpc.mainnet.chain.robinhood.com",
  explorer: "https://robinhoodchain.blockscout.com",
};

export const ROBINHOOD_TESTNET: RobinhoodNetwork = {
  name: "Robinhood Chain Testnet",
  chainId: 46630,
  rpc: process.env.ROBINHOOD_TESTNET_RPC || "https://rpc.testnet.chain.robinhood.com",
  explorer: "https://explorer.testnet.chain.robinhood.com",
};

/** Official Chainlink reference-data directory for Robinhood Chain mainnet.
 *  The docs say "always read addresses from there rather than hardcoding them",
 *  so this is the primary resolver; the snapshot below is only a cache miss
 *  fallback (and the offline/test path). */
export const CHAINLINK_DIRECTORY_URL =
  "https://reference-data-directory.vercel.app/feeds-robinhood-mainnet.json";

/** Verified snapshot of the mainnet Chainlink stock feeds (2026-10-07), used
 *  when the directory is unreachable and in tests. Every entry was read live
 *  from chain 4663 — see the integration doc for the captured answers. */
export const VERIFIED_STOCK_FEEDS: Record<string, string> = {
  TSLA: "0x7A6b81ba7FbCB90104d8C496158Cf383cD7233b1",
  AMZN: "0x93503dFc97157cdB8aADcCaf70452621d598FDeb",
  NVDA: "0xC9d16E4f2569b9E3ea0468fD85844953713DC2a2",
  AAPL: "0xBb11A21267cFDb63d4935d99a499133DD1744ACb",
  MSFT: "0xc3b117F52cf17Dd4369eaF5eaf7cF0E2f91b4E30",
  SPY: "0x78BCB218fA04B9b3a278eBc865Ed320BF8DEFBAc",
};

/** Testnet faucet Stock Tokens (chain 46630). REAL ERC-20s you can claim from
 *  faucet.testnet.chain.robinhood.com — deliberately a DIFFERENT contract set
 *  from the mainnet Robinhood Stock Tokens above, with MOCK feeds. Identity
 *  only: never priced. */
export const TESTNET_FAUCET_TOKENS: Record<string, string> = {
  TSLA: "0xC9f9c86933092BbbfFF3CCb4b105A4A94bf3Bd4E",
  AMZN: "0x5884aD2f920c162CFBbACc88C9C51AA75eC09E02",
  NFLX: "0x3b8262A63d25f0477c4DDE23F83cfe22Cb768C93",
};

// Function selectors (keccak-256, first 4 bytes). Well-known constants — no
// hashing dependency is needed for these read-only views.
const SEL_LATEST_ROUND_DATA = "0xfeaf968c"; // latestRoundData()
const SEL_DECIMALS = "0x313ce567"; // decimals()
const SEL_SYMBOL = "0x95d89b41"; // symbol()

/** Mainnet stock feeds update 24/5 and hold their last value while the equity
 *  market is closed (weekends/holidays), so staleness is judged generously:
 *  a long market closure must not be mistaken for a dead feed. */
export const MAX_QUOTE_AGE_SEC = 7 * 24 * 60 * 60;

export interface RoundData {
  roundId: bigint;
  answer: bigint;
  startedAt: number;
  updatedAt: number;
}

export interface OfficialStockQuote {
  symbol: string;
  feed: string;
  chainId: number;
  price: number; // USD, decimal-adjusted (feed already includes the multiplier)
  raw: string; // raw int256 answer, as decimal string
  decimals: number; // feed decimals (read on-chain, never assumed)
  updatedAt: number; // unix seconds
  ageSec: number;
  stale: boolean;
  roundId: string;
  feedSource: "directory" | "snapshot";
}

/* ------------------------------ pure decoders ------------------------------ */

/** The i-th 32-byte word of an ABI-encoded hex payload (0x-prefixed). */
export function wordAt(hex: string, i: number): string | null {
  const body = hex.startsWith("0x") ? hex.slice(2) : hex;
  const word = body.slice(i * 64, (i + 1) * 64);
  return word.length === 64 ? word : null;
}

function bigintFromWord(word: string): bigint {
  return BigInt("0x" + word);
}

/** Two's-complement decode of an int256 word. */
export function decodeInt256(word: string): bigint {
  const v = bigintFromWord(word);
  return v >= 1n << 255n ? v - (1n << 256n) : v;
}

export function decodeUint(word: string): bigint {
  return bigintFromWord(word);
}

/** `latestRoundData()` → 5 words: roundId, answer, startedAt, updatedAt,
 *  answeredInRound. Returns null on any malformed payload (never throws). */
export function decodeLatestRoundData(hex: string): RoundData | null {
  const w0 = wordAt(hex, 0);
  const w1 = wordAt(hex, 1);
  const w3 = wordAt(hex, 3);
  if (!w0 || !w1 || !w3) return null;
  return {
    roundId: decodeUint(w0),
    answer: decodeInt256(w1),
    startedAt: Number(decodeUint(wordAt(hex, 2) as string)),
    updatedAt: Number(decodeUint(w3)),
  };
}

/** `decimals()` → uint8. Returns null when out of range or malformed. */
export function decodeDecimals(hex: string): number | null {
  const w = wordAt(hex, 0);
  if (!w) return null;
  const v = Number(decodeUint(w));
  return Number.isInteger(v) && v >= 0 && v <= 36 ? v : null;
}

/** ABI `string` return (offset word + length word + data). */
export function decodeAbiString(hex: string): string | null {
  const off = wordAt(hex, 0);
  const len = wordAt(hex, 1);
  if (!off || !len) return null;
  const length = Number(decodeUint(len));
  if (!Number.isInteger(length) || length < 0 || length > 256) return null;
  const body = hex.startsWith("0x") ? hex.slice(2) : hex;
  const data = body.slice(128, 128 + length * 2);
  if (data.length !== length * 2) return null;
  const bytes = data.match(/.{2}/g) ?? [];
  const text = bytes
    .map((b) => String.fromCharCode(parseInt(b, 16)))
    .join("")
    .replace(/\0+$/, "");
  return text.length ? text : null;
}

/** Scale a raw feed answer into a human price. The feed is already
 *  multiplier-adjusted, so no further scaling is applied. */
export function priceFromAnswer(answer: bigint, decimals: number): number {
  return Number(answer) / 10 ** decimals;
}

/** The honesty gate: a quote is usable only if the chain is the expected one,
 *  the answer is positive, the round is complete, and it is not older than the
 *  staleness bound. A stale or invalid feed yields "unavailable", never a
 *  silent zero. */
export function validateRoundData(
  rd: RoundData,
  opts: { expectedChainId: number; chainId: number; now?: number; maxAgeSec?: number },
): { ok: true; ageSec: number; stale: boolean } | { ok: false; reason: string } {
  if (opts.chainId !== opts.expectedChainId) {
    return { ok: false, reason: `chain mismatch: got ${opts.chainId}, expected ${opts.expectedChainId}` };
  }
  if (rd.answer <= 0n) return { ok: false, reason: "non-positive answer" };
  if (rd.updatedAt <= 0) return { ok: false, reason: "incomplete round" };
  const now = opts.now ?? Math.floor(Date.now() / 1000);
  const ageSec = now - rd.updatedAt;
  if (ageSec < -300) return { ok: false, reason: "future timestamp" };
  const maxAge = opts.maxAgeSec ?? MAX_QUOTE_AGE_SEC;
  return { ok: true, ageSec, stale: ageSec > maxAge };
}

/* ---------------------------- official feed lookup --------------------------- */

/** The ticker a Chainlink directory entry refers to ("Robinhood TSLA / USD" or
 *  "Robinhood SGOV-USD" → "TSLA"/"SGOV"). */
export function feedSymbolFromName(name: string): string | null {
  if (!name.startsWith("Robinhood ")) return null;
  const rest = name.slice("Robinhood ".length);
  const m = rest.match(/^([A-Z0-9.]+)\s*(?:\/ USD|-USD)$/);
  return m ? m[1] : null;
}

interface DirectoryCache {
  at: number;
  feeds: Record<string, string>;
}
let directoryCache: DirectoryCache | null = null;
const DIRECTORY_TTL_MS = 6 * 60 * 60 * 1000;

async function loadDirectory(timeoutMs = 8000): Promise<Record<string, string> | null> {
  if (directoryCache && Date.now() - directoryCache.at < DIRECTORY_TTL_MS) {
    return directoryCache.feeds;
  }
  try {
    const res = await fetch(CHAINLINK_DIRECTORY_URL, {
      cache: "no-store",
      signal: AbortSignal.timeout(timeoutMs),
    });
    if (!res.ok) return null;
    const rows: unknown = await res.json();
    if (!Array.isArray(rows)) return null;
    const feeds: Record<string, string> = {};
    for (const row of rows) {
      if (!row || typeof row !== "object") continue;
      const r = row as { name?: unknown; contractAddress?: unknown };
      if (typeof r.name !== "string" || typeof r.contractAddress !== "string") continue;
      const sym = feedSymbolFromName(r.name);
      if (sym && !feeds[sym]) feeds[sym] = r.contractAddress;
    }
    if (Object.keys(feeds).length === 0) return null;
    directoryCache = { at: Date.now(), feeds };
    return feeds;
  } catch {
    return null;
  }
}

/** Resolve a ticker's official mainnet Chainlink feed proxy. Directory first
 *  (the docs' source of truth), verified snapshot as fallback. */
export async function resolveOfficialFeed(
  symbol: string,
): Promise<{ feed: string; source: "directory" | "snapshot" } | null> {
  const sym = symbol.toUpperCase();
  const dir = await loadDirectory();
  if (dir?.[sym]) return { feed: dir[sym], source: "directory" };
  const snap = VERIFIED_STOCK_FEEDS[sym];
  return snap ? { feed: snap, source: "snapshot" } : null;
}

/* ---------------------------------- RPC ----------------------------------- */

async function rpcEthCall(rpcUrl: string, to: string, data: string, timeoutMs: number): Promise<string | null> {
  try {
    const res = await fetch(rpcUrl, {
      method: "POST",
      headers: { "content-type": "application/json" },
      cache: "no-store",
      signal: AbortSignal.timeout(timeoutMs),
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "eth_call",
        params: [{ to, data }, "latest"],
      }),
    });
    if (!res.ok) return null;
    const body = (await res.json()) as { result?: unknown; error?: unknown };
    if (typeof body.result !== "string" || body.error) return null;
    return body.result;
  } catch {
    return null;
  }
}

/** Read the official per-ticker price from Robinhood Chain mainnet. Returns
 *  null when the feed is unknown, unreachable, or fails validation — callers
 *  must degrade, never invent a price. */
export async function readOfficialQuote(
  symbol: string,
  opts: { timeoutMs?: number; now?: number } = {},
): Promise<OfficialStockQuote | null> {
  const resolved = await resolveOfficialFeed(symbol);
  if (!resolved) return null;
  const timeoutMs = opts.timeoutMs ?? 8000;

  const [roundHex, decHex] = await Promise.all([
    rpcEthCall(ROBINHOOD_MAINNET.rpc, resolved.feed, SEL_LATEST_ROUND_DATA, timeoutMs),
    rpcEthCall(ROBINHOOD_MAINNET.rpc, resolved.feed, SEL_DECIMALS, timeoutMs),
  ]);
  if (!roundHex || !decHex) return null;

  const round = decodeLatestRoundData(roundHex);
  const decimals = decodeDecimals(decHex);
  if (!round || decimals === null) return null;

  const verdict = validateRoundData(round, {
    expectedChainId: ROBINHOOD_MAINNET.chainId,
    chainId: ROBINHOOD_MAINNET.chainId,
    now: opts.now,
  });
  if (!verdict.ok) {
    console.error("[robinhood-chain]", resolved.feed, "rejected:", verdict.reason);
    return null;
  }

  return {
    symbol: symbol.toUpperCase(),
    feed: resolved.feed,
    chainId: ROBINHOOD_MAINNET.chainId,
    price: priceFromAnswer(round.answer, decimals),
    raw: round.answer.toString(),
    decimals,
    updatedAt: round.updatedAt,
    ageSec: verdict.ageSec,
    stale: verdict.stale,
    roundId: round.roundId.toString(),
    feedSource: resolved.source,
  };
}

/** Identity of a testnet faucet Stock Token — proves the contract exists and is
 *  a real ERC-20. Deliberately does NOT read a price: testnet feeds are mock. */
export async function readTestnetTokenIdentity(
  symbol: string,
  opts: { rpc?: string; timeoutMs?: number } = {},
): Promise<{ address: string; symbol: string | null; decimals: number | null } | null> {
  const address = TESTNET_FAUCET_TOKENS[symbol.toUpperCase()];
  if (!address) return null;
  const rpc = opts.rpc ?? ROBINHOOD_TESTNET.rpc;
  const timeoutMs = opts.timeoutMs ?? 8000;
  const [symHex, decHex] = await Promise.all([
    rpcEthCall(rpc, address, SEL_SYMBOL, timeoutMs),
    rpcEthCall(rpc, address, SEL_DECIMALS, timeoutMs),
  ]);
  const sym = symHex ? decodeAbiString(symHex) : null;
  const decimals = decHex ? decodeDecimals(decHex) : null;
  if (!sym && decimals === null) return null;
  return { address, symbol: sym, decimals };
}

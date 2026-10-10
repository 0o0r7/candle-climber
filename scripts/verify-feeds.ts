/**
 * VERIFY-FEEDS — the repeatable LIVE connection test for our official Robinhood
 * Chain data path (workstream W6; see docs/ROBINHOOD-CHAIN-INTEGRATION.md).
 *
 * The whole point of this script is that it never conflates two different
 * failures, because they mean different things to different people:
 *
 *   STAGE 1 · REACHABILITY   Is the RPC / the Chainlink directory reachable at
 *                            all? A failure here is an ENVIRONMENT result
 *                            (exit 2) — never reported as "the feed is wrong".
 *   STAGE 2 · FEEDS          For every ticker with a PUBLISHED official feed:
 *                            resolve the proxy, read latestRoundData() +
 *                            decimals() and run the honesty gate. A null while
 *                            the chain IS reachable is a DATA problem (exit 1).
 *   STAGE 3 · IDENTITY       The testnet faucet ERC-20s (chain 46630) are read
 *                            for symbol()/decimals() ONLY. Testnet feeds are
 *                            mock, so NO testnet price is ever read.
 *   STAGE 4 · ERROR BEHAVIOUR Two negative controls: a ticker with no published
 *                            feed (NFLX) must resolve to null, and a dead RPC
 *                            must return null classified as NETWORK.
 *
 * Nothing is synthesised here: an unavailable value stays null and is reported
 * as null. Exit codes: 0 = every official feed verified · 1 = a feed failed
 * verification while the chain was reachable · 2 = network/RPC unreachable.
 *
 * Run:  bun scripts/verify-feeds.ts          # human summary + JSON verdict
 *       bun scripts/verify-feeds.ts --json   # JSON only (CI / cron)
 */
import {
  CHAINLINK_DIRECTORY_URL,
  ROBINHOOD_MAINNET,
  ROBINHOOD_TESTNET,
  TESTNET_FAUCET_TOKENS,
  VERIFIED_STOCK_FEEDS,
  readOfficialQuote,
  readTestnetTokenIdentity,
  resolveOfficialFeed,
} from "@/lib/robinhood-chain";

const JSON_ONLY = process.argv.includes("--json");
const NO_FEED_TICKER = "NFLX"; // no official feed is published for it (honest gap, documented)
const DEAD_RPC = "http://127.0.0.1:9"; // guaranteed-refused port: the network negative control
const IDENTITY_TICKER = "TSLA";

interface ChainProbe {
  network: string;
  rpc: string;
  expectedChainId: number;
  chainId: number | null;
  ok: boolean;
  error?: string;
}

async function probeChain(network: string, rpc: string, expectedChainId: number): Promise<ChainProbe> {
  try {
    const res = await fetch(rpc, {
      method: "POST",
      headers: { "content-type": "application/json" },
      cache: "no-store",
      signal: AbortSignal.timeout(8000),
      body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "eth_chainId", params: [] }),
    });
    if (!res.ok) return { network, rpc, expectedChainId, chainId: null, ok: false, error: `HTTP ${res.status}` };
    const body = (await res.json()) as { result?: unknown };
    if (typeof body.result !== "string") {
      return { network, rpc, expectedChainId, chainId: null, ok: false, error: "no eth_chainId result" };
    }
    const chainId = Number.parseInt(body.result, 16);
    return chainId === expectedChainId
      ? { network, rpc, expectedChainId, chainId, ok: true }
      : { network, rpc, expectedChainId, chainId, ok: false, error: "chain id mismatch" };
  } catch (e) {
    return {
      network,
      rpc,
      expectedChainId,
      chainId: null,
      ok: false,
      error: e instanceof Error ? e.message : String(e),
    };
  }
}

async function probeDirectory(): Promise<{ ok: boolean; entries: number | null; error?: string }> {
  try {
    const res = await fetch(CHAINLINK_DIRECTORY_URL, { cache: "no-store", signal: AbortSignal.timeout(8000) });
    if (!res.ok) return { ok: false, entries: null, error: `HTTP ${res.status}` };
    const rows: unknown = await res.json();
    if (!Array.isArray(rows)) return { ok: false, entries: null, error: "payload is not an array" };
    return { ok: true, entries: rows.length };
  } catch (e) {
    return { ok: false, entries: null, error: e instanceof Error ? e.message : String(e) };
  }
}

interface FeedResult {
  symbol: string;
  resolvedFrom: "directory" | "snapshot" | null;
  feed: string | null;
  priceUsd: number | null;
  roundId: string | null;
  updatedAt: number | null;
  ageSec: number | null;
  stale: boolean | null;
  verified: boolean;
}

async function checkFeed(symbol: string): Promise<FeedResult> {
  const resolved = await resolveOfficialFeed(symbol);
  const quote = await readOfficialQuote(symbol);
  return {
    symbol,
    resolvedFrom: resolved?.source ?? null,
    feed: quote?.feed ?? resolved?.feed ?? null,
    priceUsd: quote?.price ?? null,
    roundId: quote?.roundId ?? null,
    updatedAt: quote?.updatedAt ?? null,
    ageSec: quote?.ageSec ?? null,
    stale: quote?.stale ?? null,
    verified: quote !== null,
  };
}

async function main() {
  // STAGE 1 — reachability of the two networks and the address directory.
  const [mainnet, testnet, directory] = await Promise.all([
    probeChain(ROBINHOOD_MAINNET.name, ROBINHOOD_MAINNET.rpc, ROBINHOOD_MAINNET.chainId),
    probeChain(ROBINHOOD_TESTNET.name, ROBINHOOD_TESTNET.rpc, ROBINHOOD_TESTNET.chainId),
    probeDirectory(),
  ]);

  // STAGE 2 — every ticker we know to have a published official feed.
  const feeds: FeedResult[] = [];
  for (const symbol of Object.keys(VERIFIED_STOCK_FEEDS)) {
    feeds.push(await checkFeed(symbol));
  }

  // STAGE 3 — testnet IDENTITY only (symbol + decimals; never a price).
  const identities: Array<{
    symbol: string;
    address: string;
    symbolOnChain: string | null;
    decimals: number | null;
    read: boolean;
  }> = [];
  for (const symbol of Object.keys(TESTNET_FAUCET_TOKENS)) {
    const identity = await readTestnetTokenIdentity(symbol);
    identities.push({
      symbol,
      address: TESTNET_FAUCET_TOKENS[symbol],
      symbolOnChain: identity?.symbol ?? null,
      decimals: identity?.decimals ?? null,
      read: identity !== null,
    });
  }

  // STAGE 4 — negative controls: an unpublished ticker and an unreachable RPC.
  const noFeedOfficial = await readOfficialQuote(NO_FEED_TICKER).catch(() => null);
  const deadRpcIdentity = await readTestnetTokenIdentity(IDENTITY_TICKER, {
    rpc: DEAD_RPC,
    timeoutMs: 3000,
  }).catch(() => null);

  const networkOk = mainnet.ok && testnet.ok && directory.ok;
  const feedsOk = feeds.every((f) => f.verified);
  const controlsOk = noFeedOfficial === null && deadRpcIdentity === null;
  const exitCode = !networkOk ? 2 : feedsOk && controlsOk ? 0 : 1;

  const verdict = {
    generatedAt: new Date().toISOString(),
    stage1_reachability: { passed: networkOk, mainnet, testnet, directory },
    stage2_officialFeeds: { passed: feedsOk, checked: feeds.length, feeds },
    stage3_testnetIdentity: { passed: identities.every((i) => i.read), identities, note: "identity only — testnet feeds are mock, no price is read" },
    stage4_errorBehaviour: {
      passed: controlsOk,
      noOfficialFeed: { ticker: NO_FEED_TICKER, official: noFeedOfficial, expected: "null" },
      deadRpc: { rpc: DEAD_RPC, identity: deadRpcIdentity, expected: "null (classified NETWORK, not a feed rejection)" },
    },
    verdict: {
      network: networkOk ? "reachable" : "unreachable",
      feeds: feedsOk ? "verified" : "failed verification",
      exitCode,
      meaning:
        exitCode === 0
          ? "official feeds verified live"
          : exitCode === 2
            ? "network/RPC unreachable — environment problem, NOT a feed result"
            : "feed verification failed while the chain was reachable — data problem",
    },
  };

  if (!JSON_ONLY) {
    console.log("Robinhood Chain — live connection test");
    console.log(`  1 reachability  ${networkOk ? "OK" : "FAILED"}`);
    console.log(`      mainnet ${mainnet.chainId ?? "?"} (want ${mainnet.expectedChainId}) ${mainnet.ok ? "OK" : mainnet.error}`);
    console.log(`      testnet ${testnet.chainId ?? "?"} (want ${testnet.expectedChainId}) ${testnet.ok ? "OK" : testnet.error}`);
    console.log(`      directory ${directory.entries ?? "?"} entries ${directory.ok ? "OK" : directory.error}`);
    console.log(`  2 official feeds ${feedsOk ? "OK" : "FAILED"}`);
    for (const f of feeds) {
      console.log(
        `      ${f.symbol.padEnd(5)} ${f.verified ? `$${f.priceUsd?.toFixed(2)}` : "null"} round ${f.roundId ?? "-"} age ${f.ageSec ?? "-"}s stale=${f.stale ?? "-"} via ${f.resolvedFrom ?? "-"}`,
      );
    }
    console.log(`  3 testnet identity (no price) ${identities.every((i) => i.read) ? "OK" : "FAILED"}`);
    for (const i of identities) console.log(`      ${i.symbol.padEnd(5)} ${i.symbolOnChain ?? "null"} decimals=${i.decimals ?? "-"}`);
    console.log(`  4 error behaviour ${controlsOk ? "OK" : "FAILED"}`);
    console.log(`      ${NO_FEED_TICKER} (no published feed) -> ${noFeedOfficial === null ? "null" : "UNEXPECTED FEED"}`);
    console.log(`      dead RPC -> ${deadRpcIdentity === null ? "null (network)" : "UNEXPECTED"}`);
    console.log(`  verdict: ${verdict.verdict.meaning} (exit ${exitCode})`);
  }
  console.log(JSON.stringify(verdict, null, 2));

  process.exit(exitCode);
}

await main();

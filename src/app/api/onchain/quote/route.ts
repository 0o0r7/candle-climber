// /api/onchain/quote — the official Robinhood Chain read, exposed on its own so
// the connection is independently verifiable (curl it, no game involved).
//
// Honesty contract (docs/ROBINHOOD-CHAIN-INTEGRATION.md):
// - `official` is the LIVE Chainlink price feed for the ticker, read over the
//   public mainnet JSON-RPC. It is the canonical Robinhood Stock Token price.
// - `testnetToken` is IDENTITY ONLY: the faucet ERC-20 on chain 46630 that a
//   player can actually claim. Testnet feeds are mock, so no price is read
//   from it. The two contract sets are deliberately different and never mixed.
// - Unavailable reads return null. Nothing is ever synthesised here.
import { NextResponse } from "next/server";
import {
  ROBINHOOD_MAINNET,
  ROBINHOOD_TESTNET,
  CHAINLINK_DIRECTORY_URL,
  TESTNET_FAUCET_TOKENS,
  VERIFIED_STOCK_FEEDS,
  readOfficialQuote,
  readTestnetTokenIdentity,
  resolveOfficialFeed,
} from "@/lib/robinhood-chain";

const ALLOWED = Array.from(
  new Set([...Object.keys(VERIFIED_STOCK_FEEDS), ...Object.keys(TESTNET_FAUCET_TOKENS)]),
).sort();

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const symbol = (searchParams.get("symbol") ?? "").toUpperCase();

  if (!ALLOWED.includes(symbol)) {
    return NextResponse.json(
      { error: "unknown symbol", symbol, allowed: ALLOWED },
      { status: 400 },
    );
  }

  const [feed, official, testnetToken] = await Promise.all([
    resolveOfficialFeed(symbol),
    readOfficialQuote(symbol),
    readTestnetTokenIdentity(symbol),
  ]);

  return NextResponse.json(
    {
      symbol,
      official, // OfficialStockQuote | null — mainnet Chainlink feed, live
      officialFeed: feed, // { feed, source: "directory" | "snapshot" } | null
      testnetToken, // identity only, chain 46630 faucet token (may be null)
      networks: {
        mainnet: { chainId: ROBINHOOD_MAINNET.chainId, rpc: ROBINHOOD_MAINNET.rpc },
        testnet: { chainId: ROBINHOOD_TESTNET.chainId, rpc: ROBINHOOD_TESTNET.rpc },
      },
      sources: {
        contracts: "https://docs.robinhood.com/chain/contracts",
        feeds: "https://docs.chain.link/data-feeds/tokenized-equity-feeds/robinhood",
        directory: CHAINLINK_DIRECTORY_URL,
      },
    },
    { headers: { "Cache-Control": "public, max-age=60" } },
  );
}

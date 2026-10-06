import { NextRequest, NextResponse } from "next/server";
import {
  ROBINHOOD_CHAIN_ID,
  WICK_TOKEN_ADDRESS,
  balanceToTier,
  decodeHexQuantity,
  encodeBalanceOf,
  isValidAddress,
  DEFAULT_RPC_URL,
  type WalletTier,
} from "@/lib/wallet";

export const dynamic = "force-dynamic";

// P4.2 — server-side on-chain $WICK balance read.
// Design contract (ECONOMY-LAWS + sprint plan E2):
//   · read-only eth_call to the public testnet RPC — no keys, no signer
//   · 60s per-address memory cache (RPC-friendly, fresh enough for a badge)
//   · FAIL-OPEN: any error returns tier "none" with ok:false — the game and the
//     leaderboard are NEVER blocked or changed by this route.

type WalletQuery = {
  ok: boolean;
  address: string;
  tier: WalletTier;
  balance: string; // wei as decimal string
  error?: string;
};

const CACHE = new Map<string, { t: number; payload: WalletQuery }>();
const CACHE_MS = 60_000;

async function readBalance(address: string): Promise<WalletQuery> {
  const rpc =
    process.env.ROBINHOOD_RPC_URL ||
    process.env.NEXT_PUBLIC_ROBINHOOD_RPC_URL ||
    DEFAULT_RPC_URL;
  try {
    const res = await fetch(rpc, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "eth_call",
        params: [{ to: WICK_TOKEN_ADDRESS, data: encodeBalanceOf(address) }, "latest"],
      }),
      signal: AbortSignal.timeout(8_000),
    });
    const json = await res.json();
    if (json?.error) throw new Error(String(json.error?.message || "rpc error"));
    const wei = decodeHexQuantity(String(json.result ?? "0x0"));
    return { ok: true, address, tier: balanceToTier(wei), balance: wei.toString() };
  } catch {
    return { ok: false, address, tier: "none", balance: "0", error: "rpc-unavailable" };
  }
}

export async function POST(req: NextRequest) {
  let address = "";
  try {
    const body = await req.json();
    address = String(body?.address ?? "");
  } catch {
    /* handled below */
  }
  if (!isValidAddress(address)) {
    return NextResponse.json({ ok: false, error: "invalid-address" }, { status: 400 });
  }
  const key = address.toLowerCase();
  const now = Date.now();
  const hit = CACHE.get(key);
  if (hit && now - hit.t < CACHE_MS) {
    return NextResponse.json(hit.payload, { headers: { "cache-control": "no-store" } });
  }
  const payload = await readBalance(key);
  CACHE.set(key, { t: now, payload });
  return NextResponse.json(payload, { headers: { "cache-control": "no-store" } });
}

export async function GET() {
  // Status/config probe (names only, no secrets exist in this route).
  return NextResponse.json(
    {
      ok: true,
      chainId: ROBINHOOD_CHAIN_ID,
      token: WICK_TOKEN_ADDRESS,
      cosmeticOnly: true,
      laws: "docs/ECONOMY-LAWS.md",
    },
    { headers: { "cache-control": "no-store" } },
  );
}

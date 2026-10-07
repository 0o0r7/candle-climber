// Shared server-side $WICK balance read (E2.4 vault + reuse by future lanes).
// Plain JSON-RPC eth_call to the public testnet RPC — no keys, no signer.
// 60s per-address memory cache (RPC-friendly). FAIL-OPEN: any error reports
// tier "none" with ok:false — callers decide policy; nothing here blocks play.
import {
  WICK_TOKEN_ADDRESS,
  DEFAULT_RPC_URL,
  encodeBalanceOf,
  decodeHexQuantity,
  balanceToTier,
  type WalletTier,
} from "@/lib/wallet";

export interface WickBalanceRead {
  ok: boolean;
  tier: WalletTier;
  balance: string; // wei as decimal string
  error?: string;
}

const CACHE = new Map<string, { t: number; payload: WickBalanceRead }>();
const CACHE_MS = 60_000;

export async function readWickBalance(address: string): Promise<WickBalanceRead> {
  const key = address.toLowerCase();
  const now = Date.now();
  const hit = CACHE.get(key);
  if (hit && now - hit.t < CACHE_MS) return hit.payload;
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
        params: [{ to: WICK_TOKEN_ADDRESS, data: encodeBalanceOf(key) }, "latest"],
      }),
      signal: AbortSignal.timeout(8_000),
    });
    const json = await res.json();
    if (json?.error) throw new Error(String(json.error?.message || "rpc error"));
    const wei = decodeHexQuantity(String(json.result ?? "0x0"));
    const payload: WickBalanceRead = { ok: true, tier: balanceToTier(wei), balance: wei.toString() };
    CACHE.set(key, { t: now, payload });
    return payload;
  } catch {
    const payload: WickBalanceRead = { ok: false, tier: "none", balance: "0", error: "rpc-unavailable" };
    CACHE.set(key, { t: now, payload });
    return payload;
  }
}

export async function readWickTier(address: string): Promise<{ ok: boolean; tier: WalletTier }> {
  const r = await readWickBalance(address);
  return { ok: r.ok, tier: r.tier };
}

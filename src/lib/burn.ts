// Burn feed (E2.6 / P6.5 — "the game eats its own supply").
// Reads the $WICK balance of the canonical burn address via one eth_call to
// the public testnet RPC — the cumulative amount irrecoverably removed from
// supply (tax-rail 5% burn share + curve-fee burn + any manual burns).
// 5-minute cache; fail-open { ok:false } so the UI line can be omitted, never
// wrong. Fee-EVENT level attribution (tax vs curve per day) lands post-grad.
import {
  WICK_TOKEN_ADDRESS,
  DEFAULT_RPC_URL,
  encodeBalanceOf,
  decodeHexQuantity,
  formatWick,
} from "@/lib/wallet";
import { captureError } from "@/lib/telemetry"; // E4.4: chain-read failures alert (P3)

// The canonical Ethereum "dead" address — where the fee rails send burns.
export const BURN_ADDRESS = "0x000000000000000000000000000000000000dead";

export interface BurnRead {
  ok: boolean;
  burned: string; // human "$WICK" amount, 3-decimal truncated
  burnedWei: string;
  address: string;
  token: string;
  error?: string;
}

const CACHE_MS = 5 * 60_000;
let cached: { t: number; payload: BurnRead } | null = null;

export async function fetchBurnedWick(): Promise<BurnRead> {
  if (cached && Date.now() - cached.t < CACHE_MS) return cached.payload;
  const rpc =
    process.env.ROBINHOOD_RPC_URL ||
    process.env.NEXT_PUBLIC_ROBINHOOD_RPC_URL ||
    DEFAULT_RPC_URL;
  const base = { address: BURN_ADDRESS, token: WICK_TOKEN_ADDRESS };
  try {
    const res = await fetch(rpc, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "eth_call",
        params: [{ to: WICK_TOKEN_ADDRESS, data: encodeBalanceOf(BURN_ADDRESS) }, "latest"],
      }),
      signal: AbortSignal.timeout(8_000),
    });
    const json = await res.json();
    if (json?.error) throw new Error(String(json.error?.message || "rpc error"));
    const wei = decodeHexQuantity(String(json.result ?? "0x0"));
    const payload: BurnRead = {
      ok: true,
      burned: formatWick(wei),
      burnedWei: wei.toString(),
      ...base,
    };
    cached = { t: Date.now(), payload };
    return payload;
  } catch (err) {
    captureError(err, { lane: "burn", op: "burned-read" }); // E4.4: SUPPLY BURNED line degrades honestly
    return { ok: false, burned: "0", burnedWei: "0", ...base, error: "rpc-unavailable" };
  }
}

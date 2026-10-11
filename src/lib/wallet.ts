// P4.2 (E2) — $WICK Balance Gate: cosmetic-only wallet identity layer.
// LAW (docs/ECONOMY-LAWS.md): wallet status NEVER changes rank, score, or base
// access — it only unlocks cosmetic badge tiers. Fail-open everywhere: if the
// chain read is unavailable the gate reports "none" and play is untouched.
// Zero new dependencies: server reads = plain JSON-RPC fetch; client = the
// injected window.ethereum provider (testnet-only).

export const WALLET_ADDRESS_KEY = "CC_WALLET_ADDR"; // localStorage, CC_* key pattern

// Live $WICK token (launch #5963, verified 2026-10-06 via pad API + explorer).
export const WICK_TOKEN_ADDRESS = (
  process.env.WICK_TOKEN_ADDRESS || "0xE2cE0Be4e3D420C1e4b5C46493b3d5e03595216c"
).toLowerCase();

export const ROBINHOOD_CHAIN_ID = 46630; // hex 0xb626 — verified live via eth_chainId
export const DEFAULT_RPC_URL = "https://rpc.testnet.chain.robinhood.com"; // public, no key

export const WICK_DECIMALS = 18n;
export const TIER_HOLD_WEI = 1_000n * 10n ** WICK_DECIMALS; // ≥ 1,000 $WICK → holder
export const TIER_WHALE_WEI = 100_000n * 10n ** WICK_DECIMALS; // ≥ 100,000 $WICK → whale

export type WalletTier = "none" | "holder" | "whale";

export function isValidAddress(a: unknown): a is string {
  return typeof a === "string" && /^0x[0-9a-fA-F]{40}$/.test(a);
}

/** Chip-style short form (0x1234…abcd) for any PUBLIC wallet display. */
export function shortAddress(a: string): string {
  return isValidAddress(a) ? `${a.slice(0, 6)}…${a.slice(-4)}` : a;
}

/** ERC-20 balanceOf(address) calldata: selector 0x70a08231 + left-padded address. */
export function encodeBalanceOf(address: string): string {
  if (!isValidAddress(address)) throw new Error("invalid address");
  return "0x70a08231" + address.toLowerCase().replace(/^0x/, "").padStart(64, "0");
}

/** eth_call quantity result → wei (accepts 0x-prefixed hex). */
export function decodeHexQuantity(hex: string): bigint {
  return BigInt(hex);
}

/** Tier thresholds are COSMETIC ONLY (ECONOMY-LAWS) — adjustable, never scored. */
export function balanceToTier(wei: bigint): WalletTier {
  if (wei >= TIER_WHALE_WEI) return "whale";
  if (wei >= TIER_HOLD_WEI) return "holder";
  return "none";
}

/** Human $WICK amount, 3 decimals truncated (never rounds a holder up). */
export function formatWick(wei: bigint): string {
  const base = 10n ** WICK_DECIMALS;
  const whole = wei / base;
  const frac = (wei % base) * 1000n / base;
  const w = whole.toLocaleString("en-US");
  return frac === 0n ? w : `${w}.${frac.toString().padStart(3, "0")}`;
}

// ── Network auto-setup (wallet_switchEthereumChain / wallet_addEthereumChain) ──
// The wallet chip must ASK the injected provider to switch to Robinhood Chain
// testnet on connect — and ADD the chain (EIP-3085) when the wallet doesn't
// know it yet. Everything is fail-open: a rejected/failed switch never blocks
// play — it only leaves the cosmetic badge in the honest WRONG NETWORK state.

export const ROBINHOOD_CHAIN_ID_HEX = "0xb626"; // 46630 — verified live via eth_chainId (2026-10-06)

/** EIP-3085 params for adding Robinhood Chain testnet to an injected wallet. */
export const ROBINHOOD_CHAIN_PARAMS = {
  chainId: ROBINHOOD_CHAIN_ID_HEX,
  chainName: "Robinhood Chain Testnet",
  nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
  rpcUrls: [DEFAULT_RPC_URL],
  blockExplorerUrls: ["https://explorer.testnet.chain.robinhood.com"],
} as const;

export type EthLikeProvider = {
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
};

export type ChainEnsureResult =
  | { ok: true; chainId: string; added: boolean; switched: boolean }
  | { ok: false; reason: "rejected" | "pending" | "unknown"; message: string; code?: number };

function errCode(e: unknown): number | undefined {
  if (typeof e === "object" && e !== null && "code" in e) {
    const c = (e as { code: unknown }).code;
    if (typeof c === "number") return c;
  }
  return undefined;
}

function errMsg(e: unknown): string {
  if (typeof e === "object" && e !== null && "message" in e) {
    const m = (e as { message: unknown }).message;
    if (typeof m === "string" && m.length > 0) return m;
  }
  return "";
}

async function readChainId(eth: EthLikeProvider): Promise<string> {
  return String(await eth.request({ method: "eth_chainId" })).toLowerCase();
}

/**
 * Bring the injected wallet onto Robinhood Chain testnet — WITHOUT throwing.
 * Flow (mirrors the battle-tested viem/wagmi sequence):
 *   1. already on the chain → ok, zero prompts;
 *   2. wallet_switchEthereumChain → ok;
 *   3. switch errors (4902 "unrecognized chain", -32603, …) → wallet_addEthereumChain
 *      with full EIP-3085 params (most wallets auto-switch after add);
 *   4. verify eth_chainId after every path — one follow-up switch if the wallet
 *      added without switching — and report the FINAL on-wallet state honestly.
 * 4001 = user rejected, -32002 = a request popup is already open in the wallet.
 */
export async function ensureRobinhoodChain(
  eth: EthLikeProvider,
  targetHex: string = ROBINHOOD_CHAIN_ID_HEX,
): Promise<ChainEnsureResult> {
  const target = targetHex.toLowerCase();
  const fail = (
    reason: "rejected" | "pending" | "unknown",
    message: string,
    code?: number,
  ): ChainEnsureResult => ({ ok: false, reason, message, ...(code !== undefined ? { code } : {}) });
  // Hard stops from a switch/add attempt; anything else falls through to the
  // next phase (missing chain → add, per EIP-3326 code 4902 behavior).
  const switchHardStop = (e: unknown): ChainEnsureResult | null => {
    const code = errCode(e);
    if (code === 4001) return fail("rejected", "network switch was rejected in the wallet", code);
    if (code === -32002) return fail("pending", "a network request is already open in the wallet — approve it there", code);
    return null;
  };
  const addHardStop = (e: unknown): ChainEnsureResult | null => {
    const code = errCode(e);
    if (code === 4001) return fail("rejected", "add-network request was rejected in the wallet", code);
    if (code === -32002) return fail("pending", "an add-network popup is already open in the wallet", code);
    return null;
  };

  try {
    let added = false;
    let switched = false;
    if ((await readChainId(eth)) === target) {
      return { ok: true, chainId: target, added, switched };
    }

    try {
      await eth.request({ method: "wallet_switchEthereumChain", params: [{ chainId: target }] });
      switched = true;
    } catch (e) {
      const hard = switchHardStop(e);
      if (hard) return hard;
      // Chain unknown to this wallet (4902 / -32603 / …) → add it explicitly.
      try {
        await eth.request({ method: "wallet_addEthereumChain", params: [{ ...ROBINHOOD_CHAIN_PARAMS }] });
        added = true;
      } catch (e2) {
        const hard2 = addHardStop(e2);
        return hard2 ?? fail("unknown", errMsg(e2) || "add-network failed", errCode(e2));
      }
    }

    // Verify — some wallets add WITHOUT auto-switching; one clean follow-up.
    let final = await readChainId(eth);
    if (final !== target) {
      try {
        await eth.request({ method: "wallet_switchEthereumChain", params: [{ chainId: target }] });
        switched = true;
      } catch (e) {
        const hard = switchHardStop(e);
        if (hard) return hard;
        return fail("unknown", errMsg(e) || "network switch failed", errCode(e));
      }
      final = await readChainId(eth);
    }

    return final === target
      ? { ok: true, chainId: final, added, switched }
      : fail("unknown", `wallet still reports chain ${final} (wanted ${target})`);
  } catch (e) {
    return fail("unknown", errMsg(e) || "chain check failed", errCode(e));
  }
}

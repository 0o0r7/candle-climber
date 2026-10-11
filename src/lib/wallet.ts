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

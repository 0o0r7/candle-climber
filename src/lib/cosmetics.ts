// TROPHY CASE — the non-competitive sink for climb credits.
//
// WHY (docs/RESCUE-ECONOMY.md §5): credits spent only on a rescue are a
// one-decision currency. A player who already has a foothold habit needs a
// second, purely expressive choice: something to SAVE for that can never make
// them stronger. These unlocks decorate the player's own panels — they never
// touch the score, the physics, the terrain, the board or another player's view.
//
// POSTURE: pure functions, no storage, no clock. The caller persists the owned
// list; a hand-edited save can only give itself a decoration.
import { spendCredits, type CreditWallet } from "@/lib/credits";

export const COSMETICS_KEY = "cc_cosmetics_v1";

export interface CosmeticDef {
  id: string;
  name: string;
  blurb: string;
  /** price in climb credits — cosmetic only, never score */
  cost: number;
}

/** Three ornaments, cheapest first. Prices sit above a rescue on purpose: the
 *  second chance is the urgent spend, these are the patient one. */
export const COSMETICS: readonly CosmeticDef[] = [
  { id: "flare", name: "CARD FLARE", blurb: "a gold flare on your results panel", cost: 120 },
  { id: "seal", name: "CREDIT SEAL", blurb: "a holder seal beside your credit line", cost: 240 },
  { id: "oath", name: "CLIMBER'S OATH", blurb: "a sworn line on your entry card", cost: 480 },
];

export function cosmeticById(id: string): CosmeticDef | undefined {
  return COSMETICS.find((c) => c.id === id);
}

/** Parse the owned list; unknown ids and junk are dropped. */
export function loadOwned(raw: string | null): string[] {
  if (!raw) return [];
  try {
    const j = JSON.parse(raw) as unknown;
    if (!Array.isArray(j)) return [];
    const known = new Set(COSMETICS.map((c) => c.id));
    return [...new Set(j.filter((v): v is string => typeof v === "string" && known.has(v)))];
  } catch {
    return [];
  }
}

export function saveOwned(ids: readonly string[]): string {
  return JSON.stringify([...new Set(ids)]);
}

export function owns(ids: readonly string[], id: string): boolean {
  return ids.includes(id);
}

export type CosmeticPurchase =
  | { ok: true; wallet: CreditWallet; owned: string[]; def: CosmeticDef }
  | { ok: false; reason: "unknown" | "owned" | "short"; def?: CosmeticDef };

/** Buy one cosmetic. Pure: the caller persists both the wallet and the list. */
export function buyCosmetic(
  wallet: CreditWallet,
  owned: readonly string[],
  id: string,
  now: number,
): CosmeticPurchase {
  const def = cosmeticById(id);
  if (!def) return { ok: false, reason: "unknown" };
  if (owns(owned, id)) return { ok: false, reason: "owned", def };
  const paid = spendCredits(wallet, def.cost, now);
  if (!paid.ok) return { ok: false, reason: "short", def };
  return { ok: true, wallet: paid.wallet, owned: [...owned, id], def };
}

// Partner registry — the CURATED ALLOWLIST (v0) of the PARTNER chart lane
// (council 2026-10-12, red line: "curated allowlist v0").
//
// WHAT THIS IS
// The registry lists every project / community / guild whose chart may appear
// in the always-available PARTNER pool. Listing has TWO gates, both enforced
// elsewhere:
//   1. HOLD THRESHOLD  — the registered wallet holds ≥ MIN_PARTNER_HOLD_ETH of
//      $WICK in value, re-verified on-chain (partner-verifier.ts).
//   2. CURATOR APPROVAL — an entry exists here. The threshold is NECESSARY,
//      never sufficient: the owner (curator) explicitly adds every partner
//      after reviewing their application (/api/partners/apply leads).
//
// WHY ENV-DRIVEN IN v0
// The pool starts EMPTY (owner has no pilot partners yet — 2026-10-12). The
// first approvals happen through the curator (owner) alone, so the registry
// ships as a JSON env var (PARTNER_REGISTRY_JSON) instead of a code change
// per partner. The format is strict and validated; a malformed entry is
// skipped LOUDLY (console.error), never silently half-accepted. When the
// partner count stabilizes, entries can migrate into a committed config file
// or a mongo collection — the verifier/pool consume only getPartnerRegistry().
//
// PII NOTE: a registry entry is a PUBLIC LISTING (the project put itself
// forward); its wallet address is an on-chain fact and showing it lets anyone
// verify the hold. This is different from partner APPLICATIONS
// (partner-store.ts), which are private leads and are never rendered.
//
// LAWFUL GATE REMINDER (council): the gate is PROVIDER-side. Everything a
// player touches — play on a listed partner chart, the daily main slot, the
// scoreboard — stays free and unbuyable (LAW 1.1/1.2/1.3 untouched).

export interface PartnerEntry {
  /** Stable slug id — used in deep links and logs. */
  id: string;
  /** Display name (public). */
  projectName: string;
  /** Chart display symbol for the partner's token (public). */
  symbol: string;
  /** Partner token contract (0x…, 40 hex) — the feed target for terrain. */
  tokenAddress: string;
  /** The bonding-curve contract for the token (0x…, 40 hex). P3-1 lesson:
   *  curve trades carry NO token topic — the curve address IS the token's
   *  on-chain identity, so the feed gate needs it explicitly. Optional in
   *  the entry, but the feed-availability gate stays closed without it. */
  curveAddress?: string;
  /** The wallet that must hold $WICK (0x…, 40 hex) — verification target. */
  walletAddress: string;
  /** ISO date the curator added the entry. */
  addedAt: string;
  /** Optional public one-liner shown in the pool. */
  note?: string;
}

const ID_RE = /^[a-z0-9][a-z0-9-]{1,39}$/;
const HEX_ADDR = /^0x[a-fA-F0-9]{40}$/;
const SYMBOL_RE = /^[A-Z0-9]{2,12}$/;
const NAME_RE = /^[A-Za-z0-9 _.-]{2,60}$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const NOTE_RE = /^[A-Za-z0-9 _.,!?'():-]{0,140}$/;

/** Normalize a hex address: trim, lowercase (accepts 0X prefixes), or "". */
function normalizeAddress(raw: unknown): string {
  if (typeof raw !== "string") return "";
  const t = raw.trim().toLowerCase();
  return HEX_ADDR.test(t) ? t : "";
}

/** Validate one raw entry; returns the entry or an error string. */
export function validatePartnerEntry(raw: unknown): { entry?: PartnerEntry; error?: string } {
  if (!raw || typeof raw !== "object") return { error: "not an object" };
  const r = raw as Record<string, unknown>;
  const id = typeof r.id === "string" ? r.id : "";
  const projectName = typeof r.projectName === "string" ? r.projectName.trim() : "";
  const symbol = typeof r.symbol === "string" ? r.symbol.trim().toUpperCase() : "";
  const tokenAddress = normalizeAddress(r.tokenAddress);
  const walletAddress = normalizeAddress(r.walletAddress);
  const curveAddress = normalizeAddress(r.curveAddress);
  const addedAt = typeof r.addedAt === "string" ? r.addedAt.trim() : "";
  const note = typeof r.note === "string" ? r.note.trim() : "";

  if (!ID_RE.test(id)) return { error: `${id || "(no id)"}: bad id (lowercase slug, 2-40 chars)` };
  if (!NAME_RE.test(projectName)) return { error: `${id}: bad projectName (2-60 safe chars)` };
  if (!SYMBOL_RE.test(symbol)) return { error: `${id}: bad symbol (2-12 A-Z0-9)` };
  if (!tokenAddress) return { error: `${id}: bad tokenAddress` };
  if (!walletAddress) return { error: `${id}: bad walletAddress` };
  if (!DATE_RE.test(addedAt) || Number.isNaN(Date.parse(addedAt + "T00:00:00Z"))) {
    return { error: `${id}: bad addedAt (YYYY-MM-DD)` };
  }
  if (note && !NOTE_RE.test(note)) return { error: `${id}: bad note (safe chars, ≤140)` };
  const entry: PartnerEntry = {
    id, projectName, symbol,
    tokenAddress,
    walletAddress,
    addedAt,
    ...(curveAddress ? { curveAddress } : {}),
    ...(note ? { note } : {}),
  };
  return { entry };
}

export interface ParsedRegistry {
  entries: PartnerEntry[];
  errors: string[];
}

/** Parse a registry JSON payload (array of entries). Duplicate ids are
 *  dropped first-wins. Invalid entries are reported, never half-kept. */
export function parseRegistry(raw: string | null | undefined): ParsedRegistry {
  if (!raw || !raw.trim()) return { entries: [], errors: [] };
  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    return { entries: [], errors: ["registry JSON did not parse"] };
  }
  if (!Array.isArray(data)) return { entries: [], errors: ["registry must be a JSON array"] };
  const entries: PartnerEntry[] = [];
  const errors: string[] = [];
  const seen = new Set<string>();
  for (const item of data) {
    const { entry, error } = validatePartnerEntry(item);
    if (error || !entry) {
      errors.push(error ?? "unknown error");
      continue;
    }
    if (seen.has(entry.id)) {
      errors.push(`${entry.id}: duplicate id dropped (first wins)`);
      continue;
    }
    seen.add(entry.id);
    entries.push(entry);
  }
  return { entries, errors };
}

let cache: ParsedRegistry | null = null;

/** The process-level registry (cached; env is read once per process).
 *  Empty when PARTNER_REGISTRY_JSON is unset — the v0 pool starts empty. */
export function getPartnerRegistry(): ParsedRegistry {
  if (!cache) {
    cache = parseRegistry(process.env.PARTNER_REGISTRY_JSON);
    for (const e of cache.errors) console.error("[partner-registry]", e);
    if (cache.entries.length > 0) {
      console.error(`[partner-registry] ${cache.entries.length} partner(s) loaded`);
    }
  }
  return cache;
}

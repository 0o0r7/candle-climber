// Guild registry — STATIC, operator-curated (Phase 2, alt-games lane).
//
// WHAT THIS IS
// A small, committed list of guilds that the operator has onboarded. It is
// deliberately a plain TS file (the "static registry" the plan called for) so
// BOTH the server (board tagging / buff verification) and the client (Chain
// City buff application) import the exact same list — no extra API round-trip,
// no drift.
//
// WHAT A GUILD GIVES
//   - identity: a `?guild=<code>` link tags a player (opaque metadata, same
//     bounded alphabet as the shipped `?ref=` referral stamp — it NEVER touches
//     a ranked score or a board lane).
//   - a BUFF: a registered guild applies a modest income multiplier in Chain
//     City (the city already ships a Guild Hall at 1.15× — the guild buff is
//     the community half of that). Unregistered codes get NO buff (1.0): a
//     guild tag alone is decoration, only a curated entry is load-bearing.
//
// HONESTY
// An unregistered tag is still accepted and shown (belonging is free), it just
// carries no buff. Registration is a curator decision, never a purchase — no
// LAW 1.1/1.2/1.3 surface is touched (play stays free and unbuyable).

export interface GuildDef {
  /** lowercase slug, matches the sanitizeGuild alphabet (used in ?guild=) */
  code: string;
  /** display name (public) */
  name: string;
  /** public one-liner shown in the guild chip */
  tagline: string;
  /** hex accent used by the city UI chip */
  color: string;
  /** Chain City income multiplier (1.0 = no buff). Clamped to GUILD_BUFF bounds. */
  buff: number;
  /** ISO date the curator added the entry */
  addedAt: string;
}

/** Same bounded, URL/terminal-safe alphabet as sanitizeRef — a tag can ride
 *  share links and board reads safely. */
const CODE_RE = /^[A-Za-z0-9_-]{1,24}$/;

export const GUILD_BUFF_MIN = 1;
export const GUILD_BUFF_MAX = 1.25;

/**
 * Sanitize a guild code. Any `[A-Za-z0-9_-]{1,24}` string is a valid TAG
 * (decoration, buff 1.0). Anything else ⇒ undefined (fail-open omit, exactly
 * like the referral stamp).
 */
export function sanitizeGuild(raw: unknown): string | undefined {
  if (typeof raw !== "string") return undefined;
  const m = raw.trim().match(CODE_RE);
  return m ? m[0].toLowerCase() : undefined;
}

/**
 * The curated registry. SEED = the operator's own community home guild; the
 * operator appends entries as guilds are onboarded (append-only). Replace the
 * seed's display fields with the real community details when the guild exists.
 */
export const GUILD_REGISTRY: readonly GuildDef[] = [
  {
    code: "candleclimber",
    name: "Candle Climber",
    tagline: "The original climb — community home guild.",
    color: "#ccff00",
    buff: 1.1,
    addedAt: "2026-10-17",
  },
];

const BY_CODE = new Map(GUILD_REGISTRY.map((g) => [g.code, g]));

/** Look up a registered guild by code (case-insensitive). Null when unknown. */
export function findGuild(code: string | null | undefined): GuildDef | null {
  if (!code) return null;
  return BY_CODE.get(code.toLowerCase()) ?? null;
}

/**
 * The income multiplier a guild code carries in Chain City. 1.0 for an unknown
 * or absent code, clamped to [GUILD_BUFF_MIN, GUILD_BUFF_MAX] for a registered
 * one — a bad registry entry can never break the economy math.
 */
export function guildBuff(code: string | null | undefined): number {
  const g = findGuild(code);
  if (!g) return 1;
  const b = Number(g.buff);
  if (!Number.isFinite(b)) return 1;
  return Math.max(GUILD_BUFF_MIN, Math.min(GUILD_BUFF_MAX, b));
}

// E5.5 referral links — pure builders (extracted from GameCanvas 2026-10-29
// for the P0 deep-link fix so they are unit-testable).
//
// The referral loop: share text carries a measurable link → ?ref= lands on
// /play → GameCanvas persists it to cc_ref_v1 → every later submission
// stamps it onto its board row → /ops rollup ("referral traffic measurable
// in board metadata").
//
// P0 fix contract:
//   · shareRef()  joins an ALREADY-QUERIED url:  duelUrl(...) + shareRef(n)
//     = "/play?duel=X&ref=Y"  (the old "?ref=" form minted "?duel=X?ref=Y",
//     which URLSearchParams reads as ONE malformed duel param — both lost).
//   · shareUrl()  is the STANDALONE link (bare GAME_URL has no query yet).

export const GAME_URL = "https://candle-climber.vercel.app";

/** Sanitize a sharer name into the ref slug (mirrors the landing-side
 *  validation regex /^[A-Za-z0-9_-]{1,24}$/ in GameCanvas). */
export function refSlug(raw: string): string {
  const m = (raw.toLowerCase().match(/[a-z0-9_-]+/g) ?? []).join("").slice(0, 24);
  return m || "cc";
}

/** Append a ref to a URL that already carries a query string ("&" joining). */
export function shareRef(raw: string): string {
  return `&ref=${refSlug(raw)}`;
}

/** The standalone measurable game link every traveling text carries. */
export function shareUrl(raw: string): string {
  return `${GAME_URL}/play?ref=${refSlug(raw)}`;
}

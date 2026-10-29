// P0 deep-link fix (2026-10-29) — legacy link healing, server-side.
//
// History: every shareable game link (archive rows, duel invites, ?ref=
// share links) was minted against "/" while the ONLY parser of those params
// is the GameCanvas init effect on /play. New links are minted correctly
// (see src/game/cc/{archive,duel,share}.ts); this helper lets middleware
// forward links ALREADY shared in the wild so they keep working.
//
// Conservative trigger: only "/" with at least one known game param.
// utm_* / plain "/" landings are untouched (marketing page behavior intact).

/** Params the game actually parses on /play (GameCanvas init effect). */
export const GAME_LINK_PARAMS: ReadonlySet<string> = new Set([
  "duel", // P7.3 async duel invite
  "ref", // E5.5 referral attribution
  "symbol", // chart deep link
  "date", // H1 archive date
  "source", // ?source=launch legacy lane
  "mode", // 3-mode canonical deep link
  "interval", // P3.5 timeframe pin
  "renderer", // v1/v2 A/B carry-through
]);

/** True when a request is a legacy "/" deep link that /play would parse. */
export function shouldForwardToPlay(pathname: string, paramKeys: readonly string[]): boolean {
  if (pathname !== "/") return false;
  return paramKeys.some((k) => GAME_LINK_PARAMS.has(k));
}

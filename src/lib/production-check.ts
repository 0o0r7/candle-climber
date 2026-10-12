// Production database safety check (LU-9).
// When NODE_ENV is "production" and DATABASE_URL is unset (or not a MongoDB
// URI), the app is running with in-memory stores — leaderboards, duels, ghosts
// and weights all reset on every restart. This module emits a loud console
// warning at startup so an operator never silently ships a data-losing config.
//
// The app still boots (fail-open is a core design principle — play is never
// blocked), but the warning makes the operational risk visible.

let warned = false;

/** Test-only: reset the warn-once guard. */
export function _resetProductionCheck(): void {
  warned = false;
}

export function checkProductionDatabase(): void {
  if (warned) return;
  if (process.env.NODE_ENV !== "production") return;

  const url = process.env.DATABASE_URL ?? "";
  const isMongo = url.startsWith("mongodb://") || url.startsWith("mongodb+srv://");

  if (!isMongo) {
    warned = true;
    console.warn(
      "\n" +
        "⚠️  ───────────────────────────────────────────────────────\n" +
        "⚠️  PRODUCTION WARNING (LU-9): DATABASE_URL is not set or is not a MongoDB URI.\n" +
        "⚠️  All stores (leaderboard, duels, ghosts, weights) are running IN-MEMORY.\n" +
        "⚠️  Every restart will PERMANENTLY LOSE all player records.\n" +
        "⚠️  Set DATABASE_URL to a MongoDB connection string before scaling.\n" +
        "⚠️  ───────────────────────────────────────────────────────\n",
    );
  }
}

// Economy-path telemetry (E4.4 — ECONOMY-CHECKLIST): Sentry alerts on wallet API
// failures, weights-ledger write errors and leaderboard write failures.
// Contract (WICK-ECONOMY-SPEC §9): ledger write errors are P2 alerts, NOT silent
// fallbacks — weights must never silently vanish (trust is the product).
//
// Dynamic import on purpose: unit tests import the stores directly under `bun test`
// (no Next runtime there) — telemetry must degrade to a no-op, never throw, and
// never put the Sentry SDK on the critical path of a lane that is failing anyway.
type Ctx = Record<string, string>;

export function captureError(err: unknown, ctx: Ctx = {}): void {
  void (async () => {
    try {
      const Sentry = await import("@sentry/nextjs");
      Sentry.withScope((scope) => {
        for (const [k, v] of Object.entries(ctx)) scope.setTag(k, v);
        // P2-class: economy-path degradation. Warning (not fatal) because every
        // call site is fail-open — the game never breaks; the ALERT is the point.
        scope.setLevel("warning");
        Sentry.captureException(err);
      });
    } catch {
      /* telemetry must never break the lane it is reporting on */
    }
  })();
}

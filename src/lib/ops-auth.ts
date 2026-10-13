// G5 prelaunch hardening (129-a #4): the moderation surfaces (/ops review
// queue + GET /api/score-report) expose player names, reporter names and
// free-text reasons. They are now DEFAULT-GATED behind OPS_TOKEN:
// - OPS_TOKEN unset  → moderation detail is withheld; aggregate counts only.
// - OPS_TOKEN set    → callers pass it via the x-ops-token header (API) or
//                      ?key= (the /ops page) — timing-safe compare.
// The owner sets OPS_TOKEN once in the hosting env; noindex was never access
// control. Failure mode is fail-closed: a misconfigured token shows counts,
// never the raw queue.
import { timingSafeEqual } from "node:crypto";

/** True when the provided credential matches the configured OPS_TOKEN. */
export function opsAuthorized(provided: string | null | undefined): boolean {
  const token = process.env.OPS_TOKEN;
  if (!token) return false; // nothing configured → detail stays gated
  if (!provided) return false;
  const a = Buffer.from(String(provided).slice(0, 128));
  const b = Buffer.from(token.slice(0, 128));
  return a.length === b.length && timingSafeEqual(a, b);
}

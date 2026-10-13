// Shared in-memory rate limiter for public API routes — NAMESPACED.
// Same accepted tradeoff as the leaderboard limiter (2026-10-06): per
// serverless instance, not global — generous for humans, hostile to naive
// floods.
//
// G5 prelaunch hardening (129-a #6):
// - NAMESPACES: every route family gets its own counter namespace, so the
//   inline per-route limiter copies (which each carried their own map + their
//   own memory-guard bug) share ONE implementation without cross-contaminating
//   each other's budgets.
// - MEMORY GUARD EVICTS instead of clearing: the old `map.clear()` handed an
//   attacker rotating ≥5k aliases a permanent global counter reset. Eviction
//   drops the LEAST-RECENTLY-USED buckets only (Map insertion order is
//   refreshed on every touch), so honest clients keep their budgets.
const buckets = new Map<string, number[]>();
const MAX_TRACKED = 5_000;

export function rateLimited(
  ns: string,
  ip: string,
  limit: number,
  windowMs = 60_000,
): boolean {
  const now = Date.now();
  const key = `${ns}:${ip}`;
  const arr = (buckets.get(key) ?? []).filter((t) => now - t < windowMs);
  if (arr.length >= limit) {
    buckets.delete(key); // re-insert at the tail: active buckets outlive idle ones
    buckets.set(key, arr);
    return true;
  }
  arr.push(now);
  buckets.delete(key);
  buckets.set(key, arr); // refresh insertion order — Map iteration = LRU first
  while (buckets.size > MAX_TRACKED) {
    const oldest = buckets.keys().next().value;
    if (oldest === undefined) break;
    buckets.delete(oldest);
  }
  return false;
}

/** Best-effort client IP. x-real-ip FIRST: on Vercel it is set by the platform
 *  to the actual client address, while the leftmost x-forwarded-for hop is
 *  client-controlled and spoofable on every non-Vercel host (G5 129-a #6). */
export function clientIp(req: Request): string {
  const real = req.headers.get("x-real-ip");
  if (real) return real.split(",")[0].trim();
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return "unknown";
}

/** G5 (129-a #11): reject oversized bodies BEFORE parsing. Vercel caps request
 *  bodies (~4.5 MB) but a self-hosted `next start` standalone server has NO
 *  cap — `await req.json()` on an unbounded stream is an OOM vector. Every
 *  JSON POST lane calls this first. 64 KB is far above any legit payload this
 *  app accepts (largest: score submissions — a few hundred bytes). */
export function bodyTooLarge(req: Request, maxBytes = 64_000): boolean {
  const len = Number(req.headers.get("content-length") ?? 0);
  return Number.isFinite(len) && len > maxBytes;
}

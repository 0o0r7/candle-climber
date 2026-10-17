// Shared in-memory per-IP rate limiter for public API routes.
// Same accepted tradeoff as the leaderboard limiter (2026-10-06): per
// serverless instance, not global — generous for humans, hostile to naive
// floods. Memory-guarded (map cleared past 5,000 tracked IPs).
const buckets = new Map<string, number[]>();

export function rateLimited(ip: string, limit: number, windowMs = 60_000): boolean {
  const now = Date.now();
  const arr = (buckets.get(ip) ?? []).filter((t) => now - t < windowMs);
  if (arr.length >= limit) {
    buckets.set(ip, arr);
    return true;
  }
  arr.push(now);
  buckets.set(ip, arr);
  if (buckets.size > 5000) buckets.clear(); // crude memory guard
  return false;
}

/** Best-effort client IP from proxy headers (Vercel sets x-forwarded-for). */
export function clientIp(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return req.headers.get("x-real-ip") ?? "unknown";
}

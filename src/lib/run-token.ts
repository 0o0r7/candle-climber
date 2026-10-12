// Run-token — HMAC attestation that a leaderboard submission was played on the
// server-pinned daily terrain. Issued by GET /api/candles, verified by
// POST /api/leaderboard.
//
// Design (workstream W1 "integrity & determinism"):
// - payload = base64url(JSON{symbol, date, count, h}) where h is a short
//   sha256 fingerprint of the exact candle JSON, so a token only validates
//   against the terrain it was issued for.
// - NO iat: the token is deterministic for the same terrain (byte-identical
//   responses stay byte-identical). Expiry is derived from the token date:
//   a token is accepted on its own UTC date and the following one only.
// - The secret is never logged or exposed; the dev default keeps local dev
//   working without any env setup.
import { createHash, createHmac, timingSafeEqual } from "node:crypto";
// P3.5: the interval whitelist lives in the game's level-source (single
// authority shared by client + server routes).
import { INTERVALS, type GameInterval } from "@/game/cc/level-source";

export interface RunTokenPayload {
  symbol: string;
  date: string; // UTC YYYY-MM-DD the terrain was seeded for
  count: number; // number of closed candles that shaped the terrain
  h: string; // sha256(candle JSON string).slice(0, 16) — terrain fingerprint
  interval: string; // P3.5: terrain timeframe ("1w" default; legacy tokens without it verify as "1w")
}

// Delivery hardening (2026-10-13): the committed dev default must NEVER be
// the signing secret on a production deploy — this repo is public, so a
// fail-open default makes every integrity gate forgeable by anyone who can
// read it. On production (Vercel production env) a missing secret returns
// null: /api/candles serves terrain honestly WITHOUT a run token (unscored
// by construction), and verifyRunToken() rejects everything — fail closed,
// no crash, the gap is loud in /ops and Sentry.
function isProdDeploy(): boolean {
  // evaluated per call (env can be mutated in tests / runtime)
  return process.env.NODE_ENV === "production" && process.env.VERCEL_ENV === "production";
}

/** The signing secret, or null when production runs without one (fail closed). */
export function getRunTokenSecret(): string | null {
  const configured =
    process.env.RUN_TOKEN_SECRET ||
    process.env.MONGODB_URI ||
    process.env.DATABASE_URL; // deployment-specific fallback (this repo's Mongo/postgres var)
  if (configured) return configured;
  if (isProdDeploy()) return null;
  return "cc-local-dev-secret"; // local dev / preview convenience only
}

export function signRunToken(symbol: string, date: string, count: number, candleJson: string, interval: GameInterval = "1w"): string {
  const secret = getRunTokenSecret();
  if (!secret) return ""; // prod without secret: no token — terrain serves unscored
  const h = createHash("sha256").update(candleJson).digest("hex").slice(0, 16);
  const payload = Buffer.from(JSON.stringify({ symbol, date, count, h, interval })).toString("base64url");
  const sig = createHmac("sha256", secret).update(payload).digest("base64url");
  return `${payload}.${sig}`;
}

/** Returns the verified payload, or null when the token is malformed/forged
 *  (also null — fail closed — when production runs without a signing secret). */
export function verifyRunToken(token: unknown): RunTokenPayload | null {
  if (!getRunTokenSecret()) return null;
  if (typeof token !== "string") return null;
  const parts = token.split(".");
  if (parts.length !== 2) return null;
  const [payload, sig] = parts;
  if (!payload || !sig) return null;

  const expected = createHmac("sha256", getRunTokenSecret() as string).update(payload).digest();
  const given = Buffer.from(sig, "base64url");
  if (given.length !== expected.length || !timingSafeEqual(given, expected)) return null;

  let obj: unknown;
  try {
    obj = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
  } catch {
    return null;
  }
  if (typeof obj !== "object" || obj === null) return null;
  const p = obj as Record<string, unknown>;
  if (typeof p.symbol !== "string" || !p.symbol || p.symbol.length > 12) return null;
  if (typeof p.date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(p.date)) return null;
  if (typeof p.count !== "number" || !Number.isInteger(p.count) || p.count <= 0 || p.count > 10_000) return null;
  if (typeof p.h !== "string" || !/^[0-9a-f]{16}$/.test(p.h)) return null;
  // P3.5: interval is optional in the payload for legacy-token compatibility;
  // when present it MUST be a whitelisted timeframe (anything else = forged).
  let interval: string = "1w";
  if (p.interval !== undefined) {
    if (typeof p.interval !== "string" || !(INTERVALS as readonly string[]).includes(p.interval)) return null;
    interval = p.interval;
  }
  return { symbol: p.symbol, date: p.date, count: p.count, h: p.h, interval: interval as GameInterval };
}

/** Expired when the current UTC date is past token date + 1 day (pure date-string compare). */
export function isTokenStale(tokenDate: string, now: Date = new Date()): boolean {
  const lastValid = new Date(Date.parse(tokenDate + "T00:00:00Z") + 86_400_000)
    .toISOString()
    .slice(0, 10);
  return now.toISOString().slice(0, 10) > lastValid;
}

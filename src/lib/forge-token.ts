// Signal Forge run-token — HMAC attestation that a Forge submission was played
// on the server-pinned daily arena (Phase 1 integrity).
//
// Design mirrors the Candle Climber run token (src/lib/run-token.ts) but is
// DOMAIN-SEPARATED: the HMAC key is derived as `<secret>:forge`, so a cc token
// can never be replayed into the Forge board and a Forge token can never be
// replayed into the classic board. Same secret source, same dev/prod posture
// (fail closed on production without a configured secret).
//
// payload = base64url(JSON{symbol, date, count, h})
//   h = sha256(candle JSON).slice(0,16) — the exact arena-seed fingerprint.
// The mutation is NOT carried: it is a pure function of (date, symbol)
// (src/game/vg/mutations.ts), so the server RE-DERIVES it and validates the
// client's claimed mutation against it (anti-cheat: mutation/seed validation).
import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { getRunTokenSecret } from "@/lib/run-token";

export interface ForgeTokenPayload {
  symbol: string;
  date: string; // UTC YYYY-MM-DD the arena was seeded for
  count: number; // number of closed candles that shaped the arena
  h: string; // sha256(candle JSON string).slice(0, 16) — arena fingerprint
}

/** Domain-separated signing key, or null when production runs without a secret. */
function forgeSecret(): string | null {
  const base = getRunTokenSecret();
  return base ? base + ":forge" : null;
}

export function signForgeToken(symbol: string, date: string, count: number, candleJson: string): string {
  const secret = forgeSecret();
  if (!secret) return ""; // prod without secret: no token — arena serves unscored
  const h = createHash("sha256").update(candleJson).digest("hex").slice(0, 16);
  const payload = Buffer.from(JSON.stringify({ symbol, date, count, h })).toString("base64url");
  const sig = createHmac("sha256", secret).update(payload).digest("base64url");
  return `${payload}.${sig}`;
}

/** Returns the verified payload, or null when the token is malformed/forged
 *  (also null — fail closed — when production runs without a signing secret). */
export function verifyForgeToken(token: unknown): ForgeTokenPayload | null {
  const secret = forgeSecret();
  if (!secret) return null;
  if (typeof token !== "string") return null;
  const parts = token.split(".");
  if (parts.length !== 2) return null;
  const [payload, sig] = parts;
  if (!payload || !sig) return null;

  const expected = createHmac("sha256", secret).update(payload).digest();
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
  return { symbol: p.symbol, date: p.date, count: p.count, h: p.h };
}

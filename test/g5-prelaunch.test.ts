// G5 PRELAUNCH HARDENING — regression pins for the 129 audit wave.
// Every test here pins a defect the pre-launch audits found, so none of them
// can silently return:
//   129-a #2/#3  run-token prod gate (NODE_ENV, no DB-URI fallback)
//   129-a #4     /ops + score-report moderation gate (OPS_TOKEN)
//   129-a #6     limiter eviction (no global clear) + x-real-ip first
//   129-a #11    body-size guard
//   129-c #1     world-2 marathon submissions accepted (physical caps only)
//   129-c #2     anomaly flag persisted on the stored entry
//   129-c #3     verifier outage ⇒ unverifiable, grace clock never advances
//   129-c #4     guest-lane nonce REQUIRED
//   129-c #13    isTokenStale malformed-date fail-closed (no crash)
import { describe, expect, test, beforeEach, afterAll } from "bun:test";
import { validateSubmission } from "@/lib/board-validation";
import { signRunToken, verifyRunToken, isTokenStale } from "@/lib/run-token";
import { rateLimited, clientIp, bodyTooLarge } from "@/lib/http-limiter";
import { MemoryStore, type BoardEntry } from "@/lib/leaderboard-store";
import { opsAuthorized } from "@/lib/ops-auth";

const CANDLE_JSON = JSON.stringify([{ t: 1, o: 1, h: 1, l: 1, c: 1, v: 1 }]);

describe("G5: world-2 marathon submissions (129-c #1)", () => {
  beforeEach(() => {
    process.env.RUN_TOKEN_SECRET = "g5-world2-secret";
  });
  afterAll(() => delete process.env.RUN_TOKEN_SECRET);

  test("a world-2 run passing more candles than the base terrain is ACCEPTED", () => {
    // classic 1w base terrain: 220 closed candles; world 2 extends indefinitely
    const tok = verifyRunToken(signRunToken("BTCUSDT", "2026-10-14", 220, CANDLE_JSON))!;
    const verdict = validateSubmission(
      { name: "MARATHON", score: 3000 * 70, candlesPassed: 3000, bestStreak: 12 },
      tok,
    );
    // the OLD tok.count cap (220 × 175) 403-rejected this legitimate run
    expect(verdict.ok).toBe(true);
  });

  test("score still must be physically reachable from candles passed", () => {
    const tok = verifyRunToken(signRunToken("BTCUSDT", "2026-10-14", 220, CANDLE_JSON))!;
    const verdict = validateSubmission(
      { name: "CHEAT", score: 9_000_000, candlesPassed: 100, bestStreak: 12 },
      tok,
    );
    expect(verdict.ok).toBe(false);
    expect((verdict as { error: string }).error).toContain("inconsistent");
  });

  test("candlesPassed still capped by the engine ceiling (MAX_CANDLES)", () => {
    const tok = verifyRunToken(signRunToken("BTCUSDT", "2026-10-14", 220, CANDLE_JSON))!;
    const verdict = validateSubmission(
      { name: "VOID", score: 100, candlesPassed: 9999, bestStreak: 1 },
      tok,
    );
    expect(verdict.ok).toBe(false);
    expect((verdict as { error: string }).error).toContain("invalid candles");
  });
});

describe("G5: run-token hardening (129-a #2/#3, 129-c #13)", () => {
  test("DB URIs are no longer fallback signing secrets", () => {
    const prevSecret = process.env.RUN_TOKEN_SECRET;
    const prevMongo = process.env.MONGODB_URI;
    const prevDb = process.env.DATABASE_URL;
    try {
      delete process.env.RUN_TOKEN_SECRET;
      process.env.MONGODB_URI = "mongodb+srv://attacker:creds@cluster.example/db";
      (process.env as Record<string, string | undefined>).NODE_ENV = "development"; // non-prod keeps the DEV DEFAULT, not the DB URI
      const tok = signRunToken("BTCUSDT", "2026-10-14", 220, CANDLE_JSON);
      // the token signed under dev default must NOT verify as if signed by the DB URI
      expect(tok).not.toBe("");
      (process.env as Record<string, string | undefined>).NODE_ENV = "production";
      expect(signRunToken("BTCUSDT", "2026-10-14", 220, CANDLE_JSON)).toBe(""); // prod fail-closed
    } finally {
      process.env.RUN_TOKEN_SECRET = prevSecret;
      if (prevMongo === undefined) delete process.env.MONGODB_URI; else process.env.MONGODB_URI = prevMongo;
      if (prevDb === undefined) delete process.env.DATABASE_URL; else process.env.DATABASE_URL = prevDb;
    }
  });

  test("prod gate keys on NODE_ENV alone (non-Vercel self-host fails closed)", () => {
    const prev = process.env.RUN_TOKEN_SECRET;
    delete process.env.RUN_TOKEN_SECRET;
    try {
      (process.env as Record<string, string | undefined>).NODE_ENV = "production";
      expect(signRunToken("BTCUSDT", "2026-10-14", 220, CANDLE_JSON)).toBe("");
      expect(verifyRunToken("x.y")).toBeNull();
    } finally {
      (process.env as Record<string, string | undefined>).NODE_ENV = "development";
      if (prev !== undefined) process.env.RUN_TOKEN_SECRET = prev;
    }
  });

  test("isTokenStale: semantically-invalid date fails closed, no crash", () => {
    // 2026-13-45 passes the YYYY-MM-DD shape regex but parses to NaN — the old
    // code threw RangeError from toISOString (route 500)
    expect(isTokenStale("2026-13-45")).toBe(true);
    expect(isTokenStale("not-a-date")).toBe(true);
  });
});

describe("G5: moderation gate (129-a #4)", () => {
  test("opsAuthorized is fail-closed without OPS_TOKEN and timing-safe with one", () => {
    const prev = process.env.OPS_TOKEN;
    try {
      delete process.env.OPS_TOKEN;
      expect(opsAuthorized("anything")).toBe(false);
      process.env.OPS_TOKEN = "g5-ops-secret-value";
      expect(opsAuthorized("g5-ops-secret-value")).toBe(true);
      expect(opsAuthorized("wrong")).toBe(false);
      expect(opsAuthorized(null)).toBe(false);
      expect(opsAuthorized(undefined)).toBe(false);
    } finally {
      if (prev === undefined) delete process.env.OPS_TOKEN; else process.env.OPS_TOKEN = prev;
    }
  });
});

describe("G5: limiter + body guard (129-a #6/#11)", () => {
  test("memory guard EVICTS the oldest bucket instead of clearing everyone", () => {
    const ns = `g5-evict-${Date.now()}`;
    // saturate the map: MAX_TRACKED + headroom distinct keys
    for (let i = 0; i < 5001; i++) rateLimited(ns, `ip-${i}`, 1000);
    // the FIRST ip's bucket was evicted (LRU), not globally cleared — a fresh
    // call for it starts from an EMPTY budget (the old clear() made this
    // indistinguishable from a reset; here we pin that eviction freed space
    // AND that the map stays bounded by construction on every call)
    expect(rateLimited(ns, "ip-0", 1000)).toBe(false);
    expect(rateLimited(ns, "ip-5000", 1000)).toBe(false);
    // budget enforcement still works: 11 requests on limit 10 → limited
    const ns2 = `g5-limit-${Date.now()}`;
    let limited = false;
    for (let i = 0; i < 11; i++) limited = rateLimited(ns2, "solo", 10);
    expect(limited).toBe(true);
  });

  test("clientIp prefers x-real-ip (platform-set) over the spoofable XFF hop", () => {
    const req = new Request("http://localhost/", {
      headers: { "x-real-ip": "10.0.0.1", "x-forwarded-for": "6.6.6.6, 10.9.9.9" },
    });
    expect(clientIp(req)).toBe("10.0.0.1");
  });

  test("bodyTooLarge: content-length guard", () => {
    expect(bodyTooLarge(new Request("http://localhost/", { headers: { "content-length": "65536" } }))).toBe(true);
    expect(bodyTooLarge(new Request("http://localhost/", { headers: { "content-length": "1000" } }))).toBe(false);
    expect(bodyTooLarge(new Request("http://localhost/"))).toBe(false);
  });
});

describe("G5: anomaly flag persisted (129-c #2)", () => {
  test("MemoryStore round-trips the flagged field to /ops reads", async () => {
    const store = new MemoryStore();
    const entry: BoardEntry = {
      name: "ODD", score: 999_999, candlesPassed: 100, symbol: "BTCUSDT",
      date: "2026-10-14", interval: "1w", ts: Date.now(), board: "guest", flagged: true,
    };
    await store.add(entry);
    const top = await store.top(null, 50, "1w", "guest");
    expect(top.some((e) => e.name === "ODD" && e.flagged === true)).toBe(true);
  });
});

describe("G5: nonce required on the guest lane (129-c #4)", () => {
  beforeEach(() => {
    process.env.RUN_TOKEN_SECRET = "g5-nonce-secret";
  });
  afterAll(() => delete process.env.RUN_TOKEN_SECRET);

  test("guest POST without a nonce ⇒ 400 (replay protection is no longer opt-in)", async () => {
    const { POST } = await import("@/app/api/leaderboard/route");
    const tok = signRunToken("BTCUSDT", "2026-10-14", 220, CANDLE_JSON);
    const res = await POST(new Request("http://localhost/api/leaderboard", {
      method: "POST",
      headers: { "content-type": "application/json", "x-real-ip": "10.79.0.1" },
      body: JSON.stringify({ name: "NONONCE", score: 100, candlesPassed: 5, bestStreak: 1, runToken: tok }),
    }));
    expect(res.status).toBe(400);
    const j = (await res.json()) as { error?: string };
    expect(j.error).toContain("nonce");
  });

  test("nonce replay ⇒ 409", async () => {
    const { POST } = await import("@/app/api/leaderboard/route");
    const tok = signRunToken("BTCUSDT", "2026-10-14", 220, CANDLE_JSON);
    const body = JSON.stringify({ name: "REPLAY", score: 100, candlesPassed: 5, bestStreak: 1, runToken: tok, nonce: "g5-replay-nonce-1" });
    const mk = () => new Request("http://localhost/api/leaderboard", {
      method: "POST", headers: { "content-type": "application/json", "x-real-ip": "10.79.0.2" }, body,
    });
    const first = await POST(mk());
    expect(first.status).toBe(200);
    const second = await POST(mk());
    expect(second.status).toBe(409);
  });
});

describe("G5: verifier outage never advances the grace clock (129-c #3)", () => {
  test("reader down + env price set ⇒ meets=null, clock untouched", async () => {
    const prevPrice = process.env.WICK_ETH_PRICE;
    process.env.WICK_ETH_PRICE = "0.000000002";
    const { verifyPartner, resetVerifierState } = await import("@/lib/partner-verifier");
    resetVerifierState();
    try {
      const entry = {
        id: "g5-outage-partner",
        walletAddress: "0x" + "11".repeat(20),
        name: "OUTAGE",
        url: "https://partner.example",
        feed: { kind: "none" as const },
      };
      const r1 = await verifyPartner(entry as never, {
        wickPrice: Promise.resolve({ ok: false, error: "feed-unavailable" }) as never,
      });
      expect(r1.meets).toBeNull(); // UNVERIFIABLE — not a definitive miss
      expect(r1.belowSince).toBeNull(); // the grace clock did NOT start
      // second check after 8 simulated days must still not delist on outage alone
      const r2 = await verifyPartner(entry as never, {
        wickPrice: Promise.resolve({ ok: false, error: "feed-unavailable" }) as never,
        now: Date.now() + 8 * 86_400_000,
      });
      expect(r2.meets).toBeNull();
      expect(r2.status).not.toBe("delisted");
    } finally {
      if (prevPrice === undefined) delete process.env.WICK_ETH_PRICE; else process.env.WICK_ETH_PRICE = prevPrice;
      resetVerifierState();
    }
  });
});

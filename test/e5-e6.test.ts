/// <reference types="bun-types" />
// E5.5 referral attribution + E6.2 graduation gate / E6.1 freeze — W5 pins.
// Route tests drive the REAL handlers + real memory stores (no mocks), same
// harness discipline as official-proof-route.test.ts.
import { describe, test, expect, beforeAll, afterAll } from "bun:test";
import { POST as LB_POST } from "@/app/api/leaderboard/route";
import { POST as PR_POST } from "@/app/api/practice/route";
import { POST as PRED_POST } from "@/app/api/prediction/route";
import { POST as VAULT_POST } from "@/app/api/vault/route";
import { sanitizeRef, validateSubmission } from "@/lib/board-validation";
import { MemoryStore, type BoardEntry } from "@/lib/leaderboard-store";
import { MemoryWeightsStore, recordClassicRun } from "@/lib/weights-store";
import { getWeights } from "@/lib/weights-store";
import { signRunToken, verifyRunToken } from "@/lib/run-token";
import { gradFromInputs, POST_GRAD_LANES, weightsFrozen } from "@/lib/graduation";
import type { RunTokenPayload } from "@/lib/run-token";

const TODAY = new Date().toISOString().slice(0, 10);
const PAST = new Date(Date.now() - 3 * 86_400_000).toISOString().slice(0, 10);
const CANDLES = JSON.stringify([{ t: 1, o: 2, h: 3, l: 1, c: 2 }]);
const TOK = { symbol: "ETHUSDT", count: 220, date: TODAY, interval: "1w" } as const;

const tok = (date: string) => ({
  symbol: TOK.symbol,
  date,
  interval: "1w",
  count: 220,
  iat: Math.floor(Date.now() / 1000),
}) as unknown as RunTokenPayload; // shape for validateSubmission's token input

/* ------------------------------ E5.5 sanitizeRef ------------------------------ */

describe("E5.5 sanitizeRef — opaque attribution stamp", () => {
  test("accepts the bounded URL-safe alphabet (1–24)", () => {
    expect(sanitizeRef("alice")).toBe("alice");
    expect(sanitizeRef("A-9_z")).toBe("A-9_z");
    expect(sanitizeRef("x".repeat(24))).toBe("x".repeat(24));
  });
  test("rejects everything else — omitted, never truncated into garbage", () => {
    expect(sanitizeRef("")).toBeUndefined();
    expect(sanitizeRef("x".repeat(25))).toBeUndefined();
    expect(sanitizeRef("bad space")).toBeUndefined();
    expect(sanitizeRef("<script>")).toBeUndefined();
    expect(sanitizeRef("emoji🙂")).toBeUndefined();
    expect(sanitizeRef(null)).toBeUndefined();
    expect(sanitizeRef(42)).toBeUndefined();
  });
  test("ref is metadata-only: stamped on the entry, lane/verdict untouched", () => {
    const good = validateSubmission({ name: "R", score: 10, candlesPassed: 2, bestStreak: 1, ref: "alice" }, tok(TODAY));
    expect(good.ok).toBe(true);
    if (good.ok) {
      expect(good.entry.ref).toBe("alice");
      expect(good.entry.board).toBe("guest"); // no wallet ⇒ guest, ref changed nothing
    }
    const bad = validateSubmission({ name: "R", score: 10, candlesPassed: 2, ref: "not valid!" }, tok(TODAY));
    expect(bad.ok).toBe(true);
    if (bad.ok) expect(bad.entry.ref).toBeUndefined(); // fail-open omit
  });
});

/* ------------------------- E4.1 memory-store aggregates ------------------------- */

describe("E4.1 memory aggregates — counts only", () => {
  test("board laneStats: lanes, distincts, today, topRefs (7d window)", async () => {
    const s = new MemoryStore();
    const now = Date.now();
    const mk = (over: Partial<BoardEntry>): BoardEntry => ({
      name: "N", score: 1, candlesPassed: 1, symbol: "ETHUSDT", date: TODAY, ts: now, ...over,
    });
    await s.add(mk({ name: "a", ref: "alice" }));
    await s.add(mk({ name: "a", ref: "alice" })); // same name again, same ref
    await s.add(mk({ name: "b" })); // no ref
    await s.add(mk({ name: "w", board: "official", wallet: "0xabc", ref: "bob" }));
    await s.add(mk({ name: "old", ref: "ancient", ts: now - 9 * 86_400_000 })); // outside window
    const st = await s.laneStats(now);
    expect(st.guestRows).toBe(4); // legacy rows read as guest — including the 9d-old one
    expect(st.officialRows).toBe(1);
    expect(st.distinctGuests).toBe(3); // a, b, old
    expect(st.distinctWallets).toBe(1);
    expect(st.todayGuest).toBe(4);
    expect(st.todayOfficial).toBe(1);
    expect(st.topRefs).toEqual([
      { ref: "alice", count: 2 },
      { ref: "bob", count: 1 },
    ]); // "ancient" excluded by the 7d window
  });

  test("weights stats(): rows, identities, wallets, points, today/week", async () => {
    const s = new MemoryWeightsStore();
    const now = Date.now();
    const today = new Date(now).toISOString().slice(0, 10);
    await s.recordRun({ name: "a", date: today, streakDays: 1, points: 1, wallet: "0xaaa", ts: now });
    await s.recordRun({ name: "b", date: PAST, streakDays: 1, points: 1, wallet: null, ts: now });
    await s.addPractice("a", today, "0xaaa", now);
    const st = await s.stats(now);
    expect(st.runRows).toBe(2);
    expect(st.eventRows).toBe(1);
    expect(st.identities).toBe(2);
    expect(st.linkedWallets).toBe(1);
    expect(st.totalPoints).toBe(2.5); // 1 + 1 + 0.5
    expect(st.todayRuns).toBe(1);
    expect(st.weekRuns).toBe(2); // PAST is within 7d of now
  });
});

/* ---------------------------- E6.2 graduation gate ---------------------------- */

describe("E6.2 graduation gate — fail-closed by construction", () => {
  test("env override wins", () => {
    expect(gradFromInputs("1", false)).toEqual({ graduated: true, source: "env-override" });
    expect(gradFromInputs("true", false)).toEqual({ graduated: true, source: "env-override" });
  });
  test("pad-api positive graduates; pad-api negative stays pre-grad", () => {
    expect(gradFromInputs(undefined, true)).toEqual({ graduated: true, source: "pad-api" });
    expect(gradFromInputs(undefined, false)).toEqual({ graduated: false, source: "pad-api" });
  });
  test("API down / unknown ⇒ DEFAULT PRE-GRAD (an outage never graduates)", () => {
    expect(gradFromInputs(undefined, null)).toEqual({ graduated: false, source: "default-pre-grad" });
    expect(gradFromInputs("0", null).graduated).toBe(false);
  });
  test("post-grad lane registry: staged now, activated only at graduation", () => {
    expect(POST_GRAD_LANES.map((l) => l.id)).toEqual(["mirror", "spend-burn", "tournaments", "burn-counter-hud"]);
    for (const l of POST_GRAD_LANES) expect(l.status).toBe("staged");
  });
  test("weightsFrozen reads the env at call time", () => {
    delete process.env.WEIGHTS_FROZEN;
    expect(weightsFrozen()).toBe(false);
    process.env.WEIGHTS_FROZEN = "1";
    expect(weightsFrozen()).toBe(true);
    delete process.env.WEIGHTS_FROZEN;
    expect(weightsFrozen()).toBe(false);
  });
});

/* ----------------------- E6.1 freeze — REAL route behavior ----------------------- */

describe("E6.1 WEIGHTS_FROZEN — honest pause across the four lanes", () => {
  let TOK_TODAY = "";
  let TOK_PAST = "";
  beforeAll(() => {
    process.env.RUN_TOKEN_SECRET = "e5e6-test-secret";
    process.env.WEIGHTS_FROZEN = "1";
    TOK_TODAY = signRunToken(TOK.symbol, TODAY, TOK.count, CANDLES);
    TOK_PAST = signRunToken(TOK.symbol, PAST, TOK.count, CANDLES);
  });
  afterAll(() => {
    delete process.env.RUN_TOKEN_SECRET;
    delete process.env.WEIGHTS_FROZEN;
  });

  const post = async (url: string, body: Record<string, unknown>) => {
    const h = { "content-type": "application/json" };
    if (url.endsWith("/api/practice")) {
      const r = await PR_POST(new Request("http://localhost" + url, { method: "POST", headers: h, body: JSON.stringify(body) }));
      return { status: r.status, json: (await r.json()) as Record<string, unknown> };
    }
    if (url.endsWith("/api/prediction")) {
      const r = await PRED_POST(new Request("http://localhost" + url, { method: "POST", headers: h, body: JSON.stringify(body) }));
      return { status: r.status, json: (await r.json()) as Record<string, unknown> };
    }
    if (url.endsWith("/api/vault")) {
      const r = await VAULT_POST(new Request("http://localhost" + url, { method: "POST", headers: h, body: JSON.stringify(body) }));
      return { status: r.status, json: (await r.json()) as Record<string, unknown> };
    }
    const r = await LB_POST(new Request("http://localhost" + url, { method: "POST", headers: h, body: JSON.stringify(body) }));
    return { status: r.status, json: (await r.json()) as Record<string, unknown> };
  };

  test("practice: 503 + honest frozen payload (token still validated first)", async () => {
    const bad = await post("/api/practice", { runToken: "forged", name: "X" });
    expect(bad.status).toBe(403); // integrity gate comes FIRST
    const ok = await post("/api/practice", { runToken: TOK_PAST, name: "X" });
    expect(ok.status).toBe(503);
    expect(ok.json.frozen).toBe(true);
    expect(String(ok.json.error)).toContain("still scores on the board");
  });

  test("prediction: 503 + honest frozen payload", async () => {
    const ok = await post("/api/prediction", { name: "X", call: { dir: "up", vol: "mid", tail: "none" } });
    expect(ok.status).toBe(503);
    expect(ok.json.frozen).toBe(true);
  });

  test("vault: 503 + honest frozen payload (before the holder check)", async () => {
    const ok = await post("/api/vault", { runToken: TOK_TODAY, name: "X", address: "0x0000000000000000000000000000000000000000" });
    expect(ok.status).toBe(503); // frozen beats tier — no RPC call needed
    expect(ok.json.frozen).toBe(true);
  });

  test("leaderboard: the SCORE still saves and ranks; only the ledger write is skipped", async () => {
    const before = await getWeights().stats(Date.now());
    const r = await post("/api/leaderboard", {
      name: "FROZENRUN", score: 100, candlesPassed: 5, bestStreak: 1, runToken: TOK_TODAY, ref: "freeze-test",
    });
    expect(r.status).toBe(200);
    expect(r.json.ok).toBe(true);
    expect(r.json.weightsFrozen).toBe(true); // honest flag — the UI can say why no weights moved
    const after = await getWeights().stats(Date.now());
    expect(after.runRows).toBe(before.runRows); // ledger untouched during the freeze
  });
});

describe("E6.1 unfreeze — the same POST banks weights again", () => {
  const body = {
    name: "BANKED", score: 100, candlesPassed: 5, bestStreak: 1, runToken: "",
  };
  beforeAll(() => {
    process.env.RUN_TOKEN_SECRET = "e5e6-test-secret";
    body.runToken = signRunToken(TOK.symbol, TODAY, TOK.count, CANDLES);
  });
  afterAll(() => delete process.env.RUN_TOKEN_SECRET);

  test("no freeze ⇒ weightsFrozen flag absent + ledger row appears", async () => {
    const before = await getWeights().stats(Date.now());
    const r = await LB_POST(
      new Request("http://localhost/api/leaderboard", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      }),
    );
    const j = (await r.json()) as Record<string, unknown>;
    expect(j.ok).toBe(true);
    expect(j.weightsFrozen).toBeUndefined();
    // fire-and-forget: poll briefly for the ledger write to land
    let after = await getWeights().stats(Date.now());
    for (let i = 0; i < 20 && after.runRows === before.runRows; i++) {
      await new Promise((res) => setTimeout(res, 25));
      after = await getWeights().stats(Date.now());
    }
    expect(after.runRows).toBe(before.runRows + 1);
    expect(after.todayRuns).toBe(before.todayRuns + 1);
  });

  test("token sanity: the minted token really verifies for TODAY", () => {
    const v = verifyRunToken(body.runToken);
    expect(v?.date).toBe(TODAY);
    expect(v?.interval).toBe("1w");
  });

  test("recordClassicRun purity pin: non-today dates bank nothing (spec §7.2)", async () => {
    const s = await recordClassicRun("NOBANK", PAST, null, Date.now());
    expect(s).toBeNull();
  });
});

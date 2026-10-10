/// <reference types="bun-types" />
// LAW 1.2 Option B (dated note 2026-10-10) — contract tests for the wallet
// identity layer (bun test, zero deps). Pins the promises the build makes:
//  1. TWO LANES, NEVER MIXED — guest (walletless, legacy rows included) and
//     official (wallet-bound) boards are isolated in both rank math and top().
//  2. BEST RUN PER WALLET — the official lane keeps one record per wallet per
//     date+interval; a worse repeat never overwrites it, a better one replaces.
//  3. HONEST STAMPING — the lane is decided ONLY by the normalized wallet;
//     a malformed address degrades to guest (play is never blocked, LAW 1.2).
//     (Route-level lane authority — official lane additionally requires a
//     VALID personal_sign ownership proof — is pinned by
//     test/official-proof-route.test.ts.)
//  4. SEASON SCAFFOLDING — official records are stamped with seasonOf(date).
import { describe, test, expect, beforeAll, afterAll } from "bun:test";
import { signRunToken, verifyRunToken, type RunTokenPayload } from "@/lib/run-token";
import { validateSubmission } from "@/lib/board-validation";
import { MemoryStore, type BoardEntry } from "@/lib/leaderboard-store";
import { seasonOf, currentSeason, SEASON_1_START } from "@/lib/seasons";
import { normalizeWallet } from "@/lib/weights";
import { shortAddress } from "@/lib/wallet";

const DATE = "2026-10-10"; // Season 1 opening day
const PRE_DATE = "2026-10-09"; // pre-season
const SYMBOL = "ETHUSDT";
const CANDLE_JSON = JSON.stringify([{ t: 1, o: 2, h: 3, l: 1, c: 2 }]);
const WALLET_A = "0xAbCdEf0123456789AbCdEf0123456789AbCdEf01";
const WALLET_B = "0x1111111111111111111111111111111111111111";

beforeAll(() => {
  process.env.RUN_TOKEN_SECRET = "ob-test-secret";
});
afterAll(() => {
  delete process.env.RUN_TOKEN_SECRET;
});

const row = (over: Partial<BoardEntry>): BoardEntry => ({
  name: "ANON",
  score: 100,
  candlesPassed: 10,
  symbol: SYMBOL,
  date: DATE,
  ts: 1,
  ...over,
});

describe("Option B — season scaffolding", () => {
  test("S1 opens on the adoption date (2026-10-10), everything before is pre-season", () => {
    expect(SEASON_1_START).toBe("2026-10-10");
    expect(seasonOf("2026-10-09")).toBeNull();
    expect(seasonOf("2026-10-10")).toBe("S1");
    expect(seasonOf("2027-05-01")).toBe("S1"); // still open — append-only registry
  });

  test("malformed dates never guess a season", () => {
    expect(seasonOf("garbage")).toBeNull();
    expect(seasonOf("")).toBeNull();
    expect(seasonOf("2026-13-99")).toBeNull();
  });

  test("currentSeason reads the UTC clock", () => {
    const ts = Date.parse("2026-10-10T00:00:01Z");
    expect(currentSeason(ts)).toBe("S1");
    expect(currentSeason(Date.parse("2026-10-09T23:59:59Z"))).toBeNull();
  });
});

describe("Option B — two lanes, never mixed (memory store)", () => {
  test("guest and official rows are isolated in top() — legacy rows are guest", async () => {
    const s = new MemoryStore();
    await s.add(row({ name: "LEGACY", score: 250 })); // pre-Option-B shape: no board field
    await s.add(row({ name: "GUEST", score: 300, board: "guest", wallet: null }));
    await s.add(row({ name: "OFF", score: 400, board: "official", wallet: WALLET_A.toLowerCase() }));

    const guest = await s.top(DATE, 50);
    expect(guest.map((e) => e.name)).toEqual(["GUEST", "LEGACY"]);
    const official = await s.top(DATE, 50, "1w", "official");
    expect(official.map((e) => e.name)).toEqual(["OFF"]);
    const all = await s.top(DATE, 50, "1w", "all");
    expect(all.map((e) => e.name)).toEqual(["OFF", "GUEST", "LEGACY"]);
  });

  test("rank math scopes to the entry's own lane", async () => {
    const s = new MemoryStore();
    await s.add(row({ name: "OFF1", score: 500, board: "official", wallet: WALLET_A.toLowerCase() }));
    // a 450-score guest run ranks #1 among guests — the 500 official row must not count
    expect(await s.add(row({ name: "G1", score: 450, board: "guest", wallet: null }))).toBe(1);
    // and the second official row ranks #2 — the 450 guest row must not count
    expect(await s.add(row({ name: "OFF2", score: 450, board: "official", wallet: WALLET_B.toLowerCase() }))).toBe(2);
    expect(await s.add(row({ name: "G2", score: 300, board: "guest", wallet: null }))).toBe(2);
  });
});

describe("Option B — best run per wallet (official lane)", () => {
  test("a worse repeat never overwrites the wallet's best; it reports the best's rank", async () => {
    const s = new MemoryStore();
    await s.add(row({ name: "A", score: 700, board: "official", wallet: WALLET_A.toLowerCase() }));
    await s.add(row({ name: "B", score: 800, board: "official", wallet: WALLET_B.toLowerCase() }));
    // same wallet returns with 600 — board keeps 700, rank reported is 2 (behind 800)
    expect(await s.add(row({ name: "A", score: 600, board: "official", wallet: WALLET_A.toLowerCase() }))).toBe(2);
    const top = await s.top(DATE, 50, "1w", "official");
    expect(top.map((e) => e.score)).toEqual([800, 700]);
    expect(top.filter((e) => e.wallet === WALLET_A.toLowerCase()).length).toBe(1);
  });

  test("a better run replaces the wallet's old record in place", async () => {
    const s = new MemoryStore();
    await s.add(row({ name: "A", score: 300, board: "official", wallet: WALLET_A.toLowerCase() }));
    await s.add(row({ name: "B", score: 500, board: "official", wallet: WALLET_B.toLowerCase() }));
    expect(await s.add(row({ name: "A", score: 900, board: "official", wallet: WALLET_A.toLowerCase() }))).toBe(1);
    const top = await s.top(DATE, 50, "1w", "official");
    expect(top.map((e) => e.score)).toEqual([900, 500]);
  });

  test("same wallet, different interval (or date) = separate records", async () => {
    const s = new MemoryStore();
    await s.add(row({ name: "A", score: 300, interval: "1w", board: "official", wallet: WALLET_A.toLowerCase() }));
    await s.add(row({ name: "A", score: 100, interval: "1h", board: "official", wallet: WALLET_A.toLowerCase() }));
    expect((await s.top(DATE, 50, "1w", "official")).length).toBe(1);
    expect((await s.top(DATE, 50, "1h", "official")).length).toBe(1);
    await s.add(row({ name: "A", score: 50, date: PRE_DATE, board: "official", wallet: WALLET_A.toLowerCase() }));
    expect((await s.top(PRE_DATE, 50, "1w", "official")).length).toBe(1);
  });

  test("the guest lane keeps legacy no-dedupe semantics", async () => {
    const s = new MemoryStore();
    await s.add(row({ name: "G", score: 100, board: "guest", wallet: null }));
    await s.add(row({ name: "G", score: 50, board: "guest", wallet: null }));
    expect((await s.top(DATE, 50)).length).toBe(2);
  });
});

describe("Option B — honest submission stamping (W5 core)", () => {
  test("valid wallet → official lane, lowercased wallet, season stamped", async () => {
    const tok = verifyRunToken(signRunToken(SYMBOL, DATE, 220, CANDLE_JSON)) as RunTokenPayload;
    const v = validateSubmission(
      { name: "W", score: 100, candlesPassed: 10, runToken: "x.y" },
      tok,
      1234,
      normalizeWallet(WALLET_A), // mixed-case address normalizes to lowercase
    );
    expect(v.ok).toBe(true);
    if (v.ok) {
      expect(v.entry.board).toBe("official");
      expect(v.entry.wallet).toBe(WALLET_A.toLowerCase());
      expect(v.entry.season).toBe("S1");
    }
  });

  test("no wallet (or a malformed one) → guest lane — play is never blocked", () => {
    const tok = verifyRunToken(signRunToken(SYMBOL, DATE, 220, CANDLE_JSON)) as RunTokenPayload;
    for (const bad of [undefined, "not-an-address", "0x123", 42, WALLET_A + "x"]) {
      const wallet = normalizeWallet(bad);
      const v = validateSubmission({ name: "W", score: 100, candlesPassed: 10, runToken: "x.y" }, tok, 1234, wallet);
      expect(v.ok).toBe(true);
      if (v.ok) {
        expect(v.entry.board).toBe("guest");
        expect(v.entry.wallet).toBeNull();
      }
    }
  });

  test("pre-season dates still score (guest), official stamp carries season null", () => {
    const tok = verifyRunToken(signRunToken(SYMBOL, PRE_DATE, 220, CANDLE_JSON)) as RunTokenPayload;
    const v = validateSubmission(
      { name: "W", score: 100, candlesPassed: 10, runToken: "x.y" },
      tok,
      1234,
      normalizeWallet(WALLET_A),
    );
    expect(v.ok).toBe(true);
    if (v.ok) {
      expect(v.entry.board).toBe("official");
      expect(v.entry.season).toBeNull(); // pre-season: never an official S1 record
    }
  });
});

describe("Option B — public reads mask wallets", () => {
  test("shortAddress: chip-style short form, invalid strings pass through untouched", () => {
    expect(shortAddress(WALLET_A)).toBe("0xAbCd…Ef01");
    expect(shortAddress("0x123")).toBe("0x123");
  });
});

/// <reference types="bun-types" />
// Side 4 (career boards) — contract tests for topCareer (bun test, zero deps).
// Pins the promises the build makes:
//  1. BEST PER IDENTITY — guest career dedupes by case-folded typed name;
//     official career dedupes by wallet (two names, one wallet = one row).
//  2. FIRST TO SET IT — equal scores keep the EARLIEST run (ts tiebreak).
//  3. LANES NEVER MIX (LAW 1.2 Option B) — a guest row never appears on the
//     official career board and vice versa.
//  4. SEASON WINDOW — since=SEASON_1_START excludes pre-season dates (ISO
//     lexical compare), all-time (since=null) keeps everything.
//  5. TIMEFRAME SEPARATION (P3.5) — career boards are per-interval; legacy
//     rows without `interval` count as "1w", byte-preserved.
import { describe, test, expect } from "bun:test";
import { MemoryStore, type BoardEntry } from "@/lib/leaderboard-store";
import { SEASON_1_START, seasonOf } from "@/lib/seasons";

const SYMBOL = "ETHUSDT";
const WALLET_A = "0xAbCdEf0123456789AbCdEf0123456789AbCdEf01";
const WALLET_B = "0x1111111111111111111111111111111111111111";

const row = (over: Partial<BoardEntry>): BoardEntry => ({
  name: "ANON",
  score: 100,
  candlesPassed: 10,
  symbol: SYMBOL,
  date: "2026-10-10",
  interval: "1w",
  ts: 1_000,
  ...over,
});

describe("MemoryStore.topCareer — guest lane", () => {
  test("dedupes by case-folded name keeping the best score across dates", async () => {
    const s = new MemoryStore();
    await s.add(row({ name: " Wick ", score: 300, date: "2026-10-10", ts: 1_000 }));
    await s.add(row({ name: "WICK", score: 900, date: "2026-10-11", ts: 2_000 }));
    await s.add(row({ name: "wick", score: 500, date: "2026-10-12", ts: 3_000 }));
    const top = await s.topCareer(50, "1w", "guest", null);
    expect(top).toHaveLength(1);
    expect(top[0].name).toBe("WICK"); // best run's display name survives
    expect(top[0].score).toBe(900);
  });

  test("equal scores keep the earliest run — first to set it", async () => {
    const s = new MemoryStore();
    await s.add(row({ name: "LATE", score: 700, ts: 9_000 }));
    await s.add(row({ name: "EARLY", score: 700, ts: 1_000 }));
    const top = await s.topCareer(50, "1w", "guest", null);
    expect(top).toHaveLength(2);
    expect(top[0].name).toBe("EARLY");
    expect(top[1].name).toBe("LATE");
  });

  test("sorts by score desc across identities", async () => {
    const s = new MemoryStore();
    await s.add(row({ name: "B", score: 200 }));
    await s.add(row({ name: "A", score: 800 }));
    await s.add(row({ name: "C", score: 500 }));
    const top = await s.topCareer(50, "1w", "guest", null);
    expect(top.map((e) => e.name)).toEqual(["A", "C", "B"]);
  });
});

describe("MemoryStore.topCareer — official lane", () => {
  test("dedupes by wallet — two display names, one wallet, one row", async () => {
    const s = new MemoryStore();
    const w = WALLET_A.toLowerCase();
    await s.add(row({ name: "ALIAS1", score: 400, board: "official", wallet: w, date: "2026-10-10" }));
    await s.add(row({ name: "ALIAS2", score: 950, board: "official", wallet: w, date: "2026-10-11" }));
    const top = await s.topCareer(50, "1w", "official", null);
    expect(top).toHaveLength(1);
    expect(top[0].score).toBe(950);
    expect(top[0].wallet).toBe(w);
  });

  test("lanes never mix — guest rows never surface on the official career board", async () => {
    const s = new MemoryStore();
    await s.add(row({ name: "GUESTY", score: 9_999, ts: 1_000 }));
    await s.add(row({ name: "OFF", score: 10, board: "official", wallet: WALLET_A.toLowerCase(), ts: 2_000 }));
    const official = await s.topCareer(50, "1w", "official", null);
    expect(official.map((e) => e.name)).toEqual(["OFF"]);
    const guest = await s.topCareer(50, "1w", "guest", null);
    expect(guest.map((e) => e.name)).toEqual(["GUESTY"]);
  });
});

describe("MemoryStore.topCareer — windows and separation", () => {
  test("season window excludes pre-season dates; all-time keeps them", async () => {
    const s = new MemoryStore();
    await s.add(row({ name: "PRE", score: 9_000, date: "2026-10-09", ts: 1_000 }));
    await s.add(row({ name: "S1", score: 500, date: "2026-10-10", ts: 2_000 }));
    const season = await s.topCareer(50, "1w", "guest", SEASON_1_START);
    expect(season.map((e) => e.name)).toEqual(["S1"]);
    const all = await s.topCareer(50, "1w", "guest", null);
    expect(all.map((e) => e.name)).toEqual(["PRE", "S1"]);
  });

  test("per-interval separation: 1d rows stay out of the 1w career board", async () => {
    const s = new MemoryStore();
    await s.add(row({ name: "DAILY", score: 9_000, interval: "1d" }));
    await s.add(row({ name: "WEEKLY", score: 100, interval: "1w" }));
    const week = await s.topCareer(50, "1w", "guest", null);
    expect(week.map((e) => e.name)).toEqual(["WEEKLY"]);
    const day = await s.topCareer(50, "1d", "guest", null);
    expect(day.map((e) => e.name)).toEqual(["DAILY"]);
  });

  test("legacy rows without interval count as 1w (byte-preserved)", async () => {
    const s = new MemoryStore();
    await s.add(row({ name: "LEGACY", score: 400, interval: undefined }));
    const week = await s.topCareer(50, "1w", "guest", null);
    expect(week.map((e) => e.name)).toEqual(["LEGACY"]);
  });

  test("respects the n limit", async () => {
    const s = new MemoryStore();
    for (let i = 0; i < 10; i++) await s.add(row({ name: `P${i}`, score: 100 + i }));
    expect(await s.topCareer(3, "1w", "guest", null)).toHaveLength(3);
  });
});

describe("season math (side 4 scaffolding)", () => {
  test("S1 opens 2026-10-10 — pre-season dates are null, never guessed", () => {
    expect(seasonOf("2026-10-09")).toBeNull();
    expect(seasonOf("2026-10-10")).toBe("S1");
    expect(seasonOf("not-a-date")).toBeNull();
  });
});

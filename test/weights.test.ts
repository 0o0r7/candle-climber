/// <reference types="bun-types" />
// W5 — airdrop-weights ledger contract tests (E2.2/P4.4, bun test, zero deps).
// Pins docs/WICK-ECONOMY-SPEC.md §7: streak chain math (incl. month/year
// boundaries), streak points cap, per-identity idempotency (same-day dedupe),
// wallet linking, and the pure per-wallet snapshot (cap + anomaly flags).
// Pure lib only — no network, no sleeps; the Mongo store stays untested here
// (same driver pattern as leaderboard-store, exercised by E2E on prod).
import { describe, test, expect } from "bun:test";
import {
  nextStreakDays,
  runPoints,
  normalizeWallet,
  snapshotFromRows,
  utcDate,
  STREAK_MAX,
  WALLET_SNAPSHOT_CAP,
  WALLET_IDENTITY_LIMIT,
} from "@/lib/weights";
import { MemoryWeightsStore, recordClassicRun } from "@/lib/weights-store";

describe("weights · streak chain math", () => {
  test("first-ever run starts the chain at 1", () => {
    expect(nextStreakDays(0, null, "2026-10-08")).toBe(1);
  });

  test("consecutive day extends the chain", () => {
    expect(nextStreakDays(4, "2026-10-07", "2026-10-08")).toBe(5);
  });

  test("gap of one day resets the chain to 1", () => {
    expect(nextStreakDays(7, "2026-10-05", "2026-10-08")).toBe(1);
  });

  test("month boundary is consecutive", () => {
    expect(nextStreakDays(1, "2026-01-31", "2026-02-01")).toBe(2);
  });

  test("year boundary is consecutive", () => {
    expect(nextStreakDays(2, "2025-12-31", "2026-01-01")).toBe(3);
  });

  test("same-day re-run holds the chain (store dedupes points)", () => {
    expect(nextStreakDays(3, "2026-10-08", "2026-10-08")).toBe(3);
  });
});

describe("weights · points", () => {
  test("runPoints grows with the streak then caps at STREAK_MAX", () => {
    expect(runPoints(1)).toBe(1);
    expect(runPoints(5)).toBe(5);
    expect(runPoints(STREAK_MAX)).toBe(STREAK_MAX);
    expect(runPoints(999)).toBe(STREAK_MAX);
  });

  test("runPoints clamps degenerate inputs", () => {
    expect(runPoints(0)).toBe(1);
    expect(runPoints(-3)).toBe(1);
    expect(runPoints(4.9)).toBe(4);
  });
});

describe("weights · wallet normalization", () => {
  test("accepts checksummed, returns lowercase", () => {
    expect(normalizeWallet("0xE2cE0Be4e3D420C1e4b5C46493b3d5e03595216c")).toBe(
      "0xe2ce0be4e3d420c1e4b5c46493b3d5e03595216c",
    );
  });
  test("rejects malformed / non-string", () => {
    expect(normalizeWallet("0x123")).toBeNull();
    expect(normalizeWallet(undefined)).toBeNull();
    expect(normalizeWallet({ address: "0x0" })).toBeNull();
  });
});

describe("weights · memory ledger (idempotency + linking)", () => {
  test("same-day duplicate event returns null and never double-counts", async () => {
    const s = new MemoryWeightsStore();
    const a = await s.recordRun({ name: "ALI", date: "2026-10-08", streakDays: 1, points: 1, wallet: null, ts: 1 });
    const b = await s.recordRun({ name: "ALI", date: "2026-10-08", streakDays: 1, points: 1, wallet: "0xaaa0000000000000000000000000000000000001", ts: 2 });
    expect(a).not.toBeNull();
    expect(b).toBeNull();
    const sum = await s.summary("ALI");
    expect(sum.totalPoints).toBe(1);
    expect(sum.lastRunDate).toBe("2026-10-08");
  });

  test("linkWallet backfills unlinked rows (same-day re-run with wallet)", async () => {
    const s = new MemoryWeightsStore();
    await s.recordRun({ name: "ALI", date: "2026-10-08", streakDays: 1, points: 1, wallet: null, ts: 1 });
    await s.linkWallet("ALI", "0xaaa0000000000000000000000000000000000001");
    const sum = await s.summary("ALI");
    expect(sum.wallet).toBe("0xaaa0000000000000000000000000000000000001");
  });

  test("recordClassicRun builds the chain across days, only for today", async () => {
    const NOW = Date.parse("2026-10-08T12:00:00Z");
    const r1 = await recordClassicRun("BO", "2026-10-07", null, NOW);
    expect(r1).toBeNull(); // not today → no event (spec §7.2)
    const r2 = await recordClassicRun("BO", "2026-10-08", null, NOW);
    expect(r2?.streakDays).toBe(1);
    expect(r2?.points).toBe(1);
  });
});

describe("weights · snapshot (pure, per-wallet)", () => {
  test("unlinked rows are excluded; linked rows sum per wallet", () => {
    const snap = snapshotFromRows([
      { name: "A", points: 5, wallet: "0xaaa0000000000000000000000000000000000001" },
      { name: "B", points: 7, wallet: null },
      { name: "C", points: 3, wallet: "0xaaa0000000000000000000000000000000000001" },
    ]);
    expect(snap).toHaveLength(1);
    expect(snap[0].points).toBe(8);
    expect(snap[0].identities).toBe(2);
    expect(snap[0].flagged).toBe(false);
  });

  test("per-wallet cap is enforced at snapshot time", () => {
    const snap = snapshotFromRows(
      [{ name: "A", points: WALLET_SNAPSHOT_CAP + 123, wallet: "0xaaa0000000000000000000000000000000000001" }],
      WALLET_SNAPSHOT_CAP,
    );
    expect(snap[0].points).toBe(WALLET_SNAPSHOT_CAP);
  });

  test("identities above the limit are anomaly-flagged", () => {
    const rows = Array.from({ length: WALLET_IDENTITY_LIMIT + 1 }, (_, i) => ({
      name: `P${i}`,
      points: 1,
      wallet: "0xbbb0000000000000000000000000000000000001",
    }));
    const snap = snapshotFromRows(rows);
    expect(snap[0].identities).toBe(WALLET_IDENTITY_LIMIT + 1);
    expect(snap[0].flagged).toBe(true);
  });

  test("deterministic: same rows in any order → identical snapshot", () => {
    const rows = [
      { name: "A", points: 5, wallet: "0xaaa0000000000000000000000000000000000001" },
      { name: "C", points: 3, wallet: "0xaaa0000000000000000000000000000000000001" },
      { name: "D", points: 9, wallet: "0xccc0000000000000000000000000000000000001" },
    ];
    const one = JSON.stringify(snapshotFromRows(rows));
    const two = JSON.stringify(snapshotFromRows([...rows].reverse()));
    expect(one).toBe(two);
  });
});

describe("weights · utcDate authority", () => {
  test("matches the ISO UTC date of a timestamp", () => {
    expect(utcDate(Date.parse("2026-10-08T00:00:01Z"))).toBe("2026-10-08");
    expect(utcDate(Date.parse("2026-10-08T23:59:59Z"))).toBe("2026-10-08");
  });
});

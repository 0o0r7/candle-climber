/// <reference types="bun-types" />
// W5 — E2.3/E2.4 ledger-event contract tests (practice fold + caps, prediction
// and vault uniqueness, snapshot merge, wallet-link backfill across stores).
// Pure lib only — MemoryWeightsStore; the Mongo mirror is exercised on prod E2E.
import { describe, test, expect } from "bun:test";
import {
  PRACTICE_POINTS,
  PRACTICE_DAILY_CAP,
  PREDICTION_DAILY_CAP,
  VAULT_POINTS,
} from "@/lib/weights";
import {
  MemoryWeightsStore,
  recordPredictionPoints,
  recordVaultGrant,
  recordPracticeRun,
} from "@/lib/weights-store";

const W = "0xaaa0000000000000000000000000000000000001";

describe("weights · practice lane (E2.3)", () => {
  test("each archive run banks 0.5, folded into ONE row", async () => {
    const s = new MemoryWeightsStore();
    const a = await s.addPractice("ALI", "2026-10-08", null, 1);
    expect(a.points).toBe(PRACTICE_POINTS);
    expect(a.meta?.runs).toBe(1);
    await s.addPractice("ALI", "2026-10-08", null, 2);
    const row = await s.addPractice("ALI", "2026-10-08", null, 3);
    expect(row.points).toBeCloseTo(3 * PRACTICE_POINTS);
    expect(row.meta?.runs).toBe(3);
    const sum = await s.summary("ALI");
    expect(sum.eventPoints).toBeCloseTo(1.5);
    expect(sum.totalPoints).toBeCloseTo(1.5);
  });
  test("daily cap: runs past 4 stop raising points at 2.0", async () => {
    const s = new MemoryWeightsStore();
    for (let i = 0; i < 10; i++) await s.addPractice("BO", "2026-10-08", null, i);
    const row = await s.addPractice("BO", "2026-10-08", null, 99);
    expect(row.meta?.runs).toBe(11); // runs counted
    expect(row.points).toBe(PRACTICE_DAILY_CAP); // capped at 2
  });
  test("different accrual days are separate rows", async () => {
    const s = new MemoryWeightsStore();
    await s.addPractice("CY", "2026-10-07", null, 1);
    await s.addPractice("CY", "2026-10-08", null, 2);
    const sum = await s.summary("CY");
    expect(sum.eventPoints).toBeCloseTo(2 * PRACTICE_POINTS);
  });
  test("recordPracticeRun pins the ledger date to TODAY (accrual day)", async () => {
    const NOW = Date.parse("2026-10-08T12:00:00Z");
    const row = await recordPracticeRun("DI", null, NOW);
    expect(row.date).toBe("2026-10-08");
  });
});

describe("weights · prediction lane (E2.3)", () => {
  test("one scored call per identity per target date; duplicate → null", async () => {
    const NOW = Date.parse("2026-10-08T12:00:00Z");
    const a = await recordPredictionPoints("ALI", "2026-10-09", 7, null, {}, NOW);
    expect(a?.points).toBe(7);
    const b = await recordPredictionPoints("ALI", "2026-10-09", 9, null, {}, NOW);
    expect(b).toBeNull();
  });
  test("points are clamped into [0, PREDICTION_DAILY_CAP] server-side", async () => {
    const NOW = Date.parse("2026-10-08T12:00:00Z");
    expect((await recordPredictionPoints("BO", "2026-10-09", 99, null, {}, NOW))?.points)
      .toBe(PREDICTION_DAILY_CAP);
    expect((await recordPredictionPoints("CY", "2026-10-09", -5, null, {}, NOW))?.points)
      .toBe(0);
  });
  test("scored points land on the TARGET date, not the submit date", async () => {
    const NOW = Date.parse("2026-10-08T12:00:00Z");
    const row = await recordPredictionPoints("DI", "2026-10-09", 4, null, {}, NOW);
    expect(row?.date).toBe("2026-10-09");
  });
});

describe("weights · vault lane (E2.4)", () => {
  test("one grant per identity per day; duplicate → null", async () => {
    const NOW = Date.parse("2026-10-08T12:00:00Z");
    const a = await recordVaultGrant("ALI", W, { tier: "whale" }, NOW);
    expect(a?.points).toBe(VAULT_POINTS);
    expect(a?.meta?.tier).toBe("whale");
    const b = await recordVaultGrant("ALI", W, { tier: "whale" }, NOW);
    expect(b).toBeNull();
  });
  test("grant lands on today's UTC date", async () => {
    const NOW = Date.parse("2026-10-08T23:59:59Z");
    const row = await recordVaultGrant("BO", W, {}, NOW);
    expect(row?.date).toBe("2026-10-08");
  });
});

describe("weights · events in snapshot + linking", () => {
  test("events join runs in the per-wallet snapshot", async () => {
    const NOW = Date.parse("2026-10-08T12:00:00Z");
    const s = new MemoryWeightsStore();
    await s.recordRun({ name: "ALI", date: "2026-10-08", streakDays: 1, points: 1, wallet: W, ts: NOW });
    await s.addPractice("ALI", "2026-10-08", W, NOW);
    await s.recordEvent({ name: "ALI", date: "2026-10-08", kind: "vault", points: 1, wallet: W, ts: NOW });
    await s.recordEvent({ name: "ALI", date: "2026-10-09", kind: "prediction", points: 6, wallet: W, ts: NOW });
    const snap = await s.snapshot(600);
    expect(snap.wallets).toHaveLength(1);
    expect(snap.wallets[0].points).toBe(1 + 0.5 + 1 + 6);
    expect(snap.wallets[0].identities).toBe(1);
  });
  test("linkWallet backfills unlinked event rows too", async () => {
    const NOW = Date.parse("2026-10-08T12:00:00Z");
    const s = new MemoryWeightsStore();
    await s.addPractice("ALI", "2026-10-08", null, NOW);
    await s.linkWallet("ALI", W);
    const sum = await s.summary("ALI");
    expect(sum.wallet).toBe(W);
    const snap = await s.snapshot(600);
    expect(snap.wallets[0].wallet).toBe(W);
  });
  test("event-only identities surface in summary with zero streak", async () => {
    const NOW = Date.parse("2026-10-08T12:00:00Z");
    const s = new MemoryWeightsStore();
    await s.recordEvent({ name: "ED", date: "2026-10-08", kind: "vault", points: 1, wallet: null, ts: NOW });
    const sum = await s.summary("ED");
    expect(sum.streakDays).toBe(0);
    expect(sum.lastRunDate).toBeNull();
    expect(sum.totalPoints).toBe(1);
  });
});

/// <reference types="bun-types" />
// Phase 1 — Signal Forge board contract (bun test, real handlers).
// Pins the two integrity promises:
//   1. MUTATION/SEED validation — the server re-derives the arena mutation from
//      the verified token's (date, symbol) and rejects any other claim.
//   2. PHYSICAL CAPS — a hand-crafted score/signals/chain is rejected even with
//      a genuine run token.
// Plus the two-lane contract: only a VALID personal_sign ownership proof lands
// a run on the official lane; anything less degrades to guest with an honest
// note (never an error). Drives the REAL route handlers, the real memory store
// and the real HMAC — no mocks.
import { describe, test, expect, beforeAll } from "bun:test";
import { POST, GET } from "@/app/api/forge/leaderboard/route";
import { signForgeToken, verifyForgeToken } from "@/lib/forge-token";
import { signRunToken } from "@/lib/run-token";
import { validateForgeSubmission } from "@/lib/forge-board-validation";
import { buildForgeProofMessage } from "@/lib/proof-message";
import { dailyMutation } from "@/game/vg/mutations";
import { sign, getPublicKey, hashes as secpHashes } from "@noble/secp256k1";
import { hmac } from "@noble/hashes/hmac.js";
import { sha256 } from "@noble/hashes/sha2.js";
import { keccak_256 } from "@noble/hashes/sha3.js";

secpHashes.sha256 = (m) => sha256(m);
secpHashes.hmacSha256 = (k, m) => hmac(sha256, k, m);

const enc = new TextEncoder();
const hexToBytes = (h: string) => {
  const s = h.replace(/^0x/, "");
  const out = new Uint8Array(s.length / 2);
  for (let i = 0; i < out.length; i++) out[i] = parseInt(s.slice(i * 2, i * 2 + 2), 16);
  return out;
};
const bytesToHex = (b: Uint8Array) => [...b].map((x) => x.toString(16).padStart(2, "0")).join("");
const personalSign = (message: string, priv: Uint8Array): string => {
  const bytes = enc.encode(message);
  const prefix = enc.encode(`\x19Ethereum Signed Message:\n${bytes.length}`);
  const hash = keccak_256(new Uint8Array([...prefix, ...bytes]));
  const rec = sign(hash, priv, { prehash: false, format: "recovered" });
  const out = new Uint8Array(65);
  out.set(rec.slice(1, 65), 0);
  out[64] = rec[0] + 27;
  return "0x" + bytesToHex(out);
};
const addressFor = (priv: Uint8Array) => "0x" + bytesToHex(keccak_256(getPublicKey(priv, false).slice(1)).slice(-20));

const PRIV_A = hexToBytes("0x" + "cc".repeat(32));
const WALLET_A = addressFor(PRIV_A);

const TODAY = new Date().toISOString().slice(0, 10);
const SYMBOL = "SOLUSDT";
const CANDLE_JSON = JSON.stringify([{ t: 1, o: 2, h: 3, l: 1, c: 2 }]);
const MUTATION = dailyMutation(TODAY, SYMBOL).id;

let TOK = "";
let nonceSeq = 0;
const nonce = () => `forge-test-nonce-${++nonceSeq}-${Date.now()}`;

function post(body: Record<string, unknown>): Promise<Response> {
  return POST(
    new Request("http://localhost/api/forge/leaderboard", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ runToken: TOK, nonce: nonce(), mutation: MUTATION, ...body }),
    }),
  );
}

const RUN = { score: 1200, survivalTime: 42, signalsCollected: 12, maxChain: 4, name: "TESTER" };

beforeAll(() => {
  process.env.RUN_TOKEN_SECRET = "forge-test-secret";
  TOK = signForgeToken(SYMBOL, TODAY, 220, CANDLE_JSON);
});

describe("Phase 1 forge token", () => {
  test("roundtrip: sign -> verify returns the pinned fields", () => {
    const tok = verifyForgeToken(TOK);
    expect(tok).not.toBeNull();
    expect(tok!.symbol).toBe(SYMBOL);
    expect(tok!.date).toBe(TODAY);
    expect(tok!.count).toBe(220);
    expect(tok!.h).toMatch(/^[0-9a-f]{16}$/);
  });

  test("domain separation: a Candle Climber token is NOT a valid forge token", () => {
    const ccTok = signRunToken(SYMBOL, TODAY, 220, CANDLE_JSON);
    expect(ccTok).not.toBe("");
    expect(verifyForgeToken(ccTok)).toBeNull();
    expect(verifyForgeToken("garbage")).toBeNull();
    expect(verifyForgeToken(undefined)).toBeNull();
  });
});

describe("Phase 1 anti-cheat: mutation/seed validation", () => {
  test("a mutation that does not match the daily seed is rejected", () => {
    const tok = verifyForgeToken(TOK)!;
    const wrong = MUTATION === "calm" ? "bullrun" : "calm";
    const v = validateForgeSubmission({ ...RUN, mutation: wrong }, tok);
    expect(v.ok).toBe(false);
    if (!v.ok) expect(v.status).toBe(403);
  });

  test("client-claimed symbol/date never reach the stored entry", () => {
    const tok = verifyForgeToken(TOK)!;
    const v = validateForgeSubmission(
      { ...RUN, mutation: MUTATION, symbol: "FAKEUSDT", date: "1999-01-01" },
      tok,
    );
    expect(v.ok).toBe(true);
    if (v.ok) {
      expect(v.entry.symbol).toBe(SYMBOL);
      expect(v.entry.date).toBe(TODAY);
      expect(v.entry.mutation).toBe(MUTATION);
    }
  });

  test("physical caps reject impossible scores/signals/chains", () => {
    const tok = verifyForgeToken(TOK)!;
    const base = { ...RUN, mutation: MUTATION };
    expect(validateForgeSubmission({ ...base, score: 10_000_000, survivalTime: 10 }, tok).ok).toBe(false);
    expect(validateForgeSubmission({ ...base, signalsCollected: 900, survivalTime: 10 }, tok).ok).toBe(false);
    expect(validateForgeSubmission({ ...base, signalsCollected: 2, maxChain: 9 }, tok).ok).toBe(false);
    expect(validateForgeSubmission({ ...base, survivalTime: 999_999 }, tok).ok).toBe(false);
    expect(validateForgeSubmission(base, tok).ok).toBe(true);
  });
});

describe("Phase 1 route: two lanes", () => {
  test("a valid guest run lands on the guest lane and is readable", async () => {
    const res = await post({ ...RUN, name: "GUESTY" });
    expect(res.status).toBe(200);
    const j = await res.json();
    expect(j.ok).toBe(true);
    expect(j.board).toBe("guest");
    expect(typeof j.rank).toBe("number");

    const g = await GET(new Request(`http://localhost/api/forge/leaderboard?date=${TODAY}`));
    const gj = await g.json();
    expect(gj.board).toBe("guest");
    expect(gj.entries.some((e: { name: string }) => e.name === "GUESTY")).toBe(true);
  });

  test("a valid ownership proof lands the run on the official lane (masked on read)", async () => {
    const ts = Date.now();
    const signature = personalSign(
      buildForgeProofMessage(
        { score: RUN.score, survivalTime: RUN.survivalTime, signalsCollected: RUN.signalsCollected, date: TODAY, wallet: WALLET_A },
        ts,
      ),
      PRIV_A,
    );
    const res = await post({ ...RUN, name: "OFFICIAL1", address: WALLET_A, signature, ts });
    expect(res.status).toBe(200);
    const j = await res.json();
    expect(j.board).toBe("official");

    const o = await GET(new Request(`http://localhost/api/forge/leaderboard?board=official&date=${TODAY}`));
    const oj = await o.json();
    const mine = oj.entries.find((e: { name: string }) => e.name === "OFFICIAL1");
    expect(mine).toBeTruthy();
    expect(mine.wallet).not.toBe(WALLET_A); // public reads never expose the full address
    expect(mine.wallet).toContain("…");
  });

  test("a bad proof degrades to guest with an honest note (never an error)", async () => {
    const res = await post({ ...RUN, name: "DEGRADED", address: WALLET_A, signature: "0x" + "11".repeat(65), ts: Date.now() });
    expect(res.status).toBe(200);
    const j = await res.json();
    expect(j.board).toBe("guest");
    expect(typeof j.note).toBe("string");
  });

  test("a Candle Climber run token cannot score on the Forge board", async () => {
    const ccTok = signRunToken(SYMBOL, TODAY, 220, CANDLE_JSON);
    const res = await POST(
      new Request("http://localhost/api/forge/leaderboard", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ runToken: ccTok, nonce: nonce(), mutation: MUTATION, ...RUN }),
      }),
    );
    expect(res.status).toBe(403);
  });

  test("a replayed nonce is rejected", async () => {
    const n = nonce();
    const body = JSON.stringify({ runToken: TOK, nonce: n, mutation: MUTATION, ...RUN });
    const mk = () =>
      POST(new Request("http://localhost/api/forge/leaderboard", { method: "POST", headers: { "content-type": "application/json" }, body }));
    expect((await mk()).status).toBe(200);
    expect((await mk()).status).toBe(409);
  });
});

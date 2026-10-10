/// <reference types="bun-types" />
// LAW 1.2 hardening — ROUTE-level contract pins (bun test, real handler).
// The POST handler is the lane authority: an official submission now requires
// a VALID personal_sign ownership proof; anything less degrades to the guest
// lane with an honest note — and play is never blocked (LAW 1.2 substance).
// These tests drive the REAL route handler (import + Request), the real memory
// store, and the real run-token HMAC — no mocks.
import { describe, test, expect, beforeAll, afterAll } from "bun:test";
import { POST, GET } from "@/app/api/leaderboard/route";
import { signRunToken } from "@/lib/run-token";
import { buildProofMessage, type ProofFields } from "@/lib/proof-message";
import { verifyOfficialProof } from "@/lib/wallet-proof";
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
  const rec = sign(hash, priv, { prehash: false, format: "recovered" }); // [recid][r][s]
  if (rec[0] > 1) throw new Error(`unexpected recid ${rec[0]}`);
  const out = new Uint8Array(65);
  out.set(rec.slice(1, 65), 0); // r‖s
  out[64] = rec[0] + 27; // v LAST (Ethereum order) — verifier accepts both notations
  return "0x" + bytesToHex(out);
};
const addressFor = (priv: Uint8Array) => "0x" + bytesToHex(keccak_256(getPublicKey(priv, false).slice(1)).slice(-20));

const PRIV_A = hexToBytes("0x" + "aa".repeat(32));
const PRIV_B = hexToBytes("0x" + "bb".repeat(32));
const WALLET_A = addressFor(PRIV_A);
const WALLET_B = addressFor(PRIV_B);

// tokens are valid on their own UTC date + 1 — mint against the live clock so
// this file never goes stale as the calendar advances
const TODAY = new Date().toISOString().slice(0, 10);
const SYMBOL = "ETHUSDT";
const CANDLE_JSON = JSON.stringify([{ t: 1, o: 2, h: 3, l: 1, c: 2 }]);
// minted in beforeAll — signRunToken reads RUN_TOKEN_SECRET at CALL time, and
// module evaluation runs BEFORE beforeAll (a module-load mint would use the
// fallback secret and every route POST would 403 on token verification)
let TOK = "";

const fields = (wallet: string, over: Partial<ProofFields> = {}): ProofFields => ({
  score: 1000,
  candlesPassed: 30,
  bestStreak: 5,
  date: TODAY,
  interval: "1w",
  wallet,
  ...over,
});

beforeAll(() => {
  process.env.RUN_TOKEN_SECRET = "opr-test-secret";
  TOK = signRunToken(SYMBOL, TODAY, 220, CANDLE_JSON);
});
afterAll(() => {
  delete process.env.RUN_TOKEN_SECRET;
});

async function post(body: Record<string, unknown>): Promise<Record<string, unknown>> {
  const res = await POST(
    new Request("http://localhost/api/leaderboard", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    }),
  );
  return (await res.json()) as Record<string, unknown>;
}

describe("official-proof route — lane authority", () => {
  test("wallet + VALID proof ⇒ official lane, season stamped, no note", async () => {
    const ts = Date.now();
    const f = fields(WALLET_A);
    const r = await post({
      name: "OWNER", score: f.score, candlesPassed: f.candlesPassed, bestStreak: f.bestStreak,
      address: WALLET_A, signature: personalSign(buildProofMessage(f, ts), PRIV_A), ts, runToken: TOK,
    });
    expect(r.ok).toBe(true);
    expect(r.board).toBe("official");
    expect(r.season).toBe("S1"); // today ≥ 2026-10-10 — S1 is the open season
    expect(r.note).toBeUndefined();
  });

  test("wallet WITHOUT a signature ⇒ guest lane, play never blocked, no note", async () => {
    const r = await post({
      name: "NOSIG", score: 900, candlesPassed: 30, bestStreak: 4,
      address: WALLET_B, runToken: TOK,
    });
    expect(r.ok).toBe(true);
    expect(r.board).toBe("guest");
    expect(r.note).toBeUndefined();
  });

  test("signature by ANOTHER key ⇒ guest + honest note (address-mismatch)", async () => {
    const ts = Date.now();
    const f = fields(WALLET_A);
    const r = await post({
      name: "FORGER", score: f.score, candlesPassed: f.candlesPassed, bestStreak: f.bestStreak,
      address: WALLET_A, signature: personalSign(buildProofMessage(f, ts), PRIV_B), ts, runToken: TOK,
    });
    expect(r.ok).toBe(true);
    expect(r.board).toBe("guest");
    expect(String(r.note)).toContain("guest");
    expect(String(r.note)).toContain("address-mismatch");
  });

  test("TAMPERED body (signature over a different score) ⇒ guest + note", async () => {
    const ts = Date.now();
    const signed = fields(WALLET_B, { score: 1000 });
    const r = await post({
      name: "TWEAKER", score: 2000, candlesPassed: 30, bestStreak: 5, // body claims 2000, proof says 1000
      address: WALLET_B, signature: personalSign(buildProofMessage(signed, ts), PRIV_B), ts, runToken: TOK,
    });
    expect(r.ok).toBe(true);
    expect(r.board).toBe("guest");
    expect(String(r.note)).toContain("guest");
  });

  test("STALE proof timestamp (> 10 min) ⇒ guest + note", async () => {
    const ts = Date.now() - 11 * 60_000;
    const f = fields(WALLET_B);
    const r = await post({
      name: "LATE", score: f.score, candlesPassed: f.candlesPassed, bestStreak: f.bestStreak,
      address: WALLET_B, signature: personalSign(buildProofMessage(f, ts), PRIV_B), ts, runToken: TOK,
    });
    expect(r.ok).toBe(true);
    expect(r.board).toBe("guest");
    expect(String(r.note)).toContain("stale");
  });

  test("malformed address + signature ⇒ guest, no note (was guest before hardening too)", async () => {
    const r = await post({
      name: "BADADDR", score: 100, candlesPassed: 10, bestStreak: 1,
      address: "not-an-address", signature: "0x" + "cd".repeat(65), ts: Date.now(), runToken: TOK,
    });
    expect(r.ok).toBe(true);
    expect(r.board).toBe("guest");
    expect(r.note).toBeUndefined();
  });
});

describe("official-proof route — read paths stay honest", () => {
  test("official GET returns the masked wallet only; guest GET excludes official rows", async () => {
    const ts = Date.now();
    const f = fields(WALLET_A, { score: 4242 });
    await post({
      name: "MASKED", score: f.score, candlesPassed: f.candlesPassed, bestStreak: f.bestStreak,
      address: WALLET_A, signature: personalSign(buildProofMessage(f, ts), PRIV_A), ts, runToken: TOK,
    });
    const off = await GET(new Request(`http://localhost/api/leaderboard?date=${TODAY}&interval=1w&board=official`));
    const offJ = (await off.json()) as { entries: Array<{ wallet?: string; name: string }>; season?: string };
    const mine = offJ.entries.find((e) => e.name === "MASKED");
    expect(mine).toBeTruthy();
    expect(mine?.wallet).toMatch(/^0x[0-9a-f]{4}…[0-9a-f]{4}$/); // chip mask, never the full address
    expect(JSON.stringify(offJ.entries)).not.toContain(WALLET_A.toLowerCase());
    expect(offJ.season).toBe("S1");

    const guest = await GET(new Request(`http://localhost/api/leaderboard?date=${TODAY}&interval=1w`));
    const guestJ = (await guest.json()) as { entries: Array<{ name: string }> };
    expect(guestJ.entries.find((e) => e.name === "MASKED")).toBeUndefined();
  });
});

// sanity: the verifier and the test-side signer agree (guards against a silent
// drift between this file's envelope and the production verifier)
describe("official-proof route — cross-check", () => {
  test("verifier accepts the test-side personal_sign envelope", () => {
    const ts = Date.now();
    const f = fields(WALLET_A);
    expect(verifyOfficialProof(WALLET_A, personalSign(buildProofMessage(f, ts), PRIV_A), f, ts)).toEqual({ ok: true });
  });
});

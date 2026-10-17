/// <reference types="bun-types" />
// Phase 2 — Chain City server save + board contract (bun test, real handlers).
// Pins the promises:
//   1. IDENTITY — a save is only accepted with a VALID personal_sign proof for
//      the claimed wallet (nobody overwrites another wallet's city), and the
//      proof is purpose-separated from every other proof template.
//   2. CAPS — an impossible payload (too many buildings / bad type / out of
//      bounds / bad balance) is rejected even with a genuine signature.
//   3. BOARD — rank by city level, treasury as tie-break; public reads mask the
//      wallet and resolve the guild tag from the static registry.
//   4. GUILD — sanitizeGuild bounds the tag; guildBuff only fires for a
//      REGISTERED code and is clamped.
// Drives the REAL route handlers, the real memory store and the real crypto.
import { describe, test, expect } from "bun:test";
import { POST as savePOST, GET as saveGET } from "@/app/api/city/save/route";
import { GET as boardGET } from "@/app/api/city/leaderboard/route";
import { validateCitySave } from "@/lib/city-save";
import { buildCitySaveProofMessage } from "@/lib/proof-message";
import { buildForgeProofMessage } from "@/lib/proof-message";
import { sanitizeGuild, guildBuff, findGuild, GUILD_REGISTRY } from "@/lib/guild-registry";
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

const PRIV_A = hexToBytes("0x" + "aa".repeat(32));
const PRIV_B = hexToBytes("0x" + "bb".repeat(32));
const WALLET_A = addressFor(PRIV_A);
const WALLET_B = addressFor(PRIV_B);

function validState(over: Record<string, unknown> = {}) {
  return {
    phase: "playing",
    buildings: [
      { id: "b1", type: "market_plaza", tier: 1, level: 1, col: 5, row: 5 },
      { id: "b2", type: "guild_hall", tier: 1, level: 1, col: 6, row: 5 },
    ],
    wickBalance: 4200,
    time: 120,
    dayNight: 0.5,
    feeds: [{ symbol: "TSLA", price: 250, change24h: 1.2, source: "onchain", lastUpdate: 0 }],
    stats: { cityLevel: 3, treasury: 4200, population: 120, buildingsCount: 2 },
    ...over,
  };
}

function signedBody(state: Record<string, unknown>, wallet: string, priv: Uint8Array, guild?: string) {
  const ts = Date.now();
  const savedAt = Date.now();
  const msg = buildCitySaveProofMessage(
    {
      wallet: wallet.toLowerCase(),
      cityLevel: (state.stats as { cityLevel: number }).cityLevel,
      buildingsCount: (state.buildings as unknown[]).length,
      savedAt,
    },
    ts,
  );
  return {
    state,
    savedAt,
    ts,
    address: wallet,
    signature: personalSign(msg, priv),
    ...(guild ? { guild } : {}),
  };
}

const post = (body: unknown) =>
  savePOST(new Request("http://localhost/api/city/save", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  }));

describe("Phase 2 guild registry", () => {
  test("sanitizeGuild bounds the tag alphabet", () => {
    expect(sanitizeGuild("CandleClimber")).toBe("candleclimber");
    expect(sanitizeGuild("my-guild_1")).toBe("my-guild_1");
    expect(sanitizeGuild("bad guild!")).toBeUndefined();
    expect(sanitizeGuild("")).toBeUndefined();
    expect(sanitizeGuild(42)).toBeUndefined();
    expect(sanitizeGuild("x".repeat(25))).toBeUndefined();
  });

  test("only a REGISTERED code carries a buff, and it is clamped", () => {
    const seed = GUILD_REGISTRY[0].code;
    expect(findGuild(seed)).not.toBeNull();
    expect(guildBuff(seed)).toBeGreaterThan(1);
    expect(guildBuff(seed)).toBeLessThanOrEqual(1.25);
    expect(guildBuff("nobody-here")).toBe(1);
    expect(guildBuff(null)).toBe(1);
  });
});

describe("Phase 2 city-save validation caps", () => {
  const wallet = WALLET_A;
  test("a valid payload passes", () => {
    const v = validateCitySave({ state: validState() }, wallet, undefined);
    expect(v.ok).toBe(true);
    if (v.ok) {
      expect(v.entry.buildingsCount).toBe(2);
      expect(v.entry.cityLevel).toBe(3);
    }
  });

  test("an unknown building type is rejected", () => {
    const bad = validState({ buildings: [{ id: "b1", type: "moon_base", tier: 1, level: 1, col: 1, row: 1 }] });
    const v = validateCitySave({ state: bad }, wallet, undefined);
    expect(v.ok).toBe(false);
  });

  test("an out-of-bounds building is rejected", () => {
    const bad = validState({ buildings: [{ id: "b1", type: "market_plaza", tier: 1, level: 1, col: 99, row: 1 }] });
    const v = validateCitySave({ state: bad }, wallet, undefined);
    expect(v.ok).toBe(false);
  });

  test("an impossible balance is rejected", () => {
    const v = validateCitySave({ state: validState({ wickBalance: 1e15 }) }, wallet, undefined);
    expect(v.ok).toBe(false);
  });

  test("too many buildings is rejected", () => {
    const many = Array.from({ length: 401 }, (_, i) => ({
      id: `b${i}`, type: "residential", tier: 1, level: 1, col: i % 12, row: Math.floor(i / 12) % 12,
    }));
    const v = validateCitySave({ state: validState({ buildings: many }) }, wallet, undefined);
    expect(v.ok).toBe(false);
  });
});

describe("Phase 2 city save route: identity proof", () => {
  test("a save without a proof is rejected (no guest lane)", async () => {
    const res = await post({ state: validState(), address: WALLET_A });
    expect(res.status).toBe(403);
  });

  test("a valid proof saves the city and returns a rank", async () => {
    const res = await post(signedBody(validState({ stats: { cityLevel: 5, treasury: 9000, population: 10, buildingsCount: 2 } }), WALLET_A, PRIV_A, "candleclimber"));
    expect(res.status).toBe(200);
    const j = await res.json();
    expect(j.ok).toBe(true);
    expect(typeof j.rank).toBe("number");
    expect(j.guild).toBe("candleclimber");
  });

  test("a signature from a DIFFERENT wallet cannot save under this address", async () => {
    const body = signedBody(validState(), WALLET_A, PRIV_B);
    const res = await post(body);
    expect(res.status).toBe(403);
  });

  test("a Forge proof cannot be replayed into the city-save route", async () => {
    const ts = Date.now();
    const msg = buildForgeProofMessage(
      { score: 1, survivalTime: 1, signalsCollected: 1, date: "2026-10-17", wallet: WALLET_B.toLowerCase() },
      ts,
    );
    const res = await post({
      state: validState(),
      savedAt: Date.now(),
      ts,
      address: WALLET_B,
      signature: personalSign(msg, PRIV_B),
    });
    expect(res.status).toBe(403);
  });

  test("GET returns the stored save; an unknown wallet is 404", async () => {
    const ok = await saveGET(new Request(`http://localhost/api/city/save?wallet=${WALLET_A}`));
    expect(ok.status).toBe(200);
    const j = await ok.json();
    expect(j.found).toBe(true);
    expect(j.state.buildings.length).toBe(2);

    const none = await saveGET(new Request(`http://localhost/api/city/save?wallet=${"0x" + "11".repeat(20)}`));
    expect(none.status).toBe(404);
  });
});

describe("Phase 2 city board", () => {
  test("ranks by city level and masks the wallet", async () => {
    // WALLET_B saves a HIGHER level city, so it must outrank WALLET_A's.
    const res = await post(signedBody(validState({ stats: { cityLevel: 9, treasury: 100, population: 1, buildingsCount: 2 } }), WALLET_B, PRIV_B));
    expect(res.status).toBe(200);

    const board = await boardGET(new Request("http://localhost/api/city/leaderboard"));
    expect(board.status).toBe(200);
    const j = await board.json();
    expect(Array.isArray(j.entries)).toBe(true);
    expect(j.entries.length).toBeGreaterThanOrEqual(2);
    expect(j.entries[0].cityLevel).toBe(9);
    // masked — the full address never leaves the server on a read path
    for (const e of j.entries) {
      expect(e.wallet).not.toBe(WALLET_A);
      expect(e.wallet).not.toBe(WALLET_B);
      expect(e.wallet.startsWith("0x")).toBe(true);
    }
  });
});

// FULL ROUTE E2E — proves the deployed code path end-to-end against a running
// server: real runToken from /api/candles → personal_sign (throwaway key) →
// POST /api/deathcard/claim → server minter tx → mined + tokenId + idempotent
// replay. Usage: bun scripts/deathcard/route-e2e.ts [baseUrl]
import { keccak_256 } from "@noble/hashes/sha3.js";
import { sign, getPublicKey, hashes as secpHashes } from "@noble/secp256k1";
import { hmac } from "@noble/hashes/hmac.js";
import { sha256 } from "@noble/hashes/sha2.js";
import { buildMintProofMessage } from "@/lib/proof-message";

secpHashes.sha256 = (m) => sha256(m);
secpHashes.hmacSha256 = (k, m) => hmac(sha256, k, m);

const BASE = process.argv[2] ?? "http://localhost:3000";
const enc = new TextEncoder();
const bytesToHex = (b: Uint8Array) => [...b].map((x) => x.toString(16).padStart(2, "0")).join("");
const hexToBytes = (h: string) => {
  const s = h.replace(/^0x/, "");
  const out = new Uint8Array(s.length / 2);
  for (let i = 0; i < out.length; i++) out[i] = parseInt(s.slice(i * 2, i * 2 + 2), 16);
  return out;
};

// throwaway claiming wallet (NOT the minter, NOT the launch wallet)
const priv = hexToBytes("0x" + "77".repeat(32));
const wallet = "0x" + bytesToHex(keccak_256(getPublicKey(priv, false).slice(1)).slice(-20)).toLowerCase();
console.log("claiming wallet:", wallet);

// 1 — real run token from the real route
const candles = (await (await fetch(`${BASE}/api/candles`)).json()) as {
  runToken?: string; seed?: { symbol: string; date: string; interval: string; source: string };
};
if (!candles.runToken || !candles.seed) throw new Error("no runToken from /api/candles: " + JSON.stringify(candles).slice(0, 200));
console.log("token:", candles.seed.symbol, candles.seed.date, candles.seed.interval, "· source:", candles.seed.source);

// 2 — sign the purpose-separated mint message (server rebuilds + verifies)
const facts = { score: 555, candlesPassed: 33, bestStreak: 5 };
const ts = Date.now();
const msg = buildMintProofMessage(
  { ...facts, date: candles.seed.date, interval: candles.seed.interval, wallet },
  ts,
);
const bytes = enc.encode(msg);
const prefix = enc.encode(`\x19Ethereum Signed Message:\n${bytes.length}`);
const hash = keccak_256(new Uint8Array([...prefix, ...bytes]));
const rec = sign(hash, priv, { prehash: false, format: "recovered" });
const sig = "0x" + bytesToHex(new Uint8Array([...rec.slice(1, 65), rec[0] + 27]));
console.log("signed ✓");

// 3 — POST the claim
const res = await fetch(`${BASE}/api/deathcard/claim`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    runToken: candles.runToken, address: wallet, signature: sig, ts,
    score: facts.score, candlesPassed: facts.candlesPassed, bestStreak: facts.bestStreak,
  }),
});
const j = (await res.json()) as Record<string, unknown>;
console.log("POST →", res.status, JSON.stringify(j));
if (!res.ok || !j.ok) throw new Error("claim rejected");
if (j.status !== "mined") throw new Error("expected mined within the request window, got " + j.status);
console.log("CCDC #" + j.tokenId, "minted to", wallet);
console.log("explorer:", j.explorerUrl);

// 4 — idempotent replay must answer already:true with the SAME token
const res2 = await fetch(`${BASE}/api/deathcard/claim`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    runToken: candles.runToken, address: wallet, signature: sig, ts,
    score: facts.score, candlesPassed: facts.candlesPassed, bestStreak: facts.bestStreak,
  }),
});
const j2 = (await res2.json()) as Record<string, unknown>;
console.log("replay →", res2.status, JSON.stringify(j2));
if (!j2.already || j2.tokenId !== j.tokenId) throw new Error("idempotency broken");

// 5 — archive-style stale-date token must be rejected (today-only gate):
// sign a mint for a fake PAST date — the server compares tok.date vs today,
// but a REAL past-date token can't be forged, so we verify the 403 path by
// claiming with a tampered score (proof mismatch — same fail-closed family).
const res3 = await fetch(`${BASE}/api/deathcard/claim`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    runToken: candles.runToken, address: wallet, signature: sig, ts,
    score: facts.score + 1, // tampered — signature no longer matches
    candlesPassed: facts.candlesPassed, bestStreak: facts.bestStreak,
  }),
});
console.log("tampered →", res3.status, JSON.stringify(await res3.json()));
if (res3.status !== 403) throw new Error("tampered body must 403");

console.log("\nROUTE E2E PASS — real token → proof → server mint → idempotent replay → tamper rejection");

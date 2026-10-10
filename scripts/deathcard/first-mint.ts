// FIRST MINT — end-to-end pipeline proof on the LIVE contract (2026-10-10).
// Exercises exactly the pieces the /api/deathcard/claim route uses:
//   encodeMintCalldata → signLegacyTx → eth_sendRawTransaction → receipt →
//   decodeMintedTokenId(Transfer log) → on-chain tokenURI() roundtrip.
// The card goes to the $WICK launch wallet with HONEST metadata: this is a
// pipeline smoke test, not a player run (no run token exists for it — the
// on-chain runKey uses a ccdc-smoke-v1 prefix so it can never collide with a
// real run's key).
//
// Usage: bun scripts/deathcard/first-mint.ts
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { keccak_256 } from "@noble/hashes/sha3.js";
import {
  bytesToBigint,
  bytesToHex,
  decodeAbiString,
  deriveAddress,
  encodeMintCalldata,
  hexQuantityToBytes,
  hexToBytes,
  signLegacyTx,
} from "@/lib/eth-tx";
import { decodeMintedTokenId, explorerTxUrl } from "@/lib/deathcard-claim";

const RPC = "https://rpc.testnet.chain.robinhood.com";
const CHAIN_ID = 46630;
const ROOT = join(import.meta.dir, "..", "..");
const CONTRACT = (JSON.parse(readFileSync(join(ROOT, "src/lib/deathcard/address.json"), "utf8")) as { address: string }).address;
const LAUNCH_WALLET = "0x3cf571c7554725a9b929e4dcfa75f433436cf683"; // $WICK launch wallet — contract OWNER

let reqId = 0;
async function rpc<T = unknown>(method: string, params: unknown[] = [], tries = 3): Promise<T> {
  for (let i = 0; i < tries; i++) {
    try {
      const res = await fetch(RPC, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jsonrpc: "2.0", id: ++reqId, method, params }),
        signal: AbortSignal.timeout(20000),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const j = (await res.json()) as { result?: T; error?: { message: string } };
      if (j.error) throw new Error(`RPC ${method}: ${j.error.message}`);
      return j.result as T;
    } catch (e) {
      if (i === tries - 1) throw e;
      await new Promise((r) => setTimeout(r, 1200 * (i + 1)));
    }
  }
  throw new Error("unreachable");
}

const hex = (u: unknown) => "0x" + bytesToHex(u as Uint8Array);

// ------------------------------------------------------------------ minter key
const keyHex = (process.env.MINTER_KEY || readFileSync(process.env.HOME + "/.cc-minter-key", "utf8")).trim().replace(/^0x/, "");
const key = hexToBytes("0x" + keyHex);
const minter = deriveAddress(key);
console.log("minter:", minter, "· contract:", CONTRACT);

// --------------------------------------------------------------------- metadata
// Honest: a smoke-test card. Data-URI JSON, exactly the route's builder shape.
const metaJson = JSON.stringify({
  name: "Death Card — FIRST MINT (pipeline smoke test)",
  description:
    "Candle Climber Death Card (Robinhood Chain TESTNET demo). Pipeline smoke test minted by the server minter to prove the loop end-to-end — not a player run, has no monetary value.",
  attributes: [
    { trait_type: "Kind", value: "Smoke Test" },
    { trait_type: "Minted", value: new Date().toISOString() },
    { trait_type: "Minter", value: minter },
  ],
});
const metadata = "data:application/json;base64," + Buffer.from(metaJson, "utf8").toString("base64");

// ------------------------------------------------------------------ runKey
// ccdc-smoke-v1 prefix — real player keys use ccdc-v1, so no collision ever.
const runKey = keccak_256(new TextEncoder().encode(`ccdc-smoke-v1|${minter}|first-mint|${new Date().toISOString().slice(0, 10)}`));
console.log("runKey:", "0x" + bytesToHex(runKey));

// ------------------------------------------------------------- on-chain guard
const sel = (sig: string) => "0x" + bytesToHex(keccak_256(new TextEncoder().encode(sig)).slice(0, 4));
const mintedByRun = (await rpc<string>("eth_call", [{ to: CONTRACT, data: sel("mintedByRun(bytes32)") + bytesToHex(runKey).replace(/^0x/, "").padStart(64, "0") }, "latest"])) as string;
if (BigInt(mintedByRun) !== 0n) {
  console.log("already minted — runKey → token", BigInt(mintedByRun).toString(), "(idempotent, nothing to do)");
  process.exit(0);
}

// ------------------------------------------------------------------- mint tx
const data = encodeMintCalldata(LAUNCH_WALLET, runKey, metadata);
const nonce = bytesToBigint(hexQuantityToBytes((await rpc<string>("eth_getTransactionCount", [minter, "pending"])) as string));
const gasPrice = bytesToBigint(hexQuantityToBytes((await rpc<string>("eth_gasPrice")) as string)) * 2n;
let gas = 300_000n;
try {
  const est = await rpc<string>("eth_estimateGas", [{ from: minter, to: CONTRACT, data }]);
  gas = (bytesToBigint(hexQuantityToBytes(est)) * 120n) / 100n;
} catch { /* fallback */ }
console.log("nonce:", nonce, "· gas:", gas, "· gasPrice:", gasPrice);

const tx = signLegacyTx({ nonce, gasPrice, gas, to: CONTRACT, value: 0n, data, chainId: CHAIN_ID }, key);
const hash = (await rpc<string>("eth_sendRawTransaction", [tx.rawHex])) as string;
console.log("submitted:", hash);

let receipt: { status?: string; logs?: Array<{ address?: string; topics?: string[] }> } | null = null;
for (let i = 0; i < 90; i++) {
  await new Promise((r) => setTimeout(r, 1200));
  receipt = await rpc<typeof receipt>("eth_getTransactionReceipt", [hash]);
  if (receipt) break;
  if (i % 10 === 9) console.log(`  waiting… ${i + 1}s`);
}
if (!receipt) throw new Error("no receipt after 90s");
if (receipt.status !== "0x1") throw new Error("mint FAILED on-chain");
console.log("MINED ✓");

const tokenId = decodeMintedTokenId(receipt, CONTRACT);
if (tokenId == null) throw new Error("could not decode tokenId from the Transfer log");
console.log("CCDC #" + tokenId, "→", LAUNCH_WALLET);
console.log("explorer:", explorerTxUrl(hash));

// ------------------------------------------------------------------- verify
const idWord = BigInt(tokenId).toString(16).padStart(64, "0");
const ownerOf = (await rpc<string>("eth_call", [{ to: CONTRACT, data: "0x6352211e" + idWord }, "latest"])) as string;
const tokenOwner = "0x" + bytesToHex(hexToBytes(ownerOf).slice(12, 32));
if (tokenOwner.toLowerCase() !== LAUNCH_WALLET.toLowerCase()) throw new Error(`ownerOf ${tokenOwner} ≠ ${LAUNCH_WALLET}`);
console.log("ownerOf ✓", tokenOwner);

const uriRaw = (await rpc<string>("eth_call", [{ to: CONTRACT, data: "0xc87b56dd" + idWord }, "latest"])) as string;
const uri = decodeAbiString(uriRaw);
const decoded = JSON.parse(Buffer.from(uri.replace(/^data:application\/json;base64,/, ""), "base64").toString("utf8")) as { name: string };
console.log("tokenURI ✓ →", decoded.name);
console.log("\nFIRST MINT COMPLETE — the full loop (minter key → calldata → chain → log decode → metadata readback) works.");

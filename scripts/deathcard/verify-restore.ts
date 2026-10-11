#!/usr/bin/env bun
// MINTER KEY RESTORE — verify the restored key derives to the exact burner/minter
// address, then check on-chain state (balance, minter role, contract ownership).
// Never prints the key itself — only derived facts.
//
// Usage: bun /home/z/my-project/scripts/verify-minter-restore.ts
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { keccak_256 } from "@noble/hashes/sha3.js";
import { deriveAddress, hexToBytes } from "@/lib/eth-tx";

const RPC = "https://rpc.testnet.chain.robinhood.com";
const CONTRACT = (
  JSON.parse(
    readFileSync(join(import.meta.dir, "..", "..", "src/lib/deathcard/address.json"), "utf8"),
  ) as {
    address: string;
  }
).address;
const EXPECTED_MINTER = "0xac83679428276ba81ac4ca9d1f5769af179a89bd";
const LAUNCH_WALLET = "0x3cf571c7554725a9b929e4dcfa75f433436cf683";

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

const keyHex = (
  process.env.MINTER_KEY || readFileSync(process.env.HOME + "/.cc-minter-key", "utf8")
)
  .trim()
  .replace(/^0x/, "");
const key = hexToBytes("0x" + keyHex);

// 1 — derivation check
const derived = deriveAddress(key).toLowerCase();
const match = derived === EXPECTED_MINTER;
console.log("derived address :", derived);
console.log("expected minter :", EXPECTED_MINTER);
console.log("MATCH           :", match ? "YES ✅" : "NO ❌ — DO NOT USE");
if (!match) process.exit(1);

// 2 — on-chain state
const balHex = await rpc<string>("eth_getBalance", [derived, "latest"]);
const bal = Number(BigInt(balHex)) / 1e18;
console.log("minter balance  :", bal.toFixed(6), "tETH", bal > 0.0001 ? "(funded ✅)" : "(EMPTY ❌)");

// minter() on CCDC: the single authorized minter address
const minterSel = keccak_256(new TextEncoder().encode("minter()")).slice(0, 4);
const minterRes = await rpc<string>("eth_call", [
  { to: CONTRACT, data: "0x" + Buffer.from(minterSel).toString("hex") },
  "latest",
]);
const contractMinter = "0x" + (minterRes ?? "").replace(/^0x/, "").slice(-40).toLowerCase();
const isMinter = contractMinter === derived;
console.log("minter role     :", isMinter ? `GRANTED on CCDC ✅ (${contractMinter})` : `MISMATCH ❌ contract minter = ${contractMinter}`);

// owner() on CCDC
const ownerSel = keccak_256(new TextEncoder().encode("owner()")).slice(0, 4);
const ownerRes = await rpc<string>("eth_call", [
  { to: CONTRACT, data: "0x" + Buffer.from(ownerSel).toString("hex") },
  "latest",
]);
const owner = "0x" + (ownerRes ?? "").replace(/^0x/, "").slice(-40);
console.log("contract owner  :", owner.toLowerCase(), owner.toLowerCase() === LAUNCH_WALLET ? "(launch wallet ✅)" : "");

console.log(match && isMinter && bal > 0 ? "\nRESTORE VERIFIED — minting can be re-lit." : "\nPROBLEM — see flags above.");

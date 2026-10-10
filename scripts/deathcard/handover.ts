// Hand-over + record for an ALREADY-DEPLOYED CCDeathCard — completes the
// 2026-10-10 deploy run that crashed at setOwner (hex-string calldata signer
// bug, since fixed+regression-tested). Deploy was mined; owner==minter==burner.
//
// Steps:
//  1. recover deploy provenance from the deploy tx receipt (--txhash): verify
//     status + contractAddress cross-check. (The deploy tx hash itself comes
//     from the block explorer — https://explorer.testnet.chain.robinhood.com
//     /api?module=account&action=txlist&address=<burner> — because historical
//     eth_getCode is state-pruned on this RPC, so block-scanning is impossible.)
//  2. setOwner(<DEATHCARD_OWNER|owner target>) — hand ultimate control to the
//     project's real $WICK launch wallet; burner stays as owner-revocable minter.
//  3. verify owner()/minter()/name()/symbol() on-chain.
//  4. write src/lib/deathcard/address.json (schema-identical to deploy.ts + deployBlock).
//
// Usage: bun scripts/deathcard/handover.ts --contract 0x… --txhash 0x… [--owner 0x… | DEATHCARD_OWNER env]
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { keccak_256 } from "@noble/hashes/sha3.js";
import {
  bytesToBigint,
  bytesToHex,
  deriveAddress,
  hexQuantityToBytes,
  hexToBytes,
  signLegacyTx,
} from "@/lib/eth-tx";

const RPC = "https://rpc.testnet.chain.robinhood.com";
const CHAIN_ID = 46630;
const ROOT = join(import.meta.dir, "..", "..");

const arg = (name: string, def?: string) => {
  const i = process.argv.indexOf(name);
  return i >= 0 ? process.argv[i + 1] : def;
};
const CONTRACT = (arg("--contract") || "").toLowerCase();
const DEPLOY_TXHASH = (arg("--txhash") || "").toLowerCase();
const OWNER_TARGET = ((arg("--owner") || process.env.DEATHCARD_OWNER || "") as string).trim();
if (!/^0x[0-9a-f]{40}$/.test(CONTRACT)) throw new Error("pass --contract 0x… (40 hex)");
if (!/^0x[0-9a-f]{64}$/.test(DEPLOY_TXHASH)) throw new Error("pass --txhash 0x… (64 hex) — from explorer txlist");
if (!/^0x[0-9a-fA-F]{40}$/.test(OWNER_TARGET)) throw new Error("pass --owner 0x… or set DEATHCARD_OWNER");

let reqId = 0;
async function rpc(method: string, params: unknown[] = [], tries = 3): Promise<unknown> {
  for (let i = 0; i < tries; i++) {
    try {
      const res = await fetch(RPC, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jsonrpc: "2.0", id: ++reqId, method, params }),
        signal: AbortSignal.timeout(20000),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const j = await res.json() as { result?: unknown; error?: { message: string } };
      if (j.error) throw new Error(`RPC ${method}: ${j.error.message}`);
      return j.result;
    } catch (e) {
      if (i === tries - 1) throw e;
      await new Promise((r) => setTimeout(r, 1500 * (i + 1)));
    }
  }
}

const hex = (u: unknown) => "0x" + bytesToHex(u as Uint8Array);
const word = async (selData: string): Promise<string> => {
  const r = hexToBytes((await rpc("eth_call", [{ to: CONTRACT, data: selData }, "latest"])) as string);
  return "0x" + bytesToHex(r.slice(12, 32));
};
const str = async (selData: string): Promise<string> => {
  const b = hexToBytes((await rpc("eth_call", [{ to: CONTRACT, data: selData }, "latest"])) as string);
  const off = Number(bytesToBigint(b.slice(0, 32)));
  const len = Number(bytesToBigint(b.slice(32, 64)));
  return new TextDecoder().decode(b.slice(off + 32, off + 32 + len));
};
const sel = (sig: string) => "0x" + bytesToHex(keccak_256(new TextEncoder().encode(sig)).slice(0, 4));

// ------------------------------------------------------------------ load key
const keyFile = process.env.HOME + "/.cc-minter-key";
const keyHex = (process.env.MINTER_KEY || readFileSync(keyFile, "utf8")).trim().replace(/^0x/, "");
const key = hexToBytes("0x" + keyHex);
const minter = deriveAddress(key);
console.log("minter (burner):", minter);

// ------------------------------------------------- recover deploy tx receipt
const receipt = (await rpc("eth_getTransactionReceipt", [DEPLOY_TXHASH])) as {
  status: string; contractAddress: string; blockNumber: string; gasUsed: string;
} | null;
if (!receipt) throw new Error(`no receipt for ${DEPLOY_TXHASH}`);
if (receipt.status !== "0x1") throw new Error("deploy tx receipt is NOT success?!");
const rc = receipt.contractAddress.toLowerCase();
if (rc !== CONTRACT) throw new Error(`receipt contractAddress ${rc} ≠ ${CONTRACT}`);
const deployBlock = Number(bytesToBigint(hexQuantityToBytes(receipt.blockNumber)));
const blk = (await rpc("eth_getBlockByNumber", [receipt.blockNumber, false])) as { timestamp: string };
const createdIso = new Date(Number(bytesToBigint(hexQuantityToBytes(blk.timestamp))) * 1000).toISOString();
console.log("deploy tx recovered:", DEPLOY_TXHASH, "· status ok · contractAddress ✓");
console.log("deployed at block", deployBlock, "·", createdIso, "· gas used:", Number(bytesToBigint(hexQuantityToBytes(receipt.gasUsed))));

// ------------------------------------------------------ on-chain state check
const name = await str("0x06fdde03"); // name()
const symbol = await str("0x95d89b41"); // symbol()
const ownerNow = await word("0x8da5cb5b"); // owner()
const minterNow = await word(sel("minter()"));
console.log("on-chain:", { name, symbol, owner: ownerNow, minter: minterNow });
if (ownerNow.toLowerCase() !== minter.toLowerCase()) {
  throw new Error(`owner is ${ownerNow}, not the burner — hand-over already done? nothing to do`);
}

// ------------------------------------------------------------- setOwner tx
const data = sel("setOwner(address)") + OWNER_TARGET.toLowerCase().replace(/^0x/, "").padStart(64, "0");
const nonce = bytesToBigint(hexQuantityToBytes((await rpc("eth_getTransactionCount", [minter, "pending"])) as string));
const gasPrice = (bytesToBigint(hexQuantityToBytes((await rpc("eth_gasPrice")) as string)) * 2n);
const tx = signLegacyTx({ nonce, gasPrice, gas: 80_000n, to: CONTRACT, value: 0n, data, chainId: CHAIN_ID }, key);
console.log("setOwner tx:", tx.txHash);
const h = (await rpc("eth_sendRawTransaction", [tx.rawHex])) as string;

let r: { status?: string } | null = null;
for (let i = 0; i < 120; i++) {
  await new Promise((res) => setTimeout(res, 1000));
  r = await rpc("eth_getTransactionReceipt", [h]) as typeof r;
  if (r) break;
  if (i % 10 === 9) console.log(`  waiting… ${i + 1}s`);
}
if (!r) throw new Error(`no setOwner receipt after 120s — check ${h}`);
if (r.status !== "0x1") throw new Error(`setOwner FAILED on-chain: status ${r.status}`);

const finalOwner = await word("0x8da5cb5b");
if (finalOwner.toLowerCase() !== OWNER_TARGET.toLowerCase()) {
  throw new Error(`owner ${finalOwner} ≠ target ${OWNER_TARGET}`);
}
console.log("ownership transferred →", finalOwner, "✓ (burner = owner-revocable minter)");

// ------------------------------------------------------------------ record
const rec = {
  address: CONTRACT,
  chainId: CHAIN_ID,
  deployBlock,
  txHash: DEPLOY_TXHASH,
  deployedAt: createdIso,
  deployer: minter,
  owner: finalOwner,
  minter: minterNow,
  name,
  symbol,
  recovered: "deploy tx mined 2026-10-10; setOwner completed via handover.ts after the hex-calldata signer fix",
};
writeFileSync(join(ROOT, "src/lib/deathcard/address.json"), JSON.stringify(rec, null, 2) + "\n");
console.log("recorded → src/lib/deathcard/address.json");

// Deploy CCDeathCard to Robinhood Chain TESTNET (chainId 46630) — the one-time,
// non-upgradeable deployment from docs/DEATHCARD-NFT-TESTNET-NOTE.md (architecture
// B: key-protected server minter). Uses the repo's own raw-tx signer (eth-tx.ts),
// no framework. On success writes src/lib/deathcard/address.json (committed).
//
// Usage: bun scripts/deathcard/deploy.ts [--gas-mult 2] [--wait 120]
// Key:   ~/.cc-minter-key  (or MINTER_KEY env). Preflight refuses to run unfunded.
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import {
  hexToBytes,
  hexQuantityToBytes,
  signLegacyTx,
  encodeMintCalldata,
  decodeAbiString,
  bytesToHex,
  bytesToBigint,
  deriveAddress,
} from "@/lib/eth-tx";

const RPC = "https://rpc.testnet.chain.robinhood.com";
const CHAIN_ID = 46630; // 0xb626 — verified live
const ROOT = join(import.meta.dir, "..", "..");

const arg = (name: string, def: string) => {
  const i = process.argv.indexOf(name);
  return i >= 0 ? process.argv[i + 1] : def;
};
const GAS_MULT = BigInt(arg("--gas-mult", "2"));
const WAIT_S = Number(arg("--wait", "120"));

// ---------------------------------------------------------------- RPC client
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

// ----------------------------------------------------------------- load key
const keyFile = process.env.HOME + "/.cc-minter-key";
const keyHex = (process.env.MINTER_KEY || readFileSync(keyFile, "utf8")).trim().replace(/^0x/, "");
const key = hexToBytes("0x" + keyHex);
const minter = deriveAddress(key);
console.log("minter:", minter);

// --------------------------------------------------------------- preflight
const chainId = Number(await rpc("eth_chainId"));
if (chainId !== CHAIN_ID) throw new Error(`wrong chain: ${chainId} ≠ ${CHAIN_ID}`);
console.log("chain: 46630 (Robinhood Chain testnet) ✓");

const balWei = bytesToBigint(hexQuantityToBytes((await rpc("eth_getBalance", [minter, "latest"])) as string));
console.log("balance:", balWei, "wei =", Number(balWei) / 1e18, "ETH");
if (balWei === 0n) {
  console.error("\n✋ MINTER UNFUNDED — one manual step (Cloudflare + Google sign-in are required by the faucet; automation is refused by design):\n" +
    `  1. open https://faucet.testnet.chain.robinhood.com/\n` +
    `  2. send to: ${minter}\n` +
    `  3. click "Send tokens" (0.01 testnet ETH — ~700× the deploy cost)\n` +
    "  then re-run this script.");
  process.exit(3);
}

// ------------------------------------------------------------ build the tx
const { bytecode } = JSON.parse(readFileSync(join(ROOT, "src/lib/deathcard/bytecode.json"), "utf8")) as { bytecode: string };
const data = hexToBytes(bytecode);

const nonce = bytesToBigint(hexQuantityToBytes((await rpc("eth_getTransactionCount", [minter, "pending"])) as string));
const baseGas = bytesToBigint(hexQuantityToBytes((await rpc("eth_gasPrice")) as string));
const gasPrice = (baseGas * GAS_MULT) | 0n;
console.log("nonce:", nonce, "· gasPrice:", gasPrice, `(${Number(gasPrice) / 1e9} gwei)`);

let gas = 2_500_000n; // safe fallback for a ~4KB minimal ERC-721
try {
  const est = await rpc("eth_estimateGas", [{ from: minter, data: hex(data) }]);
  gas = bytesToBigint(hexQuantityToBytes(est as string));
  console.log("estimated gas:", gas);
} catch (e) {
  console.log("estimateGas unavailable, using fallback", String(gas), "·", (e as Error).message);
}
gas = (gas * 120n) / 100n; // +20% headroom

const maxCost = gas * gasPrice;
if (maxCost > balWei) {
  console.error(`insufficient: deploy needs ~${maxCost} wei, have ${balWei}`);
  process.exit(3);
}

const signed = signLegacyTx({ nonce, gasPrice, gas, to: null, value: 0n, data, chainId: CHAIN_ID }, key);
console.log("signed creation tx:", signed.txHash);

// ---------------------------------------------------------------- send+wait
const txHash = (await rpc("eth_sendRawTransaction", [signed.rawHex])) as string;
console.log("submitted:", txHash);

let receipt: { status?: string; contractAddress?: string; blockNumber?: string } | null = null;
for (let i = 0; i < WAIT_S; i++) {
  await new Promise((r) => setTimeout(r, 1000));
  receipt = await rpc("eth_getTransactionReceipt", [txHash]) as typeof receipt;
  if (receipt) break;
  if (i % 10 === 9) console.log(`  waiting… ${i + 1}s`);
}
if (!receipt) throw new Error(`no receipt after ${WAIT_S}s — check ${txHash}`);
if (receipt.status !== "0x1") throw new Error(`FAILED on-chain: status ${receipt.status}`);
const address = receipt.contractAddress as string;
console.log("\nDEPLOYED:", address, "at block", Number(bytesToBigint(hexQuantityToBytes(receipt.blockNumber as string))));

// ------------------------------------------------------------------ verify
const code = (await rpc("eth_getCode", [address, "latest"])) as string;
if (code.length < 100) throw new Error("empty code at address");
const callString = async (sel: string): Promise<string> =>
  decodeAbiString((await rpc("eth_call", [{ to: address, data: sel }, "latest"])) as string);
// name()/symbol() return strings; owner() returns an address — decode manually
const decodeFn = async (selData: string, word = false): Promise<string> => {
  const ret = (await rpc("eth_call", [{ to: address, data: selData }, "latest"])) as string;
  const b = hexToBytes(ret);
  return word
    ? "0x" + bytesToHex(b.slice(12, 32))
    : new TextDecoder().decode(b.slice(Number(bytesToBigint(b.slice(0, 32))) + 32, Number(bytesToBigint(b.slice(0, 32))) + 32 + Number(bytesToBigint(b.slice(32, 64)))));
};
const name = await callString("0x06fdde03"); // name()
const symbol = await callString("0x95d89b41"); // symbol()
const owner = await decodeFn("0x8da5cb5b", true); // owner()
console.log("verify:", { name, symbol, owner });

if (owner.toLowerCase() !== minter.toLowerCase()) throw new Error(`owner ${owner} ≠ minter ${minter}`);
console.log("owner == minter ✓");

// ------------------------------------------------------------------ record
const rec = { address, chainId: CHAIN_ID, txHash, deployedAt: new Date().toISOString(), deployer: minter, name, symbol };
writeFileSync(join(ROOT, "src/lib/deathcard/address.json"), JSON.stringify(rec, null, 2) + "\n");
console.log("recorded → src/lib/deathcard/address.json (commit this)");
console.log("\nmint calldata self-check (first mint):");
console.log("  ", encodeMintCalldata(minter, new Uint8Array(32), "{}").slice(0, 74) + "…");

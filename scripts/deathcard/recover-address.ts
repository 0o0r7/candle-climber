// Recover a contract address from its creation tx deterministically:
// CREATE address = keccak256(rlp([sender(20), nonce]))[12:].
// Ops tool for the "deploy tx mined, post-steps crashed" case — recompute the
// address, verify code + name()/symbol()/owner()/minter() on-chain.
//
// Usage: bun scripts/deathcard/recover-address.ts --deployer 0x… [--nonce 0]
import { keccak_256 } from "@noble/hashes/sha3.js";
import { bytesToHex, hexToBytes, rlpEncode } from "@/lib/eth-tx";

const RPC = "https://rpc.testnet.chain.robinhood.com";

const arg = (name: string, def?: string) => {
  const i = process.argv.indexOf(name);
  return i >= 0 ? process.argv[i + 1] : def;
};
const DEPLOYER = (arg("--deployer") || "").toLowerCase();
const NONCE = BigInt(arg("--nonce", "0"));
if (!/^0x[0-9a-f]{40}$/.test(DEPLOYER)) throw new Error("pass --deployer 0x… (40 hex)");

let id = 0;
async function rpc(method: string, params: unknown[] = []): Promise<unknown> {
  const res = await fetch(RPC, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: ++id, method, params }),
    signal: AbortSignal.timeout(20000),
  });
  const j = await res.json() as { result?: unknown; error?: { message: string } };
  if (j.error) throw new Error(`RPC ${method}: ${j.error.message}`);
  return j.result;
}

const sender = hexToBytes(DEPLOYER);
let nonceHex = NONCE.toString(16);
if (nonceHex.length % 2) nonceHex = "0" + nonceHex;
const nonceBytes = NONCE === 0n ? new Uint8Array(0) : hexToBytes("0x" + nonceHex);
const hash = keccak_256(rlpEncode([sender, nonceBytes]));
const address = "0x" + bytesToHex(hash.slice(12));
console.log("CREATE address (deployer, nonce", NONCE, "):", address);

const code = (await rpc("eth_getCode", [address, "latest"])) as string;
console.log("code size:", (code.length - 2) / 2, "bytes");
if (code.length < 100) throw new Error("NO CODE at recovered address — wrong guess");

const decodeWord = async (sel: string) => {
  const r = (await rpc("eth_call", [{ to: address, data: sel }, "latest"])) as string;
  return "0x" + bytesToHex(hexToBytes(r).slice(12, 32));
};
const decodeStr = async (sel: string) => {
  const r = hexToBytes((await rpc("eth_call", [{ to: address, data: sel }, "latest"])) as string);
  const off = Number(BigInt("0x" + bytesToHex(r.slice(0, 32))));
  const len = Number(BigInt("0x" + bytesToHex(r.slice(32, 64))));
  return new TextDecoder().decode(r.slice(off + 32, off + 32 + len));
};

const name = await decodeStr("0x06fdde03"); // name()
const symbol = await decodeStr("0x95d89b41"); // symbol()
const owner = await decodeWord("0x8da5cb5b"); // owner()
const minterSel = "0x" + bytesToHex(keccak_256(new TextEncoder().encode("minter()")).slice(0, 4));
const minter = await decodeWord(minterSel);
// NOTE: deliberately NO totalSupply() — the minimal ERC-721 does not implement it.

console.log({ name, symbol, owner, minter });
console.log("\nSTATE:", owner.toLowerCase() === DEPLOYER.toLowerCase()
  ? "owner == deployer — setOwner hand-over still PENDING"
  : `owner == ${owner} — hand-over already done`);

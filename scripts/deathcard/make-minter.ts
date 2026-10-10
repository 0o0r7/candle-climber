// Generate the DEATH CARD MINTER wallet — a dedicated key whose ONLY power is
// calling mint() on the testnet CCDeathCard contract. Never committed; stored
// 0600 next to the other local secrets. Idempotent: refuses to overwrite.
import { randomBytes } from "node:crypto";
import { existsSync, readFileSync, writeFileSync, chmodSync } from "node:fs";
import { deriveAddress } from "@/lib/eth-tx";

const KEY_PATH = process.env.HOME + "/.cc-minter-key";

if (existsSync(KEY_PATH)) {
  const key = hexToBytes32(readFileSync(KEY_PATH, "utf8").trim());
  console.log("minter wallet already exists:", deriveAddress(key));
  console.log("(refusing to overwrite — delete " + KEY_PATH + " consciously if you mean it)");
  process.exit(0);
}

const key = new Uint8Array(randomBytes(32));
writeFileSync(KEY_PATH, bytesToHex(key) + "\n", { mode: 0o600 });
chmodSync(KEY_PATH, 0o600);

function hexToBytes32(hex: string): Uint8Array {
  const h = hex.replace(/^0x/, "");
  const out = new Uint8Array(32);
  for (let i = 0; i < 32; i++) out[i] = parseInt(h.slice(i * 2, i * 2 + 2), 16);
  return out;
}
function bytesToHex(b: Uint8Array): string {
  return [...b].map((x) => x.toString(16).padStart(2, "0")).join("");
}
console.log("minter wallet GENERATED:", deriveAddress(key));
console.log("key stored:", KEY_PATH, "(0600, not committed)");

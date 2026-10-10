// Build the CCDeathCard contract → committed artifacts (ABI + creation bytecode).
// Zero runtime dependency: the app never imports solc — only the emitted JSON.
// Usage: bun scripts/deathcard/build-deathcard.ts
import solc from "solc";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { keccak_256 } from "@noble/hashes/sha3.js";

const ROOT = join(import.meta.dir, "..", "..");
const SRC = join(ROOT, "contracts", "CCDeathCard.sol");
const OUT_DIR = join(ROOT, "src", "lib", "deathcard");

const source = readFileSync(SRC, "utf8");
const input = {
  language: "Solidity",
  sources: { "CCDeathCard.sol": { content: source } },
  settings: {
    optimizer: { enabled: true, runs: 200 },
    evmVersion: "paris", // no PUSH0 dependency — widest EVM compatibility (Orbit chain is fine either way)
    outputSelection: {
      "*": { "*": ["abi", "evm.bytecode.object"] },
    },
  },
};

const output = JSON.parse(solc.compile(JSON.stringify(input)));

const errors = (output.errors ?? []).filter((e: { severity: string }) => e.severity === "error");
if (errors.length) {
  console.error("COMPILE ERRORS:\n" + errors.map((e: { formattedMessage: string }) => e.formattedMessage).join("\n"));
  process.exit(1);
}
for (const w of output.errors ?? []) console.warn("[solc]", w.formattedMessage.trim());

const contract = output.contracts["CCDeathCard.sol"]["CCDeathCard"];
const bytecode = "0x" + contract.evm.bytecode.object;
const abi = contract.abi;

mkdirSync(OUT_DIR, { recursive: true });
writeFileSync(join(OUT_DIR, "abi.json"), JSON.stringify(abi, null, 2) + "\n");
writeFileSync(join(OUT_DIR, "bytecode.json"), JSON.stringify({ bytecode, compiler: solc.version(), compiledAt: new Date().toISOString() }, null, 2) + "\n");

// Selector sanity print (human check; test/eth-tx.test.ts asserts the canonical ones)
const hex4 = (u: Uint8Array) => [...u].map((b) => b.toString(16).padStart(2, "0")).join("");
const sig = (s: string) => "0x" + hex4(keccak_256(new TextEncoder().encode(s)).slice(0, 4));
console.log("compiled OK — bytecode", bytecode.length, "chars · ABI entries", abi.length);
console.log("  mint selector        ", sig("mint(address,bytes32,string)"));
console.log("  mintedByRun selector ", sig("mintedByRun(bytes32)"));
console.log("  tokenURI selector    ", sig("tokenURI(uint256)"));
console.log("  owner selector       ", sig("owner()"));

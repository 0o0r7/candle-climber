// Merkle tree over the weights snapshot (E2.5 / P6.1 — spec §7.3).
// PURE crypto-shape math: leaves in, root + proofs out. Hashing is WebCrypto
// SHA-256 (async) so the SAME module runs on the server, in the browser
// (claim-page proof verification) and in bun tests. Zero dependencies.
//
// Determinism: the caller pins the leaf order (the airdrop route sorts by
// wallet asc); identical input ⇒ identical root, always (W5 rule).
// Rehearsal salt is a public constant — the real snapshot re-pins and
// publishes its salt with the root.

const enc = new TextEncoder();
export const MERKLE_SALT = "wick-weights-v1"; // published with any root we announce

async function sha256Hex(data: Uint8Array): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", data as unknown as ArrayBuffer);
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

/** Leaf commitment for one wallet's capped weight. */
export function leafHash(wallet: string, points: number): Promise<string> {
  return sha256Hex(enc.encode(`${MERKLE_SALT}:${wallet.toLowerCase()}:${points}`));
}

async function hashPair(a: string, b: string): Promise<string> {
  return sha256Hex(enc.encode(a + b));
}

export interface MerkleTree {
  root: string;
  levels: string[][]; // levels[0] = leaves … levels[n] = [root]
}

/**
 * Build the tree. An odd node count at any level duplicates its last node
 * (Bitcoin-style) — deterministic and standard.
 */
export async function buildMerkleTree(leaves: string[]): Promise<MerkleTree> {
  if (leaves.length === 0) return { root: "", levels: [] };
  const levels: string[][] = [[...leaves]];
  let cur = levels[0];
  while (cur.length > 1) {
    const next: string[] = [];
    for (let i = 0; i < cur.length; i += 2) {
      const a = cur[i];
      const b = i + 1 < cur.length ? cur[i + 1] : cur[i]; // odd → duplicate last
      next.push(await hashPair(a, b));
    }
    levels.push(next);
    cur = next;
  }
  return { root: cur[0], levels };
}

export interface MerkleProofStep {
  pos: "L" | "R"; // sibling side
  hash: string;
}

/** Inclusion proof for leaf `index` (0-based). */
export function getProof(tree: MerkleTree, index: number): MerkleProofStep[] {
  const proof: MerkleProofStep[] = [];
  let i = index;
  for (let lvl = 0; lvl < tree.levels.length - 1; lvl++) {
    const level = tree.levels[lvl];
    const sib = i % 2 === 0 ? (i + 1 < level.length ? i + 1 : i) : i - 1; // odd-length: lone node pairs with itself
    proof.push({ pos: i % 2 === 0 ? "R" : "L", hash: level[sib] });
    i = Math.floor(i / 2);
  }
  return proof;
}

/** Verify an inclusion proof against a root (server, browser, or test). */
export async function verifyProof(
  leaf: string,
  proof: MerkleProofStep[],
  root: string,
): Promise<boolean> {
  let h = leaf;
  for (const step of proof) {
    h = step.pos === "L" ? await hashPair(step.hash, h) : await hashPair(h, step.hash);
  }
  return h === root;
}

/// <reference types="bun-types" />
// W5 — Merkle airdrop rehearsal contract tests (E2.5/P6.1, bun test, zero deps).
// Pins: deterministic roots, inclusion proofs verify, tamper detection, odd
// leaf counts (duplicate-last rule), and the single-leaf edge case.
import { describe, test, expect } from "bun:test";
import {
  buildMerkleTree,
  getProof,
  leafHash,
  verifyProof,
  MERKLE_SALT,
} from "@/lib/merkle";

const W1 = "0xaaa0000000000000000000000000000000000001";
const W2 = "0xbbb0000000000000000000000000000000000002";
const W3 = "0xccc0000000000000000000000000000000000003";
const W4 = "0xddd0000000000000000000000000000000000004";
const W5 = "0xeee0000000000000000000000000000000000005";

describe("merkle · leaves", () => {
  test("leaf hash is deterministic and wallet-case-normalized", async () => {
    const a = await leafHash(W1, 42);
    const b = await leafHash(W1.toUpperCase(), 42);
    expect(a).toBe(b);
    expect(a).toMatch(/^[0-9a-f]{64}$/);
  });
  test("different wallet or points → different leaf", async () => {
    expect(await leafHash(W1, 42)).not.toBe(await leafHash(W2, 42));
    expect(await leafHash(W1, 42)).not.toBe(await leafHash(W1, 43));
  });
});

describe("merkle · tree", () => {
  test("same leaves in the same (caller-sorted) order ⇒ identical root", async () => {
    const leaves = [await leafHash(W1, 10), await leafHash(W2, 20), await leafHash(W3, 30)];
    const t1 = await buildMerkleTree(leaves);
    const t2 = await buildMerkleTree([...leaves]);
    expect(t1.root).toBe(t2.root);
    expect(t1.root).toMatch(/^[0-9a-f]{64}$/);
  });
  test("changing one leaf changes the root", async () => {
    const leaves = [await leafHash(W1, 10), await leafHash(W2, 20), await leafHash(W3, 30)];
    const t1 = await buildMerkleTree(leaves);
    const t2 = await buildMerkleTree([leaves[0], await leafHash(W2, 21), leaves[2]]);
    expect(t1.root).not.toBe(t2.root);
  });
  test("empty tree has an empty root (route guards it)", async () => {
    const t = await buildMerkleTree([]);
    expect(t.root).toBe("");
    expect(t.levels).toHaveLength(0);
  });
});

describe("merkle · proofs", () => {
  const buildWith = async (wallets: [string, number][]) => {
    const rows = wallets.sort((a, b) => (a[0] < b[0] ? -1 : 1));
    const leaves = await Promise.all(rows.map(([w, p]) => leafHash(w, p)));
    return { rows, tree: await buildMerkleTree(leaves) };
  };

  test("every leaf of a 3-leaf tree verifies", async () => {
    const { rows, tree } = await buildWith([[W1, 10], [W2, 20], [W3, 30]]);
    for (let i = 0; i < rows.length; i++) {
      const leaf = await leafHash(rows[i][0], rows[i][1]);
      expect(await verifyProof(leaf, getProof(tree, i), tree.root)).toBe(true);
    }
  });

  test("every leaf of a 5-leaf tree verifies (odd level duplicates last node)", async () => {
    const { rows, tree } = await buildWith([[W1, 10], [W2, 20], [W3, 30], [W4, 40], [W5, 50]]);
    expect(tree.levels[0]).toHaveLength(5);
    for (let i = 0; i < rows.length; i++) {
      const leaf = await leafHash(rows[i][0], rows[i][1]);
      expect(await verifyProof(leaf, getProof(tree, i), tree.root)).toBe(true);
    }
  });

  test("tampered leaf or points fail verification", async () => {
    const { rows, tree } = await buildWith([[W1, 10], [W2, 20], [W3, 30]]);
    const idx = rows.findIndex(([w]) => w === W2);
    const proof = getProof(tree, idx);
    expect(await verifyProof(await leafHash(W2, 999), proof, tree.root)).toBe(false);
    expect(await verifyProof(await leafHash(W3, 20), proof, tree.root)).toBe(false);
  });

  test("single-leaf tree: root == leaf, proof verifies", async () => {
    const leaf = await leafHash(W1, 7);
    const tree = await buildMerkleTree([leaf]);
    expect(tree.root).toBe(leaf);
    expect(await verifyProof(leaf, getProof(tree, 0), tree.root)).toBe(true);
  });

  test("salt is a published constant (rehearsal pins it with the root)", () => {
    expect(MERKLE_SALT).toBe("wick-weights-v1");
  });
});

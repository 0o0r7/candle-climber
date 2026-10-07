// /api/airdrop — Merkle airdrop board + proof lookup (E2.5 / P6.1).
// REHEARSAL surface: builds a deterministic Merkle tree over the CURRENT
// weights snapshot (linked wallets only, anomaly-flagged wallets excluded),
// announces the root, and serves per-wallet inclusion proofs that anyone can
// verify (server, browser, or test). Nothing is claimable yet — $WICK is
// pre-graduation with transfers locked; the real snapshot freezes + publishes
// its salt/root when the meter fills. Language law applies everywhere.
import { NextResponse } from "next/server";
import { WALLET_SNAPSHOT_CAP } from "@/lib/weights";
import { getWeights } from "@/lib/weights-store";
import {
  buildMerkleTree,
  getProof,
  leafHash,
  verifyProof,
  MERKLE_SALT,
} from "@/lib/merkle";

export const dynamic = "force-dynamic";

const REHEARSAL_META = {
  status: "rehearsal — testnet; nothing claimable yet",
  cap: WALLET_SNAPSHOT_CAP,
  salt: MERKLE_SALT,
  language:
    "weights are entitlements built by playing — distributions, if any, happen after graduation; nothing guaranteed",
  laws: "docs/ECONOMY-LAWS.md",
};

/** Deterministic draft tree over the current snapshot (sorted by wallet asc). */
async function draftTree() {
  const store = getWeights();
  const snap = await store.snapshot(WALLET_SNAPSHOT_CAP);
  const clean = snap.wallets
    .filter((w) => !w.flagged)
    .map((w) => ({ wallet: w.wallet, points: w.points }))
    .sort((a, b) => (a.wallet < b.wallet ? -1 : a.wallet > b.wallet ? 1 : 0));
  const leaves = await Promise.all(clean.map((l) => leafHash(l.wallet, l.points)));
  const tree = await buildMerkleTree(leaves);
  return { snap, clean, tree };
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  try {
    const { snap, clean, tree } = await draftTree();

    // ?proof=0x… — per-wallet inclusion proof for the CURRENT draft tree.
    const proofFor = searchParams.get("proof");
    if (proofFor) {
      const wallet = proofFor.toLowerCase();
      const idx = clean.findIndex((l) => l.wallet === wallet);
      if (idx === -1 || !tree.root) {
        return NextResponse.json(
          { ok: false, error: "wallet not in the current rehearsal snapshot", meta: REHEARSAL_META },
          { status: 404 },
        );
      }
      const proof = getProof(tree, idx);
      const leaf = await leafHash(wallet, clean[idx].points);
      const verified = await verifyProof(leaf, proof, tree.root);
      return NextResponse.json(
        {
          ok: true,
          wallet,
          points: clean[idx].points,
          leaf,
          index: idx,
          proof,
          root: tree.root,
          verified,
          meta: REHEARSAL_META,
        },
        { headers: { "cache-control": "no-store" } },
      );
    }

    // default: board — root announcement + aggregate stats
    return NextResponse.json(
      {
        ok: true,
        root: tree.root,
        leafCount: clean.length,
        totalPoints: clean.reduce((s, l) => s + l.points, 0),
        flaggedCount: snap.wallets.filter((w) => w.flagged).length,
        rowCount: snap.rowCount,
        top: clean.slice(0, 10),
        meta: REHEARSAL_META,
      },
      { headers: { "cache-control": "no-store" } },
    );
  } catch {
    return NextResponse.json({ ok: false, error: "airdrop-unavailable" }, { status: 200 });
  }
}

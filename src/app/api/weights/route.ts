import { NextResponse } from "next/server";
import { sanitizeName } from "@/lib/board-validation";
import { WALLET_SNAPSHOT_CAP } from "@/lib/weights";
import { getWeights } from "@/lib/weights-store";

export const dynamic = "force-dynamic";

// /api/weights — PUBLIC READ view of the airdrop-weights ledger (E2.2/P4.4).
// Spec: docs/WICK-ECONOMY-SPEC.md §7. There is NO write path here by design:
// the ledger only accrues from W1-HMAC-verified leaderboard submissions wired
// server-side (anti-sybil red line §8.4). Weights are entitlements to future
// distributions — never rank, never score, never access (ECONOMY-LAWS LAW 1).

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const store = getWeights();

  try {
    if (searchParams.get("snapshot")) {
      const snap = await store.snapshot(WALLET_SNAPSHOT_CAP);
      return NextResponse.json(
        {
          ok: true,
          rowCount: snap.rowCount,
          wallets: snap.wallets,
          flagged: snap.wallets.filter((w) => w.flagged).map((w) => w.wallet),
          meta: {
            cap: WALLET_SNAPSHOT_CAP,
            status: "accruing", // Merkle rehearsal: GET /api/airdrop (E2.5) · board: /airdrop
            numbers: "provisional — docs/WICK-ECONOMY-SPEC.md §7",
            laws: "docs/ECONOMY-LAWS.md",
          },
        },
        { headers: { "cache-control": "no-store" } },
      );
    }

    const name = sanitizeName(searchParams.get("name"));
    const summary = await store.summary(name);
    return NextResponse.json(
      {
        ok: true,
        ...summary,
        meta: {
          language: "weights build toward possible future distributions — nothing earned or guaranteed",
          laws: "docs/ECONOMY-LAWS.md",
        },
      },
      { headers: { "cache-control": "no-store" } },
    );
  } catch {
    // Fail-open: the ledger is read-only auxiliary — it must never surface as a game error.
    return NextResponse.json({ ok: false, error: "weights-unavailable" }, { status: 200 });
  }
}

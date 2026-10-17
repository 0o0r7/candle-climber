// /api/forge/leaderboard — Signal Forge daily board (Phase 1).
// Storage: MongoStore when DATABASE_URL is set, else in-memory (same posture as
// the classic board). Two lanes, never mixed (LAW 1.2 Option B):
//   GET  ?board=guest    (default) walletless board
//   GET  ?board=official           wallet-bound records, best run per wallet
//   POST                          wallet + VALID personal_sign proof ⇒ official
//                                 lane, anything less ⇒ guest lane (never an error)
//
// Integrity (Phase 1):
//   - every submission MUST carry the HMAC forgeRunToken issued by GET
//     /api/candles; symbol/date are pinned from the VERIFIED token payload
//     (client-claimed symbol/date are ignored).
//   - MUTATION/SEED validation: the arena's mutation is a pure function of
//     (date, symbol) — the server re-derives it and rejects any submission
//     claiming a different one.
//   - physical caps reject impossible scores/signals/chains.
// Public GET responses mask wallets to the chip-style short form.
import { NextResponse } from "next/server";
import { getForgeBoard } from "@/lib/forge-board-store";
import { verifyForgeToken } from "@/lib/forge-token";
import { isTokenStale } from "@/lib/run-token";
import { validateForgeSubmission, type ForgeBoardEntry, type ForgeBoardFilter } from "@/lib/forge-board-validation";
import { verifyForgeProof } from "@/lib/wallet-proof";
import type { ProofRejectReason } from "@/lib/wallet-proof";
import { normalizeWallet } from "@/lib/weights";
import { shortAddress } from "@/lib/wallet";
import { rateLimited, clientIp } from "@/lib/http-limiter";
import { claimNonce, releaseNonce, consumeNonce } from "@/lib/nonce-store";
import { utcDateStr } from "@/game/cc/rng";

export const dynamic = "force-dynamic";

const BOARDS: ForgeBoardFilter[] = ["guest", "official"];

function boardParam(raw: string | null): ForgeBoardFilter {
  return BOARDS.includes(raw as ForgeBoardFilter) ? (raw as ForgeBoardFilter) : "guest";
}

function maskWallets(entries: ForgeBoardEntry[]): ForgeBoardEntry[] {
  return entries.map((e) => (e.wallet ? { ...e, wallet: shortAddress(e.wallet) } : e));
}

export async function GET(req: Request) {
  if (rateLimited(clientIp(req), 60)) {
    return NextResponse.json({ error: "rate limited" }, { status: 429 });
  }
  const { searchParams } = new URL(req.url);
  const date = searchParams.get("date") || utcDateStr();
  const board = boardParam(searchParams.get("board"));
  const store = getForgeBoard();

  const entries = maskWallets(await store.top(date, 50, board));

  // verified-first: the guest view also returns the official top entries so the
  // UI can show wallet-proven scores first (same promise as the classic board).
  let official: ForgeBoardEntry[] | undefined;
  if (board === "guest") {
    official = maskWallets(await store.top(date, 10, "official"));
  }

  return NextResponse.json(
    { entries, official, date, board, store: store.kind },
    { headers: { "cache-control": "no-store" } },
  );
}

export async function POST(req: Request) {
  const ip = clientIp(req);
  if (rateLimited(ip, 20)) {
    return NextResponse.json({ error: "slow down" }, { status: 429 });
  }
  try {
    const body = (await req.json()) as Partial<ForgeBoardEntry> & {
      runToken?: unknown;
      address?: unknown;
      signature?: unknown;
      ts?: unknown;
      nonce?: unknown;
    };

    // run token: mandatory, signature-verified, shape-checked
    const tok = verifyForgeToken(body.runToken);
    if (!tok) {
      return NextResponse.json({ error: "invalid run token" }, { status: 403 });
    }
    if (isTokenStale(tok.date)) {
      return NextResponse.json({ error: "run token expired" }, { status: 403 });
    }

    // per-submission unique nonce — the run token is shared per arena by design,
    // so a nonce closes the replay vector. Atomic set-if-absent claim.
    const nonce = typeof body.nonce === "string" ? body.nonce : null;
    if (nonce && (nonce.length < 8 || nonce.length > 64)) {
      return NextResponse.json({ error: "invalid nonce" }, { status: 400 });
    }
    if (nonce && !claimNonce(nonce)) {
      return NextResponse.json({ error: "nonce already used" }, { status: 409 });
    }

    // lane decision: ONLY a wallet with a VALID ownership proof lands on the
    // official lane. A claimed wallet whose proof is absent/invalid/stale
    // degrades to guest (fail-open — play is never blocked).
    const claimed = normalizeWallet(body.address);
    const signature = typeof body.signature === "string" ? body.signature : null;
    let wallet: string | null = null;
    let reject: ProofRejectReason | null = null;
    if (claimed && signature) {
      const draft = validateForgeSubmission(body, tok, Date.now(), claimed);
      if (!draft.ok) {
        if (nonce) releaseNonce(nonce);
        return NextResponse.json({ error: draft.error }, { status: draft.status });
      }
      const proof = verifyForgeProof(
        claimed,
        signature,
        {
          score: draft.entry.score,
          survivalTime: draft.entry.survivalTime,
          signalsCollected: draft.entry.signalsCollected,
          date: draft.entry.date,
          wallet: claimed,
        },
        body.ts,
        Date.now(),
      );
      if (proof.ok) wallet = claimed;
      else reject = proof.reason;
    }

    // pure validation core: mutation/seed check + terrain-physical anti-cheat caps
    const verdict = validateForgeSubmission(body, tok, Date.now(), wallet);
    if (!verdict.ok) {
      if (nonce) releaseNonce(nonce);
      return NextResponse.json({ error: verdict.error }, { status: verdict.status });
    }

    if (nonce) consumeNonce(nonce);

    const store = getForgeBoard();
    const rank = await store.add(verdict.entry);
    return NextResponse.json({
      ok: true,
      rank,
      board: verdict.entry.board,
      store: store.kind,
      // honest degrade note — only when an official run was claimed but the
      // ownership proof did not verify
      ...(reject ? { note: `official proof rejected (${reject}) — run posted as guest` } : {}),
    });
  } catch {
    return NextResponse.json({ error: "bad request" }, { status: 400 });
  }
}

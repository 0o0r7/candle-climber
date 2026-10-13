// /api/practice — H1 ARCHIVE weight lane (E2.3, spec §7.2 row 2).
// A verified run on PAST terrain (archive/practice mode) banks 0.5 weight,
// capped at 2 per identity per UTC day (folded into one ledger row).
// Integrity: the runToken must be a server-signed token for a strictly PAST
// date — today's tokens are rejected (the classic lane covers those via
// /api/leaderboard). Archive terrain is immutable, so a valid token proves the
// request names a REAL historical level. G5 honesty fix (129-c #9): it does
// NOT prove that level was PLAYED — the token is deterministic and publicly
// fetchable via GET /api/candles?date=<past>, so token-only banking is
// possible without a run. The honest residual bounds: 0.5×2 weights/identity/
// day (≈3% of one classic-run day), unlinked identities are excluded from
// snapshots, wallet-linked caps apply (600/wallet) and >2 identities/day is
// anomaly-flagged. Stated here rather than overstated.
import { NextResponse } from "next/server";
import { verifyRunToken } from "@/lib/run-token";
import { utcDate, normalizeWallet, PRACTICE_POINTS, PRACTICE_DAILY_CAP } from "@/lib/weights";
import { sanitizeName } from "@/lib/board-validation";
import { recordPracticeRun } from "@/lib/weights-store";
import { weightsFrozen, WEIGHTS_FROZEN_RESPONSE } from "@/lib/graduation"; // E6.1
import { rateLimited, clientIp, bodyTooLarge } from "@/lib/http-limiter"; // delivery hardening 2026-10-13
// LU-2: wallet ownership proof — optional, fail-open (wallet ignored without proof)
import { verifyWalletLinkProof } from "@/lib/wallet-proof";

export const dynamic = "force-dynamic";

const META = {
  language: "practice runs build airdrop weights — nothing earned or guaranteed; testnet",
  lane: `0.5 per archive run, max ${PRACTICE_DAILY_CAP} weights per day`,
};

export async function POST(req: Request) {
  // G5 (129-a #11): reject oversized bodies before parsing (self-host has no cap).
  if (bodyTooLarge(req)) {
    return NextResponse.json({ error: "payload too large" }, { status: 413 });
  }

  if (rateLimited("practice", clientIp(req), 10)) {
    return NextResponse.json({ ok: false, error: "rate limited" }, { status: 429 });
  }
  try {
    const body = (await req.json()) as {
      runToken?: unknown;
      name?: unknown;
      address?: unknown;
      signature?: unknown; // LU-2: wallet ownership proof (optional)
      ts?: unknown; // LU-2: client timestamp inside the signed message
    };
    const tok = verifyRunToken(body.runToken);
    if (!tok) {
      return NextResponse.json({ error: "invalid run token" }, { status: 403 });
    }
    // E6.1 snapshot freeze: honest pause (archive runs keep playing — the event
    // simply is not banked during the graduation snapshot window)
    if (weightsFrozen()) {
      return NextResponse.json(WEIGHTS_FROZEN_RESPONSE, { status: 503 });
    }
    if (tok.date >= utcDate()) {
      // today's terrain scores via the leaderboard lane, not practice
      return NextResponse.json({ error: "practice is for archive terrain only" }, { status: 400 });
    }
    const name = sanitizeName(body.name);
    // LU-2: a wallet address is only linked to the weights ledger when the
    // caller proves ownership via a personal_sign proof (purpose-separated
    // from the board proof). Without proof, the run still banks weights under
    // the name-only identity — play is never blocked (fail-open, LAW 1.2).
    const claimedWallet = normalizeWallet(body.address);
    let wallet: string | null = null;
    if (claimedWallet) {
      const proof = verifyWalletLinkProof(
        claimedWallet,
        body.signature,
        { wallet: claimedWallet, purpose: "practice", date: tok.date },
        body.ts,
        Date.now(),
      );
      if (proof.ok) wallet = claimedWallet;
    }
    const row = await recordPracticeRun(name, wallet);
    return NextResponse.json({
      ok: true,
      date: tok.date,
      symbol: tok.symbol,
      banked: row.points,
      meta: { ...META, lane: `${PRACTICE_POINTS} per archive run, max ${PRACTICE_DAILY_CAP} weights per day` },
    });
  } catch {
    return NextResponse.json({ error: "bad request" }, { status: 400 });
  }
}

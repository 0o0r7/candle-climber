// /api/practice — H1 ARCHIVE weight lane (E2.3, spec §7.2 row 2).
// A verified run on PAST terrain (archive/practice mode) banks 0.5 weight,
// capped at 2 per identity per UTC day (folded into one ledger row).
// Integrity: the runToken must be a server-signed token for a strictly PAST
// date — today's tokens are rejected (the classic lane covers those via
// /api/leaderboard). Archive terrain is immutable, so a valid token IS the
// proof a real historical level was played.
import { NextResponse } from "next/server";
import { verifyRunToken } from "@/lib/run-token";
import { utcDate, normalizeWallet, PRACTICE_POINTS, PRACTICE_DAILY_CAP } from "@/lib/weights";
import { sanitizeName } from "@/lib/board-validation";
import { recordPracticeRun } from "@/lib/weights-store";

export const dynamic = "force-dynamic";

const META = {
  language: "practice runs build airdrop weights — nothing earned or guaranteed; testnet",
  lane: `0.5 per archive run, max ${PRACTICE_DAILY_CAP} weights per day`,
};

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      runToken?: unknown;
      name?: unknown;
      address?: unknown;
    };
    const tok = verifyRunToken(body.runToken);
    if (!tok) {
      return NextResponse.json({ error: "invalid run token" }, { status: 403 });
    }
    if (tok.date >= utcDate()) {
      // today's terrain scores via the leaderboard lane, not practice
      return NextResponse.json({ error: "practice is for archive terrain only" }, { status: 400 });
    }
    const name = sanitizeName(body.name);
    const wallet = normalizeWallet(body.address);
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

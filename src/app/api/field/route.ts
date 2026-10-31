// /api/field — the crowd read for one UTC day (reference-study P1).
//
// Read-only, lane-scoped, counts-first. Same store the leaderboard reads, no
// self-fetch. Two lanes never mix (ECONOMY-LAWS LAW 1.2): `?board=guest`
// (default, walletless, unverified) or `?board=official` (wallet-proven rows
// only). `board=all` is refused rather than silently blended.
import { NextResponse } from "next/server";
import { getBoard, type BoardFilter, type BoardEntry } from "@/lib/leaderboard-store";
import { summarizeField } from "@/lib/field";
import { isInterval } from "@/game/cc/level-source";
import { utcDateStr } from "@/game/cc/rng";
import { rateLimited, clientIp } from "@/lib/http-limiter";

export const dynamic = "force-dynamic";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const LANES = ["guest", "official"] as const;
/** Public read cap — the field is a distribution, not a full table dump. */
const FIELD_LIMIT = 500;
const TOP_N = 3;

function laneParam(raw: string | null): BoardFilter {
  return (LANES as readonly string[]).includes(raw ?? "") ? (raw as BoardFilter) : "guest";
}

function validDate(raw: string, today: string): boolean {
  if (!DATE_RE.test(raw)) return false;
  if (!Number.isFinite(Date.parse(`${raw}T00:00:00Z`))) return false;
  return raw <= today; // future terrain does not exist (W1 invariant)
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  if (rateLimited("field", clientIp(req), 60)) {
    return NextResponse.json({ error: "slow down" }, { status: 429 });
  }

  const today = utcDateStr();
  const date = searchParams.get("date") ?? today;
  if (!validDate(date, today)) {
    return NextResponse.json(
      { error: "date must be a UTC YYYY-MM-DD on or before today" },
      { status: 400 },
    );
  }
  const intervalRaw = searchParams.get("interval") ?? "1w";
  const interval = isInterval(intervalRaw) ? intervalRaw : "1w";
  const board = laneParam(searchParams.get("board"));

  let rows: BoardEntry[] = [];
  try {
    rows = await getBoard().top(date, FIELD_LIMIT, interval, board);
  } catch {
    rows = []; // honest empty lane — the store already logs the cause
  }

  const summary = summarizeField(rows);
  return NextResponse.json(
    {
      date,
      interval,
      board,
      store: getBoard().kind,
      ...summary,
      top: rows.slice(0, TOP_N).map((r) => ({
        name: r.name,
        score: r.score,
        candlesPassed: r.candlesPassed,
      })),
    },
    { headers: { "Cache-Control": "public, s-maxage=30, stale-while-revalidate=120" } },
  );
}

// /api/leaderboard — global daily board.
// Storage: MongoStore when DATABASE_URL is set (Atlas M0, phase p1), else in-memory.
// Includes basic anti-cheat: score/candles consistency cap, name + date sanitizing,
// and a lightweight per-IP rate limit (in-memory, per instance).
// W1 integrity: every submission MUST carry the HMAC runToken issued by
// GET /api/candles; symbol + date are pinned from the verified token payload
// (client-claimed symbol/date are ignored), and terrain-imposed physical caps
// reject impossible candle counts/scores.
// LAW 1.2 Option B (2026-10-10): two lanes, never mixed —
//   GET ?board=guest    (default) walletless classic board, legacy rows included
//   GET ?board=official           wallet-bound records, best run per wallet
//   POST address=<0x…>            valid wallet ⇒ official lane, else guest lane
// Public GET responses mask wallets to the chip-style short form; the full
// address never leaves the server on a read path.
import { NextResponse } from "next/server";
import { getBoard, type BoardEntry, type BoardFilter } from "@/lib/leaderboard-store";
import { verifyRunToken, isTokenStale } from "@/lib/run-token";
import { isInterval } from "@/game/cc/level-source";
// W5: pure validation core (shape + anti-cheat caps) extracted to
// src/lib/board-validation.ts — contract pinned by test/leaderboard-contract.test.ts.
import { validateSubmission } from "@/lib/board-validation";
// E2.2 airdrop-weights ledger (P4.4): verified submissions on today's classic
// level build weights — best-effort, NEVER awaited in the game response (LAW 1).
import { recordClassicRun } from "@/lib/weights-store";
import { normalizeWallet } from "@/lib/weights";
import { shortAddress } from "@/lib/wallet";
import { currentSeason } from "@/lib/seasons";

const BOARDS: BoardFilter[] = ["guest", "official", "all"];

function boardParam(raw: string | null): BoardFilter {
  return BOARDS.includes(raw as BoardFilter) ? (raw as BoardFilter) : "guest";
}

/** Public read paths never expose the full address (airdrop-board convention). */
function maskWallets(entries: BoardEntry[]): BoardEntry[] {
  return entries.map((e) => (e.wallet ? { ...e, wallet: shortAddress(e.wallet) } : e));
}

/* per-IP rate limit: 20 submissions / minute / instance */
const hits = new Map<string, number[]>();
function rateLimited(ip: string): boolean {
  const now = Date.now();
  const arr = (hits.get(ip) ?? []).filter((t) => now - t < 60_000);
  if (arr.length >= 20) return true;
  arr.push(now);
  hits.set(ip, arr);
  if (hits.size > 5000) hits.clear(); // crude memory guard
  return false;
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const date = searchParams.get("date");
  // P3.5: boards are per-timeframe ("1w" classic default) — never mixed
  const interval = isInterval(searchParams.get("interval")) ? searchParams.get("interval")! : "1w";
  // Option B: lane selector — default keeps the classic (guest) board contract
  const board = boardParam(searchParams.get("board"));
  const store = getBoard();
  const entries = maskWallets(await store.top(date, 50, interval, board));
  return NextResponse.json({
    entries,
    interval,
    board,
    ...(board === "official" ? { season: currentSeason() } : {}),
    store: store.kind,
    ...(store.lastError ? { dbError: store.lastError } : {}),
  });
}

export async function POST(req: Request) {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "local";
  if (rateLimited(ip)) {
    return NextResponse.json({ error: "slow down" }, { status: 429 });
  }
  try {
    const body = (await req.json()) as Partial<BoardEntry> & {
      runToken?: unknown;
      address?: unknown; // E2.2/Option B: wallet link (official lane + weights ledger)
    };

    // run token: mandatory, signature-verified (timingSafeEqual), shape-checked
    const tok = verifyRunToken(body.runToken);
    if (!tok) {
      return NextResponse.json({ error: "invalid run token" }, { status: 403 });
    }
    if (isTokenStale(tok.date)) {
      return NextResponse.json({ error: "run token expired" }, { status: 403 });
    }

    // Option B lane decision: ONLY the normalized wallet decides the lane —
    // a malformed address degrades to guest (fail-open, play never blocked)
    const wallet = normalizeWallet(body.address);

    // pure validation core (W5): shape checks + terrain-physical anti-cheat caps
    const verdict = validateSubmission(body, tok, Date.now(), wallet);
    if (!verdict.ok) {
      return NextResponse.json({ error: verdict.error }, { status: verdict.status });
    }

    const store = getBoard();
    const rank = await store.add(verdict.entry);
    // E2.2: ledger fire-and-forget — a weights failure must never fail the score
    // submission or even be observable in this response (ECONOMY-LAWS LAW 1).
    void recordClassicRun(verdict.entry.name, verdict.entry.date, wallet).catch(() => {});
    return NextResponse.json({
      ok: true,
      rank,
      board: verdict.entry.board,
      season: verdict.entry.season,
      store: store.kind,
    });
  } catch {
    return NextResponse.json({ error: "bad request" }, { status: 400 });
  }
}

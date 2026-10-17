// LU-15: Community score-moderation endpoint — players can report suspicious
// leaderboard entries for review. Reports are append-only and never alter the
// reported entry; they feed the /ops review queue alongside anomaly flags.
//
// POST  { name, score, date, board, reason }  → { ok: true }
// GET   ?limit=50                             → { reports: [...] }  (for /ops)
//
// Rate-limited per-IP via the shared limiter (5 reports/min POST, 60/min GET)
// to prevent report flooding and scraping. Reason is sanitized and capped.
// No PII beyond what the reporter voluntarily provides.
import { NextResponse } from "next/server";
import { getScoreReports, type ScoreReport } from "@/lib/score-report-store";
import { sanitizeName } from "@/lib/board-validation";
import { rateLimited, clientIp } from "@/lib/http-limiter"; // shared limiter — one implementation repo-wide

export const dynamic = "force-dynamic";

function sanitizeReason(raw: unknown): string {
  if (typeof raw !== "string") return "";
  return raw.trim().slice(0, 200);
}

export async function GET(req: Request) {
  // internal review surface — throttled so it cannot be scraped cheaply
  if (rateLimited(clientIp(req), 60)) {
    return NextResponse.json({ error: "rate limited" }, { status: 429 });
  }
  const { searchParams } = new URL(req.url);
  const limit = Math.max(1, Math.min(100, parseInt(searchParams.get("limit") ?? "50", 10) || 50));
  const store = getScoreReports();
  const reports = await store.recent(limit);
  return NextResponse.json(
    { reports, store: store.kind },
    { headers: { "cache-control": "no-store" } },
  );
}

export async function POST(req: Request) {
  if (rateLimited(clientIp(req), 5)) {
    return NextResponse.json({ error: "slow down" }, { status: 429 });
  }
  try {
    const body = (await req.json()) as {
      name?: unknown;
      score?: unknown;
      date?: unknown;
      board?: unknown;
      reason?: unknown;
      reporter?: unknown;
    };
    const name = sanitizeName(body.name);
    const score = Math.max(0, Math.min(999999, Math.floor(Number(body.score) || 0)));
    const date = typeof body.date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(body.date) ? body.date : "";
    const board: "guest" | "official" = body.board === "official" ? "official" : "guest";
    const reason = sanitizeReason(body.reason);

    if (!name || !date || score === 0) {
      return NextResponse.json({ error: "missing required fields" }, { status: 400 });
    }

    const report: ScoreReport = {
      name,
      score,
      date,
      board,
      reporter: typeof body.reporter === "string" && body.reporter.trim() ? sanitizeName(body.reporter) : undefined,
      reason,
      ts: Date.now(),
    };

    const store = getScoreReports();
    await store.add(report);

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "bad request" }, { status: 400 });
  }
}

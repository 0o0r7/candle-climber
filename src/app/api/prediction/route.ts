// /api/prediction — Route Prediction hook (E2.3 / P4.6 / H5).
// Lock a call on TOMORROW's daily-rotation symbol; it scores deterministically
// against the REAL closed daily candle when that date arrives, and the points
// land in the weights ledger automatically (spec §7.2 row 3, tiered ≤10/day).
//
// Integrity model:
//   · symbol is pinned SERVER-side from the deterministic daily rotation — the
//     client never names the target symbol
//   · targetDate is always exactly tomorrow (server-computed) — no cherry-picking
//   · one call per identity per target date (unique index; second call → 409)
//   · calls are stored at lock time and cannot be restated after the move
//   · scoring is LAZY + idempotent: any read pass scores due open calls once,
//     against the closed candle, then records the weight event
//   · language law: "builds airdrop weights" — never "earn/guaranteed" (LAW 4)
import { NextResponse } from "next/server";
import { pickSeed } from "@/game/cc/level-source";
import { utcDate, normalizeWallet } from "@/lib/weights";
import { sanitizeName } from "@/lib/board-validation";
import {
  nextUtcDate,
  validateCall,
  scorePrediction,
  PREDICT_MAX_POINTS,
} from "@/lib/prediction";
import { fetchDailyCandle } from "@/lib/ohlc";
import { getPredictions, type PredictionRow } from "@/lib/prediction-store";
import { recordPredictionPoints } from "@/lib/weights-store";

export const dynamic = "force-dynamic";

/* per-IP rate limit: 10 writes / minute / instance */
const hits = new Map<string, number[]>();
function rateLimited(ip: string): boolean {
  const now = Date.now();
  const arr = (hits.get(ip) ?? []).filter((t) => now - t < 60_000);
  if (arr.length >= 10) return true;
  arr.push(now);
  hits.set(ip, arr);
  if (hits.size > 5000) hits.clear();
  return false;
}

const META = {
  language: "a locked call builds airdrop weights if the real candle agrees — nothing earned or guaranteed; testnet",
  tiers: "direction 4 · move 3 · tail 3 = max 10 weights on a perfect call",
};

/**
 * Lazy + idempotent scoring pass: every open call whose target date has passed
 * is scored once against the closed daily candle. Feed failures stay open and
 * retry on the next pass. Returns how many calls were scored.
 */
async function scoreDue(today: string, limit = 25): Promise<number> {
  const store = getPredictions();
  const due = await store.dueOpen(today, limit);
  let scored = 0;
  for (const p of due) {
    const candle = await fetchDailyCandle(p.symbol, p.targetDate);
    if (!candle) continue; // feed unavailable — retry on a later pass
    const result = scorePrediction(p.call, candle);
    await store.markScored(p.name, p.targetDate, result, Date.now());
    void recordPredictionPoints(p.name, p.targetDate, result.points, p.wallet, {
      symbol: p.symbol,
    }).catch(() => {});
    scored += 1;
  }
  return scored;
}

function publicRow(p: PredictionRow) {
  return {
    name: p.name,
    submitDate: p.submitDate,
    targetDate: p.targetDate,
    symbol: p.symbol,
    call: p.call,
    status: p.status,
    result: p.result,
  };
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const store = getPredictions();
  const today = utcDate();
  const tomorrow = nextUtcDate(today);

  try {
    // ?date=<target date> — public scoreboard for a past target date. Scoring
    // is lazy: this pass first scores anything due, then reports the result.
    const dateParam = searchParams.get("date");
    if (dateParam && /^\d{4}-\d{2}-\d{2}$/.test(dateParam)) {
      if (dateParam < today) await scoreDue(today);
      const rows = await store.forTargetDate(dateParam);
      return NextResponse.json(
        {
          ok: true,
          date: dateParam,
          symbol: pickSeed(dateParam).symbol,
          scored: rows.map(publicRow),
          meta: META,
        },
        { headers: { "cache-control": "no-store" } },
      );
    }

    // default: my calls + what tomorrow's board is
    const name = sanitizeName(searchParams.get("name"));
    await scoreDue(today);
    const mine = await store.mine(name);
    return NextResponse.json(
      {
        ok: true,
        today,
        tomorrow: { date: tomorrow, symbol: pickSeed(tomorrow).symbol },
        mine: mine.map(publicRow),
        maxPoints: PREDICT_MAX_POINTS,
        meta: META,
      },
      { headers: { "cache-control": "no-store" } },
    );
  } catch {
    return NextResponse.json({ ok: false, error: "prediction-unavailable" }, { status: 200 });
  }
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
    const body = (await req.json()) as {
      name?: unknown;
      call?: unknown;
      address?: unknown;
    };
    const today = utcDate();
    const targetDate = nextUtcDate(today); // server-computed — never client-sent
    const symbol = pickSeed(targetDate).symbol; // server-pinned — never client-sent
    const call = validateCall(body.call);
    if (!call) {
      return NextResponse.json({ error: "invalid call" }, { status: 400 });
    }
    const name = sanitizeName(body.name);
    const wallet = normalizeWallet(body.address);
    const row: PredictionRow = {
      name,
      submitDate: today,
      targetDate,
      symbol,
      call,
      wallet,
      status: "open",
      result: null,
      ts: Date.now(),
    };
    const saved = await getPredictions().submit(row);
    if (!saved) {
      return NextResponse.json(
        { error: "call already locked for tomorrow" },
        { status: 409 },
      );
    }
    return NextResponse.json({ ok: true, pred: publicRow(saved), meta: META });
  } catch {
    return NextResponse.json({ error: "bad request" }, { status: 400 });
  }
}

// /api/telemetry/run — P0.1 gameplay telemetry intake.
//
// One POST per FINISHED run (death, or a summit run abandoned via retry).
// Aggregate + PII-free by construction (src/lib/run-telemetry.ts): index, cause,
// score, coarse mode/input labels — never a name, wallet, IP or timestamp from
// the client. The server stamps `ts` itself.
//
// POSTURE (LAW 1): the game never waits on this lane and never learns it failed.
// Validation clamps everything, the per-IP budget is generous (a human plays
// well under 60 finished runs/minute), and no read path is public — the numbers
// surface only on /ops.
import { NextResponse } from "next/server";
import { rateLimited, clientIp, bodyTooLarge } from "@/lib/http-limiter";
import { normalizeRunEvent } from "@/lib/run-telemetry";
import { getRunTelemetry } from "@/lib/run-telemetry-store";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  if (bodyTooLarge(req, 2_048)) {
    return NextResponse.json({ ok: false }, { status: 413 });
  }
  if (rateLimited("telemetry-run", clientIp(req), 60)) {
    return NextResponse.json({ ok: false }, { status: 429 });
  }

  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const event = normalizeRunEvent(raw);
  if (!event) return NextResponse.json({ ok: false }, { status: 400 });

  const store = getRunTelemetry();
  // record() never throws (fail-open lane); awaiting only keeps the memory
  // store's counters consistent before the response leaves this instance.
  await store.record(event);
  return NextResponse.json({ ok: true, store: store.kind });
}

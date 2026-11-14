// /api/telemetry/event — P1 funnel intake (run_start · tutorial_complete · retry).
//
// Separate from /api/telemetry/run on purpose: the run lane's contract is "one
// event per FINISHED run" and every number on /ops depends on that denominator.
// Mixing pre-run gates into it would silently change what "finished runs" means.
//
// POSTURE (LAW 1): fire-and-forget from the client. Validation clamps, the
// per-IP budget is generous, and there is no public read path — the counts
// surface only on /ops.
import { NextResponse } from "next/server";
import { rateLimited, clientIp, bodyTooLarge } from "@/lib/http-limiter";
import { normalizeFunnelEvent } from "@/lib/funnel-telemetry";
import { getFunnel } from "@/lib/funnel-telemetry-store";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  if (bodyTooLarge(req, 1_024)) {
    return NextResponse.json({ ok: false }, { status: 413 });
  }
  // Two events per run started (start + retry) at most, so 120/min is generous
  // for a human and hostile to a flood.
  if (rateLimited("telemetry-event", clientIp(req), 120)) {
    return NextResponse.json({ ok: false }, { status: 429 });
  }

  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const event = normalizeFunnelEvent(raw);
  if (!event) return NextResponse.json({ ok: false }, { status: 400 });

  const store = getFunnel();
  await store.record(event);
  return NextResponse.json({ ok: true, store: store.kind });
}

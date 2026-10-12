// Debug/health probe for the Sentry pipeline — GET-only, no state, no secrets.
//   GET /api/debug-sentry         → { ok: true, hint }
//   GET /api/debug-sentry?go=1    → sends one info-level event to Sentry and
//                                   returns its event_id (verifiable in the UI).
// Used to prove end-to-end ingest from any deploy (local + preview + production).
//
// Delivery hardening (2026-10-13): the event-injecting branch is OFF on
// production deploys unless DEBUG_SENTRY=on is explicitly set — an open
// event injector on a public URL is a quota-spam vector. The status probe
// stays available everywhere.
import { NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  if (url.searchParams.get("go") !== "1") {
    return NextResponse.json({
      ok: true,
      hint: "append ?go=1 to send a test event to Sentry",
    });
  }

  const prodLocked =
    process.env.NODE_ENV === "production" &&
    process.env.VERCEL_ENV === "production" &&
    process.env.DEBUG_SENTRY !== "on";
  if (prodLocked) {
    return NextResponse.json(
      { ok: false, error: "disabled on production (set DEBUG_SENTRY=on to allow)" },
      { status: 404 },
    );
  }

  const eventId = Sentry.captureMessage(
    "candle-climber debug ping (api route)",
    "info",
  );
  await Sentry.flush(2500);

  return NextResponse.json({ ok: true, eventId });
}

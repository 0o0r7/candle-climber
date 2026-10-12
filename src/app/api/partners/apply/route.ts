// POST /api/partners/apply — Partner-Chart application intake (v0).
//
// The PARTNER lane is provider-side (council 2026-10-12): a project/community/
// guild that holds the $WICK threshold in a registered wallet may get their
// token's chart added to the always-available PARTNER pool. This route is the
// FRONT DOOR: there are no pilot partners yet (owner has zero connections to
// seed the pool), so the product grows the pipeline via this form instead.
//
// Honesty & abuse contract:
// - Applications are PRIVATE (PII): stored, never rendered publicly, no GET.
// - Manual curation: meeting the threshold is necessary, never sufficient.
// - Per-IP rate limit (5/min, in-memory per instance — same accepted tradeoff
//   as the leaderboard route), honeypot field silently accepted-and-dropped.
// - Every field passes strict sanitization (sanitizeRef philosophy).
// - Fail-open to gameplay: this route touches nothing score- or access-related
//   (LAW 1.1/1.2/1.3 untouched by construction — no score inputs here).
// - Economy telemetry (E4.4 pattern): store failures alert at warning level.
import { NextRequest, NextResponse } from "next/server";
import {
  buildPartnerApplication,
  getPartnerStore,
} from "@/lib/partner-store";
import { captureError } from "@/lib/telemetry";

export const runtime = "nodejs";

/* per-IP rate limit: 5 applications / minute / instance */
const hits = new Map<string, number[]>();
function rateLimited(ip: string): boolean {
  const now = Date.now();
  const arr = (hits.get(ip) ?? []).filter((t) => now - t < 60_000);
  if (arr.length >= 5) return true;
  arr.push(now);
  hits.set(ip, arr);
  if (hits.size > 5000) hits.clear(); // crude memory guard
  return false;
}

function clientIp(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip")?.trim() ||
    "unknown"
  );
}

export async function POST(req: NextRequest) {
  const ip = clientIp(req);
  if (rateLimited(ip)) {
    return NextResponse.json({ error: "slow down" }, { status: 429 });
  }

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }

  // Honeypot: real users never see (or fill) the hidden "website" field.
  // Silently accept so bots learn nothing; the payload is dropped.
  if (typeof body.website === "string" && body.website.trim() !== "") {
    return NextResponse.json({ ok: true }, { status: 201 });
  }

  const app = buildPartnerApplication(body);
  if (!app) {
    return NextResponse.json(
      {
        error:
          "missing or invalid fields (projectName, walletAddress 0x…, communitySize, discord, email are required)",
      },
      { status: 400 },
    );
  }

  try {
    await getPartnerStore().add(app);
    return NextResponse.json(
      {
        ok: true,
        note: "request received — reviewed manually; we will reach out on Discord or email",
      },
      { status: 201 },
    );
  } catch (err) {
    captureError(err, { lane: "partner-apply" });
    return NextResponse.json({ error: "storage unavailable, try later" }, { status: 503 });
  }
}

// No public read: applications are PII. GET is explicitly refused.
export async function GET() {
  return NextResponse.json({ error: "not public" }, { status: 405 });
}

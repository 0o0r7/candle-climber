// /api/burn — public burn-counter feed (E2.6 / P6.5). Read-only, 5-min cached
// server-side + CDN-cacheable: cumulative $WICK sent to the burn address.
// The HUD line is honest: this is what the fee rails have removed so far.
import { NextResponse } from "next/server";
import { fetchBurnedWick } from "@/lib/burn";

export const dynamic = "force-dynamic";

export async function GET() {
  const r = await fetchBurnedWick();
  return NextResponse.json(
    {
      ...r,
      note: "cumulative tokens sent to the irrecoverable burn address — tax-rail 5% share + curve-fee burn",
    },
    { headers: { "cache-control": "public, max-age=300" } },
  );
}

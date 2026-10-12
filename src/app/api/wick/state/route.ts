// /api/wick/state — PUBLIC aggregate-only $WICK live state (no PII, no keys).
//
// WHAT IT SERVES
// The one source of truth for the partner lane's live figures, straight from
// the platform's own public feed via wick-price.ts (the platform's OWN curve
// formula, invariant-checked against the on-chain reserve every read):
//   · the graduation meter (pairReserve / targetPairUnits — the 4 ETH cap)
//   · the display price (what the token page shows)
//   · the realizable price (display minus worst-case sell fees — the figure
//     any VALUE check would use)
//   · the curve-phase minimum holding (the platform's own per-wallet cap,
//     net of the launch tax)
// Used by the /partners page so partners see the exact numbers the gate uses
// — nothing about the gate is hidden or hand-waved (LAW 4).
//
// RED LINES: this endpoint exposes no buy/sell surface, takes no input that
// touches scores or access, and never reads the application store.
import { NextResponse } from "next/server";
import { fetchWickPrice, WICK_TRADE_URL } from "@/lib/wick-price";
import { CURVE_PHASE_MIN_UNITS } from "@/lib/partner-threshold";

export const dynamic = "force-dynamic";

export async function GET() {
  const read = await fetchWickPrice();
  return NextResponse.json(
    {
      ok: read.ok,
      lifecycle: read.lifecycle,
      graduated: read.graduated,
      meterPct: read.meterPct,
      // ETH-per-token as fixed-point wad (×1e18) — integers only on the wire
      priceEthWad: read.priceEth !== null ? String(BigInt(Math.round(read.priceEth * 1e18))) : null,
      realizablePriceEthWad:
        read.realizablePriceEth !== null
          ? String(BigInt(Math.round(read.realizablePriceEth * 1e18)))
          : null,
      source: read.source,
      reserveWei: read.reserveWei,
      targetWei: read.targetWei,
      soldUnits: read.soldUnits,
      curvePhaseMinUnits: CURVE_PHASE_MIN_UNITS.toString(),
      tradeUrl: WICK_TRADE_URL,
      error: read.error ?? null,
      checkedAt: new Date().toISOString(),
    },
    { headers: { "cache-control": "public, max-age=300" } },
  );
}

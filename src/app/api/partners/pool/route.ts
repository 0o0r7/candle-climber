// /api/partners/pool — the PUBLIC partner-chart pool (aggregate only).
//
// WHAT IT RETURNS
// Every curated registry entry (partner-registry.ts) with its LIVE gates:
//   · hold verification — partner-verifier.ts (on-chain balanceOf vs the
//     value threshold; fail-closed; grace/delisted state machine)
//   · feed availability — launchpad-indexer.partnerFeedReady (the token must
//     prove MIN_TRADE_COUNT real curve trades right now)
// `listed = verified && feedReady` — a partner chart is in the playable pool
// only when BOTH gates pass. Everything else is shown honestly with its
// status so the owner/curator and the ecosystem team can see exactly why.
//
// PRIVACY (partner-store.ts PII rule): this endpoint reads the REGISTRY only
// — never the application store. Wallet addresses are on-chain facts and are
// shown so anyone can verify the hold; application contact details (Discord,
// email, Twitter) never appear here or anywhere public.
//
// RED LINES (council 2026-10-12): listing is provider-side; every listed
// chart is free for ALL players; the daily main slot and the scoreboard are
// never purchasable. This endpoint exposes no buy/sell surface at all.
//
// v0: the registry is empty → { ok: true, partners: [], listedCount: 0 } —
// an honest empty state, not a placeholder promise.
import { NextResponse } from "next/server";
import { getPartnerRegistry } from "@/lib/partner-registry";
import { verifyPartner } from "@/lib/partner-verifier";
import { partnerFeedReady } from "@/lib/launchpad-indexer";

export const dynamic = "force-dynamic";

export async function GET() {
  const { entries } = getPartnerRegistry();
  const partners = await Promise.all(
    entries.map(async (entry) => {
      const [v, feedReady] = await Promise.all([
        verifyPartner(entry),
        partnerFeedReady(entry.tokenAddress),
      ]);
      return {
        id: entry.id,
        projectName: entry.projectName,
        symbol: entry.symbol,
        tokenAddress: entry.tokenAddress,
        // on-chain fact — public by design so the hold is independently checkable
        walletAddress: entry.walletAddress,
        note: entry.note ?? null,
        addedAt: entry.addedAt,
        status: v.status,
        meets: v.meets,
        balanceUnits: v.balanceUnits,
        graceEndsAt: v.graceEndsAt,
        lastCheckedAt: v.lastCheckedAt,
        reason: v.reason ?? null,
        feedReady,
        listed: v.status === "verified" && feedReady,
      };
    }),
  );
  const listedCount = partners.filter((p) => p.listed).length;
  return NextResponse.json(
    {
      ok: true,
      updatedAt: new Date().toISOString(),
      count: partners.length,
      listedCount,
      partners,
    },
    { headers: { "Cache-Control": "public, max-age=300" } },
  );
}

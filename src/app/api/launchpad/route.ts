// /api/launchpad — Launchpad Mode level data.
//
// Serves the VibeVibe launch-of-the-day with on-chain trade activity.
// Uses the launchpad-indexer to read real CurveBuy/CurveSell events via RPC
// and derive terrain from them, falling back to the API-based path when the
// on-chain read fails or the token doesn't meet the minimum activity threshold.
//
// Honesty contract:
// - The launch payload is REAL data from VibeVibe's API.
// - On-chain events are REAL eth_getLogs data from the public testnet RPC.
// - Terrain candles are DERIVED from these real metrics — never labeled "live".
// - Failure degrades gracefully to the existing vibe-launch path.
//
// Usage: GET /api/launchpad           — today's launchpad level
//        GET /api/launchpad?date=YYYY-MM-DD — past date (if supported)
//        GET /api/launchpad?token=0x…  — a PARTNER chart's terrain (PARTNER
//        lane, council 2026-10-12): the token must be a curated registry
//        entry whose hold verification is CURRENTLY "verified" and whose
//        feed is ready — anything else is refused (fail-closed). A listed
//        partner chart is free for ALL players (provider-side gate; the
//        player never needs a wallet or a holding).
import { NextResponse } from "next/server";
import { utcDateStr } from "@/game/cc/rng";
import { getLaunchpadLevel, getPartnerLevel, partnerFeedReady } from "@/lib/launchpad-indexer";
import { getPartnerRegistry } from "@/lib/partner-registry";
import { verifyPartner } from "@/lib/partner-verifier";
import { signRunToken } from "@/lib/run-token";
import type { CandleData, SeedInfo } from "@/game/cc/types";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const today = utcDateStr();
  const requestedDate = searchParams.get("date");
  // Only allow past or today's date (same rule as /api/candles)
  const date = requestedDate && /^\d{4}-\d{2}-\d{2}$/.test(requestedDate) && requestedDate <= today
    ? requestedDate
    : today;

  // ── PARTNER lane: per-token terrain, double-gated ────────────────────────
  const partnerToken = (searchParams.get("token") ?? "").toLowerCase();
  if (partnerToken) {
    if (!/^0x[a-f0-9]{40}$/.test(partnerToken)) {
      return NextResponse.json(
        { error: "bad token address", date },
        { status: 400, headers: { "Cache-Control": "no-store" } },
      );
    }
    const { entries } = getPartnerRegistry();
    const entry = entries.find((e) => e.tokenAddress === partnerToken);
    // An unknown token gets the same "not available" answer as an unverified
    // one — the route never confirms registry contents to a scanner.
    if (!entry) {
      return NextResponse.json(
        { error: "partner feed not available", date },
        { status: 503, headers: { "Cache-Control": "no-store" } },
      );
    }
    const verification = await verifyPartner(entry);
    if (verification.status !== "verified") {
      return NextResponse.json(
        { error: "partner feed not available", reason: verification.reason ?? verification.status, date },
        { status: 503, headers: { "Cache-Control": "no-store" } },
      );
    }
    const feedReady = await partnerFeedReady(partnerToken, entry.curveAddress ?? "");
    if (!feedReady) {
      return NextResponse.json(
        { error: "partner feed not available", reason: "feed-gate", date },
        { status: 503, headers: { "Cache-Control": "no-store" } },
      );
    }
    const level = await getPartnerLevel(partnerToken, entry.curveAddress ?? "", entry.symbol, date);
    if (!level) {
      return NextResponse.json(
        { error: "partner feed not available", reason: "feed-gate", date },
        { status: 503, headers: { "Cache-Control": "no-store" } },
      );
    }
    const seed: SeedInfo = { date, symbol: entry.symbol, interval: "derived", source: "vibe-launch" };
    const data: CandleData = { seed, candles: level.candles };
    // Derived-but-real on-chain terrain is scoreable per the vibe-launch
    // precedent; the token pins (symbol, date, candles) exactly as launchpad.
    data.runToken = signRunToken(entry.symbol, date, level.candles.length, JSON.stringify(level.candles));
    return NextResponse.json(
      {
        ...data,
        partner: {
          id: entry.id,
          projectName: entry.projectName,
          symbol: entry.symbol,
          token: partnerToken,
          source: level.source,
          activity: {
            buyCount: level.activity.buyCount,
            sellCount: level.activity.sellCount,
            totalVolume: level.activity.totalVolume.toString(),
            netFlow: level.activity.netFlow.toString(),
            eligible: level.activity.eligible,
          },
        },
      },
      { headers: { "Cache-Control": "public, max-age=300" } },
    );
  }

  try {
    const level = await getLaunchpadLevel(date);
    if (!level) {
      // Launch API unreachable — return a 503 so the client can show a message
      return NextResponse.json(
        { error: "launchpad unavailable", date },
        { status: 503, headers: { "Cache-Control": "no-store" } },
      );
    }

    const source: SeedInfo["source"] = level.source === "on-chain" ? "vibe-launch" : "vibe-launch";
    const seed: SeedInfo = {
      date,
      symbol: level.symbol,
      interval: "derived",
      source,
    };

    const data: CandleData = { seed, candles: level.candles };

    // Issue a run token (same as the /api/candles launch path — derived-but-real
    // feeds are scoreable per the vibe-launch precedent)
    data.runToken = signRunToken(
      level.symbol,
      date,
      level.candles.length,
      JSON.stringify(level.candles),
    );

    return NextResponse.json(
      {
        ...data,
        launchpad: {
          source: level.source,
          activity: level.activity ? {
            token: level.activity.token,
            symbol: level.activity.symbol,
            buyCount: level.activity.buyCount,
            sellCount: level.activity.sellCount,
            totalVolume: level.activity.totalVolume.toString(),
            netFlow: level.activity.netFlow.toString(),
            eligible: level.activity.eligible,
          } : null,
          launch: {
            launchId: level.launch.launchId,
            symbol: level.launch.symbol,
            createdAt: level.launch.createdAt,
            graduated: level.launch.graduated,
            holderCount: level.launch.holderCount,
          },
        },
      },
      { headers: { "Cache-Control": "public, max-age=300" } },
    );
  } catch (err) {
    console.error("[launchpad]", (err as Error).message);
    return NextResponse.json(
      { error: "internal error", date },
      { status: 500, headers: { "Cache-Control": "no-store" } },
    );
  }
}

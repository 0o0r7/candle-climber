// /api/city/leaderboard — Chain City board (Phase 2, v1).
// Storage: MongoStore when DATABASE_URL is set, else in-memory. Ranked by city
// level, treasury as tie-break. One row per wallet (a wallet's own best city).
//
// Public reads MASK wallets to the chip-style short form (same convention as
// every other board) and carry the guild tag as decoration metadata — the guild
// buff is resolved from the static registry, never from a client claim.
import { NextResponse } from "next/server";
import { getCityStore } from "@/lib/city-save-store";
import { shortAddress } from "@/lib/wallet";
import { findGuild } from "@/lib/guild-registry";
import { rateLimited, clientIp } from "@/lib/http-limiter";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  if (rateLimited(clientIp(req), 60)) {
    return NextResponse.json({ error: "rate limited" }, { status: 429 });
  }
  const store = getCityStore();
  const rows = await store.top(50);

  const entries = rows.map((r) => {
    const guild = findGuild(r.guild);
    return {
      wallet: shortAddress(r.wallet),
      guild: r.guild ?? null,
      guildName: guild?.name ?? null,
      guildColor: guild?.color ?? null,
      cityLevel: r.cityLevel,
      treasury: r.treasury,
      buildingsCount: r.buildingsCount,
      savedAt: r.savedAt,
    };
  });

  return NextResponse.json(
    { entries, store: store.kind },
    { headers: { "cache-control": "no-store" } },
  );
}

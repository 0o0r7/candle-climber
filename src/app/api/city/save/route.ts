// /api/city/save — Chain City server save (Phase 2, v1).
// Storage: MongoStore when DATABASE_URL is set, else in-memory (same posture as
// the boards). One row per wallet — a city is durable state, not a history.
//
//   GET  ?wallet=0x…              the stored city for that wallet (summary + state)
//   POST { state, address,        requires a VALID personal_sign ownership proof
//          signature, ts, guild? } (purpose-separated city-save message) — the
//                                proof's job is IDENTITY: nobody overwrites
//                                another wallet's city under their address.
//
// The city sim runs client-side, so this is a convenience + identity save, NOT
// a competitive-integrity gate — documented honestly in src/lib/city-save.ts.
// A missing/invalid/stale proof is a hard 403 (nothing is written) because
// there is no guest lane for a wallet-bound save.
import { NextResponse } from "next/server";
import { getCityStore } from "@/lib/city-save-store";
import { validateCitySave } from "@/lib/city-save";
import { verifyCitySaveProof } from "@/lib/wallet-proof";
import { normalizeWallet } from "@/lib/weights";
import { shortAddress, isValidAddress } from "@/lib/wallet";
import { rateLimited, clientIp } from "@/lib/http-limiter";
import { sanitizeGuild } from "@/lib/guild-registry";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  if (rateLimited(clientIp(req), 60)) {
    return NextResponse.json({ error: "rate limited" }, { status: 429 });
  }
  const { searchParams } = new URL(req.url);
  const wallet = normalizeWallet(searchParams.get("wallet"));
  if (!wallet) return NextResponse.json({ error: "bad wallet" }, { status: 400 });

  const store = getCityStore();
  const entry = await store.get(wallet);
  if (!entry) return NextResponse.json({ found: false, store: store.kind }, { status: 404 });

  return NextResponse.json(
    {
      found: true,
      wallet: shortAddress(entry.wallet),
      guild: entry.guild ?? null,
      savedAt: entry.savedAt,
      cityLevel: entry.cityLevel,
      treasury: entry.treasury,
      buildingsCount: entry.buildingsCount,
      state: entry.state,
      store: store.kind,
    },
    { headers: { "cache-control": "no-store" } },
  );
}

export async function POST(req: Request) {
  const ip = clientIp(req);
  if (rateLimited(ip, 20)) {
    return NextResponse.json({ error: "slow down" }, { status: 429 });
  }
  try {
    const body = (await req.json()) as {
      address?: unknown;
      signature?: unknown;
      ts?: unknown;
      guild?: unknown;
    } & Record<string, unknown>;

    const wallet = normalizeWallet(body.address);
    const signature = typeof body.signature === "string" ? body.signature : null;
    if (!wallet || !isValidAddress(wallet) || !signature) {
      return NextResponse.json({ error: "wallet proof required" }, { status: 403 });
    }

    const guild = sanitizeGuild(body.guild);

    // validate first (wallet-independent) so the proof binds the CLAMPED values
    const draft = validateCitySave(body, wallet, guild);
    if (!draft.ok) {
      return NextResponse.json({ error: draft.error }, { status: draft.status });
    }

    const proof = verifyCitySaveProof(
      wallet,
      signature,
      {
        wallet,
        cityLevel: draft.entry.cityLevel,
        buildingsCount: draft.entry.buildingsCount,
        savedAt: draft.entry.savedAt,
      },
      body.ts,
      Date.now(),
    );
    if (!proof.ok) {
      return NextResponse.json({ error: `proof rejected (${proof.reason})` }, { status: 403 });
    }

    const store = getCityStore();
    const rank = await store.put(draft.entry);
    return NextResponse.json({
      ok: true,
      rank,
      wallet: shortAddress(wallet),
      guild: draft.entry.guild ?? null,
      cityLevel: draft.entry.cityLevel,
      store: store.kind,
    });
  } catch {
    return NextResponse.json({ error: "bad request" }, { status: 400 });
  }
}

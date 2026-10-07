// /api/vault — WICK Vault at the peak wick (E2.4 / P4.3 / H7).
// A run that REACHED the level's peak-wick candle may open the vault — one
// grant per identity per day: +1 weight (spec §7.2 row 5) + a cosmetic trail
// for the day. The server verifies, in order:
//   1. a valid signed runToken for TODAY's classic (1w) level  → the run happened
//   2. a connected wallet with $WICK balance ≥ holder tier     → on-chain read
//   3. the (name, date, "vault") unique ledger insert          → one per day
// LAW 2 lane: cosmetics + weights ONLY — no score, no rank, no base access.
// Fail language stays honest: holders open it, everyone else sees the rule.
import { NextResponse } from "next/server";
import { verifyRunToken } from "@/lib/run-token";
import { utcDate, normalizeWallet, VAULT_POINTS } from "@/lib/weights";
import { sanitizeName } from "@/lib/board-validation";
import { recordVaultGrant } from "@/lib/weights-store";
import { readWickTier } from "@/lib/wick-balance";

export const dynamic = "force-dynamic";

const META = {
  language: "opening the vault builds airdrop weights and unlocks a cosmetic trail — nothing earned or guaranteed; testnet",
  grant: `+1 weight · one open per day · holder tier (1,000 WICK) or above`,
};

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      runToken?: unknown;
      name?: unknown;
      address?: unknown;
    };
    const tok = verifyRunToken(body.runToken);
    if (!tok) {
      return NextResponse.json({ error: "invalid run token" }, { status: 403 });
    }
    if (tok.date !== utcDate() || tok.interval !== "1w") {
      // the vault is a TODAY-classic concept — archive/other tfs do not open it
      return NextResponse.json({ error: "vault opens on today's classic level" }, { status: 400 });
    }
    const wallet = normalizeWallet(body.address);
    if (!wallet) {
      return NextResponse.json({ error: "connect a wallet to open the vault" }, { status: 400 });
    }
    const name = sanitizeName(body.name);

    const { ok, tier } = await readWickTier(wallet);
    if (!ok || tier === "none") {
      return NextResponse.json(
        { error: "vault opens for holders — 1,000 WICK minimum" },
        { status: 403 },
      );
    }

    const saved = await recordVaultGrant(name, wallet, { tier });
    if (!saved) {
      return NextResponse.json({ error: "vault already opened today" }, { status: 409 });
    }
    return NextResponse.json({
      ok: true,
      grant: {
        weights: VAULT_POINTS,
        cosmetic: tier === "whale" ? "gold-trail" : "ember-trail",
        tier,
      },
      meta: META,
    });
  } catch {
    return NextResponse.json({ error: "bad request" }, { status: 400 });
  }
}

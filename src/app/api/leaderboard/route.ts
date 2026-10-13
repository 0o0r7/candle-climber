// /api/leaderboard — global daily board.
// Storage: MongoStore when DATABASE_URL is set (Atlas M0, phase p1), else in-memory.
// Includes basic anti-cheat: score/candles consistency cap, name + date sanitizing,
// and a lightweight per-IP rate limit (in-memory, per instance).
// W1 integrity: every submission MUST carry the HMAC runToken issued by
// GET /api/candles; symbol + date are pinned from the verified token payload
// (client-claimed symbol/date are ignored), and terrain-imposed physical caps
// reject impossible candle counts/scores.
// LAW 1.2 Option B (2026-10-10): two lanes, never mixed —
//   GET ?board=guest    (default) walletless classic board, legacy rows included
//   GET ?board=official           wallet-bound records, best run per wallet
//   POST address=<0x…>            wallet + VALID personal_sign proof ⇒ official
//                                 lane, anything less ⇒ guest lane (never an error)
// Hardening (same day, owner-delegated queue): the official lane requires a
// cryptographic ownership proof — a personal_sign (EIP-191) signature by the
// claimed wallet's key over the canonical run-binding message (wallet + clamped
// run fields + token date/interval + client ts, 10-min freshness window).
// A missing/invalid/stale proof silently degrades the run to the GUEST lane
// (fail-open, play never blocked — LAW 1.2 substance) and the response carries
// a one-line honest `note`. Replay safety: every field is inside the signed
// message, so a signature is single-use by construction; an identical replay
// is a no-op via best-run-per-wallet dedupe.
// Public GET responses mask wallets to the chip-style short form; the full
// address never leaves the server on a read path.
import { NextResponse } from "next/server";
import { getBoard, type BoardEntry, type BoardFilter } from "@/lib/leaderboard-store";
import { verifyRunToken, isTokenStale } from "@/lib/run-token";
import { isInterval } from "@/game/cc/level-source";
// G5 (129-a #6): one namespaced limiter repo-wide — the inline copy here carried
// its own clear()-on-overflow bug (a rotating attacker reset EVERYONE's budget).
import { rateLimited, clientIp, bodyTooLarge } from "@/lib/http-limiter";
// W5: pure validation core (shape + anti-cheat caps) extracted to
// src/lib/board-validation.ts — contract pinned by test/leaderboard-contract.test.ts.
import { validateSubmission } from "@/lib/board-validation";
// LAW 1.2 hardening: cryptographic wallet-ownership proof for the official lane
import { verifyOfficialProof } from "@/lib/wallet-proof";
import type { ProofRejectReason } from "@/lib/wallet-proof";
// E2.2 airdrop-weights ledger (P4.4): verified submissions on today's classic
// level build weights — best-effort, NEVER awaited in the game response (LAW 1).
import { recordClassicRun } from "@/lib/weights-store";
import { normalizeWallet } from "@/lib/weights";
import { shortAddress } from "@/lib/wallet";
import { currentSeason } from "@/lib/seasons";
import { weightsFrozen } from "@/lib/graduation"; // E6.1: snapshot freeze etiquette
// LU-9: warn loudly when production runs without a database
import { checkProductionDatabase } from "@/lib/production-check";
// LU-8: per-submission unique nonce — prevents run-token replay
import { claimNonce, releaseNonce, consumeNonce } from "@/lib/nonce-store";
// LU-7: statistical anomaly detection — flag top-1% outliers for review
import { wouldBeAnomaly } from "@/lib/anomaly-detection";
// LU-1: Cloudflare Turnstile — optional bot prevention for guest lane
import { verifyTurnstileToken, isTurnstileEnabled } from "@/lib/turnstile";

// LU-9: fire once at module load (serverless warm start)
checkProductionDatabase();

const BOARDS: BoardFilter[] = ["guest", "official", "all"];

function boardParam(raw: string | null): BoardFilter {
  return BOARDS.includes(raw as BoardFilter) ? (raw as BoardFilter) : "guest";
}

/** Public read paths never expose the full address (airdrop-board convention). */
function maskWallets(entries: BoardEntry[]): BoardEntry[] {
  return entries.map((e) => (e.wallet ? { ...e, wallet: shortAddress(e.wallet) } : e));
}

/* Audit fix: guest-lane identity-flood guard. The run token is deterministic
 * and SHARED by every player on the same terrain (by design, W1) — so a token
 * alone cannot identify a submitter, and replaying it under new names was
 * previously unlimited. Cap DISTINCT guest names per IP per UTC day; the
 * official lane is already capped by best-run-per-wallet dedupe. In-memory
 * per instance — same accepted tradeoff as the rate limiter above. G5:
 * overflow EVICTS the oldest IPs instead of clearing everyone. */
const guestNamesByIp = new Map<string, { day: string; names: Set<string> }>();
const GUEST_NAME_CAP = 8; // generous for humans, hostile to name-flooding
function guestNameCapExceeded(ip: string, name: string): boolean {
  const day = new Date().toISOString().slice(0, 10);
  let rec = guestNamesByIp.get(ip);
  if (!rec || rec.day !== day) {
    rec = { day, names: new Set() };
    guestNamesByIp.delete(ip);
    guestNamesByIp.set(ip, rec);
  }
  if (rec.names.has(name)) return false; // same name again = normal retry
  if (rec.names.size >= GUEST_NAME_CAP) return true;
  rec.names.add(name);
  while (guestNamesByIp.size > 5000) {
    const oldest = guestNamesByIp.keys().next().value;
    if (oldest === undefined) break;
    guestNamesByIp.delete(oldest);
  }
  return false;
}

export async function GET(req: Request) {
  // G5 (129-a #7): GETs are throttled too now — every unthrottled public lane
  // is a free compute relay for a scripted client. 120/min is far above human
  // board-refresh behavior (the client polls on run end, not on a timer).
  if (rateLimited("lb-get", clientIp(req), 120)) {
    return NextResponse.json({ error: "slow down" }, { status: 429 });
  }
  const { searchParams } = new URL(req.url);
  const date = searchParams.get("date");
  // P3.5: boards are per-timeframe ("1w" classic default) — never mixed
  const interval = isInterval(searchParams.get("interval")) ? searchParams.get("interval")! : "1w";
  // Option B: lane selector — default keeps the classic (guest) board contract
  const board = boardParam(searchParams.get("board"));
  const store = getBoard();

  // LU-17: rank-around-me — ?around=<rank>&window=<n> returns entries
  // centered on the given rank (5 above, 5 below by default), scoped to the
  // same lane + interval + date. Enables the "who's near me" social hook.
  const aroundRaw = searchParams.get("around");
  if (aroundRaw !== null) {
    const rank = Math.max(1, Math.min(9999, parseInt(aroundRaw, 10) || 1));
    const window = Math.max(3, Math.min(50, parseInt(searchParams.get("window") ?? "11", 10) || 11));
    const entries = maskWallets(await store.around(date, rank, window, interval, board));
    return NextResponse.json({
      entries,
      interval,
      board,
      around: rank,
      window,
      ...(board === "official" ? { season: currentSeason() } : {}),
      store: store.kind,
    });
  }

  const entries = maskWallets(await store.top(date, 50, interval, board));

  // LU-14: verified-first — when requesting the default (guest) board, also
  // return the official top entries so the UI can show verified scores first.
  // Guest scores appear below, clearly labeled as unofficial. This protects
  // competitive integrity: the top of the board is always wallet-proven.
  let official: BoardEntry[] | undefined;
  if (board === "guest") {
    official = maskWallets(await store.top(date, 10, interval, "official"));
  }

  return NextResponse.json({
    entries,
    official,
    interval,
    board,
    ...((board === "official" || (official && official.length > 0)) ? { season: currentSeason() } : {}),
    store: store.kind,
    // G5 (129-a #3/#10): internal store errors no longer echo to the public
    // GET — a driver message can embed connection configuration (e.g. the
    // DATABASE_URL). Server-side logs + /ops + Sentry carry the detail.
  });
}

export async function POST(req: Request) {
  // G5 (129-a #11): reject oversized bodies before parsing (self-host has no cap).
  if (bodyTooLarge(req)) {
    return NextResponse.json({ error: "payload too large" }, { status: 413 });
  }
  const ip = clientIp(req);
  if (rateLimited("leaderboard", ip, 20)) {
    return NextResponse.json({ error: "slow down" }, { status: 429 });
  }
  try {
    const body = (await req.json()) as Partial<BoardEntry> & {
      runToken?: unknown;
      address?: unknown; // E2.2/Option B: wallet link (official lane + weights ledger)
      signature?: unknown; // LAW 1.2 hardening: personal_sign ownership proof
      ts?: unknown; // client ms timestamp inside the signed message
      nonce?: unknown; // LU-8: per-submission unique nonce (replay prevention)
      turnstileToken?: unknown; // LU-1: Cloudflare Turnstile token (guest lane)
    };

    // run token: mandatory, signature-verified (timingSafeEqual), shape-checked
    const tok = verifyRunToken(body.runToken);
    if (!tok) {
      return NextResponse.json({ error: "invalid run token" }, { status: 403 });
    }
    if (isTokenStale(tok.date)) {
      return NextResponse.json({ error: "run token expired" }, { status: 403 });
    }

    // LU-8: per-submission unique nonce — the run token is shared (by design,
    // W1) so a token alone cannot identify a submitter. A client-supplied nonce
    // (random string) is consumed on first use and rejected on replay.
    // G5 (129-c #4): replay protection is no longer opt-in — the shipped client
    // always sends the nonce, so a MISSING nonce on the guest lane is now a 400.
    // (The official lane keeps the old leniency: it is wallet-proven and capped
    // by best-run-per-wallet dedupe, so replay there is a no-op by construction.)
    const nonce = typeof body.nonce === "string" ? body.nonce : null;
    if (nonce && (nonce.length < 8 || nonce.length > 64)) {
      return NextResponse.json({ error: "invalid nonce" }, { status: 400 });
    }
    // LU-8 (hardened): claim the nonce ATOMICALLY (set-if-absent). A plain
    // isConsumed()-check followed by a later consume() leaves a window where
    // two concurrent submissions with the same nonce both pass; claiming
    // closes it. A claim that ends in a rejected request is released below,
    // so failures never burn a legitimate nonce.
    if (nonce && !claimNonce(nonce)) {
      return NextResponse.json({ error: "nonce already used" }, { status: 409 });
    }

    // Option B lane decision: ONLY a wallet with a VALID ownership proof lands on
    // the official lane. A claimed wallet whose proof is absent/invalid/stale
    // degrades to guest (fail-open — play is never blocked, LAW 1.2 substance);
    // a malformed address was already guest before the hardening.
    const claimed = normalizeWallet(body.address);
    const signature = typeof body.signature === "string" ? body.signature : null;
    let wallet: string | null = null;
    let reject: ProofRejectReason | null = null;
    if (claimed && signature) {
      // pass 1 (proof input): clamped entry fields the signed message binds to
      const draft = validateSubmission(body, tok, Date.now(), claimed);
      if (!draft.ok) {
        // shape/anti-cheat failures are lane-independent — identical verdict
        // whether the run claims official or guest
        if (nonce) releaseNonce(nonce);
        return NextResponse.json({ error: draft.error }, { status: draft.status });
      }
      const proof = verifyOfficialProof(
        claimed,
        signature,
        // the proof binds EXACTLY these clamped fields (explicit, not a spread —
        // BoardEntry's optional legacy fields must never silently leak into the
        // signed message); date/interval come from the verified token payload
        {
          score: draft.entry.score,
          candlesPassed: draft.entry.candlesPassed,
          bestStreak: draft.entry.bestStreak ?? 0,
          date: draft.entry.date,
          interval: draft.entry.interval ?? tok.interval,
          wallet: claimed,
        },
        body.ts,
        Date.now(),
      );
      if (proof.ok) wallet = claimed;
      else reject = proof.reason;
    }

    // pure validation core (W5): shape checks + terrain-physical anti-cheat caps
    const verdict = validateSubmission(body, tok, Date.now(), wallet);
    if (!verdict.ok) {
      if (nonce) releaseNonce(nonce);
      return NextResponse.json({ error: verdict.error }, { status: verdict.status });
    }

    // LU-1: Cloudflare Turnstile — when configured, guest-lane submissions
    // (no valid wallet proof) must carry a valid Turnstile token. This blocks
    // automated guest-board flooding without any CAPTCHA UX (Turnstile is
    // invisible). When not configured, verification is skipped entirely.
    // Official-lane submissions are already wallet-proven and skip this check.
    if (!wallet && isTurnstileEnabled()) {
      const turnstileToken = typeof body.turnstileToken === "string" ? body.turnstileToken : null;
      const turnstileOk = await verifyTurnstileToken(turnstileToken, ip);
      if (!turnstileOk) {
        if (nonce) releaseNonce(nonce);
        return NextResponse.json({ error: "bot check failed" }, { status: 403 });
      }
    }

    // Audit fix: one client must not flood the guest board with endless
    // distinct names (the run token is shared per terrain by design).
    if (!wallet && guestNameCapExceeded(ip, verdict.entry.name)) {
      if (nonce) releaseNonce(nonce);
      return NextResponse.json(
        { error: "too many distinct guest names from this client today" },
        { status: 429 },
      );
    }

    if (!wallet && !nonce) {
      // G5 (129-c #4): guest-lane submissions REQUIRE the nonce (no nonce was
      // claimed above, so there is nothing to release on this path).
      return NextResponse.json({ error: "missing nonce" }, { status: 400 });
    }

    // LU-8: the nonce was claimed atomically above; on success, refresh its
    // TTL so the single-use window runs from the accepted submission.
    if (nonce) consumeNonce(nonce);

    const store = getBoard();

    // LU-7: statistical anomaly detection — if the new entry would be a top-1%
    // outlier (>2× median) among existing entries in its lane, flag it. The
    // entry is still accepted (false positives must never block legit runs);
    // the flag is surfaced in the response AND PERSISTED on the entry so /ops
    // can actually review flagged rows (G5 129-c #2: the flag used to live only
    // in this HTTP response — the submitter saw it, the operator could not).
    const existing = await store.top(verdict.entry.date, 100, verdict.entry.interval ?? "1w", verdict.entry.board ?? "guest");
    const anomaly = wouldBeAnomaly(verdict.entry, existing);
    if (anomaly) verdict.entry.flagged = true;

    const rank = await store.add(verdict.entry);
    if (rank === null) {
      // G5 (129-c #5): the backing store is DOWN — answer honestly instead of
      // the old fake rank 1 with a silently dropped entry. Play is unaffected
      // (LAW 1.2); the board write failing loudly is the point.
      return NextResponse.json(
        { error: "board temporarily unavailable — run not recorded, please retry" },
        { status: 503 },
      );
    }
    // E2.2: ledger fire-and-forget — a weights failure must never fail the score
    // submission or even be observable in this response (ECONOMY-LAWS LAW 1).
    // E6.1 freeze etiquette: during the graduation snapshot the operator pauses
    // weight events (WEIGHTS_FROZEN=1) — the score STILL saves and ranks; only
    // the ledger write is skipped, and the honest flag lets the UI say so.
    const frozen = weightsFrozen();
    if (!frozen) void recordClassicRun(verdict.entry.name, verdict.entry.date, wallet).catch(() => {});
    return NextResponse.json({
      ok: true,
      rank,
      board: verdict.entry.board,
      season: verdict.entry.season,
      store: store.kind,
      ...(frozen ? { weightsFrozen: true } : {}),
      ...(anomaly ? { flagged: true } : {}),
      // honest degrade note — only when an official run was claimed but the
      // ownership proof did not verify (reason is safe to surface: the client
      // knows what it signed; nothing about OTHERS' submissions leaks)
      ...(reject ? { note: `official proof rejected (${reject}) — run posted as guest` } : {}),
    });
  } catch {
    return NextResponse.json({ error: "bad request" }, { status: 400 });
  }
}

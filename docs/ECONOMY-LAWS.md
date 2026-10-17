# ECONOMY LAWS — CANDLE CLIMBER ($WICK)

> Status: **LAW** — adopted 2026-10-06 (merge-back wave 1 from
> `docs/VARIANT-REVIEW-2026-10-05.md`, item "rank ≠ recognition").
> This document wires **no code**. It is the policy every present and future
> economy-touching change must satisfy — including the planned P4.2 Balance
> Gate, P4.4 airdrop weights, and anything after graduation (§4 of
> `docs/GROWTH-AND-HOOKS-STRATEGY.md`).
> Where an earlier doc conflicts with these laws, **these laws win**.

## Why this law exists

The independent review of the Candle Current variant (and the KB founder
intel it cross-validated) landed on one strategic takeaway: a market-native
game only stays credible if the scoreboard is unbuyable. The moment holding
(or spending) the token changes who ranks where, the leaderboard stops being
a skill record and the game stops being a game. So the separation between
**recognition** (what the leaderboard says) and **recognition-adjacent value**
(what holding is worth) is written down as law, not left as taste.

## LAW 1 — RANK ≠ RECOGNITION (holder utility never touches the scoreboard)

1.1 **Holder utility never changes ranked score.** No balance tier, stake,
burn, lockup, NFT, or wallet state may alter a run's score, multiplier,
candlesPassed, bestStreak, rank, or any submission accepted by
`/api/leaderboard`. The score math stays exactly what W5 anti-cheat verifies.

1.2 **Holder utility never changes base access.** The base game is free,
forever, walletless: today's daily level, the retry loop, score submission,
the leaderboard, duels, and archive browsing never require holding $WICK or
connecting a wallet.

1.3 **The scoreboard is skill-only.** Two identical climbs produce identical
scores and identical ranks, regardless of either climber's wallet. If a
feature would make the same climb score differently based on holdings, that
feature is a red-line bug, not a design choice.

## LAW 2 — HOLDER VALUE = COSMETICS · ROUTES · ARCHIVE (the only lawful utilities)

Holder-gated value may exist **only** in these three lanes:

2.1 **Cosmetics** — climber skins, trails, death-card frames, ghost styling,
emotes. Pure render-layer: no physics, no scoring, no information advantage.

2.2 **Routes** — route-planning affordances around the SAME public terrain
(e.g. line-drawing / saved-path previews per H5 ROUTE PREDICTION). A route
tool must never inject, reveal, or imply terrain data another player cannot
see — everyone already sees the same chart.

2.3 **Archive** — extended historical-terrain access and archive conveniences
(deeper history, practice marathons per H1). Archive terrain is practice-only
and unscored by existing rule; selling access to practice is lawful, selling
rank is not.

2.4 Anything a holder receives must be **additive and score-blind**: the game
must remain fully playable, fully rankable, and fully competitive without it.
Gated modes beyond base access (e.g. "Summit tier" runs) may exist only if
they are cosmetic/practice surfaces — **a holder run is never ranked onto the
public leaderboard with any advantage a non-holder cannot earn by skill.**

## LAW 3 — SUPREMACY AND EXISTING DESIGNS

3.1 This law governs all future economy work. Concretely: the Balance Gate
sketch in `docs/GROWTH-AND-HOOKS-STRATEGY.md` §3 (tier-gated "higher score
multiplier, better loot weights") is **void in the parts that touch score or
loot advantage** — tiers may gate only the LAW 2 lanes.

3.2 Airdrop weights (P4.4) reward **participation** (daily streaks, route
predictions, archive marathons). Weights are entitlements to future
distributions, never rank, and never a scoreboard input. Language stays
"builds airdrop weights" — never "earn(s)", never "guaranteed" (pack §8).

3.3 Post-graduation spend/burn mechanics (§4 of the strategy doc) are lawful
only inside the LAW 2 lanes plus entry to events; a burned token may never
convert into ranked score, ranked access, or score-affecting state.

## LAW 4 — LANGUAGE AND HONESTY RED LINES (WICK-LAUNCH-FORM-PACK §8)

Every economy-facing sentence inherits the pack's red lines:

- Never promise rewards or profit — "weights", not "earn / guaranteed".
- Testnet status is stated plainly, never hidden, never apologised for.
- No gambling tone — before TGE every "stake" is points/weights, nothing else.
- No invented numbers — only figures verified in this repo's evidence trail.

## LAW 5 — ENFORCEMENT

5.1 Review gate: any PR/commit touching scoring, the leaderboard, wallets, or
cosmetics must state in its description which laws apply and how it complies.

5.2 Audit hook: the periodic code audits (the LOOPBACK/variant-review
protocol) now include an economy-laws check — any coupling of balance state
to score or base access is filed as a P0 defect.

5.3 Precedence: pack §8 red lines and these laws are jointly supreme over
older design prose. Neither may be amended casually; changes require a dated
note in this file explaining what changed and why.

---
## DATED NOTE 2026-10-10 — LAW 1.2 letter amended: wallet = official competitive identity (Option B)

**Trigger.** Owner challenge (2026-10-10): typed-name identity is too weak for real
competition; a game with no real economy risks being disposable; economy is the priority.
Owner then delegated the pending decision in plain words: "خودت تصمیم بگیر — تصمیمی که در
راستای برطرف کردن نگرانی‌های من و نواقص محصول و تکمیل آن باشد." The council had already
re-convened on his three arguments (OWNER-BRIEF + STOCK-TOKENS-DEEP-DIVE, same date) and
graded **Option B** as the recommended lawful path; this note records its adoption under
the owner's delegation. Per LAW 5.3, this is the dated-note amendment path.

**What changes (letter of 1.2 only).** The old text made the *leaderboard* walletless forever.
From now on:

- **Guest mode stays exactly as LAW 1.2 promised:** full play — daily level, retry loop,
  score submission, archive browsing — free, walletless, forever. A typed name lands on the
  clearly-labeled **guest board**. Nothing behind a paywall or a hold-wall; LAW 1.2's
  substance (no purchase and no wallet required to PLAY) is untouched.
- **Official competitive surfaces become wallet-bound:** the official board, seasons,
  official records, and weights-eligible identities require a connected wallet. Wallet
  identity strengthens, never gates, play.
- **What does NOT change:** LAW 1.1 (score math is untouched by holdings), LAW 1.3
  (skill-only scoreboard), LAW 3 (participation weights), LAW 4 (language red lines).

**Why.** (1) The owner's anonymity-cliff argument matches the council's registered F3
fracture — a typed name cannot anchor season-long competition or a wallet-keyed weights
ledger already live in production. (2) The platform itself is wallet-native (builders board
is wallet-keyed); guest-only identity fights the ecosystem grain. (3) Testnet rehearses
mechanics that ship to mainnet — identity must be rehearsed now. (4) Reach math stands:
a hold-wall kills the curious at the top of the funnel; identity-optional play maximizes
reach while wallets capture the committed. Buy/hold remains *wanted*, never *required*.

**Build consequence (queued):** classic board renamed guest board + official wallet-bound
board + season scaffolding. Economy-facing build → LAW 5.1 applies.

**Build shipped 2026-10-10 (same day).** The queued consequence landed: `src/lib/seasons.ts`
(append-only season registry, S1 opens 2026-10-10), two-lane `leaderboard-store`
(guest = legacy semantics byte-preserved; official = best-run-per-wallet per date+interval),
lane stamping in `board-validation` (lane decided ONLY by the normalized wallet — a malformed
address degrades to guest, play never blocked), `?board=` on GET + `board`/`season` in the
POST response, masked wallets on public reads, honest UI labels (OFFICIAL · wallet-bound /
GUEST · typed names, unofficial). Contract pinned by `test/official-board.test.ts` (13 pins;
suite 304/304). Law compliance (5.1): score math untouched (1.1), play free & walletless
(1.2 substance), skill-only scoreboard (1.3), language per LAW 4.

**Hardening shipped 2026-10-10 (evening, same-day queue).** The recorded known limit —
official-lane ownership was shape-validated only — is CLOSED. An official submission now
requires a cryptographic ownership proof: a `personal_sign` (EIP-191) signature by the
claimed wallet's key over the canonical run-binding message (`src/lib/proof-message.ts` —
wallet + clamped score/candles/streak + the VERIFIED token's date/interval + a client
timestamp with a ±10-minute freshness window), verified server-side by ECDSA
secp256k1 recovery (`src/lib/wallet-proof.ts`, audited `@noble/secp256k1` + `@noble/hashes`
primitives — the one justified deviation from the zero-new-dependency convention: a subtle
bug in hand-rolled recovery would silently accept forged proofs). Every run field sits
inside the signed message, so a proof is single-use by construction; an identical replay
is a no-op via best-run-per-wallet dedupe. Fail-open to GUEST, never an error: a missing,
invalid, or stale proof silently lands the run on the honestly-labeled guest board and the
POST response carries a one-line `note` — play is never blocked by wallet state (LAW 1.2
substance). Route-level contract pinned by `test/official-proof-route.test.ts` (real
handler, no mocks) + `test/wallet-proof.test.ts` (tamper matrix, freshness window,
v-notation, fail-closed shapes); suite 329/329.

**Economy build-out shipped 2026-10-10 (owner directive: "finish all coding phases,
visuals last").** The remaining non-visual economy items closed in one pass, all inside
existing lanes (LAW 5.1 gate: docs/PR-CHECKLIST.md):
- **E4.4** — economy-path failures now ALERT (spec §9 was a promise): weights/leaderboard
  store failures + wallet/burn RPC reads capture to Sentry (warning-level, fail-open
  gameplay untouched) via `src/lib/telemetry.ts`.
- **E5.5** — referral attribution: share texts + episode copy + duel invites carry
  `?ref=<sanitized name>`; landings persist device-wide and stamp board rows. The ref is
  OPAQUE METADATA — it never touches score, lane, or weights (1.1/1.3 intact); G5's
  "referral traffic measurable in board metadata" now has a concrete loop + /ops rollup.
- **E6.2** — graduation gate FAIL-CLOSED (`src/lib/graduation.ts`): post-grad lanes
  (mirror/spend-burn/tournaments/burn-HUD) are staged and open ONLY on a positive pad-API
  `graduated` flag or the post-tx operator override; an API outage can never look like a
  graduation. Numbers stay uncoded until the council signs them at T (spec §8 rule held).
- **E6.1** — weights-freeze etiquette: `WEIGHTS_FROZEN=1` pauses weight EVENTS with
  honest 503s while SCORES keep flowing (1.2 substance: play never blocked); prediction
  calls stay open and score idempotently after the unfreeze — no points invented, none
  lost. Runbook: `docs/council/2026-10-10-GRADUATION-RUNBOOK.md`.
- **E4.1** — `/ops` internal dashboard (noindex, aggregate counts only, zero PII).
- Compliance sweep #3 on the launch copy: "archive marathons" → "archive runs" (the
  shipped lane is per-run practice, E2.3 — no marathon mechanic exists to promise).
- Anti-sybil residual register: `docs/council/2026-10-10-ANTI-SYBIL-AUDIT.md`.
- Suite 329 → 346 (`test/e5-e6.test.ts` pins gate truth table + all four freeze paths).

---
*Adopted: 2026-10-06 · Source: VARIANT-REVIEW-2026-10-05 merge-back wave 1 ·
Related: `docs/GROWTH-AND-HOOKS-STRATEGY.md`, `docs/WICK-LAUNCH-FORM-PACK.md` §8,
`docs/HANDOFF-2026-10-04.md` (P4.2/P4.4).*

# MEMO — RED-LINE AUDITOR (laws, trust & compliance) · Economy Council Task 73-d

> Date: 2026-10-08 · Seat: compliance · Scope: audit of the CURRENT economy
> implementation + the compliance envelope every v2 proposal must pass.
> Sources read in full: `docs/ECONOMY-LAWS.md` (supreme), `docs/WICK-LAUNCH-FORM-PACK.md`
> §8 + language blocks, `docs/WICK-ECONOMY-SPEC.md`, `docs/ECONOMY-CHECKLIST.md`
> (E0–E6), `docs/GLOSSARY-FA.md`, and the implementing code: `src/lib/weights.ts`,
> `src/lib/weights-store.ts`, `src/lib/prediction.ts`, `src/lib/prediction-store.ts`
> (via route), `src/app/api/prediction/route.ts`, `src/app/api/practice/route.ts`,
> `src/app/api/vault/route.ts`, `src/lib/wick-balance.ts`, `src/app/api/wallet/route.ts`,
> `src/lib/run-token.ts`, `src/components/cc/WalletChip.tsx`, `src/app/airdrop/page.tsx`,
> `src/lib/merkle.ts`, `src/app/api/airdrop/route.ts`, plus the LAW-1-critical
> `src/app/api/leaderboard/route.ts` wiring and `src/lib/wallet.ts`.
> This memo writes no code and changes no law; it binds the council.

---

## 1. Role & mandate

I am the council's red-line seat. My job is not to design v2 — it is to state,
before any proposal is debated, (a) whether the current implementation is inside
the law, and (b) the space in which v1/v2 mechanisms may legally live. Precedence
chain I enforce: **ECONOMY-LAWS (supreme) ← pack §8 language red lines ←
WICK-ECONOMY-SPEC ← any proposal**. Any mechanism outside LAW 2 lanes + weights
+ event entry is void by construction (LAW 3.1 precedent applies to v2 prose the
same way it voided the old Balance Gate sketch).

---

## 2. Verdicts Q1–Q4 (compliance seat, short & decisive)

- **Q1 — bridge product→token buy page: LAWFUL WITH CONDITIONS.** A passive,
  informational link ("GET $WICK ON THE CURVE · testnet · no monetary value") is
  lawful today. It may live only in passive surfaces (footer beside
  faucet/airdrop links, a `/token` info page, the WalletChip "no tier yet"
  state). It must NEVER appear in or near the play loop, score flows, or with
  urgency/earnings framing. Full rules in §5.2–5.3.
- **Q2 — hold-to-play: UNLAWFUL for the ranked daily level, as the law stands.**
  LAW 1.2 is unambiguous: base access (today's level, retry, submission,
  leaderboard, duels, archive browsing) never requires holding or a wallet.
  Gating the daily ranked climb on a balance is a red-line bug by definition
  (LAW 1.3), not a design choice. It would require a dated LAW 5.3 amendment —
  **my recommendation: do not amend.** The lawful adjacent already exists:
  holder-gated *practice/cosmetic* surfaces (LAW 2.4) and the archive lane
  (LAW 2.3). Owner should decide: keep 1.2 intact (my seat's strong advice) —
  the unbuyable scoreboard is the product's trust moat.
- **Q3 — buy/hold motivators: the lawful space is already well-defined — GREEN
  lane is big enough.** Cosmetics tiers, weights (participation-only), archive
  depth, route tools, event entry, transparency surfaces (burn counter, meter)
  are all GREEN today. The dangerous temptations (holder weight multipliers,
  sellable weights, score advantages) are RED. Full classification in §5.1.
- **Q4 — upgraded financial cycle: LAWFUL ONLY as sinks inside LAW 2 + LAW 3.3
  lanes (cosmetics · routes · archive · events) and pre-grad as disclosure
  surfaces.** Every v2 sink must arrive with a LAW 5.1 compliance statement and
  a lane tag; any sink whose burn converts to ranked score/access/state is void
  (LAW 3.3). "Innovative" is not an exemption — see §5.1 RED list and §7 ritual.

---

## 3. Findings table (file · mechanism · law · status · notes)

**Result: 0 P0, 0 P1, 4 P2 (process/sybil), 4 P3. The current implementation is
inside the law.**

| # | File / mechanism | Law | Status | Notes |
|---|---|---|---|---|
| F1 | `api/leaderboard` + `recordClassicRun` | LAW 1.1/1.3 | ✅ COMPLIANT | Ledger is `void`-ed, fire-and-forget, `.catch(()=>{})`; weights failure can neither fail a submission nor be observed in the response. No balance read on this path; ranked math untouched. |
| F2 | `lib/wallet.ts` + `api/wallet` (Balance Gate) | LAW 1.2/2 | ✅ COMPLIANT | Read-only `eth_call`, fail-open → tier `none`; GET self-declares `cosmeticOnly:true, laws:ECONOMY-LAWS`. Thresholds (1k/100k) live in one module, commented "never scored". No gating of play/submission anywhere. |
| F3 | `WalletChip.tsx` | LAW 1/LAW 4 | ✅ COMPLIANT | Strictly display-only; renders nothing for walletless visitors (zero-friction preserved); tooltips state "display-only … never affects rank" and testnet plainly. |
| F4 | `api/vault` + `lib/wick-balance` (holder gate inside LAW 2 lanes) | LAW 2.1/2.4, LAW 3.2 | ✅ COMPLIANT · ⚠️ P2 precedent | Triple verification (today's classic 1w signed token → on-chain tier ≥ holder → unique `(name,date,"vault")` insert). Grants +1 weight + same-day cosmetic trail only — additive and score-blind. GRAY note: it is a *holder-gated* weight faucet (bounded 1/day, participation-gated first by the peak-wick run, spec §7.2 row 5). Lawful; but it must NOT become the precedent for raw balance-based weight multipliers (see §5.1 RED). |
| F5 | `weights.ts` / `weights-store.ts` (caps & determinism) | LAW 3.2/5 | ✅ COMPLIANT | Pure module (W5-pinned), points server-computed (never client-sent), Mongo unique indexes `(name,date)` / `(name,date,kind)`, practice cap re-derived from `meta.runs` (lost updates can only undercount), snapshot cap 600 enforced at snapshot, unlinked identities excluded. |
| F6 | `api/prediction` + `lib/prediction.ts` (fairness) | LAW 3.2/LAW 4 | ✅ COMPLIANT · ⚠️ P2 residual | Symbol + target date server-pinned from the rotation; target = exactly tomorrow (no cherry-picking); one call per identity per target (409 on dup); calls locked pre-move, lazy idempotent scoring against the REAL closed candle; deterministic tie rules (doji→up, tail ties→top) documented. Residual gaming vector = hedging across many wallets (§4). |
| F7 | `api/practice` (archive lane) | LAW 2.3/3.2 | ✅ COMPLIANT | Token must be for a strictly PAST date (today's terrain rejected → cannot double-dip the classic lane); archive terrain immutable so a valid token proves a real historical run; folded 0.5/run capped 2/day. |
| F8 | `lib/run-token.ts` (W1 HMAC) | anti-sybil | ✅ COMPLIANT · P3 hardening | Timing-safe HMAC, terrain fingerprint binds token to exact candles, date-scoped validity (own date +1). Replay is bounded by ledger caps, not by the token. P3: secret fallback chain ends in `DATABASE_URL`/dev default — set a dedicated `RUN_TOKEN_SECRET` so the attestation key is not the DB string. |
| F9 | `merkle.ts` + `api/airdrop` + `/airdrop` page (rehearsal) | LAW 4 | ✅ COMPLIANT | Page and API both say "rehearsal · testnet · nothing claimable yet", "distributions, if any … nothing guaranteed". Flagged wallets excluded from the tree; salt published; proofs verified server-side AND re-verified in-browser ("no trust in this page required"). No over-promise found. P3: the public TOP-WEIGHTS board ranks wallets — review publication before the real snapshot (whale-worship / privacy). |
| F10 | Language sweep (all player-facing copy + API metas) | LAW 4 / pack §8 | ✅ COMPLIANT | Zero hits for earn/earn-ed/guaranteed/promised-reward/profit/invest in player-facing strings; every meta block carries "nothing earned or guaranteed; testnet"; PredictionPanel says "builds airdrop weights, nothing guaranteed · testnet"; footer links testnet/faucet. Internal rationale prose (e.g. DRGN "holding = automatic profit") exists only in docs — must never migrate to surfaces. |
| F11 | Burn-counter + meter surfaces | LAW 4 | ✅ COMPLIANT · P3 data note | UI reads the chain live (no invented numbers). Evidence hygiene: 254,293 WICK burned (E0.4 snapshot 2026-10-07) vs 164,944 (E2.6 prod check 2026-10-08) — reconcile at the next `verify-econ-state` run so no doc quotes a stale figure. |
| F12 | Game fiction: "graduation: 5 eth class" (`GameCanvas`, `deathcard.ts`, `level.ts`) | LAW 4 | ⚠️ P3 GRAY | In-game flavor conflicts with the canonical 4 ETH meter (E0.2 reconciliation). Game-fiction is arguably exempt, but a numeric claim that contradicts the chain in a visible panel invites exactly the "invented numbers" doubt LAW 4 exists for. Recommend non-numeric flavor ("summit class") at the next touch — no emergency. |
| F13 | Process gates | LAW 5 | ⚠️ P2 | E3.1 (PR law statements), E3.3 (anti-sybil audit), E3.4 (token-page re-verify) are still OPEN in `ECONOMY-CHECKLIST.md` while four economy surfaces are already live. Close before v2 deliberation lands (see §7). |

**Balance↔score question (mandate a), answered directly:** no balance state
touches score, rank, or base access anywhere in the audited paths. The only
balance reads are `/api/wallet` and `/api/vault`; one feeds a badge, the other a
weights+cosmetic grant; both fail-open, neither is imported by scoring,
leaderboard, or access code. **Vault holder-gate inside LAW 2 lanes (mandate b):**
compliant as F4.

---

## 4. Residual sybil & trust risks (concrete, current-state)

1. **Wallet links are self-declared (P2 — biggest residual).** `body.address` on
   leaderboard/prediction/practice/vault is accepted without any proof of wallet
   ownership. One human can present N wallets. `WALLET_IDENTITY_LIMIT=2` flags
   identities-per-wallet, not wallets-per-human. Bounded by the 600/wallet
   snapshot cap + flagged-exclusion + manual pre-snapshot review — but review is
   a checklist item (E3.3), not yet a ritual. **Hardening (v2 gate):** require an
   EIP-191 signature of the snapshot commitment at CLAIM time; track first-seen
   IP/device per wallet; treat one-identity-per-wallet farms with synchronized
   activity as an anomaly class.
2. **Prediction hedging across wallets (P2).** 18 outcome combos (2×3×3); N
   wallets locking complementary calls guarantee one max-10/day. Server-pinning
   kills cherry-picking but not hedging. Each wallet stays capped (≤10/day,
   600 total) and unlinked wallets never reach a snapshot — so the residual is
   "one human, many linked wallets, each fully fed by predictions". The rate
   limit (10/min/IP, in-memory, per instance) is advisory on Vercel
   multi-instance, not a control. **Hardening:** statistical flag (perfect
   10/10 on a wallet with no linked gameplay), and consider requiring ≥1
   verified run on the linking identity before prediction points can bind.
3. **Name-sybil on streak lane (documented, accepted).** Identity = normalized
   name; unlinked names accrue but are excluded from every snapshot (verified in
   `snapshotFromRows`). Risk is metric pollution only — keep it documented, not hidden (spec §7.3).
4. **runToken replay (bounded).** No `iat` by design; validity = own UTC date
   +1. Cross-day replay hits the practice lane at most to its folded 2/day cap;
   cross-identity replay is bounded by caps/flags. Acceptable; monitor `meta.runs`.
5. **Trust asymmetry to watch:** `/airdrop` publishes wallet→points publicly.
   Lawful and honest, but before the REAL snapshot decide whether a top-board is
   worth the whale-status pressure it creates (it is itself a Q3 YELLOW).

---

## 5. Compliance envelope for the v2 cycle

### 5.1 Mechanism-space classification (Q3/Q4)

**GREEN — lawful now, ship with honest copy (pack §8 inherited):**
- Cosmetic tier badges/tiers (exists: holder 1k / whale 100k) and any cosmetic
  render-layer items (skins, trails, frames, emotes, ghost styling) — LAW 2.1.
- Route-planning affordances over the SAME public terrain — LAW 2.2.
- Archive depth / practice marathons / holder-gated *practice* surfaces —
  LAW 2.3 + 2.4 (practice-only, never ranked).
- Airdrop weights for participation (streak, prediction, practice, vault as
  spec'd) — LAW 3.2, language "builds weights".
- Post-grad spend/burn on cosmetics, premium archive marathons, tournament/event
  entry tickets, route conveniences — LAW 2 + LAW 3.3 (burn never converts to
  ranked score/access/state). Tournament entry burns are GREEN-shaped but see
  YELLOW-3 for the legal-review precondition once prizes leave rehearsal.
- Transparency surfaces: burn counter, meter state, snapshot/proof tooling —
  these build trust and promise nothing.

**YELLOW — lawful only with owner sign-off and/or surgically careful copy:**
1. *Holders-only scoreboards:* a **weights board** (exists: `/airdrop` snapshot)
   is lawful — weights are explicitly not the game scoreboard (spec §7.4). A
   **balance-ranked holder board** is a different object: it never touches LAW 1
   (game score unaffected) but it ranks by portfolio — owner must sign off, and
   it needs a privacy pass (pseudonymous addresses only, opt-out). Default: don't.
2. *Vault-style holder-gated faucets:* lawful as a bounded, participation-gated
   exception (F4). Any generalization (tier-scaled vault points, balance
   multipliers on any weight event) is RED — the moment weight scales with
   balance, the airdrop becomes purchasable and the "participation" story dies
   (LAW 3.2 drift + securities-flavored optics).
3. *Tournaments with entry burns + prizes:* post-grad, testnet-rehearsed first;
   requires published rules per event, on-chain distribution, and a jurisdiction/
   gambling-tone review (pack §8.3) before any real-value prize. Skill-dominant
   format only; no "bet on yourself" framing.
4. *Bridge link placements* beyond the passive set (§5.3) — e.g. a one-time
   post-death informational line on the graduated panel: owner sign-off +
   compliance re-read; never in score-submission flows.
5. *MIRROR mode weights:* practice-lane rates only (spec §8) — keep it there.

**RED — void, do not propose (LAW 1/3 red-line bug, not a design choice):**
- Anything purchasable that changes score, multiplier, physics, loot, rank, or
  submission acceptance (LAW 1.1/1.3).
- Hold-to-play on the ranked daily level / gated base access (LAW 1.2).
- Selling weights or snapshot position, holder weight multipliers, "buy-in to
  boost your airdrop" (LAW 3.2).
- Revive/continue tokens that extend a RANKED run (pay-for-score-advantage).
  Revives are lawful only inside unscored archive/practice lanes.
- Profit/earnings framing: "earn", "guaranteed", APY/yield math on the 75% tax
  share, price predictions, "get in before graduation" urgency/FOMO.
- Gambling mechanics: real-stake wagering on candle outcomes (the route
  prediction must stay points-only, no stakes, no pools).
- Promising the platform incentive pool (utility track 1.5%) as a player
  benefit — "eligible, nothing guaranteed" is the ceiling (E0.5).

### 5.2 Bridge copy rules (Q1)

**DO (lawful pattern):**
- `GET $WICK ON THE CURVE · testnet · no monetary value` — neutral verb, plain
  testnet, honest scale. Link destination = the token's vibe/vibe page or a
  `/token` info page with the verified constants (meter, 2% tax 75/20/5, cap,
  transfers locked pre-grad).
- Present it as *information about the token that exists*, never as a step the
  player must take. WalletChip's "no tier yet" state may carry the link.
- Always pair with the honest line the repo already uses: free to play, no
  wallet needed, base game unaffected.

**DON'T (banned):** "buy to win/unlock", "claim your rewards", any earnings
implied, price talk, countdowns/urgency/FOMO ("before it graduates", "last
chance", "early"), gamified buy buttons (coins/sparkles on a buy CTA inside the
play loop), auto-redirects, or linking the curve from victory/celebration
moments where the player's guard is down.

### 5.3 No-go placements (hard lines)

1. Never on or adjacent to the PLAY / retry button; play never pauses for it.
2. Never inside score flows: submission response, leaderboard rows, rank
   celebration, Death Card content or its share text, duel/challenge messages.
3. Never in the weights surfaces as a condition ("link a wallet to keep your
   weights" = fine; "buy $WICK to bank your weights" = RED).
4. Never inside the vault/prediction/practice panels' grant messages (reward
   moment + buy link = earnings implication by juxtaposition).
5. Never auto-opened, never modal, never skippable-to-continue.

---

## 6. TRUST P&L — the three ways this dies, and the guardrail for each

1. **Weights-for-sale** (holder multipliers, buyable snapshot position): the
   fastest route from "unbuyable scoreboard" to "token farm with a game
   attached". *Guardrail:* LAW 3.2 participation-only — every weight input must
   trace to a gameplay event in the ledger; balance may gate cosmetics, never
   scale weights. Any proposal with a balance term in a points formula is void.
2. **Hidden pay-to-win / scoreboard drift** (revives on ranked runs, tier
   multipliers, "just a small" score nudge): LAW 1 is the brand; one P0 here
   undoes every "score is pure skill" claim in the launch pack. *Guardrail:*
   LAW 5.1 PR gate on every scoring/leaderboard/wallet/cosmetics PR + an audit
   hook asserting no balance read is imported into scoring paths; violations
   filed as P0 (LAW 5.2).
3. **Over-promising** (airdrop "guaranteed", incentive-pool promises, yield
   framing of the 75% tax split, invented numbers like the 5-eth-class flavor):
   the testnet no-value posture is our regulatory and moral shield; one
   earnings promise forfeits it. *Guardrail:* pack §8 language lint as a
   pre-deploy ritual (§7); "weights / if any / nothing guaranteed" everywhere;
   internal rationale prose never migrates to public surfaces.

---

## 7. Enforcement ritual additions (LAW 5 extensions for v2)

1. **Close the open gates before v2 lands:** E3.1 (make the law statement a PR
   template checkbox), E3.3 (anti-sybil audit — this memo's §4 is its input),
   E3.4 (token-page re-verify after any edit).
2. **Language lint pre-deploy:** scripted grep of player-facing strings and API
   metas for banned verbs (earn/guaranteed/profit/invest/stake-as-money) and for
   missing "testnet" disclosure on every economy surface. One line, run every ship.
3. **v2 proposal intake rule:** every council memo must carry a law-mapping
   table (mechanism → law(s) → LAW 2 lane → GREEN/YELLOW/RED per §5.1 → owner
   decision needed?). Memos without it are out of order; the seat returns them.
4. **Snapshot gate (pre-real-airdrop, hard):** wallet signatures at claim,
   anomaly-review sign-off recorded in the repo, loud advance notice, full
   testnet rehearsal cycle (E6.1), and publication review for the top-weights
   board (F9).
5. **Cadence:** one economy change per week maximum (E4.3) applies to the whole
   v2 cycle; every sink ships with its LAW 5.1 statement and a rollback note.
6. **P3 hygiene:** dedicated `RUN_TOKEN_SECRET`; reconcile the burn-total
   evidence lines at the next `verify-econ-state` run; de-number the "5 eth
   class" game-fiction flavor at next touch.

---

*Prepared by the RED-LINE AUDITOR seat · Task 73-d · No code was written or
modified for this audit; this memo is the sole artifact.*

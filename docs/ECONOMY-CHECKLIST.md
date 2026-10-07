# WICK ECONOMY CHECKLIST — the economy-phase execution tracker

> Written 2026-10-07 (owner directive: "enter the economy phase; build a complete
> checklist so nothing is missed"). Chat language FA · Doc language EN.
> Relationship to canonical docs: this file is a **sub-plan** that maps into the
> open phases of `docs/MASTER-CHECKLIST.md` (P4.2–P4.6, P5, P6). It does NOT
> replace the next-task rule — items here become MASTER-CHECKLIST ticks via the
> normal ritual (work → tick → commit). `docs/ECONOMY-LAWS.md` is supreme over
> every item below; where an item touches score, base access, or language, the
> laws and pack §8 red lines win.
> Tick format: `[x] YYYY-MM-DD @<commit> — one line of evidence`.

## 0. Live-state snapshot (verified 2026-10-07, pad API `/v6/launches/{token}`)

| Fact | Value | Consequence |
|---|---|---|
| Lifecycle | `CURVE_TRADING`, not graduated | pre-grad rules apply: no transfers, hold-or-buy only |
| Graduation meter | **0.0997 ETH / 4.000 ETH = 2.49%** | 2 days post-launch, near-flat → demand engine is THE bottleneck |
| `transfersUnlocked` | false | in-game spend/burn illegal until graduation (P6.3 stays gated) |
| Fee config (launch record) | taxBps 200 · weights 75% holders / 20% cash / 5% burn | docs say "50% payout + 50% buyback-burn" — **reconcile (E0.1)** |
| Graduation target | `targetPairUnits` = 4 ETH | strategy prose says "5-ETH graduation" — **reconcile (E0.2)** |
| P4.2 Balance Gate | code merged (`a7488b4`, cosmetic-only) — **not activated** | activation = env flip + QA (E2.1) |
| Platform incentives | 5% supply: traders 1.75% · meme 1.5% · **utility 1.5%** · old creators 0.25% | $WICK qualifies as utility (MVP live); nothing guaranteed (E0.5/E5.4) |
| Awareness | zero WICK mentions in 439-msg Discord corpus (Oct 3–6) | organic discovery ≈ 0 → E5 is load-bearing |
| Durability | O1 (`DATABASE_URL` in Vercel) still open in owner register | blocks durable weights/leaderboard (E0.3) |

## E0 — Verify & reconcile the numbers (no code, this week)

- [ ] **E0.1** Fee-split reconciliation: on-chain weights (75% holders / 20% cash /
  5% burn per launch record) vs prose narrative ("creator fee: 50% payout + 50%
  $WICK buyback-to-burn", GROWTH §2). Fix the docs to match the chain; note what
  "holders 75%" actually pays out (platform mechanic) in one plain paragraph. ⛓ none
- [ ] **E0.2** Graduation-target reconciliation: pad record `targetPairUnits` = 4 ETH
  vs "5-ETH graduation" in GROWTH §1 / pack. Decide the canonical number, fix all
  prose, and record it in `docs/evidence/`. ⛓ none
- [ ] **E0.3** O1 check: is `DATABASE_URL` actually set in the **Vercel dashboard**
  (all targets) and is the leaderboard persisting? Owner 2-min dashboard check or
  Vercel API; then tick O1 in MASTER-CHECKLIST. Blocks E2.2 durability. 🔒 owner ⛓ E2.2
- [ ] **E0.4** Weekly live snapshot ritual: run
  `python3 /home/z/my-project/scripts/verify-econ-state.py "<pad URL>"` → append
  meter %, lifecycle, holders/tx deltas to this file's §0 table (or evidence log).
  Owner sees days-to-graduation trend, not vibes.
- [ ] **E0.5** Incentive eligibility pass: confirm $WICK's fit for the **utility
  track (1.5%)** — MVP live, demo flow, usable product all true — and check the
  application/submission path + any deadline on the platform/Discord. Output:
  one-page eligibility memo (what we submit, when, evidence links). ⛓ none

## E1 — Economy design spec (paper before code)

- [ ] **E1.1** Write `docs/WICK-ECONOMY-SPEC.md` v1: supply & distribution model
  (curve-minted supply, wallet-cap 2%, fee weights), value-flow map (ETH in → meter;
  tax → holders/cash/burn; rewards → community), and the one-line economy thesis:
  "players earn weights, holders get cosmetic lanes, every trade burns". ⛓ E0.1, E0.2
- [ ] **E1.2** Sinks & Faucets ledger: table of every mechanic that creates demand
  (faucet: airdrop weights, tiers, vault, mirror) or absorbs supply/value (sink:
  burn fee, post-grad entry/tickets, cosmetics). Each row tagged with the LAW 2 lane
  it lives in. Anything outside cosmetics/routes/archive = red-flagged. ⛓ E1.1
- [ ] **E1.3** Demand funnel math: scenario sheet (10 / 50 / 200 DAU) × wallet-connect
  rate × avg buy size → net meter/day → days-to-graduation per scenario. Use ONLY
  verified constants (2% cap, 200 bps tax, 4-or-5 ETH target from E0.2). No invented
  conversion rates — state assumptions as assumptions. ⛓ E1.1
- [ ] **E1.4** Airdrop-weights formula spec (P4.4): weights = f(daily streak, route-
  prediction accuracy, archive marathons), deterministic, server-side; per-wallet
  caps; sybil rules (W1 HMAC + wallet link + anomaly review); snapshot & claim flow
  (Merkle). Language: "builds weights" — never "earn/guaranteed" (LAW 3.2/4). ⛓ E0.3
- [ ] **E1.5** Post-graduation spec v0 (design-only): spend/burn lanes (entries,
  revives, cosmetics, tournament tickets), treasury tournament mechanics, MIRROR
  mode economics, burn-counter surface. Numbers TBD at graduation; lanes fixed now. ⛓ E1.2

## E2 — Build the rails (MASTER-CHECKLIST P4.2 → P4.6 + graduation runtime)

- [ ] **E2.1** Activate Balance Gate (P4.2): owner sets `NEXT_PUBLIC_WALLET_ENABLED`,
  `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID`, `NEXT_PUBLIC_ROBINHOOD_RPC_URL` on Vercel →
  QA wallet-connect → cosmetic-only badge per LAW 2 → tick P4.2. 🔒 owner (env) ⛓ P4.1
- [ ] **E2.2** Airdrop-weight accounting (P4.4): server-side deterministic ledger
  (streaks, predictions, marathons), durable storage ⛓ E0.3; anti-sybil per E1.4;
  admin read API for the claim board. ⛓ E1.4, E0.3
- [ ] **E2.3** Route Prediction hook (P4.6 / H5): draw-tomorrow's-path UI + next-day
  deterministic scoring vs real OHLC; weights land automatically via E2.2. ⛓ E2.2
- [ ] **E2.4** Wick Vault hook (P4.3 / H7): vault entity at each level's peak wick;
  server verifies balance tier on open; grants cosmetics/weights only (LAW 2). ⛓ E2.1
- [ ] **E2.5** Merkle airdrop board pre-build (P6.1 first half): eligibility export
  from E2.2 ledger → Merkle tree → claim page → **testnet rehearsal** BEFORE the
  meter fills. ⛓ E2.2
- [ ] **E2.6** Burn-counter feed: read burn fee events from the curve/tax rails →
  public API + UI shell now; HUD live at P6.5 ("the game eats its own supply"). ⛓ none

## E3 — Laws & safety gates (run with every E2 item)

- [ ] **E3.1** LAW 5.1 review gate: every PR touching scoring/leaderboard/wallet/
  cosmetics states which laws apply and how it complies — in the PR description.
- [ ] **E3.2** Language sweep before any ship: "weights" not "earn/guaranteed";
  testnet stated plainly; no gambling texture (pack §8 / LAW 4).
- [ ] **E3.3** Anti-sybil audit: W1 HMAC + W5 anti-cheat + wallet-linked weights +
  per-wallet caps; document residual risks and review triggers.
- [ ] **E3.4** Token-page/metadata copy re-verified against laws after any edit
  (metadataURI is on IPFS — re-pin carefully if changed).

## E4 — Measurement & ops

- [ ] **E4.1** Economy dashboard v0: DAU, wallet-connect rate, holder count, meter
  ETH, net flow/day, burn total — SimpleAnalytics + Mongo aggregates + RPC reads,
  one internal page. ⛓ E0.3 for durable aggregates
- [ ] **E4.2** KPI definitions & targets: D1/D7 retention, connect-rate, buy-
  conversion (players→holders), streak distribution, days-to-graduation projection.
  Numbers reviewed weekly (E4.3), never invented (E1.3 rules).
- [ ] **E4.3** Weekly economy review ritual (owner + agent, 15 min): snapshot (E0.4)
  → KPI deltas → at most ONE economy change per week (no mid-air edits).
- [ ] **E4.4** Sentry alerts on economy paths: wallet API failures, weights-ledger
  write errors, leaderboard write failures. ⛓ E2.1, E2.2

## E5 — Demand activation (mostly owner-facing; assets ready)

- [ ] **E5.1** P4.5 showcase post (X + #project-showcase): copy ready (Task 67);
  media = owner-made AI video (Task 68 video work cancelled → owner path) or
  existing kit. Post, then log link here. 🔒 owner
- [ ] **E5.2** Guild "Candle Climbers" creation + wiredwisely reply: card + reply
  text ready (Task 67). First activity rule: 1 run/day + Death Card in channel —
  aligns with the real-activity judging criterion. 🔒 owner
- [ ] **E5.3** Daily Report cadence (H4): auto-aggregate card → X post daily.
  ⛓ P5.1 X account (O4)
- [ ] **E5.4** Incentives submission (utility track) if E0.5 confirms a path. 🔒 owner
- [ ] **E5.5** Referral/attribution loop: Death Card share CTA + board-metadata
  attribution so Gate G5's "referral traffic measurable" can actually pass. ⛓ E0.3

## E6 — Graduation readiness (pre-build BEFORE the meter fills)

- [ ] **E6.1** Graduation-day runbook: comms sequence, celebration scene (ART V4),
  Merkle delivery via E2.5, leaderboard freeze etiquette, X/Discord posts.
- [ ] **E6.2** Post-grad flags staged: spend/burn lanes, treasury tournaments,
  MIRROR mode — coded behind a `graduated` gate, flipped only after the tx. ⛓ E1.5
- [ ] **E6.3** Mainnet watch plan (CC-PLAN D11–14): what we watch, who acts, what
  "graduation success" means numerically. ⛓ E4.2

## Infrastructure mapping (all platforms already available to us)

| Workstream | Platform | Cost note |
|---|---|---|
| E2.1 wallet layer | WalletConnect Cloud free tier + public testnet RPC | $0 |
| E2.2/E2.5 ledger + claim | MongoDB Atlas (student credits) via Vercel | $0 (O1 pending) |
| E2.6/E0.4 chain reads | pad API + explorer API + public RPC (+Blockchair if needed) | $0 |
| E4.1 analytics | SimpleAnalytics Starter (student) + Mongo aggregates | $0 |
| E4.4 errors | Sentry student Team (already wired) | $0 |
| Hosting/flags | Vercel Hobby (already live) | $0 |
| Weight-cron (if needed) | Heroku credits (student pack) — only if Vercel cron insufficient | $0 |
| Repo-as-memory | GitHub (+ Codespaces fallback per owner directive) | $0 |

## Owner-only actions register 🔒 (nothing here can be done by agents)

| ID | Action | Unblocks |
|---|---|---|
| O1 | `DATABASE_URL` in Vercel dashboard → redeploy | E2.2 durability, E4.1, E5.5, H3/H4 full |
| O-W | WalletConnect project id + env flip (E2.1) | P4.2 tick, G4 |
| O-X | X account + showcase post + Daily Report cadence | P5.1, G5 |
| O-G | Guild creation + wiredwisely reply | E5.2 |
| O-I | Incentives submission (if applicable) | E5.4 |
| O-S | Sign-off on tier thresholds + weights formula numbers | E1.4 → E2.2 ship |

## Suggested execution order (three sprints, respects the next-task rule)

1. **Sprint A (now, zero code risk):** E0.1–E0.5 (reconcile + verify) · E1.1–E1.3
   (paper spec + funnel math) · owner runs E5.1/E5.2 with ready assets.
2. **Sprint B (rails):** E2.1 flip + E2.2 ledger + E2.3 prediction + E4.1 dashboard
   + E3 sweep on all three.
3. **Sprint C (pre-grad):** E2.4 vault + E2.5 Merkle rehearsal + E6.1 runbook +
   E4.2 KPI targets; E5.3 daily report once X exists.

*Sources: pad API live pull 2026-10-07 · docs/ECONOMY-LAWS.md · docs/MASTER-CHECKLIST.md ·
docs/GROWTH-AND-HOOKS-STRATEGY.md · docs/INTEL-UPDATE-2026-10-07.md (incentives verbatim) ·
docs/evidence/wick-launch-record.json · worklog Tasks 61–67.*

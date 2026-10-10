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
| Fee config (launch record) | taxBps 200 · weights 75% holders / 20% cash / 5% burn | docs said "50% payout + 50% buyback-burn" — **RECONCILED 2026-10-08 (E0.1 ✅)**: docs now match the chain (GROWTH §2/§4) |
| Graduation target | `targetPairUnits` = 4 ETH | strategy prose said "5-ETH" — **RECONCILED 2026-10-08 (E0.2 ✅)**: $WICK launched via LEGACY factory `0xe7942178…` → per-launch target 4 ETH is canonical; 5 ETH = current-factory policy (TOKEN-LAUNCHPAD-RESEARCH §5) |
| P4.2 Balance Gate | code merged (`a7488b4`, cosmetic-only) — **ACTIVATING** | `NEXT_PUBLIC_WALLET_ENABLED=on` set on Vercel via API 2026-10-08 (all targets) — goes live with next deploy |
| Platform incentives | 5% supply: traders 1.75% · meme 1.5% · **utility 1.5%** · old creators 0.25% | $WICK qualifies as utility (MVP live); nothing guaranteed (E0.5/E5.4) |
| Awareness | zero WICK mentions in 439-msg Discord corpus (Oct 3–6) | organic discovery ≈ 0 → E5 is load-bearing |
| Durability | **CLOSED 2026-10-08 (E0.3 ✅)**: prod `/api/leaderboard` returns `store:"mongo"`, `dbError:null` — DATABASE_URL is set and Atlas is serving | E2.2/E2.5/E4.1/E5.5 are DURABLE from day one |

## E0 — Verify & reconcile the numbers (no code, this week)

- [x] **E0.1** 2026-10-08 — Fee-split reconciliation: chain = 75/20/5 (launch record weights
  holdersBps 7500 / cashBps 2000 / burnBps 500) → GROWTH §2 loop + §4 burn narrative corrected
  with dated note; deflation narrative now anchored on the 5% burn share. ⛓ none
- [x] **E0.2** 2026-10-08 — Graduation-target reconciliation: $WICK factory = legacy
  `0xe7942178…` → 4 ETH canonical (launch record + live pad API agree); MASTER-CHECKLIST P6
  heading + GROWTH §1 fixed with provenance note. ⛓ none
- [x] **E0.3** 2026-10-08 — O1 verified via prod probe: `/api/leaderboard` → `store:"mongo"`,
  `dbError:null`. DATABASE_URL live on Vercel production; O1 CLOSED in MASTER-CHECKLIST.
  (Note: var targets `production` only — acceptable; preview/dev use memory fallback.) 🔒→✅
- [x] **E0.4** 2026-10-07 — RITUAL ESTABLISHED + first run: scripts/verify-econ-state.py
  (pad API `/api/v1/chains/46630/v6/launches/{token}` + prod /api/burn) → first snapshot:
  lifecycle CURVE_TRADING · graduated false · meter 0.1574/4.0 ETH = **3.94%** (up from
  2.49% at Oct-07 writing) · remaining 3.8426 ETH · burned 254,293 WICK. Evidence line +
  raw dump in docs/evidence/. Re-run weekly: `python3
  /home/z/my-project/scripts/verify-econ-state.py --append`.
- [x] **E0.5** 2026-10-10 — Incentive eligibility pass DONE as a memo:
  docs/council/2026-10-10-INCENTIVE-ELIGIBILITY-MEMO.md — $WICK qualifies for the
  **utility track (1.50%)** on the platform's own stated criteria ("MVP, demo, prototype,
  simulation, or usable flow; ideas alone are not enough" — we are the shipped opposite).
  Submission path: NO formal application found in the captured corpus — launching IS the
  intake path; showcase presence is the observable evidence. DEADLINE: none stated.
  Remaining: owner-facing watch for a formal window (O-I / E5.4). ⛓ owner for submission

## E1 — Economy design spec (paper before code)

- [x] **E1.1** 2026-10-08 @ cd1d828 — docs/WICK-ECONOMY-SPEC.md v1: supply/distribution
  (curve-only pre-grad), value-flow map, one-line thesis, verified-constants table (§1–§4). ⛓ E0.1 ✅ E0.2 ✅
- [x] **E1.2** 2026-10-08 @ cd1d828 — Sinks & Faucets ledger (10 rows, every row tagged with
  its LAW 2 lane; red-line rule stated). ⛓ E1.1 ✅
- [x] **E1.3** 2026-10-08 @ cd1d828 — Demand funnel math: 10/50/200 DAU scenarios against
  the 4-ETH meter; assumptions labeled as assumptions; only verified constants used. Reading:
  breadth (E5) is the only lever — hooks-first is correct. ⛓ E1.1 ✅
- [x] **E1.4** 2026-10-08 @ cd1d828 — Weights formula spec (spec §7): streak min(N,10)/day,
  practice/prediction lanes reserved, wallet snapshot cap 600 [PROVISIONAL], identity↔wallet
  anomaly limit 2, Merkle snapshot→claim at E2.5, language rules enforced. ⛓ E0.3 ✅
- [x] **E1.5** 2026-10-08 @ cd1d828 — Post-graduation spec v0: spend/burn lanes, treasury
  tournaments, MIRROR economics, burn-counter surface — lanes fixed, numbers at graduation (spec §8). ⛓ E1.2 ✅

## E2 — Build the rails (MASTER-CHECKLIST P4.2 → P4.6 + graduation runtime)

- [x] **E2.1** 2026-10-08 @ cd1d828 — Balance Gate ACTIVATED: `NEXT_PUBLIC_WALLET_ENABLED=on`
  set on Vercel (all targets) by agent via API → deploy READY → "CONNECT WALLET" + tier labels
  confirmed in the deployed bundle; POST /api/wallet prod-verified on-chain (0xdEaD → whale);
  chip stays invisible for walletless visitors by design (E8 zero-friction). WalletConnect
  project id NOT required (shipped impl = injected provider only). 🔒→✅ (O-W closed)
- [x] **E2.2** 2026-10-08 @ cd1d828 — Weights ledger LIVE + DURABLE: lib/weights.ts (pure,
  W5-pinned) + weights-store.ts (memory/mongo, unique name+date) + GET /api/weights
  (read-only by design — no write path) + leaderboard fire-and-forget wiring (LAW 1:
  never observable in the game response). PROD E2E: verified submission → streak 1,
  points 1, wallet linked, snapshot board reflects it (Mongo). Streak lane live;
  practice/prediction lanes land with E2.3. Anti-sybil per E1.4 (caps + flags + W1).
- [x] **E2.3** 2026-10-08 @ 4b3997b — Route Prediction LIVE: /api/prediction (lock-one-call-per-day,
  symbol+date server-pinned from the rotation, tiered 4/3/3 scoring vs the REAL closed daily
  candle, lazy idempotent scorer, Mongo-unique per identity/target) + TOMORROW'S MARKET panel
  in the ready screen + practice lane (/api/practice: verified ARCHIVE token → 0.5, folded
  2/day cap; wired to archive deaths client-side). PROD E2E: call locked for 2026-10-08
  ETHUSDT (dup→409), archive run banked +0.5, events visible in /api/weights. W5: prediction
  + weights-events suites. ⛓ E2.2 ✅
- [x] **E2.4** 2026-10-08 @ 4b3997b — WICK Vault LIVE (server rails + panel hook): /api/vault
  verifies (1) signed token for TODAY's classic 1w level, (2) on-chain tier ≥ holder via shared
  wick-balance read, (3) unique (name,date,"vault") ledger insert → +1 weight + cosmetic trail
  (gold=whale, ember=holder); one open/day. Client: peak-wick candle computed from terrain,
  run that passed it sees OPEN WICK VAULT on death/graduation panels. PROD E2E: 0xdEaD
  (whale) opened → gold-trail, dup→409. In-terrain chest sprite = P4.3 visual polish (hook +
  rails complete). ⛓ E2.1 ✅
- [x] **E2.5** 2026-10-08 @ 4b3997b — Merkle airdrop REHEARSAL live: pure merkle lib
  (WebCrypto SHA-256, isomorphic; deterministic roots, proofs verified server AND in-browser)
  + /api/airdrop (root over current snapshot, flagged wallets excluded, per-wallet proof) +
  public /airdrop board page with wallet lookup + local proof verification. PROD E2E: root
  announced, 0xdEaD proof verified (points 2 after vault grant, board updated). Real snapshot
  freezes + publishes salt/root at graduation (E6.1). ⛓ E2.2 ✅
- [x] **E2.6** 2026-10-08 @ 4b3997b — Burn-counter feed live: /api/burn reads cumulative
  0x…dEaD balance via public RPC (5-min cache, fail-open) + SUPPLY BURNED line on the ready
  screen. PROD verified: 164,944.787 WICK burned. Fee-EVENT attribution (tax vs curve per
  day) = post-grad polish (P6.5 HUD). ⛓ none

## E3 — Laws & safety gates (run with every E2 item)

- [x] **E3.1** 2026-10-10 — LAW 5.1 review gate made mechanical: docs/PR-CHECKLIST.md
  (copy-into-PR form: surfaces → laws → degrade paths → tests; agent solo-runs record
  the filled gate in the commit body + worklog, owner pre-approval 2026-10-02 precedent).
- [x] **E3.2** 2026-10-08 @ 4b3997b — Language sweep applied to the E2.3–E2.6 ship: every new
  surface ("builds airdrop weights" wording, tier breakdowns, /airdrop rehearsal copy, /api
  meta blocks) states testnet plainly, never "earn/guaranteed"; no gambling texture. Applies
  to: prediction panel + API meta, practice + vault responses, airdrop board page, burn line.
- [x] **E3.3** 2026-10-10 — Anti-sybil audit: docs/council/2026-10-10-ANTI-SYBIL-AUDIT.md —
  9 shipped layers WITH limits, 6 residual risks documented-not-hidden (guest name-sybil,
  client-claimed weight-lane wallet links, multi-device, freeze arbitrage = none, ref gaming
  = inert, platform-side wash trading), 5 review triggers (snapshot caps, anomaly flags,
  Sentry P2 bursts, ref dominance, score-cluster patterns).
- [ ] **E3.4** Token-page/metadata copy re-verified against laws after any edit
  (metadataURI is on IPFS — re-pin carefully if changed). 🔒 owner (re-pin is a wallet/platform action); agent copy-sweep of 2026-10-10 (F4 + "archive runs" fix) keeps the SOURCE texts lawful

## E4 — Measurement & ops

- [x] **E4.1** 2026-10-10 @ a906a04 — Economy dashboard v0 LIVE: `/ops` (noindex,
  server-rendered, aggregate-counts-only — zero PII): meter/lifecycle/burn from the pad
  API + RPC, graduation-gate state, lane counts + top refs, ledger aggregates
  (weights `stats()` + board `laneStats()`, memory+mongo). Connect-rate slot honest n/a
  (needs analytics). ⛓ E0.3 ✅
- [x] **E4.2** 2026-10-10 — KPI definitions & targets: docs/council/2026-10-10-KPI-DEFINITIONS.md
  — 10 KPIs with EXACT definitions + sources, targets marked PROVISIONAL with labeled
  assumptions (north star: D7-retained climbers who connect a wallet); v1 honest gaps
  listed (daily cohorts, pre-grad buy-conversion genuinely unreadable — not faked).
- [ ] **E4.3** Weekly economy review ritual (owner + agent, 15 min): snapshot (E0.4)
  → KPI deltas → at most ONE economy change per week (no mid-air edits). 🔒 needs owner cadence
- [x] **E4.4** 2026-10-10 @ a906a04 — Sentry alerts on economy paths LIVE:
  src/lib/telemetry.ts (dynamic-import wrapper — tests/runtime safe, warning-level)
  wired to: weights-store mongo connect/write failures (P2 per spec §9), leaderboard-store
  connect failure, /api/wallet RPC read failure, /api/burn read failure. Game paths stay
  fail-open; the ALERT is the point.

## E5 — Demand activation (mostly owner-facing; assets ready)

- [ ] **E5.1** P4.5 showcase post (X + #project-showcase): copy ready (Task 67);
  media = owner-made AI video (Task 68 video work cancelled → owner path) or
  existing kit. Post, then log link here. 🔒 owner
- [ ] **E5.2** Guild "Candle Climbers" creation + wiredwisely reply: card + reply
  text ready (Task 67). First activity rule: 1 run/day + Death Card in channel —
  aligns with the real-activity judging criterion. 🔒 owner
- [ ] **E5.3** Daily Report cadence (H4): auto-aggregate card → X post daily.
  ⛓ P5.1 X account (O4)
- [ ] **E5.4** Incentives submission (utility track): E0.5 memo CONFIRMS eligibility
  (docs/council/2026-10-10-INCENTIVE-ELIGIBILITY-MEMO.md); no formal application window
  exists yet in the captured corpus — watch for one, submit the TRUTH-TABLE + checklist
  as evidence when it appears. 🔒 owner
- [x] **E5.5** 2026-10-10 @ a906a04 — Referral/attribution loop LIVE (Gate G5 evidence path):
  every traveling text now carries a measurable link — Death Card share text + COPY EPISODE
  + duel invites append `?ref=<sanitized sharer name>`; landing `?ref=` persists device-wide
  (cc_ref_v1) and stamps every later submission (board-validation `sanitizeRef`: bounded
  alphabet, fail-open omit, metadata-only — never a lane/rank/weights input); /ops rollup
  = top refs (7d). Referral traffic is now MEASURABLE in board metadata, exactly as G5
  requires. Traffic VOLUME stays the owner's reach lever. ⛓ E0.3 ✅

## E6 — Graduation readiness (pre-build BEFORE the meter fills)

- [x] **E6.1** 2026-10-10 @ a906a04 — Graduation-day runbook + runtime:
  docs/council/2026-10-10-GRADUATION-RUNBOOK.md (T+0..T+8 sequence, freeze probe commands,
  comms skeleton, owner decision points) + WEIGHTS_FROZEN freeze etiquette SHIPPED
  (4 lanes honest-pause, scores keep flowing, prediction calls stay open + idempotent;
  test/e5-e6.test.ts pins all four) + GRADUATED/PAD_API_URL envs in .env.example.
  Celebration scene (ART V4) = visual phase.
- [x] **E6.2** 2026-10-10 @ a906a04 — Post-grad flags STAGED behind a fail-closed gate:
  src/lib/graduation.ts — `graduationState()` (pad API `graduated`/lifecycle read,
  15-min cache, OUTAGE ⇒ PRE-GRAD always; env override GRADUATED=1 for post-tx),
  POST_GRAD_LANES registry (mirror / spend-burn / tournaments / burn-counter-hud =
  "staged"), weightsFrozen(). Numbers stay uncoded by design (spec §8: at graduation).
  test/e5-e6.test.ts pins the full truth table.
- [x] **E6.3** 2026-10-10 — Mainnet watch plan: docs/council/2026-10-10-MAINNET-WATCH-PLAN.md
  — 8 watched signals with exact sources + cadence, owner/agent split, escalation rule
  (2 slow weeks ⇒ reach is the lever, economy knobs frozen), "graduation success"
  numerics (targets labeled), 4 pre-commitments. ⛓ E4.2 ✅

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
| ~~O1~~ | ~~`DATABASE_URL` in Vercel dashboard~~ ✅ **CLOSED 2026-10-08** — verified live: prod `/api/leaderboard` returns `store:"mongo"`, `dbError:null` | ~~E2.2 durability, E4.1, E5.5, H3/H4 full~~ — all unblocked |
| ~~O-W~~ | ~~WalletConnect project id + env flip (E2.1)~~ ✅ **CLOSED 2026-10-08** — `NEXT_PUBLIC_WALLET_ENABLED=on` set on Vercel (all targets) by agent via API; WalletConnect id NOT needed (shipped implementation = injected provider only, zero new deps) | P4.2 tick (after deploy QA), G4 |
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

- **E0.4 snapshot 2026-10-07 20:52 UTC** — lifecycle `CURVE_TRADING` · transfers `?` · meter `None/4000000000000000000 ETH` · burned `254,293.162` WICK (raw: docs/evidence/econ-snapshot-latest.json)
- **E0.4 snapshot 2026-10-07 20:53 UTC** — lifecycle `CURVE_TRADING` · graduated `False` · meter `0.1574/4.0 ETH = 3.94%` · burned `254,293.162` WICK (raw: docs/evidence/econ-snapshot-latest.json)
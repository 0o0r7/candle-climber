# COUNCIL SEAT REPORT — TOKEN ECONOMIST (Task 2-a)

> Written 2026-10-08 · Seat: token economist · Research/design only — wires no code,
> changes no law, runs no build, touches no ledger. Precedence: `docs/ECONOMY-LAWS.md`
> (supreme) → WICK-LAUNCH-FORM-PACK §8 → WICK-ECONOMY-SPEC → `docs/ECONOMY-COUNCIL/*`
> (Task-73 round: MEMO-ECONOMIST, CHAIR-VERDICT D-table — its envelope BINDS this seat)
> → this report. Where I repeat a Task-73 ruling I cite its D-number; new work is marked.
> Sources read: ECONOMY-LAWS.md (full) · WICK-ECONOMY-SPEC.md (full) ·
> ECONOMY-CHECKLIST.md (full) · GROWTH-AND-HOOKS-STRATEGY.md (full) · CHAIR-VERDICT.md ·
> MEMO-ECONOMIST.md (my prior seat memo). All numbers are verified facts from the
> evidence trail or explicitly labeled [DERIVED]/[ASSUMPTION] (LAW 4).
> TAG LEXICON: [SAFE] lawful today · [GRAY] lawful only with owner sign-off + E3.4
> compliance re-read (≈ Task-73 YELLOW) · [FORBIDDEN] void under current laws (≈ RED;
> needs a dated LAW 5.3 amendment) · [PRE-GRAD]/[AT-GRAD]/[POST-GRAD] ·
> [BUILD-NOW]/[DESIGN-ONLY] · + one-line risk per proposal.

---

## 0. VERIFIED BASE + LABELED DERIVATIONS

| # | Statement | Status |
|---|---|---|
| V1 | Meter 0.1574 / 4.0 ETH = **3.94%**, remaining **3.8426 ETH**; lifecycle `CURVE_TRADING`, transfers locked | verified (E0.4, 2026-10-07 20:53 UTC — latest snapshot in evidence) |
| V2 | Earlier same-day point: 0.0997 ETH = 2.49% (ECONOMY-CHECKLIST §0) | verified |
| D1 | Net inflow ≈ **+0.058 ETH** inside the V1↔V2 window (<1 day) → naive graduation ≈ **~66 days** | [DERIVED from V1+V2] · [ASSUMPTION: single window, no trend; a flat or negative week erases it] |
| V3 | Burned **254,293 WICK** at 0xdEaD (live `/api/burn`) | verified |
| D2 | If ALL V3 came from the tax's 5% burn share → tax ≈ 5.09M WICK → **gross traded volume ≤ ~254M WICK** (~32% of the ~793M curve allocation). True figure is lower — curve-fee burns (spec §1: each fee leg 50% claim + 50% burn) also credit 0xdEaD | [DERIVED, stated as an upper bound] |
| D3 | Reading of D2: **real churn exists; net accumulation is a thin residue on top of it.** The meter is net (buys − sells, GROWTH §1); churn and demand are different quantities and only one of them is visible in our only live economy line (see §1.4) | [DERIVED] |
| F1 | **AUDIT FINDING (flag to Red-Line Auditor seat; no code touched by this seat):** the largest balance-read "holder" is the burn address itself — 254,293 ≥ the 100k whale threshold, and the E2.4 prod E2E "whale opened vault (gold-trail)" ran as `0xdEaD`. Tier reads and any future holder-count metric must **exclude 0xdEaD** or our holder/whale statistics are polluted by our own burn | finding, [SAFE] to fix, owned by auditor seat |

---

## 1. Q1 — FAUCET/SINK AUDIT: WHERE IS BUY PRESSURE SUPPOSED TO COME FROM?

### 1.1 The intended engine, per the docs (quote chain)

- Spec §2: pre-grad transfers locked → **the only way to hold $WICK is buying from the curve.** No airdrops, no team unlocks, no side-door supply. Every holder is a genuine buyer.
- Spec §3 reading: "the game's job is to create the daily demand that makes buying-and-holding the rational move for people who like the game."
- GROWTH §2 loop: daily-return hook → want today's run/reveal → buy → streak/weights make selling self-harm → 2% wallet cap makes breadth the only lever → collective climb → graduation.
- Spec §6 funnel math, honestly labeled: 10 DAU graduates **nothing, ever**; 50 DAU is marginal (~13 mo); ~200 DAU with 40% buy propensity ≈ 1.7 mo. Breadth × daily-return is the only lever.

### 1.2 Is the design honest about the gap? Split verdict.

- **On paper: YES, unusually honest.** E1.3 labels cold start "not viable"; E5 is marked load-bearing while frozen; the Task-72 owner answer said plainly: rails aligned, **demand is the bottleneck, no guarantee the meter crosses** (worklog Task 72). ECONOMY-CHECKLIST §0 says it in one line: "demand engine is THE bottleneck."
- **In the product: honest-by-omission, not honest-by-showing.** The collective climb — our best co-op narrative — is invisible inside the game (no meter line; chair D3/B4 approved, not shipped). The only live economy surface, the SUPPLY BURNED line, is **churn-fed, not demand-fed**: the 5% tax share burns on every trade, so the counter rises even in a week where net selling dominates and the meter falls (D2/D3). Showing burn without meter is a subtle honesty gap: activity ≠ progress. Fix exists (D3), pending owner copy nod.

### 1.3 The live buy-required inventory — one object

Pre-grad, exactly **one** shipped mechanic strictly requires buying: the **WICK Vault** (pass the level's peak-wick candle + hold ≥1,000 → +1 weight, one-day trail, once/day). Its honest weaknesses, all verified:

1. **Double gate:** you must be skilled enough to reach the peak wick AND hold. Fires for a minority of players (chair §2, my prior memo §1).
2. **The reward teaches the wrong lesson:** +1/day vs the streak lane's 10/day cap. The game itself says "playing beats holding" — mathematically true in our own ledger.
3. **The identity evaporates:** the trail expires after the vault-open day. Nothing persists (persistence = D5, approved, not built).
4. Everything else holder-flavored (ember/gold tiers, tier labels on the chip) is display-only (E2.1) and reachable only *through* the vault grant.

So the documented engine (hooks → want → buy → hold) has, in the live product, **no painted path** from play to buy: no bridge (E5.5/attribution unbuilt), no meter line, no persistent holder identity. The engine exists as intent; the funnel exists as three scattered surfaces a curious player must find alone.

### 1.4 What is ACTUALLY moving the meter (3.94%)

- The meter moved ≈ +0.058 ETH inside one measured window (D1) — **unattributed**. We have no instrument that can credit a single wei of the 0.1574 to product-driven conversion: `/api/go/{placement}` counters don't exist (E5.5), connect/buy conversion isn't tracked (E4.1 unbuilt), holder count appears nowhere in the evidence trail.
- D2 says there IS meaningful gross churn — so the honest sentence is: **the 3.94% is an unattributed net residue on top of active churn, produced by wallets we cannot name, for motives we cannot measure.** The only "buyer cohort" our evidence can name is the E2E wallet — which is the burn-address artifact (F1). That is how blind we currently are.
- Attribution blind-spot is itself a design defect: we cannot improve what we cannot see (ties to KPI-5 "Peak→buy-24h" in the chair's stack — the one number that would answer the owner's core question — currently unmeasurable).

**Q1 verdict:** intended buy pressure = daily hooks + vault + collective climb, converting via breadth. Docs are honest about the gap; the product surface isn't yet (invisibly, not deceptively). What actually moves the meter is unknown-by-construction — and one double-gated object cannot fill 3.8426 ETH.

---

## 2. Q2 — WHY WOULD A RATIONAL USER BUY+HOLD TODAY? RANKED AND GRADED

Grades: A = sufficient on its own · B = real driver for a defined segment · C = true but weak/narrative · D = real system, wrong direction for buys, or unvoiceable.

| Rank | Reason to buy+hold TODAY | What it actually is | Grade | Real or narrative |
|---|---|---|---|---|
| 1 | **Vault access** (hold ≥1,000 → open the peak-wick vault: +1 weight, one-day trail) | The only strictly-buy-required mechanic; live, prod-verified (E2.4). Double-gated by skill + holding; reward small next to streak 10 | **B** | REAL mechanic, weak magnitude |
| 2 | **Holder cosmetic identity** (ember/gold trail, tier label on chip) | Lawful LAW 2.1 lane, live — but the trail expires at UTC midnight today; persistence approved (D5), not built. Identity that evaporates nightly is not an identity | **C+** | REAL, transient — underbuilt |
| 3 | **75% of the 2% trade tax redistributed to holders** | True mechanism (launch record `weights` 7500), verifiable on-chain. But [DERIVED] total tax to date ≈ ≤5.09M WICK → per-holder yield is dust at current volume. A hold argument, not a first-buy argument — and LAW 4 forbids voicing it as income | **C** | Real mechanism, narrative-grade effect today |
| 4 | **Burn/deflation narrative** (254,293 burned, live counter) | Automatic fee rails; zero personal consequence pre-grad; counter is churn-fed (§1.2) | **C−** | Narrative |
| 5 | **Airdrop weights / snapshot eligibility** | Our strongest FOMO asset — and it pushes in the wrong direction: weights are participation-only; holding adds **zero** (holder bonus D1 = REJECTED default). Drives wallet **linking**, not buying | **D** (as a buy driver) | REAL system, misaligned with buys by law |
| 6 | **Post-graduation speculation** ("buy before graduation, liquidity migrates to Uniswap v4") | Probably the real-world motive of some curve buyers — and one we **cannot voice**: LAW 4 + the plain-statement testnet rule ("no monetary value") forbid it. A lawful design must not depend on demand it is forbidden to name | **D** (for us) / unstatable | Narrative (in buyers' heads, not in our design) |

**Tally — brutal version:** zero A's. One B (vault). Three C-range (identity, tax share, burn). Two D's (weights = pushing linking not buying; speculation = unvoiceable). **Real product mechanics: 2 (vault, transient trails). True-but-weak rails: 2 (tax share, burn). Real-but-misaligned: 1 (weights). Unvoiceable: 1.** A rational user buys today for one of two reasons: they reached the peak wick and want the vault (segment: skilled, engaged), or they are telling themselves a story we are not allowed to tell. Everything else is atmosphere.

**Seat note on D1 (holder weight bonus):** my prior memo proposed it as the one amendment worth making (+5/day, flat, participation-gated); the chair rejected it by default under the auditor envelope (D1/D22: the vault is the *single* bounded holder-gated faucet; generalizing is RED). My dissent stands recorded; the envelope wins; I do not re-litigate. Everything below assumes the rejection stands — the ladder must work without it. [FORBIDDEN-until-amended] · [PRE-GRAD] · [DESIGN-ONLY] · risk: even amended, it partially capital-weights the airdrop and spends our "players-first" utility-track story.

**Excluded on purpose:** the platform incentive pool (5% supply; utility track 1.5%) is an **owner** reason to keep the product genuine, not a **user** reason to buy. It never belongs in user-facing buy logic.

---

## 3. Q3 — THE POST-GRAD SINK LADDER (LAW 2 LANES + EVENT ENTRY ONLY)

### 3.1 How the loop changes shape at graduation

Pre-grad, the meter fills on net curve buys and holders can only buy-and-hold. At graduation, the curve migrates to a Uniswap v4 pool and transfers unlock (spec §2) — the meter freezes into LP depth, and for the first time a holder has three verbs: **hold, sell, spend.** The ladder's job is to make *spend* the third verb that feeds the first:

> **The refill loop (the continuing cycle):** sinks burn/spend WICK → balance falls toward the 1,000 tier/vault threshold → holder tops up on the LP → buy pressure re-created *by the sinks themselves*, weekly, forever. This — not the one-time graduation spike — is the owner's "continuing cycle."

**DARK-PATTERN GUARD (binding):** the refill loop works only if it is honest. Tier thresholds must stay round and far above typical sink prices (never engineered so a common purchase drops you out of tier), mechanics disclosed, no artificial scarcity clocks. The Psychologist's compulsion refusals (chair D24) bind every rung.

**SIZING RULE (new, this seat):** planned weekly sink capacity ≤ measured faucet reality (weights accrual × active wallets × holder count), reviewed weekly (E4.3). A sink ladder oversized against DAU is a museum with a gift shop.

### 3.2 The ladder, rung by rung

| Rung | Mechanic | Why it creates REPEAT buys (the cycle) | Law lane | Risk | Tag |
|---|---|---|---|---|---|
| **R1 · Cosmetics shop, weekly rotation** | Fixed-WICK-price trails / death-card frames / ghost styling / emotes; shop rotates on a disclosed weekly schedule (chair P8/D16) | Weekly new items = weekly visit reason + collection completion chase; spend → top-up buy | LAW 2.1 cosmetics | Urgency creep if rotation teased with countdown spam — disclosed schedule only | [SAFE] [POST-GRAD] [DESIGN-ONLY] — implementation contract now (chair B16), prices at graduation |
| **R2 · Deterministic forge / reroll** | Burn N WICK to reroll a disclosed variant, or combine 3 owned → 1 new (burned). **No loot boxes — deterministic, disclosed** (chair P9/D16) | Collection depth is the longest-lived repeat-spend engine in F2P; every forge is a direct burn → refill | LAW 2.1 cosmetics | Randomness-adjacent optics; keep outcomes deterministic and shown in advance | [SAFE] [POST-GRAD] [DESIGN-ONLY] |
| **R3 · Era / archive passes** | Monthly themed bundles of deep historical terrain (COVID day, LUNA day, FTX day) with era palettes (H1/ART §4); practice-only, unscored | Monthly content cadence: new famous dates = new reasons to buy; selling **practice** is explicitly lawful (LAW 2.3) | LAW 2.3 archive | Must never let archive runs touch the ranked board (existing rule); pass fatigue if cadence slips | [SAFE] [POST-GRAD] [DESIGN-ONLY] |
| **R4 · Tournament tickets** | Entry = ticket burn; prize pool from the 20% cash tax share; rules published per event; **free companion bracket mandatory** (chair P10/D17) | Weekly competitive calendar: skilled players buy tickets repeatedly; spectators watch; DAU spikes on event days | Events (LAW 3.3) | Gambling-tone review (pack §8.3) REQUIRED before any real-value prize [GRAY until that review] | [GRAY] [POST-GRAD] [DESIGN-ONLY] |
| **R5 · Guild chest** | Members burn WICK into a communal chest; full chest unlocks a guild-wide cosmetic (banner trail); per-member daily cap (chair P12/D16) | Social coordination is the stickiest repeat mechanic we don't yet have; rides the platform guild (E5.2) once O-G fires | LAW 2.1 cosmetics (shared) | Blocked on O-G (owner guild creation); whale-domination optics if caps too high | [SAFE] [POST-GRAD] [DESIGN-ONLY] |
| **R6 · Season pass — cosmetics ONLY** | ~30-day "candle seasons"; pass pays out a cosmetic collection across the season; **grants zero weights, ever** (chair P11/D16) | Seasonal reset is the strongest recurring buy engine in F2P; resets collections, not banked weights (D6) | LAW 2.1 cosmetics | Selling weights inside a pass would break LAW 3.2 from the seller's side — hard exclusion | [SAFE] [POST-GRAD] [DESIGN-ONLY] |
| **R7 · Event entry (LAW 3.3's own lane)** | Entry burns for flagship events: the graduation-anniversary MIRROR legendary re-climb, seasonal summits; prizes treasury-funded, rules published | Event calendar gives the year a shape; entry burns are the cleanest lawful sink in the whole law (3.3 names it) | Events (LAW 3.3) | Same §8.3 review as R4; never an access gate to ranked play | [SAFE] [POST-GRAD] [DESIGN-ONLY] |
| **R8 · Route conveniences (MIRROR era)** | Post-grad, $WICK's own OHLC feeds the terrain pipeline (H6/MIRROR); sell route-tool conveniences on it — saved-path slots, ghost-compare on token terrain | Your own position as daily terrain = daily return; conveniences monetize engagement, not information | LAW 2.2 routes | The red line: affordances only — must never inject/reveal terrain data others can't see (LAW 2.2 verbatim) | [SAFE] [POST-GRAD] [DESIGN-ONLY] |

**Explicitly NOT in the ladder (never-list, restated):** weights for sale in any form (breaks LAW 3.2 seller-side); ranked-run revives (a revive touching a submittable run is score mutation — chair D18); loot boxes / wager-to-multiply / prize wheels (pack §8, LAW 4); anything where a burned token converts to ranked score, ranked access, or score-affecting state (LAW 3.3 verbatim).

### 3.3 Pre-build now or design-only until graduation?

**DESIGN-ONLY for the entire ladder.** Three reasons, no exceptions requested:

1. **Transfers are locked** (verified): any spend/burn code path is dead and untestable end-to-end until `transfersUnlocked` flips. Building now = shipping unverifiable code against the law's own gate.
2. **Process rule:** nothing economy-touching builds without the owner answering the Task-73 decision points (worklog Task 73; chair §6). The sink menu is decision point 5.
3. **One-change-per-week** (E4.3): pre-grad slots belong to the pre-grad funnel (bridge, identity, meter), not to post-grad code.

The only lawful pre-grad "build" is paper: implementation contracts to chair-B16 stage (mechanic, constants-schema, law-lane, risk), staged behind the `graduated` flag per E6.2, prices/cadence fixed by the owner at graduation after an E0.4 re-verify. The burn *read* path the ladder reports against (P6.5) is already live (E2.6).

---

## 4. Q4 — WHAT IS GENUINELY INNOVATIVE HERE VS TYPICAL VIBE/VIBE TOKENS

**The honest baseline:** most launchpad tokens are a ticker, a graduation meter, and a Telegram. No product, no retention surface, no verifiable activity — guild races are judged on *real* activity, which is precisely what most tokens cannot produce. Our facts pack gives us the product most of them lack: a live, free, walletless daily game with deterministic seeds and server-verified participation.

**The ONE defensible novelty: MIRROR — the token's own chart is playable terrain.** (H6, GROWTH §6; spec §8.) After graduation, $WICK's own OHLC feeds the same deterministic pipeline as ETHUSDT or TSLA: pumps become ramps, dumps become nightmares, and the graduation candle becomes a permanent legendary level — *"we climbed the mountain we made."* No other token on the pad can have this without our chart→terrain pipeline, and no other token's holders have a daily product reason to come look at their own position. It converts holding from a passive state into a **daily-relevant** one — the only hold argument that renews itself every single day without a single LAW 4 violation.

**Supporting moats (real, but not the headline):**
- **Documentary terrain** (H1): levels are real market history — 2020-03-12, 2021-05-19, 2022-11-09 — difficulty nobody would dare design, forever deepening for free.
- **The unbuyable scoreboard** (LAW 1) + W1/W5 anti-cheat: a credibility property judges, the platform, and the utility-track reviewers can *verify* — rare enough on this pad to be a differentiator by itself.
- **Curve-only pre-grad supply** (spec §2): no insider allocation exists to dump; every holder bought.

**Amplification (three moves):**
1. **Pre-register MIRROR factually, now** — one factual line in product copy and the Daily Report: "after graduation, $WICK's own chart becomes a playable level." A roadmap fact, not a profit promise. [SAFE] [PRE-GRAD] [DESIGN-ONLY] — risk: copy must pass the §8 sweep; owner sign-off on placement.
2. **Graduation-candle monument ceremony** — fold into the E6.1 runbook: the graduation day's candle is generated *that day* as the permanent legendary level; the community's first runs on it are the celebration content. [SAFE] [AT-GRAD] [DESIGN-ONLY] — risk: MIRROR weights stay at practice rates only (chair YELLOW-5).
3. **Post-grad, weekly "symbol weeks" / guild races on famous dates** — the guild (O-G) races a historic week's terrain; Candle Climber becomes *the venue where market history is played*, which deepens the utility-track case (1.5% pool — "eligible, nothing guaranteed"). [SAFE] [POST-GRAD] [DESIGN-ONLY] — risk: depends on O-G firing; guild races reward real activity, which we can actually demonstrate (ghosts, death data, verified runs).

**Honest negative:** "we are honest" is not a moat — buyers don't grade honesty, platforms do. MIRROR + verified skill-only activity is the moat; the laws exist to keep it credible.

---

## 5. Q5 — THE BUY BRIDGE: SHOULD THE PRODUCT LINK TO THE TOKEN PAGE?

**Verdict: YES — bridge the desire moments, never the whole game.** I adopt chair §7 verbatim as the placement contract (it survived cross-examination with the auditor and psychologist; I concur with every ruling on it):

| P | Placement | Envelope | Copy (verbatim, chair §7) | My tags |
|---|---|---|---|---|
| 1 | **Vault-denied moment** — death/grad panel when the run passed the peak wick but tier < 1,000; exit honored | YELLOW (owner sign-off + E3.4 re-read) | `THE VAULT OPENS FOR HOLDERS · 1,000 $WICK MINIMUM · [GET $WICK] · [NOT TODAY]` + subline: `$WICK trades on the vibe curve — testnet, no monetary value · the climb stays free, no wallet needed` | [GRAY] [PRE-GRAD] [BUILD-NOW] [OWNER-GATED] — risk: it is a denial state, not a reward moment; render post-run only, never mid-run, never modal |
| 2 | **/airdrop board** — endowment + holder-lane line | GREEN | `IF THE SNAPSHOT WERE TODAY, YOUR LEDGER SHOWS {N} WEIGHTS — LINK A WALLET TO BIND THEM · weights are built by playing, nothing guaranteed · holder lanes (vault, trails) come from holding → [GET $WICK · testnet] · free to play, no wallet needed` | [SAFE] [PRE-GRAD] [BUILD-NOW] — risk: the "holder lanes come from holding" phrasing must never invert into "holding builds weights" (that is D1 through the back door) |
| 3 | **Ready-screen meter/burn line** — live-read, fail-open, never hardcoded | GREEN | `GRADUATION {live}% · {live}/4.0 ETH · SUPPLY BURNED {live} $WICK → [GET $WICK · testnet · no monetary value] · free to play, no wallet needed` | [SAFE] [PRE-GRAD] [BUILD-NOW] — risk: meter and burn must render **together** — burn alone is churn-fed and can look healthy while the meter bleeds (§1.2) |
| 4 | **Death/grad panel footer** — one quiet line below the share CTA | GREEN (link-wallet half) / YELLOW (buy line) | `THIS RUN BUILDS AIRDROP WEIGHTS — LINK YOUR WALLET TO COUNT IT` → after connect: `$WICK trades on the vibe curve — testnet, no monetary value · free to play, no wallet needed → [GET $WICK]` | GREEN half [SAFE]; buy half [GRAY] [OWNER-GATED] — risk: adjacency to the share CTA; never enters card image or share text (D13) |
| 5 | **Wallet-chip empty/expanded state** — post-connect, 0 balance | GREEN | `You hold 0 $WICK · holder tiers & vault start at 1,000 · [GET $WICK · testnet] · the game stays free, no wallet needed` | [SAFE] [PRE-GRAD] [BUILD-NOW] — risk: chip must stay invisible for walletless visitors (E2.1 zero-friction design) |
| — | ~~Leaderboard tier-badge tooltips~~ · ~~$WICK line in Death Card share text~~ | REJECTED (chair D12/D13) | — | [FORBIDDEN] — scoreboard-adjacency and share-content contamination kill the trust moat |

**Standing rules I reaffirm:** outbound-only (the buy happens on the pad, by design); passive-informational; no modals/interstitials/countdowns; **max two buy-adjacent surfaces render per session**; every bridge line paired with the standing free-play line; testnet stated plainly, every time.

**What it must NEVER do (consolidated never-list):**
1. **No nagging** — no interstitials, no modals, no auto-open, no urgency clocks, no "last chance"; the two-per-session cap is hard; exit paths ("NOT TODAY") are honored, never guilt-tripped.
2. **No profit hints** — no price talk, no "get in before graduation," no yield numbers, no upside framing of any kind; the 75% tax share is narrated as the mechanism it is, never as income (LAW 4).
3. **Never in score flows** — nothing on the leaderboard, in grant messages, or inside Death Card content/share text; nothing adjacent to PLAY/retry.
4. **Never before the first run** — no pre-game buy walls or wallet prompts; the first-run funnel stays zero-friction (E8, LAW 1.2).
5. **Never imply conversion** — no copy may suggest holding changes score, rank, access, or weights (D1/D22; the /airdrop line is worded so it cannot invert).
6. **No invented numbers** — surfaces live-read the chain or fail open; docs quote only the reconciled evidence trail (and the F11 burn-figure reconciliation at the next E0.4 run must land before any doc quotes 254,293 as current).
7. **No dark exit** — closing the bridge returns exactly the game state you left.

**Instrumentation is not optional:** every placement fires `/api/go/{placement}` + aggregate counters (E5.5/chair D20). Without it we stay exactly as blind as §1.4 describes — shipping the bridge without counters is shipping a door nobody can count who walks through.

---

## 6. RANKED PROPOSALS (ECONOMIST SEAT, CROSS-CUTTING)

| # | Proposal | Tags | One-line risk |
|---|---|---|---|
| 1 | **Meter-in-product + GREEN bridge trio shipped as one unit with E5.5 attribution** (chair D3/D8/D11/B4/B5/B6) | [SAFE] [PRE-GRAD] [BUILD-NOW] (owner copy nod pending) | Without counters the placements are unevaluable — B5 and B6 must ship together or the §1.4 blind-spot persists |
| 2 | **Persistent holder cosmetic ladder v1** — trails persist while tier holds; chip shows the 1k→100k rungs pre-holding; ember badge on card render (chair D5) | [SAFE] [PRE-GRAD] [BUILD-NOW] [OWNER-GATED optics] | Whale-gold badge on cards risks whale-worship optics — owner sign-off; cosmetic layer only, never the leaderboard |
| 3 | **Weekly airdrop-board preview + endowment line** (chair D7/D8) | [SAFE] [PRE-GRAD] [BUILD-NOW] | "Snapshot NOT final · nothing guaranteed" framing must never slip, or the preview becomes a promise |
| 4 | **Metric-integrity fix pack:** exclude 0xdEaD from tier reads + future holder counts (F1); render meter and burn together on the ready line; reconcile burn figures at next E0.4 (chair B13) | [SAFE] [PRE-GRAD] [BUILD-NOW] | Owned by the auditor seat — my flag, their verdict; trivial diff, large honesty payoff |
| 5 | **MIRROR pre-registration line + graduation-candle monument in the E6.1 runbook** (§4 moves 1–2) | [SAFE] [PRE-GRAD copy] / [AT-GRAD event] [DESIGN-ONLY] | MIRROR weights stay at practice rates only (chair YELLOW-5); roadmap line passes §8 sweep before use |
| 6 | **Post-grad sink ladder to implementation contracts** (R1–R8, chair B16 stage; behind `graduated` flag per E6.2) | [SAFE] (R4/R7: [GRAY] pending §8.3 review) [POST-GRAD] [DESIGN-ONLY] | Sizing rule (§3.1) must bind: sink capacity ≤ measured faucet reality, reviewed weekly — an oversized ladder is decoration |
| 7 | **LAW 3.2 amendment option (holder weight bonus)** — owner-gateable only | [FORBIDDEN-until-amended] [PRE-GRAD] [DESIGN-ONLY] | Council default = rejection (D1); even amended it partially capital-weights the airdrop and spends the players-first story; my dissent stays on record |

**Falsifiers (what would prove this design wrong):** meter flat for 2+ weeks *with* the bridge live → the placements or copy are dead (fix placement set, one change per week); connect rate < 2% after week 4 (chair KPI-4 alarm) → the identity layer is failing, not demand; `Peak→buy-24h ≈ 0` with meaningful peak-wick passers → the vault reward is too weak to buy for — *that* is the trigger to revisit D1 through a dated amendment, not before.

---

## TL;DR

1. Pre-grad, the docs are honest about the demand gap; the product isn't yet — the climb is invisible in-game and the only live economy line (burn) is churn-fed, not demand-fed.
2. Exactly ONE shipped object requires buying: the double-gated vault (+1/day vs streak 10 — the game teaches "play beats hold"). That cannot fill 3.84 ETH.
3. What actually moves the meter: unattributed net residue (~+0.058 ETH in the one measured window) on top of real churn (≤ ~254M WICK gross, DERIVED). Zero conversion instrumentation exists — we are blind by construction.
4. Graded buy+hold reasons: 0 A's. Vault B; transient trails C+; tax share C; burn C−; weights D (drives linking, not buying — by law); speculation D (unvoiceable under LAW 4).
5. Audit catch: 0xdEaD — our burn address — is the largest balance-read "holder" (whale tier) and the E2.4 whale E2E ran as 0xdEaD. Exclude it from tier/holder metrics.
6. Post-grad sink ladder = 8 rungs (shop rotation, forge, era passes, tournaments, guild chest, season pass, event entry, route conveniences), ALL [DESIGN-ONLY] behind the `graduated` flag; the cycle is the refill loop (spend → tier drops → top-up), guarded against engineered drop-below-tier dark patterns.
7. The one defensible novelty: MIRROR — the token's own chart as playable terrain; graduation candle as permanent monument. Pre-register it factually now.
8. Buy bridge: YES, chair §7 verbatim — 3 GREEN now, 2 YELLOW owner-gated, 2 placements stay dead; max 2 surfaces/session; counters mandatory.
9. Standing council finding, unchanged: reach (E5, owner-frozen) — not mechanism — is the binding constraint. F1 is still the owner's key.

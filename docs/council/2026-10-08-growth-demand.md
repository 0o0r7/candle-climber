# COUNCIL REPORT — GROWTH & DEMAND STRATEGIST (Task 2-c, council round 2)

> Written 2026-10-08 · Seat: Growth & Demand · Round 2 (builds on Task 73-c memo +
> CHAIR-VERDICT.md, which remain the adopted contract; nothing here contradicts them —
> where round 1 ruled, this report cites the D-number and inherits the envelope).
> Precedence: `docs/ECONOMY-LAWS.md` (supreme) ← pack §8 language red lines ←
> `WICK-ECONOMY-SPEC.md` ← `ECONOMY-COUNCIL/CHAIR-VERDICT.md` ← this report.
> RESEARCH ONLY — wires no code, publishes nothing, decides no owner-only action.
> Number labels: **[V]** verified (source named) · **[A]** assumption · **[E]** extrapolation.
> Envelope mapping used here: GREEN→[SAFE] · YELLOW→[GRAY] · RED→[FORBIDDEN].

Verified state I inherit [V]: live at candle-climber.vercel.app, free, walletless ·
$WICK on vibe/vibe testnet, CURVE_TRADING, not graduated, transfers locked · meter
**0.1574 / 4.0 ETH = 3.94%** (E0.4, 2026-10-07 20:53 UTC), remaining **3.8426 ETH** ·
burned **254,293 WICK** · tax 2% = 75/20/5 · wallet cap 2% of supply · hooks LIVE:
streak weights (cap 10), route prediction (1/day), archive practice (0.5×2/day), WICK
VAULT (peak-wick + ≥1,000 WICK), /airdrop Merkle rehearsal, read-only /api/weights ·
**ZERO $WICK mentions in the 439-msg Discord corpus** (Oct 3–6) · guild race = top-100
for 1,000 vibe-viber NFTs, judged on REAL member activity · showcase post + guild card +
wiredwisely reply ALL COPY-READY, publishing FROZEN by owner · E5.5 attribution not yet
built → the funnel below the top is currently unmeasurable.

---

## 1. FUNNEL AUDIT — honest numbers

### 1.1 The funnel and what we can actually see today

| Stage | Instrument | Current evidence | Verdict |
|---|---|---|---|
| **Stranger → Visitor** | referral buckets `?r=` (NOT BUILT — E5.5) | 0 organic mentions in 439-msg corpus [V]; distribution frozen [V] | **100% leak — THE biggest leak** |
| Visitor → Player | SimpleAnalytics + verified-run identities (E4.1 open) | product live, zero-friction, walletless [V]; no visitor data yet | presumed healthy [A] — unproven |
| Player → Daily player | weights ledger streaks (LIVE [V]) | D1/D7 undefined (E4.2 open) | presumed healthy [A] — unproven |
| Daily → Wallet-connected | WalletChip (LIVE [V], E2.1) | connect rate unmeasured | [A] target ≥5% |
| Connected → Holder | bridge (NOT BUILT — F7/B6) | **vault-denied moment dead-ends today** [V]; no GET-$WICK path exists anywhere in the product | **2nd biggest leak** |
| (meta) Measurability | E5.5 /api/go + ?r buckets (D20 approved, unbuilt) | we could be leaking at ANY step below the top and not know it | fix before firing F1 |

**Single biggest leak: stranger → visitor.** It is not a conversion problem, it is an
awareness vacuum — the best converting page in the world converts 0 strangers it never
receives. Corollary: it is also the *cheapest* leak to fix (Play 1, §6 — ~20 minutes of
owner time on copy that is already written). Second: connected → holder — desire moments
exist (a player passes the peak wick and wants the vault) but have no exit.

### 1.2 Scenario math (extends E1.3; only the meter size, caps, and fee rails are [V])

Fixed: meter = 4.0 ETH **net** (buys − sells); remaining 3.8426 ETH [V]; 2% wallet cap ⇒
breadth mandatory [V]. Buyer counts assume each month's cohort is incremental and
retention holds [A]; "holders" ≈ buyers pre-grad because transfers are locked (a buyer
holds until they sell back to the curve) [E].

| Scenario | DAU | Buy rate [A] | **Buyers/mo** | Avg net buy/mo [A] | Meter fill/mo | Meter Δ | **Months to fill remaining 3.8426 ETH** | Buyers at graduation [E] |
|---|---|---|---|---|---|---|---|---|
| Cold start | 10 | 20% (2) | **2** | 0.01 ETH | 0.02 ETH | **+0.5 pp/mo** | ~192 mo — never | ~384 (theoretical) |
| Working hook | 50 | 30% (15) | **15** | 0.02 ETH | 0.30 ETH | **+7.5 pp/mo** | ~12.8 mo | ~190 |
| Growth loop | 200 | 40% (80) | **80** | 0.03 ETH | 2.40 ETH | **+60 pp/mo** | **~1.6 mo** | ~128 |

Reading, no poetry: **10 DAU graduates nothing, ever.** 50 DAU is a quarter-year grind
that only works if retention holds. 200 DAU graduates in ~7 weeks and produces a
guild-sized holder base (~128 buyers). The difference between the scenarios is not
mechanism — the mechanisms are live [V] — it is **people per day**, i.e. distribution.

Observed pace for honesty's sake: +0.058 ETH in ~1 day (2.49%→3.94% on Oct 7) [E,
two-point sample] → IF that were a rate, ~66 days to full. It is not proven to be a
rate: it happened with zero organic visibility [V], so it is curve-native/one-off
buying, and sell-days are unmodeled. Treat ~66 days as the optimistic floor of "do
nothing more", not a plan.

What the scenarios imply about holders: at 2 buyers/mo there is no community to see;
at 15/mo the guild channel gets its first real content engine; at 80/mo the guild
race entry (§4) has a membership to show. **Breadth is the only lever the 2% wallet
cap leaves us, and every scenario's binding input is DAU.**

---

## 2. BUY-BRIDGE DESIGN — the owner's question (a): where, what copy, what rules

**Answer: YES — bridge the desire moments, as measured attribution, never as a
billboard** (chair verdict Q1/D3–D11 stands). Outbound-only: the buy happens on the pad
token page (`testnet.vibevibe.fun/token/0xe2ce…216c`); the product never hosts a swap.

Standing rules every placement inherits (never-break set):
1. Outbound link only — no in-product purchase flow, no price charts in-game.
2. Never blocks, interrupts, or precedes play: no modals, no interstitials, no
   countdowns, no urgency/FOMO, nothing in the retry loop or score flow.
3. LAW 4 language: testnet stated plainly, "weights" never "earn", never
   "guaranteed", never a promised airdrop (platform scam alert [V]), no profit talk.
4. Every buy-adjacent line is paired with the standing free-play line.
5. **Max two buy-adjacent surfaces render per session** (Psychologist cap, adopted).
6. Link-wallet CTAs are connect-flow events, not bridge events (GREEN, D9).
7. Never inside Death Card content or share text (D13 RED); never on leaderboard rows
   (D12 RED).

### 2.1 Placement map (emotional moment → verbatim copy → rule)

| P | Placement | Emotional moment | Copy (verbatim, chair §7) | Envelope | E5.5 event |
|---|---|---|---|---|---|
| **1** | **Vault-denied block** on death/grad panel — run passed the peak wick, tier < 1,000 | "I *earned* the peak and the door didn't open — the cause is unambiguous, desire is at its daily maximum" | `THE VAULT OPENS FOR HOLDERS · 1,000 $WICK MINIMUM · [GET $WICK] · [NOT TODAY]` / subline: `$WICK trades on the vibe curve — testnet, no monetary value · the climb stays free, no wallet needed` | **[GRAY]** D4 — owner sign-off + compliance re-read (Auditor YELLOW-4) | `go_vault_denied` |
| **2** | **/airdrop endowment line** | "my play already built {N} weights — I don't want them to count for nothing" (endowment) | `IF THE SNAPSHOT WERE TODAY, YOUR LEDGER SHOWS {N} WEIGHTS — LINK A WALLET TO BIND THEM · weights are built by playing, nothing guaranteed · holder lanes (vault, trails) come from holding → [GET $WICK · testnet] · free to play, no wallet needed` | **[SAFE]** D8 | `go_airdrop` |
| **3** | **Ready-screen meter/burn line** (ambient) | "this mountain is alive, someone is already climbing it" — collective progress, honest | `GRADUATION {live}% · {live}/4.0 ETH · SUPPLY BURNED {live} $WICK → [GET $WICK · testnet · no monetary value] · free to play, no wallet needed` | **[SAFE]** D3 — live-read fail-open, **never hardcoded**; burn-figure reconciliation (B13) first | `go_ready_meter` |
| **4** | **Death/grad panel footer** (below share CTA) | pride + share impulse right after a good death | GREEN half: `THIS RUN BUILDS AIRDROP WEIGHTS — LINK YOUR WALLET TO COUNT IT` → after connect append: `$WICK trades on the vibe curve — testnet · free to play, no wallet needed → [GET $WICK]` | **[SAFE]** link-wallet / **[GRAY]** buy line (D10) | `wallet_link_death_panel` / `go_death_footer` |
| **5** | **Wallet-chip empty state** (post-connect, 0 balance) | "I hold 0 — what am I missing?" — pre-qualified by the very act of connecting | `You hold 0 $WICK · holder tiers & vault start at 1,000 · [GET $WICK · testnet] · the game stays free, no wallet needed` | **[SAFE]** D11 | `go_wallet_chip` |
| — | ~~Leaderboard tier-badge tooltips~~ | — | — | **[FORBIDDEN]** D12 | — |
| — | ~~$WICK line in Death Card share text~~ | — | — | **[FORBIDDEN]** D13 | — |

### 2.2 The two placements with the best desire-to-action ratio

1. **Vault-denied block (P1)** — highest ratio in the product: intent is maximal (the
   player just passed the peak wick and WANTS the vault), the cause is unambiguous
   (balance < 1,000), and the exit is honored one tap away ("NOT TODAY"). It converts
   earned desire, not ambient attention. **[GRAY]** — conditional on owner approving
   the YELLOW pair (Owner Decision Point 2 of the verdict).
2. **Wallet-chip empty state (P5)** — best always-on [SAFE] ratio: the audience
   self-qualified by connecting, zero intrusion for everyone else, honest by
   construction. Runner-up: **/airdrop endowment (P2)** — smallest traffic, most
   token-curious visitors; it substitutes for P1 if the owner refuses the YELLOW pair.

### 2.3 Referral / attribution mechanics (E5.5, D20 — approved, build-ready)

- **Outbound (leading indicator):** every bridge link = `/api/go/{placement}` → 302 to
  the token page with UTM appended; increments aggregate Mongo counter
  `{placement, day, count}` — durable day one (E0.3 closed [V]). No user-level data,
  no cookies, fail-open. Denominators per placement are knowable client-side.
- **Inbound (referral visits):** `?r=` buckets — `dc-YYYYMMDD` (Death Card shares,
  **date-coded so terrain quality becomes a measurable growth variable**), `x`, `guild`,
  `gh`, `direct`. First-touch-wins → stored in the **board-metadata attribution field**
  of the identity's first weights event; aggregate-only reporting via `/api/weights`
  meta. Walletless visitors = anonymous bucket hits only.
- **Death Card share CTA (the loop-opener):** clean v1 share text — score + cause +
  "come climb today's terrain" + `?r=dc-YYYYMMDD` link. No $WICK line (D13). v2 share-
  text variant is FORBIDDEN as drafted; A/B of *card visuals* (not share text) is the
  lawful future test if share volume ever supports reading it.
- **Outcome truth = the chain:** curve buys/day + net meter delta via the E0.4 snapshot
  ritual. Clicks are leading indicators; correlation across days, never causation.

---

## 3. PUBLISHING SEQUENCE — designed for the day the freeze lifts

Trigger (verbatim concept): owner declares economy+debug complete and says "E5
unfrozen" — nothing fires before that. **One sequencing refinement vs round 1:** the
bridge GREEN trio + E5.5 attribution (F7) must deploy **before** F1, so the very first
visitor is counted (Play 3, §6). Everything below is owner-voice; agent pre-work is
unfrozen and listed after the table.

| When | Step | Must contain (to convert) | Log |
|---|---|---|---|
| **T−1 day** (agent) | Deploy F7: bridge trio + `/api/go` + `?r` buckets; LAW4 lint (B2); final copy sweep | — | deploy commit, lint result |
| **Day 0** | **F1 — X showcase post** (copy ready, Task 67; media from kit) | game link with `?r=x` · one-line identity ("daily skill platformer on real market candles — one symbol a day, worldwide") · proof-of-quality line in the founder's dialect (shipped, QA'd by 450+ headless rounds, keeps shipping) · `$WICK` + `@vibevibefun` ONLY, no hashtags · disclaimer verbatim | post link, 24h/48h impressions + engagement, `?r=x` sessions, first verified-run identities, curve net delta (pad API) |
| **Day 0** | **F2 — reply to zeus_47's unanswered browser-game ask** (#builder-help) | helpful-first ("we built exactly that"), game link second, zero shill — the only pre-existing demand signal in the corpus [V] | thread replies, inbound how-questions |
| **Day 1** | **F3 — guild "Candle Climbers" creation + card post** (after F1 lands — visibility first, intel §7.2) | guild identity line · first-activity rule (1 run/day + Death Card in channel) · join path `?r=guild` · honest one-liner ("free, no wallet, one climb a day") | guild registered, member count, wiredwisely engagement, `?r=guild` sessions |
| **Day 1–2** | **F4 — wiredwisely reply/DM** (BD whose job is finding builders [V]) | the builder STORY (shipped + QA + daily cadence + guild), not a shill; framed as raw material for his upcoming guild video | reply/share/RT, DM response |
| **Day 2–7** | **Reply-watch + peer loop** (48h cadence) | honest play + comments on 0xMslm / 0xHaileyy / brainstormity timelines — zero fake engagement | mentions, ally responses |
| **Week 2+** | **F5 — utility-track submission** (1.5% pool) after E0.5 memo confirms a path | evidence bundle: live MVP, QA trail, playable flow; "eligible — nothing guaranteed" language | submission logged (E5.4) |
| **Week 2+** | **F6 — Daily Report cadence** (H4) | ONLY verified aggregates (climbers, deaths, top height, tomorrow's symbol + live meter line) · link `?r=x` · cliffhanger by construction | followers trend, link CTR, referral bucket mix |
| **Weekly** | **E0.4 snapshot + E4.3 review** (15 min, ONE change max) | KPI deltas → decide the single economy change | meter ETH/day, connect rate, share rate, D7, buy conversion, referral share, per-placement CTR |

Agent pre-work, publishable by nobody (B19, unfrozen): F2 reply text · guild 7-day
first-activity calendar + Death Card post templates · wiredwisely one-pager · Daily
Report card template spec · reply-watch runbook (zeus_47 thread, wiredwisely, adramelekh,
35-leader cohort) · embed-card spec. Rule: **48-hour reply window after F1** — attention
decays faster than a frozen asset can be re-fired.

---

## 4. GUILD "CANDLE CLIMBERS" — the real-activity loop

What vibe judges [V]: real member activity — "trading, creating tokens, bringing real
users, onboarding projects and generating activity" (alena's Space alpha); "early
activity is what counts" (Taco). Fake-member guilds lose by design.

**The loop (daily → weekly → race):**
1. **Daily:** every member runs today's classic level (1 verified run) and posts their
   Death Card in the guild channel. Server-verified runs (W1 HMAC + W5) mean our
   guild's activity is **cryptographically provable** — the only guild on the pad whose
   activity log is auditable. That is the visible signal, and it is differentiated:
   other guilds post chat noise; ours posts verifiable climbs.
2. **Weekly:** one honest thread in #share-your-content (reuse the Daily Report card) +
   guild-race position check vs the 35-leader cohort [V].
3. **Race:** top-100 target for the 1,000 vibe-viber NFT list [V — "eligible, nothing
   guaranteed" language always]. Target ≥5 external members by week 4 [A].

**How it loops back to the token — honestly, four links only:**
- **Identity:** member Death Cards carry ember/gold trail badges when they hold
  (LAW 2.1 cosmetics) — holders are *visible*, never advantaged.
- **Transparency:** the guild channel pins the live meter/burn line; the Daily Report
  carries it. The climb of the guild and the climb of the meter are the same story.
- **Path:** game → weights → /airdrop endowment → "holder lanes (vault, trails) come
  from holding" — never the reverse implication (D8).
- **Volume:** each member's own *optional* curve buy is REAL trading activity the pad
  credits to both game and guild (the $FOLK template [V]). Member's choice, never
  coordinated, never instructed, never paid.

**[FORBIDDEN] and said out loud:** paying members to join or be active (Taco's
"join 404 and I'll send you 0.1 testnet ETH" is NOT our playbook — manufactured
activity + platform anti-abuse disqualifier [V]); coordinating buys (wash-adjacent);
member-count farming (the judged metric is activity, not count).

Tags: guild creation + wiredwisely reply **[SAFE] [PRE-GRAD] [BUILD-NOW] [OWNER-ONLY]**
(risk: unbroken daily commitment is the single point of failure — a silent guild reads
as abandonment, which is the founder's exact public complaint; the ritual pack must make
the daily cost ≤10 min). Ritual pack + calendar + templates **[SAFE] [PRE-GRAD]
[BUILD-NOW] [AGENT-DOABLE]**.

---

## 5. TOP-5 ECOSYSTEM LEADERBOARD — reality check

**What the boards actually rank** (from intel docs):
- **Guild race:** real member activity (trading, creating, bringing real users,
  onboarding, activity) [V — alena/Taco/wiredwisely]. Top-100 → 1,000 vibe-viber NFTs.
- **$FOLK / Vibe Arena's leaderboard:** play + volume — "purchase the Folk token here.
  Generate volume for both the game and the guild" [V]. That is the ecosystem's current
  economy in one line, and exactly the behavior our LAWS refuse to fake.
- **Pad token boards:** trade volume / net meter; graduations are the celebrated events
  [V — Ay.go's Vibeculator post]. **No official "top-5 games" board exists** — games
  mindshare is a judgment, not a leaderboard.

| Referent of "top-5" | Verdict | Why |
|---|---|---|
| Pad-wide token/volume top-5 | **NO — not this cycle** | Needs the growth-loop scenario (200 DAU → 2.4 ETH/mo [E1.3, A]) sustained; current evidence = cold-start DAU [A]; gap is 1–2 orders of magnitude of daily players [E] |
| Guild-race top-100 | **YES — plausible, possibly fast** [A] | Race young [V]; metric = real activity [V], which our verified-run factory produces natively; requirement = guild exists + unbroken ritual |
| Games mindshare top-5 | **POSSIBLE within weeks** [A] | Known game builders ≈ 4 [V]; 2 showcase repos already GitHub-404 [V] — persistence is the scarce asset and we are structurally the stickiest (QA trail, daily levels, shipping cadence) |

**Honest path for the owner's own account:** his top-5 is a **content/leadership
top-5, not a volume top-5**. The judged criteria he can win — bringing real users,
onboarding projects, generating activity — are exactly the showcase post, the guild
ritual, the wiredwisely feed, and the Daily Report. His own buys: legal and real, but
one wallet (2% cap) moves the meter linearly and stops; owner ETH is skin-in-the-game,
not a strategy. **Self-trading/wash patterns are an explicit platform disqualifier [V]**
— the owner's account must never look like a volume farm.

**What the PRODUCT contributes instead:** volume from many small players. At the
growth-loop scenario the players add 2.4 ETH/mo [E1.3] — an order of magnitude beyond
any realistic owner contribution — and every retained player (streak/vault/prediction)
is a *repeat* demand unit. The owner's ETH cannot compound; the product's breadth does.

---

## 6. THE THREE DEMAND PLAYS — maximum meter movement per unit effort ($0 budget, scarce owner time)

| # | Play | Effort | Why it wins | Tags | One-line risk |
|---|---|---|---|---|---|
| **1** | **Fire F1+F2: showcase post + zeus_47 reply** — the only top-of-funnel asset in existence; every other play keys off it | ~20 min, one-time | Creates the visitors every other conversion depends on; the corpus proves demand exists (unanswered browser-game ask [V]) and zero competition has our niche [V] | **[SAFE] [PRE-GRAD] [BUILD-NOW] [OWNER-ONLY]** | 48h attention decay — reply-watch must be staged before firing |
| **2** | **Create the guild + run the 1-run/day + Death Card ritual** — enters the real-activity race and builds the persistent on-platform surface | ~10 min/day | Converts on-platform attention into a *permanent* visible signal (verified runs = provable activity), seeds the first-buyer cohort, and is the exact metric vibe judges [V] | **[SAFE] [PRE-GRAD] [BUILD-NOW] [OWNER-ONLY]** (agent preps pack) | unbroken daily commitment — one silent week reads as abandonment |
| **3** | **Deploy the GREEN bridge trio + E5.5 attribution** (wallet-chip line, /airdrop endowment, meter line + `/api/go` + `?r` buckets) | 0 min owner (one copy nod) | Without it, Plays 1–2 produce traffic that is **uncounted and unconverted** — desire dead-ends and the weekly review flies blind; with it, every future visitor is measurable and given an honest exit | **[SAFE] [PRE-GRAD] [BUILD-NOW] [AGENT-DOABLE]** (after owner copy sign-off) | over-prominent bridge sours the free-play feel — session cap (2) + one-change-per-week rule contain it |

Sequencing law: **3 → 1 → 2** (measure, then broadcast, then organize). The YELLOW pair
(vault-denied P1 + death-footer buy line) is the conditional upgrade to Play 3 —
**[GRAY] [PRE-GRAD] [BUILD-NOW] [AGENT-DOABLE after owner sign-off + E3.4 re-read]** —
and carries the single best desire-to-action moment in the product (§2.2).

*(For the final-message top-5: #4 = F4 wiredwisely feed [SAFE][PRE-GRAD][BUILD-NOW]
[OWNER-ONLY] — 10 min, amplification into the BD funnel whose pinned post says his job
is finding builders [V]; #5 = F6 Daily Report cadence [SAFE][PRE-GRAD][BUILD-NOW]
[OWNER-ONLY posting / AGENT-DOABLE rendering] — the compounding daily discovery surface
we own, ~15 min/day.)*

---

## 7. ASSUMPTIONS REGISTER & RED LINES (round-2 additions only)

**Verified [V]:** everything in the state block above; zeus_47 ask; Taco recruitment
quote; alena guild-algorithm alpha; wiredwisely BD role + guild video incoming;
FOX-ARENA/VIBE-MILITIA GitHub 404; Viberquest dungeon promo incoming; E0.3–E2.6 rails
live; assets frozen (E5 + owner directive).
**Assumptions [A]:** all conversion rates (connect 5%, buy 30%, D7 15%, share 3%);
DAU scenario values + avg buy sizes (E1.3's own A-labeled rows); "hundreds of visitors
suffice"; ≥5 guild members by week 4; games-mindshare count ≈ 4; top-100 plausible /
top-5-games possible judgments; pad formula details; UTM visibility in pad analytics.
**Extrapolations [E]:** +0.058 ETH/day → ~66 days (two-point sample); 1–2 orders-of-
magnitude DAU gap; buyers-at-graduation counts.
**Red lines restated (inherit chair §9 honesty box):** no hold-wall (LAW 1.2); no
balance term in any weights formula (LAW 3.2 — D1 rejection stands); testnet stated
plainly; "builds weights" never "earn/guaranteed"; never promise an airdrop; no
gambling texture; no buy links in score flows, card content, or share text; no invented
numbers; no bought engagement. Growth copy never implies holdings touch the scoreboard.

---

## TL;DR

- Funnel verdict: the mechanisms are live, the funnel is dark — 0 organic mentions [V];
  the biggest leak is stranger→visitor (100%), second is connected→holder (no bridge).
- Math: 10 DAU graduates never · 50 DAU ≈ 13 months · 200 DAU ≈ 7 weeks; breadth is the
  only lever the 2% wallet cap allows; the observed +0.058 ETH/day [E] has no visibility
  behind it and will not compound alone.
- Bridge: YES — 5 lawful placements (3 SAFE, 2 GRAY), outbound-only, measured, session-
  capped; best desire-to-action pair = vault-denied block (GRAY, owner-gated) + wallet-
  chip empty state (SAFE); card/share text stays clean forever (D13).
- Attribution (E5.5): /api/go/{placement} counters + date-coded `?r=dc-YYYYMMDD`
  buckets + board-metadata first-touch — deploy BEFORE the showcase post so visitor #1
  is counted.
- Publishing sequence for unfreeze day: bridge → F1 showcase + zeus_47 reply (Day 0) →
  guild + wiredwisely (Day 1–2) → utility submission + Daily Report (Week 2+); log
  impressions, ?r buckets, first-run identities, connect rate, curve delta.
- Guild: 1 verified run/day + Death Card = cryptographically provable activity — the
  one signal vibe's real-activity algorithm rewards; no paid joins, no coordinated buys.
- Top-5 honestly: pad-volume top-5 NO this cycle; guild top-100 plausible; games
  mindshare top-5 winnable. Owner's account wins a leadership top-5, not a volume one —
  product breadth, not owner ETH, is what compounds.
- Three plays, ranked: (1) fire F1+F2, (2) guild + daily ritual, (3) bridge trio +
  E5.5. Sequence: 3 → 1 → 2.

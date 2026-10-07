# MEMO — TOKEN ECONOMIST (Economy Council, Task 73-a)

> Written 2026-10-08 · Token economist seat · Research/design only — this memo wires no
> code and changes no numbers. Precedence: `docs/ECONOMY-LAWS.md` (supreme) and pack §8
> red lines bind every sentence below; where I propose anything outside the laws it is
> tagged **[NEEDS-LAW-AMENDMENT]** and requires a dated note (LAW 5.3) + owner sign-off.
> Inputs read, in order: ECONOMY-LAWS · WICK-ECONOMY-SPEC · ECONOMY-CHECKLIST ·
> GROWTH-AND-HOOKS-STRATEGY · WICK-LAUNCH-FORM-PACK (§1–§8) · src/lib/weights.ts ·
> src/app/api/vault/route.ts. Verified constants only; assumptions labeled as such.

## Role & mandate

Design the token's financial cycle: what makes someone **buy first, buy more, and keep
holding** $WICK — pre-graduation (transfers locked, curve-only), at graduation, and
post-graduation — without ever breaking LAW 1 (rank ≠ recognition), LAW 2 (cosmetics /
routes / archive + event entry only), LAW 3 (weights = participation, "builds weights"
language), LAW 4 (honesty), and without pay-to-win. Answer the owner's four questions
with explicit verdicts. Live state assumed: CURVE_TRADING · meter 0.1574/4.0 ETH = 3.94%
(2026-10-07) · burned 254,293 WICK · awareness ≈ 0 (zero organic mentions in a
439-message Discord corpus, Oct 3–6) · all E2 rails live and prod-verified.

---

## Verdicts (owner's four questions)

**Q1 — Bridge the product to the token's buy page? YES — bridge the desire moments, not the whole game.**
Place the link in exactly three surfaces: the vault-locked panel, the wallet-chip
expanded state, and the ready-screen meter/burn line. Wording factual, testnet stated,
no pressure: e.g. *"Open the vault: hold 1,000 $WICK. $WICK trades on the vibe curve —
testnet, no monetary value →"* linking the token page. Never on the Death Card share
image, never as an interstitial. [LAW-OK] — a link gates nothing (LAW 1.2 untouched).

**Q2 — Should playing require holding $WICK? NO. Keep LAW 1.2 forever — this is not sentimental, it is the math.**
The 2% wallet cap means only **breadth** moves the meter; a hold-to-play wall shrinks
DAU (our only real funnel), kills the zero-friction first-run (E8), and turns
"unbuyable scoreboard" — our single durable credibility asset and utility-track case —
into marketing fiction. Charging base access would make every metric worse, including
the meter. Holders-only modes stay lawful only as cosmetic/practice surfaces (LAW 2.4).

**Q3 — What NEED drives buy / buy-more / hold? Belonging, identity, completion — the product already builds the first, and has not yet built the other two.**
First buy: the **locked vault** is a visible, named, skill-gated object on today's
mountain — "unfinished business" plus "I'm a holder-climber." The product creates this
TODAY; the bridge to act on it is missing. Buy-more: **collection + seasonal identity**
(new trails/frames/tiers to complete) — must be added. Hold: **hold-to-wear cosmetics**,
the factual 75% tax share, snapshot cadence, and MIRROR (your own money's chart is the
daily level) — mostly to be added; all lawful inside LAW 2.

**Q4 — Audit of the financial cycle: rails are sound; the demand engine has no bridge, no ladder, and no calendar. What exists is plumbing, not yet a cycle.**
Sound: honesty architecture (laws + language), fee rails (75/20/5 = hold-yield + burn),
curve-only supply pre-grad (every holder is a genuine buyer), shipped rails (weights,
prediction, vault, Merkle rehearsal, burn feed). Weak: no in-product path to the buy
page; holder value is a trickle (two day-expiring trails, one rung at 1k, one at 100k);
the meter is invisible inside the product; the weights system drives wallet **linking**,
not **buying** (the biggest FOMO asset pulls zero buys); no sink exists on graduation day
itself. Upgraded Cycle v2 is in §4 below. Reach, not mechanism, is the binding
constraint — E5 is frozen owner-only and load-bearing.

---

## 1. Honest audit — what actually drives BUY pressure today

Blunt inventory. Pre-grad, transfers are locked: the only actions are buy-from-curve or
don't. What in the product makes someone buy?

| Driver | Exists? | Honest strength |
|---|---|---|
| WICK Vault (pass peak wick + hold ≥1,000 → +1 weight, one-day trail) | yes | The ONLY mechanic that strictly requires buying. But it's double-gated: you must (a) be skilled enough to pass the peak-wick candle and (b) hold. Most players never reach the peak, so the buy motive fires for a minority. And its weight reward (+1) is small next to a streak's 10 — the game itself teaches "playing beats holding." |
| Holder cosmetic tiers (ember 1k / gold 100k whale) | partial | Two trails, granted only via a vault open, expiring after one day. Nothing persistent, nothing collectible, no tier ladder visible before you're already a holder. 1,000 WICK at the current curve state is a dust-priced commitment — the friction is flow and identity, not price. |
| Tax-share narrative (75% of the 2% trade tax to holders) | narrative only | True and verifiable on-chain, but at current volume the yield is rhetorically real, numerically trivial. It is a hold argument, not a first-buy argument, and LAW 4 forbids dressing it up as income. |
| Snapshot eligibility (airdrop weights) | exists — but drives LINKING, not BUYING | Weights accrue to the identity; a wallet link is one click; holding adds nothing to weights. The strongest FOMO asset we own currently gives zero reason to buy a single WICK. |
| Buy bridge from product → token page | **missing** | At the moment of maximum desire (the locked vault panel), the product leads nowhere. Game and token page are islands. |
| Meter visibility in-product | **missing** | The 4-ETH collective goal — our best co-op narrative — lives on an external token page. The ready screen shows the burn line but not the climb. |

Conclusion: today's buy engine is **one double-gated vault with a one-day cosmetic and
+1 weight**. That is not enough to fill 3.84 remaining ETH — the spec's own funnel math
(E1.3) says breadth × daily-return is the only lever, and nothing currently converts a
returned player into a holder. The fixes are placement, persistence, and a calendar —
plus one guarded weights amendment.

---

## 2. Proposals — the demand engine

Every proposal: phase tag, law tag, owner-decision tag where numbers/approval are needed.

### 2.1 [NOW — pre-graduation] Lawful buy-drivers under "transfers locked, curve-only"

**P1 · Buy-bridge at the three desire surfaces** [NOW] [LAW-OK] [OWNER-DECISION: final copy]
- (a) **Vault-locked panel** (the conversion moment — a run reached the peak wick but the
  wallet doesn't hold): *"WICK VAULT — locked. Reach the peak wick and hold 1,000 $WICK
  to open it. $WICK trades on the vibe curve — testnet, no monetary value → [token page]"*
- (b) **Wallet chip, expanded state**: tier line + *"Get $WICK (testnet) →"*
- (c) **Ready-screen meter line** (see P2) carries the same link.
- Rules: contextual only, no interstitials, no countdowns, no "buy now" pressure, testnet
  stated plainly, pack §8 language sweep. Death Card share images stay product-only.
- Why it works: it converts an existing, daily-recreated desire moment we already ship.
- KPI: bridge CTR per surface; vault-open rate among peak-wick passers.

**P2 · Meter-in-product: "the community climb"** [NOW] [LAW-OK]
- One read-only line on the ready screen, from the pad API (cached, fail-open, verified
  numbers only — the E0.4 ritual already does this): *"GRADUATION 3.94% · 0.1574 / 4.0
  ETH · 254,293 $WICK burned"* next to the existing burn feed line.
- Reframes graduation as the game's co-op boss bar: every player sees the collective
  climb daily; the token page link (P1c) is one tap away when curiosity peaks.
- KPI: meter-line impression → token-page CTR; meter ETH/week.

**P3 · Persistent holder cosmetic ladder v1** [NOW] [LAW-OK]
- Make the ember/gold trails **persist while tier holds** instead of expiring after the
  vault-open day; add a small holder badge to the Death Card render (cosmetic layer
  only); show the tier ladder (1k → 100k) in the wallet chip even before holding, so
  there is a visible next rung.
- Pre-grad this is trivially safe: transfers locked means balances can only rise — no
  re-verification races. Post-grad, tier is re-read on connect (see P7).
- Why it works: identity you can see and keep beats identity that evaporates at UTC
  midnight. KPI: % of linked wallets reaching ≥1k; tier distribution.

**P4 · Holder weight bonus — the one amendment worth making** [NOW]
[NEEDS-LAW-AMENDMENT: LAW 3.2 says weights reward *participation*; adding a holding term
changes what weights reward → dated note in ECONOMY-LAWS.md required] [OWNER-DECISION: O-S]
- Proposal: **+5 weight points/day [PROVISIONAL]** applied at accrual ONLY if, that UTC
  day, the wallet is (i) linked, (ii) holds ≥1,000 WICK, and (iii) has ≥1 valid `run`
  event (participation gate). Flat — never proportional to balance (no whale multiplier).
  Still bounded by the existing 600-point wallet snapshot cap (a perfect streak player
  + holder saturates in 40 days; the cap keeps this bounded by design).
- Why: it is the single most direct lever turning the weights system (our strongest
  FOMO asset) into a buy-and-hold driver, while the participation gate keeps "players
  first" true in substance, not just in prose.
- Honest cost: the airdrop becomes partially capital-weighted. If the owner prefers to
  keep weights 100% participation-pure, the fallback is P3 + P6 only — weaker, lawful,
  no amendment.
- Anti-sybil: idle wallets get 0 (gate iii); buying 1k per sybil wallet is self-defeating
  on a curve (each buy moves price up) and pointless for a worthless testnet airdrop;
  W1/W5 + identity≤2/wallet + snapshot flags all remain in force.
- Language: "holders build weights faster" — never "earn," never "guaranteed."

**P5 · Weekly airdrop-board preview** [NOW] [LAW-OK]
- The /airdrop rehearsal page already exists (E2.5). Publish a **weekly board preview**
  ("weights as of today — snapshot NOT final, nothing guaranteed") as the weekly return
  trigger for linked players; it also surfaces P4's holder bonus visibly if adopted.
- KPI: weekly returning linkers; preview → play conversion.

**P6 · Owner-presence note (golden goal #2)** [NOW] [LAW-OK — and LAW 1 means no shortcut exists]
- The leaderboard is skill-only: the owner's lawful path to top-5 visibility is playing
  daily like anyone else (streak identity + weights board presence) while holding whale
  tier for the gold trail. No bought rank, no special grants — any shortcut would destroy
  the credibility the whole economy rests on. This is a habit, not a mechanism.

### 2.2 [AT-GRAD] The graduation moment — ship the conversion kit that day

**P7 · Graduation Day Kit** [AT-GRAD] [LAW-OK] [OWNER-DECISION: sequencing + numbers TBD at graduation]
- **MIRROR v0**: the graduation candle itself becomes a permanent legendary level
  ("we climbed the mountain we made") — practice-lane scoring, weights at practice rates.
- **"Graduator" commemorative cosmetic**: frames/trail for wallets holding ≥1,000 at the
  snapshot freeze — a score-blind keepsake that rewards having held through graduation.
- **Merkle delivery goes live** (E2.5 rehearsal → real freeze, root publication, claim
  page) and **graduation registration** with the platform happens post-grad (pack §5.4).
- **Day-1 sinks open immediately** (P8/P10 below) — the attention spike must land on a
  menu, not a void; **first tournament announced** with a treasury-funded (20% cash
  share) prize and published rules.
- **Hold-to-wear goes live**: from graduation day, tier trails are wearable while balance
  ≥ tier (now meaningful, because selling unlocks that day).
- Comms sequence per E6.1 runbook; all copy through the §8 sweep.

### 2.3 [POST-GRAD] The sink ladder — LAW 2 lanes only

**P8 · Cosmetics marketplace v0 — fixed-price weekly rotation** [POST-GRAD] [LAW-OK]
- Trails, death-card frames, ghost styling, emotes at fixed WICK prices; shop rotates
  weekly (urgency + repeat visits, no randomness). Everything render-layer: no physics,
  no information advantage. KPI: 2–5% of DAU buying weekly [target = owner decision];
  WICK burned via shop per month.

**P9 · Cosmetic forge & deterministic reroll** [POST-GRAD] [LAW-OK]
- Burn N WICK to reroll a deterministic variant, or combine 3 owned cosmetics → 1 new
  (burned). Collection depth + a real burn sink. **No loot boxes** — outcomes are
  deterministic and disclosed. KPI: reroll/forge rate, burn volume.

**P10 · Weekly treasury tournaments** [POST-GRAD] [LAW-OK]
- Entry = tournament ticket burn; prize pool from the 20% cash share; format flagged,
  rules published per event (spec §8). Always run a **free companion bracket** for
  spectacle and non-holder spectacle so events never read as paywalled play. KPI:
  entries/week, ticket burn, DAU spike on tournament days.

**P11 · Season pass — cosmetic track ONLY** [POST-GRAD] [LAW-OK] [OWNER-DECISION: price/cadence]
- ~30-day seasons ("candle seasons"); pass pays out a cosmetic collection across the
  season. **The pass grants zero weights** — selling weights for tokens is the one move
  that would break LAW 3.2 from the seller's side. KPI: pass attach rate among holders;
  season-over-season holder retention.

**P12 · Guild chest** [POST-GRAD] [LAW-OK]
- Members burn WICK into a communal chest that unlocks a guild-wide cosmetic (banner
  trail) when filled; per-member daily contribution cap; rides the platform guild
  (E5.2 "Candle Climbers"). Social, collective, recurring — and a burn. KPI: % of guild
  members contributing, chest cycles completed per season.

**P13 · Era / archive passes** [POST-GRAD] [LAW-OK]
- Monthly themed bundles of extended historical terrain (LAW 2.3: practice-only, unscored;
  selling practice is lawful, selling rank is not). KPI: pass sales, practice-lane actives.

*Revive tokens (spec §8): lawful only on unscored surfaces (practice/archive) or when the
revived run is explicitly non-submittable — a revive that changes a ranked run is a
score mutation (LAW 1 red line). Put in the implementation contract for P6-era sinks.*

---

## 3. The recurring cycle (first-buy → repeat-buy → hold)

Cadence map:

| Rhythm | Loop | Phase |
|---|---|---|
| **Daily** | play today's level → streak weights → route prediction (tomorrow) → die at/near the peak wick → see locked vault + bridge → link wallet → buy ≥1k (testnet) → open vault → persistent trail (P3) | exists + P1–P4 |
| **Weekly** | Daily Report cliffhanger (H4) → airdrop-board preview (P5) → shop rotation (P8) → tournament (P10) | P5 now; P8/P10 post-grad |
| **Season (~30d)** | cosmetic collection theme → pass (P11) → snapshot freeze → Merkle claim → next season resets collections and re-runs FOMO | post-grad |
| **Collective** | meter line in-product (P2) → graduation event (P7) → MIRROR daily terrain (holders return to play their own position) | P2 now; P7 at-grad; MIRROR post-grad |

**Hold logic (why the cycle retains rather than churns):** hold-to-wear tier cosmetics
(P3/P7) make holding itself the subscription — visible, honest, disclosed; the factual
75% tax share rewards staying in; snapshot cadence binds participation to seasons;
MIRROR makes one's own position the daily terrain. No profit promise anywhere — every
hold argument is either cosmetic, participatory, or a verifiable fee-rail fact.

**Cycle v2 — one outline (Q4 answer):**

```
DAILY (product loop — free, walletless)
  today's level → streak weights → prediction lock (tomorrow)
    → peak-wick death/near-miss → LOCKED VAULT visible → buy-bridge (P1)
    → link wallet → buy ≥1k on curve (testnet) → vault open → persistent trail (P3)
WEEKLY (identity loop)
  Daily Report (H4) → airdrop-board preview (P5) → [post-grad] shop rotation (P8)
  → [post-grad] tournament ticket burn + treasury prize (P10)
SEASON (value loop, ~30d)
  cosmetic collection + pass, cosmetics-only (P11) → snapshot freeze → Merkle claim
  → next season resets collections → repeat
COLLECTIVE (the meter as co-op boss bar)
  in-product meter line (P2) → graduation day kit: legendary candle level, Graduator
  cosmetic, claim delivery, day-1 sinks live (P7) → MIRROR: own chart = daily level
HOLD LOGIC
  hold-to-wear tiers · factual 75% tax share · snapshot cadence · MIRROR relevance
  · seasonal identity — never a profit promise, never score-adjacent (LAW 1 holds).
```

---

## 4. Risks & anti-sybil notes

- **Self-trading / fake volume**: platform anti-abuse treats it as disqualifying; the
  owner buys only with conviction-sized, visible, ordinary purchases. Never coach
  wash-trading to move the meter — honesty is the moat and the platform is watching.
- **P4 sybil vectors**: participation gate (≥1 valid run/day) defeats idle-wallet
  farming; flat (non-proportional) bonus removes whale-multiplier incentive; 600-point
  wallet cap bounds total exposure; identity≤2/wallet + snapshot anomaly flags unchanged.
  Residual: name-sybil inflates identity totals — mitigated at snapshot, documented, not
  hidden (spec §7.3 stance).
- **Law drift**: every economy PR states which laws apply and how (E3.1); at most ONE
  economy change per week (E4.3); amendments get dated notes (LAW 5.3). P4 is the only
  amendment recommended this cycle.
- **Language risk**: all new copy (bridge, meter line, board preview, shop) through the
  pack §8 sweep — "builds weights," testnet stated plainly, no profit/odds language.
- **Optics risk**: the bridge must stay contextual (3 surfaces max) — nagging converts
  the game into a shill and burns the goodwill the free game earns.
- **Breadth dependency**: every mechanism here multiplies conversion; none creates
  reach. With awareness ≈ 0, E5 (owner-only, frozen) remains the binding constraint —
  the council should say this plainly to the owner every week until it moves.
- **Testnet→mainnet portability**: all numbers [PROVISIONAL] pending O-S; the graduation
  runbook must re-verify chain state (E0.4 ritual) before the kit fires.

## 5. KPIs (measure, don't invent)

- Meter ETH/day + weeks-to-graduation projection (E0.4 ritual, weekly).
- Link rate: % of DAU with linked wallet (instrument via WalletChip events — E4.1).
- Buy conversion: % of linked wallets holding ≥1,000; holder count via RPC.
- Vault funnel: peak-wick passers → vault attempts → opens; opens/day.
- Bridge CTR per surface (P1a/b/c) — one instrumentation note, E4.1.
- Retention: D1/D7 (E4.2); weekly board-preview returners (P5).
- Post-grad: shop attach rate, ticket burns/week, pass attach rate, forge/reroll rate,
  WICK burned via sinks/month, net meter flow/day.
- Weekly review: E4.3 ritual, one economy change per week maximum.

## 6. What NOT to do (and why)

1. **Never sell weights for tokens** (pass perks, "boost your airdrop" packs) — it
   converts LAW 3.2's participation airdrop into a purchasable, and the "players-first"
   story — our utility-track case — dies with it. (P11 is cosmetics-only for exactly
   this reason.)
2. **Never let holdings touch score, rank, loot, or base access** (LAW 1; the GROWTH §3
   multiplier sketch is void). One violation ends "the unbuyable scoreboard" forever.
3. **No gambling texture, pre- or post-grad**: no loot boxes, no wager-to-multiply, no
   casino framing, no prize wheels. Deterministic cosmetics and disclosed rules only.
4. **No profit promises, no yield numbers, no "guaranteed"** (LAW 4 / pack §8.1): the
   75% tax share is described as the mechanism it is, never as income.
5. **No ranked-run revives** — a revive that alters a submittable run is score mutation.
6. **No dark-pattern urgency** (fake countdowns, interstitials, badge spam) on the
   bridge; three contextual surfaces, honest copy, done.
7. **No invented numbers anywhere** — only figures from the evidence trail (E0.4
   snapshots, launch record); meter line reads live, fails open, never caches stale
   claims as current.
8. **No bought engagement** (followers, bots, reply farms) — platform anti-sybil
   sensitivity is explicit (pack §0) and the credibility cost is asymmetric.
9. **No mid-air edits** to weights constants or tier thresholds — one diff, one test,
   O-S sign-off, one change per week.
10. **Don't gate archive browsing, duels, leaderboard, or today's level** — that is base
    access (LAW 1.2), and with awareness ≈ 0, every friction-free visitor is the funnel.

---
*Prepared for the Economy Council. Nothing in this memo modifies code, laws, or specs;
adoption of P4 requires a dated LAW 3.2 amendment note + O-S sign-off; all other
proposals are lawful as designed. Owner-gated items are flagged inline.*

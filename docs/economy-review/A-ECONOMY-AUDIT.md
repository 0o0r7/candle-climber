# A — ECONOMY AUDIT & CYCLE v2 (Token Economist, review board)

> Written 2026-10-08 · Task ID **73-a** · Token Economist seat, expert review board.
> Research + analysis + design **on paper only** — this document wires no code, changes no
> law, touches nothing under `src/`, and performs no git or deploy actions.
> Precedence: `docs/ECONOMY-LAWS.md` (supreme) ← WICK-LAUNCH-FORM-PACK §8 red lines ←
> `docs/WICK-ECONOMY-SPEC.md` ← `docs/ECONOMY-CHECKLIST.md` ← this audit. Where this audit
> disagrees with the Economy-Council chair verdict (2026-10-08), the discrepancy is flagged
> inline, not silently resolved.
> Verified constants (2026-10-07 evidence trail, not re-derived): lifecycle `CURVE_TRADING`
> · meter **0.1574 / 4.0 ETH = 3.94%** · remaining **3.8426 ETH** · `transfersUnlocked=false`
> · tax 2% split 75% holders / 20% cash / 5% burn · **254,293 WICK** burned cumulatively (E0.4)
> · platform incentive pool 5% of ecosystem supply (traders 1.75 / meme 1.5 / utility 1.5 /
> old creators 0.25) · zero organic $WICK mentions in a 439-message Discord corpus ·
> publishing frozen by owner directive. Every projection below is labeled **[ASSUMPTION]**
> except where it traces to that evidence trail.

---

## 1. HONEST AUDIT — the current financial cycle

### 1.1 The one-sentence audit

The cycle as designed is *logical*; the cycle as shipped is *incomplete*: it is all
faucets and no plumbing between the faucet room and the meter — **zero buy path, zero
discretionary sinks, zero second-purchase objects, and zero measurement**. What exists is
not a financial cycle; it is a participation-ledger (weights) with one double-gated
cosmetic chest (the vault) attached to a token nobody in the product is ever shown how to
acquire.

### 1.2 Complete faucet map (what exists today, LIVE)

| # | Faucet | Gives | Gate | Status |
|---|---|---|---|---|
| F1 | Daily-streak weights (`run` events) | `min(consecutive days, 10)` per day, ≤10/day/identity | verified submission on today's classic level | LIVE (E2.2, prod-verified) |
| F2 | Archive practice weights | 0.5/run, ≤2/day | verified archive run | LIVE (E2.3) |
| F3 | Next-day prediction weights | tiered ≤10/day (direction 4 + move-size 3 + tail 3), 1 lock/day | one lock per identity per day | LIVE (E2.3) |
| F4 | **WICK Vault** | +1 weight + 1-day cosmetic trail (ember ≥1k, gold ≥100k) | run passed the peak-wick candle **AND** wallet holds ≥1,000 WICK | LIVE (E2.4) |
| F5 | Merkle airdrop entitlements | future distribution claim (rehearsal live) | linked wallet only; 600-pt/wallet snapshot cap | LIVE rehearsal (E2.5); real freeze at graduation |
| F6 | Holder tier display | "WICK HOLDER" / "WICK WHALE" chip label | balance read (1,000 / 100,000) | LIVE (E2.1) — but trails only exist via F4 and **expire after one day** |
| F7 | Burn-counter feed | information (254,293 WICK burned) | none | LIVE (E2.6) |
| F8 | Trade-tax holder share | 75% of the 2% trade tax redistributed to holders | holding | AUTOMATIC (fee rails); at current volume rhetorically real, numerically trivial |
| F9 | Platform incentive pool | 5% of ecosystem supply (utility track 1.5%) | platform's own discretionary program | EXTERNAL — eligibility plausible (MVP live), nothing guaranteed (E0.5 open) |

Weights never touch score/rank/base access (LAW 1) — correct, and enforced in the shipped
code (`weights.ts` is pure; `/api/weights` is read-only; leaderboard wiring is
fire-and-forget and unobservable in the game response).

### 1.3 Complete sink map (what removes value today)

| # | Sink | Mechanism | Who chooses it |
|---|---|---|---|
| S1 | Trade-tax burn | 5% of every trade's 2% tax → burn | nobody — automatic |
| S2 | Curve-fee burn | 1.25% curve fee → creator 75%/protocol 25%, each 50% claim + 50% burn ⇒ ~0.625% of trade value burned | nobody — automatic |
| S3 | Selling back into the curve | the only "exit" pre-grad (P2P transfers locked); pays the 2% tax and subtracts from the meter | the seller (a drain, not a feature) |
| S4 | **In-game discretionary sinks** | — | **NONE EXIST.** Spec §5 rows 8–10 (entries, tickets, cosmetics) are all gated on graduation. Correct under the transfer lock — but it means the product today offers exactly zero things to spend on. |

**The damning ratio:** 4 player-facing weight faucets + 1 day-expiring cosmetic vs **zero
chosen sinks**. Both real sinks (S1/S2) are fee-rail residue that no player action inside
the game selects for. A "financial cycle" with no valve the player can turn is not a
cycle — it is a one-way ledger with a leak.

### 1.4 Where buy pressure is SUPPOSED to come from vs where it ACTUALLY comes from

**Supposed to (per GROWTH §2 / WICK-ECONOMY-SPEC §3):** daily-return hooks (archive,
prediction, streaks, vault) → desire to belong/hold → buy from curve (the only possible
acquisition pre-grad, since transfers are locked) → meter fills → graduation → post-grad
economy. The design even has a rare structural advantage: **curve-only supply pre-grad
means every holder is by construction a genuine net buyer** — there is no airdrop, team
unlock, or P2P side-market diluting attribution.

**Actually comes from:** nowhere measurable.
- The only pad link inside the product is a footer credit ("vibe/vibe testnet"). There is
  no GET-$WICK surface anywhere in the game. Product and token page are islands.
- Awareness ≈ 0 (0 organic mentions in 439 Discord messages; X/guild publishing frozen).
- The council's earlier finding stands and is re-affirmed here: with no attribution
  instrumentation, the meter's 3.94% is an **unattributed launch-churn residue** — it
  cannot be credited to any mechanic, and therefore no mechanic can be credited with
  moving it. Gross churn (implied by 254,293 burned at 5% of a 2% tax + curve-fee burn)
  vs net 0.1574 ETH accumulated says most early activity was churn, not accumulation.
- Conclusion: **today, product-driven buy pressure ≈ 0 by both construction (no bridge)
  and evidence (no attribution).** The meter moved; nothing in the product can claim it.

### 1.5 The six-link chain, link by link

Chain: **play → connect → buy → hold → return → buy more**

| Link | Verdict | Evidence |
|---|---|---|
| play → connect | **WEAK** | Chip exists (E2.1 live) but the desire to connect is unpainted: the chip's "NO TIER YET" state is a dead end (no ladder, no next action); unlinked identities are excluded from snapshots, but nothing previews what a linked player *has already accumulated* (the endowment moment is unbuilt). Weights bind at link — the single cheapest conversion lever — and the product never says it at the moment it matters. |
| connect → buy | **BROKEN** | Nothing connects the two surfaces. At the highest-desire moment (run passed the peak wick, wallet holds 0 → vault denied) the product dead-ends with an error-shaped line, no path, no counter. This is the single largest gap in the entire economy. |
| buy → hold | **WEAK** | Holding value = one vault-openable day-trail (expires at UTC midnight) + a +1 weight trickle (a 10-day streak pays 10× that) + a true-but-trivial tax-share narrative. Nothing persistent, nothing collectible, no visible "what holding gets me" before you already hold. The game itself currently teaches *playing beats holding* (streak 10 vs vault 1). |
| hold → return | **PARTIAL** | The vault re-arms daily — but re-opening it requires re-passing the peak wick, so the *holder* ritual is gated by *skill*, not by holding. MIRROR (your own chart as terrain) is correctly phased post-grad; until then holders have no daily token-native reason to return beyond the weights they already accrue by playing. |
| return → buy more | **BROKEN** | There is no second-purchase object in existence: no ladder beyond 1k (next rung 100k is visually indistinct), no collection, no calendar, no shop (lawfully locked pre-grad), no seasonal cadence. After the first vault open, the marginal reason to buy again is exactly zero. |
| (implicit) tell others | **BROKEN** | Share attribution (E5.5) unbuilt; publishing frozen; awareness ≈ 0. The funnel's widest stage — stranger → visitor — has no engine at all. |

### 1.6 Meter math — what 30/60/90-day graduation demands

Fixed verified facts: remaining **3.8426 ETH** net (meter fills on NET buys − sells; the
2% wallet cap makes breadth mandatory — no whale can graduate it alone).

**Required average net inflow per day (pure arithmetic):**

| Horizon | Required net ETH/day |
|---|---|
| 30 days | **0.128** |
| 60 days | **0.064** |
| 90 days | **0.043** |

**Observed velocity [E, two-point, LOW CONFIDENCE]:** the two verified snapshots are
0.0997 ETH (2.49%) and 0.1574 ETH (3.94%) — a delta of 0.0577 ETH. Depending on the true
interval between those reads (the repo evidence is ambiguous: same-day timestamps in
different docs vs "a week" in the task brief), velocity is between **~0.008 ETH/day
(~466-day do-nothing floor)** and **~0.058 ETH/day (~66-day floor, the council's standing
two-point read)**. Either way: **below the 60-day bar, and 2–16× below the 30-day bar.**
This is exactly why E0.4's weekly snapshot ritual + attribution counters are load-bearing
before any optimization.

**Player-side translation** [ASSUMPTIONS: p = share of DAU who buy in a month (spec band
20–40%); b = avg net buy per buying player per month (spec band 0.01–0.03 ETH); contributors
must be *sustained* across the horizon, not one-shot]:

| Horizon | ETH needed | Contributors needed @ b | Implied DAU @ p=40% | Implied DAU @ p=20% |
|---|---|---|---|---|
| 30 days | 3.84 | 384 @ 0.01 · 192 @ 0.02 · 128 @ 0.03 | 960 / 480 / 320 | 1,920 / 960 / 640 |
| 60 days | 1.92 | 192 / 96 / 64 | 480 / 240 / 160 | 960 / 480 / 320 |
| 90 days | 1.28 | 128 / 64 / 43 | 320 / 160 / 107 | 640 / 320 / 215 |

Cross-check against the spec's own E1.3 scenario table (200 DAU × 40% × 0.03 ETH/mo =
2.40 ETH/mo → ~1.7 months): consistent. Reading:

- **30-day graduation is implausible** without an external catalyst (platform feature,
  incentive-pool listing, or a viral moment) — it requires ~320–960+ DAU at healthy
  conversion, against awareness ≈ 0 today.
- **60-day graduation is plausible only at "growth-loop" scale** (~160–480 DAU with
  20–40% buy conversion) — i.e., requires BOTH the unfrozen distribution engine AND a
  working in-product conversion path. Neither exists today.
- **90-day graduation is the honest best case** (~107–320 DAU sustained) — achievable if
  the bridge + ladder + measurement ship within ~2 weeks and publishing unfreezes.
- Gross-vs-net caveat: because the 2% tax and 1.25% curve fee skim trades, a player's
  gross outlay to fill the meter is strictly larger than the net the meter records
  (exact drag depends on the platform's reserve accounting — not invented here). Selling
  subtracts; the fee rails make churn self-defeating, which is correct design.

### 1.7 Data-integrity findings (audit side-quest, all load-bearing)

1. **0xdEaD is the largest balance-read "holder."** The burn address holds 254,293 WICK —
   above the 100k whale threshold — and the E2.4 prod E2E ran *as 0xdEaD* to prove the
   whale path. Any holder count, tier distribution, or "holders" KPI that doesn't exclude
   the burn address is wrong by construction. (Filed to the auditor seat previously;
   repeated here because every KPI in §2.7 depends on it.)
2. **Burn-counter discrepancy:** E0.4 (Oct-07 pad read) says 254,293.162 WICK; the E2.6
   prod RPC read (Oct-08) said 164,944.787. Two live surfaces currently disagree. Must be
   reconciled at the next `verify-econ-state` run before any doc or HUD quotes a figure
   (chair B13). Never hardcode either number; live-read, fail-open.
3. **Zero conversion instrumentation.** No surface counts bridge clicks, connect events,
   or Peak→buy-24h. Until E5.5 counters exist, every economy decision is blind —
   including the decision of whether the current cycle "works" at all. The owner cannot
   even falsify the cycle with data that isn't collected.

---

## 2. CYCLE v2 DESIGN

### 2.1 Design theses

- **Phase A (pre-graduation, transfers locked):** players *cannot spend* — so the product
  sells **identity and entitlement**. Legal moves: buy, hold, link, play. Goal ordering is
  forced by the meter math: reach → connect → first buy → **hold through graduation**.
- **Phase B (post-graduation, spend/burn unlocked):** the token becomes the game's
  **currency of expression and entry**. Every sink burns to supply or routes to the
  tournament treasury; nothing ever buys score, rank, or access (LAW 1/3.3).
- **Honesty is a conversion asset, not a tax:** testnet stated plainly, "builds weights"
  never "earn", deterministic mechanics never loot boxes. The unbuyable scoreboard is the
  only durable credibility moat — and the utility-track case.
- **One change per week** (E4.3); measure before optimizing (E5.5 counters first).

### 2.2 Phase A faucet/sink map (pre-graduation) — as-is → v2

| Flow | Today | Cycle v2 addition | Law lane |
|---|---|---|---|
| Faucet | F1–F4 weights lanes; F6 day-expiring trails | **Persistent tier trails while tier holds** (holding is the subscription) · **"Graduator" keepsake** entitlement for wallets ≥1k at the graduation snapshot (announced pre-grad, awarded at-grad) · endowment preview · weekly board preview · near-miss telemetry · meter line | cosmetics + weights (LAW 2/3.2) |
| Faucet | — | **Ladder visibility pre-holding** (chip shows 1k→10k→50k→100k with what each rung wears) | cosmetics display |
| Faucet | F8/F9 (automatic/external) | narrated as mechanism, never as income (LAW 4) | language |
| Sink | S1/S2 automatic burns only | **Burn-wall narrative**: community cosmetic unlocks at public on-chain burn thresholds (deterministic, disclosed) — turns the automatic sink into a collective progress bar; plus Graduation-monument pre-registration | cosmetics |
| Sink | (none discretionary — and none lawful pre-grad) | **none added** — the transfer lock is respected; pre-grad conversion happens at the buy page, not in-game | LAW (transfer lock) |

### 2.3 Phase B faucet/sink map (post-graduation) — the sink catalogue

| Sink | Mechanic | Burns to | Guard |
|---|---|---|---|
| Cosmetic shop (weekly rotation) | trails, death-card frames, ghost skins, emotes at fixed WICK prices; new drop weekly | irrecoverable burn | fixed prices, no randomness, no urgency timers |
| Cosmetic forge / deterministic reroll | burn N WICK → deterministic variant; combine 3 owned → 1 new | burn | outcomes deterministic and disclosed — **no loot boxes, ever** |
| Death-card frames | collectible frames per era/famous-day shop drops | burn | render-layer only; share text stays clean (chair D13) |
| Ghost skins | styling of your wreckage-ghosts (H3) | burn | styling only — no information advantage over what every player already sees |
| Era/archive passes | extended historical terrain bundles (LAW 2.3) | burn or treasury | **practice-only, unscored, weights-ineligible extensions** (see P7 note — selling weights-earning capacity is the D22 leak) |
| Tournament entry (ticket burn) | flagged events, rules published per event | tournament treasury | **mandatory free companion bracket** so events never read as paywalled play; pack §8.3 gambling-tone review before any real-value prize |
| Guild chest | members burn into a communal chest → guild-wide cosmetic | burn | per-member daily cap; rides owner-created guild (O-G) |
| Season pass (~30d) | cosmetics-only collection track | burn or treasury | **grants zero weights** — selling weights would break LAW 3.2 from the seller's side |
| Burn-for-status ("Eternal Flame wall") | burn X WICK → permanent profile-level flame mark on a public wall rendered in-game | burn | deterministic, disclosed, profile-level — never the leaderboard |
| Treasury tournaments (faucet side) | 20% cash share of tax → prize pools paid in ETH | ETH out to winners (engagement faucet, not meter inflow) | on-chain distribution, published rules, testnet rehearsal first |

Faucets in Phase B = all of Phase A **plus**: MIRROR (the token's own OHLC feeds the
terrain pipeline — holders return daily to play their own position), seasonal collection
distribution, treasury-funded prize pools, and the graduation-candle legendary level.
Hold logic in Phase B: **hold-to-wear** (tier cosmetics are wearable while balance ≥ tier —
selling now visibly costs you your look: honest, disclosed, purely cosmetic loss aversion),
the factual 75% tax share as mechanism, snapshot/season cadence, MIRROR self-relevance.

### 2.4 Holder value ladder (lawful; proposed thresholds **[PROVISIONAL]**, O-S sign-off)

Implemented today: exactly **two** tiers (`TIER_HOLD_WEI = 1,000`, `TIER_WHALE_WEI =
100,000` — verified in `src/lib/wallet.ts`), and the only visible reward is a trail that
expires the day it's granted. Proposed ladder (every rung: additive, score-blind, LAW 2):

| Rung | Name | Gets (pre-grad) | Gets (post-grad adds) |
|---|---|---|---|
| ≥1,000 | **Ember** | persistent ember trail · vault access · ember mark on own Death Card render · endowment visible on /airdrop | shop access; entry-priced event lanes |
| ≥10,000 | **Torch** | ember set + **Route Sketchbook** (save/overlay your own drawn prediction routes — LAW 2.2 affordance over the same public terrain, injects nothing) | one deterministic seasonal cosmetic claim/season; ghost-aura styling on own ghosts |
| ≥50,000 | **Beacon** | gold trail (re-homed from whale) · profile frame · deeper archive eras (**practice-only, weights-ineligible**) | forge discount cosmetics line (deterministic, disclosed) |
| ≥100,000 | **Whale** (unchanged) | gold + distinctive ghost styling · profile-level patrons' wall listing | first-access to event lanes (entry still ticketed equally) |

Guards: the ladder is **visible pre-holding** in the chip's empty state (there must always
be a next rung to see); tiers are re-read on connect post-grad; **0xdEaD is excluded from
every tier read and every metric**; whale color is profile-level, never on the leaderboard
(chair D6). Holding never adds a weights point (D1/D22 stand — see P15 dissent note).

### 2.5 Staged purchase moments — where the journey naturally wants to buy, and what's offered

| Moment | Trigger in the journey | What is offered | Envelope (chair) |
|---|---|---|---|
| M0 · Curiosity | landing / ready screen | meter/burn line: `GRADUATION {live}% · {live}/4.0 ETH · SUPPLY BURNED {live} $WICK` + GET-$WICK link, paired with `free to play, no wallet needed` | GREEN (D3) |
| M1 · Pride | death/grad panel after a real run | `THIS RUN BUILDS AIRDROP WEIGHTS — LINK YOUR WALLET TO COUNT IT`; after connect, the chip shows the ladder + `You hold 0 $WICK · holder tiers & vault start at 1,000 · [GET $WICK · testnet]` | GREEN (D9/D11) |
| M2 · Near-miss / unfinished business | run passed near/at the peak wick, vault denied | near-miss telemetry `YOU WERE {n} CANDLES FROM THE VAULT` (computed, honest) + the vault-denied block with GET-$WICK and an honored exit (`NOT TODAY`) | GREEN half / YELLOW half (D4 — owner sign-off + E3.4 re-read) |
| M3 · Endowment | /airdrop board | `IF THE SNAPSHOT WERE TODAY, YOUR LEDGER SHOWS {N} WEIGHTS — LINK A WALLET TO BIND THEM` + holder-lane line | GREEN (D8) |
| M4 · Collective | meter milestones, burn thresholds | community cosmetic unlock at disclosed on-chain burn marks; "the graduation candle becomes a level" pre-registration | GREEN (design) |
| M5 · Ceremony | graduation day | Graduation Day Kit: Graduator keepsake (held-at-snapshot wallets), Merkle delivery goes live, day-1 sink menu open, first tournament announced, MIRROR v0 legendary candle | CONDITIONAL (D15) |
| M6+ · Appetite | post-grad weekly/seasonal cadence | shop rotation drop (new want) · forge/reroll (consumption → rebuy) · tournament ticket · season reset (collection FOMO with deterministic contents) · guild chest (collective pull) | POST-GRAD (D16/D17) |

Design rule inherited from the psychologist's seat: **max two buy-adjacent surfaces render
per session**; no mid-run modals; no bridge anywhere near PLAY/retry, score flows, Death
Card content, or share text; no countdowns; the frustration window is never a buy window.

### 2.6 What drives the SECOND and SUBSEQUENT buys (the part v1 never had)

1. **Consumption** — post-grad, every forge/reroll/ticket/chest burn *destroys* tokens the
   player wanted as cosmetics/entry; burned desire must be re-purchased. This is the only
   mechanically guaranteed repeat-buy loop, and it is entirely Phase B.
2. **Collection completion** — deterministic seasonal sets (fixed contents, fixed prices);
   completion is a stronger sustained driver than any single item.
3. **Ladder progression** — the visible next rung (1k→10k→50k→100k) with distinct
   persistent cosmetics turns "enough" into "next".
4. **Identity loss-aversion (honest form)** — hold-to-wear: selling visibly costs the look
   you climbed in. Pure cosmetics lane; disclosed, no deception.
5. **Calendar** — weekly rotation + ~30-day seasons + tournaments create scheduled
   "there's something new" moments (the missing calendar was a core v1 weakness).
6. **Self-relevance** — MIRROR: your own position *is* the daily terrain; holding keeps
   your home mountain interesting.
7. **Collective pull** — guild chest and community burn goals: buying becomes a visible
   contribution to a shared object (cosmetic-only outcomes).
8. **Status** — the Eternal Flame wall: on-chain burns are public; rendering them as
   permanent profile-level flame marks makes burning itself the status purchase.

Pre-grad, drivers 1/8 are unlawful (no spend) — so pre-grad repeat-buys rest on 3, 4, 7,
the Graduator keepsake (a dated reason to *hold through* an event), and M0–M4 desire
moments recurring daily with fresh terrain. That is why the pre-grad KPI that matters most
is **Peak→buy-24h**, not generic volume.

### 2.7 KPI stack — the numbers that prove the cycle week over week

Reviewed at the E4.3 weekly ritual; **one economy change per week maximum**; targets are
**[ASSUMPTION]** until two weeks of measured data exist (LAW 4).

| # | KPI | Definition | Working target [A] / alarm |
|---|---|---|---|
| 1 | DAU (+ D1/D7) | unique players with a verified run | D7 ≥ 15% [A]; < 5% = hooks failing, not demand |
| 2 | Connect rate | wallets connected ÷ unique visitors | ≥ 5% by week 4 [A]; < 2% after bridge live = alarm |
| 3 | **Buy conversion (players→holders)** | connected wallets ≥1k ÷ connected wallets; **Peak→buy-24h** = peak-wick passers buying ≥1k within 24h — *the* first-buy number | trend up weekly [A]; Peak→buy-24h ≈ 0 after 2 weeks of bridge = the cycle's falsifier |
| 4 | Holder retention | % of holders (0xdEaD-excluded) still ≥1k **and** still playing, WoW; vault-open rate as the daily pulse | falling vault opens = hold going stale |
| 5 | **Meter velocity** | net ETH/day (E0.4 ritual + live read) + projected days-to-graduation | > 0 every week; ≥ 0.01 ETH/day by week 4 [A] |
| 6 | Bridge CTR per placement | `/api/go/{placement}` ÷ impressions (E5.5) | kill/refit worst placement weekly (one-change rule) |
| 7 | Share rate | Death Card shares ÷ verified runs (with `?r=` buckets) | ≥ 3% [A]; 0 in a ≥100-run week = alarm |
| 8 | Post-grad sink volume | WICK burned via shop/forge/tickets/chest per week; shop attach rate | exists at all = Phase B working [A] |

Guard items, watched never optimized (psychologist's refusals): session-length tails,
per-player retry counts, streak-distribution shape.

---

## 3. PROPOSALS (numbered; tagged [LAWFUL NOW] / [POST-GRAD ONLY] / [NEEDS LAW AMENDMENT] / [FORBIDDEN] · P0/P1/P2 · S/M/L)

> "LAWFUL NOW" items marked *(YELLOW)* additionally require owner sign-off + E3.4
> compliance re-read per the council envelope — lawful by the letter, gated by process.

1. **Meter/burn line on the ready screen** (live-read pad API + RPC, cached fail-open,
   never hardcoded; paired with the standing free-to-play line). Converts the collective
   4-ETH climb from an external secret into the game's co-op boss bar. [LAWFUL NOW] · P0 · S
2. **E5.5 attribution rails**: outbound `/api/go/{placement}` redirect + aggregate
   counters `{placement, day, count}`; inbound `?r=dc-YYYYMMDD` first-touch buckets on
   Death Card shares; aggregate-only, fail-open, no user-level data. Nothing else in this
   list is falsifiable without it. [LAWFUL NOW] · P0 · S/M
3. **GREEN bridge trio**: (a) /airdrop endowment preview ("if the snapshot were today…"),
   (b) wallet-chip empty state showing the full ladder + GET-$WICK, (c) meter-line token
   link. Fixed copy per chair §7. [LAWFUL NOW] · P0 · S
4. **Metric integrity fix**: exclude 0xdEaD from every tier read, holder count, and KPI;
   reconcile the 254,293 vs 164,944 burn figures at the next verify-econ-state run; live-
   read forever, never hardcode. [LAWFUL NOW] · P0 · S
5. **Near-miss telemetry** on the death panel: `YOU WERE {n} CANDLES FROM THE VAULT`
   (computed from terrain, honest, no promise). The cheapest desire-amplifier in the
   whole list. [LAWFUL NOW] · P1 · S
6. **Persistent holder cosmetic ladder v1**: trails persist while tier holds (instead of
   expiring at UTC midnight); ember mark on own Death Card render; chip shows the ladder
   pre-holding. Post-grad: tier re-read on connect → hold-to-wear. [LAWFUL NOW] · P1 · M
7. **Ladder expansion to four rungs** (1k Ember / 10k Torch / 50k Beacon / 100k Whale) per
   §2.4, including the Route Sketchbook affordance (LAW 2.2) and weights-ineligible
   archive depth at Beacon+. Thresholds are [PROVISIONAL] constants — one diff + test +
   O-S sign-off. Note the trap this ladder deliberately avoids: extra *weights-eligible*
   capacity for holders would be a D22 leak, so bonus archive terrain accrues zero
   weights. [LAWFUL NOW] · P1 · M
8. **Vault-denied block + death-panel footer** (the two YELLOW surfaces): rendered
   post-run only, exit honored, fixed copy, two-surfaces-per-session cap respected. The
   single highest-intent conversion surface in the product. [LAWFUL NOW] *(YELLOW — owner
   sign-off + E3.4 re-read)* · P1 · M
9. **Weekly airdrop-board preview** ("weights as of today · snapshot NOT final · nothing
   guaranteed · testnet") — the weekly return trigger for linked players. [LAWFUL NOW] · P1 · S
10. **"Graduator" keepsake + graduation registration spec**: announced pre-grad, awarded
    at the snapshot freeze to wallets ≥1k — a score-blind permanent cosmetic that gives
    every holder a *dated* reason to hold through graduation; fires with the Graduation
    Day Kit (Merkle delivery live, day-1 sinks menu, first tournament announced, MIRROR
    v0 legendary candle). [LAWFUL NOW] (announce) · P1 · M (kit = L)
11. **Community burn-goal cosmetics**: disclosed on-chain burn thresholds unlock a
    cosmetic for the community (deterministic; render-layer). Makes S1/S2 — the only
    sinks that exist today — visible as a collective progress bar instead of a trivia
    number. [LAWFUL NOW] · P2 · S
12. **Weekly Reveal Ceremony** (content, not code): a recurring community call/panel over
    the real closed candle — prediction reveals, board preview, burn line. Uses existing
    surfaces; builds the ritual the calendar lacks. [LAWFUL NOW] · P2 · S
13. **MIRROR pre-registration + graduation-candle monument**: pre-grad page registering
    intent to climb the graduation candle; post-grad the token's own OHLC feeds terrain
    (practice-lane scoring, weights at practice rates only). [LAWFUL NOW] (pre-reg page) /
    [POST-GRAD ONLY] (MIRROR live) · P2 · M/L
14. **Post-grad sink catalogue to implementation-contract stage** (spec now, numbers at
    graduation, one change/week when building): cosmetic shop rotation · forge/reroll ·
    death-card frames · ghost skins · era/archive passes (practice-only, weights-
    ineligible) · guild chest · season pass (cosmetics-only, zero weights) · Eternal
    Flame burn-for-status wall · treasury tournaments (ticket-burn entry + **mandatory
    free companion bracket**; pack §8.3 gambling-tone review before any real-value
    prize). All burns → supply or tournament treasury, never → score/access. [POST-GRAD
    ONLY] · P1 (contracts) / P2 (build) · M each
15. **Holder weight bonus (+5/day flat, participation-gated: linked + ≥1k + ≥1 valid run
    that day, 600-cap unchanged)** — the one amendment that would directly weld the
    weights system (our strongest FOMO asset) to buying. Honest cost: the airdrop becomes
    partially capital-weighted. **[NEEDS LAW AMENDMENT]** (dated LAW 3.2 note + O-S) —
    and the council REJECTED it by default (chair D1, auditor RED absent amendment; the
    vault stays the single bounded holder-gated faucet per D22). My seat's dissent is on
    record; the envelope governs; the lawful fallback is P6 + P7 + P9. · — · S
16. **Explicitly [FORBIDDEN] — do not build, do not re-propose without a dated law
    amendment:** hold-to-play / any base-access wall (LAW 1.2; also arithmetic suicide at
    a 2% wallet cap) · any balance term in any weights formula (D1 absent amendment) ·
    ranked-run revives or any score mutation (LAW 1/3.3) · balance-ranked holder boards ·
    leaderboard badge-tooltip buy bridges · $WICK line in Death Card content or share
    text · selling weights, weight boosters, or pass perks that grant weights (LAW 3.2
    from the seller's side) · loot boxes / gacha / wager-to-multiply / prize wheels ·
    profit, yield, or "guaranteed" promises (LAW 4) · rewarded referrals and bought
    engagement (bots, reply farms — platform anti-abuse + asymmetric credibility cost).

Sequencing note: P0 items (1–4) are the measurement + bridge precondition; P1 identity
items (5–9) compound with them; nothing post-grad is built before E6.1/E6.2 gates. The
council's standing finding is adopted unchanged: **reach (E5, owner-only, frozen) is the
binding constraint** — every proposal here multiplies conversion; none creates audience.

---

## 4. OWNER'S DOUBTS VERDICT — "not right, not logical, not innovative"

**Is the feeling justified? Substantially yes about completeness, no about logic, half
no about innovation.**

- **"Not right" — JUSTIFIED.** The cycle is a half-built machine. Every faucet a
  participation economy needs is shipped (§1.2), but the machine has no intake path (no
  bridge), no persistent holder identity (one-day trails), no second-purchase object
  anywhere, no calendar, and no measurement (§1.5, §1.7). The owner's instinct that
  something is off is correct — with the precision that what's off is **connective
  tissue, not foundations**.
- **"Not logical" — NOT JUSTIFIED, and the owner should stop worrying about this one.**
  The structural logic is not merely defensible; it is close to the best available under
  the platform's mechanics: curve-only supply pre-grad (every holder is a genuine buyer —
  cleanest possible attribution), transfers locked (sinks *can't* be premature), the 2%
  wallet cap (breadth mandatory — which is exactly why the free-to-play, walletless base
  game is not generosity but arithmetic), the 2% tax with 5% burn + curve-fee burn
  (holding yields, churn pays), graduation → spend/burn unlock (sinks arrive exactly when
  they become legal). The "weird" parts the owner feels are features the platform imposed
  correctly. What is genuinely illogical is only the gap: the strongest asset (the
  weights/identity system) is deliberately firewalled from buying by law — correct — and
  nothing else was built to carry the buy motive. Law-compliant conversion objects are
  missing, not broken.
- **"Not innovative" — HALF WRONG.** The raw materials are genuinely novel and no
  competitor has them: real market days as documentary levels, the token's own chart
  becoming playable terrain (MIRROR), the unbuyable scoreboard as a trust moat, deaths as
  a public wreckage map, fee-rail burns as a collective narrative. What is NOT innovative
  is the v1 *expression*: a day-expiring trail and a two-rung ladder is generic
  gamification any token could bolt on — exactly the failure mode the owner already
  rejected once in the hook map. Innovation should go into the *market-native* lanes
  (near-miss telemetry against a real candle, burn-goal collectives, graduation-candle
  monument, hold-to-wear identity), not into inventing new financial machinery — the
  financial machinery is the platform's, and it's fine.

**What is sound (keep, do not relitigate):** the laws themselves (they are the moat and
the utility-track case); curve-only pre-grad supply; fee rails; the shipped rails
(weights, prediction, vault, Merkle rehearsal, burn feed); the refusal of pay-to-win.

**What is genuinely weak (fix in this order):** (1) no conversion path + no attribution —
you cannot fix what you cannot count; (2) holder value evaporates daily; (3) ladder has
two invisible rungs; (4) no second-buy objects even specced as contracts; (5) meter
invisible in-product; (6) awareness ≈ 0 with distribution frozen.

**The single highest-leverage fix:** inside the product, **ship the measured bridge**
(P0: meter line + GREEN trio + E5.5 counters) — it is the only fix that converts an
existing, daily-recreated desire moment into counted buy attempts, and it makes every
later decision falsifiable. Above the product, the unlock that dwarfs everything is
**unfreezing distribution (E5/F1)** — at awareness ≈ 0, every conversion mechanic
multiplies a number that is near zero; the correct sequence is instrument → broadcast →
organize (3→1→2), so unfreeze-day traffic is counted from visitor #1. If the owner does
exactly one thing this week: sign off on the P0 set. If two: fire F1.

---

*Sources read in order: worklog.md · docs/ECONOMY-LAWS.md · docs/WICK-ECONOMY-SPEC.md ·
docs/ECONOMY-CHECKLIST.md · docs/GROWTH-AND-HOOKS-STRATEGY.md · src/lib/weights.ts ·
src/app/api/vault/route.ts · plus for consistency: src/lib/wick-balance.ts, src/lib/wallet.ts
(tier constants), WalletChip/GameCanvas surfaces, docs/ECONOMY-COUNCIL/{CHAIR-VERDICT,
MEMO-ECONOMIST}.md and the three council seat reports (2026-10-08). No code, laws, specs,
or worklog history were modified by this audit beyond its own file and the appended
worklog record. All projections labeled [ASSUMPTION]; verified figures trace to the E0.4
evidence trail.*

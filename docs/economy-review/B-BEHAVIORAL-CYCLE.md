# B — BEHAVIORAL CYCLE · Behavioral Designer / Retention Psychologist seat (Task 73-b)

> Written 2026-10-08 · Board: economy review · Seat: behavioral design & retention
> psychology. **Paper only — wires no code.** Precedence: `docs/ECONOMY-LAWS.md`
> (supreme) → WICK-LAUNCH-FORM-PACK §8 → WICK-ECONOMY-SPEC → GROWTH-AND-HOOKS-STRATEGY
> → prior council rounds (`docs/ECONOMY-COUNCIL/MEMO-PSYCHOLOGY.md` Task-73 round 1;
> `docs/council/2026-10-08-behavioral-psych.md` Task-2-b). Where this document repeats a
> prior ruling it cites it (D1, D4, D8, D9, D11, D22, F1–F5); where it goes beyond, it is
> new seat work for the owner's Q3 ("what makes a user buy + hold + keep buying") and the
> owner's word «اعتیادآور».
>
> Sources read: worklog.md (Tasks 49→2-a) · ECONOMY-LAWS.md · WICK-ECONOMY-SPEC.md ·
> GROWTH-AND-HOOKS-STRATEGY.md · GLOSSARY-FA.md · live code (GameCanvas.tsx vault /
> prediction / death / graduated panels, PredictionPanel.tsx, WalletChip.tsx,
> /api/vault/route.ts). Verified live facts used: meter 0.1574/4.0 ETH = 3.94%
> (2026-10-07) · transfersUnlocked=false · tax 2% → 75/20/5 · 254,293 WICK burned ·
> awareness ≈ zero (0 organic mentions in a 439-msg corpus) · publishing owner-frozen.
>
> TAG LEXICON for proposals: [LAWFUL NOW] / [POST-GRAD ONLY] / [NEEDS LAW AMENDMENT] /
> [FORBIDDEN] × priority P0/P1/P2 × effort S/M/L.

---

## 0. The honest translation of «اعتیادآور» (addictive)

The owner asked for "addictive." Behavioral science does not contain a design for
*addiction* — it contains designs for **habit loops** (trigger → action → variable reward
→ investment; Eyal) and, separately, a catalog of the very mechanisms casinos use to
convert habit into compulsion (variable-ratio schedules on spend, loss-chasing, near-miss
engineering on money). These are adjacent, not identical. The difference is not intensity;
it is **what varies and who pays**:

- A **habit loop** varies the outcome of *skill and shared events* (did my call hit? did I
  finally pass the peak? what did the market draw?), bounds daily effort by design, uses
  only honest clocks, and never attaches the variable to money.
- A **compulsion loop** varies the outcome of *payment itself*, manufactures the anxiety
  it then relieves, and hides the clock.

This project's laws already forbid the second one (LAW 4: no gambling tone, no profit
promises; pack §8). So the lawful — and, we argue, the *stronger* — answer to the owner is:
build the first loop so well that the second is unnecessary. Compulsion that harms the
player eventually harms the product: on a testnet with zero awareness, **trust is the only
durable retention asset**, and every dark pattern spends it. Our design goal, stated once
here and assumed everywhere below: **"unmissable daily," never "can't stop."**

A second honest note the owner deserves: awareness ≈ zero is not a psychology problem —
it is a distribution problem (standing council finding; F1). The loop below can only
compound inside people who arrive. No engine in this document substitutes for unfreezing
publishing.

---

## 1. MOTIVATION AUDIT — every live economy surface, its engine, its grade

Grades: **STRONG** (engine fires as shipped) · **MEDIUM** (engine present, under-rendered
or bounded) · **WEAK** (engine nominal) · **DORMANT** (engine designed-in but silent) ·
**NONE** (no psychological engine wired).

| # | Surface (as shipped) | Behavioral principle engaged | Grade today | One-line reason |
|---|---|---|---|---|
| 1 | **Daily fresh level from the real chart** (one UTC terrain for the whole world) | Appointment mechanics + superordinate shared fate + novelty (the market writes the level) | **STRONG** | The cleanest daily trigger in the genre: everyone climbs the same real mountain, and it genuinely changes every midnight — no fake scarcity needed. |
| 2 | **Streak weights** `min(days,10)/day`, miss → 1 | Loss aversion + goal-gradient + endowed progress | **MEDIUM** | Real loss aversion and free to earn, but the reset has no mercy narrative (one midnight = −N days), the day-10 cap makes late days emotionally flat, and nothing renders the streak as a *felt* asset. |
| 3 | **Next-day prediction game** (lock ONE call: dir 4 + move 3 + tail 3; scored next day vs the real closed candle) | Commitment & consistency + implementation intention + Zeigarnik open loop + variable outcome (the market is the RNG) | **STRONG design / WEAK delivery** | The best commitment device in the product — locked, public-clock, variable, skill-flavored — but the verdict lands as a 30-character text line (`LAST CALL (…): 7/10 WEIGHTS`): the reveal is a whisper, and calls are private, so social proof never fires. |
| 4 | **Archive practice** 0.5 × max 2/day | Mastery loop + narrative honor ("I survived 2020-03-12") | **STRONG mastery / MEDIUM economy** | Documentary levels are effortless content depth with real honor value; the 0.5 weight is correctly a token but is invisible next to the streak, so practice feels like a favor, not a lane. |
| 5 | **WICK Vault** (peak-wick candle; run must REACH it; wallet ≥1,000 WICK; +1 weight + ember/gold trail) | Near-miss effect + aspiration + endowment (daily trail) | **STRONG design / WEAK delivery** | The strongest blocked-desire moment in the product, wired as a *functional error*: the chest only appears as a button after reaching the peak, denial renders as a server-error line with no path and no exit (`VAULT OPENS FOR HOLDERS — 1,000 WICK MINIMUM`, uppercase, no GET route, no NOT TODAY), and runs that die below the peak say nothing at all — the near-miss never fires. |
| 6 | **Weight snapshot day** (day's snapshot = share of possible future distributions; per-wallet cap 600) | Endowment + anticipated ownership | **DORMANT / WEAK** | The single most powerful future-facing motive is invisible in the game: nothing ever shows a player their own would-be share, and unlinked identities are silently excluded — the motive exists on paper and nowhere in the player's eyes. |
| 7 | **Tier badges** WICK HOLDER / WICK WHALE | Status/identity signaling | **WEAK** | A footer chip reads "NO TIER YET" at the exact coordinate where identity should begin; tiers are visible to nobody but the holder (no ghost render, no card badge shipped); status without witnesses is not status. |
| 8 | **Burn counter** (`SUPPLY BURNED · 254,293 WICK`) | Social proof / deflation narrative | **NONE** | A storyless number: no causality ("every trade feeds this"), no pairing with the meter (it is churn-fed and can rise while the meter falls — economist flag), no ritual. It is an engine mount with no engine installed. |
| 9 | **Public Merkle claim rehearsal** (/airdrop; in-browser proof verification) | Verifiable fairness + endowment preview | **DORMANT-STRONG** | The most trust-building surface in the product and nobody arrives: it reads as an empty technical page because the endowment line ("if the snapshot were today, YOUR ledger shows N") is not rendered for named identities. |
| 10 | **Death card + RIVAL @HANDLE + async duels** | Social ritual / status / public challenge | **STRONG, DORMANT at scale** | Best organic-growth loop in the game; dormant only because reach is frozen — the loop itself is sound. |
| 11 | **Daily report** (folded panel: climbers, deaths, narrative) | Narrative cliffhanger + social proof | **WEAK** | It is folded closed by default and carries no token tie-in (meter/burn lines are post-grad per H4), so the "episode" fires for almost nobody. |
| 12 | **WalletChip** (`CONNECT WALLET — display-only, never affects rank`) | — (identity moment, no engine) | **NONE** | Legally perfect, emotionally inert: it leads with what the wallet does NOT do; post-connect with 0 balance it shows the identity vacuum "NO TIER YET". The connect moment — the door to the entire holder economy — has no engine installed. |
| 13 | **Score submission moment** (SUBMIT SCORE on the death panel) | — | **NONE** | Pure admin. It is also the highest-pride instant in the session — the moment an endowment echo ("this run builds weights — link to count it") belongs. Today the pride is paid out and the ledger goes unmentioned. |

### 1.1 The audit verdict, in one paragraph

The **competence spine is genuinely strong** — daily level, prediction lock, archive
mastery are the best-built links in the product (consistent with the Task-2-b hook audit:
ACTION = A). The **token-facing layer has no rendered desire**: the vault's near-miss is
silent, holder status is invisible, the burn number is storyless, the connect moment is
inert, and the ledger — the thing that would make tomorrow matter — is never shown until
it is too late to join it. The buy motive is not missing from the *design*; it is missing
from the *render*. And the two SDT floors that turn "I play" into "I am someone who plays"
— **relatedness and status** — are the under-built parts of the house, exactly as the
Task-73 memo concluded. Nothing here needs a new engine; it needs engines that already
exist on paper to be **lit**.

Surfaces with **no psychological engine at all** (the honest list): #8 burn line, #12
WalletChip/connect moment, #13 score-submission moment — plus the `graduated` panel's
`graduation: 5 eth class` copy (GameCanvas.tsx:1160), which is worse than no engine: it is
a LAW 4 trust leak (reconciled target is 4.0 ETH) that teaches checking players that our
numbers drift.

---

## 2. THE HONEST ANSWER TO "WHY WOULD ANYONE BUY & HOLD"

The owner doubts the buy/hold motivation design. The doubt is **partially justified**: one
surface (the vault) creates a genuine, lawful desire to hold; most other "reasons" are
currently narrations, not experiences. Here is the complete inventory of legitimate,
non-speculative needs a token can serve in a skill game, and the honest state of each.

| Need | What exists today | What's missing | Realistic strength on TESTNET |
|---|---|---|---|
| **Identity & membership** ("I am a climber; holders carry fire") | The identity is earned free and daily (name, streak, rank); the membership marker (ember trail, badge) exists mechanically | The marker is invisible in social space; no rituals make membership *performed* daily (vault streak, seasons); "NO TIER YET" actively undermines membership for the not-yet-holder | **MEDIUM** — the strongest *available* motive; identity formation works at zero stakes because it is earned in skill, not bought |
| **Status display** ("witness me") | Tier badges + trails defined; death cards and rival tags give real witnessed moments | No witnesses: awareness ≈ zero, ghosts don't render holder warmth, badges are footer-only; status is the need most damaged by the reach freeze | **WEAK today** — status requires an audience; the audience is the missing variable (F1), not the design |
| **Access-to-experience** ("holders open the vault") | The vault: the ONE double-gated experience — reach the peak by skill + hold 1,000 WICK | The denied state is an error line; the peak chest is not visible terrain during play; non-holders never learn the rule exists | **STRONG** — the single genuine buy-motive in the product; honest because the skill part is unbuyable (LAW 1) and the money part buys nothing ranked |
| **Collection / completionism** | Nothing ships (two badges, one daily trail) | History-collision badges, seasonal trail variants, set-completion UI ("7 of 12 famous days") | **DORMANT** — cheap to build, identity-native (documentary levels are already collectible), zero randomness required |
| **Patronage** ("I support a game I love") | True story available: unbuyable scoreboard, real burn, honest ledger | Patronage needs love first; with zero awareness, almost nobody knows the game exists; nothing *tells* the patron story in-game | **WEAK now, real later** — patronage scales with affection; it cannot be the first motive, only the compounding one |
| **Participation in a distribution** (weights → possible future share) | Weights accrue free and daily; ledger is real, public, verifiable | The ledger is never rendered to the player in-game; the connect moment doesn't mention it; the /airdrop preview doesn't address named identities | **MEDIUM, promise-shaped** — on testnet the distribution is a *rehearsal*: real mechanics, no material value. The need works as "my devotion is being counted," which is honest TODAY; its material form arrives only post-grad (and even then: possible, never guaranteed — LAW 4) |
| **Gate to cosmetic self-expression** (trails, skins, frames) | Ember/gold trail granted at the vault; LAW 2 lanes defined | Trail barely visible in motion; no pre-hold self-expression contrast ("what holding adds" is never shown next to "what play already gave") | **MEDIUM** — self-expression is a durable motive, but one daily trail is thin; needs the ladder (§3 Phase 5) |

### 2.1 What the testnet fact actually does to these motives (plain)

Testnet tokens have no monetary value and testnet ETH comes from a faucet. Two
consequences, stated without varnish:

1. **The speculative motive is ≈ zero, and that is a clean experiment.** Whatever buys
   happen pre-grad are bought by identity, membership, access, collection, patronage, or
   participation — nothing else can explain them. This makes the testnet the *honest
   laboratory* for exactly the motives the owner is allowed to use. If the vault moment
   converts here, the design works; if nothing converts here, no amount of mainnet money
   fixes the design, it only hides it.
2. **"Cost" is identity, not money.** The price of buying is a faucet trip and the
   admission "I want to be a holder." That means every conversion mechanic below is
   testing the *identity engine*, which is precisely the engine we are allowed to build.

### 2.2 What changes psychologically at mainnet (say it plainly)

- **Regret becomes possible.** Buying becomes a decision with real downside; the same
  vault-gate that is a light membership click on testnet acquires financial weight. The
  mechanics don't change — their *ethical duty* rises: exits honored, no urgency, no price
  surfaces in game, forever.
- **Loss aversion attacks balances.** Post-grad, a wallet can lapse; tier loss becomes a
  real fear. We refuse to exploit it (no win-back offers, no balance-directed loss
  aversion — red line A.6 of the Task-2-b report); the participation rung (Flamekeeper)
  becomes structurally more important, because it keeps status attachable to *showing up*,
  not to a balance that can fall.
- **The distribution motive becomes material** — and LAW 4 still forbids narrating it as
  the reason to hold. We keep saying "builds weights · nothing guaranteed"; the player may
  privately think in returns; the product must never say it.
- **Speculation arrives uninvited.** We cannot stop holders hoping; we can refuse to
  stoke it. The design defense is to make the non-speculative motives strong enough that
  the game never *needs* price talk — the mountain stays a commerce-free place (two
  buy-adjacent surfaces per session, maximum, chair rule).
- **Status re-attaches to wealth** (costly signaling returns). The whale-gold guard
  ("gold is a color, never a crown") and the never-on-the-leaderboard rule become the
  load-bearing walls of the game's fairness story.
- **Trust becomes expensive.** The "5 eth class" leak that is a P2 copy bug today becomes
  an accusation at mainnet. Honesty debt compounds.

### 2.3 The board's Q2, in one paragraph (hold-to-play)

**No — and not merely because LAW 1.2 says so.** Psychologically, gating play destroys the
competence engine that makes status worth wanting: the scoreboard is meaningful *because*
it is unbuyable; gate it and both ladders collapse at once (a held rank is worthless and a
held badge is invisible). Gating also converts peak-curiosity newcomers — the most
convertible humans in the funnel — into resentful non-players at the exact instant of
maximum interest. Commitment & consistency works better in reverse: free daily play →
identity forms → buying becomes identity-consistent behavior. Gate the *expression* of
belonging (vault, trails, badges), never the game. This is unanimous across council
rounds; it remains this seat's verdict.

---

## 3. THE CYCLE AS A DAY-BY-DAY JOURNEY

The emotional timeline of one player who becomes a holder. Each phase names **the ONE
moment that must not be wasted** — the instant where the phase's entire psychological
work is done or lost. (Fracture references F1–F5 are from the Task-2-b report; this
journey is the time-ordered view of the same loop.)

### Phase 0 · First session — no wallet, no name
**What the player feels:** curiosity (a real market is a level) → competence shock →
first death → "one more" (retries are free and instant; this is the ACTION link, grade A —
protect it, never monetize it).
**Principles firing:** novelty, instant feedback, mastery framing.
**THE MOMENT:** **the first LIQUIDATED panel.** Score, candles passed, rank, the name
field, the Death Card — this is the game's best teaching and pride instant. It must pay
out *pride only*: no money, no wallet, no vault nearby (frustration-window rule). A wallet
mention here would be the fastest trust-kill available.
**Today:** mostly right. Fix in Phase 3's direction, not here.

### Phase 1 · D1 return — streak seeded (1), prediction locked
**What pulls the return:** two investments made yesterday — a streak at day 1 and a locked
call on tomorrow's symbol. The call is the stronger pull (Zeigarnik: an open loop with a
real verdict attached, scored by the real market, not by us).
**Principles:** commitment & consistency, implementation intention, open loop.
**THE MOMENT:** **THE LOCK** — `CALL LOCKED — SCORES TOMORROW VS THE REAL CANDLE`. In that
instant the player has made a promise to themselves about tomorrow. It must be *felt* as a
commitment (today it is a 40-character line), and the next session must open with the
verdict waiting — the loop's return-tick.
**Today:** mechanically shipped (STRONG design); emotionally under-rendered (WEAK
delivery). Also the right instant for the free micro-commitment: "calls build weights
when your name is linked" (Moment C).

### Phase 2 · D2–D3 — the verdict lands; the streak becomes an asset
**D2:** the market's verdict arrives — 4/3/3 partial hits feel *earned*, not won; the
variable reward is skill-attached by construction. (The reveal deserves ceremony; see
Proposal 7.)
**D3:** the streak crosses 3 — the threshold where loss aversion flips from "number" to
"asset" (endowed progress: three days feels like a possession).
**Principles:** variable outcome (market as RNG), loss aversion onset, goal-gradient.
**THE MOMENT:** **the first day the streak is *felt*.** A rendered flame, the next-reset
time visible ("streak resets 00:00 UTC — that's in 6h"), the day-N counter on the death
panel. If the player never *sees* the asset, the reset that eventually threatens it cannot
create the protective behavior loss aversion exists for.
**Today:** the streak lives in an API. This phase's moment is currently **wasted every
day** — the cheapest fix on this page.

### Phase 3 · Days 4–7 — THE FIRST BUY MOMENT
**The designed moment that creates it: the vault gate.** The natural sequence plays out:
days of dying below the peak → honest near-miss telemetry accumulating (`YOU WERE 2
CANDLES FROM THE VAULT`) → the day skill crosses the threshold → **peak reached** → the
chest sits there, visible, locked → pride is paid FIRST (score, rank, card — the climb
already paid out) → then, once: `THE VAULT OPENS FOR HOLDERS · 1,000 $WICK MINIMUM · [GET
$WICK · testnet] · [NOT TODAY]` + the standing free line ("free to play, no wallet
needed").
**The internal script that runs (design for this sentence, honestly):**
> *"I finally did the hard thing. The reward is right there — everyone can see it. It
> isn't rank; my score is untouched either way. It's a testnet token — a faucet trip. The
> mountain stays free. …I want to be someone who opens that."*
Every clause of that script is checkable and true: skill got them there (LAW 1), the
chest buys membership not advantage (LAW 2), the exit is honored, the testnet is stated.
Then the two-step conversion (foot-in-door, honest): **CONNECT** (free, reversible, binds
the ledger) → **BUY** (identity completion). Never jump a cold player from play to
purchase; never show the buy CTA before the connect CTA has been available once.
**THE MOMENT:** **the denied-but-answered chest.** Answered once, honestly, with a path
and an exit — or not shipped at all. Wasted today: for a non-holder who reaches the peak
it resolves as an uppercase error line (`VAULT OPENS FOR HOLDERS — 1,000 WICK MINIMUM`)
with no GET path, no NOT TODAY, no dignity; and for the far larger population who die
below the peak, nothing fires at all. The product's strongest desire generator is
currently an HTTP status code.
**Guardrails:** pride first, membership second; once per session; exit unstyled; testnet
named; never mid-run, never a modal during play (chair D4 envelope).

### Phase 4 · Holder identity — the trail is seen in motion
**What the player feels:** the purchase becomes visible self-expression. Ember trail
renders in their own runs **and in ghosts** (others' replays of their line); the chip
flips from `NO TIER YET` to `WICK HOLDER`; the vault opens → +1 weight → tomorrow it
re-arms.
**Principles:** endowment, identity signaling, the *performed* membership (the key is
held; the fire is re-earned daily by playing).
**THE MOMENT:** **the first run WITH the trail.** The moment money becomes self-expression
instead of expenditure. If the trail is invisible in motion, the buy retroactively reads
as a donation; if it is visible, it reads as joining.
**Today:** the trail is granted (API returns `ember-trail`/`gold-trail`) but witness
surfaces are not built — the identity is owned and never seen.

### Phase 5 · The deeper ladder — whale tier, collection, devotion
**What the player feels:** there is somewhere to *be* here, not just something to have.
- **Vault streak → flame progression → Flamekeeper:** consecutive vault opens become a
  visible participation rung — deliberately shaped so a daily 1,001-WICK climber
  *outranks a silent whale in identity terms* (the structural anti-worship guard; whale
  gets gold *color*, never power, never the leaderboard).
- **Collection:** history-collision badges ("LIQUIDATED AT THE FTX CANDLE · 2022-11-09"),
  seasonal trail variants, set-completion ("7 of 12 famous days"). Deterministic; the
  variable part is which historical moment your own run collides with.
- **Seasons:** a 30-day Ascent, ending in an autobiography badge ("Season 1 · 22 days ·
  flame ×9"). Season reset touches cosmetics and streaks, never banked ledger weights.
**Principles:** status from participation, collection/completionism, narrative identity.
**THE MOMENT:** **the first time the fire is witnessed by someone else** — another
player's ghost passes your ember-trail line, or the daily report notes the vault log. The
day status acquires a witness is the day holding converts from perk to identity.
**Today:** R5 (participation rung) does not exist — the ladder's ceiling is a wallet
amount, which trains the wrong lesson (F4/R5 verdicts, Task-2-b §3).

### Phase 6 · Snapshot anticipation — the ledger becomes personal
**What the player feels:** everything banked — streaks, calls, vaults, practice — is
bound to a wallet and counted; a real, announced snapshot day will take the picture; the
/airdrop rehearsal page lets them verify their own proof *right now*.
**Principles:** endowment (it's yours), anticipated ownership, verifiable fairness (the
strongest lawful form of FOMO: a true date, announced, with "nothing guaranteed" standing).
**THE MOMENT:** **the first time the player SEES their own would-be share** — `IF THE
SNAPSHOT WERE TODAY, YOUR LEDGER SHOWS {N} WEIGHTS — LINK A WALLET TO BIND THEM`,
computed from the real ledger, rendered for any named identity. This is the instant the
abstract "airdrop" becomes *mine*. Spend it on verifiability ("check the proof yourself"),
never on a countdown.
**Today:** the most valuable dormant surface in the product (audit #6/#9). One plain
factual sentence at pride moments about unlinked identities not binding at snapshot —
once, never on a timer (F3's rule).

### The loop closes
Tomorrow's call gets locked again — and the cycle repeats one identity-depth lower each
lap: PLAY → FEEL → EXPRESS → BELONG → IDENTIFY → RETURN → (BRIDGE) → HOLD (chair cycle
v2). The day-by-day journey above is that cycle's psychological timeline. Its two
load-bearing conversion points are Phase 2 (streak felt) and Phase 3 (chest answered) —
both currently unrendered; that is the honest heart of the owner's doubt.

---

## 4. COMPELLING BUT HONEST — habit mechanics without gambling texture

The filter from GROWTH-AND-HOOKS-STRATEGY §5 applies to every row: *if a non-market game
could copy this hook, discard it.* Each mechanic below is deterministic in mechanism and
variable only through skill, the real market, or the player's own history. For each: the
principle, the dark-pattern drift it must be guarded against, and the guardrail sentence
that keeps its copy lawful.

| Mechanic | Principle | Dark-pattern drift risk | Guardrail sentence (the copy law) |
|---|---|---|---|
| **The locked prediction** (one call/day on tomorrow's symbol, immutable once locked) | Promise-to-self: commitment & consistency, implementation intention, Zeigarnik open loop | Guilt-nags and push-spam ("your call is waiting!"); turning the lock into FOMO on the *lock itself* | "The verdict waits for you. It never counts down." |
| **Near-miss telemetry** (`YOU WERE {n} CANDLES FROM THE VAULT`) | Near-miss effect — the most studied motivator in the literature; here it is *true telemetry*, computable, not engineered | Taunting, exclamation styling, repeat denial, and the casino descendant: **pity timers that fake closeness** | "Say it once, factually. The peak speaks for itself." |
| **Streak, bounded and capped** (`min(days,10)`, reset on miss, caps make it fair) | Loss aversion + goal-gradient — bounded so a whale cannot out-grind you | **Streak terror**: punishment stacking, public shaming of broken streaks, paid protection (see §4.2) | "A streak is a diary, not a debt." |
| **Endowment preview** (`IF THE SNAPSHOT WERE TODAY…` on /airdrop) | Endowed progress + anticipated ownership, backed by verifiable fairness | Snapshot countdowns, "don't lose your weights" threats, repeating the unlinked-identity fact until it becomes pressure | "One plain sentence, at a pride moment. Never on a timer." |
| **The Reveal Ceremony** (community's locked calls overlaid on the real candle that resolved) | Variable reward where *the market is the RNG* + social proof + synchrony | Jackpot framing, escalation copy, "bigger reveal" inflation | "The market decides; we only draw what it did." |
| **Collection sets** (history-collision badges, seasonal trail variants) | Completionism / set effects — zero randomness, autobiographical | Limited-time FOMO collectibles, artificial rarity, badge inflation toward pseudo-scores | "Sets are permanent; history doesn't expire." |
| **Vault streak → Flamekeeper** (participation rung over any holding) | Status from participation + identity; the anti-worship keystone | Holder worship, spend-envy, flame creeping toward score-or-weights meaning | "Fire is carried by showing up, not by size." |
| **Whale gold** (color, frame, profile-level) | Status display, witnessed in motion (ghosts), never on the board | Whale worship; a pay-to-be-seen ladder; aura that reads as *better player* (LAW 1 optics bug) | "Gold is a color, never a crown." |
| **Guild belonging** (when guilds exist; aggregate skill only) | Relatedness, superordinate identity, shared fate | Whale-guild boards, Taco-style paid joins, cosmetic arms races | "Guilds climb together; no wallet on any guild board." |
| **Ritual Hour / appointment windows** (announced collective play time) | Appointment mechanics + synchrony — the cheapest relatedness multiplier | Manufactured urgency around windows; fake event scarcity | "The only clock in this game is the real UTC day." |
| **Mercy candle** (missed-streak recovery *earned by play*: e.g. 2 archive runs the next day restore the streak, 1/season) | Fair recovery that keeps loss aversion humane — and the lawful alternative to streak insurance | Infinite forgiveness (kills the engine) or paid forgiveness (the dark version) | "Missed days are recovered by climbing, never by paying." |
| **Holder ghost auras** (ember/gold warmth on holder ghosts) | Status witnessed in motion (LAW 2.1 ghost styling) | Aura reading as power/information advantage | "Warmth, never worth." |

### 4.1 The NEVER list (explicit, consolidated — what we must never do)

1. **Pity timers and engineered fake near-misses** — any "so close!" state not backed by
   real telemetry; any denial-count rigging designed to convert frustration.
2. **Fake countdowns and fabricated scarcity** — "last chance", "only X vaults left",
   urgency that is not the real UTC clock.
3. **Profit framing** — earn, guaranteed, ROI, price talk, "your balance moved", yield
   language; the 75% holder tax share is narrated as a mechanism, never as "you receive".
4. **Variable cash or money-valued rewards on any schedule** — loot boxes, gacha, wheels,
   mystery chests, paid rerolls, variable-ratio anything with money on either side of the
   variable. Deterministic or nothing.
5. **Buy CTAs in the frustration window** — never inside rapid-death sequences or rage
   retry chains; pride moments only; ≤2 buy-adjacent surfaces per session; never mid-run,
   never a modal, never in the Death Card image or share text (D13).
6. **Score, rank, or access for money** — LAW 1; the D1 holder-weight bonus stays RED
   until a dated LAW amendment says otherwise (this seat recommends it never does).
7. **Balance-directed loss aversion** — "protect your position", tier win-back offers,
   sell-shaming, balance-drop notifications. Streaks may use loss aversion (bounded);
   wallets never may.
8. **Confirm-shaming exits** — every exit is an unstyled `[NOT TODAY]`, never "No thanks,
   I hate rewards."
9. **Rewarded referrals and minor-directed status bait** — attribution is tracked,
   never rewarded (B19); no "show them who's whale" copy aimed at anyone's insecurity.
10. **Jargon on player surfaces** — no yield/APY/position/leverage in game copy; testnet
    stated plainly on every money-adjacent surface, with the free-forever line in the
    same breath.

### 4.2 The verdict the owner asked for: is streak insurance honest?

**No — and this is the cleanest test case for the whole compulsion question.** Streak
insurance is pay-to-remove-the-possibility-of-loss. Its defect is structural, not
tonal: the anxiety it relieves is *anxiety the mechanic itself manufactures* — the
"create the disease, sell the cure" pattern is the textbook boundary between engagement
and exploitation. Three further counts: (a) it converts loss aversion from a play-engine
into a revenue-engine, which is the exact moment the mechanic stops being honest; (b) it
pre-builds the mainnet pattern where "protection" spending escalates with stakes; (c) it
is unfair in identity terms — the funded climber keeps a streak the unfunded climber
loses, which reintroduces wallet-status through the back door of mercy. **Verdict:
[FORBIDDEN] at every phase.** The honest alternative costs money to build and nothing to
buy: the **mercy candle** (recovery earned by climbing — table above). Loss aversion is
preserved; the miss converts into a mastery action; no wallet is involved.

---

## 5. NUMBERED PROPOSALS

| # | Proposal | Tag | Priority | Effort | Note |
|---|---|---|---|---|---|
| 1 | **Pride-first panel ordering:** score, rank, card, duel render before any holder-adjacent note on death/graduated panels; buy-adjacent lines never enter the first screenful of a bad-run panel | [LAWFUL NOW] | P0 | S | Enforces the frustration-window rule structurally, not by discipline |
| 2 | **Factual near-miss telemetry** on the death panel: `YOU WERE {n} CANDLES FROM THE VAULT` (computable from candlesPassed vs peak index) | [LAWFUL NOW] | P0 | S | Chair D4 GREEN half; ban exclamation styling; once per session |
| 3 | **Answer the chest:** visible-locked vault render at the peak during play + single post-run denied state with the chair §7 copy triple (`[GET $WICK · testnet] · [NOT TODAY]` + free-forever line) | [LAWFUL NOW] — per CHAIR-VERDICT D4 YELLOW: requires owner sign-off + E3.4 compliance re-read before build | P0 | S | The first-buy moment (§3 Phase 3); wasted today as an error line |
| 4 | **"NO TIER YET" empty-state fix:** render free-side endowment first (`YOUR LEDGER: N WEIGHTS BOUND · streak 4 · 2 calls locked`), then the one holder line (`holder lanes start at 1,000 · testnet`) | [LAWFUL NOW] | P0 | S | F4; endowment before upsell, or don't ship |
| 5 | **Link-at-pride:** after a good run / after THE LOCK, one line — `THIS RUN BUILDS AIRDROP WEIGHTS — LINK YOUR WALLET TO COUNT IT`; the unlinked-identities-don't-bind fact stated once, plainly, never on a timer | [LAWFUL NOW] | P0 | S | Chair D9 GREEN; the free micro-commitment before any buy CTA |
| 6 | **Endowment preview on /airdrop:** for any named identity, `IF THE SNAPSHOT WERE TODAY, YOUR LEDGER SHOWS {N} WEIGHTS — LINK A WALLET TO BIND THEM`, computed from the real ledger; announced snapshot windows as the only "calendar" | [LAWFUL NOW] | P0 | M | Chair D8 GREEN; the Phase-6 moment; verifiability, not countdown |
| 7 | **Reveal ceremony:** upgrade the daily verdict line; weekly overlay image of the community's locked calls drawn over the real resolved candle (honest at any n, labeled) | [LAWFUL NOW] | P1 | M | V1; the market is the RNG — zero gambling texture by construction |
| 8 | **Streak made felt:** next-reset time in the streak UI + milestone autobiography cards (3/7/10/21) derived from the player's own ledger | [LAWFUL NOW] | P1 | S | Phase-2 moment; V4 |
| 9 | **Vault streak → flame progression → Flamekeeper + season badges** (participation rung R5; season reset touches cosmetics/streaks only, never banked weights) | [LAWFUL NOW] | P1 | M | The anti-worship keystone; stays inside the once/day vault faucet (D22) |
| 10 | **History-collision collection badges** (5–10 famous dates, deterministic, cosmetic-only, permanent sets) | [LAWFUL NOW] | P1 | M | V3; "you died where history happened" |
| 11 | **Holder ghost auras** (ember/gold, subtle, free ghosts fully rendered and equal) | [LAWFUL NOW] | P1 | S | Status witnessed in motion; watch the LAW 1 optics rule |
| 12 | **Meter + burn paired line** with one causal sentence, and the LAW 4 copy fix `graduation: 5 eth class` → 4.0 ETH (GameCanvas.tsx:1160) | [LAWFUL NOW] | P0 | S | The burn line alone is churn-fed and can mislead; pairing is the honest render |
| 13 | **Mercy candle** (recovery earned by play, 1/season) as the standing answer to any future "streak protection" request | [LAWFUL NOW] | P2 | M | Replaces the forbidden insurance; cap hard |
| 14 | **Whale rendering rules:** gold at profile level only, never on leaderboard rows (D6/D12); no whale mentions in report copy beyond aggregate vault-log tone | [LAWFUL NOW] | P2 | S | Worship guard; "gold is a color, never a crown" |
| 15 | **Post-grad hold-deepeners:** MIRROR (the token's own chart as a level) + burn-counter narrative + treasury tournaments — build the habit shapes pre-grad, activate on `transfersUnlocked` | [POST-GRAD ONLY] | P2 | L | The strongest identity-consistency locks in the roadmap (H4/H6) |
| 16 | **Holder-weight bonus** (holding grants weights/score) | [NEEDS LAW AMENDMENT] — requires a dated LAW 3.2 amendment + owner sign-off; **this seat recommends never**: it converts the unbuyable-scoreboard story into doubt and puts the variable on money | P2 | — | D1 stays RED; economist dissent of record noted |
| 17 | **Streak insurance (paid protection)** | [FORBIDDEN] | — | — | §4.2 verdict; mercy candle (#13) is the lawful alternative |
| 18 | **Loot boxes / gacha / spins / paid rerolls / pity timers / fake countdowns / variable money rewards / price surfaces in game** | [FORBIDDEN] | — | — | §4.1 items 1–4, 6–9; named so nobody "discovers" them later |

Sequencing note: items 1–6 are the P0 set and together they *are* the first-buy moment
(Phase 3) plus the ledger becoming personal (Phase 6); 7–11 are the compounding identity
layer; 12 is a same-day copy fix; 13–14 are guards. One economy change per week maximum
(spec §9 ritual) — the P0 set should be treated as *one* change: "render the desire that
already exists."

---

## 6. One-line summary for the board

The game already owns an honest compulsion-shaped machine — a shared real mountain, a
visible peak, a locked promise on tomorrow, an unbuyable scoreboard — and the owner's
doubt is aimed at the right place: **the buy motive exists in the design but is unrendered
in the product**; light the chest, let the streak be felt, bind the ledger at pride
moments, and give fire witnesses — then buying is not a transaction, it is joining what
the player already feels part of, and holding stays a daily-performed identity rather than
a bet.

*Related: ECONOMY-LAWS.md (supreme) · WICK-ECONOMY-SPEC.md §5/§7/§9 ·
GROWTH-AND-HOOKS-STRATEGY.md §5/§6/§8 · GLOSSARY-FA.md ·
ECONOMY-COUNCIL/MEMO-PSYCHOLOGY.md (Task-73 round 1) ·
council/2026-10-08-behavioral-psych.md (Task-2-b) · ECONOMY-COUNCIL/CHAIR-VERDICT.md
(D-table, §7 copy pack, §9 honesty box). All weight constants cited are [PROVISIONAL]
per the spec; tier numbers are owner-frozen; no code was touched in producing this
document.*

# COUNCIL SEAT REPORT — BEHAVIORAL PSYCHOLOGIST / RETENTION DESIGNER (Task 2-b)

> Written 2026-10-08 · Seat: behavioral psychology & retention design · Research only —
> wires no code. Precedence: `docs/ECONOMY-LAWS.md` (supreme) → WICK-LAUNCH-FORM-PACK §8
> → WICK-ECONOMY-SPEC → `docs/ECONOMY-COUNCIL/*` (Task 73 round: MEMO-PSYCHOLOGY,
> CHAIR-VERDICT D-table) → this report. Where this report repeats a Task-73 ruling it
> cites it (e.g. D4, D22); where it goes beyond, it is new seat work.
> Sources read: ECONOMY-LAWS.md (full) · GROWTH-AND-HOOKS-STRATEGY.md (full) ·
> WICK-ECONOMY-SPEC.md (full, §7 weights) · GAME_DESIGN.md · ECONOMY-COUNCIL memos +
> CHAIR-VERDICT · live client code (GameCanvas.tsx vault/practice wiring, WalletChip.tsx,
> PredictionPanel.tsx). Verified constants used: meter 0.1574/4.0 ETH = 3.94% (2026-10-07
> E0.4 read) · transfers locked pre-grad · tiers holder ≥1,000 / whale ≥100,000 ·
> weights = streak min(N,10) + prediction 4+3+3 + practice 0.5×2 + vault +1/day.
> TAG LEXICON: [SAFE]/[GRAY]/[FORBIDDEN] · [PRE-GRAD]/[POST-GRAD] ·
> [BUILD-NOW]/[DESIGN-ONLY] · + one-line risk per proposal.

---

## 1. THE CURRENT LOOP IN HOOK-MODEL FORM (trigger → action → variable reward → investment)

The four links, audited against shipped behavior (not spec prose):

| Link | What exists today | Grade | Verdict |
|---|---|---|---|
| **TRIGGER** | In-session triggers only: daily seed reset, "TOMORROW'S MARKET" banner, mutation banner. Zero owned external triggers (no push/email; X cadence frozen E5, owner-only). Internal trigger ("new day = new mountain") forms only for streak players. | **C** | The loop fires only when the player remembers the game exists. |
| **ACTION** | ~90s level, free unlimited retries, prediction lock 1/day, archive practice, ghost/rival toggle — all one click, all walletless. | **A** | Best-built link in the product. Protect it; never monetize it. |
| **VARIABLE REWARD** | Prediction scored vs the real candle (true market variable reward); daily mutation (5-pool, seed-derived); rank movement; vault trail (ember/gold). All REAL — but resolve as quiet text lines: no ceremony, no reveal event, no next-morning pull. | **B−** | Rewards exist; reward *salience* is broken. The market's verdict lands overnight and nobody is summoned to see it. |
| **INVESTMENT** | Streak (min(N,10)), locked tomorrow-call, weights ledger, remembered name/rival handle, optional wallet link. | **B** | Strong within one identity — and that is exactly where it breaks. |

### 1.1 Where the loop BREAKS — five precise fracture points

**F1 · The between-session silence.** The loop has no external trigger. The daily
report (H4) and X cadence exist on paper but are owner-frozen; nothing pings "the
mountain changed." The streak's loss-aversion engine does the remembering alone —
and a habit carried by one lever dies the first time life interrupts for 2 days.
Fix is distribution (owner lever), not more mechanics. [SAFE] [PRE-GRAD] [DESIGN-ONLY]
— risk: none mechanical; the binding constraint is owner-frozen reach (standing council finding).

**F2 · Reveal without ceremony.** "CALL LOCKED — SCORES TOMORROW VS THE REAL CANDLE"
plants a textbook Zeigarnik open loop — and then the loop closes as a number in a
read API. No overlay of your line on the real candle, no community reveal, no pull
back at reveal time. The single best variable reward in the game resolves in whisper.
[SAFE] [PRE-GRAD] [BUILD-NOW] (aggregation + render of already-stored data)
— risk: low participant count early renders an empty overlay; show it honestly at any n (community-of-3 is still a community, labeled as such).

**F3 · The anonymity cliff (THE wallet/buy transition break).** Every investment an
anonymous player makes — streak days, locked calls, practice weight — binds to a
*name*. The snapshot binds to a *wallet*. Unlinked identities are excluded at snapshot
(spec §7.3). So the player's accumulated self has a silent expiry date, and the game
never says so at the moment of maximum motivation. The connect CTA the player does see
("CONNECT WALLET — display-only, never affects rank") is legally perfect and
emotionally inert: it leads with what the wallet does NOT do. Then, connected with 0
balance, the chip says **"NO TIER YET"** — an identity vacuum installed at the exact
coordinate where identity should begin. And the buy itself happens off-site on the pad
with no narrated return path ("I bought — now what?" → they must come back and connect
for the RPC read to even notice). The bridge has no on-ramp paint, no midspan, no
off-ramp. [GRAY→GREEN as framed in CHAIR-VERDICT D8/D9/D11] [PRE-GRAD] [BUILD-NOW]
— risk: the factual "unlinked identities don't bind at snapshot" line must be stated once, plainly, never as threat or countdown; over-repetition converts an honest fact into pressure.

**F4 · The "NO TIER YET" dead state.** Post-connect, 0 WICK, the player is shown what
they lack. Missing: the pre-hold identity the game CAN give for free (name, streak
flame, ledger count) rendered beside the one thing holding would add. Empty state must
say "here is what you already built (N weights bound) · holder lanes start at 1,000"
— endowment before upsell. [SAFE] [PRE-GRAD] [BUILD-NOW] (copy + render, D11-compatible)
— risk: none if the free-side endowment renders FIRST and the holder line is a suffix, not a headline.

**F5 · The vault's silent near-miss.** The strongest blocked-desire moment in the
product — reaching today's peak wick, the thing most players never do — currently
resolves for non-holders as a server error line, and for players who die below the
peak as nothing at all. Desire is generated and not rendered. (Full analysis §2.)
[GRAY] [PRE-GRAD] [BUILD-NOW] (D4 YELLOW: owner sign-off + compliance re-read)
— risk: a denial state is the easiest surface in the game to make resentful; one line, once per session, exit honored, or don't ship it.

**Net hook-model reading:** trigger weak (owner lever), action excellent, variable
reward under-rendered, investment strong-but-broken at the anonymity boundary. The
loop does not need a new engine; it needs the reveal lit, the cliff painted, and the
empty states filled.

---

## 2. THE WICK VAULT MOMENT — psychological anatomy

The setup, stated exactly: a player climbs to today's peak-wick candle *by skill*
(the thing the game taught them matters), and the chest there opens only for wallets
holding ≥1,000 WICK. This is the product's most powerful and most dangerous moment.

### 2.1 Emotions available at the locked chest

| Emotion | Mechanism | Verdict |
|---|---|---|
| **Aspiration** | "I want to be someone who opens that." Durable, identity-shaped, compounds across days because the vault re-arms daily. | **USE — primary.** This is the emotion that converts to a voluntary first buy without pressure: membership as completion of an identity already earned. |
| **Fairness flare** | "I EARNED the summit by skill and it's about MONEY?" The most corrosive available emotion, and a young audience feels it fastest. | **DISARM, never exploit.** Copy must pre-empt it: the climb already paid out (score, rank, Death Card); the vault was never the climb's reward — it is a membership perk that happens to live at the summit. Two ledgers, visibly separate. |
| **FOMO** | Legitimate here *because it is true*: the day really ends, the vault really re-arms tomorrow, one open per day, identical for everyone. | **USE only in its true-time form.** No countdowns, no fabricated scarcity. The clock is the UTC day — the one honest clock the game owns. |
| **Near-miss** | Peak visible to all, passed by few; "you were n candles from the vault" is computable, honest telemetry (chair D4 GREEN half). | **USE once, factually.** Near-miss is the single most studied motivator in the literature; it must stay telemetry, never taunt. |
| **Pride** | Passing the peak at all is a top-fraction skill event. | **PAY IT FIRST.** Non-holder peak-reachers get rank/card/pride BEFORE any membership note. Order of emotional beats: competence → aspiration. Reverse the order and you manufacture resentment. |
| **Resentment** | The corrosion state: skill felt devalued, free player felt pitied. | **NEVER TRIGGER.** Early symptom to watch: copy that makes the free climber the subject of the vault sentence ("you can't open"). The lawful sentence makes the HOLDER the subject ("holders open the vault") and the free climber the respected default ("the climb stays free, no wallet needed"). |

### 2.2 The ethical line, drawn

**Lawful use (all inside CHAIR-VERDICT D4's envelope):**
- Render the vault at the peak as *visible terrain everyone can see* — aspiration for
  all, membership for holders. [SAFE] [PRE-GRAD] [BUILD-NOW] — risk: low; purely additive render.
- Denied state, post-run only, once per session, exit honored: `THE VAULT OPENS FOR
  HOLDERS · 1,000 $WICK MINIMUM · [GET $WICK · testnet] · [NOT TODAY]` + standing
  free-play line (chair §7 placement 1). [GRAY] [PRE-GRAD] [BUILD-NOW after owner
  sign-off + E3.4 compliance re-read] — risk: it is a denial state in a LAW 2 lane; the moment it renders mid-run, as a modal, or twice in a session, it flips from invitation to pressure.
- Near-miss echo on the death panel: `YOU WERE {n} CANDLES FROM THE VAULT`. [SAFE]
  [PRE-GRAD] [BUILD-NOW] — risk: none if purely factual; ban adjacent exclamation styling.
- Holder-side: vault streak → flame progression → "Flamekeeper" (participation-shaped,
  not balance-shaped). [SAFE] [PRE-GRAD] [DESIGN-ONLY] (season system B17) — risk: must stay capped at the once/day vault faucet (D22 standing rule) — the vault is the ONE holder-gated weight faucet, forever; any generalization is RED.

**Crosses the line (named, so nobody "discovers" them later):** repeat-denial
messaging; guilt framing ("you climbed all that for nothing"); any implication of rank
or score impact; ETH/price value shown at the chest; "only X vaults left" fabrication;
countdown urgency beyond the real UTC day; mid-run interstitials; humiliation styling
of the denied player; vault denial inside the Death Card image or share text (already
REJECTED, D13); escalating the +1 weight with balance (REJECTED, D1 — auditor RED).

### 2.3 The one-sentence ethics of the vault

**The mountain pays in score, the vault pays in membership — and the player must be
able to read both ledgers at a glance, every time, forever.** The day a player cannot
tell which ledger paid them, the game has begun to lie.

---

## 3. THE COMMITMENT LADDER — anonymous → named → connected → holder → tier → whale

Six rungs. Per rung: pull to the next, identity signal, honest loss-aversion/status
mechanic, build state. Two-ladder law holds throughout (§5): nothing here touches
score, rank, base access, or the leaderboard (LAW 1; never-list §7.4).

| Rung | State today | PULL to next rung | Identity signal | Honest loss-aversion / status mechanic |
|---|---|---|---|---|
| **R0 · Anonymous visitor** | EXISTS, complete — full game, walletless (LAW 1.2). | "Put your name on today's board" + authorship of the Death Card. The name is the first identity act and it is FREE. | Board listing; card byline. | Competence display only. Nothing owed, nothing withheld — respect is the rung's mechanic. |
| **R1 · Named player** | EXISTS (name + W1 run-token). | **The ledger pull:** "THIS RUN BUILDS AIRDROP WEIGHTS — LINK YOUR WALLET TO COUNT IT" (D9 GREEN) + endowment preview on /airdrop (D8 GREEN): `IF THE SNAPSHOT WERE TODAY, YOUR LEDGER SHOWS {N} WEIGHTS`. | Name on board; streak count; (proposed) subtle chain-stitch mark once linked. | The ONE factual loss fact: unlinked identities don't bind at snapshot. State it once, plainly, at a pride moment — never as threat, never on a timer. |
| **R2 · Wallet-connected, 0 WICK** | EXISTS technically; **emotionally MISSING** — "NO TIER YET" reads as failure (fracture F4). | "Holder tiers & vault start at 1,000 · GET $WICK · testnet" (D11 approved copy) — but rendered AFTER the free endowment: "your N weights are now bound to you." | Chip exists; needs the pre-hold identity row (streak flame, ledger count, calls locked). | None yet — correct. Pre-hold status must come from play; the empty state shows what play already bought. |
| **R3 · Small holder ≥1,000 (EMBER)** | EXISTS: vault opens, ember trail that day, HOLDER chip. | Gold color at the next tier — recognition, never power. | Ember trail visible in own runs AND in ghosts (LAW 2.1 lists ghost styling — use it: status is seen while playing, §5). | **The honest dual key:** holding keeps the KEY (vault eligibility persists); *playing* keeps the FIRE (trail is daily, re-earned by climbing). Loss aversion attaches to the streak/flame, never to the balance. |
| **R4 · Higher tier ≥100,000 (WHALE)** | EXISTS as chip label only. | The ladder's top rung is NOT spending more — it is R5. Pull = named recognition rituals (report mentions, card badge) with strict worship guards. | Gold trail, gold frame — **profile-level only, NEVER on the leaderboard** (D6). | Status mechanic is color + membership visibility; the guard is that gold buys nothing the scoreboard respects. Whale-gold on shared cards needs owner sign-off (D5) — whale-worship optics are a real risk. |
| **R5 · Devoted (participation layer over any holding)** | **MISSING — highest-value missing rung.** Flamekeeper / vault streak / season badges (D6 approved in principle). | Terminal rung — pull is inward: season autobiography ("Season 1 · 22 days · flame ×9"). | Named trail variants, season badge, vault-streak flame. | Season reset touches cosmetics/streaks only, never banked weights (D6). This rung exists so a daily 1,001-WICK climber visibly outranks a silent whale in identity terms — the structural guard against spend-worship. |

**Ladder verdicts.** R0–R1 exist and are strong. R2 is built but emotionally hollow —
the cheapest fix in this whole report (F4 copy/render). R3–R4 exist mechanically and
are invisible socially — persistence (D5) and ghost-rendering carry them. R5 is the
missing keystone: without it, the ladder's ceiling is a wallet amount, which trains
exactly the wrong lesson.

**Reverse-pull guard (post-grad, transfers unlock):** tiers re-read on connect; trails
dim when balance lapses — styled as weather, never as shame ("the ember rests"). No
"win-back your tier" offers, no discount logic, no balance-drop notifications.
[SAFE] [POST-GRAD] [DESIGN-ONLY] — risk: none; the refusal is the feature.

---

## 4. VARIABLE REWARDS — four new moments that fit a skill game

Design filter (per the §5 bar in GROWTH-AND-HOOKS-STRATEGY): if a non-market game
could copy it, discard it. The market is already the master variable reward; our
additions must be *deterministic in mechanic, variable in outcome by skill + market*,
and cosmetically/structurally scored at most. No loot boxes, no monetary value, no
gambling texture (LAW 4; chair §9).

**V1 · THE REVEAL CEREMONY (prediction overlay).** Weekly (Fri/Sat), one image: every
player's locked route drawn over the REAL candle that resolved. "The community drew
this; the market drew that." Turns the game's best open loop into its best relatedness
ritual; the market itself is the randomizer, so zero gambling texture by construction.
[SAFE] [PRE-GRAD] [BUILD-NOW] — risk: cold-start emptiness; render honestly at any n and label n.
(Consistent with psych-memo §5 Friday reveal + H5's dormant social layer; new here as a *variable-reward moment* with a fixed weekly slot.)

**V2 · TOMORROW'S CONDITIONS teaser.** Daily mutations are already seed-derived and
uniform for everyone; after tonight's prediction lock, show tomorrow's mutation name
("TOMORROW: WHALE HOUR"). Everyone who can read code could compute it anyway — so
revealing it is uniform information, not advantage. Effect: a second informed reason
to return ("floaty day — worth keeping the streak") and a curiosity trigger that is
pure terrain, not prize. [SAFE] [PRE-GRAD] [BUILD-NOW] — risk: tiny — slightly reduced boot-morning surprise; acceptable trade for a second daily-return hook.

**V3 · ARCHIVE DISCOVERY badges — "you died where history happened."** Archive runs
already record exact death positions; famous candles are known data. When a death or
summit lands on/near a historically famous candle (2020-03-12 top, LUNA wick, FTX
day), grant a deterministic cosmetic badge: "LIQUIDATED AT THE FTX CANDLE · 2022-11-09."
Autobiographical, collectible, shareable, zero randomness — the *variable* part is
which historical moment your own run collides with. [SAFE] [PRE-GRAD] [BUILD-NOW]
(badge logic is deterministic; start with 5–10 hand-curated famous dates) — risk: badge inflation; hard rule: cosmetic-only, never weights, never leaderboard-adjacent.
This is the identity-native answer to "daily character rotation" — our rotation is documentary, not cosmetic-random.

**V4 · STREAK MILESTONE autobiography — "the tenth candle."** At streak milestones
(3/7/10/21), a personal stat card derived from the player's own ledger: "Day 10 —
you have climbed 34 levels; your ghost has fallen hardest at the 14:00 candle; your
best call was Tuesday." Variable because it is aggregated from one's own play; a
mastery mirror, not a prize. Caps untouched. [SAFE] [PRE-GRAD] [DESIGN-ONLY]
— risk: negligible; keep it cosmetic/profile-level and never let milestone copy imply a reward is coming.

**Deliberately REJECTED variable rewards:** mystery chests / spin wheels / cosmetic
gacha (variable-ratio + money-adjacent = FORBIDDEN under LAW 4 and psych-memo §6.1);
"rare drop" vault contents (the vault must stay deterministic: +1 weight + trail, D22);
leaderboard lottery events; any reward schedule whose primary variable is spend.
[FORBIDDEN] [PRE-GRAD/POST-GRAD] — risk of shipping any of them: the trust moat (unbuyable scoreboard + honest mechanics) is the product's only durable asset on a testnet.

---

## 5. SOCIAL / STATUS LAYER — desire to hold without weights on the board

**Master rule — the two ladders, never blurred:**
- **SKILL LADDER** (public, unbuyable, LAW 1): today's rank, duel record, PB, streak. Holding can never appear here — no tier chips, no tooltips, no badges on leaderboard rows (chair REJECTED D12). This ladder's purity is why climbing it means anything.
- **IDENTITY LADDER** (LAW 2 lanes): chip tier, trails, badges, ledger weights. Desire to hold flows from THIS ladder being *visible in social space* — seen while playing, not while ranking.

Per-surface design:

- **Ghosts** (default ON, in-run): the highest-leverage holder-visibility surface in
  the product, because it is seen during play, not on a ranking. Holder ghosts carry a
  subtle ember/gold aura (LAW 2.1 explicitly permits ghost styling); free ghosts stay
  fully rendered and equal — difference is warmth, never worth. [SAFE] [PRE-GRAD]
  [BUILD-NOW] — risk: styling must stay subtle; a glowing whale ghost that reads as a better *player* would be a LAW 1 optics bug even with clean physics.
- **Rival bot + duels:** ritualize (Wed duel day, rival @HANDLE stamp already shipped).
  Duel record is skill-ladder — unbuyable, never tier-flavored. [SAFE] [PRE-GRAD]
  [BUILD-NOW cadence, zero code] — risk: none; cadence is owner-account work (X posting frozen E5).
- **Guilds:** blocked on owner (O-G). Pre-design: aggregate *skill* scores only; guild
  chest is a post-grad sink (D16); NO balance-based guild ranking, ever — a "whale
  guild board" is the fastest way to convert guild belonging into spend pressure.
  [SAFE] [POST-GRAD] [DESIGN-ONLY] — risk: guild meta-competition can smuggle in pay-to-win via cosmetics arms races; keep guild cosmetics uniform by design.
- **Daily report (H4):** the social paper of record. Add a factual VAULT LOG line
  ("3 holders opened the vault on TSLA today") — *not* on the leaderboard, not a
  name-shame list, tone = weather report. [GRAY] [PRE-GRAD] [DESIGN-ONLY] — risk: proximity to bragging; keep it aggregate-only, no names, or cut the line.
- **/airdrop claim board:** the membership ledger — the place where *participation* is
  visible and verifiable. Endowment preview (D8 GREEN) + weekly snapshot preview with
  "NOT final · nothing guaranteed" (D7). Distinct visual language from the leaderboard
  (different page, different tab, different palette accent) so the two ladders never
  visually merge. [SAFE] [PRE-GRAD] [BUILD-NOW] — risk: the board must never sort as a "who's richest" proxy — it sorts by weights (participation), and wallet caps already bound it; keep the top-weights publication review (B18) before any real snapshot.
- **Death Card:** cosmetic ember/gold badge allowed on render (D5); NO $WICK line in
  card or share text (REJECTED D13); attribution via `?r=dc` only. [SAFE] [PRE-GRAD]
  [BUILD-NOW] — risk: the card is the outbound viral surface; one monetized pixel there converts mockery into marketing and kills the share loop.

**What "feeds the desire to hold" here, precisely:** not the leaderboard, not weights,
not access — it is *being seen carrying fire while playing* (ghosts, trails, card
badges) plus *the vault being visible terrain at the summit everyone climbs toward*.
Status is witnessed in motion. That is the honest social engine of demand.

---

## 6. ETHICAL RED LINES — global, possibly-young audience, TESTNET

Beyond the written laws (LAW 1–5, pack §8, psych-memo §6, chair §9), the seat adds
these as permanent refusals for THIS audience profile:

**A. Never-again list (mechanics)**
1. No variable-ratio mechanics with money on either side of the variable — no loot
   boxes, gacha, wheels, mystery chests, paid rerolls of chance. Deterministic or
   nothing. [FORBIDDEN] [PRE-GRAD/POST-GRAD]
2. No purchase flow inside the game — outbound link only; the pad's own KYC/context is
   the airlock. Never frame the game's completion as one buy away. [FORBIDDEN]
   [PRE-GRAD]
3. No buy CTA in the frustration window: never within rapid-death sequences, rage
   retry chains, or after N consecutive losses — pride moments only (chair §7 rule,
   here made explicit as a refusal). [FORBIDDEN] [PRE-GRAD]
4. No price/ROI surfaces in the game UI: no portfolio value, no fiat equivalents, no
   "your balance moved" notifications, no price-chart excitement triggers. Price talk
   lives on the token page, outside the mountain. The game notifies about TERRAIN and
   RITUALS, never about PRICE. [FORBIDDEN] [PRE-GRAD/POST-GRAD]
5. No urgency engineering on money-adjacent surfaces: no countdowns except the real
   UTC day, no fabricated scarcity, no "last chance," no confirm-shame exits. [FORBIDDEN]
6. No loss-aversion applied to balances: streaks may use loss aversion (bounded,
   capped); wallets never may. No "protect your position" mechanics, no tier-win-back
   offers, no sell-shaming. [FORBIDDEN] [POST-GRAD especially]
7. No minor-directed acquisition: no referral-For-weights loops (attribution `?r=` is
   tracked, never rewarded — B19), no user-level tracking (E5.5 is aggregate-only), no
   engagement bait aimed at kids' status insecurity ("show them who's whale"). [FORBIDDEN]
8. No jargon on young-audience surfaces: no "yield/APY/position/leverage" in game
   copy; the 75% tax share is narrated as a mechanism, never as "you receive." [SAFE
   rule] [PRE-GRAD] — risk of violation: a securities-tone game invites both regulators and cynicism.

**B. Honest-copy rules for EVERY "GET $WICK" touchpoint (the checklist)**
- Mandatory triple, every surface: **testnet stated plainly · no monetary value · the
  game stays free, no wallet needed.** (Chair §7 verbatim lines already encode this.)
- Verbs allowed: get · hold · carry · open · join · link. Verbs banned: earn ·
  guaranteed · invest · profit · buy the dip · don't miss · last chance · cash out.
- The free player is always named in the same breath ("free to play, no wallet
  needed") — the CTA never stands alone.
- Exit honored and unstyled: `[NOT TODAY]` — never "No thanks, I hate rewards."
- Frequency caps: ≤2 buy-adjacent surfaces per session (chair standing rule); never in
  Death Card content/share text; never adjacent to leaderboard or score submission.
- Every claim traceable: numbers live-read from chain or fail open; no invented
  figures (LAW 4); the meter is the only number allowed to trend, and it is real.

**C. The seat's one-line test for any future mechanic:** *if it stops working the day
the token becomes worthless, it was a money hook, not a game hook — and it will
corrode trust exactly when the product needs trust most.* Design what survives
worthlessness: mastery, ritual, identity, membership, witness.

---

## 7. SEAT SUMMARY — the loop as it should be

```
TRIGGER      new UTC day + ritual hour + reveal slot (owner-frozen reach; design ready)
   ↓
ACTION       climb · lock tomorrow's call · practice archive (excellent; protect)
   ↓
VARIABLE     market verdict CEREMONY (V1) · mutation tease (V2) · history collisions (V3)
REWARD       · milestone autobiography (V4) · vault membership (deterministic)
   ↓
INVESTMENT   streak · locked call · ledger → LINKED at a pride moment (F3 fix)
   ↓
IDENTITY     chip tiers with real cosmetics (R2→R4) · Flamekeeper/seasons (R5, missing keystone)
   ↓
(BRIDGE)     vault-denied moment · endowment preview · chip empty state — outbound, capped, honest
   ↓
HOLD         daily re-armed vault · visible fire · witnessed status · MIRROR at graduation
```

*Related: ECONOMY-LAWS.md (supreme) · WICK-ECONOMY-SPEC.md §5/§7/§9 ·
GROWTH-AND-HOOKS-STRATEGY.md §5/§6/§8 · GAME_DESIGN.md §2/§6 ·
ECONOMY-COUNCIL/CHAIR-VERDICT.md (D-table + §7 bridge copy + §9 honesty box) ·
ECONOMY-COUNCIL/MEMO-PSYCHOLOGY.md (Task 73-b, this seat's prior round).*

---

## TL;DR

1. Hook audit: ACTION is excellent, VARIABLE REWARD is real but unrendered, TRIGGER is owner-frozen silence, and INVESTMENT breaks at the anonymity cliff — name-bound play vs wallet-bound snapshot, with "NO TIER YET" installed where identity should start.
2. The buy transition is not missing a nudge; it is missing three renders: link-at-pride (D9), endowment preview (D8), and a pre-hold empty state that shows what play already bought (F4 fix).
3. The vault is the product's strongest honest moment: pay pride FIRST, state membership plainly once, honor the exit — the denial surface flips from invitation to pressure the moment it renders mid-run or twice per session.
4. Ladder verdict: R0–R4 exist mechanically; R2 is emotionally hollow; R5 (Flamekeeper/seasons, participation-over-spend) is the missing keystone that stops the ladder ending at a wallet amount.
5. Four new variable rewards, all skill-attached and market-native: weekly REVEAL CEREMONY (V1), tomorrow's-mutation tease (V2), archive history-collision badges (V3), streak autobiography (V4) — zero gambling texture, zero monetary value.
6. Social engine: status is witnessed IN MOTION (ghost auras, trails, card badges), never on the leaderboard; two ladders stay visually and structurally separate.
7. Red lines added beyond law: no price surfaces in game, no buy CTAs in the frustration window, no rewarded referrals, no balance-directed loss aversion, no jargon; every GET $WICK line carries testnet + no-value + free-forever triple.
8. One change per week max; vault stays the single holder-gated faucet (D22); reach, not mechanism, remains the binding constraint — F1 showcase is still the owner's key.

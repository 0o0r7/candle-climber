# C — LAWFUL DESIGN SPACE MAP (Compliance & Platform-Constraints seat)

> Task ID: **73-c** · Written 2026-10-08 · Seat: Compliance & Platform-Constraint Reviewer.
> Research on paper only — this document wires no code, changes no law, commits nothing.
> Precedence I enforce: `docs/ECONOMY-LAWS.md` (supreme) ← `WICK-LAUNCH-FORM-PACK.md` §8
> language red lines ← `docs/WICK-ECONOMY-SPEC.md` ← any proposal, memo, or verdict.
> Where the council envelope (RED-LINE AUDITOR, Task 73-d) is stricter than the law, the
> stricter reading governs until the owner amends with a dated note (LAW 5.3).
>
> Platform constraints verified 2026-10-07 (E0.4 snapshot ritual + pad API): lifecycle
> `CURVE_TRADING` · meter **0.1574 / 4.0 ETH = 3.94%** · **`transfersUnlocked=false`** ·
> trade tax 2% (75% holders / 20% treasury / 5% burn) · 254,293 WICK burned (evidence
> reconciliation pending, see §2) · wallet cap 2% of supply · utility-track incentive lane
> 1.5% of ecosystem supply ($WICK's claim = real playable product).
>
> **The single hardest platform constraint:** `transfersUnlocked=false` means every
> pre-graduation token "spend/burn/stake/reroll" mechanic is *impossible and unlawful*
> regardless of what our laws say — balance is read-only until graduation. Pre-grad, the
> only lawful holder primitives are **read-only balance checks** gating LAW 2 lanes and
> **buy-from-curve + hold**. Nothing else exists.

---

## 1. LAWFUL SPACE MAP — decision table

Legend: `[LAWFUL NOW]` lawful under current law today · `[POST-GRAD ONLY]` unlawful/
impossible before `transfersUnlocked=true`, lawful after inside LAW 2/3.3 ·
`[NEEDS LAW AMENDMENT]` conflicts with a specific law line; possible only via the §3
procedure · `[FORBIDDEN]` permanently off the table (§4) · `†` = lawful *by law* but
gated by the council envelope (owner sign-off + compliance re-read required before build).

### (a) Outbound links / CTAs from game → token buy page (Q1 bridge)

| Candidate mechanic | Class | Deciding law / line | Conditions |
|---|---|---|---|
| Footer link to platform home (already live, `GameCanvas.tsx:1289`, labeled "vibe/vibe testnet", `rel="noopener noreferrer"`) | **[LAWFUL NOW]** | LAW 4 (testnet stated plainly); auditor §5.2 DO pattern | Keep neutral label + no earnings verbs. This is the existing baseline; no token-page link exists in code yet. |
| Passive informational link: ready-screen meter/burn line → token page ("GET $WICK · testnet · no monetary value", paired with "free to play, no wallet needed") | **[LAWFUL NOW]** | LAW 4 red lines; auditor §5.2/§5.3; chair D3/B4/B6 | Live-read meter, never hardcoded; max two buy-adjacent surfaces per session (psych cap, adopted); never adjacent to PLAY/retry. |
| Wallet-chip empty state buy line ("You hold 0 $WICK · tiers & vault start at 1,000 · GET $WICK · testnet") | **[LAWFUL NOW]** | LAW 2.1 display lane; auditor explicitly allows the "no tier yet" state (chair D11 GREEN) | Post-connect context; copy from chair §7 verbatim; no urgency texture. |
| Buy link in the vault-fail (denied) state | **[LAWFUL NOW]†** | Not a law violation: denial is not a grant moment, so auditor no-go 4 ("never inside grant messages") does not bite; LAW 4 governs copy | Envelope YELLOW-4: owner sign-off + compliance re-read (chair D4). Exit honored ("NOT TODAY"), post-run only, never mid-run/modal. |
| Death/grad panel one-line buy footer below the share CTA | **[LAWFUL NOW]†** | Same as above (chair D10; auditor YELLOW-4) | Never inside the Death Card image or share text (that row is FORBIDDEN). |
| Leaderboard row tier-badge tooltip with buy link | **[FORBIDDEN]** | Auditor no-go 2 (never in score flows/leaderboard rows); psych scoreboard-adjacent ban; LAW 1.3 spirit | Chair D12 REJECTED. Do not re-propose. |
| $WICK line inside Death Card content or share text | **[FORBIDDEN]** | Auditor no-go 2; LAW 4 (juxtaposition of reward moment + buy = earnings implication) | Chair D13 REJECTED; share text stays clean. |
| Interstitial/modal/auto-redirect/countdown to the buy page; any CTA on or beside PLAY/retry; CTA in victory/celebration moments | **[FORBIDDEN]** | Auditor no-go 1 & 5; LAW 4 (no urgency/FOMO) | Permanent. |
| In-game swap widget / in-app purchase of $WICK (ETH in, tokens out, inside our app) | **[FORBIDDEN]** | Council standing rule "outbound-only, the buy happens on the pad" (chair §7); platform-permission optics; custody/allowance surface we must not own | Revisit only as an explicit owner-level platform decision, not a design choice. |
| **Attribution**: outbound `?r=` / placement codes via own redirect `/api/go/{placement}`, aggregate counters `{placement, day, count}`, inbound first-touch-wins buckets | **[LAWFUL NOW]** | LAW 4 (no invented numbers — measured data only); chair D20 | Aggregate-only, no user-level data, fail-open. Note: existing outbound links use `rel="noopener noreferrer"` → the Referer header is stripped; attribution MUST be explicit URL codes, never referrer-based. |
| **Rewarded referrals** (weights/rewards for referring buyers; paid joins a la Taco) | **[NEEDS LAW AMENDMENT]** → recommend **never** | LAW 3.2 "weights reward **participation** (daily streaks, route predictions, archive marathons)" — a referral bonus is not a gameplay event | See §3-B. Growth council already tagged paid joins [FORBIDDEN]. |

### (b) Requiring holding for anything (Q2 — the law's answer is already written)

| Candidate mechanic | Class | Deciding law / line | Conditions |
|---|---|---|---|
| Hold-to-play the ranked daily level; hold-to-submit; hold-to-duel; hold-to-browse archive | **[FORBIDDEN]** | **LAW 1.2**: "The base game is free, forever, walletless: today's daily level, the retry loop, score submission, the leaderboard, duels, and archive browsing never require holding $WICK or connecting a wallet." LAW 1.3 makes it a "red-line bug, not a design choice." | Unanimous council verdict. Do not amend (§3-A note). |
| Any gating of score/multiplier/rank/submission on balance, stake, burn, lockup, NFT | **[FORBIDDEN]** | **LAW 1.1** (verbatim list), LAW 1.3 | Permanent. |
| Holder-gated cosmetics: skins, trails, name colors, ghost styling, emotes | **[LAWFUL NOW]** | **LAW 2.1** "Pure render-layer: no physics, no scoring, no information advantage" | Free climbers must never be styled as lesser (honesty box). Whale-tier badge optics = owner sign-off (D5). |
| Guild-visible holder badges / identity signals | **[LAWFUL NOW]** | LAW 2.1 + 2.4 (additive, score-blind) | Identity, not power; never rendered on leaderboard rows (that is D12 territory). |
| Base archive browsing gated on holding | **[FORBIDDEN]** | LAW 1.2 explicitly includes "archive browsing" in base access | Note the split with the row below. |
| **Extended** archive: deeper history, practice marathons, holder-gated practice surfaces | **[LAWFUL NOW]** | **LAW 2.3**: "Archive terrain is practice-only and unscored by existing rule; selling access to practice is lawful, selling rank is not." | Must stay unscored (LAW 2.4). |
| Holder-only ranked modes ("Summit tier" ranked runs, holder duels) | **[FORBIDDEN]** | **LAW 2.4**: "a holder run is never ranked onto the public leaderboard with any advantage a non-holder cannot earn by skill"; LAW 1.2 | The old §3 "higher score multiplier, better loot weights" sketch is VOID (LAW 3.1). |
| Holder-only *unscored* practice/cosmetic events | **[LAWFUL NOW]** | LAW 2.4 ("Gated modes… may exist only if they are cosmetic/practice surfaces") | Unscored is the load-bearing word. |
| Link-a-wallet-to-count-it (weights bind to linked wallets; unlinked excluded from snapshot) | **[LAWFUL NOW]** | Spec §7.3 (linking is one click, announced loudly); auditor 5.3.3 fine-line; chair D9 GREEN | Never phrase as "buy $WICK to bank your weights" — that is RED (auditor no-go 3). |
| Balance-ranked holder board (rank wallets by $WICK balance) | **[LAWFUL NOW]†** | Does not touch LAW 1 (not the scoreboard; spec §7.4 keeps weights off it) — but it ranks by portfolio | Envelope YELLOW-1: owner sign-off + privacy pass (pseudonymous, opt-out). Default: don't. |

### (c) Future post-graduation sinks (cycle v2 menu)

**Blanket platform constraint:** all of these are impossible pre-grad —
`transfersUnlocked=false` makes every token movement unlawful. Pre-grad the same items may
exist only as *balance-read* cosmetic grants, never as spends.

| Candidate mechanic | Class | Deciding law / line | Conditions |
|---|---|---|---|
| Cosmetic shop (skins/trails/frames/emotes, fixed & deterministic prices) | **[POST-GRAD ONLY]** | **LAW 3.3**: spend/burn lawful "only inside the LAW 2 lanes plus entry to events"; LAW 2.1 | No loot boxes ever (pack §8.3, honesty box); prices owner-set at graduation (D16). |
| Death-card frames, ghost skins, trail variants as purchasable burns | **[POST-GRAD ONLY]** | LAW 3.3 + 2.1 | Pre-grad they may exist as tier-*gated* (balance-read) grants — lawful now (row (b)). |
| Deterministic cosmetic forge / reroll (burn → fixed recipe → fixed output) | **[POST-GRAD ONLY]** | LAW 3.3 + 2.1 | Randomized outcomes = gacha = FORBIDDEN (gambling tone). |
| Cosmetic crafting/burning with random outcomes | **[FORBIDDEN]** | Pack §8.3 "no gambling tone"; honesty box "no loot boxes, ever" | Deterministic recipes only. |
| Season pass, cosmetics-only, grants zero weights | **[POST-GRAD ONLY]** | LAW 2.1 + 3.3; chair D16 | A pass that grants weights = purchasable weights = FORBIDDEN (LAW 3.2). |
| Burn-for-status (public cumulative-burner recognition) | **[POST-GRAD ONLY]†** | LAW 3.3 (burn never → score/access) + LAW 2.1 (status = cosmetic/profile) | Profile-level only, never a leaderboard; whale-worship optics = owner sign-off. |
| Tournament entry fees (ticket burn) | **[POST-GRAD ONLY]†** | LAW 3.3 "plus entry to events"; auditor YELLOW-3 | Published rules per event, on-chain distribution, testnet rehearsal first, pack §8.3 gambling-tone review before any real-value prize, **free companion bracket mandatory** (D17). |
| Prize pool funded by pooled entry fees (fee → pot → winner) | **[FORBIDDEN]** | Pack §8.3 gambling texture; that structure is wagering, whatever it is called | Treasury-funded prizes only (see (f)). |
| Revive/continue tokens | **[POST-GRAD ONLY]** inside unscored archive/practice lanes; ranked-run revive is **[FORBIDDEN]** | LAW 1.1/1.3 + LAW 3.3 ("a burned token may never convert into ranked score, ranked access, or score-affecting state"); chair D18 | A revive touching a ranked run is score mutation. |
| MIRROR mode ($WICK's own chart as terrain) | **[POST-GRAD ONLY]** (needs own-token OHLC history) | Spec §8; auditor YELLOW-5 | Weights at practice rates only, never classic rates. |
| **Prediction stake escalation — paying for extra prediction weight cap** (buy more than the 10/day entries or a higher share of weights) | **[FORBIDDEN]** | **LAW 3.2** participation-only + auditor RED list: "Selling weights or snapshot position… 'buy-in to boost your airdrop'". A purchasable cap is a direct weights-for-money exchange, and it breaks the per-wallet snapshot cap's fairness premise (600 pts assumes uniform access to the same event caps). Anti-sybil: caps are the equalizer that makes hedging bounded; selling cap headroom re-opens the hedging market at a price. | Even post-grad. Points-only "conviction" UI that touches no distribution math may be designed, but any coupling of payment → weights is void. |
| Uniform cap changes (raise/lower 10/day, 600 snapshot) for everyone | **[LAWFUL NOW]** (procedure: spec change, not law change) | Spec §7 constants are **[PROVISIONAL]**; LAW 5.3 dated note in WICK-ECONOMY-SPEC | Council guard (D24): caps are never raised as a retention lever — only for math/anti-abuse correctness. Do not mis-tag this as a law amendment. |
| Holder-only events (unscored, cosmetic/social) | **[LAWFUL NOW]** (balance-read gate, no spend) / ticketed events **[POST-GRAD ONLY]** | LAW 2.4 / LAW 3.3 | Ranked holder events stay FORBIDDEN (row (b)). |
| NFT-gated anything | **[POST-GRAD ONLY]†** at best (NFTs need transfers; pre-grad impossible), and only with zero score/access coupling | LAW 1.1 names "NFT" among forbidden score-touchers; LAW 2.1 confines value to render layer | Recommend not building: transferable-status assets import secondary-market narratives the honesty posture cannot survive. Owner-level decision only. |

### (d) Referral loops & Death Card share CTA

| Candidate mechanic | Class | Deciding law / line | Conditions |
|---|---|---|---|
| Death Card share button + download with clean text (card already prints "vibe/vibe builders · robinhood chain testnet", `deathcard.ts:227`) | **[LAWFUL NOW]** | LAW 4; chair D13 v1 GREEN | Share text carries no buy link, no reward promise. |
| Share/attribution codes `?r=dc-YYYYMMDD` (terrain quality as a measurable variable) | **[LAWFUL NOW]** | Chair D20/E5.5; LAW 4 | First-touch-wins, aggregate-only. |
| $WICK line in share text / card art | **[FORBIDDEN]** | Auditor no-go 2 (D13) | — |
| Referral *rewards* (weight per referred buyer, referral tiers) | **[NEEDS LAW AMENDMENT]** → recommend **never** | LAW 3.2 (participation enumeration); platform anti-abuse (self-trading/sybil sensitivity is a disqualifier per GROWTH §1) | See §3-B. Measurement ≠ payment: E5.5 gives the data without the bounty. |

### (e) Ecosystem incentives submission (utility track, 1.5% lane)

| Candidate mechanic | Class | Deciding law / line | Conditions |
|---|---|---|---|
| Submitting the utility-track application with our evidence trail (live playable product at vercel.app; W1/W5 anti-cheat verified runs; deterministic terrain from real OHLC; Merkle proof rehearsal; public weights ledger API; burn/meter transparency surfaces; ECONOMY-LAWS governance) | **[LAWFUL NOW]** | LAW 4 (only verified figures in the submission); E0.5 memo | Every claim traceable to `docs/evidence/`. This is the strongest honest card we hold. |
| Player-facing copy that promises the incentive pool ("play to get the utility airdrop") | **[FORBIDDEN]** | Auditor RED: "Promising the platform incentive pool (utility track 1.5%) as a player benefit — 'eligible, nothing guaranteed' is the ceiling"; LAW 4.1 | Ceiling = "eligible — nothing guaranteed". |
| Owner-only wallet actions (claiming, top-5 pushes) | Out of agent scope | Council D23 reframe | Agent may draft the memo (B19); submission is owner-only. |

### (f) Treasury-funded tournaments (post-grad)

| Candidate mechanic | Class | Deciding law / line | Conditions |
|---|---|---|---|
| Recurring tournaments funded by the 20% treasury share of trade tax; skill-dominant format; on-chain distribution; free companion bracket | **[POST-GRAD ONLY]†** | Spec §8; LAW 3.3 (events lane); auditor YELLOW-3; chair D17 | Gambling-tone review before any real-value prize; no entry-fee pools (FORBIDDEN row above); results render on the event board, never mutating the classic scoreboard. |
| Wager-on-yourself framing ("bet 1,000 WICK you reach 80%") | **[FORBIDDEN]** | Pack §8.3; LAW 4.3 | Permanent, including post-TGE — our no-gambling posture is a brand asset, not a phase limit. |

---

## 2. RED-FLAG REVIEW OF THE CURRENT LIVE IMPLEMENTATION

**Bottom line: the live economy surfaces are inside the law.** My independent re-check of
the four mandated files plus the /airdrop rehearsal and burn feed confirms the auditor's
result (0 P0, 0 P1). What remains is process hygiene, one player-facing copy drift, and
hardening items — listed below with file:line so the board can act, not argue.

**Verified clean:**
- **LAW 1 (score blindness):** no balance read is imported into scoring/leaderboard/access
  paths; `/api/weights` is a read-only view with no write path and self-cites the laws
  (`src/app/api/weights/route.ts:8-12,44-47`); WalletChip is strictly display-only and
  renders *nothing* for walletless visitors, preserving zero-friction base play
  (`src/components/cc/WalletChip.tsx:3-6,104-107`); `/api/vault` verifies a signed
  today-classic run token *before* any holder check and grants only +1 fixed weight +
  same-day cosmetic trail (`src/app/api/vault/route.ts:31-62`) — additive, score-blind.
- **LAW 4 (language):** every economy API meta carries the honest triple — "nothing earned
  or guaranteed; testnet" (`weights/route.ts:45`, `prediction/route.ts:44`,
  `practice/route.ts:17`, `vault/route.ts:20`, `airdrop/route.ts:26`,
  `airdrop/page.tsx:149`); PredictionPanel says "builds airdrop weights… nothing
  guaranteed · testnet" (`PredictionPanel.tsx:164`). My sweep found **no** earn/guarantee/
  profit verbs in any player-facing string. The vault-denied message states the rule
  plainly with no apology and no buy link (`vault/route.ts:48`).
- **/airdrop rehearsal:** "Merkle rehearsal · testnet · nothing claimable yet" is the page
  subtitle (`airdrop/page.tsx:72`); proofs are re-verified in-browser ("no trust in this
  page required", `page.tsx:128-130`); flagged wallets surface honestly
  (`page.tsx:95-100`).
- **Burn feed:** read from the burn address live, fail-open (`src/lib/burn.ts:61`), honest
  labeling on the ready screen (`GameCanvas.tsx:1133-1136`). The **SUPPLY BURNED** line is
  churn-fed and is now (correctly) slated to render paired with the meter (D3) — watch
  that pairing lands so the burn line never reads as a reward ticker.
- **No bridge exists yet:** grep confirms zero links to the token page and zero `?r=`
  handling anywhere in `src/` — the only outbound economy-adjacent link is the honest
  platform-home + faucet pair (`GameCanvas.tsx:1289-1291`). Attribution will be built
  greenfield, per D20 — nothing to untangle.
- **"NO TIER YET"** (`WalletChip.tsx:142`) is compliant — honest display state, no promise;
  its deadness is a UX finding (psych F4), **not** a law violation.

**Residual risks / wording drift (act on these):**
1. **"5 eth class" drift — still live, player-facing (P2).** `GameCanvas.tsx:1160` (grad
   panel) and `src/game/cc/deathcard.ts:41` (Death Card sub — i.e., it ships on *shared
   images*) render `graduation: 5 eth class`, contradicting the canonical 4.0 ETH launch
   record. LAW 4.4: "No invented numbers — only figures verified in this repo's evidence
   trail." Chair D14 approved the de-numbered fix ("curve summit reached · summit class");
   fix B3 is agent-buildable and should land before the next publish. Stale comments at
   `src/game/cc/level.ts:82` and `src/game/cc/engine.ts:71,153` are non-player-facing P3
   hygiene.
2. **LAW 5 process gates open (P2).** E3.1 (PR law statements), E3.3 (anti-sybil audit),
   E3.4 (token-page re-verify) remain open in `ECONOMY-CHECKLIST.md` while four economy
   surfaces are live (auditor F13). Close before any v2 build (B1).
3. **Self-declared wallet links (P2).** `body.address` on leaderboard/prediction/practice/
   vault is accepted without proof of ownership; bounded by caps + flagged-exclusion +
   pre-snapshot review, but the EIP-191 claim-time signature (B12) must be a **hard gate
   before any real snapshot**, not a nice-to-have.
4. **Prediction hedging across many linked wallets (P2).** Server-pinning kills
   cherry-picking, not hedging; B11 hardening (statistical flag + ≥1-verified-run binding
   gate) required before prediction weights matter.
5. **Public top-weights board pre-snapshot (P3†).** `/airdrop` publishes wallet→points
   (`page.tsx:135-145`). Lawful and honest, but run the publication/privacy review (B18)
   before the real snapshot.
6. **Vault precedent standing rule (P2-watch).** The vault is the single lawful
   holder-gated weight faucet (D22). Its current shape is exactly right — **fixed** +1
   `VAULT_POINTS`, tier only changes the cosmetic color (`vault/route.ts:60-62`) — and any
   generalization (tier-scaled points, balance multipliers) is RED. Guard this shape.
7. **Burn-address tier hygiene (P3).** `balanceToTier`/`readWickTier` do not exclude
   `0x…dEaD`; it is the largest balance-read "holder" (254,293 WICK ≥ whale). Not
   exploitable for the vault (nobody holds its key), but every future aggregate
   holder/whale metric and every E2E fixture must exclude it — one-line fix in the wallet
   module.
8. **Evidence reconciliation (P3).** 254,293 (E0.4, Oct-07) vs 164,944 (E2.6, Oct-08)
   burn figures must be reconciled at the next `verify-econ-state` run before any doc or
   UI quotes a burn number (LAW 4.4).
9. **World 2 wallet-blindness (watch line).** The post-grad "buyback world" (doubled
   gains, `engine.ts:153`) is in-game skill-gated content — lawful under LAW 1 *because*
   it is uniform and wallet-blind. Standing condition for the audit hook: world-2 access
   must never key on wallet/holding state, and if world-2 runs ever get a submission path,
   it must be a separate unscored or separate-mode board — never the classic daily board.
10. **Rate limiting is advisory (P3).** In-memory per-instance limits on Vercel multi-
    instance are not a control; the real backstops are caps + snapshot review. Do not
    cite rate limits as an anti-sybil measure in any submission.

---

## 3. LAW-AMENDMENT PROCEDURE (for everything tagged [NEEDS LAW AMENDMENT])

**Procedure (LAW 5.3, verbatim requirement):** "changes require a dated note in this file
explaining what changed and why." Minimum ritual for any amendment: (1) dated note in
`docs/ECONOMY-LAWS.md` quoting the old line and the new line; (2) owner (O-S) sign-off
recorded; (3) Red-Line Auditor re-runs the envelope on the amended text; (4) implementing
PR carries the LAW 5.1 law statement; (5) one-economy-change-per-week cadence respected.

**A. Holder weight bonus (chair D1) — amend LAW 3.2.**
- Line that would change: "Airdrop weights (P4.4) reward **participation** (daily streaks,
  route predictions, archive marathons)." A holder bonus requires appending holding/
  balance as a weight input, which also drags LAW 2.4 ("additive and score-blind" is fine,
  but the auditor's reading — any balance term in a points formula makes the airdrop
  purchasable — is correct).
- Draft if forced: *"3.2b Holding may add a **flat, non-scaled, uncapped-in-practice**
  daily participation bonus of +N weights to linked wallets, announced in advance, never
  retroactive, never scaling with balance, and excluded from all snapshots taken before
  the amendment date."*
- **Recommendation: DO NOT AMEND.** It converts "participation ledger" into "purchase
  ledger" (securities-flavored optics on a testnet token whose honesty posture is the
  product's shield); it is a sybil magnet multiplied by the unproven wallet-link layer
  (§2.3); it breaks the weights-equality premise of the 600-point cap; and the platform
  utility-track case rests on $WICK being a *real playable product*, not a farm. The
  lawful substitutes are already approved (D5 cosmetic ladder, D7 board preview, D8
  endowment line, D11 chip state, D22 vault) and they hit the same emotional levers
  without touching the formula. Dissent is on record (economist); this seat's answer does
  not change: the burden of proof is on the amendment, and it has none.

**B. Referral-rewarded weights — amend LAW 3.2's enumeration.**
- Line: "reward **participation** (daily streaks, route predictions, archive
  marathons)" — a referral bounty is not a gameplay event.
- Draft if forced: *"…plus a one-time referral weight for a referred wallet that both
  links and banks ≥1 verified run within 14 days."*
- **Recommendation: DO NOT AMEND.** It industrializes exactly the sybil surface §2.3
  documents (one human, N wallets); the platform's anti-abuse posture treats fake/incented
  activity as a disqualifier (GROWTH §1), and paid-shill optics are poison for the
  utility-track claim. E5.5 attribution already delivers the *measurement* lawfully — we
  learn which placements work without paying for installs.

**C. New holder-value lanes beyond cosmetics/routes/archive/events — amend LAW 2 + 3.3.**
- Line: LAW 2 "Holder-gated value may exist **only** in these three lanes" (+ LAW 3.3's
  "plus entry to events").
- Draft if forced: *"…fourth lane: {lane}, defined as …, with the same additive/score-blind
  guarantees of 2.4."*
- **Recommendation: DO NOT AMEND now.** Every plausible candidate (cosmetic shop items,
  practice passes, event entries) already fits an existing lane. A new lane should be
  invented only when a real design is blocked — none is. Precedent risk: the first
  amendment out of convenience is the one that ends the law's authority.

**D. Not a law amendment (common mis-tag):** changing the [PROVISIONAL] constants
(daily caps, 600 snapshot cap, VAULT_POINTS) is a *spec* change — dated note in
`WICK-ECONOMY-SPEC.md`, one-change-per-week, plus the D24 guard that caps are never raised
as retention levers. Keep the two procedures separate or LAW 5.3's gravity erodes.

**E. Pre-graduation token spends — not amendable by us at all.** `transfersUnlocked=false`
is platform state, not project policy. No wording change in our docs makes an in-game burn
possible before graduation; any proposal that "spends" pre-grad is void by physics. The
only lawful pre-grad holder primitive is the read-only balance check.

---

## 4. DO-NOT-ARGUE LIST — permanently off the table, regardless of design cleverness

1. **Pay-for-rank, any path.** No purchase, stake, burn, lockup, NFT, or balance state may
   alter score, multiplier, loot, submission acceptance, or rank (LAW 1.1/1.3, 3.3).
2. **Hold-to-play / gated base access.** Daily level, retries, submission, leaderboard,
   duels, archive browsing stay free, forever, walletless (LAW 1.2).
3. **Profit or reward promises.** No "earn", no "guaranteed", no APY/yield framing of the
   75% holder share, no price talk, no "get in before graduation" (LAW 4.1; pack §8.1).
4. **Gambling textures.** Loot boxes, gacha, wagering, prize wheels, entry-fee-pooled
   prizes, "stake" as money — before TGE everything is points/weights, and our no-gambling
   posture does not expire at TGE (LAW 4.3; pack §8.3).
5. **Hiding testnet or inventing numbers.** Testnet stated plainly, every number traced to
   the evidence trail (LAW 4.2/4.4).
6. **Buy CTAs in protected zones.** Play/retry adjacency, score flows, leaderboard rows,
   Death Card content/share text, grant messages, modals/interstitials/auto-redirects/
   countdowns/urgency (auditor no-gos 1–5).
7. **Weights for sale.** No selling weights or snapshot position, no balance-scaled
   weights, no purchasable prediction caps (LAW 3.2; D22 boundary).
8. **Ranked-run revives.** Revives live only in unscored lanes (LAW 1.1/3.3; D18).
9. **Score-affecting "cosmetics-plus".** A feature that makes the same climb score
   differently is a red-line bug by definition, not a taste dispute (LAW 1.3).
10. **Promising the platform incentive pool** as a player benefit; buying engagement
    (bots, reply farms, paid joins) — "eligible — nothing guaranteed" is the ceiling, and
    the credibility cost is asymmetric (E0.5; honesty box).
11. **Casual law/spec amendment.** No mid-air edits; every change rides the §3 ritual
    (LAW 5.3). The amendment procedure is the design space's only door.
12. **Pre-grad token movement of any kind.** Platform constraint; not ours to amend (§3-E).

---

*Prepared by the Compliance & Platform-Constraint seat · Task 73-c · No code was written
or modified; no git actions. Companion artifacts: `docs/ECONOMY-COUNCIL/MEMO-REDAUDIT.md`
(envelope), `docs/ECONOMY-COUNCIL/CHAIR-VERDICT.md` (D-table), `docs/ECONOMY-LAWS.md`
(supreme text).*

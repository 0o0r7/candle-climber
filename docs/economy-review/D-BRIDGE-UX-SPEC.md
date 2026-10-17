# D-BRIDGE-UX-SPEC — the buy bridge, as UX

> Task ID: **73-d** (round 2) · Seat: **Product/UX Designer — bridge specialist** ·
> Date: 2026-10-08 · Status: **DESIGN SPEC ONLY — wires no code, amends no law, no git actions.**
> Scope: the concrete UX layer of the product → buy-page bridge (owner Q1), operating the
> chair's placement list (`docs/ECONOMY-COUNCIL/CHAIR-VERDICT.md` §7) down to components,
> states, strings, tooltips, aria labels, and mobile behavior.
> Precedence: `docs/ECONOMY-LAWS.md` (supreme) ← pack §8 red lines ← CHAIR-VERDICT
> envelope ← this spec. Where this spec disagrees with the chair, **the chair wins**.
> Every number used below is verified in-repo: holder ≥ 1,000 $WICK, whale ≥ 100,000
> (`src/lib/wallet.ts`), server 403 text "vault opens for holders — 1,000 WICK minimum",
> graduation target 4.0 ETH (wick-launch-record.json). Meter % is live-read or omitted.

---

## 0. TL;DR

Ship the bridge as **three permanent/passive surfaces + one desire-moment surface**, each
one tap from the pad, none of them loud:

| # | Placement | Envelope | Priority |
|---|---|---|---|
| 1 | **Vault-denied block** (note → honest copy → GET $WICK / CONNECT WALLET → NOT TODAY) | YELLOW (D4 gate) / GREEN connect-half | P0 |
| 2 | **Ready-screen holders line** next to SUPPLY BURNED (+ D3 meter line when B4 lands) | GREEN | P0 |
| 3 | **/airdrop weights-anatomy card** + endowment line | GREEN | P1 |
| 4 | **Wallet-chip "NO TIER YET" tap-to-expand** info row (chip stays identity-first) | GREEN (D11) | P1 |

Explicitly rejected: mid-run CTAs, leaderboard tooltips (D12), Death-Card share-text line
(D13), price surfaces in-game, a /buy landing page, toasts/auto-tabs/urgency of any kind.
**Nothing in this spec needs a law amendment.** The golden goal (3.94% of 4 ETH, many
small buys) is served by threshold-first copy (1,000 = the smallest key), collective-climb
framing, and per-placement kill metrics — never by pressure.

---

## 1. BRIDGE PRINCIPLES

### 1.1 The desire-moment rule — when a buy path is shown

A GET-$WICK affordance may render **only** at a moment when the player has just felt the
game's own holder-lane logic and it concerns *their* state:

1. **Blocked by the holder gate** — the player reached today's peak wick, tapped
   OPEN WICK VAULT, and the server denied it. This is the single highest-desire moment:
   aspiration is at maximum and the missing thing is concretely named (1,000 $WICK).
2. **Passive information surfaces** — ready screen (what $WICK is for, where it lives) and
   /airdrop (how weights and holder lanes relate). These are always-render, low-pressure,
   paired with the free-play line. They exist so the desire moment never has to explain
   from zero.
3. **Identity empty states** — the chip's NO TIER YET state may open (user-tapped) the
   chair's D11 line. Never auto-expands.

Everything else is forbidden. The bridge is a consequence of the player's own action or a
standing fact — never an interruption, never an ambient ad.

### 1.2 The never list — when a buy path is never shown

- **Mid-run** — nothing buy-adjacent in the canvas, HUD, pause state, or any overlay
  during phase `playing` (chair D4: never mid-run).
- **The grief moment as such** — the LIQUIDATED panel hosts no buy affordance *by
  default*. The one exception is the vault-denied block, which renders only because the
  player tapped OPEN WICK VAULT and the server denied it (action-triggered, not ambient).
- **Score screens / scoreboard adjacency** — no bridge in or around leaderboard rows,
  rank lines, TOP boards, or duel flows (Auditor no-go 2; chair D12).
- **Death Card content or share text** — the card stays clean (chair D13); attribution
  rides the share URL `?r=dc-YYYYMMDD`, not the content.
- **Grant moments** — no GET $WICK next to VAULT OPENED, ALREADY OPENED TODAY, or any
  success/cosmetic grant. A holder being congratulated must never be asked to buy.
- **Never as interruption** — no modals, interstitials, popups, toasts, auto-opening
  tabs, auto-expanding rows, countdowns, or "limited" anything.

### 1.3 Copy tone rules

- **Honest and short.** One line of state, one line of context, one action. No paragraph
  ever. In-game surfaces speak UPPERCASE terminal (`cc-vault-note` voice); /airdrop
  speaks lowercase sentence voice (matches that page's existing notes).
- **Testnet stated plainly, never apologised for** (LAW 4 / pack §8.2). Every surface
  carries "testnet" on-surface or in the link's immediate context; the vault block says
  "no monetary value" verbatim (chair §7).
- **No earnings verbs, ever** (LAW 4 / pack §8.1). Blocklist: earn, guarantee(d), profit,
  invest, yield, APR, win, stake (pre-TGE), claim. Allowlist: get, hold, open, build,
  climb, play, trade, bind, count.
- **No invented numbers** (LAW 4). 1,000 / 100,000 thresholds and 4.0 ETH target are
  code/record-verified; meter and burn are live-read or omitted — a failed feed renders
  *nothing*, never a stale or rounded figure.
- **Every buy-adjacent line is paired with the standing free-play line** —
  `free to play, no wallet needed` (chair §7 standing rule). The bridge always travels
  with the reminder that the game itself needs nothing.
- **Threshold-first, breadth-first.** Copy speaks to the smallest lawful key (1,000) and
  to "climbers", never "investors"/"whales" — the 2% wallet cap means many small holds
  are the only path that graduates (golden goal).

### 1.4 "One tap away, never in-your-face"

Definition: from any lawful surface, the pad's token page is **exactly one tap** from the
desire moment (a single labeled link, new tab, game state preserved) — and nothing ever
expands, moves, repeats, or re-prompts on its own. Corollaries:

- Max **one action per surface** (plus the NOT TODAY exit where a gate blocked the
  player).
- Chair standing cap adopted: **max two buy-adjacent surfaces render per session**; when
  the cap is hit, later surfaces degrade to information-only (text stays, link drops) —
  priority order in §5.
- No frequency capping machinery is needed because nothing pops; the cap only limits how
  many *links* co-render, not how often the player is bothered (they are never bothered).
- Exit honored everywhere: NOT TODAY closes the vault block; the chip row collapses on
  second tap; nothing re-opens itself.

### 1.5 Do-not list (hard, testable)

1. No popups, modals, interstitials, or toast systems for anything buy-adjacent.
2. No auto-open tabs, no auto-expand, no re-render nag on state change.
3. No fake urgency: no countdowns, no "price rising", no "only X left", no FOMO framing.
4. No price talk in-game: no $WICK price, PnL, % moves, or market chart in the product —
   price belongs to the pad (in-game transparency surfaces are meter % and burned supply
   only).
5. No earnings verbs or value promises; no "rewards for buying".
6. No buy CTA in Death Card content/share text, leaderboard tooltips, duel flows.
7. No buy CTA before connect at rung-0 (chair D9): without a wallet the honest first rung
   is CONNECT WALLET; the buy link appears post-connect.
8. No new landing/intermediary page (`/buy`) — outbound-only to the pad.
9. No balance-scaled anything (LAW 1/3.2): copy never implies more holdings ⇒ more weights.
10. No number invention on feed failure — fail open to nothing.

---

## 2. PLACEMENT SPEC

Shared link target (the pad token page):

```
https://testnet.vibevibe.fun/token/0xe2ce0be4e3d420c1e4b5c46493b3d5e03595216c
```

Attribution, two modes (details in §5 / P-07):
- **Ship-today:** direct href with proposed params
  `?utm_source=candleclimber&utm_medium=bridge&utm_campaign={placement}` — **PROPOSAL**:
  we cannot verify the pad preserves params through its redirects; verify manually before
  trusting utm for anything.
- **Target (chair D20 / backlog B5):** internal `href="/api/go/{placement}"` → 302 to the
  pad URL (+ params). Counters `{placement, day, count}` live on **our** redirect, so
  click measurement never depends on pad param support. E5.5 events:
  `go_vault_denied` · `go_ready_meter` · `go_airdrop` · `go_wallet_chip` ·
  `go_death_footer`.
- All external links: `target="_blank" rel="noopener noreferrer"` (existing footer
  pattern).

---

### 2.a VAULT FAIL STATE — the desire moment

**Trigger condition.** Phase `dead` or `graduated`, `reachedPeak === true` (non-archive),
player taps OPEN WICK VAULT, server answers **HTTP 403** (holder gate). Variant is
derived from the response + local state — **never** from string-matching server text:

- `res.status !== 403` → keep today's plain `cc-vault-note` behavior. No bridge on
  success (200), ALREADY OPENED (409), or UNAVAILABLE (catch). **Restraint keystone.**
- `res.status === 403` && no saved address (`localStorage WALLET_ADDRESS_KEY` empty) →
  **Variant A** (no wallet).
- `res.status === 403` && saved address → **Variant B** (connected, below 1,000).

**Exact component/state.** Replace the single
`<p className="cc-vault-note" role="status">{vaultMsg}</p>` with a block **only** in the
403 case:

```tsx
{vaultMsg && vaultGate && (
  <div className="cc-vault-block" role="status">
    <p className="cc-vault-note">{vaultMsg}</p>          {/* server text, unchanged */}
    <p className="cc-vault-sub">{subline}</p>
    <div className="cc-btn-row">
      {variant === "A"
        ? <button className="cc-btn cc-btn-ghost" onClick={connectFromVault}>CONNECT WALLET</button>
        : <a className="cc-btn cc-btn-ghost" href={goUrl("vault_denied")}
             target="_blank" rel="noopener noreferrer">GET $WICK</a>}
      <button className="cc-btn cc-btn-ghost" onClick={() => setVaultMsg(null)}>NOT TODAY</button>
    </div>
  </div>
)}
```

The OPEN WICK VAULT button itself stays exactly as-is (title already honest: "peak wick
reached — holder vault: +1 weight + a trail for today"). The server's uppercased 403 text
remains the note's first line — **server stays the single source of the denial wording**.

#### Variant A — no wallet connected

| Element | Content |
|---|---|
| Note (server, uppercased as today) | `CONNECT A WALLET TO OPEN THE VAULT` |
| Subline (new) | `the climb stays free, no wallet needed · a wallet only proves holding — testnet` |
| Action 1 (primary) | `CONNECT WALLET` |
| Action 2 (exit) | `NOT TODAY` |

**No external link in variant A.** Chair D9: the buy CTA appears only post-connect
(rung-1, not rung-0). Buying without a wallet is impossible, so advertising the pad here
would be noise; the honest first rung is connect. After a successful connect the block
switches to Variant B state (re-tap OPEN WICK VAULT to re-ask the server — **no auto
retry, no auto server call**; the player stays in control).

**Mobile behavior.** If `window.ethereum` is absent (common in in-app mobile browsers),
render CONNECT WALLET disabled-quiet (opacity via existing `cc-btn:disabled`) and extend
the subline: `no wallet provider detected in this browser — open candle climber in your
wallet's browser`. Still no pad link (unchanged rung-0 rule).

#### Variant B — wallet connected, below 1,000 $WICK

Chair §7 placement 1, verbatim:

| Element | Content |
|---|---|
| Note (server) | `VAULT OPENS FOR HOLDERS — 1,000 WICK MINIMUM` |
| Subline (chair verbatim) | `$WICK trades on the vibe curve — testnet, no monetary value · the climb stays free, no wallet needed` |
| Action 1 (primary) | `GET $WICK` → `/api/go/vault_denied` (or direct URL + utm) |
| Action 2 (exit) | `NOT TODAY` |

**Visual treatment.** Note keeps `.cc-vault-note` (mono 10.5px, lime, centered). Subline:
new `.cc-vault-sub` = same mono family, 10.5px, `var(--cc-faint)`, centered, max-width
same as note. Actions reuse `.cc-btn .cc-btn-ghost` inside `.cc-btn-row` (flex-wrap
already ships). Nothing glows, nothing pulses, no lime fill (`cc-btn-start` is reserved
for the game's own RETRY-class verbs).

**Mobile behavior.** Block renders inside the existing scrollable `cc-panel-death`;
`.cc-btn-row` wraps to two rows on narrow screens; tap targets are existing `cc-btn`
sizes (≥40px). GET $WICK opens the pad in a new tab; returning to the tab restores the
panel untouched. Exit honored: NOT TODAY clears the block; the OPEN WICK VAULT button
remains (as today) — re-tapping re-asks the server and may re-render the block. That is
the player's choice, never a re-prompt.

---

### 2.b WALLET CHIP — "NO TIER YET" state

**Ruling: the chip's identity function stays display-only; the empty state becomes
user-tappable information (chair D11, GREEN — Auditor explicitly allows this state).**

- **Trigger condition.** `state === "idle"` && `addr` set && `tier === "none"`.
- **Exact component/state.** Render the chip as a `<button>` (the `button.cc-wallet-chip`
  cursor:pointer rule already exists) with `aria-expanded`; label unchanged:
  `NO TIER YET {balance} {short}`. Tap toggles **one** info row rendered full-width
  directly above the footer (not a modal, not a popover):

  > `You hold {balance} $WICK · holder tiers & vault start at 1,000 · [GET $WICK · testnet] · the game stays free, no wallet needed`

  (Chair §7 placement 5 copy, generalized from "0 $WICK" to the real balance.)
- **Why not a direct buy link on the chip face:** the chip renders on every screen and
  every load — an always-on affordance there is exactly the ambient nag §1 bans; and on
  mobile (the majority audience) tooltips don't exist, so a hover affordance would fail
  silently. Tap-to-expand is the quietest honest fix: identity first, one tap to the
  facts, one more tap to the pad.
- **Title/tooltip (desktop progressive enhancement, unchanged):** keep the existing tip —
  `Display-only $WICK badge · holder value is cosmetic (routes/archive) and never changes rank or access — ECONOMY-LAWS.` — and do **not** append buy language to it.
- **States that must stay untouched:** CONNECT WALLET (idle button), WALLET… (busy),
  WRONG NETWORK, `$WICK · OFFLINE` (rpcdown), WICK HOLDER, WICK WHALE. No bridge text in
  any error state — a broken feed is not a sales opportunity.
- **Visual treatment.** Row reuses chip typography (mono, 11–13px, `--cc-faint`), lime
  link text, 1px border in chip style; new minimal class `.cc-wallet-note`.
- **Mobile behavior.** Chip tap target already finger-sized; row collapses on second tap
  and on unmount/navigation; never auto-opens; the GET link inside is the only bridge
  element.

---

### 2.c READY SCREEN — the permanent line near SUPPLY BURNED

**Trigger condition.** Phase `ready`, non-archive — renders every load (permanent,
low-pressure; this is the surface that teaches before the desire moment ever fires).

**Exact component/state.** Replace the existing `<p className="cc-burn-line">SUPPLY
BURNED · {burn} WICK</p>` with a two-line block `.cc-meter-block`:

- **Line 1 — meter line (chair D3 verbatim; lands with backlog B4, live-read fail-open):**
  > `GRADUATION {live}% · {live}/4.0 ETH · SUPPLY BURNED {live} $WICK → [GET $WICK · testnet · no monetary value] · free to play, no wallet needed`

  If the meter feed fails: render line 1 **not at all** (fail-open, LAW 4 — no stale or
  invented figures). The 4.0 figure is verified (launch record); D14 keeps it out of all
  de-numbered surfaces elsewhere.
- **Line 2 — holders line (this spec's addition; ships now, uses the existing burn
  value):**
  > `THE PEAK'S VAULT OPENS FOR HOLDERS · 1,000+ $WICK (TESTNET) · +1 WEIGHT AND A TRAIL EVERY DAY`

  This is the "why $WICK exists" line: names the holder gate, the threshold, the testnet,
  and the vault's shipped mechanic (same facts as the vault button's existing title) — no
  promise beyond what the server already grants.

**GET $WICK affordance.** One link on line 1 only (when B4 lands): `GET $WICK · TESTNET`,
`/api/go/ready_meter`. Until B4 exists, line 2 renders **without** a link — the ready
screen stays information-only; the buy tap belongs to the desire moment and the chip.
(Keeps the session-cap budget for surfaces that need it.)

**Visual treatment.** Both lines in `cc-burn-line` typography (mono, faint, letter-
spaced, centered); title/tooltip on line 1: `live-read from the vibe/vibe testnet curve —
never hardcoded, hidden on feed failure`. Line 2 title/tooltip: `holding is the key to
the vault — playing is and stays free (ECONOMY-LAWS)`.

**Mobile behavior.** Wraps to 2–3 short lines at 480px (chip media query already drops
font sizes); sits under PredictionPanel, above TOP 3 TODAY; adds no tap target until B4's
link ships.

---

### 2.d /AIRDROP PAGE — weights ↔ holding explainer

**Trigger condition.** Always rendered (public page; the footer's "airdrop board" link is
where analytically-minded visitors land).

**Exact component/state.** New `<section className="cc-airdrop-card">` placed between the
status card and the proof-lookup card. Lowercase voice (matches the page's existing
notes). Content:

> **HOW WEIGHTS BUILD**
> - `weights are built by playing — daily climbs, route calls, archive marathons · nothing guaranteed`
> - `holder lanes come from holding — the vault, trails, tiers · balance never adds weights`
> - `one vault open per day adds +1 — vaults open for holders (1,000+ $WICK)`
> - action line: `[GET $WICK · VIBE/VIBE TESTNET →]` · `free to play, no wallet needed`

The second bullet is the D8 guard rendered as copy: participation builds weights,
holding opens lanes — **never the reverse implication**. The third bullet states the one
bounded holder→weights faucet (vault, chair D22) with its real threshold.

**Endowment line (P1, chair §7 placement 2, adapted to this page's real input):** the
page has no connect flow — its address input (proof lookup) is the honest binding
surface. When a proof lookup has succeeded for `{short}`, render above the TOP WEIGHTS
card:

> `IF THE SNAPSHOT WERE TODAY, {short} SHOWS {N} WEIGHTS · snapshot not final · nothing guaranteed · testnet`

(Chair's "LINK A WALLET TO BIND THEM" phrasing stays on the death-panel connect flow,
where a link flow actually exists; here the lookup already did the binding.)

**Visual treatment.** Reuses `cc-airdrop-card`, `cc-airdrop-k` for the heading, `cc-
airdrop-note` styling for lines; the GET link inherits the page's link voice, styled with
the lime accent. No new components.

**Mobile behavior.** Page is a single column already; the card stacks cleanly; nothing
floating, nothing sticky.

---

### 2.e Placements explicitly REJECTED (restraint = credibility)

| Rejected | Why |
|---|---|
| **Leaderboard / rank-line tooltip bridge** (growth seat's #6) | Chair D12, Auditor no-go 2: scoreboard adjacency poisons the unbuyable-scoreboard trust moat. Permanent. |
| **$WICK line in Death Card image or share text** | Chair D13: the card is the product's voice on social — it must stay clean. Attribution lives in the `?r=dc-YYYYMMDD` URL only. |
| **Mid-run anything** (HUD chip, pause overlay, canvas toast) | §1.2; breaks flow-state and reads as paywall pressure during play. |
| **Ambient death-panel buy footer (YELLOW half of D10) at launch** | The vault-denied block already serves the death panel's one desire moment; a second link on the same panel doubles pressure for marginal gain. Ship the GREEN half (link-wallet line) now; defer the buy line until KPI 5 (`Peak→buy-24h`) shows the vault block alone isn't converting. |
| **Footer token-page link** | The footer already links vibe/vibe testnet; a direct token link adds a 6th unreviewed surface for near-zero attribution value. Footer stays neutral infrastructure. |
| **A `/buy` landing page** | Outbound-only per chair; an intermediary page adds a step, splits attribution, and smells of ownership of the trading context. |
| **Toast/notification system** | No infra for it exists; building one for the bridge would institutionalize interruption. The do-not list (§1.5) outlaws its use anyway. |
| **Price/market surfaces in-game** ($WICK chart, PnL) | Price belongs to the pad; LAW 4 no-gambling-tone; in-game transparency = meter % + burn only. |
| **"Buy for bonus weights" / balance multipliers** | LAW 1/3.2 RED — forbidden absent a dated amendment (chair D1). Not a UX decision; recorded so no later UX doc re-imports it. |

---

## 3. STATE MATRIX

Rows = wallet state · columns = surface. `—` = surface not rendered for that state.
Rule of the matrix: **the bridge speaks only where the holder gate or an information
surface is involved; error states stay silent.**

| Wallet state | Wallet chip | Vault block (403 only, peak reached) | Ready-screen line | /airdrop page |
|---|---|---|---|---|
| **Not connected** (no saved address; chip hidden if no provider — existing behavior) | `CONNECT WALLET` (if provider) / hidden | **Variant A**: note + `CONNECT WALLET` + `NOT TODAY`; **no pad link** (D9) | Line 2 shown; no link until B4 | Explainer + GET link; endowment line after lookup |
| **Wrong network** | `WRONG NETWORK` (tap = retry connect) | Server verdict governs (server reads the chain itself; no client network gate) — usually behaves as row below | same as any visitor | same as any visitor |
| **Connected · below 1,000** | `NO TIER YET {bal}` → tap expands D11 row w/ `GET $WICK · testnet` | **Variant B**: note + subline + `GET $WICK` + `NOT TODAY` | Line 2 shown (+ D3 line when B4) | Explainer + GET link |
| **HOLDER (≥1,000)** | `WICK HOLDER {bal}` — no bridge | Vault opens — success note only, **no bridge** | same as any visitor | Explainer (no personal upsell) |
| **WHALE (≥100,000)** | `WICK WHALE {bal}` — no bridge | Vault opens — success note only, **no bridge** | same as any visitor | Explainer |
| **Balance feed down (rpcdown)** | `$WICK · OFFLINE` — no bridge | n/a (server decides vault) | line 1 hidden on feed failure (fail-open) | page unaffected |

Session cap (§1.4): when two GET-$WICK actions have already rendered this session, later
surfaces render information-only (text stays, link drops). Priority when over budget:
vault B > chip expand > death-footer > ready > airdrop.

---

## 4. COPY SHEET

Law check per string — L4a: no earn/guarantee/profit verbs · L4b: testnet stated on
surface or in immediate link context · L4c: no gambling tone · L4d: no invented numbers ·
FP: paired with free-play line where required.

| ID | Surface · element | String (EN, verbatim) | Title / tooltip | aria-label | Law check |
|---|---|---|---|---|---|
| C-01 | Vault A · note | `CONNECT A WALLET TO OPEN THE VAULT` *(server-owned; rendered uppercased as today)* | — | block has `role="status"` | L4a ✓ · server source of truth · L4c ✓ |
| C-02 | Vault A · subline | `the climb stays free, no wallet needed · a wallet only proves holding — testnet` | — | — | L4a ✓ · L4b ✓ (testnet) · FP ✓ |
| C-03 | Vault A · action | `CONNECT WALLET` | `opens your wallet provider — display-only connection; connecting never affects rank or score` | `Connect wallet — display-only; connecting never affects rank or score` | L4a ✓ · L4c ✓ |
| C-04 | Vault A · mobile addendum | `no wallet provider detected in this browser — open candle climber in your wallet's browser` | — | — | honest environment statement · L4a ✓ |
| C-05 | Vault B · note | `VAULT OPENS FOR HOLDERS — 1,000 WICK MINIMUM` *(server-owned)* | — | `role="status"` | L4a ✓ · L4d ✓ (1,000 = code) |
| C-06 | Vault B · subline | `$WICK trades on the vibe curve — testnet, no monetary value · the climb stays free, no wallet needed` *(chair verbatim)* | — | — | L4a ✓ · L4b ✓ · FP ✓ |
| C-07 | Vault B · action | `GET $WICK` | `opens the $WICK trade page on vibe/vibe testnet in a new tab — the game stays here, nothing is spent from this page` | `Get $WICK on vibe/vibe testnet — opens in a new tab` | L4a ✓ · L4b ✓ (link context) · L4c ✓ |
| C-08 | Vault A/B · exit | `NOT TODAY` | `dismiss the vault note — the vault re-arms tomorrow` | `Dismiss the vault note` | exit honored (D4) · L4a ✓ |
| C-09 | Chip · label | `NO TIER YET {bal} {addr}` *(unchanged)* | existing tip unchanged: `Display-only $WICK badge · holder value is cosmetic (routes/archive) and never changes rank or access — ECONOMY-LAWS.` | chip button gets `aria-expanded` | L4a ✓ · identity-first |
| C-10 | Chip · expanded row | `You hold {bal} $WICK · holder tiers & vault start at 1,000 · [GET $WICK · testnet] · the game stays free, no wallet needed` *(chair D11)* | — | row region labeled `holder tier info` | L4a ✓ · L4b ✓ · L4d ✓ · FP ✓ |
| C-11 | Chip · row link | `GET $WICK · TESTNET` | same as C-07 | same as C-07 | L4a ✓ · L4b ✓ |
| C-12 | Ready · line 1 (B4) | `GRADUATION {live}% · {live}/4.0 ETH · SUPPLY BURNED {live} $WICK → [GET $WICK · testnet · no monetary value] · free to play, no wallet needed` *(chair D3 verbatim; hidden on feed failure)* | `live-read from the vibe/vibe testnet curve — never hardcoded, hidden on feed failure` | line link aria = C-07 | L4a ✓ · L4b ✓ · L4d ✓ (4.0 = launch record) · FP ✓ |
| C-13 | Ready · line 2 | `THE PEAK'S VAULT OPENS FOR HOLDERS · 1,000+ $WICK (TESTNET) · +1 WEIGHT AND A TRAIL EVERY DAY` | `holding is the key to the vault — playing is and stays free (ECONOMY-LAWS)` | — | L4a ✓ (describes shipped mechanic) · L4b ✓ · L4d ✓ |
| C-14 | Airdrop · card title | `HOW WEIGHTS BUILD` | — | — | L4a ✓ ("build", pack verb) |
| C-15 | Airdrop · L1 | `weights are built by playing — daily climbs, route calls, archive marathons · nothing guaranteed` | — | — | L4a ✓ ("built", "nothing guaranteed") · LAW 3.2 ✓ |
| C-16 | Airdrop · L2 | `holder lanes come from holding — the vault, trails, tiers · balance never adds weights` | — | — | L4a ✓ · D8 direction-guard ✓ |
| C-17 | Airdrop · L3 | `one vault open per day adds +1 — vaults open for holders (1,000+ $WICK)` | — | — | L4a ✓ · L4d ✓ · D22 bounded faucet ✓ |
| C-18 | Airdrop · action | `GET $WICK · VIBE/VIBE TESTNET →` | same as C-07 | same as C-07 | L4a ✓ · L4b ✓ |
| C-19 | Airdrop · standing | `free to play, no wallet needed` | — | — | FP ✓ |
| C-20 | Airdrop · endowment | `IF THE SNAPSHOT WERE TODAY, {short} SHOWS {N} WEIGHTS · snapshot not final · nothing guaranteed · testnet` | — | — | L4a ✓ · L4b ✓ · computed from real ledger only (D8) |
| C-21 | Death panel · GREEN footer half (P2) | `THIS RUN BUILDS AIRDROP WEIGHTS — LINK YOUR WALLET TO COUNT IT` *(chair verbatim)* | `connect-flow line — no outbound link` | — | L4a ✓ ("builds/count") · D9 ✓ |

Sweep note: all strings above pass the B2 language lint verbs blocklist (earn/guaranteed/
profit/invest/yield/win/stake/claim absent); "testnet" appears on every surface either
inline (C-02, C-06, C-11, C-12, C-13, C-20) or in the linked context (C-07/C-11/C-18 all
open the testnet pad).

---

## 5. IMPLEMENTATION NOTES (for the engineer)

**Reuse, do not invent.**

| Need | Reuse |
|---|---|
| Note text | `.cc-vault-note` (mono 10.5px lime, centered) — unchanged for non-403 messages |
| Sublines | one new `.cc-vault-sub` (same mono, `--cc-faint`) — ~6 lines CSS |
| Actions | `.cc-btn .cc-btn-ghost` inside existing `.cc-btn-row` (flex-wrap ships) |
| Ready lines | `.cc-burn-line` typography; new `.cc-meter-block` wrapper + `.cc-holders-line` — ~10 lines CSS |
| Chip row | new minimal `.cc-wallet-note` row (chip typography, lime link) — ~8 lines CSS |
| Airdrop card | existing `.cc-airdrop-card`, `.cc-airdrop-k`, `.cc-airdrop-note` |
| Variant detection | `localStorage` key `WALLET_ADDRESS_KEY` (same one WalletChip uses); 403 status from the existing `/api/vault` response in `openVault` |
| Connect flow (Vault A) | small local `connectFromVault()` mirroring WalletChip's `connect` (provider request + chain check); ~15 lines. Do **not** refactor WalletChip to expose it |
| External links | footer pattern `target="_blank" rel="noopener noreferrer"` |

**Estimated diff (bridge UI only, excluding B4/B5 which are their own backlog items):**
`GameCanvas.tsx` ≈ +45 · `WalletChip.tsx` ≈ +20 · `airdrop/page.tsx` ≈ +20 ·
`globals.css` ≈ +25 → **≈ 110 lines total = S**. With B5 (`/api/go/{placement}` +30) and
the session-cap helper (+10) still under S/M.

**Cap wiring (P-07).** `sessionStorage["ccBridgeImpressions"]` incremented on each
GET-$WICK render; ≥ 2 → render the surface's text without the link (priority order in
§3). ~10 lines in one shared helper; no analytics SDK, no new dependency.

**Sequencing (E4.3 one-economy-change-per-week).** Week 1: C-13 ready line 2 + C-14..19
airdrop card + C-10 chip row (all GREEN). Week 2 (after owner nods ODP 2+3): vault block
A/B + B5 attribution. B1 (E3.1/E3.3/E3.4 process gates) closes before any of it lands
(D21). B2 language lint gains the strings above.

**What NOT to refactor.**

1. `openVault` fetch logic and its server-contract — the server's 403/409 texts remain
   the source of the note line; do not fork server strings into client constants.
2. `WalletChip` state machine (`idle/busy/wrongnet/rpcdown`) — add only the expand
   behavior on the `tier === "none"` render path; do not touch error states.
3. Tier math / `balanceToTier` / thresholds — client renders, never redefines.
4. The death/graduated panel structure — the vault block slots where the plain note is;
   nothing else moves. No Engine, scoring, or submission code is touched (LAW 1 surfaces
   stay sealed).
5. No portal/toast infrastructure, no CSS framework, no analytics SDK.
6. Do not gate the vault client-side on network state — the server's verdict is the only
   gate (matrix row 2).

**Measure and kill.** Each placement's CTR (`/api/go/{placement}` ÷ impressions) is
reviewed weekly against chair KPI 7; the worst placement is refit or killed
(one-change-per-week). KPI 5 (`Peak→buy-24h`) is the number that justifies keeping — or
defers — the D10 death-footer buy line. Guard metrics (session tails, retry counts) are
watched, never optimized (chair D24).

---

## 6. PROPOSAL REGISTER

| # | Proposal | Tag | Priority | Effort |
|---|---|---|---|---|
| P-01 | Vault-denied block, **Variant B** (connected, below 1,000) with chair-verbatim copy + GET $WICK | [LAWFUL NOW] · chair envelope **YELLOW** — build only after owner sign-off + E3.4 compliance re-read (D4) | **P0** | S |
| P-02 | Vault-denied block, **Variant A** (no wallet → connect-first, no pad link at rung-0; mobile no-provider addendum) | [LAWFUL NOW] · GREEN (D9 connect-flow) | **P0** | S |
| P-03 | Ready-screen **holders line** (C-13) beside SUPPLY BURNED; D3 meter line (C-12) follows B4 | [LAWFUL NOW] · GREEN (D3; owner copy nod per ODP 3) | **P0** (line 2) / P1 (line 1) | S |
| P-04 | /airdrop **weights-anatomy card** + GET link (C-14..19) | [LAWFUL NOW] · GREEN (D8) | P1 | S |
| P-05 | /airdrop **endowment line** from proof-lookup result (C-20) | [LAWFUL NOW] · GREEN (D8) | P1 | S |
| P-06 | Wallet-chip **NO TIER YET tap-to-expand** row (C-09..11); chip identity stays display-only | [LAWFUL NOW] · GREEN (D11) | P1 | S |
| P-07 | E5.5 bridge plumbing: `/api/go/{placement}` + proposed `utm_*` params (unverified on pad — verify first) + session-cap helper | [LAWFUL NOW] · GREEN (D20/B5) | P1 | M |
| P-08 | Death-panel footer **link-wallet line** (C-21, GREEN half of D10); buy-line half **deferred** until KPI 5 reads | [LAWFUL NOW] · GREEN half; buy half [LAWFUL NOW · YELLOW] | P2 | S |
| P-09 | Post-grad bridge surfaces (cosmetics shop, burn-counter narration, MIRROR-level moments) | [POST-GRAD ONLY] | P2 | M |
| P-10 | Mid-run CTAs · leaderboard tooltips (D12) · Death-Card share-text line (D13) · price surfaces in-game · `/buy` landing · toasts/auto-tabs/urgency | [FORBIDDEN] / rejected — see §2.e | — | — |
| P-11 | Buy-for-weights / balance multipliers / hold-to-play | [FORBIDDEN] (LAW 1/3.2) — amendable only via dated LAW 5.3 note + owner sign-off | — | — |

**Statement required by the brief: this spec contains zero [NEEDS LAW AMENDMENT] items.**
Everything shippable here is lawful under ECONOMY-LAWS as adopted; the only gates are the
council's own process envelopes (owner sign-off on the YELLOW pair and the copy pack).

---

*End of spec. Design-only: no `src/` file was touched, nothing committed. Companion
reading: CHAIR-VERDICT.md §7 (placement contract), ECONOMY-LAWS.md (supreme),
GROWTH-AND-HOOKS-STRATEGY.md §8 (red lines).*

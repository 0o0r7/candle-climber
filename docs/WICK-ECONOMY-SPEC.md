# WICK ECONOMY SPEC — paper before code (v1)

> Written 2026-10-08 (E1.1–E1.5 of docs/ECONOMY-CHECKLIST.md). Chat language FA · Doc EN.
> Precedence: `docs/ECONOMY-LAWS.md` is supreme; pack §8 language red lines inherit into
> every sentence of this spec. Where a number here conflicts with the chain, the chain wins.
> Constants marked **[PROVISIONAL]** are shippable defaults pending the O-S owner sign-off;
> they live in ONE pure module (`src/lib/weights.ts`) so a change is a diff + test, never a
> mid-air edit. Language rule (LAW 4): "builds weights" — never "earn(s)", never "guaranteed".

## 1. Verified constants (sources — no invented numbers)

| Constant | Value | Source |
|---|---|---|
| Token / curve | `0xE2cE…216c` / `0x9e00…640c` | docs/evidence/wick-launch-record.json |
| Launch | #5963 · 2026-10-05T22:22:32Z · pair ETH | same |
| Lifecycle at writing | `CURVE_TRADING` (not graduated), transfers locked | pad API `/v6/launches/{token}` 2026-10-07 |
| Graduation target | **4.0 ETH net** (`targetPairUnits` 4e18) | launch record; legacy factory `0xe7942178…` (5 ETH = current-factory policy, not ours) |
| Trade tax | 200 bps (2%) | launch record `taxBps` |
| Tax split | 75% holders · 20% cash · 5% burn | launch record `weights` (7500/2000/500) |
| Wallet cap | 2% of supply per wallet | TOKEN-LAUNCHPAD-RESEARCH §3 (platform config) |
| Curve fee | 1.25% (creator 75% / protocol 25%, each 50% claim + 50% burn) | TOKEN-LAUNCHPAD-RESEARCH §6 + VIBE-LAUNCHPAD-INTEL §5 |
| Incentive pool | 5% supply: traders 1.75% · meme 1.5% · **utility 1.5%** · legacy creators 0.25% | INTEL-UPDATE-2026-10-07 (#testnet-incentives verbatim) |
| Durability | MongoDB Atlas serving prod (`store:"mongo"`, `dbError:null`) | probe 2026-10-08 |

## 2. Supply & distribution (E1.1)

Total supply 1e9 $WICK, curve-minted at launch: ~793.1M curve allocation + ~206.9M LP
(platform-standard split; transfers locked until graduation, so pre-grad distribution is
**buy-from-curve only** — there are no airdrops, no team unlocks, no transfers to sit
outside the curve). Post-graduation, curve reserve + LP migrate to a Uniswap v4 pool and
transfers unlock. The 5% incentive pool is platform-side (paid by the platform program,
not minted by us) and is claimed via the platform's own terms — we influence it only by
being a genuine utility app.

Consequence: the ONLY way a player holds $WICK pre-grad is buying from the curve with ETH.
Every design below therefore optimizes for **willingness to hold**, never for trading churn.

## 3. Value-flow map (E1.1)

```
                ETH                          $WICK (pre-grad, transfers locked)
                 │                                    ▲
   player buys ──┤──► curve reserve ──► meter (4 ETH net target)
                 │            │
                 │            ├─ 1.25% curve fee → 75% creator / 25% protocol
                 │            │        (creator 50% claim + 50% burn of $WICK)
                 │            └─ 2% trade tax → 75% HOLDERS · 20% cash · 5% BURN
                 │
   game loop ────┴──► daily reasons to return (H1 archive, H4 report, streaks)
                      │
                      ├─ Balance Gate: hold ≥1,000 → cosmetic holder badge lane
                      ├─ weights ledger: streaks/predictions/marathons build weights
                      └─ post-grad (transfers open): spend/burn, tournaments, MIRROR
```

Reading: the meter only fills on NET buys; the tax makes selling costly and holding
yield-bearing (75% of tax redistributed to holders); the game's job is to create the
daily demand that makes buying-and-holding the rational move for people who like the game.

## 4. Economy thesis (one line)

**Players build airdrop weights by playing every day, holders get cosmetic/status lanes,
and every trade burns — the scoreboard stays skill-only, always (LAW 1).**

## 5. Sinks & Faucets ledger (E1.2) — every row inside a LAW 2 lane

| # | Mechanic | Type | LAW 2 lane | Phase | Status |
|---|---|---|---|---|---|
| 1 | Daily streak → weights | faucet | recognition-adjacent (weights only) | G1/P4.4 | **E2.2 building now** |
| 2 | Route prediction → weights | faucet | weights only | G1/P4.6 | reserved (E2.3) |
| 3 | Archive marathons → weights | faucet | weights only | G1/P4.6 | reserved (E2.3) |
| 4 | Holder badge tiers (1k/100k) | faucet | **cosmetics** | G1/P4.2 | ACTIVATING |
| 5 | Wick Vault at peak wick | faucet | cosmetics + weights | G1/P4.3 | reserved (E2.4) |
| 6 | Trade tax burn share (5%) | sink | supply-side (automatic) | live | automatic (fee rails) |
| 7 | Curve-fee burn (creator 50% buyback) | sink | supply-side (automatic) | live | automatic (fee rails) |
| 8 | Post-grad run entries/revives/tickets | sink | events + cosmetics | G2/P6.3 | gated on graduation |
| 9 | Tournament ticket burn | sink | events | G2/P6.4 | gated on graduation |
| 10 | Cosmetics (skins/trails/frames) | sink | **cosmetics** | G2 | post-grad spend lane |

Anything proposed outside cosmetics/routes/archive/weights/events = red-flagged (LAW 2.4).

## 6. Demand funnel math (E1.3) — assumptions labeled, only verified constants used

Fixed facts: meter = 4 ETH net; 2% wallet cap ⇒ breadth mandatory; meter only fills on
buys (sells subtract). Let C = avg net buy per contributing player per month (ETH), and
R = retention-adjusted contributors (DAU × connect/buy propensity). Assumption ranges are
**assumptions**, stated as such; the verified parts are the meter size and the caps.

| Scenario | DAU | buys $WICK | avg net buy/mo | meter fill/mo | months to 4 ETH |
|---|---|---|---|---|---|
| Cold start | 10 | 20% (2) | 0.01 ETH | 0.02 ETH | 200 mo ← not viable |
| Working hook | 50 | 30% (15) | 0.02 ETH | 0.30 ETH | ~13 mo ← marginal |
| Growth loop | 200 | 40% (80) | 0.03 ETH | 2.40 ETH | ~1.7 mo ← viable |

Reading (no poetry): at testnet-wallet sizes, 10 DAU graduates nothing — ever. The only
lever that moves the meter at 2%-cap breadth is MORE PLAYERS (E5) plus a daily-return
reason to buy (streak weights + Balance Gate identity). Every point of retention
multiplies breadth linearly. This is why the economy work is hooks-first, and why E5
publishing is correctly frozen until the hooks exist (owner directive 2026-10-08).

## 7. Airdrop-weights formula spec v1 (E1.4 → implemented as E2.2)

### 7.1 Identity & linking
- Identity = normalized in-game name (same normalizer as the leaderboard).
- Optional wallet link (v1: client sends `address` alongside a W1-verified submission;
  one identity ↔ one wallet; >2 identities per wallet = anomaly flag, reviewed before
  any snapshot). Walletless play is untouched (LAW 1.2) — weights accrue to the identity
  and bind at link/snapshot time.
- Everything server-side: only W1-HMAC-verified events enter the ledger (red line §8.4).

### 7.2 Weight events
| Event | Source | Points | Daily cap |
|---|---|---|---|
| `run` | verified submission on TODAY's classic level (1w, non-archive) | `min(streakDays, 10)` **[PROVISIONAL]** | 10 |
| `practice` | verified archive run (wired with E2.3) | 0.5/run **[PROVISIONAL]** | 2 |
| `prediction` | route prediction scored vs next-day OHLC (E2.3) | tiered, ≤10/day **[PROVISIONAL]** | 10 |

streakDays = consecutive UTC days (including today) with ≥1 valid `run` event; a missed
day resets to 1. Deterministic pure function of the event log — same log, same weights.

### 7.3 Caps, snapshot, claim
- Per-identity: event caps above. Per-wallet snapshot cap: 600 pts **[PROVISIONAL]**
  (60 days × 10) — enforced at snapshot, not accrual.
- Snapshot (E2.5): per-wallet totals from linked identities only → Merkle tree → claim
  page → **testnet rehearsal before the meter fills**. Unlinked identities are excluded
  (fair: linking is one click, announced loudly before any snapshot).
- Language on every surface: "builds airdrop weights" — never "earn", never "guaranteed";
  testnet stated plainly (LAW 4).
- Anti-sybil (E3.3): W1 HMAC (event authenticity) + W5 (score validity) + per-wallet cap
  + identity↔wallet anomaly flags + platform anti-abuse (self-trading detection) as the
  final backstop. Residual risk: name-sybil inflates identity totals — mitigated at
  snapshot by wallet caps + anomaly review; documented, not hidden.

### 7.4 Never-list (LAW 1 red lines, restated for implementers)
Weights never: touch score/rank/multiplier, gate base access, change physics, or appear
on the leaderboard. The ledger is a separate read API; the game runs identically without it.

## 8. Post-graduation spec v0 (E1.5 — lanes fixed now, numbers at graduation)

- **Spend/burn lanes** (legal only after `transfersUnlocked`): run entries for premium
  archive marathons, revive tokens, cosmetic purchases, tournament tickets. All burns go
  to the irrecoverable burn address or tournament treasury — never to ranked advantages.
- **Treasury tournaments:** 20% cash share of tax funds recurring prize pools; format =
  flagged tournaments (entry = ticket burn); payout = ETH from treasury, distribution
  on-chain, rules published per event. Numbers TBD at graduation (testnetETH first).
- **MIRROR (H6):** $WICK's own post-grad OHLC feeds the terrain pipeline (`vibe-launch.ts`
  extension) — the graduation candle becomes a permanent legendary level. Practice-lane
  scoring only (archive rule), weights-eligible at practice rates.
- **Burn counter (P6.5):** read burn events from fee rails → public API + HUD
  ("the game eats its own supply") — E2.6 builds the read path pre-grad.

## 9. Measurement tie-ins (E4)

- KPIs: D1/D7 retention, connect rate (WalletChip), weights-ledger actives, holder count
  (RPC), meter ETH/day. Weekly review ritual E4.3; one economy change per week maximum.
- Economy events go to Sentry on failure (E4.4) — ledger write errors are P2 alerts, not
  silent fallbacks: weights must never silently vanish (trust is the product).

*Next: E2.2 implements §7 verbatim (pure module + store + route + W5 tests). Changes to
this spec require a dated note (LAW 5.3 etiquette).*

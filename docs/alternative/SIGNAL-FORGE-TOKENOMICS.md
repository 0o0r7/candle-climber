# SIGNAL FORGE — Alternative Tokenomics Design

> **Independent economic analysis by Base44.** This document proposes a token
> economy structure designed to create organic buy-and-hold pressure for the
> product token. It is a design proposal, not financial advice or a guarantee.

---

## 1. Core Problem Statement

The current Candle Climber economy uses **airdrop weights** — players build
weights by playing daily (streaks, predictions, archive runs). The weights
determine a future airdrop allocation. This model has a structural weakness:

**It incentivizes playing, not holding.** A player can build weights with zero
token exposure — they never need to buy $WICK to participate. The only token
demand comes from the graduation meter (ETH → curve), which is driven by
speculative buying, not gameplay utility.

The demand funnel math in the current spec confirms this: at 10 DAU with 20%
buy propensity, the meter fills in 200 months — not viable. The lever is
"more players," but there's no structural reason for players to BUY and HOLD.

---

## 2. Design Thesis

**The token must be an access pass to the game's deepest experiences, not a
speculative sidecar.** Players buy $WICK because it makes the game better —
not because they hope it will appreciate.

This means:
1. **Competitive play requires holding** — tournaments are stake-gated
2. **Gameplay advantages require staking** — margin insurance is stake-gated
3. **Cosmetic expression requires burning** — skins are forged by burning $WICK
4. **Social status requires holding** — leaderboard rankings are holding-weighted
5. **Seasonal content requires spending** — the Signal Pass is purchased with $WICK

Every mechanic creates a reason to acquire $WICK AND a reason to keep it.

---

## 3. The Six-Layer Economy

### Layer 1: Free Base Game (No Token Required)

The base game is **completely free and fully playable without $WICK**:
- Daily arena, all mutations, all cell types
- Local best score, global leaderboard (guest lane)
- Liquidation Cards, sharing
- Practice mode (archive arenas)

**This is non-negotiable.** The game must be fun without the token — the token
enhances the experience, it doesn't gate the core loop. This mirrors Candle
Climber's LAW 1 (skill-first, walletless play untouched).

### Layer 2: Tournament Entry (Stake-to-Compete)

| Parameter | Value | Rationale |
|---|---|---|
| Entry threshold | Hold ≥ 1,000 $WICK | Creates baseline demand; at 2% wallet cap, this is accessible |
| Tournament frequency | Daily (UTC midnight reset) | Same cadence as the daily seed |
| Tournament duration | 24 hours | Players compete on the same arena as the daily seed |
| Prize pool | Top 10 share a pool funded by entry burns | Creates competitive demand |
| Ranking | Score × holding_duration_multiplier | Rewards long-term holders |

**Holding Duration Multiplier**:
```
multiplier = 1 + min(holding_days, 90) / 90
```
A player who has held for 90+ days gets a 2× multiplier on their tournament
score. A player who bought yesterday gets 1.01×. This creates a structural
advantage for long-term holders — you can't just buy-and-win on tournament day.

**Why this creates buy-and-hold pressure**:
- Players must buy to enter tournaments → baseline demand
- Players must hold longer to rank higher → holding incentive
- The multiplier rewards patience, not churn → reduces sell pressure

### Layer 3: Margin Insurance (Stake-to-Protect)

| Parameter | Value | Rationale |
|---|---|---|
| Stake amount | ≥ 5,000 $WICK | Meaningful but accessible |
| Benefit | One margin recovery per run (to 50%) | A safety net for aggressive play |
| Stake lock | 7 days minimum | Prevents flash-stake-and-unstake |
| Unstake | Anytime after lock period | $WICK is returned, not consumed |

**How it works**: When you stake $WICK, a "Margin Insurance" indicator appears
in the arena. If your margin drops below 15%, the insurance triggers — margin
jumps to 50%, and the insurance is consumed for that run. It recharges at the
start of the next run.

**Why this creates buy-and-hold pressure**:
- The stake is LOCKED, not spent — you get it back
- But while locked, you can't sell it → reduces circulating supply
- The benefit is real (competitive advantage) → players want to stake
- Most players will stake and forget → long-term holding becomes the default

### Layer 4: Cosmetic Foundry (Burn-to-Express)

| Parameter | Value | Rationale |
|---|---|---|
| Skin cost | 10,000 $WICK (burned) | Meaningful sink; at testnet prices, accessible |
| Skin type | NFT (ERC-721, post-graduation) | Tradeable, collectible |
| Skin supply | Unlimited (each burn mints one) | No artificial scarcity; value is expression, not investment |
| Visual | Robot colorways, trail effects, arena themes | Cosmetic only, zero gameplay impact |

**Why this creates buy-and-hold pressure**:
- $WICK is permanently removed from circulation → deflationary
- Players who want cosmetics must buy $WICK to burn it → recurring demand
- The NFT is tradeable but the burn is permanent → supply reduction
- Cosmetic expression is a proven demand driver in gaming (Fortnite, Valorant)

### Layer 5: Signal Pass (Seasonal Spend)

| Parameter | Value | Rationale |
|---|---|---|
| Price | 50,000 $WICK (locked, not transferable) | Seasonal recurring demand |
| Duration | 30 days | Monthly cadence
| Benefits | Cosmetic track, bonus signals (visual only), exclusive arena skin | Enhancement, not pay-to-win |
| Bonus signals | +1 signal fragment per green cell (visual only, no score change) | More to collect, same base value |

**Why this creates buy-and-hold pressure**:
- Recurring purchase → monthly demand cycle
- The $WICK is locked (removed from circulation for 30 days) → reduces sellable supply
- After 30 days, the $WICK is returned → but most players will re-buy next season
- Creates a subscription-like revenue model in $WICK terms

### Layer 6: Revenue Burn (Deflationary Engine)

| Revenue Source | Burn % | Prize Pool % | Rationale |
|---|---|---|---|
| Tournament entry fees | 50% | 50% | Activity burns supply, funds prizes |
| Signal Pass purchases | 30% | 70% (next season pool) | Seasonal burn, funds future prizes |
| Cosmetic Foundry | 100% | 0% | Pure sink (already burned at mint) |

**Why this creates buy-and-hold pressure**:
- Every gameplay activity burns $WICK → deflationary
- The burn reduces supply → each remaining token is worth more
- The prize pool creates competitive demand → players buy to compete
- The deflationary flywheel: more players → more activity → more burns → less supply → higher value → more incentive to hold

---

## 4. The Buy-and-Hold Flywheel

```
Player discovers the game (free)
  → Plays daily, gets hooked (no token needed)
  → Wants to compete in tournaments → BUYS $WICK (Layer 2)
  → Wants margin insurance → STAKES $WICK (Layer 3, locked)
  → Wants a skin → BURNS $WICK (Layer 4, deflationary)
  → Wants seasonal content → LOCKS $WICK (Layer 5, reduces supply)
  → Activity burns more $WICK (Layer 6, deflationary)
  → Supply shrinks, value rises → holding is rational
  → Holding duration multiplier rewards patience → DON'T SELL
  → Tournament prizes attract more players → cycle repeats
```

**The key insight**: every layer creates a reason to ACQUIRE $WICK and a reason
to NOT SELL it. The current economy only creates reasons to play (which doesn't
require buying). This alternative creates structural demand at every level of
engagement.

---

## 5. Comparison: Current Economy vs. Signal Forge Economy

| Dimension | Candle Climber (Current) | Signal Forge (Alternative) |
|---|---|---|
| Token demand driver | Speculative (graduation meter) | Utility (tournaments, insurance, cosmetics) |
| Holding incentive | Airdrop weights (play, don't buy) | Multiplier + staking + lock (buy AND hold) |
| Burn mechanism | Trade tax 5% (automatic, passive) | Foundry + tournament fees (active, gameplay-driven) |
| Sink depth | Cosmetics (post-graduation, roadmap) | Foundry + Signal Pass + tournament fees (layered) |
| Player-to-buyer conversion | Indirect (play → maybe buy) | Direct (compete → must buy) |
| Deflationary pressure | Passive (tax burns) | Active (gameplay burns) |
| Recurring demand | Daily streaks (play, not buy) | Daily tournaments + monthly Signal Pass (buy) |

---

## 6. Anti-Sybil Design

Same principles as Candle Climber, adapted:

1. **Tournament entry**: One entry per wallet per day (enforced on-chain)
2. **Holding multiplier**: Measured by on-chain balance history, not self-reported
3. **Margin insurance**: One stake per wallet, 7-day lock prevents rapid cycling
4. **Cosmetic Foundry**: One mint per burn, no batch minting
5. **Signal Pass**: One pass per wallet per season
6. **Score validation**: Same HMAC token system as Candle Climber

The holding-duration multiplier is the strongest anti-sybil measure: a sybil
attacker would need to buy and hold $WICK across many wallets for 90 days to
maximize their multiplier — the cost of the attack exceeds the prize.

---

## 7. Ecosystem Fit

### 7.1 vibe/vibe Launchpad Compatibility
- Same bonding curve, same graduation target, same tax structure
- The six-layer economy operates WITHIN the existing token framework — no
  contract changes needed, just gameplay-side mechanics
- Pre-graduation: Layers 2-5 use on-chain balance reads (same as Candle
  Climber's Balance Gate) — no transfers needed
- Post-graduation: Tournament entry, Foundry burns, and Signal Pass use
  actual token transfers (transfers unlock at graduation)

### 7.2 Platform Incentive Qualification
- The 5% utility track incentive pool rewards "MVP, demo, prototype, or
  usable flow" — Signal Forge ships as a playable MVP, same as Candle Climber
- The tournament system creates legitimate, reviewable on-chain activity
- The burn mechanics create verifiable deflationary pressure
- The holding-duration multiplier creates a measurable "holder base" metric

### 7.3 Founder's "Merge Zone"
The founder wants "game × stock pairs × storytelling." Signal Forge:
- **Game**: top-down arena survival, a proven viral genre
- **Stock pairs**: the arena is generated from real stock/crypto data (same
  data pipeline as Candle Climber, including Robinhood Chain on-chain anchors)
- **Storytelling**: Liquidation Cards tell the story of each run; the
  tournament narrative creates weekly dramas; the Foundry creates collectible
  character expression

---

## 8. Risk Analysis

### 8.1 Risks of This Design
- **Complexity**: six layers is more complex than Candle Climber's airdrop
  weights. More moving parts = more attack surface.
- **Token price dependency**: if $WICK price is too high, tournament entry
  becomes prohibitive; if too low, the burn sink is meaningless.
- **Regulatory uncertainty**: tournament entry with token stakes may be
  construed as gambling in some jurisdictions — the "skill, not spend" principle
  must be maintained (score is skill-based, the stake is an access pass, not
  a wager).

### 8.2 Mitigations
- **Phased rollout**: Layer 1 (free) ships first; Layer 2 (tournaments) at
  graduation; Layers 3-6 post-graduation based on traction
- **Dynamic thresholds**: entry/stake amounts adjust based on token price
  oracles (same Chainlink feeds the game already uses)
- **Skill-first framing**: tournament ranking is always score × multiplier,
  never token-balance-weighted. A player with 1,000 $WICK can beat a player
  with 1,000,000 $WICK if their score is higher. The token is an access pass,
  not a power multiplier.

---

## 9. Honest Assessment

This tokenomics model is **stronger at creating buy-and-hold pressure** than
the current airdrop-weights model, because every gameplay layer creates a
reason to acquire and retain $WICK. However, it is also **more complex and
has more regulatory surface area** — the tournament/stake model is closer to
"pay-to-compete" than "play-to-earn-weights," which may attract different
scrutiny.

The right answer for the final product is likely a **hybrid**: keep the
airdrop-weights system for the free base game (it's proven, compliant, and
ecosystem-native), and ADD the tournament/stake/burn layers as post-graduation
enhancements that create organic buy-and-hold pressure without gating the
core experience.

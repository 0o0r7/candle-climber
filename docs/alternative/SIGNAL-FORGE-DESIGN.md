# SIGNAL FORGE — Alternative Game Design

> **Independent design by Base44.** This is an original alternative concept, not a
> reskin of Candle Climber. It shares the market-data DNA (charts → gameplay) but
> changes the genre, perspective, visual identity, interaction model, and economy
> structure to test whether the product's soul survives a complete transformation.

---

## 1. One-Line Pitch

**"The order book is the battlefield."** A top-down arena survival game where real
market depth becomes a glowing grid arena. Navigate through bid/ask walls, manage
your margin, collect signal fragments, and outlast the market's volatility.

---

## 2. Why This Alternative Exists

Candle Climber is a vertical skill platformer — one of the strongest genre fits for
"chart as level." But it has structural constraints:

- **Genre ceiling**: platformers appeal to a specific skill demographic. The
  auto-scroll + jump grammar limits the audience and the depth of market interaction.
- **Single-axis reading**: climbing UP a chart teaches one dimension (price over time).
  It cannot represent order-book depth, bid/ask spread, or liquidity — the richer
  market structures that traders actually navigate.
- **Death = falling**: the failure state is binary and physical. It doesn't model
  the gradual margin erosion that defines real trading risk.

Signal Forge tests a different hypothesis: **what if the market data shaped a spatial
arena you navigate, not a timeline you climb?** This unlocks:

- **Two-dimensional market reading**: the grid encodes both price direction AND
  liquidity depth, teaching a richer market intuition.
- **Broader genre appeal**: top-down arena survival (Vampire Survivors, Brotato)
  is one of the most popular indie genres of 2024-2026 — accessible, replayable,
  and inherently viral.
- **Gradual failure**: margin erosion is a continuous pressure, not a binary fall.
  Every second on a red cell is a decision, not an instant death.

---

## 3. Design Pillars

1. **Read the depth, not just the direction** — the grid encodes bid/ask walls,
   spread, and liquidity. Skill = spatial awareness + market literacy.
2. **Same arena, everyone** — one Daily Seed (UTC date → symbol + window) means
   scores are globally comparable, same as Candle Climber.
3. **Margin is the clock** — you don't fall off; you bleed out. Every cell is a
   risk/reward calculation. Time is the resource, margin is the constraint.
4. **Death is still the content** — Liquidation Cards turn every margin call into
   a shareable artifact, same social loop, different visual language.

---

## 4. Core Loop (~90 seconds)

```
ENTER the daily arena → READ the grid layout → NAVIGATE through safe zones
→ COLLECT signal fragments → AVOID volatility waves → MANAGE margin
→ GET LIQUIDATED → SHARE the Liquidation Card → "one more run"
```

---

## 5. Arena System

### 5.1 Grid Generation from Market Data

The arena is a **16×12 grid** (192 cells). Each cell is derived from a candlestick
in the daily seed's chart:

| Candle Property | Arena Cell Property |
|---|---|
| Bullish (close > open) | **Green cell** — safe ground, regenerates margin |
| Bearish (close < open) | **Red cell** — hostile, drains margin |
| Body size (volatility) | Cell "intensity" — larger bodies = stronger effect |
| Wick high/low | Cell "range" — wicks create neutral buffer zones |
| Volume | Signal fragment spawn rate on that cell |

### 5.2 Cell Types

| Cell | Color | Effect | Visual |
|---|---|---|---|
| **Bid Wall** (green) | `#00FF9D` glow | +2% margin/sec, signal fragments spawn here | Glowing mint cell with pulse |
| **Ask Wall** (red) | `#FF4D6D` glow | -3% margin/sec, no signals | Pulsing coral cell with static |
| **Spread** (neutral) | `#1a1a1c` | No effect, passable | Dark gray voxel cell |
| **Liquidity Pool** (special) | `#70F3FF` iridescent | +5% margin instant, rare | Iridescent shimmering cell |
| **Volatility Pulse** (hazard) | `#FF00FF` magenta | Sweeping wave, flips cell states | Magenta wave with particle trail |

### 5.3 Volatility Waves

Every 8-12 seconds (seed-derived), a **volatility wave** sweeps across the arena:
- Originates from a random edge (seed-determined)
- Travels in a straight line across the grid
- Flips all cells it touches: green→red, red→green
- Visual: a magenta wavefront with particle trail
- The wave is TELEGRAPHED 1.5 seconds before arrival (a warning shimmer on the
  affected row/column) — skill is reading the warning and repositioning

### 5.4 Signal Fragments

- Spawn on green cells at seed-derived intervals
- Worth 50 base score each
- Despawn after 4 seconds if not collected
- Collecting 5 in a row without touching red = **SIGNAL CHAIN** (2× multiplier)
- Visual: small iridescent diamond, pulsing

---

## 6. Margin System

| State | Margin Range | Effect |
|---|---|---|
| **Healthy** | 70-100% | Normal speed, full vision |
| **Warning** | 30-70% | Screen edge vignette pulses coral |
| **Critical** | 10-30% | Red screen flash, audio alarm |
| **Liquidated** | 0% | Run ends — Liquidation Card generated |

- **Regen rate**: +2% per second on green cells
- **Drain rate**: -3% per second on red cells
- **Neutral cells**: no change (breathing room)
- **Liquidity Pool**: instant +15% margin (one-time per pool, respawns after 20s)

The margin system replaces the binary "fall off the screen" death with a continuous
pressure curve. A skilled player can recover from critical margin by finding green
cells; a greedy player who chases signals into red zones gets punished gradually.

---

## 7. Scoring

| Component | Points | Notes |
|---|---|---|
| Survival time | 1 pt/sec | Base score for staying alive |
| Signal fragment | 50 pts | Collected on green cells |
| Signal chain (5x) | 2× multiplier | Consecutive green-only collections |
| Margin efficiency | bonus | End-of-run: avg margin × 100 |
| Volatility dodge | 25 pts | Being adjacent to a wave when it passes without getting flipped |

**Anti-cheat**: score ≤ survival_time × 10 + signals × 50 × 2 + 100 (physically
reachable). Server-side validation, same HMAC token system as Candle Climber.

---

## 8. Daily Mutations

One mutation per UTC date, derived from the same seed:

| ID | Name | Effect |
|---|---|---|
| calm | CALM MARKET | Baseline — slow waves, generous green |
| volatile | HIGH VOLATILITY | Waves every 5-8s, faster flips |
| bearraid | BEAR RAID | 60% red cells, 2× score multiplier |
| bullrun | BULL RUN | 70% green cells, signals worth 25 |
| flashcrash | FLASH CRASH | Periodic instant full-arena flips |
| drain | LIQUIDITY DRAIN | Green cells shrink over time |

---

## 9. Visual Identity

### 9.1 Aesthetic
**Voxel holographic** — the approved "G" logo's visual language applied to a
top-down arena. Every element is built from blocky, geometric forms with neon
emissive edges, set against a deep black background.

### 9.2 Palette

| Token | Hex | Use |
|---|---|---|
| `bg-void` | `#0a0a0c` | Arena background |
| `bg-deep` | `#0d0d12` | UI background |
| `voxel-dark` | `#1a1a1c` | Neutral cells, structures |
| `voxel-mid` | `#262628` | Cell borders, grid lines |
| `neon-mint` | `#00FF9D` | Green cells, player, safe |
| `neon-coral` | `#FF4D6D` | Red cells, danger, margin warning |
| `iridescent-cyan` | `#70F3FF` | Liquidity pools, special |
| `iridescent-magenta` | `#FF00FF` | Volatility waves, hazards |
| `iridescent-purple` | `#B28DFF` | Signal fragments, chains |
| `text-light` | `#E8E8F0` | UI text |
| `text-dim` | `#6B6B80` | Secondary text |

### 9.3 Typography
- **Display**: Space Grotesk (headlines, arena labels)
- **Mono**: JetBrains Mono (margin, score, telemetry)
- **Body**: Inter (UI text, descriptions)

### 9.4 Character
The player is the **blocky robot mascot** from the approved character sheet — a
Minecraft-style robot with a smaller companion on its back. In the arena, it
appears as a top-down voxel sprite with a glowing mint outline.

### 9.5 Signature Visual Elements
- **Grid cells** with glowing borders and inner pulse
- **Volatility waves** as sweeping magenta particle fronts
- **Signal fragments** as iridescent floating diamonds
- **Margin meter** as a holographic ring around the player
- **Liquidation effect** as a screen-wide coral flash + voxel disintegration

---

## 10. Controls

| Platform | Input | Action |
|---|---|---|
| Desktop | WASD / Arrow keys | 8-directional movement |
| Desktop | Space | Dash (3s cooldown, brief invulnerability) |
| Desktop | Shift | Sprint (drains margin faster) |
| Mobile | Virtual joystick | 8-directional movement |
| Mobile | Tap dash button | Dash |
| Mobile | Tap sprint button | Sprint |

---

## 11. Liquidation Card (Share Loop)

Same social DNA as Death Cards, different visual language:
- 1080×1350 PNG, generated at runtime
- Shows: score, symbol, date, mutation, margin at death, survival time, rank
- Visual: the player's robot in a "liquidated" state (voxel disintegration),
  surrounded by the arena grid that killed them
- Funny liquidation causes: "Your margin was decorative.", "You held through the
  flash crash. Bold.", "The bid wall was a mirage."
- Actions: Download / navigator.share (mobile) — no login, no friction

---

## 12. Architecture

```
src/game/vg/
  types.ts      Arena types — cells, signals, run results
  rng.ts        Shared seeded PRNG (reuses cc/rng.ts)
  arena.ts      Market data → grid arena generation
  mutations.ts  Daily mutation system
  engine.ts     Game loop, movement, margin, collision, scoring
  render.ts     Canvas renderer (voxel holographic style)
  sound.ts      WebAudio synth SFX (zero assets)
  liquidation-card.ts  Offscreen-canvas share card
```

The game reuses the existing market data pipeline (`level-source.ts`) for
daily seed selection and candle fetching — the arena is a different PROJECTION
of the same data, not a different data source.

---

## 13. What This Tests vs. Candle Climber

| Dimension | Candle Climber | Signal Forge | What the comparison reveals |
|---|---|---|---|
| Genre | Vertical platformer | Top-down arena survival | Does the audience prefer climbing or surviving? |
| Market reading | 1D (price over time) | 2D (price + liquidity depth) | Can a grid teach richer market intuition? |
| Failure state | Binary (fall) | Gradual (margin erosion) | Is continuous pressure more engaging than instant death? |
| Visual identity | Dark cyber-lime | Voxel holographic neon | Which aesthetic resonates more with the ecosystem? |
| Session feel | Auto-scroll urgency | Spatial navigation | Which loop has better retention? |
| Tokenomics | Airdrop weights (play to earn weights) | Stake-to-compete + burn sinks | Which model creates stronger buy-and-hold? |

---

## 14. Honest Assessment — Where This Concept Wins and Loses

### Wins
- **Broader genre appeal**: arena survival is more accessible than platformers
- **Richer market model**: 2D grid encodes more market information than 1D climb
- **Better onboarding**: "move to green, avoid red" is instantly comprehensible
- **Stronger tokenomics**: stake-to-compete creates organic holding pressure that
  airdrop weights do not — you must hold to play at the highest level

### Loses
- **Less physical skill expression**: movement is simpler than variable-height
  jumps with coyote time and jump buffering
- **No auto-scroll urgency**: the arena is static between waves, so the pressure
  is self-directed, not externally forced — may feel less tense to some players
- **New codebase risk**: the engine is new and unproven vs. Candle Climber's
  mature, tested, 534-test codebase
- **Market data is less literal**: a grid of cells is a more abstract projection
  of candlestick data than climbing actual candles — purists may prefer the
  literal chart representation

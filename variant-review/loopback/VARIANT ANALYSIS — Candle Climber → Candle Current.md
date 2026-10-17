# VARIANT ANALYSIS — Candle Climber → Candle Current

## Scope and evidence

This analysis is based on the shipped original repository `0o0r7/candle-climber`, its required project documents, the connected `0o0r7/vibe-ecosystem-kb` research files under `research/vibevibe/*.md`, and the live page at https://candle-climber.vercel.app. The original repository was cloned read-only to `/home/ubuntu/candle-climber-study`; no files in that checkout are modified.

## 1. Core loop

**Candle Climber** makes the chart the level. A daily deterministic symbol and timeframe produce a sequence of candle-shaped platforms. The player auto-scrolls upward, jumps between green bodies, avoids red bodies that crumble, manages combo streaks, and is liquidated when falling below the camera. A run ends in a score/death-card/share loop.

The loop is unusually coherent:

1. See the daily chart preview and mutation.
2. Read the next candle's direction and height.
3. Tap/press to jump, optionally hold for a higher jump, and optionally hold SHIFT for a faster risky climb.
4. Land on green candles, survive crumbling red candles, and preserve combo.
5. Reach the deterministic summit or get liquidated.
6. Submit a server-verified score, inspect the board/rival gap, download/share a Death Card, retry.

The implementation backs up the pitch: fixed-timestep physics, coyote time, jump buffering, jump-cut, deterministic level generation, mutation modifiers, HMAC run tokens, physical score caps, and a canvas renderer.

## 2. Progression and economy mechanics

### Shipped progression

- **Daily seed:** UTC date → deterministic symbol/timeframe → same terrain for all players.
- **Difficulty variation:** six daily mutations, including physics changes and a decor-only candle-rain variant.
- **Short-term mastery:** green-candle streaks increase combo multiplier; rush mode trades safety for faster gains.
- **Milestone arc:** summit graduation continues into a procedural World 2 with doubled gains.
- **Identity layer:** a roster of cosmetic characters with decor-only visual effects.
- **Archive:** practice levels based on historical dates; famous eras are documentary content rather than hand-authored levels.
- **Social pressure:** daily leaderboard, rival gap, ghost/rival overlays, async duel codes, wreckage ghosts, Death Cards.
- **Persistence:** local best, mute preference, run count, selected character, and local wreckage; leaderboard persistence is memory by default and Mongo-backed when configured.

### Economy philosophy

The original docs frame the free base game as skill-first, with a future $WICK layer: read-only balance gates for summit tiers/cosmetics, deterministic airdrop-weight accounting from streaks/route prediction/archive marathon, and post-graduation spend/burn/tournament/MIRROR ideas. The platform research is explicit: Robinhood Chain testnet is chainId 46630; transfers are locked until graduation; the current launch policy references a 5 ETH net graduation target, 2% wallet cap, 1.25% curve fee, and 2% creator tax configuration. These are platform facts from the repository's research, not assumptions for the variant.

### Economy tension

The original's eventual token story is strong but mostly deferred: the live base game is an excellent skill product, while the balance-gate, weights, and post-graduation mechanics are future work. A holder perk that changes score would also threaten the original's best promise—fair, comparable skill scores.

## 3. Visual identity

- **Brand language:** dark, compressed, builder/crypto-native interface.
- **Palette:** `#101214` background, lime `#CCFF00`, green `#5BD08A`, coral `#E07856`, purple `#6A63C8`.
- **Type:** Clash Display for display, Instrument Sans for UI, JetBrains Mono for numbers.
- **Rendering:** custom Canvas 2D with 5-layer parallax, candle slabs, wicks, fog/wind/tremor weather, particles, camera shake, squash/stretch, procedural blockbot and optional sprite roster.
- **Tone:** terse market humor—“LIQUIDATED”, “PAPER HANDS”, “the chart is the level”.
- **Share asset:** a 1080×1350 PNG Death Card designed for X/WebShare.

The visual system is coherent and recognizable, but it is also closely tied to a conventional vertical platformer: dark canvas, bright platform slabs, small player avatar, and dense HUD/overlay panels.

## 4. Architecture

- Next.js 16 App Router + TypeScript.
- `src/components/cc/GameCanvas.tsx` is the large client orchestration shell.
- `src/game/cc/` contains pure-ish contracts and the custom engine: level, RNG, mutations, weather, terrain, renderer, sound, archive, ghosts, wreckage, rivals, characters, death-card generator.
- Server routes provide candles, leaderboard, ghosts, duels, and reports.
- Market feeds are server-proxied (Binance/Yahoo/Stooq) with synthetic fallback; the level-source abstraction is a deliberate future plug for vibe/vibe launches.
- HMAC run tokens bind server-issued terrain to score submission; validation includes rate limits and physical caps.
- Storage is zero-config memory with an optional MongoDB Atlas adapter.
- Existing project quality is high, with documented audit findings mostly around deployment/metadata and owner-gated infrastructure rather than the core game feel.

## 5. Concrete weaknesses and variant opportunities

### Opportunity 1 — The first ten seconds are information-dense
The live page communicates daily symbol, move, difficulty, mutation, timeframe, ghost state, duel entry, character roster, and platform links before play. It is honest and feature-rich, but a newcomer has to parse the product before touching it.

**Variant response:** start on the playable surface with one sentence, one control affordance, and a single “launch current” action. Put market detail in a secondary instrument panel revealed after the first successful checkpoint.

### Opportunity 2 — The variant should not be another vertical platformer
The original owns its lane. A second version that only changes palette/mascot would produce little learning.

**Variant response:** make the chart a **current/tide field** instead of a staircase: steer a small vessel through three lanes, with candle-derived current direction, turbulence, and boost gates. The player reads a chart, but movement is lateral timing and risk management rather than auto-scroll jumping.

### Opportunity 3 — Failure is frequent but the emotional read is mainly “fall/liquidation”
The original has excellent failure copy and Death Cards, but the dominant visual event is still a fall from a platform.

**Variant response:** failure becomes a visible “breakwater” event: the vessel gets pushed into a coral/red turbulence zone, the route is stamped, and the player sees exactly which candle regime broke the run. This gives a more legible cause-and-retry loop.

### Opportunity 4 — The original economy is mostly roadmap-shaped
$WICK utility, balance tiers, route prediction, archive marathons, and MIRROR mode are compelling but not central to the shipped base loop.

**Variant response:** use a two-layer economy immediately and safely: free players collect **Signal Notes** as local, non-transferable mastery marks; optional $WICK holder status unlocks cosmetic wake trails, alternate chart skins, and a private “night tape” route, but never score multipliers or base access. A transparent “testnet token / no monetary value” notice remains adjacent to any token link.

### Opportunity 5 — Score fairness and holder utility pull in opposite directions
A purchasable score boost would weaken the original's anti-sybil/skill story.

**Variant response:** separate **ranked score** from **recognition weight**. Ranked score is identical for every player. Optional holder perks affect presentation, route selection, or archive access only. A future weight ledger can count verified play dimensions (streak days, pattern calls, archive routes) without promising anything.

### Opportunity 6 — The renderer is impressive but implementation risk is high for a small variant
The original has 14k+ source lines, many UI primitives, multiple server routes, and substantial visual effects. That is appropriate for a mature product but risky for a comparable experiment.

**Variant response:** build one self-contained client game with deterministic bundled demo tape, local persistence, no backend dependency, no paid APIs, no copied source, and a small explicit state machine: ready → playing → summary → retry.

### Opportunity 7 — “Real data” can obscure whether the terrain is real or derived
The original is careful, but generated launch metrics and synthetic fallback paths require explanatory copy.

**Variant response:** make provenance a first-class UI object. Every run shows one of `DEMO TAPE · SYNTHETIC`, `ARCHIVE TAPE · SOURCE PENDING`, or a future verified source label. This variant will ship only the first label and will not imply real prices or real user metrics.

### Opportunity 8 — The original’s persistence is fragmented across local keys and optional server state
This is acceptable for the live product but adds failure surfaces.

**Variant response:** persist one compact local profile: best score, sessions, streak, discovered patterns, mute, and selected wake. The game remains fully playable when offline.

## 6. What the variant should learn

Keep the original's strongest product truths: instant retry, deterministic fairness, real market vocabulary, shareable result artifact, honest testnet framing, and a product-first landing surface. Deliberately change the physical metaphor, visual temperature, progression vocabulary, interaction pattern, and economy boundary so the comparison yields useful signal rather than a reskin.

**Working variant hypothesis:** a calmer but sharper “market weather cockpit” will be easier to understand in ten seconds, while the original will remain stronger for reflex mastery, competitive depth, and market-authenticity proof.
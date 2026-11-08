# Candle Climber v1 Baseline for Sample-Game Synthesis

> **Snapshot:** repository research branch `research/studio-sample-catalog-v2`, baseline commit `e211cb7`. Re-check current code and policy before implementing; links below point to the repository's source of truth.

## What the game already does

Candle Climber is a daily auto-runner built around “the chart is the level.” A market chart becomes the jump surface: green candles are stable platforms, red candles crumble after landing, and a fall below the play area ends the run. The player is horizontally anchored while the camera advances automatically. Jump height is variable: press/tap or Space to jump, and hold/release to shape the jump. The engine also implements coyote time, jump buffering, fixed-step physics, and optional RUSH. See [`engine.ts`](../../src/game/cc/engine.ts) and [`GAME_DESIGN.md`](../../docs/GAME_DESIGN.md).

The engine treats Summit as a positive graduation milestone, not a death. World 2 continues beyond Summit with deterministic terrain and doubled base gains. Passing platforms updates `candlesPassed`, green-candle streak, best streak, combo multiplier (capped at ×7), and score. RUSH is an opt-in risk input: it accelerates camera movement and applies a 25% score-gain premium while active. Daily mutations can affect gravity, jump, camera speed, or crumble timing. The exact implementation and tests are authoritative; the gameplay constants are not to be changed by this research proposal.

## Existing goals and feedback

The ready screen already exposes START CLIMB, HOW TO PLAY, achievements, personal best, and current-day streak. Terrain/difficulty options, mutation, timeframe, VS BOT, ghost, duel, and stats are available in secondary sections. During play, the HUD can show source/symbol, mutation, rival, pause, RUSH, score, and combo. However, the ordinary HUD does not prominently show candle count or distance to Summit/next milestone; candle count is present in a VS BOT context. The likely v2 opportunity is better hierarchy and timing—not inventing a new progress or reward system.

After Summit, the Graduation panel shows score, candles, best streak, and PB and offers existing World 2/submit/retry/share paths. On death, Liquidated surfaces run statistics, PB/rank where available, Death Card, duel, retry, and home. Persistent product systems include achievements, local run/score/candle/graduation and streak history, `/stats`, personal best, daily chart, ghost, VS BOT, duel, and leaderboard. Verify current code before assuming a UI path is active or changing it.

## Product and policy constraints

`docs/ECONOMY-LAWS.md` is binding for economy-facing work. Holder or wallet state must not change run score, multiplier, `candlesPassed`, `bestStreak`, rank, or base game access. Guest mode remains free and walletless; the official competitive lane uses wallet identity, not wallet advantage. Cosmetics may be render-only. Any route/planning affordance must not reveal or imply terrain data unavailable to other players. Archive practice is unscored under existing rules.

`docs/PLATFORMER-UX-RESEARCH.md` rejects free BRAKE because it removes the established trade-off; lateral air steering and wall interaction are out of scope. Existing skill controls include RUSH, variable-height jump, coyote time, and jump buffering. Do not treat free brake, horizontal movement, wall interaction, or a branch requiring new controls as a default v2 idea.

`docs/ART-DIRECTION.md` locks candle color semantics and the existing translation grammar. The reachable candle surface and its cap must remain visually distinct from decoration. Do not copy sample-game art, assets, fonts, sounds, characters, UI text, or scene layouts.

## Strategic hypothesis to validate

Instead of expanding menus or controls, test a concise promise: “Today’s chart is shared; see the next light; climb through jump timing and optional RUSH.” A small progress rail to the next milestone/Summit, one short state-derived Candle Call, timely risk feedback, and a result recap are hypotheses—not confirmed solutions. They must reuse existing public-chart/game state, avoid score changes, remain deterministic where applicable, and pass user testing before expansion.

## Source references

- [`engine.ts`](../../src/game/cc/engine.ts) — physics, player anchor, camera, RUSH, platform pass/scoring, Summit, World 2.
- [`GameCanvas.tsx`](../../src/components/cc/GameCanvas.tsx) — HUD, ready state, options, result panels, fixed-step loop.
- [`ECONOMY-LAWS.md`](../../docs/ECONOMY-LAWS.md) — score, wallet, access, and lawful utility constraints.
- [`PLATFORMER-UX-RESEARCH.md`](../../docs/PLATFORMER-UX-RESEARCH.md) — control and movement scope.
- [`ART-DIRECTION.md`](../../docs/ART-DIRECTION.md) — visual grammar and rendering boundaries.
- [`RETIRED-FEATURES.md`](../../docs/RETIRED-FEATURES.md) — do-not-reintroduce ledger.
- [`report-en-final.md`](report-en-final.md) — sample research synthesis and measured hypotheses.

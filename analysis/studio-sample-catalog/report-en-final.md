# Sample-Game Research and Candle Climber v2 Roadmap

## Main finding

Forty sample-game entries were reviewed, but these were not 40 complete playable-game tests. All 40 public pages returned HTTP 200 and were recorded as `loaded`; the latest capture pass completed five intended capture stages for 23 games, was partial for 14, and hit `budget_timeout` for three. After merging supplemental image evidence, 39 games have at least one screenshot and 35 have five screenshots. Those frames may still show loading, menus, or only a partial game state. The most dependable evidence is therefore about entry experience, HUD, onboarding, and a few visible state changes—not complete loops, balance, or controls for every sample.

Candle Climber v1 does not appear to have a fundamental systems gap. Code and project documents already describe a deterministic daily seed, chart-derived terrain, variable-height jumping, coyote time, jump buffering, crumble, combo up to ×7, skill-based RUSH, Summit/Graduation, World 2, Death Cards, ghosts, VS BOT, duels, stats, and guest/official competitive lanes. The more defensible v2 opportunity is to make the near goal, Summit distance, and meaning of a choice easier to understand while a run is in progress—not to add horizontal steering, free brake, branching routes, or score-affecting economics.

## Counts and observation levels

| Measure | Count | Interpretation |
|---|---:|---|
| Independent map analyses | 40 | One record for each ID from `game-01` to `game-40`. |
| Pages recorded as HTTP 200 / `loaded` | 40 | A page load does not establish active gameplay. |
| Five-stage captures completed in the latest run | 23 | These frames may still show menus or loading. |
| Partial captures in the latest run | 14 | One or more stages may have timed out or fallen back. |
| `budget_timeout` in the latest run | 3 | `game-17`, `game-18`, and `game-28`. |
| Games with at least one merged image | 39 | One game has no final merged screenshot. |
| Games with five merged images | 35 | Image coverage does not mean five gameplay states. |
| `page_only` analyses | 25 | A page/menu/story/loading view was available; active gameplay was not confirmed. |
| `partial_gameplay` analyses | 15 | Some direct active-scene/state signal was seen; no full loop or outcome was confirmed. |
| Failures supplied in the analysis failure list | 0 | An empty failure list is not proof that no capture or experience failed. |

### No-image and menu-only records

In the merged evidence set, **game-05 / Canyon Circuit** has no final review image; its evidence also shows no completed capture stages. In the latest capture run, `game-05`, `game-17`, `game-18`, and `game-28` had zero screenshots. The latter three have image evidence in the merged set through prior/supplemental capture. Keep latest-run coverage distinct from merged coverage.

The 25 `page_only` records are: `game-01` Iron Rift FPS; `game-02` Space Worm 3D; `game-04` The Rogue; `game-05` Canyon Circuit; `game-06` Super Dungeon; `game-07` Caveman vs Wild; `game-08` Space Worm 2D; `game-09` Sands; `game-11` Wildclaw: Colossus Hunt; `game-15` Superhero High School; `game-16` BeatStage 3D; `game-17` TerraForge; `game-18` Sizzle Up!; `game-19` Super Defense; `game-21` Lion City: After Hours; `game-22` Frostline Zero; `game-23` Critter Kart; `game-28` Faraway; `game-30` Nebula Pinball; `game-31` Mushroom Garrison; `game-32` Starveil Barrage; `game-34` Cloud Climber; `game-38` Nebula Squadron; `game-39` Card Battler; and `game-40` Shadow. Some showed only loading (for example, games 01, 04, 09, and 32); some showed menus or story (for example, games 15, 23, 30, and 40). A screenshot is not equivalent to active gameplay.

The 15 `partial_gameplay` records are: `game-03` Side Scroller; `game-10` Frosthold; `game-12` Game Dev Game; `game-13` Lane Runner; `game-14` Hero Academy Architect; `game-20` Skybound Academy; `game-24` Siege; `game-25` Drift King; `game-26` Mini Golf Isles; `game-27` Strike Bowl; `game-29` Helix Drop; `game-33` Lantern Wayfarer; `game-35` Neon Alley Brawl; `game-36` Mushies - Merge Puzzle; and `game-37` Mage Knight. This label means only that a limited direct signal of an active scene or state was seen. It does not establish final balance, accepted controls, a complete loop, or a final outcome.

## What was directly visible

### Direct signals about goals and gameplay state

- **`game-10` / Frosthold:** In an active frame, the tutorial changes from “Stretch your legs” to “Chop a pine”; `0/3 wood`, temperature/health, time, and resource indicators are visible. This directly illustrates a short next objective, but rescuing survivors and a complete survival loop were not observed.
- **`game-13` / Lane Runner:** The frames show squad size increasing from 4 to 8, distance values of 16, 54, 87, and 109 metres, threat changing from 1.1 to 1.2, a combo reaching 5, and a coin count of 5. The message “Your squad fires automatically” is visible. Enemies and progression appear, but no run end or failure is shown.
- **`game-20` / Skybound Academy:** An active frame shows `CLIMB`, height `00439` metres, score `00877`, a badge, missions `1/5` and `1/3`, and combo `×1.5`. A later frame shows two hearts, then one heart and “Last heart!” This directly demonstrates goal/progress indicators and a visible failure cost; it does not prove the cause of every state change.
- **`game-24` / Siege:** An active scene shows `Score`, `Guards`, `Stones`, `Angle`, and `Power`. A later frame shows score 210 and `+100` / `+110` feedback. Immediate numeric feedback is visible, but no complete shot-to-win/loss sequence was captured.
- **`game-26` / Mini Golf Isles:** An active course and rotating obstacle appear with a `STROKES` HUD. Values change from `STROKES 0` to `STROKES 1` and `Total 1`. This supports the presence of an active state, but the generic capture is not game-specific, so input causality is not certain.
- **`game-29` / Helix Drop:** `Stage 1/6` and score 0 are followed by score 10 and detached geometric fragments. An action-feedback signal is visible, but neither final completion nor failure was captured.
- **`game-36` / Mushies - Merge Puzzle:** The active frame includes `Score`, `Time`, `Goal 1`, `Next`, and `Drops`; time changes from 3:00 to 2:54 and Drops from 0 to 2. A merge and its result are not shown.

### Direct signals about onboarding and legibility

- **Frosthold (`game-10`):** Staged instructions—“Done: Stretch your legs” followed by “Chop a pine”—appear with an objective counter. This is a visible example of a concise next action.
- **Game Dev Game (`game-12`):** Three idea cards show time, FUN, RISK, and on-theme multipliers, followed by a build screen with ENERGY, HYPE, BUGS, time, and backlog. The choice and cost are visible; publishing and the result are not.
- **Hero Academy Architect (`game-14`):** Guidance states 100 Academics and 100 Power goals and a three-midnight debt limit, alongside room/schedule tools. The active frame contains multiple indicators and small goals.
- **Nebula Pinball (`game-30`):** Tutorial frames show Launch, Flippers, and Nudge, plus a TILT warning, but active gameplay was not reached. A displayed tutorial is not proof that learning succeeded.
- **Cloud Climber (`game-34`):** Daily/Endless menu, audio/effects/shake/language settings, and large buttons are visible, but no active climb was observed. Control copy alone is not gameplay evidence.

### Advertised patterns that were not observed

For many entries, the official card advertised substantial features while the frames remained on loading or menus: growth/devouring in `game-02`, boss hunting in `game-11`, RTS in `game-15`, restaurant play in `game-18`, wave defense in `game-19`, tower defense in `game-31`, bullet-hell in `game-38`, and card battles in `game-39`. These remain **interesting claims**, not observed research findings.

## Transferable patterns, confidence, and risk

### 1. Countable short goals — strong pattern; low implementation risk

Where directly visible, short goals are easier to identify than broad descriptions: `0/3 wood` in Frosthold, `1/5` and `1/3` missions in Skybound Academy, and `Goal 1` in Mushies. The safe Candle Climber transfer is not a new progression system. It is to make an existing near-term objective or rail more prominent during the run.

### 2. Concurrent state and progress cues — strong pattern; moderate implementation risk

HUDs in Lane Runner, Skybound Academy, Siege, and Mini Golf Isles place distance/height/threat/lives/score in a frame. Candle Climber already has score and combo, but the v1 baseline says candle count and Summit distance are not prominent in the ordinary HUD. The likely issue is information hierarchy and legibility, not absence of game systems.

### 3. Immediate risk consequence — strong as a principle, not as numeric balance guidance; moderate risk

The heart reduction and “Last heart” message are directly visible in Skybound Academy; Lane Runner shows threat and squad indicators; Siege shows resource/score feedback around an action. Candle Climber already has red-candle crumble, falls, combo breaks, and RUSH. v2 should clarify those existing consequences, not add free brake or a new route.

### 4. Staged onboarding — testable; low-to-moderate risk

Frosthold and Hero Academy offer stronger direct evidence; Nebula Pinball and several others show only page-level tutorials. Test a short in-run version of Candle Climber's existing instructions, with one goal per step and visible success feedback, instead of making a longer tutorial menu.

### 5. Multi-factor choices — testable; moderate-to-high risk

Game Dev Game presents time/FUN/RISK cards, and Frosthold shows paths/resources, but final consequences were not captured. Do not transfer this into route branching or new controls for Candle Climber. If tested, constrain it to timing the existing optional RUSH/skill commitment on the same public terrain and keep scoring skill-only.

### 6. “Changed frame or technical trace proves gameplay” — rejected; very high risk

Across the 40 records, a frame may change because of animation or elapsed time. Canvas counts, Godot/Three.js/WebGL markers, software fallback, HTTP 403/400, or AudioContext messages do not establish asset origin, the active product engine, accepted controls, or gameplay quality. A strong methodological requirement follows: every claim must retain its evidence type and certainty—screenshot, page text, official card, or technical trace.

## Candle Climber diagnosis from code and project documents

Candle Climber is a daily auto-runner. The camera advances automatically while the player remains at a fixed horizontal screen anchor; tap/Space initiates a jump, and holding/releasing changes jump height. Green candles are stable platforms; a red candle crumbles about 0.26 seconds after landing under baseline settings, and falling below the view ends the run. RUSH speeds camera motion and increases score gain by 25% while active; gravity-hang behavior applies while the jump is held during ascent. The engine uses a fixed timestep. See [`engine.ts`](../../src/game/cc/engine.ts).

Passing platforms updates `candlesPassed`, green streak, multiplier up to ×7, and score. `graduate()` marks Summit as a positive milestone independent of death; World 2 continues deterministically with doubled base gains. Existing UI includes a ready screen, HOW TO PLAY, PB/streak, mutation, source/provenance, pause, RUSH, score, and combo. Graduation/Liquidated results show score, candles, best streak, PB, rank where applicable, retry/share, and Death Card. Achievements and a stats ledger already exist. The code-backed diagnosis is not “no progression or reward”; it is that near-term objective, Summit position, RUSH trade-off, combo status, and post-error learning may be under-exposed during play.

The project's truth and policy documents distinguish deterministic daily chart data, skill-only score, anti-sybil rules, and separate competitive lanes; some stock feeds are marked partial and on-chain OHLC/data claims are not connected. The economy law forbids wallets, holdings, burns, lockups, or NFTs from changing score, multiplier, `candlesPassed`, best streak, rank, or base access. The base game must remain free and guest-accessible. Wallet identity can identify the official competitive lane, but is not a skill advantage. See [`TRUTH-TABLE.md`](../../docs/TRUTH-TABLE.md), [`FEEDS.md`](../../docs/FEEDS.md), and [`ECONOMY-LAWS.md`](../../docs/ECONOMY-LAWS.md).

## v2 concept to test

### Hook: “See the next light” — live progress, not another menu

Give each run a small, stable **Summit Rail** near the HUD: current position, next milestone, and Summit on the same daily chart. At a short interval, show one automatic **Candle Call**, such as “Three green landings to the next light” or “Keep the combo through this window.” This is not a new route, branch, control, or paid reward. It summarizes a target from the same terrain and existing rules. The player still uses the same tap/Space, hold/release jump, and optional RUSH.

The emotional hook is “I am not just jumping; I am climbing toward the next light.” Lights should map to readable milestones such as the next range, a best streak, or safely crossing a visible risk window. Score, physics, rank, and leaderboard remain unchanged and skill-only. Candle Call must not reveal information beyond what is already visible on the public chart.

**Recommendation strength: strong. Implementation risk: moderate.** The proposal directly addresses the documented v1 visibility gap and reuses existing systems. Main risks are HUD clutter, a contract that feels compulsory, or a call that does not match terrain. If comprehension testing fails, shrink the rail/call or show it only at milestones.

### Testable and uncertain hypotheses

- **Testable; moderate risk:** give Candle Call only one near-term objective. If players cannot understand it in under one second, remove or simplify it.
- **Testable; moderate risk:** show `RUSH = faster +25% gain` only at the first meaningful opportunity; do not repeat it continuously.
- **Testable; high risk:** show a micro-verdict such as `CALL CLEAR` / `CALL MISSED` at the end of a window. It must not create a separate score or economic reward.
- **Uncertain; high risk:** explicit choice between two contracts or routes. Not a default; it can imply branching, new information, and more control complexity.
- **Uncertain; very high risk and currently rejected:** free brake, lateral movement, wall interaction, or wallet/purchase advantage. Project docs reject these directions.

## Example moment-to-moment flow

1. **0–3 seconds — ready:** The player sees today's chart. Below `START CLIMB`, a three-part rail reads `NOW → NEXT LIGHT → SUMMIT`; one concise call reads “First light: 3 green landings.” No new menu opens.
2. **3–8 seconds — learn by doing:** The player taps/presses Space. The existing short/long jump instruction appears near the character as a small cue. The first green landing advances the rail and displays `CALL 1/3`; this is direct feedback, not new score.
3. **8–18 seconds — first commitment:** A visible red crumble appears in the route. The player chooses jump timing/height; RUSH is available but not required. If held, a short label can read `RUSH ACTIVE · +25% gain · tighter timing`. Not using RUSH carries no penalty beyond not taking the speed/gain opportunity.
4. **18–30 seconds — first light:** After three target landings, the rail lights and displays `LIGHT 1 CLEAR · BEST STREAK xN`. Existing combo and score update as usual; the player can attribute success to an action.
5. **30–50 seconds — readable pressure:** The next call is derived from the same terrain, e.g. “Cross the next window without breaking combo.” If a red landing/crumble occurs, show a short causal message such as `CALL MISSED · combo reset` or `RED PLATFORM CRUMBLED`, only when that statement matches actual state.
6. **50–70 seconds — Summit approaches:** The rail fills toward the actual Summit/milestone. Keep the mutation chip separate; do not repeat `rush` or `fragile` in the rail if the same state is already presented elsewhere.
7. **Positive end:** Graduation retains existing results and adds one concise recap, e.g. `3 lights cleared · best streak xN · RUSH used/not used`. Existing World 2, Death Card, submit, and retry actions remain.
8. **Negative end:** Liquidated keeps score/candles/PB/rank and may add `Last light: 2/3 · Cause: fell after red crumble · Next: same daily chart`. Do not imply a reward or advantage.

## Goal, progress, choice, reward, penalty, outcome, and replay

- **Goal:** Reach Summit and clear run milestones on the shared daily chart.
- **Progress:** Summit Rail, Candle Call, score, combo, `candlesPassed`, and mutation chip; use existing data or make it more legible.
- **Choice:** Jump timing, jump height via hold/release, and optional RUSH. No paid choice or new control is required.
- **Reward:** Clear feedback, best streak, achievements, Death Card, ghost/duel, and comparison on the same chart. Cosmetic/archive additions may be separately considered; rank and physics must never change.
- **Penalty:** Fall, red crumble, combo reset, missed RUSH opportunity, and Liquidated. Show the real consequence promptly and accurately.
- **Outcome:** Existing Graduation or Liquidated with score/candles/streak/PB/rank and an optional Candle Call recap.
- **Replay:** Retry the same daily terrain, compare against PB/ghost/VS BOT/duel, or enter World 2 after Summit. These are existing systems; the proposal concerns surfacing them at the right moment.

## P0–P3 roadmap and acceptance criteria

### P0 — data honesty and measurable baseline

**Work:** Measure baseline comprehension of the next goal, Summit, RUSH, death cause, and retry behavior. Instrument only safe, non-score-affecting events. Keep feed provenance and archive/derived/unscored states distinct. Add regression coverage for score, physics, rank, wallet, and guest/official paths.

**Acceptance:** Two identical climbs with different wallets produce identical score/multiplier/rank; no new UI makes a wallet necessary to play; fixed-step and W5 tests stay green; in a playtest, at least 80% of players identify the near goal and Summit within five seconds without researcher help.

**Risk:** Instrumentation may clutter the game. Raw event data must not be used to assert behavioral causality without a test.

### P1 — minimum Summit Rail and Candle Call

**Work:** Implement a three-point rail, one near-term call, and clear/missed feedback from existing state. Do not change score math, controls, terrain generation, or economy. Test on mobile and desktop.

**Acceptance:** In at least 20 playtests, 85% of players can state the next goal without explanation; time to locate Summit improves over baseline; run-start and retry rates increase without meaningful regression in completion or perceived fairness. Reduce reported “I did not know where to go” errors by at least 30%.

**Risk:** The rail becomes a decorative bar or an unfair predictor. A call must only summarize information available on the chart.

### P2 — risk feedback and learnable results

**Work:** Add short, state-grounded feedback for RUSH, combo reset, red crumble, fall, and missed light; optionally recap calls in Graduation/Liquidated. Connect to Death Card only as narrative/share context, not score. Test copy, contrast, reduced motion, keyboard, and touch.

**Acceptance:** 80% of players correctly identify their cause of death; time from Liquidated to Retry improves over baseline; players can state what they will change next run; wallet or cosmetic state causes no score/rank difference.

**Risk:** Mid-jump messages distract. Non-critical messages should be short, dismissible, or delayed until landing.

### P3 — cautious expansion only after legibility is proven

**Conditionally allowed:** More Candle Call types derived from the same terrain, a daily performance recap, optional ghost/duel links, and cosmetic milestone badges. Archive/practice remains unscored. Any contract must be deterministic, testable, and score-blind.

**Out of scope by default:** Branching routes, free brake, lateral movement, wall interaction, purchased multipliers, wallet-gated base access, or any reward that changes rank/physics.

**Acceptance:** An A/B test improves near-goal comprehension and retry rate without regression in fairness audit, determinism, anti-cheat, performance, or completion. At least 90% of experimental runs rate the call as consistent with visible terrain; mutation and World 2 parity are preserved.

**Risk:** Feature growth dilutes clarity. Do not start P3 if P1/P2 fail their gates.

## Limitations and confidence

1. This was a map and review-artifact analysis, not an independent playtest of all 40 games. Generic inputs such as Enter, Space, ArrowRight, and held keys are not game-specific.
2. An element missing from the opening frame is not proven absent from the full game. An asset, resource, canvas, or engine marker does not prove use.
3. Godot/WebGL/Three.js traces, script counts, software WebGL, AudioContext, and HTTP 403/400 responses are technical clues only; they do not establish the intended engine, asset origin, accepted control, or quality.
4. Official-card descriptions are reported as `stated_not_playtested`, not as verified gameplay.
5. The recorded failure count is zero because the supplied failure list is empty; that does not mean no game or capture failed.
6. Even records with direct gameplay signals generally show only part of a loop. No result is inferred from a name, genre, or visually similar frame.

## Executive summary

Candle Climber v2 should make its simple promise easier to see: “Today, everyone has the same chart; see the next light; climb with jump timing and optional RUSH.” The practical sequence is P0–P2: lock down a measurable baseline and fairness, test a minimal Summit Rail/Candle Call, then make risk and outcomes learnable at the right time. Anything that makes score purchasable, controls more complex, terrain branch, or unobserved data look certain is outside the baseline roadmap.

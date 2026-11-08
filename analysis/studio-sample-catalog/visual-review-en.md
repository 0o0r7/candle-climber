# Candle Climber v2 — Technical Visual Review

> **Purpose and status:** Research review for the Super Z Agent Coder to verify product goals, gameplay/economy rules, visual-system fit, and implementation feasibility. Findings and recommendations are not approval to implement, merge, or deploy. This review is committed only to `research/studio-sample-catalog-v2`; it does not modify `main` or production.
>
> **Code snapshot reviewed:** branch `research/studio-sample-catalog-v2`, baseline `e211cb7`. Re-validate source references against the exact implementation commit before coding.

## Decision summary

**Candle Climber itself is the right visual foundation.** Its current custom Canvas 2D renderer, candle-derived visual grammar, locked product palette, and layered parallax are compatible with the available code and evidence. The sample review does not justify a 3D rewrite, camera redesign, or new player controls. The lower-risk opportunity is to improve HUD hierarchy, make progress toward the Summit visible, and clarify small jump/landing/risk feedback using existing state and rendering.

Preserve the gameplay contract: the player remains anchored on the horizontal axis while camera/terrain movement creates forward travel; the primary skills are jump timing, variable jump height via hold/release, and optional RUSH. **Free brake, lateral steering, branching routes, camera rotation/zoom, and changes to physics or score are not visual-review recommendations.**

The best transferable combination is **Candle Climber's existing identity + clearer state grouping inspired by a few observed samples + restrained decorative light/depth**. Do not copy another game's art, assets, scenes, or presentation. Skybound Academy and Lane Runner are references only for information grouping; Lantern Wayfarer is a limited reference for localized light mood. Every visual change must preserve hitboxes, candle-color meaning, and competitive fairness.

## Evidence contract and capture limits

This review distinguishes:

- **Direct observation:** a feature visible in a specifically named frame. A visible state difference does not establish why it changed.
- **Code/documentation:** a claim checkable in the repository at the stated snapshot.
- **Inference/proposal:** a candidate for Super Z to assess, not a confirmed benefit until playtest or measurement.

The catalog contains 40 entries: 25 are `page_only` and 15 show only `partial_gameplay`. This capture did not confirm a complete game loop or final outcome for any sample. The merged image set contains 188 frames across 39 titles; frames may be menus, loading, fallback images, or different non-gameplay stages. A generic input sequence does not prove that a sample accepted an input or that the input caused a visible change. See the [English research report](report-en-final.md), [capture process](process-en.md), and [technical summary](technical-summary-en.md).

The original capture frames are generally 1280×800 (16:10). A fixed capture-tool watermark appears at the lower right in the source images; do not interpret it as sample-game HUD or art. These frames are not a mobile study and are not a viewport-matched comparison with Candle Climber's logical 800×480 (5:3) canvas. The JPG archive is retained outside the source repository to avoid adding binary captures to Git history; the dataset records stage and provenance references.

## Candle Climber visual and technical baseline

| Dimension | Verifiable project baseline | Engineering implication |
|---|---|---|
| **Projection and world geometry** | The game renders in a 2D screen plane with logical size 800×480. The player is anchored at 30% of screen width; `camX` advances automatically and `camY` follows the player. Current depth is conveyed through layered parallax, not 3D camera geometry. [`engine.ts`](../../src/game/cc/engine.ts#L8-L47) | Any new depth should enrich background separation only. Shadows, haze, or decoration must not obscure the walkable platform cap or suggest a false platform. |
| **Camera and framing** | Vertical follow uses one LERP and a soft target guard that keeps a strip of the takeoff platform visible. Rendering is unzoomed/unclipped; the Canvas scales by contain-fit and caps DPR at 2. [`engine.ts`](../../src/game/cc/engine.ts#L32-L47), [`GameCanvas.tsx`](../../src/components/cc/GameCanvas.tsx#L1039-L1061), [`GameCanvas.tsx`](../../src/components/cc/GameCanvas.tsx#L1108-L1115) | Do not propose dynamic zoom, crop, orbit, free pan, or a new camera control. The source frames are 16:10 while the logical game world is 5:3; do not treat their layout as a one-to-one composition template. |
| **Candle material and color semantics** | Up/green and down/coral remain semantically meaningful; the walkable cap has distinct geometry. V2 renders green veins/crystals and red fractures/embers; colorblind mode hatches down candles. [`render-v2.ts`](../../src/game/cc/render-v2.ts#L274-L420), [`terrain-v2.ts`](../../src/game/cc/terrain-v2.ts#L1-L10) | Biome, haze, bloom, or recoloring must not alter market meaning or walkability. Color cannot be the only cue. Keep cap, body, and collision affordance legible. |
| **Scene composition** | `render-v2.ts` draws sky, ghost candles in the background, ridge, playfield, and foreground particles/vignette. This is already a multi-layer depth system described in [`ART-DIRECTION.md`](../../docs/ART-DIRECTION.md#L39-L50). | Do not replace the foundation. The task is composition/hierarchy and clutter control on the existing scene. |
| **HUD and UI layer** | HUD, buttons, and panels are HTML/CSS layered over the Canvas; score/combo appear at the top, while pause/RUSH controls are DOM elements. [`GameCanvas.tsx`](../../src/components/cc/GameCanvas.tsx#L1620-L1730), [`globals.css`](../../src/app/globals.css#L259-L353) | Keep semantic text and status indicators in accessible, scalable, testable DOM where possible. Keep Canvas focused on world geometry and spatial feedback. |
| **Animation and effects** | Simulation advances in 1/60-second fixed steps. V2 already has event-related squash/stretch, trails, pre-rendered glows, and celebration. Reduced-motion settings constrain shake/tremor and some confetti. [`GameCanvas.tsx`](../../src/components/cc/GameCanvas.tsx#L1065-L1115), [`render-v2.ts`](../../src/game/cc/render-v2.ts#L1037-L1146) | New effects must remain decorative, never occlude player/platform, and never change physics, hitboxes, score, or hidden information. Respect the current reduced-motion contract. |
| **Runtime and assets** | The game uses TypeScript and a custom Canvas 2D renderer; no common runtime 3D framework appears among `package.json` dependencies. The character registry supports 14 manifested four-frame 96px sprite sets plus the procedural CLASSIC fallback; character selection UI is retired. [`characters.ts`](../../src/game/cc/characters.ts#L1-L39), [`GameCanvas.tsx`](../../src/components/cc/GameCanvas.tsx#L201-L226), [`RETIRED-FEATURES.md`](../../docs/RETIRED-FEATURES.md) | Shape/Canvas drawing and existing assets are the lowest-complexity path. Do not add a new asset pack or revive character selection without product need, ownership, and explicit policy review. This research does not establish licenses for sample art. |

### Determinism implications

`terrain-v2.ts` builds candle decoration as a pure function of platform data and `seedStr`, which is a good model for deterministic new decoration. Some older particle/shake paths use `Math.random()`, however, so do not claim pixel-identical full-scene replay unless random paths and animation history are controlled and tested. Physics and scoring must remain independent of renderer differences. See [`terrain-v2.ts`](../../src/game/cc/terrain-v2.ts#L1-L10), [`engine.ts`](../../src/game/cc/engine.ts#L128-L145), and [`render.ts`](../../src/game/cc/render.ts#L76-L78) / [`render.ts`](../../src/game/cc/render.ts#L235-L263).

## What transfers from the sample frames—and what does not

| Sample and frame references | Directly visible | Narrow use for Candle Climber | Inference limit |
|---|---|---|---|
| **`game-13` Lane Runner** — `game-13/03-after-key-burst.jpg`, `game-13/05-late.jpg` | A 3D corridor with central vanishing point, foreground squad, corner HUD, and a short central notice. Distance and threat values differ between frames. | Use the general idea of a few readable depth cues and stable HUD grouping. For Candle Climber, this means layer separation—not a 3D scene or camera. | Distance/threat changing does not prove a generic input was accepted or caused it. The dataset does not establish a game-specific control or full loop. |
| **`game-20` Skybound Academy** — `game-20/03-after-key-burst.jpg`, `game-20/05-late.jpg` | A colorful platformer frame with `CLIMB`, lives, mission counters, combo, jump controls, and a side progress rail; the later frame shows `Last heart`. | Borrow information grouping: separate high-priority indicators, keep objective/progress rail distinct from background decoration, and make a real failure cost visible. | It has lives, power, and systems Candle Climber does not. Do not infer that Candle Climber needs lives, power, or a dense HUD. Changes across frames do not prove input causality. |
| **`game-29` Helix Drop** — `game-29/03-after-key-burst.jpg`, `game-29/05-late.jpg` | A vertically centered 3D column/ring layout, large top-center score, and later differences in score/fragments. | Consider contrast and a clear focal point. For Candle Climber, prefer a small, stable near-goal indicator over a large score that covers the scene. | The vertical camera/falling physics differ from the chart auto-runner; the reason for frame changes is unknown. |
| **`game-33` Lantern Wayfarer** — `game-33/05-late.jpg` | A dark 2D scene with localized light circles and compact HUD bars; some floor/hazard areas are low contrast in darkness. | Local lighting may inform background mood only, provided platform cap, cracks, and gaps remain high-contrast and mechanically clear. | Capture is partial and the sample is a side-scroller. This frame cannot establish controls, accessibility, or loop quality. |
| **`game-35` Neon Alley Brawl** — `game-35/03-after-key-burst.jpg`, `game-35/05-late.jpg` | Pixel-art scene, neon accents, top HUD, a large mid-frame level title covering substantial play area in one image, and a character/crate that remain discernible against a busy later frame. | Separate foreground/midground and use accents sparingly. Keep event copy short and time-bounded so it does not cover jump arcs or landing surfaces. | Frames do not establish hit/combo/result behavior. Pixel art/neon is not the proposed Candle Climber style. |
| **`game-37` Mage Knight** — `game-37/03-after-key-burst.jpg`, `game-37/05-late.jpg` | Top-down arena, multi-part HUD, many small elements, and enemies visible in a later frame. | Treat as a warning about information density: putting many systems on screen does not make them all useful in a fast game. | Arena topology and controls differ; frame changes do not prove input response. |
| **`game-26` Mini Golf Isles** — `game-26/04-after-combined-input.jpg` | An angled/isometric view with explicit orbit/zoom guidance on screen. | Use only as a contrast case: this camera freedom is not transferable to the current Candle Climber contract. | On-screen guidance indicates a sample capability, not a Candle Climber need. |
| **`game-34` Cloud Climber** — `game-34/03-after-key-burst.jpg` | Daily/Endless menu, large buttons, and vertical themed layout. | The menu frame can inform entry-screen composition only, not active-gameplay framing or climb feel. | This record is `page_only`; it does not prove active gameplay, movement, or camera behavior. |

IDs, observation levels, and image provenance are in [English JSON](database-en/game-database.json) and [English CSV](database-en/game-database.csv). The original image archive is outside this repository. The merged database records stage and source; `game-10` includes some `fallback-1` frames, which must not be treated as a controlled same-run animation sequence.

## Visual evaluation by dimension

### 1. Projection, perspective, and scene

**Assessment:** Keep Candle Climber as a 2D screen-plane game with controlled artificial depth. This fits the Canvas 2D architecture and protects the rule that walkable surfaces derive from the market chart. A vanishing point or distant silhouettes could be considered in the background only; the candle/platform surface must remain in its existing plane, with an unambiguous cap and unchanged collision boundary.

**Testable constraints:** Decoration must not visually detach the cap from the platform or make a false platform. Parallax must derive from the same seed/data, not mutate `Platform[]` or collision. Haze/fog belongs only in a back layer below the playfield in visual priority.

### 2. Camera and framing

**Assessment:** Keep current camera-follow behavior as the baseline. Project code records that a previous zoom/crop approach made the frame feel laggy and unnatural before reverting to a single LERP. A near-death zoom, free pan, orbit, or horizontal player repositioning is therefore inconsistent with the current implementation baseline—even if an example frame looks attractive.

**Next validation:** In actual landscape and portrait game frames, the player, takeoff platform, and target landing surface must remain simultaneously legible. Contain-fit may create letterboxing in portrait. Address HUD size/placement and real-viewport legibility; do not “solve” this by changing projection or auto-cropping the world.

### 3. Information hierarchy and legibility

**Primary opportunity:** The report and v1 baseline identify near-goal/Summit distance, combo state, and RUSH cost as information a player may need during the run. Candle count and a meaningful progress rail are not prominent in the ordinary HUD. The renderer has a faint 3px top-of-canvas line, but that alone is not a semantic Summit-distance indicator. See [v1 baseline](candle-climber-v1-baseline-en.md) and [`render-v2.ts`](../../src/game/cc/render-v2.ts#L1140-L1145).

**Low-cost candidate:** A compact DOM rail reading `NOW → NEXT LIGHT → SUMMIT`, plus at most one short Candle Call derived from current state. This is not a new route map, score, or disclosure of hidden future candles. Update the rail at actual milestones rather than every frame; show causal feedback after landing/death, not over the jump arc.

Suggested per-frame priority order:

1. Player and next cap/gap.
2. RUSH/combo state or one short objective.
3. Score and secondary detail.
4. Environmental decoration.

Re-test at the logical 800×480 world and the smallest supported mobile viewport. Text/icons must not depend on hue alone.

### 4. Motion, animation, and effects

Existing project effects—not sample-card claims—are the starting point: event-related squash/stretch on jump/landing, bounded trails, landing/crumble particles, and milestone celebration are already present in renderer/engine paths. New feedback should trigger from a real engine event but must not alter jump force, duration, hitbox, collision, crumble timing, or scoring.

**Implementation constraints:** Use engine time and/or seeded inputs, not wall-clock time. Specify particle caps and per-frame cost. Keep platform edges clear and avoid overlapping objective copy with effects. Honor reduced-motion behavior for shake/tremor/confetti; do not add rapid flashing or repeated intense pulses. Screenshot tests should pin state and seed and account for known `Math.random()` paths so random visual variance is not misclassified as gameplay regression.

### 5. Rendering feasibility

**Estimate:** High for DOM/CSS hierarchy and drawing within the existing Canvas renderer; medium for new materials or effects in `render-v2.ts`; low/unjustified for a new 3D renderer or heavy asset system. The current stack is TypeScript, custom Canvas 2D, fixed-step simulation, and data-driven terrain. V2 renderer is already the default with a division between engine state and renderer-only decoration.

Lowest-risk implementation sequence:

1. Read-only presentation of existing state (`candlesPassed`, verified progress to Summit, combo, `rush`, `graduated`/World 2). Keep display derivation separate from score/physics.
2. Place semantic text/status in DOM with accessible labels/roles; update at meaningful state transitions. Keep world objects and particles in Canvas.
3. Derive new terrain decoration from existing data/seed; never generate collision or score input from decoration.
4. Preserve non-color cues, visible cap contrast, and existing colorblind behavior if changing light/material.

The project has 14 manifested four-frame sprite sets, but CLASSIC is the procedural default and selection UI is retired. Do not put a new selector/asset pack on the implementation map without product need and clear rights/provenance. Sample screenshots are evidence for layout only; do not reconstruct/copy sample artwork, models, fonts, or animations.

### 6. Audio and multimodal feedback

The 188-frame package contains no playable audio or waveform recording. “Sound On”, mute icons, and AudioContext warnings are UI/technical traces only; they do not establish sample sound quality, rhythm, or even that sound played. The sample set therefore provides no basis for music or sound-design recommendations.

Candle Climber already has Web Audio synthesis for jump, land, crumble, milestone, and victory events, plus mute/volume settings. See [`sound.ts`](../../src/game/cc/sound.ts#L1-L88) and [`SettingsPanel.tsx`](../../src/components/cc/SettingsPanel.tsx#L42-L67). If relevant, test synchronization between the existing event sound and visual event, with sound disableable. Audio must not replace a visual hazard cue or death-cause explanation. This review does not recommend new music or voice-over.

## Priority, risk, and verification matrix

| Priority | Visual proposal to evaluate | Feasibility | Main risk | Super Z acceptance condition |
|---|---|---|---|---|
| **P0** | Capture reproducible baseline screenshots with fixed seed across landscape/portrait; record readability of player, cap, next goal, Summit, RUSH, and death cause. | High | State/random animation differs between captures and creates a false regression. | Separate renderer-only comparison from physics/score/state; record capture path and seed/state for every frame. |
| **P1** | Minimal `NOW/NEXT/SUMMIT` rail and one state-derived goal call. | High | HUD clutter, wrong progress denominator, overlay over jump/landing. | No score/physics/terrain changes; player can explain near target in five seconds; milestone maps to actual Summit data. |
| **P2** | Refine landing, crumble, RUSH, and milestone feedback using existing FX, plus concise result feedback. | Medium | Excessive effects, occlusion, incomplete reduced-motion, or false causal message. | Every message is grounded in actual state; test reduced motion, colorblind, touch/keyboard, and post-landing legibility. |
| **Out of baseline** | 3D rewrite, free orbit/zoom/pan, free brake, lateral movement, wall/branch mechanics, copied art, score/wallet advantage. | Low/incompatible | Renderer rewrite, control/fairness regression, stability issue, or asset-rights problem. | Requires a separate explicit product decision and authorization; this review does not recommend it. |

## Independent checklist for Super Z Agent Coder

1. **Progress mapping:** Which real engine index/flag maps to Summit? Is the denominator and goal copy correct for daily, archive/practice, mutation, and World 2? If progress data is unavailable, do not invent a percentage.
2. **Renderer/game separation:** With identical inputs, visual changes must leave `score`, `candlesPassed`, `streak`, `bestStreak`, `py/vy`, run token, rank, and collision unchanged. Run fixed-step/W5 and existing relevant tests.
3. **Control/economy rules:** No copy or effect may imply free brake, lateral steering, branching, wallet-gated status, paid multiplier, or information absent from the public chart. Score/rank/physics remain skill-only; guest play remains accessible. See [`ECONOMY-LAWS.md`](../../docs/ECONOMY-LAWS.md#L21-L59) and [`PLATFORMER-UX-RESEARCH.md`](../../docs/PLATFORMER-UX-RESEARCH.md#L79-L118).
4. **Legibility/accessibility:** On small viewport, touch, and desktop, green/coral cap, hazard, player, and next target must be distinguishable without relying on color alone. HUD/Candle Call must not cover the landing zone. Screen-reader helper text must not announce on every tick.
5. **Reduced motion/performance:** Verify that reduced motion actually controls shake/tremor/confetti. Do not make effects depend on per-frame `shadowBlur` or a costly full-screen pass. Measure frame time on target devices; this document does not claim a performance benchmark.
6. **Assets/provenance:** Do not copy sample art/sound/templates. For a new asset, separately verify ownership/license, dimensions, loading/cache path, and fallback.
7. **User validation:** Retain report criteria rather than replacing them with subjective art preference: near-goal/Summit comprehension in about five seconds, accurate understanding of run end, and no fairness/performance regression. These are proposed criteria to test, not results of the screenshot review. See [P0–P3 acceptance criteria](report-en-final.md#p0p3-roadmap-and-acceptance-criteria).

## What this review does not establish

- Candle Climber's current in-browser visual quality, frame rate, or phone performance; no fresh Candle Climber gameplay capture or benchmark was made for this review.
- Control acceptance, responsiveness, or input-to-result causality in the Studio samples; the public capture is not a controlled game-specific playtest.
- Mobile readability, contrast, animation quality, real frame rate, or motion-sickness outcomes; these require device and user testing.
- Sample-game audio content or rights to use any sample assets.
- Whether Summit Rail/Candle Call will improve comprehension or retries; that is a testable hypothesis, not an observed result.

**Conclusion:** Layered refinement on the current Canvas 2D and DOM stack is feasible and lower-risk than changing projection or camera. The recommended order is to establish the rendering/state baseline, validate HUD hierarchy and data mapping, and only then refine bounded decorative effects if comprehension gates pass. This is research guidance—not merge or release approval.

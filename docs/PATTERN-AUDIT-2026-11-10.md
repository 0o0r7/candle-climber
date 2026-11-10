# PATTERN AUDIT — 2026-11-10 (second pass, after P0.1–P0.6)

> Scope: re-evaluate the **ten-pattern frame** and the **seven key gaps** from
> [`GAME-DESIGN-REFERENCES.md`](GAME-DESIGN-REFERENCES.md) against the code as it
> stands on branch `analyze-game-mechanics` at commit `4f1fe92` + this change set.
> Every claim below names a file and line, or a test that pins it. Nothing here
> is asserted from a document alone; where a document and the code disagreed, the
> code won and the document was corrected.
>
> **Method.** Each item was checked in three steps: (1) read the implementation,
> (2) run its contract test, (3) run the app and observe the behaviour. Steps 2
> and 3 are named per item. Where a step could not be done, it says so.

---

## 1. The ten patterns — current status

| # | Pattern | Verdict | Evidence (file:line · test · runtime) |
|---|---|---|---|
| 1 | **Climax / set-piece** | **partial** (unchanged) | Pacing exists: `director.ts:113` `sectorAt()`; the last 12 candles are a gap-free run-in (`director.ts:50` `SUMMIT_APPROACH`), consumed by the level builder at `level.ts:73`. The summit is still a *landing*: `engine.ts` `graduate()` fires on landing/pass and opens the celebration panel, then World 2. Pinned by `test/summit.test.ts` (a–f). No encounter on the climb itself. |
| 2 | **Build choice** | **closed (practice lane)** — was "absent" | New `game/cc/loadout.ts`: three loadouts, each trading one forgiveness window for another; `recoveryForRun()` (`loadout.ts:87`) forces scored runs to STANDARD. Engine consumes the profile (`engine.ts:145`, `:202` press buffer, landing coyote refill, air-jump refill). UI: `GameCanvas.tsx` ready panel, rendered only when `archive` is true. Tests: `test/loadout.test.ts` (10 cases). |
| 3 | **Quality score** | **present and measured** | `style.ts:23` `STYLE_LATE_RUNWAY = 20`, `style.ts:26` points `{late:3, save:2}`; engine grants at `engine.ts:382-383` (`save` before `late`, so a rescue never double-counts). `/ops` block at `ops/page.tsx:200-204`. Tests: `test/style.test.ts`. |
| 4 | **Modes** | **present** | crypto / stocks / launchpad × 4 timeframes + archive: `game/cc/level-source.ts`, selector `GameCanvas.tsx` `ModeSelector`; `test/modes.test.ts`, `test/timeframe.test.ts`. |
| 5 | **Meta-progression** | **weak** (unchanged) | `lib/achievements.ts` — 10 definitions (`ACHIEVEMENT_DEFS`), unlocked set persisted in `localStorage` only (`cc_achievements_v1`). No cross-device profile, no currency, no unlock tree. `test/achievements.test.ts` pins the logic, not the depth. |
| 6 | **Inputs** | **closed** — was "jump + RUSH, no gamepad" | New `game/cc/gamepad.ts`: standard-mapping intent + edge detection, pure and unit-tested (`test/gamepad.test.ts`, 9 cases). Poll loop in `GameCanvas.tsx` calls the **same** `Engine.press()/pressRush()/release()` — no extra reach (documented in `docs/GAMEPAD.md`). Keyboard remains the primary path; touch unchanged. |
| 7 | **Telegraphing** | **present** | Candle colour via `palette.ts` (CVD-separated, pinned by `test/palette.test.ts`), crumble tell + `MAX_UP` fairness clamp in `level.ts`, sector banner + hint from `director.ts` `SECTOR_LABELS`. |
| 8 | **World / tone** | **strong** | "The chart is the level" + Death Card (`game/cc/deathcard.ts`), landing copy (`src/app/page.tsx`). Unchanged this pass. |
| 9 | **Social** | **present** | async duel `game/cc/duel.ts` (`test/duel.test.ts`), ghosts `ghost.ts`/`self-ghost.ts`, rival bot `rival/bot.ts` (`test/rival-bot.test.ts`), guest + official boards (`test/official-board.test.ts`). |
| 10 | **Polish** | **half → improved** | Variety: the 5 original synth voices are now **8** incl. `air` and `style` (`sound.ts:76-90`), wired from the engine (`engine.ts:207`, `:395`) and pinned by `test/loadout.test.ts` ("audio variety wiring"). Still absent: music, and no audio for sector transitions. Particles / shake / slow-mo unchanged. |

**Net movement this pass:** #2 absent → closed (practice lane), #6 minimal → closed,
#10 half → improved. The weakest remaining pattern is **#1 climax**, then **#5
meta-progression**.

---

## 2. The seven key gaps — did they close?

The seven gaps are the ones listed in the first audit and carried into
`GAME-DESIGN-REFERENCES.md` (pattern table + the P0 queue). Each is re-checked
here; the verdict is about the **code**, not the roadmap.

### G1 — No level analytics (deaths invisible) → **CLOSED**
`lib/run-telemetry.ts` normalizes untrusted events (`normalizeRunEvent`) and folds
them into a histogram (`summarizeRunEvents`, bin width 20, overflow at 240+);
`/api/telemetry/run` stores them; `/ops` renders the histogram (`ops/page.tsx:192`).
PII-free by construction — the stored record has no name, wallet, address, IP or
client timestamp (`docs/TELEMETRY.md`). Tests: `test/run-telemetry.test.ts`.

### G2 — No authored pacing (flat ramp, no safe opening, coin-flip summit) → **CLOSED for pacing, OPEN for climax**
`director.ts` authors sector → gap probability as a pure function of the candle
index: INTRO 12 candles at gap 0 (`:48`), TREND → SQUEEZE → BREATHER cycles of
40 (`:51-55`), escalation `+0.02` per cycle capped at 3 notches (`:56-57`), summit
run-in 12 gap-free candles (`:50`). `level.ts:73` is the only consumer, so the
terrain stays a pure function of (candles, seed) — pinned by
`test/level-determinism.test.ts` and `test/director.test.ts`.
**Still open:** the summit is a landing, not an encounter (pattern #1).

### G3 — No recovery verb beyond the ground jump → **CLOSED (engine), OPEN (bot parity)**
`engine.ts:32-33`: `AIR_JUMPS = 1`, `AIR_JUMP_V = 660`, i.e. reach ≈ 104 px <
`MAX_UP` 112 px — the second jump **cannot** substitute for an authored step, so
the level and its difficulty priors are untouched. Forgiveness ordering is
explicit: the buffer is read after coyote, so a coyote-saved press still gets the
air jump (`engine.ts:386-396`). Pinned by `test/airjump.test.ts`.
**Known open item:** the rival bot does not spend the air jump
(`docs/GAME-DESIGN-REFERENCES.md` P0.3 row) — a deliberate balance decision
waiting on telemetry, correctly left alone.

### G4 — No quality axis (score measured height only) → **CLOSED**
STYLE is input-derived (position + input history), so it is replay-exact, and it
sits *beside* the score: it is not in `lib/scoring.ts`, so it cannot change what a
leaderboard number means (`docs/ECONOMY-LAWS.md`). `engine.ts:382-383`, tally
exported in `RunResult` (`types.ts`).

### G5 — The new axes were unmeasured → **CLOSED**
STYLE engagement (`share`, mean/median/p90, LATE vs SAVE split) and sector deaths
are computed in `run-telemetry.ts:236-274`, exposure-normalized by
`kindsReached()` (`:190`) — deaths ÷ runs that *reached* that sector kind, so a
long sector cannot top the table by length. The sector is derived server-side
with the director's own `sectorAt()`, never trusted from the client. Rendered at
`ops/page.tsx:200` and `:207`.

### G6 — No build choice / decision depth → **CLOSED THIS PASS (practice lane)**
See pattern #2. The doc's own prescription ("casual lane only, ranked lane stays
baseline") is now executable: `recoveryForRun(practice, id)` in `loadout.ts:87`
returns STANDARD for every scored run, and the picker is not even rendered outside
the archive lane. Each option states gain **and** cost in the UI, because a
trade-off a player cannot read is not a decision (Sid Meier, §3 of the design doc).
Tests: `test/loadout.test.ts`.
**Deliberate limit:** this does not touch the ranked lane. Extending a choice
there requires a fairness decision (per-player physics vs. one global board), and
that decision is the owner's, not a refactor's.

### G7 — Thin inputs and half-done polish → **CLOSED for inputs, IMPROVED for polish**
Inputs: gamepad support added (`gamepad.ts` + poll loop), parity-checked against
the keyboard path. Polish: the air jump and STYLE events no longer reuse the
ground-jump voice (`sound.ts:80,84`), so the two verbs the last two releases added
are now *audible as themselves*.
**Still open, honestly:** no music, no sector-transition cue. Music is a
product/brand decision (and a payload decision) — not something to slip in
unasked.

---

## 3. What changed in this pass (and what did not)

New: `src/game/cc/loadout.ts`, `src/game/cc/gamepad.ts`,
`test/loadout.test.ts`, `test/gamepad.test.ts`, `docs/PRACTICE-LOADOUTS.md`,
`docs/GAMEPAD.md`, this file.
Changed: `engine.ts` (recovery profile + `air`/`style` voices), `sound.ts` (two
voices), `GameCanvas.tsx` (practice loadout picker, gamepad poll loop, engine
factory passes the recovery profile), `globals.css` (picker styles),
`GAME-DESIGN-REFERENCES.md` (table + queue updated).

Verification run for this pass: `bun test` → **707 pass / 0 fail** (63 files;
+20 new contract tests), `bunx tsc --noEmit --incremental false` → clean,
`bun run lint` → 0 errors (20 pre-existing warnings). Runtime check: the ranked
`/play` lane renders **no** loadout picker and a run starts and scores normally
(zero console errors). The practice-lane picker itself could not be opened in the
sandbox preview (the harness rewrites hard navigations to its entry URL, so
`/play?date=<past>` is unreachable there) — it is covered by unit tests and must
be eyeballed by hand from the in-game archive browser
(`docs/PRACTICE-LOADOUTS.md` §Verification). Gamepad input is unit-tested but has
not been tried on physical hardware.

## 4. What is deliberately NOT done

- **Climax encounter (#1):** needs a design decision about what the summit *is*
  (a boss, a timed sprint, a collapse). Adding hazards to the last 12 candles
  would silently rewrite difficulty priors that P0.2 just authored and tested.
- **Meta-progression depth (#5):** any real layer (currency, unlocks, cross-device
  profile) interacts with `docs/ECONOMY-LAWS.md` and the wallet lanes. Not a
  unilateral change.
- **Ranked build choice (#2 beyond practice):** requires the owner's call on
  whether per-player physics may touch the shared board.

# OPEN ITEMS — the single register (updated 2026-11-10, after the playthrough audit)

> **خلاصه فارسی:** این فایل تنها مرجع «کارهای باز» است. هر موردی که در ممیزی‌ها
> باز مانده، اینجا با **دلیل اندازه‌گیری‌شده**، **تصمیم**، **اقدام انجام‌شده** و
> **وضعیت** ثبت شده تا هیچ‌چیز گم نشود. وضعیت‌ها: `FIXED` انجام شد ·
> `DECIDED` تصمیم گرفته شد و اقدام شد · `DEFERRED` به تصمیم مالک محصول نیاز دارد ·
> `OPEN` نیاز به یک سشن بازی انسانی دارد.
>
> Rule of this register: an item leaves it only in one of two ways — it is fixed
> **and** pinned by a test/measurement, or it is deferred **with a reason and a
> named decision owner**. "Probably fine" is not a status.

**Shipped in this pass:** O-5 sector transition audio (6 motifs, one per
boundary) and O-2 chart v2 (a date-gated terrain repair for drifting charts —
crypto/stock lanes proven byte-identical). Everything else below is either a
measured rejection or a decision with a named owner.

Sources folded in: [`PATTERN-AUDIT-2026-11-10.md`](PATTERN-AUDIT-2026-11-10.md) §4,
[`PLAYTHROUGH-AUDIT-2026-11-10.md`](PLAYTHROUGH-AUDIT-2026-11-10.md) §4–§5, and the
open TODOs carried from the previous passes.

| # | Item | Why it was open (fact) | Decision | Status |
|---|---|---|---|---|
| O-1 | Wider press `BUFFER` on the practice lane | audit guessed the 26-candle wall was a press-timing window | **rejected — measured, it is not** | `DECIDED` |
| O-2 | Terrain is flat relative to the jump on drifting charts | measured: launchpad post-pad band **32 px**, full-hold rise ≈ 299 px | date-gated **chart v2 repair** (shipped) | `FIXED` |
| O-3 | The 26-candle skill wall | same root cause as O-2; v2 moves it, does not remove it | **landing telegraph** (shipped: `telegraph.ts` + sky target frame) | `FIXED` (code+tests; visual pass pending) |
| O-4 | Rival personalities invisible | v1: only RUSH separates them · v2: four distinct outcomes | tied to the chart; two tuning experiments measured + reverted | `DECIDED` |
| O-5 | No audio for sector transitions | pattern #10, largest remaining polish gap | implemented this pass | `FIXED` |
| O-6 | Music | pattern #10 depth | **procedural bed shipped** — `music.ts`, four biome sections (the trailer's score) | `FIXED` (ear pass pending) |
| O-7 | Summit / closing bell never played by a human | engine search proved reachable, not playable by hand | needs one human session | `OPEN` |
| O-8 | Build choice on the **ranked** lane | per-player forgiveness would touch a shared board | owner call | `DEFERRED` (owner) |
| O-9 | Cross-device career profile | needs a server identity | owner call (auth surface) | `DEFERRED` (owner) |
| O-10 | `scripts/summit-bot.ts` sits in the **public** tree | it is a solver: it hands out a summit-clearing input line | keep it for regression now; move to the private archive before the repo/board goes public | `DEFERRED` (coder agent) |

---

## O-1 · Practice-lane wider `BUFFER` — DECIDED (rejected, with a measurement)

**The proposal** (playthrough audit §4.1): add ~2 ticks to `BUFFER` on the archive
lane so the found line gets easier to hit.

**The measurement.** Every blind rhythm a player can hold — `hold` 12…26 ticks ×
`rest` 4…20 ticks (255 combinations) — replayed headlessly on the launchpad chart
(seed `2026-11-10 · MONKE`, WHALE HOUR), once per practice loadout:

| Loadout (recovery profile) | best candles | rhythms > 26 | rhythms > 40 | summit |
|---|---|---|---|---|
| STANDARD (`buffer` 0.16 s) | 26 | 0 / 255 | 0 / 255 | 0 / 255 |
| AERIAL (`buffer` 0.24 s, +5 ticks) | 26 | 0 / 255 | 0 / 255 | 0 / 255 |
| GROUNDED (`buffer` 0.096 s) | 26 | 0 / 255 | 0 / 255 | 0 / 255 |

The three profiles are **identical at every one of the 255 grid points**. A wider
acceptance window cannot help, because the failure at candle 26 is not "the press
arrived late/early" — it is the **arc** (a full-hold jump flies past the next
candle). Conclusion: the AERIAL loadout already provides more than the proposed
2 ticks (0.24 s vs 0.193 s), and it changes nothing. The proposal is dropped
rather than shipped as placebo forgiveness.

**What this leaves in place:** the loadouts still do their documented job (they
move *when* a press is accepted); the wall simply is not there.

## O-2 · Terrain flat relative to the jump — FIXED (chart v2, date-gated)

**The defect, re-measured precisely.** `norm()` maps each close against the
min/max of a rolling 40-candle window. On a chart that oscillates (BTC, TSLA)
that ratio swings end to end and the post-pad terrain fills the whole 180 px band
(measured: **180**). On a chart that *drifts* — every launchpad candle — the
window's min and max sit at the same end of the series, the ratio barely moves,
and the terrain collapses into a strip: **32 px** for the 72-candle MONKE chart,
against a full-hold jump that rises ≈ 299 px. The arc then flies over several
96 px-spaced platforms and lands wherever it happens to descend.

**Two candidate fixes were measured, one was rejected.**

| Change | launchpad (drifting) | BTC (oscillating) | TSLA (oscillating) |
|---|---|---|---|
| raise `AMP_MAX` 330 → 560 (global) | best 26 → 29, viable archetypes 1 → 4 | mean 15.5 → **13.7** | mean 30.8 → **24.2** |
| **v2 = stretch ONLY a flat chart** (shipped) | band 32 → **96**, best 26 → **29**, rhythms reaching 20 candles 17 → **34** | **byte-identical** | **byte-identical** |
| raise `AMP_MAX` to 700/900 | pad spawns below the death line (`camY ≤ 0`), every run ends at candle 0 | — | — |

The global re-tune fixes one lane and taxes the other two, so it was dropped. The
shipped v2 is a **repair**: if the authored terrain is flatter than
`TERRAIN_TARGET_SPAN` (120 px), it is stretched away from the pad (max ×3) and
every step is re-clamped with the shipped `MAX_UP`/`MAX_DOWN` expression. A chart
that already uses its band returns **byte-identical** — the crypto and stock
lanes cannot move, which is pinned by `test/chart-version.test.ts` and confirmed
against the live BTC/TSLA feeds.

**Why it is date-gated, not a switch.** Terrain is rebuilt from candles on every
load, so re-scaling retroactively would re-shape charts players already climbed
and invalidate their stored ghosts/self-ghost replays. `CHART_V2_FROM =
2026-11-12` makes the version a pure function of the seed's date: everything
before the cutoff stays v1 forever; v2 begins on a chart nobody has played yet.
Pad, ease window, gap placement and crumble flags are untouched by the stretch
(all four pinned by test).

**Honest limit:** v2 raises the blind-rhythm ceiling from 26 to 29 candles and
doubles the number of rhythms that survive past 20 — it does **not** make the
summit reachable by a blind rhythm. That is O-3.

## O-3 · The 26-candle wall — FIXED (landing telegraph shipped)

The wall is a per-jump timing demand, not a reach problem: the terrain is
completable (38-jump line, engine search), and after O-2 the ceiling of a blind
rhythm moved 26 → 29 candles while the number of rhythms surviving past candle
20 doubled (17 → 34 of 255). What v2 cannot fix is *readability*: the player
cannot see where the arc will come down, and the arc is long relative to the
96 px platform spacing.

The lever that touches no physics is a **landing/take-off telegraph** — the same
idea as the crumble fuse tell that already exists: mark the platform the current
arc will meet, so the decision is "adjust" rather than "guess".

**Shipped.** `src/game/cc/telegraph.ts` answers that one question from the SAME
forward simulation the rival bot plans with (`rival/planner.ts`), so the tell
cannot drift from the physics:

- **grounded** → the arc of a full-hold press taken NOW (`evalPressNow().full`);
- **airborne** → the live arc, with the gravity-hang gate read from the real
  `jumpHeld` (`evalArc`, a new optional `hangOverride` on the rollout — the
  bot's own calls are untouched, so its behaviour is byte-identical).

A landing at or behind the lane the player already occupies is reported as "no
target", so the tell never marks a candle that is not ahead. Nothing writes
engine state, consumes RNG or touches score/candles: presentation only, which is
why the ranked board and stored ghosts are unaffected.

**Rendering** (`render-v2.ts`, `drawTelegraphV2`): a target frame in the OPEN SKY
above the target candle (bar + two end ticks), a descending chevron above it, and
a dot on the cap — three redundant channels, so colour is never the only one. The
frame deliberately sits in the sky rather than over the candle body: a stroke on
up-green or down-coral blends into the candle it is marking. Every stroke is
painted twice, ink under chalk, so one of the pair always keeps a ≥3:1 boundary
on any surface (pinned in `test/palette.test.ts`); `prefers-reduced-motion` stops
the pulse. The legacy v1 renderer (`/?renderer=v1`) does not draw it.

**Pinned** (`test/telegraph.test.ts`, against a live `Engine`, not the planner):

| claim | measurement |
|---|---|
| the tell is the landing | every in-air answer after the release tick, and every full-hold answer, equals `groundPlat.i` of the jump the engine actually flew (374 assertions across 8 jumps) |
| the hang gate is real | a cut jump's pre-release answers describe the UNCUT arc and flip exactly at the release — asserted as its own case (`cutChecks > 0`) |
| presentation only | `py/vy/time/camX/camY/score/candlesPassed` identical before and after reading the tell |
| never behind | every marked index is `> laneOf(player)` and `state === "solid"`, `w > 0` |
| deterministic | two identical engines stepped identically produce identical tell sequences |

**Honest limit:** the tell is verified in the engine and in the DOM-side pixel
scan of the canvas; the *visual* pass (is it pleasant and legible in motion on
the real chart) plus the summit playthrough in O-7 remain human checks.

## O-4 · Rival personalities — DECIDED (measured on both chart versions)

Launchpad chart, all 14 skinned characters, `RivalBot` driven to a stop:

| archetype | v1 (today's chart) | v2 (from 2026-11-12) |
|---|---|---|
| RECKLESS / GREEDY (hold RUSH) | 91 / 91 | 84 / 23 |
| PRECISE (cop, cadet) | 14 / 14 | **72 / 72** |
| BALANCED (bot-sheet) | 14 | **78** |
| PATIENT (frost, grump) | 105 / 96 | 20 / 20 |

Two facts, both measured:

1. **On v1 the archetypes are near-invisible**: only the RUSH holders separate
   (91) from everyone else (14) — apart from the two patient skins, which
   accidentally delay into the correct press window on a flat chart.
2. **On v2 four distinct outcomes appear** (84 / 78 / 72 / 20), i.e. the chart
   now has more than one viable press moment, which is what the personality
   knobs were always supposed to model.

**Two tuning experiments were run and reverted, with the numbers kept here so
nobody repeats them:**

- precision demand 0.72 → 0.50 (alignment cap): **not one tick changed** on any
  run — the gate is inert, not miscalibrated;
- "patience may only delay while there is room to press" (guard at
  `ticksLeft > PANIC_TICKS + 10`): helped v2 patients (20 → 72) but **broke
  today's chart** (frost 105 → 14). A change that regresses the lane players are
  on today is not shippable; reverted.

**Known, accepted inconsistency:** on v2 the "PATIENT" skins are the *worst*
performers, because `patienceS` is a fixed delay rather than a comparison of the
next few feasible presses. Fixing that properly means the planner must forecast
two or three candidate press ticks and choose the best — a planner change, not a
constant, so it is recorded as the follow-up rather than guessed at here. The
rival is local and cosmetic (it never posts a score), so no board is affected.

## O-5 · Sector transition audio — FIXED

- `src/game/cc/sound.ts`: `SECTOR_MOTIFS` — one two-note motif per authored
  sector (`intro`, `trend`, `squeeze`, `breather`, `summit`, `finale`), one
  instrument family, table-driven (no randomness), zero assets.
- `src/components/cc/GameCanvas.tsx`: the motif plays **once per sector
  boundary**, keyed off the same pure `sectorAt()` the banner renders, so sound
  and banner can never disagree; reset at every run start; silent unless the run
  is live (`phase === "running"`, not paused). No engine state added.
- `test/sector-audio.test.ts`: 4 tests — six unique motifs, audible range,
  a real 72-candle chart crosses all six (no dead cue), one kind per index.

## O-6 · Music — FIXED (procedural bed; ear pass pending)

**The decision that used to be open** was "does the game want a continuous loop,
and would it fight the jump/land rhythm?". The material already answered it: the
X trailer (`scripts/trailer/audio.mjs`) ships a per-biome score — one section per
biome, fixed tempo and key, bars that cross-fade with the weather change. That is
the game's own soundtrack, already written and already proven on video; the only
thing missing was playing it *in the game*.

**Shipped:** `src/game/cc/music.ts` — the same four sections (temperate 100 BPM,
desert 108, storm 132, tundra 76), synthesised with the existing zero-asset
WebAudio synth, scheduled bar by bar, gated on `running && !paused`, cross-faded
on a biome change, and routed through the shared master gain so the existing mute
and volume slider already apply (no new setting). Detail: [`MUSIC.md`](MUSIC.md).

**Why this does not repeat O-1's mistake:** the bed cannot change a run. It is
not read by the engine, it adds no state, and its gains (≤ 0.08 per voice, bus at
0.5) sit ~−20 dB under the jump/land transients, so it cannot mask the rhythm it
plays over. The volume slider is the player's own escape hatch.

**Still open, honestly:** nobody has *listened* to it in a real mix. `bun test`
pins the score; it cannot judge the mix. Same session as O-7.

## O-7 · The summit has never been played by a human — OPEN (needs one session)

`test/summit.test.ts` + the engine search prove the closing bell is **reachable**
and deterministic; nobody has cleared it by hand in a browser. This is a QA
item, not a code item, and it is the only item here that cannot be closed by a
test:

1. open `/play` on the launchpad lane (72 candles, the long chart);
2. climb to candle ≈ 69 with the practice lane (`/play?date=<past>` for retries);
3. confirm the three folding candles under the cap read as "you cannot stand
   here" (cap ticks + fuse), the graduation panel appears, and the RUN CONTINUES
   into world 2;
4. record the candle/score in this file when done, or file what went wrong.

## O-8 · Build choice on the ranked lane — DEFERRED (owner)

Blocked by the same law as ever: a per-player physics profile makes two equal
numbers mean different things (`docs/PRACTICE-LOADOUTS.md`). Options were already
written down: per-player **score normalization** (rejected earlier — invalidates
fairness), or a **second board** per loadout (doubles the board surface and
splits an already thin population). Needs a product call, not code.

## O-9 · Cross-device career profile — DEFERRED (owner)

`docs/CAREER.md`: a server profile needs identity. Everything the game already
has is wallet-optional by design, so a server-side career means deciding whether
career follows a wallet, an account, or stays local. No code change is honest
before that decision.

## O-10 · `scripts/summit-bot.ts` must move to the private archive before public release — DEFERRED (coder agent)

**Why it is committed today.** The bot is the only *mechanical* proof that the
closing bell is playable, not merely reachable (O-7). It plans with the shipped
`RivalBot` + `Planner` against the same `/api/launchpad` payload the page fetches,
then replays the generated tick table through the page's own keyboard handler —
nothing writes engine state. Living next to the engine is what lets any future
agent or reviewer re-run the proof:

```bash
docker compose -f docker-compose.base44.yml exec -T web \
  env GAME_URL="https://3000-<preview-host>/play?renderer=v2" bun scripts/summit-bot.ts
# exit 0 = graduated · 1 = did not graduate · 2 = environment problem
```

**Why it cannot ship in a public repo.** It is a *solver*, not content. Anyone
reading it can extract a summit-clearing input line, and it documents precisely
how the planner values terrain — the same edge the rival uses. Next to a public
leaderboard that is a fairness hole, not a "game feel" spoiler.

**The action — for the coder agent, before either trigger fires** (the repository
becomes public, **or** the ranked lane accepts real submissions):

1. move `scripts/summit-bot.ts` — and its `.gitignore` negation
   (`!/scripts/summit-bot.ts`) — into the **private archive** that already holds
   the internal audits and runbooks;
2. leave this section (and its reproduction command) in place as the pointer, so
   the proof stays discoverable from the public tree;
3. carry the exit-code check into the release gate run from the private checkout —
   regression coverage must not disappear together with the file;
4. until then do **not** link the script from the site, the README, the showcase
   copy, or any public post.

**Verified state:** committed in `3729758`; re-run 2026-11-10 on the launchpad
chart (seed `2026-11-10 · MONKE`) → `plan 60 candles · 755 pts`, `graduated: true`,
`died: false`, zero console/page errors, ~29 s of replayed play.

---

## Suggested next pass (ordered, by value per unit of risk)

1. ~~O-3 — landing/take-off telegraph~~ (shipped; see the section above).
2. **O-7 — one human playthrough of the summit** (zero code, and it is the only
   unverified thing in the product).
3. **Rival planner follow-up (from O-4):** forecast 2–3 candidate press ticks and
   pick the best instead of the fixed `patienceS` delay, so "PATIENT" stops being
   the worst archetype — planner-only, cosmetic, testable with the same harness.
4. **O-8 / O-9 — the two product decisions** that no amount of code can settle
   (ranked builds; where a career profile lives).

## How to reproduce the numbers above

```bash
# full gate (inside the container)
docker compose -f docker-compose.base44.yml exec -T web sh -ec \
  'bun test && bunx tsc --noEmit --incremental false && bun run lint'

# the chart + library copy the measurements were taken on
curl -s http://localhost:3000/api/launchpad | head -c 200
```

The rhythm grid (O-1) and the personality table (O-4) were produced by throwaway
headless harnesses that instantiate `Engine` / `RivalBot` against
`buildPlatforms(candles, seed)` — the same code the game runs. They are not repo
artifacts; the numbers they produced are quoted above, and both are re-runnable
from those two entry points in a few dozen lines.

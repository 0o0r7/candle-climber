# PLAYTHROUGH AUDIT — 2026-11-10 (launchpad lane, played end to end)

Written after actually playing the shipped build, not after reading it. Every
number below was produced by a run; the commands are at the bottom so a reviewer
can reproduce them.

Lane: **LAUNCHPAD** (`/api/launchpad`), seed `2026-11-10 · MONKE`, 72 candles,
mutation **WHALE HOUR** (gravity ×1.28, jump ×1.10, camSpeed ×1.00). This lane was
chosen because its chart is long (72 candles vs the daily rotation) and because a
long chart is the only way to *reach* the late sectors, the summit and the
closing-bell finale in one run.

## 1. The headline: the chart was not playable past candle 12

Played by hand in the preview at the tablet viewport, a human jump rhythm
(hold ≈280 ms, rest ≈160 ms):

| Attempt | Candles | Score | STYLE | Result |
|---|---|---|---|---|
| before the fix | 12 / 72 | 215 | 9 | LIQUIDATED, cause `crumbled` |
| before the fix (repeat) | 12 / 72 | 215 | 9 | identical — the run is deterministic |

The rival-grade planner (`rival/planner.ts`, the code that drives the in-game
opponent) did no better: **candle 14**, 8.3 s, `crumbled`.

A search over *every* input the player has (press tick 1–30 × 11 release patterns,
from four take-off positions, plus the air-jump rescue) from platform #11 found
**no** sequence that lands on the next solid candle: every arc either fell back on
#10 or flew past #13 into the gap at #14. That is a dead end, not a difficulty
spike.

## 2. Root cause — red candles could never be stood on

`engine.ts`, the "did I slip off the edge?" re-check that runs at the end of every
step:

```ts
const stillOn = p && this.solidUnder(this.px, p) && ...   // solidUnder: state === "solid"
```

The landing branch immediately above it does
`if (p.crumble && p.state === "solid") { p.state = "crumbling"; }`. So on the very
tick the player landed on a red candle, that candle was no longer `"solid"`, the
re-check answered "not standing on it", and the player was un-grounded and fell
through. Consequences:

- **Every red-candle landing was a fall-through death no input could avoid.**
  Not "hard", not "fast" — impossible.
- The crumble **fuse** (0.26 s base, 0.34 s finale) and its **tell** were dead
  code: the fold always "finished" instantly because the player had already left.
- The closing-bell set-piece (`SUMMIT_FINALE`) could never be experienced: its
  whole premise is *standing* on a folding candle for the authored fuse.
- The launchpad chart's first red candle sits right after the first chasm
  (candle 13 after the gap at 12) — hence the hard wall at 12.

Fix (one surface test, no new state): a folding candle is still a surface until
its fuse expires, so the re-check tests `state !== "gone"` instead of
`solidUnder`'s `state === "solid"`. Physics, reach, score and determinism are
untouched; the candle still drops the player when the fuse runs out.

Pinned by `test/crumble-landing.test.ts` (4 tests): the landing tick holds, a
press right after landing fires the jump, the fuse still ends the surface, green
candles never fold.

## 3. After the fix — the same chart carries to the summit

| Measure | Before | After |
|---|---|---|
| Hand-played run (280/160 rhythm) | 12 candles · 215 · style 9 | **26 candles · 360 · style 27** |
| Rival-grade planner | 14 candles · 225 | **26 candles · 360** |
| Search over press timings | wall at candle 12 | **summit platform 71 reached at 33.6 s, 38 jumps** |
| `test/crumble-landing.test.ts` | n/a | 4 pass |

The hand-played post-fix run matches the headless planner number for number
(26 / 360 / style 27), which is the cross-check that the harness and the live app
run the same physics. Console stayed clean (0 errors) across both runs.

## 4. What the played run exposed that the code alone did not

1. **The chart is completable but not forgiving.** The 38-jump line that reaches
   the summit tolerates ≈4–7 ticks (≈67–117 ms) of timing error per jump, and
   only in *one* direction from the found line; rerunning it with random ±2-tick
   jitter finished 0 of 24 times. A single forgiving line does not exist — the
   player has to find their own. Proposal: a 2-tick wider `BUFFER` on the practice
   (archive) lane only, leaving the ranked lane's physics pinned.
2. **Launchpad terrain is vertically flat but the jump is enormous.** From
   candle ~9 to 71 the platform heights stay inside y ≈ 150–180 (a 30 px band)
   while a full-hold jump rises ≈299 px (≈192 px of travel) under WHALE HOUR's
   gravity — the dominant failure is **overshoot**, not missed reach. The level's
   fairness clamp (`MAX_UP` 112, biggest authored step on this chart 84) is never
   the thing that kills you. Proposal: for launch-only terrain, scale
   `AMP_MIN..AMP_MAX` to the chart's real close range so the authored steps use
   the jump's reach instead of squashing it.
3. **The 26-candle wall is a skill wall, not a dead end.** Both the planner and
   the hand rhythm stop at the first crumble+gap cluster in SQUEEZE (candles
   25–29); the search's line passes straight through it, so the geometry is fine —
   the input demand is what stops a first-time player.
4. **The rival's personalities are invisible on this terrain.** Five rival skins
   plus a deliberately "sloppy" variant produced byte-identical runs (26 / 360).
   Either the personality gates never bind here, or the terrain does not present
   the decisions they gate. Observation, deliberately not changed in this pass.
5. **Sector audio is still missing** (`#10` in `docs/PATTERN-AUDIT-2026-11-10.md`
   §4): the sector banner changes four times in a completed run — MARKET OPEN →
   TREND → SQUEEZE → CONSOLIDATION → THE SUMMIT → CLOSING BELL — and every one of
   them is silent.

### Resolution (same day) — see [`OPEN-ITEMS.md`](OPEN-ITEMS.md)

- **#1 (wider practice `BUFFER`) — rejected by measurement.** A 255-rhythm grid
  (`hold` 12…26 × `rest` 4…20) replayed on this exact chart under STANDARD,
  AERIAL (buffer 0.24 s = +5 ticks, i.e. more than the proposed +2) and GROUNDED
  gives **byte-identical results at every grid point**: best 26 candles, 0 / 255
  rhythms past 26. The wall is the arc, not the acceptance window.
- **#2 (launchpad amplitude) — fixed as a date-gated REPAIR, not a re-tune.**
  The defect is narrower than "amplitude too small": on a drifting chart the
  rolling window's min/max sit at the same end of the series, so the terrain
  collapses to a 32 px strip (oscillating charts already fill all 180 px).
  Raising `AMP_MAX` globally was measured and rejected — it fixes launchpad and
  taxes BTC/TSLA (mean candles per rhythm 15.5→13.7 and 30.8→24.2). Ship: chart
  v2 stretches ONLY a chart flatter than 120 px, leaving every other chart
  byte-identical, active from seeds dated `2026-11-12` so no played chart, ghost
  or board entry moves. Launchpad band 32 → 96 px, blind-rhythm ceiling 26 → 29,
  rhythms surviving past candle 20: 17 → 34 of 255.
- **#3 (26-candle wall)** — same root cause as #2; the cheap non-physics lever is
  a landing/take-off telegraph (recorded, not built).
- **#4 (invisible rival personalities) — no longer true, re-measured**: 14 / 91 /
  96 / 105 candles across the archetypes. The differentiation runs through
  `greed → RUSH`; the precision gate is inert here (lowering its threshold moved
  no run by a single tick, so the tweak was reverted).
- **#5 (sector audio) — fixed**: `SECTOR_MOTIFS` in `sound.ts`, fired once per
  boundary from `GameCanvas`, pinned by `test/sector-audio.test.ts`.

## 5. What was *not* verified in the real app

The summit, the graduation panel and the closing-bell finale were reached in the
engine search, **not** by hand in the browser: the surviving line is too tight to
replay through wall-clock key events, and I did not clear cabinet-level play in a
session. Treat the summit as "proven reachable, not yet played by a human".

## Reproduce

```bash
# full suite + type gate (must run inside the container)
docker compose -f docker-compose.base44.yml exec -T web sh -ec \
  'bun test && bunx tsc --noEmit --incremental false'

# the chart itself
curl -s http://localhost:3000/api/launchpad | head -c 300
```

The playthrough harness (level build + planner replay + input search) is a
throwaway script in the sandbox container, not a repo artifact; the reproducible
part of the finding is `test/crumble-landing.test.ts`.

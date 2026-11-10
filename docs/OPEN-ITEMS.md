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

Sources folded in: [`PATTERN-AUDIT-2026-11-10.md`](PATTERN-AUDIT-2026-11-10.md) §4,
[`PLAYTHROUGH-AUDIT-2026-11-10.md`](PLAYTHROUGH-AUDIT-2026-11-10.md) §4–§5, and the
open TODOs carried from the previous passes.

| # | Item | Why it was open (fact) | Decision | Status |
|---|---|---|---|---|
| O-1 | Wider press `BUFFER` on the practice lane | audit guessed the 26-candle wall was a press-timing window | **rejected — measured, it is not** | `DECIDED` |
| O-2 | Launchpad terrain is flat relative to the jump (overshoot) | measured: post-pad y band 132 px, full-hold rise ≈ 299 px | chart **v2**, not a silent re-tune | `DEFERRED` (owner) |
| O-3 | The 26-candle skill wall | same root cause as O-2, not a dead end | mitigate by telegraph, not by physics | `DECIDED` |
| O-4 | Rival personalities invisible | re-measured: they bind now, but **only** through RUSH | follow O-2; threshold tweak proven inert | `DECIDED` |
| O-5 | No audio for sector transitions | pattern #10, largest remaining polish gap | implemented this pass | `FIXED` |
| O-6 | Music | pattern #10 depth | not scheduled; sector cues are the interim | `DEFERRED` (owner) |
| O-7 | Summit / closing bell never played by a human | engine search proved reachable, not playable by hand | needs one human session | `OPEN` |
| O-8 | Build choice on the **ranked** lane | per-player forgiveness would touch a shared board | owner call | `DEFERRED` (owner) |
| O-9 | Cross-device career profile | needs a server identity | owner call (auth surface) | `DEFERRED` (owner) |

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

## O-2 · Flat terrain vs. a huge jump — DEFERRED (owner decision: chart v2)

**Measured geometry** of the same chart (`buildPlatforms` output, 72 candles,
9 gaps): the flat pad is at y 150, the post-pad terrain spans y 150…282 —
a **132 px band** — while the biggest *authored* step is 84 px (well inside
`MAX_UP` 112). A full-hold jump under WHALE HOUR rises ≈ 299 px. So the player
is not short of reach; the jump spends most of its flight *above* a terrain band
that is far narrower than the arc.

**Corroborating fact:** the only bots that pass the wall are the ones that hold
RUSH (camera ×1.28) — a faster camera **shortens the air time relative to the
platform spacing**, which is exactly the mechanic of an overshoot. See O-4.

**Why it is not being patched today.** `AMP_MIN…AMP_MAX` (150…330) shapes *every*
chart, including past dates and the daily lane. Changing it silently would
(a) re-shape every already-played chart, (b) invalidate stored ghosts and
self-ghost replays (they are position streams over the old geometry), and
(c) re-open the "one board, one meaning" law in `docs/ECONOMY-LAWS.md`. It is a
**versioned** change, not an edit.

**Owner decision needed:** ship `CHART_VERSION=2` (scale the amplitude band to
each chart's real close range, keep `MAX_UP`/reach untouched) as the start of a
new ranked epoch, with v1 charts frozen as archive. Until then the current
geometry stays byte-identical.

## O-3 · The 26-candle wall — DECIDED (telegraph, not physics)

The wall is a per-jump timing demand, not a reach or clearance problem: the
same terrain is completable (38-jump line, engine search) and the planner can
pass it with the right camera speed (O-4). The cheap lever that does **not** touch
physics is making the *next* landing readable — a take-off/landing marker, the
same idea as the crumble fuse tell that already exists. Recorded here as the
first candidate for the next pass; not implemented in this one (it is a new HUD
element, and this pass is a decision pass plus the audio gap).

## O-4 · Rival personalities — DECIDED (bound to O-2)

Re-measured after the crumble fix, launchpad chart, all 14 skinned characters:

| archetype | result |
|---|---|
| RECKLESS / GREEDY (hold RUSH) | summit reached, then world 2 — 91 candles / 3293 |
| PATIENT (frost, grump) | 105 / 96 candles |
| PRECISE (cop, visor, cadet, dapper) · BALANCED | 14 candles / 225 |

So the earlier finding ("five skins, byte-identical runs") **no longer holds** —
but the differentiation is carried almost entirely by `greed → RUSH`. The
`precision` and `risk` gates never bind, because on this terrain the first
press that clears the margin/alignment floor is the latest possible one, i.e.
the panic branch (`ticksLeft ≤ PANIC_TICKS`), which bypasses personality by
design (survival over style).

**Tried and reverted:** lowering the precision demand (alignment cap 0.72 → 0.50)
changed **not one tick** of any run — proof that the gate is inert here, not
miscalibrated. Reverted rather than kept as dead tuning. The archetypes become
visible once O-2 gives the arc room to have more than one viable press.

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

## O-6 · Music — DEFERRED (owner)

Still the largest polish gap after O-5. A music bed is a product decision (does
the game want a continuous loop over a 30–90 s run, and does that fight the
jump/land rhythm?). Sector cues now cover the "the chart changed" information
that was missing; music is atmosphere, not signal.

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

---

## Suggested next pass (ordered, by value per unit of risk)

1. **O-7 — one human playthrough of the summit** (zero code, and it is the only
   unverified thing in the product).
2. **O-3 — landing/take-off telegraph** (a HUD tell, no physics, no leaderboard
   impact; it attacks the actual 26-candle wall, which O-1 proved is a timing
   demand).
3. **O-2 — `CHART_VERSION=2`** only after the owner accepts a ranked epoch; it is
   the fix that makes rival archetypes and mid-chart decisions real, and it
   cannot be done silently.
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

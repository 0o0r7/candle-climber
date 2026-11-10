# DIFFICULTY DIRECTOR — the daily chart's authored pacing (P0.2)

> Written 2026-11-10. Code: [`src/game/cc/director.ts`](../src/game/cc/director.ts)
> · wiring: [`src/game/cc/level.ts`](../src/game/cc/level.ts) · tests:
> [`test/director.test.ts`](../test/director.test.ts).
> Design context: [`GAME-DESIGN-REFERENCES.md`](GAME-DESIGN-REFERENCES.md).

## The problem it solves

Before this every candle past the launch pad rolled the same 13% gap chance and
any red candle folded, so the chart had **no shape**: no opening, no climax, no
release. Measured symptom: the shipped rival bot — a driver that mirrors the
engine's own jump math — died at **candle 7** on every fixture seed, i.e. at the
exact candle the flat launch pad ends. That is not difficulty, it is a wall with
no lesson in front of it.

## The rule (one sentence)

The level's hazard schedule is a **pure function of the candle index**: same
index ⇒ same sector for every player, every replay, every client.

That is deliberate. Candle Climber's board is shared and daily, so adapting
difficulty per player would make two identical scores mean different things
(see §2 of the references doc). The director authors **pace**, never personal
difficulty.

## The sectors

| Sector | Candles | Gaps | Idea introduced |
|---|---|---|---|
| `MARKET OPEN` | 0 – 11 | none, and nothing folds | learn the jump (safe space) |
| `TREND` | +16 | 12% → 18% | the first gap: read ahead, jump early |
| `SQUEEZE` | +14 | 22% → 28% | the same idea, tighter — no new hazard |
| `CONSOLIDATION` | +10 | 4% | breather: rebuild the combo |
| …cycle repeats | 40 | +2 points per cycle, capped at 3 | pressure without a new rule |
| `THE SUMMIT` | last 12 | none | the final landing is earned, not gambled |

Three invariants hold across every fixture and seed (`test/director.test.ts`):

1. **No two gaps in a row.** One gap is one jump; two would need a ~200px leap
   the speed curve cannot pay for early in the chart.
2. **The intro is solid and does not fold.** Red candles still mean fragile —
   the rule starts at candle 12, not at the pad edge.
3. **Every gap is crossable at the slowest run speed.** Gap cost is
   `CANDLE_W + (CANDLE_W - PLATFORM_W) = 120px`; a held jump covers
   `CAM_BASE × airtime ≈ 148 × 1.325 ≈ 196px` — a 63% margin at the very start
   of a run, before the camera has accelerated.

The RNG draw order in `buildPlatforms` is unchanged (one draw per non-pad
platform), so the level stays a pure function of `(candles, seed)` and the W5
determinism pins still pass.

## What the player sees

A sector banner (`MARKET OPEN` / `TREND` / `SQUEEZE` / `CONSOLIDATION` /
`THE SUMMIT`) fades in when they cross a boundary, carrying a one-line
telegraph. It is keyed on the sector id, so each boundary replays the fade. No
score, no rule change, no reward — telegraphing only.

## Evidence (measured 2026-11-10, `bun test`)

- Rival bot at candle index **7 → 19** on the same seeds after the safe opening.
- A gap-free control level gives the same bot **19**: its remaining deaths are
  on crumblings, so gaps are not what limits it — the pacing change did not
  make the chart harsher than the bot's own handling.
- All 650 tests pass, including the W5 determinism and summit pins.

## Known limits

- The director shapes the **daily** chart. The post-graduation endless sky
  (`genWorld2Chunk`) keeps its own flat 15% gap rate — it is a bonus mode, not
  the comparable board.
- This changes the terrain for any given seed. Pre-launch that is free (the
  leaderboard, ghosts and duels live in the memory store); once real seasons
  exist, a change like this needs a level version in the seed string.
- Density numbers are design priors, not measurements: the `/ops` death
  histogram (P0.1) is what will confirm or reject them once real runs exist.

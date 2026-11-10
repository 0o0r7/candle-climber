# CAREER — the meta-progression lane (P0.7)

> Why it exists, with sources: [`GAME-DESIGN-REFERENCES.md`](GAME-DESIGN-REFERENCES.md)
> pattern #5 (meta-progression), which the second-pass audit called the second
> weakest remaining pattern. Code: `src/lib/career.ts` (pure), the bar in
> `src/components/cc/CareerBar.tsx`, wiring in `GameCanvas.tsx`. Contract tests:
> `test/career.test.ts`.

## The one rule: XP is cosmetic

Candle Climber is a **shared daily board**. Anything that makes one player
physically stronger than another at the same candle destroys the only thing the
board measures. So the career lane follows the same law the loadouts and the air
jump follow:

| It CAN change | It can NEVER change |
|---|---|
| a rank title and a progress bar | score, combo, multipliers |
| which achievements are reachable | physics, gravity, jump height |
| a toast, a number in `localStorage` | terrain, sectors, difficulty priors |
| | the ranked board or run tokens |

`Career` (`lib/career.ts`) has no score, physics or multiplier field. XP is
computed from a finished run and never read back by the engine. Two players on
different ranks climb a byte-identical chart.

## What a run is worth

```
XP = 10                      · showing up
   + 3  × candlesPassed      · the climb (volume)
   + 5  × bestStreak         · the combo (how well, not just how far)
   + 2  × style              · the quality axis (STYLE, P0.4)
   + 250                    · if the run graduated
   + 400                    · if it entered World 2
   (capped at 5,000 per run)
```

Every input is clamped (`clampInt`), so a hand-edited save or a malformed run
record can inflate a badge and nothing else. `MAX_RUN_XP` bounds a single run, so
a local tamperer cannot skip the ladder in one edit.

## The ladder

| Lv | Rank | XP |
|---|---|---|
| 1 | PAPER HANDS | 0 |
| 2 | RETAIL | 400 |
| 3 | DAY TRADER | 1,000 |
| 4 | SWING TRADER | 2,000 |
| 5 | POSITION TRADER | 3,500 |
| 6 | WHALE WATCHER | 5,500 |
| 7 | MARKET MAKER | 8,000 |
| 8 | LIQUIDITY KING | 11,500 |
| 9 | CHART ORACLE | 16,000 |
| 10 | CANDLE TYCOON | 22,000 |

Thresholds widen as they go: the first ranks teach the loop (a handful of runs),
the late ranks mark commitment. Two achievements hook the ladder at its midpoint
and ceiling (`rank_5` WHALE WATCHER, `rank_10` CANDLE TYCOON), so the
progression has a visible payoff without inventing a second reward currency.

## Where it is stored, and what that means

`cc_career_v1` in `localStorage`, exactly like the stats ledger and the
achievement set. Clearing site data clears the rank — the bar says nothing about
that, and the `/stats` page's "honest-local" disclaimer covers the same class of
data. There is no server profile: a cross-device career needs identity, and
identity on this build is the optional wallet lane, which is a product decision
(auth surface) rather than a refactor.

## Deliberate exclusions

- **No currency, no shop, no power.** A currency would need sinks and a reason
  not to become pay-to-win; that is a business decision, not a progression one.
- **No rank-gated terrain or modes.** Gating the daily chart behind a rank would
  let commitment change what the board measures.
- **No streak multiples.** The daily streak already has a ledger and an
  achievement; multiplying XP by it would make a missed day cost progression,
  which punishes absence rather than rewarding play.

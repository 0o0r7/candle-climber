# The air jump (P0.3) — a forgiveness verb, not a reach verb

One extra impulse per airborne period, on the same forgiveness windows as the
ground jump. Engine: `src/game/cc/engine.ts` (`AIR_JUMPS`, `AIR_JUMP_V`).
Contract tests: `test/airjump.test.ts`.

## The design law: `air reach < MAX_UP`

```
ground reach = JUMP_V²  / (2·GRAVITY) = 815² / 4200 ≈ 158px   (> MAX_UP 112)
air reach    = AIR_JUMP_V² / (2·GRAVITY) = 660² / 4200 ≈ 104px (< MAX_UP 112)
```

`MAX_UP = 112` in `level.ts` is the fairness clamp: no authored step is taller
than one ground jump. The second jump is deliberately **smaller than that
clamp**, which gives it exactly one job — recovering a bad arc or catching a
lower platform — and denies it the job it must never have: substituting for the
first jump.

Why that matters, concretely:

- **The daily chart stays comparable.** Everyone plays the same terrain; if the
  air jump could clear a `MAX_UP` step, every gap the Director authored as a
  one-jump beat would silently become a two-jump beat, and the difficulty
  priors (safe opening, sector ramp, summit run-in) would no longer describe
  the level players actually face.
- **No `MAX_UP` re-tune, no re-authoring pass.** The roadmap entry warned that
  an air jump "changes the `MAX_UP` fairness clamp … and every existing
  difficulty prior". At `AIR_JUMP_V = 660` none of that happens: the clamp is
  untouched, terrain generation is untouched, and the invariant is pinned by a
  test that fails loudly if someone raises the constant.

## Forgiveness parity (the Celeste contract)

The reference doc's rule — a new verb "must arrive WITH the same forgiveness
windows, or it will read as unfair rather than expressive" — is implemented as
**order**, not as new windows:

1. The buffered-jump branch is read first: `grounded || coyote > 0` ⇒ ground
   jump. A coyote save is *always* a ground-strength jump and **never spends the
   air jump**, so walking off a ledge still leaves the recovery in hand.
2. Only then does `buffer > 0 && airJumpsLeft > 0` fire the air jump.
3. A press with no jump left is **not swallowed**: the buffer keeps running and
   the jump fires the moment the player lands.
4. `JUMP_CUT` applies to the air jump too — releasing early cuts its rise.

Result: the air jump adds a verb without adding a single new timing rule. The
three existing windows (`COYOTE` 0.12s, `BUFFER` 0.16s, jump-cut) all apply to
it unchanged.

## Deliberate exclusions

- **No STYLE points.** `STYLE` pays for *fudged timing* (`SAVE` = the press only
  worked because of coyote or the buffer). The air jump is a verb the player
  spent, so paying for it would mint `+2` for a double-press on every hop and
  make the quality axis farmable. It still appears as a blue `AIR` float.
- **No leaderboard coupling.** `score`, the `MAX_SCORE_PER_CANDLE` cap and the
  run-token contract are untouched — the air jump changes no number a
  submission is graded on (`docs/ECONOMY-LAWS.md`).
- **No rival-bot change in this step.** The bot's planner mirrors the engine's
  *ground* jump and calls `press()` only from the ground or inside coyote, so it
  simply does not use the second jump. That makes the rival marginally easier to
  beat, which is a **balance** change, not a correctness one — and a balance
  change needs a before/after measurement. P0.5 shipped that instrument
  (`/ops` death histogram + sector table, `docs/TELEMETRY.md`); the bot change
  itself waits for real runs rather than for code. Tracking it here instead of
  guessing.

## Determinism

The air jump is a pure function of `(buffer, airJumpsLeft, coyote)` — no RNG, no
wall clock. `test/airjump.test.ts` pins replay equality tick by tick, so ghosts,
duels and the rival's shared-terrain contract are unaffected.

## Open question (needs data, not code)

Whether the second jump makes the daily chart *too* forgiving is a measurement,
not an argument: the `/ops` death histogram (P0.1, `docs/TELEMETRY.md`) compared
before and after this change is the instrument. Concretely, watch whether deaths
move later than the safe opening (12 candles) and whether the median death
candle rises. If it does not move, the verb is not doing its job; if it moves to
the summit run-in, it is doing too much.

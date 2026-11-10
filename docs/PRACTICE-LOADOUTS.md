# PRACTICE LOADOUTS — the build choice, and why it cannot touch the ranked lane

**Status:** shipped 2026-11-10 (P0.6). Code: `src/game/cc/loadout.ts`.
UI: the ready panel, **practice lane only**. Tests: `test/loadout.test.ts`.

## The gap it closes

The ten-pattern audit's worst row was **#2 build choice: absent** — the daily
mutation is *imposed* (`game/cc/mutations.ts`), so a run starts with every
decision already made. Sid Meier's test ("Interesting Decisions", GDC 2012) asks
for a **trade-off** the player can judge from **incomplete but sufficient**
information, and a game that **acknowledges** the choice. A fixed mutation fails
all three.

## The law

> A loadout moves **when** a press is accepted. It never moves **how far** it
> flies, and it never touches score.

That is the same law the air jump already obeys: `AIR_JUMP_V = 660` gives ≈104 px
of rise, under `MAX_UP` (112 px), so the second jump can never substitute for an
authored step (`docs/AIR-JUMP.md`). The loadouts therefore only reshape the
forgiveness windows — coyote, input buffer, verb count — and add no reach.

## The three options

| Loadout | Gains | Costs | Recovery profile |
|---|---|---|---|
| **STANDARD** | the shipped balance | no edge anywhere | `coyote 0.12 · buffer 0.16 · 1 air jump` |
| **GROUNDED** | ledge grace ×1.5 | buffer ×0.6 · **no air jump** | `coyote 0.18 · buffer 0.10 · 0` |
| **AERIAL** | air jump · long buffer ×1.5 | sharp ledge window ×0.6 | `coyote 0.07 · buffer 0.24 · 1` |

Each option wins one window and loses another — asserted directly in
`test/loadout.test.ts` ("every option wins one window and loses another"), so a
future tuning pass cannot quietly turn one of them into a straight upgrade.
`STANDARD` is not a copy of the engine defaults but a reference to them
(`{ coyote: COYOTE, buffer: BUFFER, airJumps: AIR_JUMPS }`), so the two cannot
drift apart.

## Why practice only

Candle Climber's product is a **shared daily chart with one global board**
(`docs/GAME-DESIGN-REFERENCES.md` §2). Per-player physics on that board would
make two identical scores mean different things — the fairness property the whole
economy rests on (`docs/ECONOMY-LAWS.md`).

So the choice is offered exactly where the app already has an unscored lane:
archive terrain (`/play?date=<past UTC date>`), where submissions are suppressed
and a practice run only banks weight server-side. `recoveryForRun(practice, id)`
is the single gate: `practice === false` always returns STANDARD, and the picker
is not rendered at all outside the archive lane. The engine factory
(`GameCanvas.tsx` `buildEngine`) is the **only** place an `Engine` is constructed
for play, so there is no second path a ranked run could take.

## Engine support

`Engine` takes an optional `RecoveryProfile` as its fifth argument
(`engine.ts:145`), defaulting to `DEFAULT_RECOVERY` — the shipped constants. It is
consumed at exactly three points: `press()` sets the input buffer from it, a
landing refills coyote and air jumps from it, and the air-jump branch checks the
verb count it refilled. No other physics reads it, and the default path is
byte-identical to the previous build (pinned by "the default constructor keeps the
shipped windows").

## Verification

- `test/loadout.test.ts` — 10 cases: the reach law, STANDARD ≡ defaults, the
  trade-off directions, the ranked-lane gate, unknown-id fallback, engine
  consumption (buffer, coyote refill, `airJumps: 0` never firing), and the two new
  audio voices.
- `bun test` → 707 pass / 0 fail; `tsc --noEmit` clean; `lint` 0 errors.
- In the running app: a normal (ranked) `/play` renders **no** picker, starts cleanly
  from the ready panel, and plays (score ticks, sector banner, zero console errors)
  — i.e. the STANDARD default path is unaffected.
- **Not automatically verified:** the picker's own rendering, selection and CSS on a
  practice deep link. The sandbox preview harness rewrites any hard navigation to
  its own entry URL, so `/play?date=<past>` cannot be opened there; open a past
  date from the in-game archive browser by hand to see it.

## Not done (on purpose)

Offering the choice on the **ranked** daily lane. That is a fairness decision for
the owner (per-player physics vs. one global board), not a refactor — see
`docs/PATTERN-AUDIT-2026-11-10.md` §4.

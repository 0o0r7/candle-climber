# STYLE SCORE — the quality axis beside "how high" (P0.4)

> Written 2026-11-10. Code: [`src/game/cc/style.ts`](../src/game/cc/style.ts) ·
> wiring: [`src/game/cc/engine.ts`](../src/game/cc/engine.ts) ·
> tests: [`test/style.test.ts`](../test/style.test.ts).
> Why the axis exists: [`GAME-DESIGN-REFERENCES.md`](GAME-DESIGN-REFERENCES.md) §1 #3, §3.

## The problem it solves

The run score is `candles × combo × rush`. That is a *volume* number: a cautious
climb that never takes a risk and a precise climb that repeatedly saves itself on
the edge produce the same kind of score. The ten-pattern analysis names the
missing pattern **quality score** — "how you climbed" should be legible next to
"how far you climbed".

## The two things it counts (and nothing else)

| Event | Points | What the player did |
|---|---|---|
| `LATE` | **+3** | Jumped from the last **20 px** of the platform under them — rode the candle to its edge instead of leaving early. Risk **taken**. |
| `SAVE` | **+2** | The jump only fired because of **coyote time** or the **input buffer** — the press started off the ground. Risk **recovered**. |

Both are measured from engine state only (player position, takeoff platform,
whether the press started airborne). There is no RNG, no clock, no `Math.random`
— the tally is replay-exact, and two identical input streams produce an identical
STYLE number (`test/style.test.ts` pins this).

STYLE deliberately does **not** count candles, combo, rush or graduation: those
already live in the score. A clean, early, unhurried climb earns **0 STYLE** by
design — the number says "you did not gamble", not "you played badly".

## Fairness: why it is NOT a board column yet

STYLE is client-computed and shown on the run result. It is **not** submitted to
the leaderboard, not part of the run token, and not covered by the anti-cheat cap
in `lib/scoring.ts`. Two reasons:

1. A new scoring lane must not change what an existing score means
   (`ECONOMY-LAWS.md`: the daily board stays comparable).
2. STYLE would need its own server-side plausibility bound (max late hops per
   candle ≈ 1) before it can gate anything. That is a separate, later change.

## Feedback (juice, not rules)

Each event floats in **gold** above the player (`LATE +3` / `SAVE +2`) — visually
distinct from the lime score floats — and the run result line reads
`… candles · best streak xN · style S · PB …`. The engine's rules are untouched:
no jump, gravity, speed or gain constant changed in this workstream.

## Evidence (measured 2026-11-10, `bun test`)

- `test/style.test.ts` — 10 assertions passing: point table, careful jump earns 0,
  LATE at the boundary and inside it, buffered SAVE, coyote SAVE, determinism,
  and the `RunResult` payload.
- Full suite: **660 pass / 0 fail**; `tsc --noEmit` clean; `eslint` 0 errors.
- No engine constant changed, so existing pins (W5 determinism, summit gains,
  rival bot) pass unmodified.

## Known limits

- The window (`STYLE_LATE_RUNWAY = 20 px`) is a design prior, not a measured
  value. P0.5 has since added the measurement (`styleLate`/`styleSave` on the run
  event, `/ops` §3.1): the engaged share and the LATE/SAVE split are what decide
  whether 20 px is a real risk or free points. The number still needs real runs —
  a prior becomes evidence only when the table has a sample.
- STYLE is per run, not per account; there is no career aggregate yet.
- The death-card PNG keeps its three-box stat row (width-bound); STYLE shows in
  the app's result panel, not on the share image.

# RESCUE ECONOMY — climb credits and the paid second chance

Status: implemented 2026-11-11. Contract tests: `test/credits.test.ts`,
`test/rescue.test.ts`. Code: `src/lib/credits.ts` (economy, pure),
`src/game/cc/engine.ts` (`revive()`), `src/components/cc/GameCanvas.tsx` (the
offer + the wallet UI), `src/lib/board-validation.ts` (the board tag).

## Why this exists

The ranked score is a skill-only number (ECONOMY-LAWS LAW 1.3): it can never be
bought, and the daily chart must stay comparable between players. That left the
player's performance with no *spendable* counterpart — a score that only ever
went into a leaderboard, with nothing to decide and nothing to save.

Climb credits are that counterpart. They are earned by playing, they are spent
on one voluntary second chance inside a run, and they touch nothing else: not
the physics, not the reach, not the terrain, not the product token, and not the
score you submit.

**Three numbers, kept apart on purpose — never merge them:**

| number | what it is | can it be bought? | can it change a run? |
| --- | --- | --- | --- |
| **score** | the ranked number (leaderboard) | no | no |
| **credits ✦** | this wallet, earned by play | no | only by buying a rescue |
| **$WICK token** | the product token | (its own market) | no |

Credits have **no purchase path and no token conversion**. There is no API, no
button and no server route that mints credits from money or from the token.

## Earning

One curve, defined once in `src/lib/credits.ts` and imported by both the engine
(live accrual) and the wallet (banking) so the HUD can never drift from the bank:

| event | credits |
| --- | --- |
| showing up (per run) | +10 |
| each candle passed | +2 |
| each STYLE event (LATE hop / SAVE) | +3 |
| reaching the summit | +100 |
| entering world 2 | +100 |

Accrual is live: `eng.credits` grows as you climb, and the HUD shows
`banked wallet + this run so far`. That is what makes the rescue decision
possible mid-run — the price is paid from what this run has already earned plus
whatever the wallet holds from earlier runs.

Banking happens **exactly once per run**, in `recordFinishedRun`, and only for
the credits still unspent (`RunResult.credits`). A rescued run therefore never
refunds what it paid.

## Spending: the rescue

- **Price:** `RESCUE_COST = 90` ✦ — fixed. 10 (run bonus) + 40 candles × 2 = 90,
  so a player who reaches candle 40 earns one rescue *inside that same run*.
  Nothing else can produce credits, so the price is reachable from play alone.
- **Cap:** `MAX_RESCUES_PER_RUN = 1`. The second chance is a decision, not a life
  counter; a second death ends the run.
- **Payment order:** run credits first, then the banked wallet (`planRescue`).
  An unaffordable purchase plans nothing and the button is disabled — the panel
  says how many credits are missing.
- **Where you resume:** the last platform you actually stood on, if it is still
  a non-folding surface; otherwise the nearest solid green platform before it.
  Never mid-air, never on a `gone` candle (`revivePlatform`).
- **What is kept:** score, candles passed, credits, best streak.
- **What is lost:** the running combo (streak → 0). The fall breaks it.
- **No double scoring:** `Platform.passed` is sticky, so a resumed run can never
  re-award terrain it already climbed (`test/rescue.test.ts`).
- **Deterministic:** the same fall resumes in the same pose (pinned by a test).

## Spending: the trophy case (the non-competitive sink)

A rescue is the urgent spend; the trophy case (`src/lib/cosmetics.ts`) is the
patient one. Three ornaments priced above a rescue (120 / 240 / 480 ✦) decorate
the player's OWN panels only:

| item | effect | touched by it |
| --- | --- | --- |
| CARD FLARE | a gold flare on the results panel | that player's panel |
| CREDIT SEAL | a seal beside the credit line | that player's panel |
| CLIMBER'S OATH | a sworn line on the entry card | that player's panel |

They change no score, no physics, no terrain, no board row and no other
player's view; there is no trade, no transfer and no resale. Purchases refuse on
`owned`, `unknown` and `short` — a short wallet is returned untouched, and a
hand-edited owned list cannot smuggle in an unknown id.

## Ranking treatment (stated precisely)

A rescue is a real, visible second chance, so the boards must never present a
rescued run as if it were a clean one:

1. The submission carries `rescues` (0 or 1 today, clamped to 9 server-side in
   `sanitizeRescues`) and the stored row keeps it as `BoardEntry.rescues`.
2. Every place a score is compared — the in-game boards, the full
   `/leaderboard` page — renders a `↺n` tag beside that score.
3. The score itself is **not** altered, scaled or penalised: it is still pinned
   by the run token and the physical caps (`score ≤ candles × MAX_SCORE_PER_CANDLE`),
   and a rescue cannot mint score by itself. Ranking order stays by score within
   the lane; the tag is what makes the comparison honest.
4. The rescue count is client-reported display metadata (it is not inside the
   signed ownership proof and the engine runs client-side by design). A forged
   count can only mislabel a row — it cannot inflate a score, a rank or the
   physics any run was played on.

## Telemetry

`POST /api/telemetry/run` accepts `rescues` (clamped, PII-free) beside the
existing death histogram fields, so a rescued run's final death index is not
mistaken for the point where the climb actually broke.

## Rollout note

The numbers above are the v1 configuration and live in one module so they can
be tuned without hunting callers. Any change to the price must keep the
reachability invariant (`creditsForRun(40 candles) === RESCUE_COST`) and update
`test/credits.test.ts` — that test is the guard against a price nobody can
reach from play.

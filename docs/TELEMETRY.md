# TELEMETRY — the run contract and how to read `/ops`

> P0.1. Written 2026-11-10. Why this exists, with sources:
> [`GAME-DESIGN-REFERENCES.md`](GAME-DESIGN-REFERENCES.md) §2.
> Code: `src/lib/run-telemetry.ts` (pure math) ·
> `src/lib/run-telemetry-store.ts` (memory / Mongo) ·
> `src/app/api/telemetry/run/route.ts` (intake).

## 1. What is collected

ONE aggregate event per **finished run**. "Finished" has exactly the same meaning
as the local stats ledger: the run died, or it graduated and the player retried
from the summit panel. Abandoning a live run (HOME / pause → home) records
nothing — the ledger does not count it either.

| Field | Type | Source | Why |
|---|---|---|---|
| `candle` | int, clamped 0–600 | `candlesPassed` at run end | the death histogram axis |
| `score` | int, clamped 0–10M | run score | cohort comparison |
| `streak` | int, clamped 0–10k | best combo | difficulty vs. greed |
| `cause` | `fell` · `crumbled` · `wicked` · `abandoned` | engine death cause | which rule kills |
| `graduated` | bool | run reached the summit | completion rate |
| `world2` | bool | run entered post-grad world | long-tail difficulty |
| `rush` | bool | RUSH was used this run | is the risk verb used? |
| `device` | `touch` · `keyboard` | coarse-pointer probe | mobile vs desktop difficulty |
| `mode` | `crypto` · `stocks` · `launchpad` | active mode | per-mode histograms |
| `interval` | `1w` · `1d` · `4h` · `1h` | active timeframe | per-terrain histograms |
| `ts` | ms epoch | **server clock** | windowing; the client's clock is never trusted |

**Never collected:** names, wallets, addresses, IPs, user agents, run tokens,
candles/terrain payloads, or any per-player trail. There is no id to join events
by, which is deliberate: the questions are population questions.

## 2. Where it goes

- `DATABASE_URL` set to a MongoDB URI → collection `candleclimber.run_telemetry`,
  TTL index of **90 days** (`ts`). Telemetry is behavioral data with a shelf life.
- Otherwise → in-memory (5,000 events, resets with the process), same accepted
  tradeoff as the leaderboard store. `/ops` names the active backend.

Writes are fire-and-forget: the game never awaits the request and never reports a
failure. A Mongo outage must not touch a run's end state (LAW 1).

## 3. Reading `/ops`

The **RUN TELEMETRY — 7D** block reports the last seven days:

| Row | Meaning | First thing to look at |
|---|---|---|
| `finished runs` | sample size | under ~30, treat every number as noise |
| `deaths / graduations` | completion | graduation ≈ 0 over many runs = the summit is unreachable |
| `median death` | where half of deaths happen | if it is under ~15 candles, the opening is too sharp |
| `p90 death` | the good-run tail | if p90 is also small, skill has no room |
| `early deaths (≤10)` | the "died in the first candles" signal | > 40% of deaths is an onboarding defect, not difficulty |
| `rush / touch share` | verb + device adoption | RUSH near 0% = the risk verb is invisible |
| `causes` | which rule kills | a `crumbled` spike = red-candle density, not timing |
| histogram | deaths per 20-candle bin | a single bin holding most deaths = a set-piece spike |

The histogram is deaths only — an abandoned summit run is a success and would
otherwise drag the curve down.

## 4. Intake rules

- `POST /api/telemetry/run`, JSON, body capped at 2 KB.
- Per-IP budget: 60 requests/minute (`telemetry-run` namespace). A human plays far
  fewer than 60 finished runs a minute.
- Every numeric field is clamped server-side; unknown enum values fall back to the
  safe label; a payload without a numeric `candle` is rejected (400).
- No read path is public: the numbers exist only on `/ops` (noindex, aggregate).

## 5. Verification

```bash
# one synthetic event through the real route (then read it back on /ops)
curl -s -X POST http://localhost:3000/api/telemetry/run \
  -H 'content-type: application/json' \
  -d '{"candle":12,"score":340,"streak":3,"cause":"fell","device":"keyboard","mode":"crypto","interval":"1w"}'
# → {"ok":true,"store":"memory"}

curl -s http://localhost:3000/ops | grep -A2 "RUN TELEMETRY"
```

Unit contract: `bun test test/run-telemetry.test.ts`.

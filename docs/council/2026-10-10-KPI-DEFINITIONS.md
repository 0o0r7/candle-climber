# KPI DEFINITIONS & TARGETS (E4.2)

> Written 2026-10-10 (ECONOMY-CHECKLIST E4.2). Rule inherited from E1.3:
> **numbers are either read off a source or marked TARGET/assumption — never
> invented.** Reviewed weekly at E4.3 (15 min, owner + agent); ONE economy change
> per week maximum. All targets are PROVISIONAL until the first real data week.

## North star

**D7-retained climbers who connect a wallet.** Everything else (meter, burn,
holders) is downstream of humans returning daily and choosing identity.

## KPI table

| # | KPI | Definition (exact) | Source | Target (provisional) |
|---|---|---|---|---|
| 1 | DAU | distinct identities with ≥1 `run` weights event today | `/ops` (weights `todayRuns` is submissions; distinct = `identities` delta day-over-day — v1 reads weekly) | 50 by 2026-11-30 (funnel §6: "working hook" line) |
| 2 | D1 retention | % of day-N first-run identities with a run on day N+1 | Mongo weights_runs (first-date cohort query — E4.1 v2) | 25% |
| 3 | D7 retention | same, day N+7 window ±1 | same | 8% |
| 4 | Connect rate | % of distinct daily identities with a non-null wallet link on ANY event | `/ops` linkedWallets ÷ identities (cumulative proxy; per-day in E4.1 v2) | 30% |
| 5 | Buy conversion | holders (RPC `balanceOf > 0` — needs an index sweep post-transfer-unlock; pre-grad = curve buyers, not readable per-wallet without the pad's holder API) | RPC / pad | n/a pre-grad — marked honestly, not faked |
| 6 | Meter velocity | ETH/day net into the curve | `verify-econ-state.py` deltas (E0.4 ritual) | 0.10 ETH/day ≥ twice weekly by 2026-11-30 |
| 7 | Streak distribution | histogram of `streakDays` across active identities | weights_runs (E4.1 v2) | median ≥ 3 (hook is working) |
| 8 | Days-to-graduation | (4.0 − reserve) ÷ trailing-7d velocity | /ops meter + #6 | informational — never promised externally |
| 9 | Referral share (G5) | % of 7d board rows carrying `ref` | `/ops` topRefs ÷ laneStats totals | 20% of new-identity rows |
| 10 | Lane honesty | official ÷ total submissions | `/ops` todayGuest/todayOfficial | informational — no target (LAW 1.2: guest is not a failure state) |

## Why these targets (assumptions labeled)

- #1's 50 = the "working hook" scenario in WICK-ECONOMY-SPEC §6 (50 DAU · 30% buy ·
  0.02 ETH/mo ⇒ ~13 months to graduation). Below that we are in "not viable" territory
  and the response is REACH + hooks, never economy tweaks.
- #6's 0.10 ETH/day ⇒ ~40 days to graduation AT TARGET — deliberately aggressive so
  that missing it is visible early, not comfortable.
- Every target can be wrong; none can be secretly redefined. Changes go through E4.3
  with a dated note.

## v1 honest gaps (build order)

- DAU/daily-cohorts need E4.1 v2 (daily aggregate table or a Mongo daily rollup job).
- Buy conversion pre-grad is genuinely unreadable per-wallet — the pad does not
  expose per-buyer curve positions; we will not approximate it with volume proxies.
- SimpleAnalytics (external) covers page-level traffic; connect-rate KPI #4 uses
  first-party ledger data only, so analytics outages cannot fake it.

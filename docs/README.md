# docs/ — what to read, and what is only history

> Index added 2026-10-10 (launch-readiness pass). Candle Climber accumulated
> status and planning docs across several working cycles; this page says which
> document is the **source of truth for what**, and which ones are kept only as a
> record. If a historical doc contradicts a current one, the current one wins.

## Source of truth (current)

| Question | Read |
|---|---|
| Which claims are actually true, and why | [`TRUTH-TABLE.md`](TRUTH-TABLE.md) |
| Every data feed: URL, cadence, failure mode, honesty label | [`FEEDS.md`](FEEDS.md) |
| The official Robinhood Chain connection + raw evidence | [`ROBINHOOD-CHAIN-INTEGRATION.md`](ROBINHOOD-CHAIN-INTEGRATION.md) |
| What the ecosystem owes us an answer on | [`ECOSYSTEM-QUESTIONS.md`](ECOSYSTEM-QUESTIONS.md) |
| Economy rules and laws (weights language, fairness) | [`ECONOMY-LAWS.md`](ECONOMY-LAWS.md) · [`WICK-ECONOMY-SPEC.md`](WICK-ECONOMY-SPEC.md) · [`ECONOMY-CHECKLIST.md`](ECONOMY-CHECKLIST.md) |
| How we compare against the ecosystem bar | [`ECOSYSTEM_BAR.md`](ECOSYSTEM_BAR.md) |
| Game design + technical plan | [`GAME_DESIGN.md`](GAME_DESIGN.md) · [`CC-PLAN.md`](CC-PLAN.md) |
| Zero-cost infrastructure map | [`INFRASTRUCTURE.md`](INFRASTRUCTURE.md) |
| Ecosystem intel (dated snapshots, quoted sources) | [`INTEL-UPDATE-2026-10-07.md`](INTEL-UPDATE-2026-10-07.md) · [`VIBE-ECOSYSTEM-INTEL-2026-10.md`](VIBE-ECOSYSTEM-INTEL-2026-10.md) · [`TOKEN-LAUNCHPAD-RESEARCH.md`](TOKEN-LAUNCHPAD-RESEARCH.md) |
| Persian glossary for chat | [`GLOSSARY-FA.md`](GLOSSARY-FA.md) |

## Historical — kept as a record, not as status

These describe a cycle that has since closed. Each carries a banner saying so.
They are **not** updated when the product changes; do not quote them as current.

| Doc | Why it is history |
|---|---|
| [`HANDOFF-2026-10-04.md`](HANDOFF-2026-10-04.md) | Hand-off state before the economy workstreams; superseded by `ECONOMY-CHECKLIST.md` + `worklog.md` |
| [`LOOPBACK-REVIEW-2026-10-05.md`](LOOPBACK-REVIEW-2026-10-05.md) | One-off loopback review; its actions are done or superseded |
| [`VARIANT-REVIEW-2026-10-05.md`](VARIANT-REVIEW-2026-10-05.md) | Review that produced merge-back wave 1 — adopted; `ECONOMY-LAWS.md` + `level-source.ts` are the result |
| [`FINAL-SPRINT-PLAN-2026-10-06.md`](FINAL-SPRINT-PLAN-2026-10-06.md) | The sprint it planned is closed; tracked in `ECONOMY-CHECKLIST.md` |
| [`MANUS-VARIANT-BRIEF.md`](MANUS-VARIANT-BRIEF.md) · [`MANUS-ALTERNATIVE-BRIEF.md`](MANUS-ALTERNATIVE-BRIEF.md) | External-agent briefs, no longer active |

## Verification entry points

```bash
bun scripts/verify-feeds.ts    # live official-feed connection test (exit 0/1/2)
bun test                       # 20 suites, zero network
bun run lint && bunx tsc --noEmit
```

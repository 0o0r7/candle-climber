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
| The PARTNER lane: design math, DEX reader, evidence chain | [`PARTNER-LANE-DESIGN.md`](PARTNER-LANE-DESIGN.md) |
| The PARTNER lane: build status ledger (done / not-started, each with why + trigger) | [`PARTNER-LAUNCH-ROADMAP.md`](PARTNER-LAUNCH-ROADMAP.md) |
| Overall phase checklist (P0–P7 + G items) and where the project stands | [`MASTER-CHECKLIST.md`](MASTER-CHECKLIST.md) |
| Delivery audit 2026-10-13: scope, findings, fixes, deferred items | [`DELIVERY-READINESS-REPORT.md`](DELIVERY-READINESS-REPORT.md) |
| Base44 research wave: product audit + level-up plan + leaderboard/anti-cheat deep-dive (Persian, EN abstracts) | [`RESEARCH-DEEP-DIVE-FA.md`](RESEARCH-DEEP-DIVE-FA.md) · [`LEVEL-UP-PACKAGE-FA.md`](LEVEL-UP-PACKAGE-FA.md) · [`DEEP-DIVE-LEADERBOARD-COMPETITION-FA.md`](DEEP-DIVE-LEADERBOARD-COMPETITION-FA.md) |
| Security hardening audit of the LU wave (agent self-review) + integration fixes record | [`SECURITY-HARDENING-AUDIT.md`](SECURITY-HARDENING-AUDIT.md) |
| How we compare against the ecosystem bar | [`ECOSYSTEM_BAR.md`](ECOSYSTEM_BAR.md) |
| Game design + technical plan | [`GAME_DESIGN.md`](GAME_DESIGN.md) · [`CC-PLAN.md`](CC-PLAN.md) |
| Zero-cost infrastructure map | [`INFRASTRUCTURE.md`](INFRASTRUCTURE.md) |
| Ecosystem intel (dated snapshots, quoted sources) | [`INTEL-UPDATE-2026-10-07.md`](INTEL-UPDATE-2026-10-07.md) · [`VIBE-ECOSYSTEM-INTEL-2026-10.md`](VIBE-ECOSYSTEM-INTEL-2026-10.md) · [`TOKEN-LAUNCHPAD-RESEARCH.md`](TOKEN-LAUNCHPAD-RESEARCH.md) |
| Persian glossary for chat | [`GLOSSARY-FA.md`](GLOSSARY-FA.md) |

### Language policy (2026-10-13)

Working language of this repo is **English, technical, professional**. Three
deliberate exceptions are dated records, not working docs:
[`STATUS-FA.md`](../STATUS-FA.md) and [`GLOSSARY-FA.md`](GLOSSARY-FA.md)
(owner-facing status + chat glossary) and the `docs/council/*-FA.md` Persian
session transcripts and the three Base44 research companions
(`RESEARCH-DEEP-DIVE-FA.md`, `LEVEL-UP-PACKAGE-FA.md`,
`DEEP-DIVE-LEADERBOARD-COMPETITION-FA.md`) — each carries a one-paragraph
English abstract; the
English council verdicts are the authoritative record). Verbatim owner quotes
inside English docs are preserved as evidence; where load-bearing, an English
gloss accompanies them. `docs/WICK-LAUNCH-FORM-PACK.md` is the historical
record of the launch-form submission content (original in Persian); the
authoritative on-chain launch facts it produced are pinned in
[`evidence/wick-launch-record.json`](evidence/wick-launch-record.json).

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
bun test                       # 42 test files / 530+ tests, zero network
bun run lint && bunx tsc --noEmit
```

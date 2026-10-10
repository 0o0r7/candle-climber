# PR CHECKLIST — LAW 5.1 review gate (E3.1)

> Written 2026-10-10 (ECONOMY-CHECKLIST E3.1). LAW 5.1 (docs/ECONOMY-LAWS.md):
> **every PR touching scoring, leaderboard, wallet, or cosmetics states which laws
> apply and how it complies — in the PR description.** This file is the mechanical
> form of that law. It applies to agent runs and owner merges alike.

## The gate (copy into the PR description, fill every line)

```
LAW 5.1 REVIEW GATE
- Surfaces touched: [scoring | leaderboard | wallet | cosmetics | weights | other]
- LAW 1.1 (score/rank untouchable by wallet/tokens): affected? how verified?
- LAW 1.2 (guest play free & walletless, never blocked): affected? degrade path?
- LAW 1.3 (skill-only): affected? any reward loop crept in?
- LAW 2 (economy lanes: cosmetics/weights/events only): affected? which lane?
- LAW 4 (language: "builds weights", testnet stated, no earn/guaranteed): new copy swept?
- LAW 5 (evidence): tests added/updated (count), gates run (bun test / tsc --incremental false / lint / build)
- Anti-sybil (docs/council/2026-10-10-ANTI-SYBIL-AUDIT.md): new residual risk? one paragraph added there?
```

## Rules of use

1. A PR is mergeable only when every touched line has an answer — "n/a" is an answer,
   silence is not.
2. The gate is cumulative: if the diff makes an old answer false, update the old PR's
   assumption in the NEW PR description (dated note style, LAW 5.3 etiquette).
3. Economy-number changes additionally require the weekly E4.3 slot (one change/week)
   — the gate records the slot, it does not replace it.
4. Agent solo-runs (owner pre-approval 2026-10-02): the filled gate lives in the
   commit message body + worklog entry; evidence-based closure substitutes for chat
   confirmation, same as the gate ledger precedent.

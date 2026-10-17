# MAINNET WATCH PLAN (E6.3 / CC-PLAN D11–D14)

> Written 2026-10-10 (ECONOMY-CHECKLIST E6.3). Scope: what we watch on the ROAD to
> graduation and in the first weeks after, who acts, and what "success" means
> numerically. This is a WATCH plan, not a promise — every number is either a read
> or a marked target (E4.2 rules apply here too).

## 1. What we watch (and the exact source)

| Signal | Source | Cadence | Why |
|---|---|---|---|
| Meter ETH + % | pad API launch record (E0.4 script + /ops) | weekly ritual | the one number that moves phases |
| lifecycle / graduated flags | same | same | T-zero detector (runbook §2) |
| Burn total | `/api/burn` (0x…dEaD balance) | weekly | the deflation narrative lives or dies here |
| Robinhood Chain health | explorer stats API (txs/day, avg block time) | weekly | our terrain pipeline + reads depend on the chain |
| Fee-rail integrity | curve fee split reads (config API) | at graduation | verify 75/20/5 rails unchanged post-migration |
| Holder count | RPC/index — post-transfer-unlock only | post-grad | KPI #5 unblocks |
| Ecosystem velocity | launch census (KB repo), showcase window | monthly | reach strategy calibration |
| Sentry P2 economy alerts | E4.4 tags | continuous | ledger trust is the product |

## 2. Who acts (owner / agent split)

- AGENT: all reads, weekly E0.4 snapshot append, /ops checks, freeze/unfreeze
  mechanics at T (runbook §2), docs.
- OWNER: any wallet signature, treasury/prize decisions (P6.4), platform
  communication (X/Discord), incentives submission (O-I), anything spending ETH.
- ESCALATION RULE: two consecutive weeks of meter velocity < 0.02 ETH/day ⇒ the
  weekly review MUST discuss reach (E5) as the only lever — economy knobs stay
  frozen (E1.3 reading is settled; do not re-litigate mid-air).

## 3. What "graduation success" means numerically (marked TARGETs)

| Measure | Success | Fine | Problem |
|---|---|---|---|
| Days from launch to graduation | ≤ 120 (assumption-labeled: needs ~0.033 ETH/day avg) | ≤ 240 | > 365 ⇒ strategy review, not economy tweaks |
| Post-grad D7 retention (KPI #3) | ≥ 8% | 4–8% | < 4% two weeks running ⇒ hooks review |
| Snapshot participation (linked wallets ÷ active identities) | ≥ 30% | 15–30% | < 15% ⇒ link-UX review (announced loudly, one click) |
| Post-grad first-week burns (KPI #6 analog on burn delta) | rising | flat | falling with volume ⇒ fee-rail verification first, narrative second |

## 4. Pre-commitments (made now, while calm)

1. We do NOT change the 2% tax narrative, the weights formula, or lane structure in
   the 14 days before an expected graduation (stability > optimization).
2. The snapshot freeze follows the runbook exactly — no ad-hoc windows.
3. Post-grad lane builds (mirror/spend/burn/tournaments) each pass a fresh LAW 5.1
   gate + council note; the staging in `graduation.ts` unlocks NOTHING by itself.
4. All external copy through the LAW 4 sweep + TRUTH-TABLE row check before posting.

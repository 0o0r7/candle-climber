# PARTNER LANE — LAUNCH ROADMAP & STATUS LEDGER

Status: LIVING DOCUMENT · first published 2026-10-12 · audit basis: `origin/main @ 3de36d0`
Audience: (a) the owner — what is left and what it depends on; (b) ecosystem / platform
teams reviewing this repository — what every phase claims and where that claim is proven.

House rule of this document: **every row is either evidence-linked or explicitly marked
NOT STARTED.** A claim without a pointer is treated as false. Nothing here is written in
the future tense unless it carries an explicit trigger and an owner decision. Where a
number exists, it is measured, not invented — and the measurement method is linked.

Companion documents (single sources of truth — this ledger never re-derives them):

| Topic | Authoritative document |
|---|---|
| Threshold math, price readers, verification state machine | `docs/PARTNER-LANE-DESIGN.md` (§1–§7; §4b = DEX pool reader) |
| Council ruling that legalized hold-to-list + red lines | `docs/council/2026-10-12-TWO-MODES-STOCK-PARTNER-COUNCIL-FA.md` |
| Economic laws binding every feature | `docs/ECONOMY-LAWS.md` |
| Graduation-day sequence (when trigger R-4/R-5/R-6 fire) | `docs/council/2026-10-10-GRADUATION-RUNBOOK.md` |
| Owner-facing plain-Persian status | `STATUS-FA.md` (repo root) |

---

## 0. How to re-verify every claim in ~5 minutes

Run locally (no keys, no paid RPC — the lane is deliberately keyless):

```bash
bun test                    # expected: 530 pass / 0 fail across 42 files
bunx tsc --noEmit           # expected: clean (no-cache run)
bun run lint                # expected: clean
bun scripts/smoke-dex-reader.ts   # live chain reads: WICK curve + a real GRADUATED pool
```

Public surfaces to inspect without cloning:

- `/partners` — the lane's public page: what it is, why, the phase-aware gate, and the
  application form (honeypot + rate-limited; PII is stored, never published).
- `/api/wick/state` — aggregate-only live state: lifecycle, meter %, phase-aware price
  (curve formula vs DEX pool), gate figures, each labeled with its source.
- `/api/partners/pool` — the listed-partner pool (aggregate-only; empty today, honestly).

Pinned evidence fixtures (byte-level, committed):

- `docs/evidence/wick-launch-record.json` — WICK launch record (2026-10-05, launchId 5963)
- `test/fixtures/wick-launch-live-20261012.json` — live curve state (formula validation)
- `test/fixtures/vibe-graduated-beef-20261012.json` — a REAL graduated launch (BEEF):
  the three-source slot0 word, the storage key, the two fee-measuring tx hashes

Commit chain for the lane (oldest → newest): `961bd1f` (council ruling) → `9e617aa`
(lane v0: page + form + threshold v0) → `f0d3a3b` (registry, verifier, gates, P4-2) →
`4f354a9` (P3-1 indexer ABI fix against real logs) → `e5dd19e` (live-grounded price +
phase-aware threshold) → `3de36d0` (DEX pool price reader, live).

---

## 1. Snapshot — audited 2026-10-12

- **$WICK is live** on Robinhood Chain testnet since 2026-10-05 (launchId 5963),
  lifecycle `CURVE_TRADING`, transfers locked until graduation.
- **Meter: ~0.17% of the 4 ETH cap** — and it went DOWN: ~2.6% on Oct 10 → ~0.17% now
  (net curve selling). Recorded because it matters: graduation is not imminent, and the
  recruitment side of this lane is the actual bottleneck, not code.
- **Lane v0 is code-complete end-to-end** (threshold → price rails → registry →
  verifier → gates → public page + form). Verified green immediately before this
  document was written: 530/530 tests, `tsc` clean, `eslint` clean, live smoke PASS.
- **Zero partner applications and zero approvals so far.** The demand side has not
  started; that is owner-led outreach, not code (see R-1). We state it plainly because
  an empty funnel with working code is the honest current state.
- **The graduated path is proven on someone else's graduation, not ours:** the DEX pool
  reader reads a REAL graduated launch (BEEF) straight from the chain, byte-exact
  against two independent sources. WICK's own graduation is a re-verify ritual, not a
  research project (R-5).

---

## 2. Phase ledger — DONE items

| ID | Item | Status | Evidence |
|---|---|---|---|
| PL-0 | Council ruling: hold-to-list legal, 5 red lines, monetization ladder | DONE | `961bd1f`, council doc §C/§D |
| PL-1 | Threshold design (phase-aware): curve phase = hold 19.6M WICK (platform's own per-wallet max, net of tax); graduated = ≥ 1.25 ETH value at realizable DEX price | DONE | `e5dd19e`; PARTNER-LANE-DESIGN §1–§3; `test/partner-threshold.test.ts` |
| PL-2 | Curve price reader — the platform's own formula, re-validated against the on-chain reserve on every fetch (5% tolerance, fail-closed) | DONE | `e5dd19e`; §2; drift +6e-5 / +1e-5 vs two pinned real states |
| PL-3 | DEX pool price reader (post-graduation): `extsload` on the platform's own PoolManager, storage key `keccak256(poolId ++ slot6)`, price = (2^96/√P)², BigInt-exact | DONE | `3de36d0`; §4b; three-source byte-exact pinning on BEEF; `test/wick-price.test.ts` |
| PL-4 | Dependency-free keccak-256 (WebCrypto SHA-3 is a different function; a wrong keccak breaks tests before it can misprice a pool) | DONE | `3de36d0`; `src/lib/keccak.ts`; `test/keccak.test.ts` |
| PL-5 | Registry (curated allowlist, strict validation, loud-skip) + verifier state machine (verified / grace / delisted / unverified; RPC outage never starts or advances the 7-day grace clock) + listing triple gate (registered ∧ verified ∧ feed-ready) | DONE | `f0d3a3b`; `src/lib/partner-registry.ts`, `src/lib/partner-verifier.ts`; `test/partner-registry.test.ts`, `test/partner-verifier.test.ts` |
| PL-6 | Public application surface: `/partners` (explanation + form), `/api/partners/apply` (sanitize + honeypot + 5/min/IP + GET 405), PII stored but never published | DONE | `9e617aa`; `test/partner-apply-route.test.ts` |
| PL-7 | Feed readiness: launchpad indexer fixed against the platform's REAL log families (P3-1 resolved by live probe + bundle transcription, pinned byte-for-byte on a live trade) | DONE | `4f354a9`; `src/lib/launchpad-indexer.ts` |
| PL-8 | Public aggregate endpoints: `/api/wick/state` (meter, phase-aware price + source labels, 5-min cache, no PII), `/api/partners/pool` (aggregate-only) | DONE | `e5dd19e`, `3de36d0`; `src/app/api/wick/state/route.ts`, `src/app/api/partners/pool/route.ts` |
| PL-9 | Game surface hosting partner play: three modes (CRYPTO / STOCKS / LAUNCHPAD), partner plug point on `/api/launchpad?token=` behind the triple gate | DONE | `f0d3a3b`; `test/modes.test.ts` |
| PL-10 | Continuous verification of gates (continuous `balanceOf` via keyless public RPC, 1h cache; below-threshold → 7-day grace → delist, archives remain) | DONE | `f0d3a3b`; PARTNER-LANE-DESIGN §5 |

---

## 3. NOT STARTED — and why that is the correct state today

This section is the reason this document exists. Each row names the item, why it is
deliberately not built yet, the trigger that starts it, and when it must land. "Not
started" here never means "forgotten": every row is either owner-gated, trigger-gated,
or pinned to the graduation runbook.

| ID | Item | Why not started | Trigger | Deadline / when |
|---|---|---|---|---|
| R-1 | Partner recruitment & outreach (the funnel itself) | Demand generation is owner-led (the reach constraint is documented in `ECOSYSTEM_BAR.md` v3 and the 2026-10-10 cross-check: zero team replies to 110+ posts). The application surface exists and works; no applicant has ever used it. | Owner's first outreach push after the ecosystem review | Immediate — the page is live today; every day without outreach is a day the funnel stays empty. **Owner-only.** |
| R-2 | First-partner onboarding runbook (accept → registry entry → verify → list → announcement) | Deliberately deferred until the first real application exists: we refuse to invent and commit a workflow for a state we have never been in. It is one focused session of work once triggered. | First approved application | **Hard gate:** must land BEFORE the first listing goes live. |
| R-3 | Application persistence upgrade (memory → Mongo for the apply store) | `partner-store.ts` already has a Mongo path; at zero applications, migrating now is unmotivated complexity. | First approved application or sustained inbound volume | With R-2, same session. |
| R-4 | DEX reader hardening (P-DEX-1: cross-check slot-6/extsload against a second on-chain source — StateView / v4Quoter) | The read is already pinned three-source byte-exact on a real graduated pool; hardening adds defense-in-depth, not correctness. | Scheduled inside the graduation runbook window | Before WICK's graduation day (E6.1 T-minus). |
| R-5 | Re-measure DEX sell fee + re-validate slot mapping at WICK's own graduation | The 200 bps figure is MEASURED on BEEF (two real txs), not assumed — but the hook fee is configurable (`updateDynamicLPFee` exists), so it is a standing re-verify, not a constant of nature. Already recorded as a standing note in §4b. | WICK graduation (E6.1 T+0) | Graduation day itself. |
| R-6 | Post-graduation lanes (mirror / spend-burn / tournaments / burn-counter HUD) | STAGED, NOT CODED — council decision E1.5: "lanes fixed now, numbers at graduation." Coding them now would bake unverified economics. | E6.1 T+8 council round | Post-graduation, per runbook. |
| R-7 | Partner cups / cosmetics (monetization ladder L2/L3) | Red line first (LAW 1): the daily slot and the scoreboard are never purchasable; L2/L3 ship only behind their own council sign-off with real numbers. | First partner live + graduation | Post-graduation wave. |
| R-8 | Multi-token partner charts (a partner's own token as a chart source) | v0 lane is $WICK hold-to-list. Expanding chart sources needs per-token feed gating (the feed-ready rule exists) and curation decisions that deserve their own council pass. | After the first partner is live | No design slot exists yet — this row is its pointer. `GUILD-INTEGRATION-PLAN.md` covers guild *spaces*, not multi-token chart feeds (fixed 2026-10-13; the earlier pointer was false). |
| R-9 | Partner-funnel instrumentation (KPIs) | The KPI set (E4.2) predates the lane; funnel metrics with zero applicants measure nothing. | First real application | Within a week of R-1 producing its first applicant. |
| R-10 | Mainnet migration of the lane | The whole product is testnet (LAW 4 disclosure everywhere); mainnet is owner-gated end to end. | Owner decision, `2026-10-10-MAINNET-WATCH-PLAN.md` | Owner-only. |

---

## 4. Claim → evidence map

| Claim | Where it is proven |
|---|---|
| The graduation raise cap is 4 ETH (owner's spoken figure, once doubted, is the on-chain truth) | launch record `targetPairUnits = 4e18`; PARTNER-LANE-DESIGN §1 |
| The curve-phase bar (19.6M WICK) is reachable and whale-proof by construction | platform's own cap checks (`jC()` vs `ni = 20e6·1e18`), transfers locked; §3 |
| The curve price is the platform's own math, not our approximation | formula transcribed from the platform bundle; reserve model re-validated per fetch (drift ≤ 6e-5); §2 |
| The DEX price is the pool's own state read live from the chain | three independent sources byte-exact on BEEF (platform feed, Swap event, extsload word); §4b; `smoke-dex-reader.ts` re-proves it live any day |
| The 200 bps DEX sell fee is measured, not invented | two real POOL_SWAP txs (`0x8a417aad…`, `0x59b5b6b2…`): 128.0 + 71.5 = 199.5 → rounded UP; §4b |
| Fail-closed everywhere: outages degrade to honest refusals, never to fake prices or auto-passes | §4b invariant matrix; §5 grace semantics; `test/wick-price.test.ts`, `test/partner-verifier.test.ts` |
| The scoreboard and daily slot cannot be bought — by anyone, ever | LAW 1 + council §C red lines; enforced structurally (threshold gates LISTING, never score) |
| "Everything green" means green right now, not green once | §0 commands re-runnable at any time; this doc's §1 audit was executed immediately before publication |

---

## 5. Laws & red lines status (unchanged by construction)

- **LAW 1.1** — score/rank never tied to holdings: the lane gates LISTING (a provider
  side cosmetic), never scoring. Pinned by the verifier/threshold test suites.
- **LAW 1.2** — free, walletless base play: partner charts are playable by every player
  for free; the hold gate is on the provider, not the player (council §C).
- **LAW 1.3** — skill-only scoring: untouched; terrain determinism rules apply to
  partner symbols exactly as to crypto/stocks.
- **LAW 4** — honest language + testnet disclosure: every price/label on `/partners`
  and `/api/wick/state` carries its source; testnet stated on the page.
- **LAW 5.1** — no PR ships score/access input changes: the lane's PRs touch listing
  state only; each commit message records the law check.
- **Red lines (council §C):** no purchasable daily slots; no purchasable rank; partner
  charts free for all players; LAW 4 language toward partners; continuous balance
  verification with 7-day grace before delist (archives remain).

---

## 6. Maintenance protocol for this ledger

- Update the audit header (date + commit hash) whenever `origin/main` advances in any
  lane-relevant way, and re-run §0 commands before claiming green.
- New DONE rows must cite: commit, authoritative doc section, and the test file(s)
  that pin the behavior.
- New NOT-STARTED rows must cite: why, trigger, deadline, and whether it is
  owner-gated. Rows without a trigger or an owner are not allowed — vagueness is the
  failure mode this document exists to prevent.
- On WICK graduation: R-4 and R-5 execute, R-6 opens its council round, and §1's
  snapshot line about lifecycle/meter gets rewritten in the same session.

## 7. Change log

- **2026-10-12** — First publication (Task 121). Audit basis `origin/main @ 3de36d0`;
  530/530 tests, tsc + eslint clean, live smoke PASS re-executed at audit time
  (WICK curve ok 0.171% meter · BEEF dex-pool ok, finite positive read).

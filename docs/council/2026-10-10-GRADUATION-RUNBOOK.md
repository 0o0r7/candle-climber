# GRADUATION RUNBOOK — what happens the day the meter fills (E6.1)

> Written 2026-10-10 (ECONOMY-CHECKLIST E6.1). Chat language FA · Doc EN.
> Precedence: `docs/ECONOMY-LAWS.md` supreme · spec: `docs/WICK-ECONOMY-SPEC.md` §8 ·
> gate code: `src/lib/graduation.ts` (fail-closed, W5-pinned) · ops surface: `/ops` (noindex).
> The meter was 2.61% at writing — this runbook is built BEFORE it fills, per the
> checklist's own rule. Nothing below requires inventing numbers: every number is
> either read off the chain/API at runtime or marked OWNER.

## 0. What graduation is (verified facts only)

- $WICK launched via the LEGACY factory (`0xe7942178…`) → per-launch graduation target
  is **4.0 ETH net** (`targetPairUnits`), meter fills only on NET curve buys (spec §1/§2).
- On graduation: `lifecycle` leaves `CURVE_TRADING`, `graduated:true` on the pad API
  (`/api/v1/chains/46630/v6/launches/0xE2cE…216c`), curve reserve + LP migrate to a
  Uniswap v4 pool, and **transfers unlock** (the platform's rails, not ours).
- Post-grad lanes are STAGED, not coded: `POST_GRAD_LANES` in `graduation.ts`
  (mirror / spend-burn / tournaments / burn-counter-HUD) — they flip only after the
  council signs the numbers (E1.5: "lanes fixed now, numbers at graduation").

## 1. The watch loop (starts now, not at graduation)

- `/ops` shows: meter fill %, lifecycle, gate source, freeze state, lane counts,
  ledger aggregates, top refs. One page, aggregate-only, no PII.
- `python3 scripts/verify-econ-state.py --append` (E0.4 ritual) weekly — raw dumps
  land in `docs/evidence/econ-snapshot-latest.json`.
- Trigger to ACT: `lifecycle != CURVE_TRADING` or `graduated:true` on the pad API.

## 2. Graduation sequence (T = the confirmed tx, explorer-verified)

| Step | Actor | Action | Evidence |
|---|---|---|---|
| T+0 | agent | Verify tx on explorer (`graduated` event) — NEVER on one API alone | explorer tx link |
| T+1 | agent | `/ops` → confirm gate reads `graduated=true · source: pad-api` (15-min cache; force by redeploy or wait) | /ops screenshot |
| T+2 | agent | Set `WEIGHTS_FROZEN=1` on Vercel (all targets) + redeploy → lanes answer honest 503s; scores keep flowing | freeze probe below |
| T+3 | agent | Weights snapshot: `GET /api/weights` board (E2.5) → freeze the numbers, compute Merkle root, publish root + salt on `/airdrop` | root tx/commit |
| T+4 | agent | Announce (owner's channels): graduation post + airdrop-window + "weights paused for snapshot, honest, short" | post links |
| T+5 | OWNER | Any wallet action needed (claim page sign-off, treasury decisions) — agent prepares, owner signs | — |
| T+6 | agent | Set `GRADUATED=1` (belt-and-suspenders after the pad read) — post-grad lanes UNLOCK for staging work only; each lane still ships behind its own council sign-off | env diff |
| T+7 | agent | Unfreeze `WEIGHTS_FROZEN` (delete var) AFTER the root is published — delayed events flow again (prediction calls stayed open by design and score then) | /ops todayRuns rises |
| T+8 | agent | Council round for the staged lanes' numbers → build orders per MASTER-CHECKLIST P6.2–P6.5 | council doc |

**Freeze probe (T+2):**
```bash
curl -s -X POST https://candle-climber.vercel.app/api/practice \
  -H 'content-type: application/json' -d '{"runToken":"x"}' -o /dev/null -w "%{http_code}\n"
# 403 = integrity gate still first (correct) · frozen check runs AFTER token verify
```
Full freeze proof: a VALID archive token returns **503 + `frozen:true`**; a leaderboard
POST still returns `ok:true` + `weightsFrozen:true` (score saved, ledger skipped).

## 3. Freeze etiquette — why this design (pinned by tests)

- **Play is never blocked** (LAW 1.2 substance): guest/official boards keep scoring;
  only weight EVENTS pause. `test/e5-e6.test.ts` pins: practice/prediction/vault →
  503 `frozen:true` with honest copy; leaderboard → score saved + ledger untouched.
- **No points are silently lost**: prediction calls that come due during the freeze
  stay OPEN (idempotent lazy scorer) and score after the unfreeze — `scoreDue`
  returns 0 while frozen. Streak integrity: a frozen day does NOT add a run row, so
  the streak math stays a pure function of the (paused) event log — the runbook
  accepts this honestly: a snapshot-day run banks no streak point; announced in T+4.
- **Fail-closed everywhere**: `graduationState()` defaults to PRE-GRAD on any API
  failure — an outage can never unlock spend/burn lanes.

## 4. Merkle delivery (E2.5 rehearsal → real at T+3)

1. Freeze (T+2). 2. `getWeights().snapshot(600)` → per-wallet capped totals
(anomaly-flagged wallets EXCLUDED, per spec §7.3). 3. Build the tree with
`src/lib/merkle.ts`, publish `root` + salt on `/airdrop` (the rehearsal page already
verifies proofs client-side). 4. Claim UX lands with the post-grad wave (P6.x) —
testnet first, always labeled testnet (LAW 4).

## 5. Comms copy skeleton (owner-editable, honest language only)

- "The meter filled. $WICK graduates today." — facts: tx link, 4 ETH target hit.
- "Airdrop snapshot in progress: weights are paused for a few hours while we take a
  fair, frozen snapshot. Your runs keep scoring. Nothing is lost, nothing is invented."
- "Post-grad roadmap stays the same: skill-only board (LAW 1), free play forever
  (LAW 1.2), burn rails already counting (5% of every trade)."

## 6. Owner decision points at T (nothing here is agent-legal)

- Sign-off on the snapshot root before it is announced (O-S continuation).
- Any treasury/prize decision (P6.4) — owner only.
- Any mainnet watch escalation (E6.3 plan) — owner only.

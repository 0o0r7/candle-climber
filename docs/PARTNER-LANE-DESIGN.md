# PARTNER LANE — DESIGN (threshold, price, verification)

Status: IMPLEMENTED on main · 2026-10-12 · owner-delegated (119a) with the
2026-10-12 correction applied: **$WICK is LIVE since 2026-10-05** (launchId
5963) — the launch record was already pinned at
`docs/evidence/wick-launch-record.json`, and every figure below is grounded in
it, in the platform's public config API, or in the platform's own frontend
bundle (transcribed, then validated against live chain state).

Companion code: `src/lib/partner-threshold.ts` (rules),
`src/lib/wick-price.ts` (price readers: curve + DEX pool),
`src/lib/keccak.ts` (dependency-free keccak-256 for the storage key),
`src/lib/partner-verifier.ts` (state machine), `src/app/api/wick/state`
(public aggregate), `/partners` page.

---

## 1. The cap — verified, and the owner was right

| Figure | Value | Source |
|---|---|---|
| WICK graduation raise cap | **4 ETH** | launch record `targetPairUnits = 4e18` |
| Protocol-default net target | 5 ETH | config API `netGraduationTargetWei` (recorded; sizing basis) |
| Curve allocation | 793.1M WICK | config `curveAllocationBaseUnits` (bundle `Ur`) |
| Curve fee | 125 bps | config `curveFeeBps` (bundle `Kn`) |
| WICK launch buy tax | 200 bps | launch record `taxBps` |
| Per-wallet curve buy cap | **20M WICK** (single AND cumulative) | bundle `jC()` vs `ni = 20e6·1e18`; config `curveWalletCapBps = 200` |
| Transfers | **locked until graduation** | launch record `curve.transfersUnlocked = false` |

The v0 design treated the owner's spoken "4 ETH cap" as a discrepancy against
the 5 ETH config figure. The launch record proves 4 ETH is WICK's own cap.
Both stay recorded; the cohort math below covers 4 ETH with margin.

## 2. The real curve price — the platform's own formula, validated

The formula was transcribed EXACTLY from the platform's own frontend bundle
(`domain-shared` chunk, function `curveCapFraction` — same methodology as the
P3-1 ABI fix): the UI computes

```
priceEthPerToken(s) = 80 · target · he / (16·he − 15·s)²
reserve(s)          = 5 · target · s  / (16·he − 15·s)        [the model form]
he = 1e27 raw (1B supply × 1e18), s = tokensSoldGrossUnits (raw),
target = targetPairUnits (4e18 for WICK)
```

**Validation against two pinned real states** (the model must reproduce the
on-chain `pairReserveUnits` from `tokensSoldGrossUnits` alone):

| State | sold | reserve (on-chain) | model | drift |
|---|---|---|---|---|
| Launch record (block 129495061, 2026-10-05) | 73,923,489.19 | 0.099285146942 ETH | 0.0992849 | **+6e-5** |
| Live pull (2026-10-12, block ~133.5M) | 5,458,512.48 | 0.006858236638 ETH | 0.0068581 | **+1e-5** |

Residuals are dust-level (fee leakage direction). The reader re-checks this
invariant on EVERY fetch (tolerance 5%) and fails closed on deviation — a
wrong token, a structurally different curve, or post-graduation drift can
never masquerade as a price.

Live figures at the time of writing: price ≈ **1.26 gwei/WICK** (display),
meter ≈ **0.17%** of the 4 ETH cap, lifecycle CURVE_TRADING.

Cross-check: the platform's own `v6/pair-prices` endpoint serves
`priceEthWad` in the same 1e18-fixed-point format for 60 tracked pairs
(WICK's curve is not in that tracked set — the per-launch feed + formula is
the source instead). The `he = 1e27` / `gn = 1e18` scale was confirmed
independently by solving the reserve model for `he` at BOTH states
(1.00002e27 and 1.00006e27).

## 3. Why the v0 threshold was rebuilt (the unreachable-bar finding)

Grounding the price exposed a hard geometric fact:

- 1.25 ETH of value at 1.26 gwei ≈ **989.8M WICK per wallet**.
- The platform caps every wallet at **20M WICK bought from the curve**
  (single AND cumulative — `exceedsSingleBuyCap` / `exceedsCumulativeCap`),
  and transfers are locked until graduation, so holdings cannot be
  aggregated across wallets.
- Max pre-graduation holding = 20M gross × (1 − 2% tax) = **19.6M net ≈
  0.025 ETH today**, ≈ 0.4 ETH even at the very top of the curve.

A 1.25 ETH value rule was therefore **provably unreachable** in the curve
phase — a bar nobody can clear is not a bar, it is a wall (and the value
check's 1e6 price fixed-point would also have zeroed at real curve prices).
Rebuilt as a phase-aware rule:

| Phase | Rule | Why it is reachable + abuse-proof |
|---|---|---|
| **CURVE_TRADING (now)** | hold ≥ **19,600,000 WICK** = net proceeds of a full-cap purchase (`CURVE_PHASE_MIN_UNITS = 20M × 0.98`) | It IS the platform's own maximum commitment per wallet — reachable by construction, whale-proof by construction (the platform enforces the cap), transfers locked so it cannot be faked by aggregation |
| **GRADUATED (later)** | hold ≥ **1.25 ETH value** at realizable DEX price | Transfers unlock and DEX pricing begins; value-denomination keeps the economic weight constant and dump-proof |
| unreadable | fail-closed (not listed; grace clock untouched) | infra outages never punish or auto-pass |

Cohort math (honest version): ~**39.6** maxed partner wallets complete the
793.1M-token curve; every partner buy-in (and every community member's buy)
counts directly toward the 4 ETH raise. Post-graduation, 4 partners ×
1.25 ETH = 5 ETH ≥ 4 ETH covers the cap with +25% margin.

## 4. Price mechanics (wick-price.ts)

- Source: the SAME keyless public launch feed `meter.ts` already trusts
  (`v6/launches/<tokenAddress>`), 1h cache (council cadence).
- Priority: `WICK_ETH_PRICE` env override (owner-verified static figure) →
  live read. Feed down + no env → fail-closed.
- `realizablePriceEth = display × (1 − 325/10000)` in the curve phase —
  125 bps curve fee + 200 bps launch tax worst-case, the fail-closed
  direction for any value use.
- Post-graduation the curve formula stops describing reality → the DEX pool
  reader takes over (§4b).

## 4b. Post-graduation price mechanics — the DEX pool reader (LIVE)

Owner directive 2026-10-12: «قدم بعدی بدون توقف: خوانندۀ قیمت DEX برای بعد از
فارغ‌التحصیلی». Implemented on main the same day, against a REAL graduated
launch (BEEF) as the evidence vehicle — WICK itself is still in
CURVE_TRADING, so the graduated path is proven on the platform's own
graduated state and pinned for WICK's future graduation.

**The pool.** On graduation the launch's liquidity moves into a
Uniswap-v4-style pool: config API `/chains/46630/config` → `deployments`
names the platform's own `poolManager` (explorer-verified source),
`feeHook`, `graduationAdapter`, `liquidityLocker`, `v4Quoter`. The launch
record's `graduation` object binds THIS token to ITS pool: `poolId`,
`pairUnits`, `tokenUnits`, `poolLiquidity`, `poolInitialSqrtPriceX96`.

**The read.** `eth_call extsload(bytes32)` on the PoolManager at storage key
`keccak256(poolId ++ uint256(6))` returns the packed v4 Slot0 word
(sqrtPriceX96 uint160 | tick int24 | protocolFee uint24 | lpFee uint24).
Price = **(2^96 / sqrtPriceX96)²** ETH per token (18/18, BigInt-exact; the
encoding direction/scale is validated per read — see invariants).

**Why slot 6.** v4-core does not document mapping slot indices and the
explorer's verified source set omits `PoolManagerStorage`, so the slot was
discovered EMPIRICALLY: keys for slots 0–5 returned zero, slot 6 returned
the byte-exact live word. That agreement with two OTHER independent sources
pins it far stronger than reading the source would:

| Check | Result |
|---|---|
| `poolInitialSqrtPriceX96` → price vs launch record's own `pairUnits/tokenUnits` | **exact** (2e-8 = 4 ETH / 200M) |
| `poolLiquidity²` vs `pairUnits · tokenUnits` | **exact** (≤1e-9 rel) |
| on-chain `extsload` word vs platform list-feed `market.poolSqrtPriceX96` | **byte-exact** |
| on-chain word vs the V4 `Swap` event log (explorer tx `0x59b5b6b2…`) | **byte-exact**, tick 206655 = event tick |
| `protocolFee` / `lpFee` fields | 0 / 0 — the feeHook charges via its own transfers, not pool fees |

**The fee (measured, not invented).** Two real sells on the graduated BEEF
pool (explorer txs `0x8a417aad…` and `0x59b5b6b2…`, cross-read from the
platform's own `POOL_SWAP` feeEvents): token leg **128.0 bps** + ETH leg
**71.5 bps** = 199.5 combined → `DEX_SELL_FEE_BPS = 200` (rounded UP —
fail-closed direction). `realizablePriceEth = display × 0.98`. The hook's
fee is configurable (`updateDynamicLPFee` exists) → re-verify at WICK's own
graduation (recorded as a standing note).

**Invariants (mirroring the curve reader's reserve-model check).** Every
read re-validates the graduation math before trusting the pool, and again
after the RPC read:
1. launch record carries a complete pool binding (`poolId`, both units,
   liquidity, initial sqrt) — else `graduated-state-incomplete`;
2. initial-price + liquidity identities hold (0.1% / 1e-9 rel) — else
   `graduated-state-inconsistent` (no RPC call is even made);
3. on-chain word must decode to a positive sqrtPriceX96 — else
   `dex-state-inconsistent`; RPC failure → `dex-rpc-unavailable`;
4. an unknown future lifecycle → `unsupported lifecycle` (never guess);
5. in EVERY failure the `WICK_ETH_PRICE` env override still carries the
   owner-verified figure (honest `error` note preserved).

**Keccak.** The storage key needs keccak256; the repo has no keccak
dependency and WebCrypto's SHA-3 is a DIFFERENT function. `src/lib/keccak.ts`
is a small dependency-free implementation pinned by standard vectors, a
multi-block vector, and the END-TO-END BEEF storage key (the key that
returned the byte-exact word on-chain) — a wrong keccak breaks tests before
it can misprice a pool.

**Verifier impact: zero code change.** The verifier consumes
`WickPriceRead`; a `dex-pool` read arrives `ok ∧ ¬curvePhase` with a
realizable price, so the graduated VALUE rule (≥ 1.25 ETH) engages
automatically. The graduation meter reads 100% post-grad.

## 5. Verification mechanics (unchanged from council ruling)

`balanceOf` via public RPC, 1h cache; definitive below-threshold → 7-day
grace → delist (archives remain); RPC/feed outages land in `unverified` and
never start or advance the grace clock; restarts re-verify from scratch
(a restart can only shorten, never extend, grace). Registry = curated
allowlist (`PARTNER_REGISTRY_JSON`), first-wins dedup, loud-skip on bad
entries. Listing requires verified ∧ feed-ready (real trade count via the
P3-1-corrected indexer).

## 6. Anti-abuse inventory

1. Whale-proof: the threshold equals the platform's own per-wallet maximum —
   no partner can out-size the design.
2. Dump-proof: continuous on-chain re-verification + grace + delist; selling
   the position forfeits the listing for future terrain.
3. Fake-proof: transfers locked until graduation → holdings cannot be
   borrowed/aggregated; the wallet IS the commitment.
4. Value-proof (post-grad): value rule at realizable prices; fixed-point
   math CEILs the requirement (never understates).
5. Curator gate: threshold is necessary, never sufficient — every listing is
   manually approved; the daily slot and scoreboard remain unbuyable (LAW 1).
6. Honest pricing: the price shown is the platform's own formula; value uses
   the realizable (post-fee) figure; every read is invariant-checked against
   the on-chain reserve.

## 7. Evidence chain

- `docs/evidence/wick-launch-record.json` — launch record (pinned at launch)
- `docs/evidence/econ-snapshot-latest.json` — E0.4 snapshot ritual
- `test/fixtures/wick-launch-live-20261012.json` — live curve state pinned for
  the formula tests (sold/reserve/price expectations)
- `test/fixtures/vibe-graduated-beef-20261012.json` — the DEX reader's
  evidence: a real GRADUATED launch (BEEF), the three-source byte-exact
  slot0 word, the storage key, and the two fee-measuring tx hashes
- Platform bundle transcription: `curveCapFraction`, `Gl/Qn/yR`, `jC` cap
  checks, constants `Kn=125, zC=1e27, Ur=793.1e24, ni=20e6·1e18`
- Config API: `/api/v1/chains/46630/config` (netGraduationTargetWei,
  curveFeeBps, curveWalletCapBps, transfersLockedUntilGraduation,
  `deployments.poolManager` / `feeHook` / `graduationAdapter` / `v4Quoter`)
- Explorer: PoolManager verified source (v4-core: PoolManager, Exttload,
  Slot0 packing), tx logs `0x59b5b6b2…` / `0x8a417aad…` (Swap event + fee
  transfers) — the fee-rate and byte-exactness evidence

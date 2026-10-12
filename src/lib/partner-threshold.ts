// Partner-Chart threshold math (provider-side lane, council 2026-10-12).
//
// WHAT THIS LANE IS
// A project / community / guild may get their token's chart added to the
// always-available PARTNER pool by holding a minimum of $WICK in the wallet
// they register. The gate is PROVIDER-side: once listed, the chart is
// playable by EVERYONE free — no wallet, no holding, no score change.
// Red lines (council verdict, non-negotiable):
//   · the daily main chart slot is never purchasable
//   · the scoreboard is never purchasable (LAW 1.1/1.3 untouched)
//   · play on a partner chart stays free for every player (LAW 1.2 substance)
//
// ─── THE CAP, VERIFIED (2026-10-12 correction — the owner was right) ────────
// WICK's own launch record (docs/evidence/wick-launch-record.json, launchId
// 5963) sets targetPairUnits = 4e18 — the graduation raise cap is 4 ETH for
// THIS launch. The protocol-level config default (netGraduationTargetWei =
// 5e18, TOKEN-LAUNCHPAD-RESEARCH.md §4) remains recorded as the sizing basis
// below; 4 × 1.25 = 5 ETH ≥ 4 ETH covers WICK's cap with +25% margin.
//
// ─── PHASE-AWARE RULE (curve-price discovery 2026-10-12) ────────────────────
// Deriving the REAL curve price (wick-price.ts, the platform's own formula,
// validated to ≤6e-5 against two pinned chain states) exposed a hard fact:
//   · 1 WICK ≈ 1.26 gwei at the live curve state
//   · a 1.25 ETH value threshold would need ≈ 989.8M WICK per wallet
//   · the platform caps EVERY wallet at 20M WICK bought from the curve
//     (bundle jC(): exceedsSingleBuyCap/exceedsCumulativeCap vs ni =
//     20000000n·pn, i.e. curveWalletCapBps=200 of the 1B supply), and
//     transfers are LOCKED until graduation (launch record:
//     curve.transfersUnlocked = false)
//   · therefore the max ANY wallet can hold pre-graduation is 20M gross =
//     19.6M net (the launch's 200 bps tax on buys) ≈ 0.025 ETH today,
//     ≈ 0.4 ETH even at the very top of the curve.
// A 1.25 ETH value rule was thus PROVABLY UNREACHABLE in the curve phase —
// fixed by splitting the rule by phase:
//   · CURVE TRADING (now): hold the platform's own maximum commitment —
//     CURVE_PHASE_MIN_UNITS = cap × (1 − tax) = 19.6M WICK. Reachable by
//     construction (it IS the cap's net proceeds), whale-proof by
//     construction (the platform enforces the cap), and every partner's
//     buy-in is real demand that counts toward the 4 ETH raise (~39.6 maxed
//     wallets complete the 793.1M curve allocation).
//   · GRADUATED (later): transfers unlock and DEX pricing begins — the value
//     rule MIN_PARTNER_HOLD_ETH applies at realizable DEX prices, keeping the
//     economic weight constant and dump-proof.
// Both rules are fail-closed on unreadable state (verifier).
//
// WHY VALUE-DENOMINATED POST-GRAD (not token count)
//   · auto-scales across price transitions
//   · cannot be gamed by buying when the token is cheap
//   · keeps the economic weight constant for every partner, whenever they join
//
// LAW 4 note: 4 ETH (launch record) and 5 ETH (config default) are VERIFIED
// platform figures; the 1.25 split is derived arithmetic, not an invented
// market number. The 20M/19.6M figures are the platform's own cap constants.
// Everything is parameterized so a differently-configured launch changes only
// the constants.

/** Verified platform figure — protocol-default net graduation target
 *  (TOKEN-LAUNCHPAD-RESEARCH.md §4, live config pull). WICK's own launch cap
 *  is 4 ETH (launch record targetPairUnits) — see header: the cohort sized on
 *  this constant covers that cap with margin. */
export const GRADUATION_TARGET_ETH = 5;

/** Design constant: partner cohort size expected to cover the full raise. */
export const PARTNERS_TO_COVER_CAP = 4;

/** Minimum holding VALUE per partner post-graduation, in ETH. 5/4 = 1.25. */
export const MIN_PARTNER_HOLD_ETH = GRADUATION_TARGET_ETH / PARTNERS_TO_COVER_CAP;

/** Days a partner may sit below threshold before delisting from FUTURE terrain. */
export const GRACE_DAYS = 7;

/** Curve-phase per-wallet buy cap in bps of total supply — the platform's own
 *  constant (bundle ni = 20M tokens = 200 bps of 1e27 raw). */
export const CURVE_WALLET_CAP_BPS = 200;

/** WICK launch buy-side tax in bps (launch record: taxBps = 200 — the buyer
 *  receives net = gross × (1 − 200/1e4); verified in the pinned feeEvent). */
export const LAUNCH_TAX_BPS = 200;

/** Total supply in raw 18-dec units (1B tokens) — bundle constant zC. */
export const SUPPLY_RAW = 10n ** 27n;

/** Curve-phase minimum holding: the NET proceeds of a full-cap curve purchase.
 *  cap(20M gross) × (1 − tax 2%) = 19.6M tokens = 1.96e25 raw units.
 *  A wallet cannot exceed this pre-graduation (cap enforced by the platform,
 *  transfers locked), so this threshold is reachable-by-construction and
 *  whale-proof-by-construction. */
export const CURVE_PHASE_MIN_UNITS =
  (SUPPLY_RAW * BigInt(CURVE_WALLET_CAP_BPS) / 10_000n)
  * (10_000n - BigInt(LAUNCH_TAX_BPS)) / 10_000n;

/** Curve-phase rule: does the wallet hold the full-cap net position? */
export function meetsThresholdCurvePhase(balanceUnits: bigint): boolean {
  return balanceUnits >= CURVE_PHASE_MIN_UNITS;
}

/** Price fixed-point: ETH-per-token scaled by 1e18 (= wei per token), or 0n
 *  when the price is unusable. The v0 1e6 scale silently zeroed REAL curve
 *  prices (~1.26e-9 ETH/token → round(price×1e6) = 0n → universal fail) —
 *  discovered with the live curve-price reader 2026-10-12. round() then CEIL
 *  in the division: the fixed-point price may wobble ±1 ulp; the CEIL keeps
 *  the required units on the conservative side. */
function scaledPrice(ethPerWick: number): bigint {
  if (!Number.isFinite(ethPerWick) || ethPerWick <= 0) return 0n;
  const p = BigInt(Math.round(ethPerWick * 1e18));
  return p > 0n ? p : 0n;
}

/** Threshold value in fixed point: MIN_PARTNER_HOLD_ETH expressed as wei
 *  (× 1e18) × 1e18 (the price scale) = 1.25e36 for the default constants. */
function thresholdFixed(): bigint {
  return BigInt(Math.round(MIN_PARTNER_HOLD_ETH * 1e6)) * 10n ** 30n;
}

/** Minimum holding expressed in 18-dec token units for a given WICK price
 *  (ETH per WICK). Price source: the wick-price curve reader (curve phase)
 *  or the DEX price after graduation — both ETH-denominated on this chain.
 *  Returns 0n when the price is unusable (caller treats 0 as fail-closed).
 *  Division CEILs: never understate the requirement. */
export function minPartnerHoldUnits(ethPerWick: number): bigint {
  const p = scaledPrice(ethPerWick);
  if (p === 0n) return 0n;
  const q = thresholdFixed() / p;
  return q * p < thresholdFixed() ? q + 1n : q;
}

/** Does a wallet of `balanceUnits` (18-dec WICK units) meet the threshold at
 *  `ethPerWick`? Pure and deterministic — the verifier caches price + balance
 *  (1h) and re-checks daily; this function stays side-effect free.
 *  Unknown/unusable price → false (fail-closed: never auto-pass). */
export function meetsThreshold(balanceUnits: bigint, ethPerWick: number): boolean {
  if (balanceUnits <= 0n) return false;
  const p = scaledPrice(ethPerWick);
  if (p === 0n) return false;
  return balanceUnits * p >= thresholdFixed();
}

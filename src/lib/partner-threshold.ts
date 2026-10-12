// Partner-Chart threshold math (provider-side lane, council 2026-10-12).
//
// WHAT THIS LANE IS
// A project / community / guild may get their token's chart added to the
// always-available PARTNER pool by holding a minimum VALUE of $WICK in the
// wallet they register. The gate is PROVIDER-side: once listed, the chart is
// playable by EVERYONE free — no wallet, no holding, no score change.
// Red lines (council verdict, non-negotiable):
//   · the daily main chart slot is never purchasable
//   · the scoreboard is never purchasable (LAW 1.1/1.3 untouched)
//   · play on a partner chart stays free for every player (LAW 1.2 substance)
//
// WHY VALUE-DENOMINATED (not token count)
// The platform curve config (verified live 2026-10, TOKEN-LAUNCHPAD-RESEARCH.md
// §4: netGraduationTargetWei = 5e18 for ETH-pair launches) sets the graduation
// raise target G = 5 ETH. A threshold expressed in ETH-VALUE:
//   · auto-scales across curve → DEX price transitions
//   · cannot be gamed by buying when the token is cheap
//   · keeps the economic weight constant for every partner, whenever they join
//
// WHY THIS SIZE
//   MIN_PARTNER_HOLD_ETH = G / PARTNERS_TO_COVER_CAP = 5 ETH / 4 = 1.25 ETH
// Four partner cohort entries ≈ the entire graduation raise; the fifth partner
// (plus every other buyer) pushes the curve PAST the cap with margin. Buying
// from the curve counts directly toward the raise, so partner entry demand IS
// graduation fuel — the owner's "easily surpass the cap" property, by design.
// Abuse guards that make the attainable bar safe: curve phase caps any wallet
// at 2% of supply (curveWalletCapBps=200 — whale-proof by construction),
// listing is curator-approved (threshold is necessary, never sufficient),
// holding is re-verified continuously with a grace period before any delist.
//
// LAW 4 note: 5 ETH is a VERIFIED figure from the platform's own config API;
// the 1.25 split is derived arithmetic, not an invented market number. The
// owner's spoken "4 ETH cap" (2026-10-12) is recorded as a discrepancy — the
// constants below are parameterized so a differently-configured launch only
// changes GRADUATION_TARGET_ETH.

/** Verified platform figure — TOKEN-LAUNCHPAD-RESEARCH.md §4 (live config pull). */
export const GRADUATION_TARGET_ETH = 5;

/** Design constant: partner cohort size expected to cover the full raise. */
export const PARTNERS_TO_COVER_CAP = 4;

/** Minimum holding VALUE per partner, in ETH. 5/4 = 1.25. */
export const MIN_PARTNER_HOLD_ETH = GRADUATION_TARGET_ETH / PARTNERS_TO_COVER_CAP;

/** Days a partner may sit below threshold before delisting from FUTURE terrain. */
export const GRACE_DAYS = 7;

/** Price scaled by 1e6 (BigInt-safe), or 0n when the price is unusable.
 *  round (not ceil): 0.001*1e6 evaluates to 1000.0000000000001 in floats and
 *  would silently inflate every threshold by ~0.1% under ceil. Sub-1e-6 ETH
 *  prices resolve to 0n → fail-closed by design. */
function scaledPrice(ethPerWick: number): bigint {
  if (!Number.isFinite(ethPerWick) || ethPerWick <= 0) return 0n;
  const p = BigInt(Math.round(ethPerWick * 1e6));
  return p > 0n ? p : 0n;
}

/** Threshold value in fixed point: MIN_PARTNER_HOLD_ETH × 1e18 (ETH-wei)
 *  × 1e6 (the price scale) = 1.25e24 for the default constants. */
function thresholdFixed(): bigint {
  return BigInt(Math.round(MIN_PARTNER_HOLD_ETH * 1e6)) * 10n ** 18n;
}

/** Minimum holding expressed in 18-dec token units for a given WICK price
 *  (ETH per WICK). Price source: the curve/pad-reported price at curve phase,
 *  DEX price after graduation — both ETH-denominated on this chain.
 *  Returns 0n when the price is unusable (caller treats 0 as fail-closed). */
export function minPartnerHoldUnits(ethPerWick: number): bigint {
  const p = scaledPrice(ethPerWick);
  if (p === 0n) return 0n;
  return thresholdFixed() / p;
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

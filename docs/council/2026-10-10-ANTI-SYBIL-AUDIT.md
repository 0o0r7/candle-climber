# ANTI-SYBIL AUDIT — residual risks & review triggers (E3.3)

> Written 2026-10-10 (ECONOMY-CHECKLIST E3.3). Scope: every surface where a
> rational attacker could farm score, ranks, weights, or the future snapshot.
> Layers already shipped are stated WITH their limits — this document exists to
> name what they do NOT stop, and when a human must look.

## 1. Defense layers (shipped)

| Layer | Stops | Where pinned |
|---|---|---|
| W1 HMAC run-tokens | Forged submissions; client-claimed symbol/date/interval | `run-token.ts`, timingSafeEqual; `test/run-token.test.ts` |
| Terrain-physical caps | Impossible candle counts / scores | `board-validation.ts` (MAX_SCORE_PER_CANDLE math), `test/leaderboard-contract.test.ts` |
| Score↔candles consistency | Score larger than the run can produce | same |
| Per-IP rate limits | Casual flooding (20/min leaderboard, 10/min prediction) | route-level in-memory (per instance) |
| Official-lane proof | Wallet impersonation on the OFFICIAL board | EIP-191 `personal_sign` over the clamped run fields + 10-min freshness; forged/stale/missing ⇒ guest + honest note; `test/wallet-proof.test.ts` (independent envelope) + `test/official-proof-route.test.ts` |
| Best-run-per-wallet dedupe | Official-board flooding by one wallet | `leaderboard-store` official lane (replace-if-better) |
| Weights caps | Weights farming velocity | streak min(N,10)/day · practice 0.5 capped 2/day · prediction ≤10/day · vault 1/day; per-wallet snapshot cap 600 |
| Identity↔wallet anomaly limit | Many identities on one wallet | `snapshotFromRows` flags (>2 identities/wallet = reviewed, excluded pre-review) |
| Language red lines | Overpromising in copy (its own sybil vector: attracting wrong users) | LAW 4 + E3.2 sweep |

## 2. Residual risks — documented, not hidden

1. **Guest-lane name sybil.** Typed names are free; one device can post many guest
   scores per day (rate-limit only caps velocity). Impact: guest board noise.
   NOT a weights vector: weights accrue per-identity per-UTC-date with server caps,
   and the SNAPSHOT is per-WALLET — unlinked identities never reach the snapshot
   (spec §7.3). Accepted for launch; guest board is labeled unofficial by design.
2. **Weight-lane wallet links are client-claimed.** `/api/practice`, `/api/prediction`,
   `/api/vault` accept `address` without the ownership proof (the official lane's
   proof covers only the leaderboard POST). Impact: someone could LINK a wallet they
   do not own to inflate that wallet's snapshot? No — inflation requires making the
   WALLET's identities EARN points, which still costs real play per identity, and
   the per-wallet 600 cap + anomaly review bound the damage. Upgrading these three
   lanes to require (optional) proof is a RECORDED OPTION, not a hole; the honest
   label everywhere is "linked wallet", not "verified wallet".
3. **Multi-device play.** One human with 5 devices = 5 identities. Bounded by the
   per-wallet snapshot cap; flags catch the degenerate case (>2 identities/wallet).
4. **Freeze-window arbitrage.** During `WEIGHTS_FROZEN`, no weight events land —
   there is nothing to arbitrage; delayed prediction scoring is idempotent.
5. **Ref-stamp gaming (E5.5).** `ref` is opaque metadata — it cannot change score,
   lane, or weights; a self-referrer only mislabels their own traffic. The /ops
   rollup is evidence for G5, not a reward input. Cap: 24 chars, safe alphabet.
6. **Platform-side risk (outside our code):** self-trading on the curve for the
   traders track. We do not do it and do not advise it (E0.5 memo + GROWTH doc);
   detection is the platform's anti-abuse review — the final backstop per spec §7.3.

## 3. Review triggers (a human looks when…)

- Any snapshot wallet exceeds the 600 cap logic path (should be mathematically
  impossible — investigate immediately if seen).
- Any wallet with >2 linked identities at snapshot time (anomaly flag fires).
- Sentry P2 alerts spike on `lane:weights` or `lane:leaderboard` tags (E4.4) —
  a write-failure burst can mask as sybil or hide one.
- /ops `topRefs` shows a single ref dominating (>50% of 7d submissions) — check
  whether it is a genuine community referral or a label game.
- Board rows with near-identical scores/candles across many names on one date.

## 4. Standing rule

No new economy surface ships without: (a) its cap, (b) its fail-open-but-honest
degrade path, (c) a test pin, (d) one paragraph here if it opens a new residual
risk. That is LAW 5.1 in practice.

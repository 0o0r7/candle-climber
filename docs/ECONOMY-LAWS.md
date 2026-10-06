# ECONOMY LAWS — CANDLE CLIMBER ($WICK)

> Status: **LAW** — adopted 2026-10-06 (merge-back wave 1 from
> `docs/VARIANT-REVIEW-2026-10-05.md`, item "rank ≠ recognition").
> This document wires **no code**. It is the policy every present and future
> economy-touching change must satisfy — including the planned P4.2 Balance
> Gate, P4.4 airdrop weights, and anything after graduation (§4 of
> `docs/GROWTH-AND-HOOKS-STRATEGY.md`).
> Where an earlier doc conflicts with these laws, **these laws win**.

## Why this law exists

The independent review of the Candle Current variant (and the KB founder
intel it cross-validated) landed on one strategic takeaway: a market-native
game only stays credible if the scoreboard is unbuyable. The moment holding
(or spending) the token changes who ranks where, the leaderboard stops being
a skill record and the game stops being a game. So the separation between
**recognition** (what the leaderboard says) and **recognition-adjacent value**
(what holding is worth) is written down as law, not left as taste.

## LAW 1 — RANK ≠ RECOGNITION (holder utility never touches the scoreboard)

1.1 **Holder utility never changes ranked score.** No balance tier, stake,
burn, lockup, NFT, or wallet state may alter a run's score, multiplier,
candlesPassed, bestStreak, rank, or any submission accepted by
`/api/leaderboard`. The score math stays exactly what W5 anti-cheat verifies.

1.2 **Holder utility never changes base access.** The base game is free,
forever, walletless: today's daily level, the retry loop, score submission,
the leaderboard, duels, and archive browsing never require holding $WICK or
connecting a wallet.

1.3 **The scoreboard is skill-only.** Two identical climbs produce identical
scores and identical ranks, regardless of either climber's wallet. If a
feature would make the same climb score differently based on holdings, that
feature is a red-line bug, not a design choice.

## LAW 2 — HOLDER VALUE = COSMETICS · ROUTES · ARCHIVE (the only lawful utilities)

Holder-gated value may exist **only** in these three lanes:

2.1 **Cosmetics** — climber skins, trails, death-card frames, ghost styling,
emotes. Pure render-layer: no physics, no scoring, no information advantage.

2.2 **Routes** — route-planning affordances around the SAME public terrain
(e.g. line-drawing / saved-path previews per H5 ROUTE PREDICTION). A route
tool must never inject, reveal, or imply terrain data another player cannot
see — everyone already sees the same chart.

2.3 **Archive** — extended historical-terrain access and archive conveniences
(deeper history, practice marathons per H1). Archive terrain is practice-only
and unscored by existing rule; selling access to practice is lawful, selling
rank is not.

2.4 Anything a holder receives must be **additive and score-blind**: the game
must remain fully playable, fully rankable, and fully competitive without it.
Gated modes beyond base access (e.g. "Summit tier" runs) may exist only if
they are cosmetic/practice surfaces — **a holder run is never ranked onto the
public leaderboard with any advantage a non-holder cannot earn by skill.**

## LAW 3 — SUPREMACY AND EXISTING DESIGNS

3.1 This law governs all future economy work. Concretely: the Balance Gate
sketch in `docs/GROWTH-AND-HOOKS-STRATEGY.md` §3 (tier-gated "higher score
multiplier, better loot weights") is **void in the parts that touch score or
loot advantage** — tiers may gate only the LAW 2 lanes.

3.2 Airdrop weights (P4.4) reward **participation** (daily streaks, route
predictions, archive marathons). Weights are entitlements to future
distributions, never rank, and never a scoreboard input. Language stays
"builds airdrop weights" — never "earn(s)", never "guaranteed" (pack §8).

3.3 Post-graduation spend/burn mechanics (§4 of the strategy doc) are lawful
only inside the LAW 2 lanes plus entry to events; a burned token may never
convert into ranked score, ranked access, or score-affecting state.

## LAW 4 — LANGUAGE AND HONESTY RED LINES (WICK-LAUNCH-FORM-PACK §8)

Every economy-facing sentence inherits the pack's red lines:

- Never promise rewards or profit — "weights", not "earn / guaranteed".
- Testnet status is stated plainly, never hidden, never apologised for.
- No gambling tone — before TGE every "stake" is points/weights, nothing else.
- No invented numbers — only figures verified in this repo's evidence trail.

## LAW 5 — ENFORCEMENT

5.1 Review gate: any PR/commit touching scoring, the leaderboard, wallets, or
cosmetics must state in its description which laws apply and how it complies.

5.2 Audit hook: the periodic code audits (the LOOPBACK/variant-review
protocol) now include an economy-laws check — any coupling of balance state
to score or base access is filed as a P0 defect.

5.3 Precedence: pack §8 red lines and these laws are jointly supreme over
older design prose. Neither may be amended casually; changes require a dated
note in this file explaining what changed and why.

---
*Adopted: 2026-10-06 · Source: VARIANT-REVIEW-2026-10-05 merge-back wave 1 ·
Related: `docs/GROWTH-AND-HOOKS-STRATEGY.md`, `docs/WICK-LAUNCH-FORM-PACK.md` §8,
`docs/HANDOFF-2026-10-04.md` (P4.2/P4.4).*

# ECOSYSTEM QUESTIONS — what we are still owed, and by whom

> Created 2026-10-10 (launch-readiness pass). These are the **unanswered** questions
> that block an honest launch statement. They are written to be sent as-is to the
> vibe/vibe ecosystem team (Discord `#testnet-incentives` / builder channel, or the
> team account). Each one separates *what we already know from an official source*
> from *what we are guessing*, and names the claim we cannot make until it is
> answered.
>
> **Nothing here asserts a reward, an allocation or an entitlement.** Testnet
> participation terms are the platform's own; the primary source of truth is the
> platform documentation and its testnet legal terms:
> https://testnet.vibevibe.fun/docs (see **Safety — stay safe** and the FAQ).
> Our own language rule is in `docs/ECONOMY-LAWS.md` (LAW 3.2/4): "builds weights",
> never "earn" or "guaranteed".

Status of our public wording today: **no public post claims eligibility, rewards or
a distribution.** This document exists so that what we *could* say is grounded.

---

## Q1 · Utility-track eligibility — what exactly qualifies, and when is it judged?

**What we know (official):** the testnet incentives program is described as
**5% of supply, discretionary** across tracks (traders 1.75% · meme 1.5% ·
**utility 1.5%** · legacy creators 0.25%), quoted verbatim in
`docs/INTEL-UPDATE-2026-10-07.md` from the platform's own channels. "Launching on
vibevibe testnet is the normal project intake path."

**Unverified:** whether a *live, non-token* product must additionally launch a
token, or register a project page, to be judged in the utility track; whether
there is a submission window/deadline; what evidence the team wants (URLs, usage
numbers, source, on-chain reads).

**Why it blocks us:** `docs/ECONOMY-CHECKLIST.md` **E0.5** (incentive eligibility
pass) cannot be closed, so we cannot state in any launch material that Candle
Climber is *in* the utility track — only that it fits the described bar.

**What we do meanwhile:** ship and document the product; keep all reward language
off the public surface.

---

## Q2 · What is a "weight" actually worth?

**What we know (ours):** the weights ledger is built and tested
(`src/lib/weights.ts` pure core + `src/lib/weights-store.ts` memory/Mongo,
`test/weights.test.ts`): one run event per identity per UTC date, streak
`min(N,10)` points/day, wallet-linked, with sybil flags
(`docs/WICK-ECONOMY-SPEC.md` §7).

**Unverified:** whether "weights" as used by the ecosystem means the **same thing**
— a *recognition/eligibility metric* accumulated by a product — or a claim on a
specific pool with a published conversion rule. There is no public conversion
formula (weights → allocation) that we have found.

**Why it blocks us:** it is the difference between "your runs build weights" (true
and safe) and anything implying a number, a denominator or a payout. Ambiguity here
is exactly the risk flagged in the launch-readiness audit.

**What we do meanwhile:** keep the ledger internal, keep the UI wording
"builds weights", and publish the formula we control (`WICK-ECONOMY-SPEC` §7) so
anyone can audit it — while stating plainly that its *external* value is unknown.

---

## Q3 · How is the utility-track share decided?

**Unverified:** the mechanism behind the discretionary 1.5% utility slice:
per-project share vs pooled; judged by usage, retention, X engagement, or the
team's curation; whether the launchpad's own metrics (volume/holders) or product
metrics are used.

**Why it blocks us:** our economic model (`docs/ECONOMY-CHECKLIST.md`, workstreams
E1–E6) currently assumes a *discretionary* pool with unknown weighting. Any
projection built on a guessed weighting would be a fabricated number — the exact
thing the honesty rules forbid.

---

## Q4 · Stock Token support — is reading the mainnet Chainlink feed the blessed path?

**What we know (official, verified live):** Robinhood Chain mainnet is chain
**4663**; per-ticker Chainlink price feeds are published and their proxy addresses
are resolved from the Chainlink reference-data directory; the docs say to read
addresses from the directory rather than hardcoding them. Testnet faucet Stock
Tokens (chain **46630**) are real ERC-20s with **mock** feeds. Captured evidence:
`docs/ROBINHOOD-CHAIN-INTEGRATION.md`; re-verifiable any time with
`bun scripts/verify-feeds.ts` (live 2026-10-10: TSLA `$382.95`, directory-resolved).

**Unverified:** whether products are expected to consume the feeds directly (our
current wiring) or through a platform API; whether an **official OHLC/historical**
source exists or is planned (we have found only a spot feed); whether a product
using Stock Tokens needs any registration/permission; and the support level for
tickers with **no** published feed (`NFLX` today).

**Why it blocks us:** our differentiator — a stock level checked against the
official on-chain price — is honest today, but the "live on-chain OHLC" version of
it (TRUTH-TABLE row 10) is impossible without a historical source. Knowing whether
one is coming changes the roadmap, not the honesty.

---

## Q5 · Post-graduation rails — do the recorded fee weights survive?

**What we know:** the launch record (`docs/evidence/wick-launch-record.json`,
launchId 5963) carries a fee configuration; `docs/ECONOMY-CHECKLIST.md` **E0.1**
(2026-10-08) reconciled the documented split with the chain to **75% holders /
20% cash / 5% burn**, and records `transfersUnlocked: false` until graduation.

**Unverified:** whether those weights are guaranteed through graduation and after
it; what exactly unlocks transfers; whether the creator-fee rails change on
migration to a Uniswap v4 pool.

**Why it blocks us:** E3/E6 items (in-game spend, burn sinks, treasury split)
cannot be described as final while the post-graduation configuration is unknown.

---

## Q6 · Language review — what may we say about future distributions?

**What we know:** the platform's docs/safety section and its **testnet legal
terms** are the primary source of truth for participation and reward expectations;
the program is described as discretionary.

**Unverified / requested:** a yes/no on the specific sentences we intend to use in
the launch post and on the token page — e.g. *"runs build weights in the product;
any future distribution is at the ecosystem's discretion"* — and whether the word
"weights" itself is acceptable in public material before graduation.

**Why it blocks us:** everything user-facing. We would rather have one awkward
question answered than ship a sentence the team has to walk back.

---

## How to send this

1. Post Q1–Q3 (incentives/eligibility/weights) together — they are one
   conversation.
2. Post Q4–Q5 as technical questions on the Robinhood Chain / Stock Token surface.
3. Keep Q6 attached to the exact sentences, so the answer is a yes/no on wording.

Log the answers in `docs/INTEL-UPDATE-<date>.md` and update
`docs/TRUTH-TABLE.md` rows 13–16 in the same commit. Until an answer lands, the
public posture stays as stated at the top of this file.

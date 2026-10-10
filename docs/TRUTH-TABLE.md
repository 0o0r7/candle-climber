# TRUTH TABLE — every product claim vs the code, the tests and the primary source

> Created 2026-10-10 (launch-readiness pass). One row per claim a reader could
> find in this repo's docs, marketing surface or launch material. The rule is
> simple: **a claim is worth nothing until it is traced to code, a test, a
> captured live read, or an official ecosystem source** — and when it is not,
> it says so here, in public.
>
> Re-run the automated side of this table any time:
>
> ```bash
> bun scripts/verify-feeds.ts        # live official-feed connection test (exit 0/1/2)
> bun test                           # 20 suites, zero network
> ```

## Status vocabulary

| Status | Means |
|---|---|
| ✅ **VERIFIED** | In-repo automated evidence, or a captured live read on the date shown. |
| 🟡 **PARTIAL** | The mechanism ships, but the claimed *end state* is not reached (or is not provable from here). |
| ⛔ **NOT CONNECTED** | The claim is false or impossible as stated today. We keep documenting it as such rather than hiding it. |
| 📄 **OFFICIAL** | A statement made by the ecosystem, quoted from an official source — not our product claim, and not a promise to the player. |
| ❓ **UNVERIFIED** | No evidence obtainable inside this repository. |

## Claims

| # | Claim | Stated in | Evidence (real path / captured read) | Status |
|---|---|---|---|---|
| 1 | One daily level = one real symbol's chart, identical for every player worldwide (deterministic daily seed) | README · GAME_DESIGN | `src/game/cc/level.ts`, `src/game/cc/rng.ts`; `test/level-determinism.test.ts` | ✅ VERIFIED |
| 2 | Real market data: Binance klines via server proxy + geo-fallback + synthetic fallback | README · FEEDS §1 | `src/app/api/candles/route.ts`; `test/feeds.test.ts` | ✅ VERIFIED |
| 3 | Stock rails use real OHLC (Yahoo primary, stooq fallback) | FEEDS §2–3 | Parsers are pure and test-pinned; **live reachability is IP-dependent** (Yahoo 429 / stooq anti-bot) and degrades to the anchored path — see FEEDS failure modes | 🟡 PARTIAL |
| 4 | Global leaderboard: memory fallback → MongoDB Atlas, env-gated | README | `src/lib/leaderboard-store.ts`; live here: `GET /api/leaderboard` → `"store":"memory"`. Atlas path unverified in this sandbox (no `DATABASE_URL`) | 🟡 PARTIAL |
| 5 | Score is pure skill; anti-sybil (HMAC run-tokens, server-side verification) | README · ECONOMY-LAWS | `src/lib/run-token.ts`; `test/run-token.test.ts`; tokenless terrain is never POSTed (`GameCanvas` submit gate) | ✅ VERIFIED |
| 6 | Stock levels are checked against the official on-chain price | ROBINHOOD-CHAIN-INTEGRATION | Live 2026-10-10: `GET /api/candles?symbol=TSLA` → `seed.onchain.verified: true`, price `$382.95`, `deltaPct -3.23%` | ✅ VERIFIED |
| 7 | We read the official Robinhood Chain stock price (keyless, public RPC) | ROBINHOOD-CHAIN-INTEGRATION | Chain **4663**, feed `0x7A6b81…33b1`, resolved from the Chainlink directory; live read 2026-10-10 `$382.95`, round 1491; unit contract in `test/robinhood-chain.test.ts` | ✅ VERIFIED |
| 8 | Feed addresses are official, not invented | ROBINHOOD-CHAIN-INTEGRATION | `resolveOfficialFeed` reads the Chainlink reference-data directory (58 entries, live 2026-10-10); the snapshot is only a miss fallback | ✅ VERIFIED |
| 9 | Mainnet official feeds and testnet faucet tokens are never conflated | ROBINHOOD-CHAIN-INTEGRATION | Separate registries; testnet read returns `symbol()`/`decimals()` **only** (price never read); live 2026-10-10: TSLA `0xC9f9c8…3Bd4E`, decimals 18 | ✅ VERIFIED |
| 10 | Stock terrain is built from on-chain data (live on-chain OHLC) | Implied by "the chart is the level" for stocks | Only a **spot** feed exists on-chain. Terrain is derived and labeled `derived` / "official on-chain price", anchored to the official close — never presented as live OHLC | ⛔ NOT CONNECTED (impossible today) |
| 11 | Every stock ticker has an official feed | — | `NFLX` has no published feed → `onchain: null` (live negative control, 2026-10-10) | ⛔ NOT TRUE — documented gap |
| 12 | Archive levels are verified against the official price | — | Deliberately skipped: a past chart is not comparable to today's spot price | ⛔ BY DESIGN |
| 13 | $WICK launched on the vibe/vibe testnet (launchpad rails) | README · worklog | `docs/evidence/wick-launch-record.json` — token `0xe2ce0b…5216c`, curve `0x9e00b4…2640c`, launchId 5963 | 🟡 RECORDED (off-chain record; not re-read on-chain in this pass) |
| 14 | Creator fee split = 75% holders / 20% cash / 5% burn | ECONOMY-CHECKLIST E0.1 | Reconciled against the chain record in E0.1 and stored in the launch record | 🟡 RECORDED (see E0.1) |
| 15 | Airdrop **weights**: streak-based, wallet-linked ledger | WICK-ECONOMY-SPEC §7 | `src/lib/weights.ts` (pure, no I/O) + `src/lib/weights-store.ts` + `test/weights.test.ts` | ✅ VERIFIED as a mechanism — **eligibility for any distribution is NOT established** (see ECOSYSTEM-QUESTIONS) |
| 16 | Testnet incentive pool is 5% of supply, discretionary | INTEL-UPDATE-2026-10-07 (official channel quotes) | Quoted verbatim in the intel doc; primary source = platform docs/legal terms | 📄 OFFICIAL — discretionary, no entitlement implied |
| 17 | Live at https://candle-climber.vercel.app | README | HTTP 200 re-checked 2026-10-10 (external deployment, outside this sandbox) | ✅ VERIFIED |
| 18 | QA: 450+ headless sim rounds + live emulated device sessions, zero exceptions | README | `qa/visual-sweep` (30), `qa/realdevice` (11), `scripts/e2e-gamer-bot.ts`, 20 test suites. The README's `scripts/qa-sim.ts` **does not exist** — the reference was stale and is corrected in this pass; the raw sim counter is not reproducible from the repo | 🟡 PARTIAL |
| 19 | Zero-cost infrastructure (GitHub Student Developer Pack) | README · INFRASTRUCTURE | `docs/INFRASTRUCTURE.md` — a plan document; per-service student-pack status is not verifiable here | 🟡 PARTIAL |
| 20 | Share loop: OG/Twitter cards, PWA manifest, metadataBase, Death Card PNG | README | `public/og.png`, `public/manifest.webmanifest`, `src/app/layout.tsx` (`metadataBase`, `openGraph`), `src/game/cc/deathcard.ts` | ✅ VERIFIED |

## What we deliberately do NOT claim

- **No guaranteed rewards, payouts, listings or prices.** Weights accrue in the
  product; what (if anything) they become is the ecosystem's call and is
  **unconfirmed**. Language rule: "builds weights", never "earn/guaranteed"
  (ECONOMY-LAWS LAW 3.2/4). Testnet participation terms are the platform's:
  https://testnet.vibevibe.fun/docs (safety essentials + FAQ).
- **No on-chain OHLC / no "real-time on-chain terrain".** Row 10 stays ⛔ until a
  historical-price source exists on Robinhood Chain (see
  ROBINHOOD-CHAIN-INTEGRATION §5).
- **No testnet price.** Testnet Stock Token feeds are mock; we read them for
  identity only.
- **No invented numbers.** When official data is unavailable the value is `null`
  or explicitly labeled `synthetic` / `derived` — never a plausible-looking
  substitute.

## Stale claims found and corrected in this pass

| Where | Was | Now |
|---|---|---|
| README (QA line) | pointed at `scripts/qa-sim.ts`, which does not exist in the repo | points at the artifacts that do exist (`qa/`, `test/`, `scripts/e2e-gamer-bot.ts`) |
| README (status table) | listed the $WICK token phase and PvP duels as "Next", though the token is launched and duel/ghost/rival code ships | moved to an accurate "shipped / pending" wording |
| README (status header) | "deployed 2026-09-29 · CI green" with no data-honesty section | adds the official-feed + mainnet/testnet honesty section and a re-verify date |

*Update this table whenever a claim is added, moved or retired — same commit.*

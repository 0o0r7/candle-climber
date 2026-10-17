# DELIVERY READINESS REPORT — Candle Climber ($WICK)

> Audit date: **2026-10-13** · Repo state audited: `main` @ `df217de` (audit
> fixes landed on top — commit chain recorded in §3) · Auditor: the project's
> own build/verification agent, running a multi-agent parallel audit
> (code completeness · documentation consistency · public surface & hygiene)
> plus the full quality-gate battery, executed in one session.
>
> Purpose: establish, with evidence, that the product is ready to hand to the
> VibeVibe ecosystem team for technical/quality review — and to name, without
> spin, every item that is deliberately deferred (with owner and trigger) and
> every residual risk. House rule applies throughout: **a claim without a
> pointer is treated as false.**

---

## 1. Verdict

**SHIP.** The codebase is delivery-ready. No half-finished logic exists
anywhere in `src/` (zero TODO/FIXME/WIP markers; the marker sweep returned
only cosmetic comments and honest state names). All integrity-critical paths
fail closed. 534/534 automated tests pass, TypeScript and ESLint are clean,
the production build succeeds, and both $WICK price readers re-verified LIVE
against Robinhood Chain testnet during this audit. The one real security
exposure found (a committed dev fallback for the HMAC signing secret on
production deploys) was fixed in this audit with tests. Product-surface gaps
the owner had reported (no home link, invisible wallet affordance on plain
mobile browsers, landing page carrying no $WICK facts) were closed. What
remains open is a short list of consciously deferred items, each with a
named owner and trigger (§5) — decisions, not defects.

## 2. Quality gates (all executed 2026-10-13, this audit)

| Gate | Command | Result |
|---|---|---|
| Automated tests | `bun test` | ✅ **534/534 pass** across 42 files (530 + 4 new fail-closed hardening tests) — zero network |
| Type safety | `bunx tsc --noEmit` | ✅ clean |
| Lint | `bun run lint` | ✅ clean |
| Production build | `bun run build` | ✅ green (incl. new `/sitemap.xml` route) |
| Live price-reader smoke | `bun scripts/smoke-dex-reader.ts` | ✅ **PASS** — WICK curve read ok (meter 0.171%, source `curve`); BEEF graduated pool re-read live (slot-6 word structure-consistent, tick moved 206655→206880 as the pool traded since capture; decoder + graduation invariant exact to 18 digits) |
| Secrets scan | pattern sweep over all tracked files | ✅ **clean** — no tokens, keys, connection strings or seed phrases committed (§4) |
| Live deployment | https://candle-climber.vercel.app | ✅ serving (last re-check 2026-10-10, external to sandbox) |

Reviewers can re-run the entire battery with four commands (no secrets, no
network for tests): `bun install && bun test && bunx tsc --noEmit && bun run
lint`, plus `bun scripts/smoke-dex-reader.ts` for the live on-chain proof.

## 3. Findings → fixes (this audit's commit)

Each fix below is in the audit commit on `main`; file paths point at the
post-fix state.

### 3.1 Security (the findings that mattered)

| # | Finding (severity) | Fix |
|---|---|---|
| S1 | **HIGH** — `getRunTokenSecret()` fell back to a committed literal (`"cc-local-dev-secret"`) on production deploys without `RUN_TOKEN_SECRET`. The repo is public, so every HMAC run token (leaderboard/ghosts/duels/vault/practice/deathcard integrity chain) was forgeable by anyone reading the source. | Fail-closed: on a Vercel production deploy with no configured secret, `/api/candles` serves terrain **without** a run token (unscored by construction) and `verifyRunToken()` rejects everything — no crash, no silent trust. Dev/preview keeps the zero-setup default. Pinned by 4 new tests (`test/run-token.test.ts`, "run-token fail-closed hardening"). `src/lib/run-token.ts`, `.env.example`. |
| S2 | **MEDIUM** — `/api/candles` (the token issuer the whole integrity chain trusts, and a fan-out proxy to Binance/Yahoo/Stooq/CoinGecko) had no rate limit; `/api/practice`, `/api/vault`, `/api/wallet` POSTs were unthrottled. | Shared in-memory per-IP limiter (`src/lib/http-limiter.ts`); 60/min on `/api/candles`, 10/min on the write lanes, 30/min on the wallet RPC proxy. Same per-instance tradeoff already accepted and documented for the leaderboard limiter. |
| S3 | **MEDIUM** — `/api/debug-sentry?go=1` allowed unauthenticated Sentry event injection on any deploy (quota-spam vector). | Returns 404 on production unless `DEBUG_SENTRY=on` is explicitly set. Status probe stays available. |
| S4 | **LOW** — no security headers anywhere. | Baseline headers on every route via `next.config.ts` (`X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`, HSTS). A strict nonce-based CSP is deliberately deferred (game canvas + Sentry inject inline scripts; see §5 D-7). |

### 3.2 Product surface (owner-reported gaps, closed)

| # | Finding | Fix |
|---|---|---|
| P1 | The landing page carried **zero $WICK facts** — no launch date, no token address, no testnet disclosure, no path to `/partners`. The ecosystem review reads the landing first. | New live strip on `/` (`src/components/landing/WickStrip.tsx`): launch 2026-10-05 · launch #5963, live graduation meter + curve price from the same aggregate endpoint `/api/wick/state` (source-labeled, honest `n/a` on failure, LAW 4), direct trade link, token address, explicit `TESTNET — NO REAL FUNDS`. `/partners` linked from navbar + footer (+ `/airdrop`), footer carries the full disclosure line. |
| P2 | `/play` was a dead-end page — no way back home (owner report 2026-10-11, confirmed). | `home` link added to the game footer (`src/components/cc/GameCanvas.tsx`). |
| P3 | On plain mobile browsers (no injected provider) the wallet chip rendered **nothing** — the owner read this as "wallet missing on mobile". | Honest affordance: the chip now renders `WALLET · IN-WALLET BROWSER ONLY` with an explanatory tooltip instead of silently disappearing (`src/components/cc/WalletChip.tsx`). The real fix for ordinary mobile browsers is the WalletConnect/Reown embedded phase — deliberately deferred (§5 D-3). |
| P4 | `/partners`, `/stats`, `/airdrop` had no page metadata; no sitemap. | Per-route `layout.tsx` metadata (title/description; `/stats` noindex), `src/app/sitemap.ts` generating `/sitemap.xml` from the canonical domain. |

### 3.3 Verification-loop repair

| # | Finding | Fix |
|---|---|---|
| V1 | The partner roadmap's own §0 re-verification command (`bun scripts/smoke-dex-reader.ts`) pointed at a file that was **not in the repo** — the script lived workspace-side and was lost with the sandbox (the `.gitignore` `/scripts/*` rule did not whitelist it). The newest, most-reviewed document failed its own house rule: a reviewer could not re-run the audit loop. | `scripts/smoke-dex-reader.ts` rebuilt and committed (gitignore whitelisted). It re-proves both price regimes live: WICK curve read + invariant; BEEF graduated pool — storage key recomputed from the poolId with our own keccak and compared byte-exact to the pinned fixture, live extsload, structural decode of the (legitimately moved) word, exact bigint math, and the graduation invariant. All live checks passed during this audit. |

### 3.4 Documentation freshness (the audit's doc sweep)

Fixed in this pass (every fix is a concrete stale/broken item, not a rewrite
of history — historical docs got dated status banners instead):

- `README.md` — status table refreshed to 2026-10-13 reality (3 modes,
  partner lane, DEX reader, 6-pool mutations, Atlas live, deathcard mint);
  QA line now cites the reproducible numbers; public surfaces table added.
- `docs/README.md` — index gained PARTNER-LANE-DESIGN,
  PARTNER-LAUNCH-ROADMAP, MASTER-CHECKLIST and this report; suite count
  corrected (42 test files / 530+ tests, was "20 suites"); a dated
  **language policy** now declares the working language EN and names the
  three deliberate Persian exceptions (owner status, chat glossary, council
  session transcripts — each now carrying a one-paragraph English abstract;
  `WICK-LAUNCH-FORM-PACK.md` carries an English historical-record note).
- `docs/TRUTH-TABLE.md` — four new evidence-pinned rows (20–23 → renumbered
  24–27: 3-mode rotation, partner lane, price readers + live smoke, fail-closed
  integrity chain); row 18 suite-count corrected.
- `docs/MASTER-CHECKLIST.md` — §5 Current pointer extended with the
  2026-10-12/13 build-out; the stale 2026-10-02 "NEXT ACTION" struck through
  (kept for the audit trail); the unresolvable commit pointer `fe6f8a0`
  annotated as lost in the branch rescue.
- `docs/PARTNER-LAUNCH-ROADMAP.md` — R-8's false pointer to
  `GUILD-INTEGRATION-PLAN.md` corrected (that doc covers guild spaces, not
  multi-token chart feeds); the row is now its own honest pointer.
- `docs/ECONOMY-CHECKLIST.md` — the contradicting "O1 pending" cost note
  corrected (O1 closed 2026-10-08 per §E0.3).
- `docs/ECOSYSTEM_BAR.md` — dated v3.1 status banner reconciling the v2 body
  and v3 details-block with current state (E2/E6/E10 resolved, remaining
  reds are owner decisions E3/E4).
- `docs/GAME_DESIGN.md`, `docs/CC-PLAN.md` — dated status addenda
  (parameters that evolved: score cap 175, stocks shipped, 4-ETH cap vs the
  historical 5-ETH config default, mascot resolved) without rewriting the
  locked originals.
- `docs/DEATHCARD-NFT-TESTNET-NOTE.md` — header updated: the claim route
  shipped (`/api/deathcard/claim`, `test/deathcard-claim.test.ts`).
- `docs/council/2026-10-10-ANTI-SYBIL-AUDIT.md` — test pointer corrected to
  the files that actually pin the caps (`test/summit.test.ts`,
  `test/official-board.test.ts`).
- `docs/FEEDS.md` — CoinGecko registered as source 4b (URL, honesty label,
  failure mode) and the `research-cache/` pointer disclosed as
  workspace-internal.
- `docs/INFRASTRUCTURE.md` — the owner-less Sentry DSN TODO annotated with
  owner + trigger.
- `worklog.md` (in-repo) — bridge note: Tasks 70–121 are durably recorded in
  commit messages + STATUS-FA + checklist ledgers; the in-repo log resumes
  with this audit; the §0.4 append ritual is restored.
- `.env.example` — dead config removed (`NEXT_PUBLIC_CHAIN_RPC_URL`,
  `ACCESS_*` trio — zero code references), `MONGODB_URI` alias documented,
  WalletConnect var marked RESERVED (not built), `RUN_TOKEN_SECRET` marked
  REQUIRED-IN-PRODUCTION with the fail-closed contract.

## 4. Secrets & hygiene attestation

- **Scan**: all tracked files swept for credential patterns (provider token
  prefixes, Discord-token shape, Mongo/postgres connection strings, RPC URLs
  with embedded keys, 64-hex private keys, seed phrases). Result: **clean**.
  Every 64-hex string in the tree is a test vector, a storage-key pin, or a
  public on-chain fact; every secret flows through `process.env` or the
  gitignored `~/.cc-minter-key` file path.
- `.env` files: only `.env.example` is tracked; `.gitignore` hard-fails the
  secret family (`.env*`, `.gh_token`, `.vercel_token`, `.mongo_*`, `.pem`, …).
- One scraped X-profile payload (`x_vibegames.json`) was removed from
  tracking in this audit (no product value; data-minimization).
- The death-card minter key path, the `MERKLE_SALT` publication (rehearsal
  tree; wallet preimage not brute-forceable), and per-instance rate-limit
  semantics are known, documented tradeoffs — not findings.

## 5. Deliberately deferred items (decisions, not defects)

Every row names its owner and trigger. Nothing below blocks delivery.

| # | Item | Owner | Trigger / when |
|---|---|---|---|
| D-1 | **Partner recruitment** — the funnel is built (explanation page + application form + verification pipeline); zero applications exist. | Owner (outreach is human work) | Immediate, owner-paced (roadmap R-1) |
| D-2 | **Partner onboarding runbook + Mongo persistence for the application store** | Build agent | HARD GATE before the first partner is listed (roadmap R-2/R-3) |
| D-3 | **WalletConnect/Reown embedded wallet flow** (ordinary-mobile wallet access) | Build agent + owner decision | Next wallet phase; env var reserved in `.env.example` |
| D-4 | **Accessibility settings (colorblind / reduced-motion / haptics)** exist on the owner's Base44 experimental branch, not in this repo | Owner (accepting the Base44 test output) | Merge-back through the same PR-review pipeline as PR #1, defect-free + tested |
| D-5 | **How-to-play video publication** — assets exist (`docs/assets/x-launch/*.mp4/gif`); the landing's official how-to-play is the interactive `GameplayDemo` + 5-step tutorial | Owner (format decision) | Optional; copy to `public/` if a video is wanted on-site |
| D-6 | **Graduation sequence** (fee/slot re-verify, post-grad lanes, weights freeze etiquette) | Build agent, operator runbook | AT the graduation tx (runbook: `docs/council/2026-10-10-GRADUATION-RUNBOOK.md`; standing note in PARTNER-LANE-DESIGN §4b) |
| D-7 | **Strict CSP + nonce hardening**, dependency-tree pruning (~15 unused scaffold deps listed in the audit), dead-export cleanup in `src/lib` | Build agent | First post-delivery maintenance pass; cosmetic, zero user impact |
| D-8 | **Custom domain** (E3) and **X/reach content** (E4) | Owner | Owner decision; domain redirect path already identified (domain is fixed in the token launch record) |
| D-9 | **Mainnet** — out of scope by design (testnet product; honest disclosure everywhere) | Owner | Platform decision (roadmap R-10) |
| D-10 | **Framer landing redesign experiment** (student-pack Framer projects + API access; owner directive 2026-10-11, paused same night, superseded by the Base44 test) | Owner (restart decision) | When the owner returns to it; red lines already drafted: game code untouched, no economy claims, brand assets from the approved logo/mascot set |

## 6. Known limitations (stated, not hidden)

- Rate limits are per serverless instance (Vercel), not global — documented
  in-code at each limiter; a global store (e.g. Redis) is unnecessary at
  current scale and is listed under D-7.
- `/api/airdrop` and `/api/weights?snapshot=1` publish wallet addresses +
  points by design (public rehearsal ledger, pseudonymous; PII is never
  stored or published — the application store is private, GET-refused).
- Live stock-feed reachability is IP-dependent (Yahoo 429 / stooq anti-bot);
  the anchored on-chain price + derived labeling covers the honesty contract
  (TRUTH-TABLE rows 3/6/10).
- The graduated-phase gate is proven on a REAL third-party graduation (BEEF),
  not on $WICK — $WICK is still CURVE_TRADING (meter 0.171% as of this
  audit). This is recorded on purpose (PARTNER-LAUNCH-ROADMAP §1).

## 7. Sign-off checklist (for the ecosystem reviewer)

- [x] All quality gates green (§2) — re-runnable in under a minute
- [x] No unfinished logic in `src/` (marker sweep + manual feature audit)
- [x] Integrity chain fails closed without configuration (S1, tested)
- [x] No committed secrets (§4 attestation)
- [x] Every public claim evidence-pinned (`TRUTH-TABLE.md` 27 rows)
- [x] Build ledger current: done vs not-started each carry why + trigger
      (`PARTNER-LAUNCH-ROADMAP.md` §2/§3, this report §5)
- [x] Laws 1.1 (score never purchasable), 1.2 (walletless base play), 1.3
      (skill-only scoring), 4 (honest language + testnet disclosure), 5.1
      (no score/access input touched by the audit fixes — verified: the audit
      changed security, surface and docs only) untouched by construction
- [x] Owner-facing status current (`STATUS-FA.md` 2026-10-12 + this audit)

*End of report — no claims beyond the pointers above.*

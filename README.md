# CANDLE CLIMBER

> **The chart is the level.** A vertical skill platformer whose terrain is built from
> real candlestick data. Built for the **vibe builders** program on Robinhood Chain.

You are a small blocky trader running up a live chart. Green candles are solid
jump pads. Red candles crumble under your feet. Fall off the bottom of the screen
and you are — obviously — **liquidated**.

## Why it fits the ecosystem

- **Utility / vibecoded track** — ships a real, playable MVP (browser, desktop + mobile).
- **Every vibe/vibe launch is content** — one daily level = one real symbol's chart,
  identical for every player worldwide (deterministic daily seed).
- **Shareable death loop** — every run ends in an auto-generated, downloadable
  Death Card (score, symbol, funny liquidation cause, rank) built for X/Twitter.
- **Anti-sybil by design** — no reward loops tied to self-play; score = pure skill.

## Data honesty — official feeds, never invented

- **Official stock price.** Every stock level is checked against the official
  Chainlink price feed on **Robinhood Chain mainnet (chain 4663)**, read keyless
  over the public JSON-RPC. The HUD shows an `ON-CHAIN <SYM> $…` chip when the
  level's final close agrees with it (verified 2026-10-10: TSLA `$382.95`,
  `deltaPct -3.23%`), and `GET /api/onchain/quote?symbol=TSLA` exposes the same
  read with no game involved. Re-verify any time with
  `bun scripts/verify-feeds.ts`.
- **Mainnet ≠ testnet.** The testnet faucet Stock Tokens (chain 46630) are a
  *different contract set* with **mock** feeds — read for identity only, never
  priced. Raw `eth_call` evidence: [`docs/ROBINHOOD-CHAIN-INTEGRATION.md`](docs/ROBINHOOD-CHAIN-INTEGRATION.md).
- **No on-chain OHLC exists.** The official feed is a *spot* price, so derived
  terrain is labeled `derived` / "official on-chain price" — never "live data".
  When official data is unavailable the value stays `null`; nothing is
  synthesised to look official.
- Every claim is tracked against code and evidence in
  [`docs/TRUTH-TABLE.md`](docs/TRUTH-TABLE.md); every feed is registered in
  [`docs/FEEDS.md`](docs/FEEDS.md).

## Status — live at https://candle-climber.vercel.app

Real daily candles, real deaths. Deployed 2026-09-29 · CI green on `main` ·
QA: 450+ headless sim rounds + live desktop/mobile-emulated sessions, zero
exceptions — artifacts in `qa/`, regression suites in `test/`, bot in
`scripts/e2e-gamer-bot.ts` (see `docs/ECOSYSTEM_BAR.md`). Live deployment
re-checked 2026-10-10.

| Shipped | Next |
|---|---|
| Canvas 2D engine (fixed-timestep physics, coyote time, jump buffering, crumble timers) | Game-feel polish + combo scoring pass |
| Daily Seed: UTC date → symbol + window, deterministic level + daily mutations (5-pool) | Platform launch-feed levels (level-source → D10) |
| Real market data: Binance klines via server proxy + geo-fallback + synthetic fallback | Death Card v2 (rivalry tags) |
| OG/twitter cards, PWA manifest, metadataBase — share loop live | Global leaderboard persistence (Atlas `DATABASE_URL` — code is plug-and-play) |
| Death Card generator (1080×1350 PNG download / WebShare) | On-chain score anchoring (wallet identity + `$WICK` balance badge already ship) |
| Global leaderboard API (memory fallback → MongoDB Atlas, env-gated) + boards · `$WICK` launched on the vibe/vibe testnet (launchId 5963) · PvP duels + rival ghosts (`duel.ts`, `ghost.ts`, `rival/`) | Graduation economics, ranked duels, guild wars |
| Official on-chain stock anchor: mainnet Chainlink feed per stock level + `ON-CHAIN` badge (W6) | Live on-chain OHLC terrain — needs a historical source on the chain (see truth table) |
| market legibility stats (REAL MOVE %, difficulty), MiniChart, hint bubbles | Real-device mobile QA pass |
| vibe/vibe design language, WebAudio synth SFX, mobile touch controls | Mascot V2 (parked pending owner re-brief) |

## Tech stack

- **Next.js 16 (App Router) + TypeScript** — app shell, API routes
- **Canvas 2D** custom engine (`src/game/cc/`) — no heavy game frameworks
- **Tailwind CSS 4** — vibe/vibe palette (`#CCFF00` lime on `#101214`)
- **WebAudio** synthesized sound — zero audio assets
- **Bun** — package manager and runtime
- Zero-cost infrastructure mapped to the **GitHub Student Developer Pack**
  → see [`docs/INFRASTRUCTURE.md`](docs/INFRASTRUCTURE.md)

## Quickstart

```bash
bun install
bun run dev        # http://localhost:3000
bun run lint       # eslint
bun run build      # production build (Vercel-style)
```

Production runs on Vercel with `build` (plain `next build`); `build:standalone`
exists for self-hosted/`bun start` runs.

## Architecture

```
src/game/cc/
  types.ts      Candle, SeedInfo, RunResult — shared contracts
  rng.ts        hashString, mulberry32 — seeded daily PRNG
  level.ts      daily seed → symbol + window; candles → platforms
  mutations.ts  5-pool daily mutations → physics modifiers (deterministic)
  market.ts     legibility stats: REAL MOVE %, FRIENDLY/SPICY/BRUTAL
  level-source.ts  pluggable level feed: Binance daily · vibe-launch terrain · Robinhood on-chain price anchors (official), synthetic fallback
  engine.ts     fixed-timestep loop, physics, crumble timers, scoring
  render.ts     canvas renderer (vibe/vibe palette, particles, camera)
  deathcard.ts  offscreen-canvas 1080×1350 share card
  sound.ts      WebAudio synth SFX
src/app/api/candles/route.ts      GET seed + klines (Binance proxy + geo-fallback, cached)
src/app/api/leaderboard/route.ts  GET top / POST entry (?board=guest|official|all; official POST requires a valid personal_sign ownership proof — anything less degrades to guest with a note; memory fallback → MongoDB Atlas when DATABASE_URL set)
src/lib/leaderboard-store.ts      storage adapter: two lanes (guest walletless · official wallet-bound, best run per wallet), env-gated Atlas M0, memoized clients
src/lib/proof-message.ts          isomorphic canonical proof message (client and server build the exact same bytes)
src/lib/wallet-proof.ts           server-side EIP-191 personal_sign verification (ECDSA secp256k1 recovery, ±10-min freshness)
src/lib/seasons.ts                append-only season registry (S1 opened 2026-10-10) — official records are season-stamped
src/components/cc/GameCanvas.tsx  client shell: canvas + HUD + modals (+ wallet personal_sign before official submissions)
```

## Docs

- [`docs/README.md`](docs/README.md) — **start here:** which doc is the source of truth, and what is only history
- [`docs/TRUTH-TABLE.md`](docs/TRUTH-TABLE.md) — every product claim vs the code, the tests and the primary source
- [`docs/FEEDS.md`](docs/FEEDS.md) — every data feed: URL, cadence, failure mode, honesty label
- [`docs/ROBINHOOD-CHAIN-INTEGRATION.md`](docs/ROBINHOOD-CHAIN-INTEGRATION.md) — the official on-chain read + raw evidence
- [`docs/ECOSYSTEM-QUESTIONS.md`](docs/ECOSYSTEM-QUESTIONS.md) — what we still need answered (eligibility, weights, Stock Token support)
- [`docs/CC-PLAN.md`](docs/CC-PLAN.md) — technical master plan (locked)
- [`docs/GAME_DESIGN.md`](docs/GAME_DESIGN.md) — design spec: rules, scoring, virality loop
- [`docs/ECOSYSTEM_BAR.md`](docs/ECOSYSTEM_BAR.md) — honest scoreboard vs the vibe/vibe ecosystem bar (E1–E10)
- [`docs/ECONOMY-LAWS.md`](docs/ECONOMY-LAWS.md) — fairness/weights laws (the language rule lives here)
- [`docs/INFRASTRUCTURE.md`](docs/INFRASTRUCTURE.md) — zero-cost infra map (Student Pack)

## Official ecosystem references

- **vibe/vibe testnet docs** — https://testnet.vibevibe.fun/docs (quickstart,
  launch overview, **safety essentials**, FAQ). Its testnet terms are the primary
  source of truth for participation and for any reward expectation.
- **Robinhood Chain docs** — [connecting](https://docs.robinhood.com/chain/connecting) ·
  [token contracts](https://docs.robinhood.com/chain/contracts) ·
  [oracles & price feeds](https://docs.robinhood.com/chain/oracles-and-price-feeds) ·
  [building with Stock Tokens](https://docs.robinhood.com/chain/building-with-stock-tokens)
- **Chainlink tokenized-equity feeds on Robinhood Chain** —
  https://docs.chain.link/data-feeds/tokenized-equity-feeds/robinhood
- **`$WICK` launch record (testnet)** — [`docs/evidence/wick-launch-record.json`](docs/evidence/wick-launch-record.json)
- **Open questions owed to us by the ecosystem team** — [`docs/ECOSYSTEM-QUESTIONS.md`](docs/ECOSYSTEM-QUESTIONS.md)

> **Participation note.** Candle Climber is a **testnet** product. Any rewards,
> weights or allocations are **discretionary and unconfirmed** — see the
> platform's [testnet docs and legal/safety terms](https://testnet.vibevibe.fun/docs).
> Weights are ledger entries that accrue in the product; they are not a promise of
> a payout, a listing, or a price. Runs build weights — they do not earn them.

## License

[MIT](LICENSE) — candles are not liable for your liquidation.

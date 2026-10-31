# AGENTS.md — Base44 sandbox notes

Imported Next.js 16 app. These are the non-obvious things about running it here.

## Run it

```bash
docker compose -f docker-compose.base44.yml up -d --build
docker compose -f docker-compose.base44.yml logs -f web   # dev server output
```

- Single service `web` (`oven/bun:1`), source bind-mounted at `/app`, host port **3000**
  → the preview entry point.
- Dependencies are installed at container start (`bun install --frozen-lockfile`) from
  the mounted `bun.lock`; add a package by running `bun add <pkg>` inside the container
  or on the host, then restart the service. `node_modules/` is created on the host.
- It runs `bun run dev` = `next dev -p 3000` (Turbopack). Hot reload is polling-based
  (`WATCHPACK_POLLING`/`CHOKIDAR_USEPOLLING`) because bind mounts don't forward inotify.
- `git` is absent from the `oven/bun:1` image, so `next.config.ts`'s `git rev-parse`
  release lookup logs `git: not found` and falls back to `unknown-release`. Harmless —
  it only affects the Sentry release name.

## Credentials: none are required to boot

Every external integration is optional and degrades gracefully:

- `DATABASE_URL` — MongoDB (`mongodb://`/`mongodb+srv://` only). Leaderboard, duels,
  ghosts and weights stores all fall back to an **in-memory** store when unset, so the
  app is fully playable but those records reset on restart. `GET /api/leaderboard`
  reports the active backend via `"store": "memory"`.
- `SENTRY_AUTH_TOKEN` / `NEXT_PUBLIC_SENTRY_DSN` — source-map upload and error
  reporting only. `sentry.server.config.ts` ships a public default DSN.
- `RUN_TOKEN_SECRET` — HMAC key for run tokens. Dev/preview keeps a zero-setup local-dev constant fallback; **production fails closed without it** (G5 2026-10-14: the `MONGODB_URI`/`DATABASE_URL` fallbacks are gone — a DB URI is a high-visibility credential; the prod gate keys on `NODE_ENV` alone, so a non-Vercel `next start` fails closed too)
  local-dev constant, so leaderboard submissions work with no setup.
- Candle data comes from a Binance proxy route with a synthetic fallback; no API key.
- Stock levels read the official Robinhood Chain Chainlink feed over the public mainnet
  RPC (`ROBINHOOD_MAINNET_RPC`, default `https://rpc.mainnet.chain.robinhood.com`) — keyless.
  Testnet reads are identity-only (its faucet tokens have mock feeds). See
  `docs/ROBINHOOD-CHAIN-INTEGRATION.md`; the read degrades to `onchain: null`, never a fake price.

Optional credentials arrive via `/run/base44/app.env` (wired as the last `env_file:`),
never as Compose `environment:` entries — an `environment:` value would permanently
outrank a dashboard replacement.

## Sandbox-only override

`next.config.ts` appends the preview proxy's origin/host to `allowedDevOrigins` **only**
when `BASE44_PREVIEW_MODE === "1"` (the platform sets it in the sandbox). Unset or any
other value leaves the config exactly as it was. This is needed because the preview is
served from a different origin, and Next gates `/_next/*` dev assets and HMR by origin.

## Verify

```bash
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/          # 200
curl -s http://localhost:3000/api/candles | head -c 200                  # seed + candles
curl -s http://localhost:3000/api/leaderboard                            # {"store":"memory"}
curl -s "http://localhost:3000/api/leaderboard?board=official"           # wallet-bound lane (only submissions with a VALID personal_sign ownership proof land here)
curl -s http://localhost:3000/ops                                        # E4.1 economy dashboard (noindex, aggregate counts only)
curl -s "http://localhost:3000/api/onchain/quote?symbol=TSLA"            # live official Chainlink price (W6)
curl -s "http://localhost:3000/api/candles?symbol=TSLA" | head -c 400    # seed.onchain verification block

# official-feed connection test — run inside the container (bun is not on the sandbox host):
#   docker compose -f docker-compose.base44.yml exec -T web bun scripts/verify-feeds.ts
# exit 0 = every published feed verified live · 1 = feed failure (data) · 2 = network unreachable
```

A dev-server response contains `turbopack` / `next-dev` markers and unhashed source
modules; the log line `Compiling / ... GET / 200 (compile: 3.8s)` confirms live source
rather than a prebuilt bundle.

## `/chart` — the day page (added 2026-10-31, reference study)

- `/chart` `307`s to `/chart/<UTC today>`; `/chart/[date]` validates through
  `src/lib/day-chart.ts` — future dates and anything before 2017-01-01 `404`.
- The page deliberately does **not** compute the day's ticker or mutation server-side:
  `/api/candles` picks the symbol at request time from live 24h tickers
  (`selectDailySymbol`), so the pure rotation predicted ETHUSDT on 2026-10-31 while the
  live level served BTCUSDT. `ChartDay` names the level from the response instead. Do not
  "simplify" that back into `cryptoRotation`.
- The crowd block ("the field") is guest-lane only and labelled unverified; an
  unreachable store renders "unreachable", never "no climbs yet".
- `getBoard()` memoises on `globalThis`, not in module scope: Next dev compiles pages and
  route handlers into separate module graphs, and a module-scoped memory store made
  `/chart` and `/leaderboard` read an empty board while `/api/field` reported real climbs
  (observed 2026-10-31). Do not move it back.

```bash
curl -s -o /dev/null -w "%{http_code} %{redirect_url}\n" http://localhost:3000/chart   # 307 → /chart/<today>
curl -s http://localhost:3000/api/field | head -c 160                                  # {"count":0,...} on a fresh store
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/chart/2099-01-01        # 404 (no future terrain)
curl -s -o /dev/null -w "%{http_code} %{content_type}\n" \
  http://localhost:3000/chart/$(date -u +%F)/opengraph-image                           # 200 image/png
```

## Marketing assets

The X trailer kit in `docs/assets/x-launch` (the three 15s trailer cuts produced 2026-10-11 (NEVER COMMITTED — binary-lossy branch rescue; only x-01…x-07 exist in-repo. Restore from backup before relying on them)) is built by
`scripts/trailer` — see that folder's README. It runs on the sandbox **host**, not in the
container: `node scripts/trailer/build.mjs --out docs/assets/x-launch` (needs `ffmpeg` /
`ffprobe`, and Playwright's chromium from the repo's `node_modules`). The deterministic
timeline step shells into the web container itself. `scripts/trailer/` is the only `scripts/`
subtree that is not gitignored — see `.gitignore`.

`docs/` is not served by Next, so to watch or download the finished trailers during
review. The three 15s cuts `x-08`…`x-10` were produced 2026-10-11 but were NEVER COMMITTED (binary-lossy branch rescue) — `public/media/` does not exist; only x-01…x-07 are in-repo. Restore from backup before relying on them (see docs/assets/x-launch/README.md note)
`/media/<file>` on the dev server. Re-copy them after a rebuild (see the kit README).

## Checks (from CI)

```bash
# NOTE: tsc MUST run with the incremental cache disabled — a stale
# tsconfig.tsbuildinfo can report a silently-passing false "clean" (observed
# 2026-10-10). The extra seconds are the price of a trustworthy gate.
docker compose -f docker-compose.base44.yml exec -T web sh -ec "bun run lint && bun test && bunx tsc --noEmit --incremental false"
```

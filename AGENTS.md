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
- `RUN_TOKEN_SECRET` — HMAC key for run tokens; falls back to `DATABASE_URL` then a
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
curl -s "http://localhost:3000/api/leaderboard?board=official"           # wallet-bound lane (empty until wallet-linked submissions arrive)
curl -s "http://localhost:3000/api/onchain/quote?symbol=TSLA"            # live official Chainlink price (W6)
curl -s "http://localhost:3000/api/candles?symbol=TSLA" | head -c 400    # seed.onchain verification block

# official-feed connection test — run inside the container (bun is not on the sandbox host):
#   docker compose -f docker-compose.base44.yml exec -T web bun scripts/verify-feeds.ts
# exit 0 = every published feed verified live · 1 = feed failure (data) · 2 = network unreachable
```

A dev-server response contains `turbopack` / `next-dev` markers and unhashed source
modules; the log line `Compiling / ... GET / 200 (compile: 3.8s)` confirms live source
rather than a prebuilt bundle.

## Checks (from CI)

```bash
docker compose -f docker-compose.base44.yml exec -T web sh -ec "bun run lint && bun test && bunx tsc --noEmit"
```

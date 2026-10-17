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
curl -s http://localhost:3000/api/forge/leaderboard                      # Signal Forge daily board (guest + official lanes)
curl -s http://localhost:3000/api/city/leaderboard                       # Chain City board (rank by city level; wallets masked)
curl -s "http://localhost:3000/api/city/save?wallet=0x…"                 # 404 when no city is saved; POST needs a wallet proof
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

## Alt-games lane (Signal Forge + Chain City) — additive only

The alternative products live beside the flagship and never touch `src/game/cc/**`:

- **Signal Forge** (`src/game/vg/`, `/forge`) — arena survival on the daily chart.
  Integrity core: `forge-token.ts` (HMAC run token) + `forge-board-validation.ts`
  (mutation/seed re-derivation + physical caps) + `forge-board-store.ts`
  (guest/official lanes, own collection). Board route `/api/forge/leaderboard`.
- **Chain City** (`src/game/city/`, `/city`) — economy city builder. Local save
  `cc_city_save_v1` (`game/city/persistence.ts`) + **server save v1**
  (`/api/city/save` + `/api/city/leaderboard`, `src/lib/city-save*.ts`). The
  server save is identity-proofed (`verifyCitySaveProof`) but is a convenience
  save, NOT a competitive-integrity gate — the city sim is client-side.
- **Chain City 3D (Phase V)** — `/city` renders through three.js
  (`@react-three/fiber`, orthographic isometric camera). The scene is a pure
  VIEW over the existing state layer: `game/city/engine.ts` + economy +
  persistence stay authoritative and were not changed. Renderer lives in
  `src/components/city/scene3d/`; the pure grid↔world / ray-picking / camera
  math is `game/city/math3d.ts`, unit-tested by `test/city-3d.test.ts`. The
  scene is dynamically imported with `ssr: false`, so three.js never enters the
  landing bundle. `game/city/render.ts` (the old 2D canvas path) is RETAINED —
  `components/city/GameplayWalkthrough.tsx` (the tutorial video) still renders
  through it.
  - Canvas gestures are driven by **pointer events** on the WebGL canvas
    (drag = pan, tap = place, wheel/pinch = zoom). A test harness that only
    dispatches `click` will not move the camera or place anything; dispatch
    `pointerdown`/`pointerup` at real coordinates instead.
  - Keep the orthographic camera's `near` POSITIVE: a negative near plane puts
    the picking ray's origin past the ground plane and every tap resolves to
    nothing.
- **Guilds** — `src/lib/guild-registry.ts` is the STATIC, operator-curated list.
  A `?guild=<code>` link tags a player (opaque metadata, same alphabet as the
  `?ref=` stamp) and a REGISTERED code applies a modest Chain City income buff
  (unregistered = tag only, buff 1.0). Append entries as guilds are onboarded.

Persistence stores (leaderboard / forge / city / weights) all fall back to
in-memory when `DATABASE_URL` is unset, so a restart clears them — useful for
clearing test rows during review.

## Marketing assets

The X trailer kit in `docs/assets/x-launch` (the 15s cuts `x-08`…`x-10`) is built by
`scripts/trailer` — see that folder's README. It runs on the sandbox **host**, not in the
container: `node scripts/trailer/build.mjs --out docs/assets/x-launch` (needs `ffmpeg` /
`ffprobe`, and Playwright's chromium from the repo's `node_modules`). The deterministic
timeline step shells into the web container itself. `scripts/trailer/` is the only `scripts/`
subtree that is not gitignored — see `.gitignore`.

`docs/` is not served by Next, so to watch or download the finished trailers during
review, copies of `x-08`…`x-10` (mp4 + poster) live in `public/media/` and open at
`/media/<file>` on the dev server. Re-copy them after a rebuild (see the kit README).

## Checks (from CI)

```bash
# NOTE: tsc MUST run with the incremental cache disabled — a stale
# tsconfig.tsbuildinfo can report a silently-passing false "clean" (observed
# 2026-10-10). The extra seconds are the price of a trustworthy gate.
docker compose -f docker-compose.base44.yml exec -T web sh -ec "bun run lint && bun test && bunx tsc --noEmit --incremental false"
```

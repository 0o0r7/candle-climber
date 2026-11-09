# Candle Climber — UI Etudes

Five isolated UI design mockups for the Candle Climber 2D climber game,
themed on a candlestick chart. **Design mockup only** — no game logic, no
backend, no network requests.

## Run

The Base44 sandbox serves this app on host port **3000** through
`docker-compose.base44.yml` (service `web`):

```bash
docker compose -f docker-compose.base44.yml up -d
# local:
bun install && bun run dev   # vite on 0.0.0.0:3000
```

## Architecture

- `plain React 19 + Tailwind CSS 4` on Vite. No Next.js, no providers, no
  Sentry/analytics/font requests — the whole page is client-side and makes no
  fetch/XHR calls (so the browser Network tab shows only same-origin module
  loads from the Vite dev server).
- `src/lib/synthetic.ts` — `mulberry32(1337)` random walk, 60 OHLC candles,
  0–100 "Altitude" axis. The single shared array feeds all five etudes, so
  every reload renders the identical chart.
- `src/lib/color.ts` — WCAG relative-luminance contrast maths used by etude 3
  (ratios are computed at runtime from the exact tokens displayed).
- `src/components/StageFrame.tsx` — the fixed 800×480 game viewport. The shell
  scales it with a CSS transform on narrow screens; the stage itself never
  reflows.
- `src/etudes/*` — the five etudes. Etude 4 gates every animation behind
  `data-motion="reduced"` (manual toggle or `prefers-reduced-motion`), which
  removes animations and transitions with `!important` rules. Etude 5 keeps
  each parallax layer wider than the frame by its own clamp (`bleed`) so the
  layers can never slide out of the 800×480 frame.

## Verify

```bash
bun run typecheck
# preview checks: reload twice → identical chart; Network tab → no requests
# owned by the app; tabs reachable by Tab/arrow keys; etude 5 slider extremes
# leave no gap at either stage edge.
```

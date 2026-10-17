# X (Twitter) Launch Asset Kit — captured from LIVE production

Captured **2026-10-06** against `https://candle-climber.vercel.app/?renderer=v2`
(today's chart: `DOGEUSDT · 2026-10-06`, mutation `CANDLE RAIN`, weather `STORM · CLEAR`,
provenance badge **REAL FEED**). Driven by a headless-browser player bot mirroring
`scripts/e2e-gamer-bot.ts` (variable jump bursts + RUSH, death-retry). **Unretouched
captures — no edits, no fake numbers.**

## Files

| File | What it shows | Use for |
|------|---------------|---------|
| `x-01-ready-desktop-1920x1080.png` | Ready screen: title, REAL FEED badge, today's chart, START CLIMB | Reply images, quote tweets, docs |
| `x-02-gameplay-desktop-1920x1080.png` | Mid-run: score 15, `+15` float, green/red candle rails | **Pinned-tweet screenshot candidate** |
| `x-03-liquidated-card-desktop-1920x1080.png` | LIQUIDATED card, score 115, streak ×3, PB 123 | "death is the content" angle |
| `x-04-ready-mobile-1170x2532.png` | Mobile ready screen incl. PERSONAL BEST | Mobile audience / quote tweets |
| `x-05-gameplay-mobile-1170x2532.png` | Mobile mid-run, score 80, wreckage visible | Mobile audience |
| `x-06-gameplay-clip-1280x720.mp4` | 29s real gameplay: boot → climb (+15/+29) → LIQUIDATED → retry → climb again | **Pinned-tweet video (X converts natively, H.264 faststart)** |
| `x-07-gameplay-loop-800px.gif` | 5s loop: climb → LIQUIDATED reveal | **The pack's literal ask: "یک اسکرین‌شات یا GIF"** |
| `x-08-trailer-15s-crumble.mp4` | 15s produced trailer — hook: a red candle collapses under the player at 0.45s, then the climb runs temperate → desert → storm into the end card | **Primary X trailer (attach to the launch / quote tweet)** |
| `x-09-trailer-15s-leap.mp4` | Same 15s body, alternate hook: opens at the takeoff of a long leap | Hook A/B test |
| `x-10-trailer-15s-storm.mp4` | Same 15s body, alternate hook: the storm front slams in at 0.8s, climb exits into the winter | Hook A/B test |
| `x-08…x-10-*-poster.jpg` | Poster frame of each trailer | Static/thumbnail post |

## Seeing / downloading them

`docs/` is not served by the app, so the kit files are not reachable from the dev
server. The three trailers (`x-08`…`x-10`, mp4 + poster) are therefore **also copied
into `public/media/`** — the one folder Next serves — where each one opens and plays
directly at `/media/<file>` and can be saved from the browser. Same bytes, so git
stores them once. Re-copy after a rebuild:
`cp docs/assets/x-launch/x-0*-trailer-15s-*.{mp4,jpg} public/media/`.
The rest of the kit is viewable on GitHub on this branch.

## Recommendation for the pinned tweet (WICK-LAUNCH-FORM-PACK §4)

- Primary: attach **`x-07-gameplay-loop-800px.gif`** (matches the pack line exactly) or
  **`x-06-gameplay-clip-1280x720.mp4`** (29s, autoplay-friendly, shows the loop).
- Text stays exactly as written in the pack (230 chars). Do NOT add monetary-value
  claims around the assets (ECONOMY-LAWS / pack §8 red lines).
- If replying with a screenshot instead, use `x-02` (desktop) or `x-05` (mobile).

## The 15s X trailer (`x-08`…`x-10`) — produced 2026-10-11

Built to the session's creative strategy (gameplay from the first frame, one idea per video,
legible with sound off, three hooks to test — **not** a trim of `x-06`).

- **1600×960 (5:3)** — the game's native view (`VIEW_W × VIEW_H` in `src/game/cc/engine.ts`),
  so there is no letterboxing and no gameplay is cropped; the biome HUD chip stays in frame.
- **Encode:** 25fps H.264 High, CRF 18, `yuv420p`, AAC 192k / 48kHz, `+faststart`. ~4.4–4.6MB each.
- **Footage:** the landing page's own deterministic bot demo
  (`src/components/landing/demo-pilot.ts`, seed `2025-06-15SHOWCASE`) recorded headless and
  isolated to the canvas. The demo's "BOT PLAYING" badge is hidden at capture time (capture
  overlay only — the app is untouched). No score, candle or biome is faked or embellished;
  unlike `x-01`…`x-05` this is a **produced** asset, not an unretouched capture.
- **Cut placement:** windows are set on the demo's loop timeline (30s loop). The build finds the
  loop seam in the take automatically (the demo fades to the frame colour across it) and refuses
  to cut if the take runs short; every cut is then checked frame-for-frame against the master at
  its in-point.
- **Reproduce:** `node scripts/trailer/build.mjs --out docs/assets/x-launch` — see
  [`scripts/trailer/README.md`](../../../scripts/trailer/README.md).
- **Audio:** generated procedurally with the demo soundtrack's instruments — a transient on
  frame 0, a riser into every weather change, gameplay sfx on the action timeline, and a
  cadence landing with the end card. True peak ≈ −1 dBFS (AAC may overshoot ~0.5dB).
- **Text:** the game's own copy in the game's mono HUD style — "RED CANDLES CRUMBLE" /
  "GREEN CANDLES HOLD" (how-to-play card labels, matching the on-screen action),
  "THE WEATHER FOLLOWS THE MARKET", "THE TERRAIN IS THE CHART"; end card = wordmark +
  the site's line "READ THE CHART. DON'T FALL." + "NEW CHART EVERY DAY · 00:00 UTC".
  No URL (nothing is hosted yet) and no monetary claim.
- **Test one hook per post** and compare watch-through / completion, not impressions.

## Reproduction

`agent-browser` (Chrome 154 headless) + `record start/stop`; MP4 = H.264
`yuv420p crf21 faststart`; GIF = 12fps, 800px, bayer-dither palette. Raw driving
logic preserved in this session's scripts; repo-side bot remains
`scripts/e2e-gamer-bot.ts` (CI-runnable, artifact-producing).

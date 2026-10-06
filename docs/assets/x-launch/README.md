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

## Recommendation for the pinned tweet (WICK-LAUNCH-FORM-PACK §4)

- Primary: attach **`x-07-gameplay-loop-800px.gif`** (matches the pack line exactly) or
  **`x-06-gameplay-clip-1280x720.mp4`** (29s, autoplay-friendly, shows the loop).
- Text stays exactly as written in the pack (230 chars). Do NOT add monetary-value
  claims around the assets (ECONOMY-LAWS / pack §8 red lines).
- If replying with a screenshot instead, use `x-02` (desktop) or `x-05` (mobile).

## Reproduction

`agent-browser` (Chrome 154 headless) + `record start/stop`; MP4 = H.264
`yuv420p crf21 faststart`; GIF = 12fps, 800px, bayer-dither palette. Raw driving
logic preserved in this session's scripts; repo-side bot remains
`scripts/e2e-gamer-bot.ts` (CI-runnable, artifact-producing).

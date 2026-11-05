# SHOWCASE-COPY.md — canonical copy of the `/showcase` variant

Source: Framer canvas text dump (439 texts, deduplicated across the three breakpoints
Desktop/Tablet/Phone — the dump repeats each section 3×). Compiled 2026-11-05.
This file is the content source of truth for the Next.js port. English, verbatim.

Items marked (≈) had ambiguous section placement in BFS order; confirm on canvas when porting.

## Shell

Ticker (honest facts, rotating):
- BROWSER PLATFORMER · FREE TO PLAY · NO WALLET
- WEATHER ZONES ON THE WAY UP
- Holdings never affect score, physics or rank. Skill is the only edge.

Navigation links: How it plays · Trailer · Daily chart · Modes · Compete · $WICK · Play free

Footer: brand + tagline · columns Play / Learn / Follow (X, GitHub) ·
"© 2026 Candle Climber · Testnet build" · "Nothing here is financial advice. Holdings never affect score or rank."

## Hero

- Kicker: BROWSER PLATFORMER · FREE TO PLAY · NO WALLET
- H1: The chart is the level.
- Body: Every candle is a ledge. Green ones hold. Coral ones crumble a beat after you land. Read the route, time the jump and reach the top of today's chart.
- Buttons: Play today's chart → https://candle-climber.vercel.app/play · Watch the trailer → #trailer
- Art: dawn key art (see FRAMER-VARIANT.md §4)

## Stats strip (4 stats)

- 0.26s — until a coral candle gives way
- ×7 — maximum combo multiplier
- +25% — score while you Rush
- 00:00 — UTC · new chart, worldwide

## 01 · HOW A CHART BECOMES A LEVEL (`#how-it-plays`)

- H2: Every candle is a promise. Some keep it.
- Body: Candle Climber turns market candlestick data into climbing terrain. You never trade a thing — you read the shapes the market drew, and climb them.
- Rule cards:
  - Green holds — Up-candles are solid ground. Land, breathe, line up the next jump.
  - Coral crumbles — Down-candles give way about a quarter-second after you land. Don't stand still.
  - Tap to jump. Hold to soar. — Tap or press Space to hop. Hold for a higher arc when the next ledge sits out of reach.
  - Shift to Rush — Speed the climb up for +25% score. Chain clean landings to stack combos up to ×7.
- Key-cap labels: LAND · 0.26 SEC · TAP · SPACE · SHIFT

## 02 · TRAILER (`#trailer`)

- H2: Three cuts. Fifteen seconds each.
- Body: The leap, the crumble and the storm — short cuts of the climb. They loop silently here; open the big one to watch with sound.
- Tiles: LEAP · 0:15 (large, controls) · CRUMBLE · 0:15 · STORM · 0:15 (silent loops)

## 03 · THE DAILY CHART (`#daily`)

- H2: One chart. Everyone. Every day.
- Body: At 00:00 UTC a new deterministic chart drops — the same candles, gaps and traps for every player on Earth. The only variable left is you.
- Clock card: NEXT CHART DROPS AT — 00:00 — UTC · IDENTICAL FOR EVERY PLAYER
- Archive note (≈): Missed a day? Rehearse past charts in Archive practice.
- Daily mutation label: DAILY MUTATION — Each chart wakes up in one of six moods.
- Mutation chips: Clean · Low Liquidity · Whale Hour · High Volume · Paper Hands · Rain
- Weather zones (≈ intro line "WEATHER ZONES ON THE WAY UP"):
  ZONE 01 Temperate · ZONE 02 Desert · ZONE 03 Storm · ZONE 04 Tundra

## 04 · MODES (`#modes`)

- H2: Pick a market. Climb its shape.
- Body: Three modes, three kinds of terrain. Every chart is labeled real, derived or synthetic, so you always know what you're standing on.
- Mode cards:
  - 01 Crypto — Around-the-clock markets make for spiky, restless terrain.
  - 02 Stocks — Session-based charts with their own rhythm of climbs and drops.
  - 03 Launchpad — Fresh-launch charts with almost no history to lean on.
- Graduation band: SUMMIT · GRADUATION — Reach the top and you Graduate. —
  Clear a chart's summit to unlock World 2 — where every point counts double.

## 05 · LIQUIDATED

- H2: Fall off the chart? You're Liquidated.
- Body: Every run ends with a Death Card — a 1080 × 1350 snapshot of your chart, score, streak and the candle that betrayed you. Post it, beat it, or keep it as a testnet collectible.
- Example caption: EXAMPLE CARD · HISTORICAL RUN
- Fact bullets:
  - A share-ready card after every run
  - Optional testnet mint — no monetary value
  - Retry the same chart until it gives

## 06 · COMPETE (`#compete`)

- H2: Race ghosts. Duel friends. Out-climb the bot.
- Body: Everyone climbs the same daily chart, so every run is comparable. Bring a rival — or let one find you.
- Feature tiles:
  - Ghosts — Chase the line of a strong run, replayed right beside you.
  - Duels — Send a friend the same chart and settle it head to head.
  - Rival bot — A bot climbs with you, so there's always someone to beat.
  - Archive practice — Rehearse past daily charts at your own pace.
- Boards:
  - GUEST BOARD — Play instantly. — No wallet, no sign-up. Jump in and your run lands on the guest board.
  - OFFICIAL BOARD — Make it count. — Connect a wallet to bind your runs to one official identity for seasons.
- Fair-play note (≈): Holdings never affect score, physics or rank. Skill is the only edge.

## 07 · $WICK · TESTNET (`#wick`)

- H2: Here's the honest part.
- Body: Candle Climber has a testnet token and testnet collectibles. You should hear exactly what they are — and what they aren't — from us.
- Cards (violet accents):
  - Testnet only. — $WICK and Death Cards live on a test network. They have no monetary value.
  - Weights, not promises. — Season participation is tracked as airdrop weights. Nothing is promised, and nothing here is financial advice.
  - Skill is the only edge. — Holding $WICK never changes your score, your physics or your rank. Free players climb the same chart.

## Closing CTA

- Kicker: YOUR MOVE
- H2: Your first ledge is green.
- Body: No download. No wallet. Just today's chart and one good jump.
- Buttons: Play → https://candle-climber.vercel.app/play · Follow on X → https://x.com/Candle_Climber
- Art: duo art (see FRAMER-VARIANT.md §4)

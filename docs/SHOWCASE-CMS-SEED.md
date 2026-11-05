# SHOWCASE-CMS-SEED.md — CMS collections created for the Framer site

Created 2026-11-05 via the Framer API. Regular (user-editable) collections, visible in
the Framer CMS panel. **Not yet wired to any page** — wiring is a visual-phase task.
Content is sourced exclusively from verified page copy and game docs (no invented facts).

Free-plan cap = 2 collections → the site is AT CAP. Adding another collection requires
removing one or upgrading the plan.

## Collection 1 — FAQ (id `bxIpCFzQg`)

Fields: `Question` (string), `Answer` (string). Slug prefix: `faq/`.

| Slug | Question | Answer |
| --- | --- | --- |
| what-is-candle-climber | What is Candle Climber? | A browser platformer that turns market candlestick data into climbing terrain. You never trade a thing — you read the shapes the market drew, and climb them. |
| is-it-free | Is it free? Do I need a wallet? | Yes — free to play, no wallet, no sign-up. Jump in and your run lands on the guest board. |
| daily-reset | When does the daily chart change? | At 00:00 UTC a new deterministic chart drops — the same candles, gaps and traps for every player on Earth. The only variable left is you. |
| six-moods | What are the six daily moods? | Each chart wakes up in one of six moods: Clean, Low Liquidity, Whale Hour, High Volume, Paper Hands and Rain. |
| three-markets | What are the three markets? | Three modes, three kinds of terrain. Every chart is labeled real, derived or synthetic, so you always know what you are standing on. |
| summit | What happens when I reach the top? | You Graduate. Clearing a chart's summit unlocks World 2 — where every point counts double. |
| liquidated | What happens if I fall? | You are Liquidated. Every run ends with a Death Card — a 1080 × 1350 snapshot of your chart, score, streak and the candle that betrayed you. |
| combo-rush | How high can combos go? | The maximum combo multiplier is ×7, and Rush adds +25% score while you Rush. |
| compete | Can I compete with friends? | Everyone climbs the same daily chart, so every run is comparable. Race ghosts, duel friends, or out-climb the bot. Connect a wallet to bind your runs to one official identity for seasons. |
| wick | What is $WICK? | Candle Climber's testnet token, launched on the Vibe Launchpad on October 5. Holding $WICK never changes your score, your physics or your rank — free players climb the same chart. |

## Collection 2 — Glossary (id `zEMlmfazK`)

Fields: `Term` (string), `Definition` (string). Slug prefix: `glossary/`.

| Slug | Term | Definition |
| --- | --- | --- |
| ledge | Ledge | Every candle is a ledge. Green ones hold. Coral ones crumble a beat after you land. |
| liquidated | Liquidated | What happens when you fall off the chart. Every run ends with a Death Card. |
| death-card | Death Card | A 1080 × 1350 snapshot of your chart, score, streak and the candle that betrayed you. Post it, beat it, or keep it as a testnet collectible. |
| graduate | Graduate | Clear a chart's summit and you Graduate — unlocking World 2. |
| world-2 | World 2 | The world beyond the summit. Every point counts double. |
| rush | Rush | A boost that adds +25% to your score while it lasts. |
| combo | Combo | Your score multiplier during a run — the maximum combo multiplier is ×7. |
| guest-board | Guest Board | Where instant, no-wallet runs land. |
| official-board | Official Board | Where wallet-bound runs live — one official identity for seasons. |
| daily-mutation | Daily Mutation | Each chart wakes up in one of six moods — a new one every day at 00:00 UTC. |

## Wiring plan (visual phase — not done yet)

1. FAQ section on `/showcase`: CMS Collection List, suggested position after the $WICK
   section, before the closing CTA. Paper surface, accordion or two-column Q/A list,
   CC Label kicker ("FAQ"), H2 suggestion: "Straight answers."
2. Glossary: lighter treatment — optional glossary chips in the Daily Chart section
   (tooltip or drawer), or a two-column list on a future "Learn" page.
3. Rules: CMS is static content only — it must never replace the game backend or any
   live market/score data. Copy edits must keep obeying `docs/TRUTH-TABLE.md`.
4. After wiring, republish (preview → confirm) and re-verify the live URLs.

## Re-seeding

The canonical content is the two tables above (this file is the source of truth).
The seeding script lives in the assistant workspace (`scripts/framer-lab/framer-cms.mjs`)
and is idempotent by slug; items can also be edited by hand in the Framer CMS panel.

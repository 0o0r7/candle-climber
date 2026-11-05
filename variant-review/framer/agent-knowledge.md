# Candle Climber — Integrated Agent Knowledge (single source of truth)

Compiled: 2026-11-05 · Sources: agent-history.md (Framer agent transcript, 768 lines),
candle-climber-visual-dna-review.md, candle-climber-product-design-brief (2).md,
live API verification via framer-api@5.1.0 (scripts/framer-lab/).
Purpose: survive context summarization — re-read this file before any Framer/repo work.
REPO MIRROR: the owner-facing subset lives in the repo as docs/FRAMER-VARIANT.md,
docs/SHOWCASE-COPY.md, docs/SHOWCASE-CMS-SEED.md (drop-in package at
/home/z/my-project/download/repo-docs/, commit instructions in its README-COMMIT.md).
This sandbox file remains the fuller internal version (IDs, session details).

## A. Project identity
- Candle Climber — browser precision-platformer, "The chart is the level."
- Repo: github.com/0o0r7/candle-climber · Live game: candle-climber.vercel.app (play at /play)
- $WICK: testnet token, launched Oct 5 on Vibe Launchpad (ID 5963). Death Cards = testnet collectibles, no monetary value.
- Framer account currently "James Thomas" — transfer to owner pending.
- Homepage "How to Play" animation is NOT a video: game engine + automated pilot, ~30s showcase chart (temperate→desert→storm→snow), never submits competitive scores.

## B. Framer project structure (verified IDs)
- Project: https://framer.com/projects/Conscientious-One--Si4IQzQk3I5omL4EIbaz-d46fO
- Pages: Home `augiA20Il` (/; Desktop `WQLkyLRf1`, Phone `kwELhivdk`), Showcase `UcmYss1RX` (/showcase).
- `/relaunch` (SqpSzDwzi): REMOVED from canvas; live-404 after publish 9bf2301b5 (2026-11-05).
- Showcase section order: Hero (dawn art, "The chart is the level.") → Stats strip (0.26s crumble · ×7 combo · +25% Rush · 00:00 UTC) → How It Plays (4 rule cards) → Trailer (Leap large w/ controls; Crumble+Storm silent loops) → Daily Chart (clock card 00:00, archive note, 6 mutation chips, 4 weather zones: Temperate/Desert/Storm/Tundra) → Modes (Crypto/Stocks/Launchpad + Graduation band w/ victory art) → Liquidated (chaos art 14% opacity, Death Card tilted −4°, "Example card · historical run") → Compete (Ghosts/Duels/Rival bot/Archive; Guest & Official boards; fair-play note) → $WICK (3 violet-accent testnet cards) → Play CTA ("Your first ledge is green.", duo art 600px).
- Shell: ticker strip (honest facts) + sticky CC Navigation + footer ("© 2026 Candle Climber · Testnet build", "Nothing here is financial advice. Holdings never affect score or rank."). Template: "CC Site Shell". Breakpoints: 1200 / 810 / 390.
- CC Button variants: Lime (primary), Ink, Ghost, Outline — each with hover/tap states.
- Tokens added by agent: Paper rgb(239,235,225), Paper Raised rgb(248,246,240), Ink Muted rgb(62,68,72), Paper Line rgba(16,18,20,0.12). Existing: Base/Ink f66e3fa0-ec45-46ec-b4f5-19b5ccc58c66, Surface f75f9e48-35b8-4177-97cf-4106b7a07060, Hairline 443a462f-d020-4c3f-acf6-69a62d00a38f, Lime 2ffe5046-5485-423b-984e-7768742b5a2e, Up Green cbb6d786-26d9-47e9-bcb0-9ad846d4e1f0, Down Coral f70148c3-8d19-4bd0-b36c-ec84ac1ef6b1, Violet 43749910-93a1-419e-8a51-c7b4e7655a03, Text Primary 0bfb47c7-bd5d-4c9e-9f3f-7a9af83cd14e, Text Muted 8edf40e5-c2c4-451a-a3bd-e2283a847e9c.
- Text styles: CC Display 88px, CC H2/H2 Ink 56, CC H3/H3 Ink 24, CC Body/Body Ink 18, CC Body S/S Ink 16, CC UI/UI Ink 16 w500, CC Label/Label Ink (mono 12 uppercase lime), CC Stat 40, CC Mega 136, CC Small/Small Ink (mono 13). All with medium/small breakpoint sizes. No Inter, no duplicate presets.
- Fonts: Clash Display (display) · Instrument Sans (UI) · JetBrains Mono (labels/numbers).
- Icon sets: Lucide `Y7SpbVH16cWqMhj75z1M`, Logos `rTgCpOIUH6tdiqNh47fL` (has "X", "Github").
- Video component: module:lRDHiNWNVWmE0lqtoVHP/I6H5ZhUPA8PwvfVPIGXQ/Video.js:Video — controls $control__srcType "URL", srcUrl, posterEnabled, poster, loop, muted, playing, objectFit, controls. ($control__borderRadius and $control__backgroundColor are preset-only.)
- Trailer videos (verified embedded + live):
  - Leap: https://framerusercontent.com/assets/qNxG50HA0gKpuJMfKQbRp8LU6U.mp4
  - Crumble: https://framerusercontent.com/assets/59ABnbB5PDwKlF6Zo4RCqnJ0M.mp4
  - Storm: https://framerusercontent.com/assets/fQXLwaKcxl6yix6m5BEbZVZ6QFo.mp4
- Verified art (base https://raw.githubusercontent.com/0o0r7/candle-climber/main/):
  - Hero: assets/branding/keyart-dawn-ascent.png
  - Victory: assets/branding/hero-video-frame-2-victory.png · Chaos: hero-video-frame-1-chaos.png
  - Death Card example: assets/branding/candle-climber-120.png (historical score 120 — NEVER present as live data)
  - Duo: assets/branding/duo-bull-and-hare-ascent.png · Logo: assets/branding/logo-c-candle-neon-icon.png
  - Posters: public/media/x-09-trailer-15s-leap-poster.jpg, x-08-…-crumble-poster.jpg, x-10-…-storm-poster.jpg
  - 26 mascot sheets: assets/mascot/ (multi-pose sheets, NOT isolated cutouts)

## C. Hard content constraints (must hold in ALL copy — from agent, confirmed by owner docs)
1. Play is free and needs no wallet.
2. Holdings never affect score, physics or rank.
3. Never promise rewards or profit. Say "weights", never "earn" or "guaranteed".
4. Always state testnet status. $WICK and Death Cards have no monetary value.
5. Keep real / derived / synthetic data labels honest.
6. Don't bring back character selection (deliberately retired).
7. Green = up / hold, Coral = down / crumble. Never swap.
8. Don't invent lore for the companion; don't imply a companion mechanic.
9. Historical share card (score 120) is an example only, never live data.

## D. Visual DNA (owner-pack review, 49 stills)
- Mascot Wick: oversized square head, cream/sand shell, teal-green rectangular faceplate, black square eyes, small dark mouth; two upright dark projections with lime bands (+ shorter central one in some versions); chunky segmented limbs, dark hands/soles, green chest badge, orange/brown backpack. Beveled cuboid "constructed toy" feel — NOT flat pixel art.
- Small companion rides backpack/shoulders; carries overt excitement/alarm/humor. Roles complement: Wick composed, companion expressive.
- Sheets vary in proportions/projections/colors — select one coherent version per composition; the orange-toned excited cutout differs from cream-bodied refs; check real transparency before placing PNGs; some art has baked-in text (neon-night has headline) — never layer conflicting live text on top.
- Logo: stepped extruded C-shape topped by rising candlestick; neon icon w/ prismatic edges; keep decorative icon ≠ small clean nav mark; never place whole sample sheets as a logo.
- World grammar: charts = 3D pillars/stairs/cliffs; green terrain ascends, red breaks into cubic fragments; green/coral semantics must stay legible even in richer promo lighting.
- Moods = distinct narrative states: dawn ascent (calm), liquidation chase (red threat behind, green path ahead), neon-night leap (cyan streaks), chaos hero (dense red storm), victory (light, upward, particles). Don't mix palettes across UI.
- Gameplay character (dark, lime eyewear) ≠ promotional mascot (cream/teal explorer). Keep distinct; show real gameplay near promo art.
- DECIDED (owner followed agent recommendation): duo-led storytelling for brand moments; Wick solo for guidance moments; C-candle logo for navigation/compact; some screens mascot-free. "A small, determined duo against a world built from the market."
- Interface rule: UI stays quieter than posters — buttons, provenance labels, scores and testnet notices must remain readable; keep established numeric typography.

## E. Product brief essentials
- Modes: Crypto, Stocks, Launchpad. Deterministic daily chart (00:00 UTC) = common terrain. Loop: read → climb → combo → liquidated/summit → retry, compete, share.
- Surfaces: landing, how-to-play, ready/HUD/pause/tutorial, liquidation + graduation results, Death Card share + optional testnet NFT proof, guest/official competition, seasons, duels, ghosts, practice/archive, achievements, predictions, stats, participation weights/airdrop info, partner charts/application, privacy/terms.
- Audiences (inferred, need owner confirmation): casual short-challenge players; competitive PB/rank/ghost/duel players; market-aware crypto community; token projects applying for partner charts.
- Observations: chart-to-platform transformation shown too late (esp. mobile); mobile landing long (repeated cards, big gaps); partner page visually inconsistent with landing; Death Card loop under-prominent on landing.
- Opportunity proposals (not approved edits): earlier chart→platform demo; one clear entry action; Wick+terrain+liquidation as signature; unified surfaces; result screen as retry/share/compete moment; keep honesty labels.

## F. State after my API session (2026-11-05, publish 9bf2301b5)
- API capability verified: framer-api agent DSL (SET link.href, DEL, add/update/remove nodes), regular Collections (createCollection + addFields + addItems), publish (preview → confirm_publish with confirmationHash).
- Fixed live: home X links ×4 (Ho2lZJq0b, CFGwPq37a + phone replicas) → https://x.com/Candle_Climber. Showcase CTAs were already correct (9× vercel.app/play live).
- Deleted junk "1Password" icons: apaOiWhdP, eA12r3J68, m372Y1Vf8 — ALL GONE (canvas-level; no republish needed).
- CMS created (user-editable, NOT yet wired to any page): FAQ `bxIpCFzQg` (10 items: what-is-candle-climber, is-it-free, daily-reset, six-moods, three-markets, summit, liquidated, combo-rush, compete, wick) — fields Question/Answer. Glossary `zEMlmfazK` (10 items: ledge, liquidated, death-card, graduate, world-2, rush, combo, guest-board, official-board, daily-mutation) — fields Term/Definition. All copy sourced from verified page/game facts. Free-plan cap = 2 collections → now AT CAP.
- Live verified: /relaunch → 404; home X links correct; showcase healthy.
- Countdown card ("NEXT CHART DROPS AT 00:00 UTC") is honest-by-design (daily reset), static; optional upgrade later: live ticking clock via code component.
- Trailers: real mp4s embedded; owner should do playback check; gameplay recordings are an owner asset need.

## G. Open decisions / next steps
1. Agent's unanswered question to owner: make Showcase the homepage, or migrate Home+Relaunch onto the new design? (Relaunch page no longer exists — moot for it.)
2. Repo port: rebuild /showcase as Next.js route in 0o0r7/candle-climber (content from this file + canvas dump), deploy Vercel, then domain decision. My recommendation: port showcase as the new site, keep old home until parity.
3. CMS wiring (visual phase): CMS Collection List section (FAQ first) on showcase.
4. Custom domain + Framer plan → removes "Made in Framer" badge.
5. Transfer Framer account "James Thomas" → owner.
6. Then: revoke both API tokens (figd_… and fr_…) per standing security rule.

## H. Related projects in the same topic (context only — do not mix up)
- Candle Current (github.com/0o0r7/candle-current): deliberate variant of Candle Climber (three-lane current map, signal boat). Vercel project creation got HTTP 403 — pending team permission. Docs: VARIANT-ANALYSIS/DESIGN/COMPARISON-MATRIX/TEAM.md.
- LOOPBACK (github.com/0o0r7/loopback-game): 4×4 signal-routing puzzle. V0 tokenless; $PATCH = [UNVERIFIED — NEEDS OWNER INPUT]. Docs: ECOSYSTEM-STUDY/GAME-CONCEPT/ALTERNATIVE-CASE/TEAM.md.
- "CandleClimber" (github.com/eduardobrandao08/CandleClimber, dev "le-brando"/Eduardo Brandão): an UNRELATED Reddit/Devvit clone analyzed earlier in the topic for a Base44 clean-room build. NOT part of $WICK/Candle Climber ecosystem.
- BTRIO (Builder Trio Index): separate live project; intro message to Justine (@Jinz02) finalized earlier.

## I. Flip session record (2026-11-05, owner-delegated decision)
Owner delegated "make Showcase the homepage" to the agent. Result: DEFERRED to the
Next.js port — Framer hard-blocks every path-based route on this plan:
- `SET <WebPageNode> path` on the HOME page → "Cannot apply `path` to `home pages`".
- Taking "/" with another page while home is there → "A page with this path already exists" (no auto-transfer).
- `addRedirects` → "Current plan does not include redirects" (paid feature).
- DSL `DEL` on a WebPageNode → unsupported ("Remove or replace the page contents instead").
- SDK `setAttributes({ draft })` WORKS (only publish-exclusion lever); unpublishing the
  home page is refused until another page becomes home ("The home page must remain published").
- SDK lesson: node refs go STALE after canvas writes (`Cannot clone an unknown node`,
  `Can not set attributes on unknown node`) — always `framer.getNode(id)` fresh per op.
- `WebPageNode.clone({ path })` WORKS → the net win: full home clone published live as
  **/demo** (preserves the automated-pilot demo; visual QA passed at 1200px, zero page errors).
Scripts: scripts/framer-lab/framer-flip{,-resume,-v3,-v4,-v5}.mjs, framer-state-check.mjs,
framer-visual-qa.mjs. Final live state: `/` old home · `/demo` home clone · `/showcase`
new design · `/relaunch` 404. The "true flip" = Next.js port (repo docs/FRAMER-VARIANT.md §1a).

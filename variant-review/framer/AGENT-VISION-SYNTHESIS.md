# AGENT-VISION-SYNTHESIS — Framer Agent (Conscientious One / Candle Climber)
> Compiled 2026-11-05 from: agent-history.md, candle-climber-visual-dna-review.md,
> candle-climber-product-design-brief.md + live API probes (framer.agent.getContext / getSystemPrompt / branches).
> Purpose: supervising debug/completion of the /showcase page. READ-ONLY phase.

## 0. Vision statement (agent's own)
"A small, determined duo against a world built from the market."
Duo-led storytelling, restrained solo guidance, logo-led navigation. (Owner delegated the solo/duo decision to the agent.)

## 1. Design system as built
- Palette model: sections ALTERNATE warm "Paper" and dark "Ink". Lime = accent. Violet = testnet notes ONLY. Green=up / Coral=down never swapped.
- NEW tokens created by agent: Paper rgb(239,235,225), Paper Raised rgb(248,246,240), Ink Muted rgb(62,68,72), Paper Line rgba(16,18,20,0.12).
- REUSED existing project tokens (uuid): Base/Ink f66e3fa0-ec45-46ec-b4f5-19b5ccc58c66, Surface f75f9e48-35b8-4177-97cf-4106b7a07060, Hairline 443a462f-d020-4c3f-acf6-69a62d00a38f, Lime 2ffe5046-5485-423b-984e-7768742b5a2e, Up Green cbb6d786-26d9-47e9-bcb0-9ad846d4e1f0, Down Coral f70148c3-8d19-4bd0-b36c-ec84ac1ef6b1, Violet 43749910-93a1-419e-8a51-c7b4e7655a03, Text Primary 0bfb47c7-bd5d-4c9e-9f3f-7a9af83cd14e, Text Muted 8edf40e5-c2c4-451a-a3bd-e2283a847e9c.
- Fonts: Clash Display / Instrument Sans / JetBrains Mono (project also contains Inter — deliberately UNUSED by agent; "old duplicate presets" = junk to clean).
- Shaders: NONE used (Current Site Shaders: [] — 18 available incl. liquid-gradient, pixels, blockify...).
- CC Button: variants Lime (primary, ink label) / Ink (paper label) / Ghost (light border) / Outline (dark border) + hover & tap states. Two border-only variants flagged by linter for lacking opaque fill (by design, pending review).
- CC Navigation: Desktop 1200×68 (brand + How it plays/Trailer/Daily chart/Modes/Compete/$WICK + "Play free") — smooth-scroll to /showcase#anchors; Phone 390×64 (links opacity 0, menu icon); Phone Open drawer (bars rotate to X). SET_VARIANT toggles.
- CC Site Shell layout template: ticker strip (honest facts) + sticky nav (z5) + content placeholder + footer (brand, tagline, Play/Learn/Follow columns, legal rows "© 2026 Candle Climber · Testnet build" + "Nothing here is financial advice. Holdings never affect score or rank.").
- Type scale: CC Display 88 / CC H2 (Ink) 56 / CC H3 (Ink) 24 / CC Body (Ink) 18 / CC Body S 16 / CC UI (Ink) 16 w500 / CC Label (Ink) Mono 12 uppercase lime / CC Stat 40 / CC Mega 136 / CC Small (Ink) Mono 13. Breakpoint sizes for medium+small. Link style: CC Link · Dark.
- Build execution 9d0bf05b-0687-4820-b67a-49d2aca92d89 changed 663 nodes, yielded during final rect/screenshot step. Agent stored ID map in its INTERNAL KV "ccShowcaseIds" — CONFIRMED not node plugin data, not reachable via public SDK → must re-derive IDs by walking canvas (names→ids).

## 2. Showcase page structure (top→bottom)
Hero (dawn art fill 760px, copy left, Ink "Play today's chart" + Outline "Watch the trailer"→#trailer) → Stats Strip (4col: 0.26s / ×7 / +25% / 00:00) → How It Plays (paper; 4 rule cards w/ candle diagrams: Green holds, Coral crumbles, Tap/Hold jump arc, Shift to Rush) → Trailer (ink; Leap large left 2fr 458px w/ controls; Crumble+Storm right stacked 221px muted loop autoplay w/ posters) → Daily Chart (surface; clock card "00:00" + archive note; 6 mutation chips: Clean/Low Liquidity/Whale Hour/High Volume/Paper Hands/Rain; 4 weather zones: Temperate/Desert/Storm/Tundra) → Modes (paper; Crypto/Stocks/Launchpad + dark Graduation band 380px w/ victory art) → Liquidated (ink; chaos backdrop 14% opacity; example Death Card tilted −4°, caption "Example card · historical run"; "Go get Liquidated" btn) → Compete (paper; Ghosts/Duels/Rival bot/Archive practice + GUEST/OFFICIAL board cards + fair-play note) → $WICK (ink; 3 violet-accent honest cards: Testnet only / Weights not promises / Skill is the only edge) → Play CTA (paper; "Your first ledge is green." + duo art 600px).
Breakpoints: Desktop 1200 / Tablet 810 / Phone 390. Grid collapses: rules 4→2→1, hud 4→2, modes 3→1, compete 4→2→1, wick 3→1, zones 4→2, muts 2. Paddings ≈80px tablet, ≈64×20 phone. Hero copy full-width on small, reel vertical.

## 3. Assets actually embedded
- Videos (framerusercontent.com/assets): Leap qNxG50HA0gKpuJMfKQbRp8LU6U.mp4 · Crumble 59ABnbB5PDwKlF6Zo4RCqnJ0M.mp4 · Storm fQXLwaKcxl6yix6m5BEbZVZ6QFo.mp4 (agent could NOT playback-verify — user must).
- Art (raw.githubusercontent.com/0o0r7/candle-climber/main/): assets/branding/keyart-dawn-ascent.png (hero), hero-video-frame-2-victory.png, hero-video-frame-1-chaos.png, candle-climber-120.png (death card example), duo-bull-and-hare-ascent.png, logo-c-candle-neon-icon.png; posters public/media/x-{08,09,10}-trailer-15s-*-poster.jpg; 26 mascot sheets assets/mascot/ (multi-pose sheets, NOT isolated cutouts).
- Gameplay diagrams built from frames: candle Wick/Body/Offset compositions + small dark blockbot with lime visor.

## 4. Agent's hard copy constraints (9 rules, all copy must hold)
1) Free play, no wallet. 2) Holdings never affect score/physics/rank. 3) Never promise rewards/profit; say "weights", never "earn"/"guaranteed". 4) Always state testnet; $WICK & Death Cards no monetary value. 5) Real/derived/synthetic labels honest. 6) Character selection stays retired. 7) Green=up, coral=down, never swap. 8) No invented companion lore/mechanic. 9) Score-120 card is example only, never live data.

## 5. Known node IDs
Home page augiA20Il (Desktop WQLkyLRf1, Phone kwELhivdk) · Showcase UcmYss1RX · /relaunch SqpSzDwzi (agent left untouched; owner later deleted → status "removed", pending re-publish) · Junk 1Password icons: eA12r3J68, m372Y1Vf8, apaOiWhdP (agent deferred removal).
Hero image node jroXZD5e4; hero texts to contrast-check: slcJH11f8, Uxhk3e4Ky, UOKrypy59.

## 6. Account/platform facts
Account persona: James Thomas (userId 340e20b1-0fe7-4baa-ac69-023f2df63b9a — same as sole contributor UUID). TZ America/New_York. Single branch "main". Agent platform: DSL-based applyChanges with mandatory diagnostics-fix loop; strategies recreation/creation/edit (showcase = creation); publish via agent.publish; clarification rounds w/ decisionContext; auto reset-rule on "I don't like it".

## 7. Open items (agent's own deferred list + mine)
1. ★ UNANSWERED AGENT QUESTION: "Make Showcase the homepage, or move Home/Relaunch onto this new design?" (Relaunch now deleted → question reduces to: Showcase→home? shell applied to Home?)
2. Remove 3 junk 1Password icons; organize new styles/components into folders.
3. Clean old duplicate Inter text styles.
4. Verify hero image text contrast (see §5 ids).
5. Review 2 border-only button variants (Ghost/Outline).
6. USER TASK: playback-check the 3 trailer MP4s.
7. Check template/page fixed-pixel breakpoint heights.
8. Verify phone nav drawer + Logo/Menu overlap at 390px.
9. Countdown "00:00" is a designed static card — decide: live countdown code component later, or keep static (consider rewording).
10. Shared analytics/ticker/motion QA (ticker effect, smooth scroll) across breakpoints.

## 8. Corrections to my earlier recon report (2026-11-05)
- Fonts ARE on-direction (Clash Display/Instrument Sans/JetBrains Mono) — earlier screenshot-based guess ("different family") was wrong.
- Trailer videos are REAL embedded MP4s w/ posters (not placeholders) — only playback unverified.
- Countdown was deliberate design, not an accident.
- Linter overlap warnings mostly stale per agent (desktop verified in screenshots); phone nav overlap was real, agent claims fixed — re-verify.
- CMS: zero collections (recon + agent docs agree). "Made in Framer" badge seen on canvas screenshot — re-check plan/domain at publish time.

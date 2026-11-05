# FRAMER-VARIANT.md — Showcase variant: state, structure, and open work

Status doc for the Framer-built `/showcase` landing variant of Candle Climber.
Compiled 2026-11-05 from the Framer agent transcript, live Framer API verification
(`framer-api` agent DSL + CMS + publish), and live-site checks.
Contains no credentials. Live URL: https://candle-climber.framer.website/showcase

Provenance: the variant was built by a Framer agent session (owner-approved creative
delegation) after a product/design research pass (`candle-climber-product-design-brief`)
and a visual-DNA pass over the restored owner pack (49 stills: mascot, branding, posters).

## 1. Current state (publish 2026-11-05 ~11:12 UTC, after the homepage-flip attempt)

- Live pages: `/` (original dark home, unchanged), `/showcase` (new variant, light
  paper/ink editorial design) and `/demo` (full canvas clone of the original home,
  published as the preserved "how it plays" demo page). `/relaunch` (an earlier
  abandoned variant attempt) was removed from the canvas and is **404 on production**.
- Working tree (canvas) == published state after the flip-attempt session.
- `/showcase` was checked live: all 9 game CTAs point to `https://candle-climber.vercel.app/play`,
  internal anchors work (`#trailer`, `#daily`, `#modes`, `#how-it-plays`, `#compete`, `#wick`).

### 1a. Homepage-flip attempt — outcome and platform constraints (2026-11-05)

Owner delegated the technical decision ("make Showcase the homepage") to the agent.
Four approaches were executed; all path-based routes are **hard-blocked by Framer**:

1. `WebPageNode.clone({ path })` + `remove()` of the original — `clone()` works, but
   SDK node references go stale after canvas writes (`Cannot clone an unknown node`);
   page `remove()` is unreachable through this API surface. Re-fetch fresh refs per op.
2. Agent DSL `SET <page> path="..."` on the home page — rejected: *"Cannot apply `path`
   to `home pages`."* The home page's path is immutable.
3. Taking `/` with the showcase page while home sits there — rejected: *"A page with
   this path already exists."* No automatic home transfer.
4. `framer.addRedirects({ from: "/", to: "/showcase" })` — rejected: *"Current plan
   does not include redirects."* Redirects are a paid-plan feature.

Also learned: `DEL` on a `WebPageNode` is unsupported via DSL (*"WebPageNode deletion
is not supported. Remove or replace the page contents instead."*); draft-toggling via
SDK `setAttributes({ draft })` works and is the only publish-exclusion lever. Unpublishing
the home page is refused until a different page becomes home.

**Decision recorded:** the flip is deferred to the Next.js port (repo phase 2), where
`/` is a plain route with full control and zero Framer credits. The `/demo` clone is the
net win of the attempt: the original home (incl. the automated-pilot demo) stays available
at a stable URL while `/showcase` remains the design of record.

## 2. Page structure

Shared shell "CC Site Shell" (applied to Showcase):
- Top ticker strip: honest facts, continuously moving.
- Sticky `CC Navigation` (desktop 1200×68 / phone 390×64 with menu drawer): brand mark +
  links — How it plays, Trailer, Daily chart, Modes, Compete, $WICK — plus "Play free" button.
- Footer: brand + tagline, three link columns (Play / Learn / Follow, X + GitHub),
  legal row: "© 2026 Candle Climber · Testnet build" and
  "Nothing here is financial advice. Holdings never affect score or rank."

Sections (in order, anchors as used by nav):
1. **Hero** — dawn key art, "The chart is the level.", Play + Watch-the-trailer buttons.
2. **Stats strip** — 0.26s crumble · ×7 combo · +25% Rush · 00:00 UTC daily drop.
3. **How It Plays** (`#how-it-plays`, paper) — 4 rule cards with candle diagrams:
   Green holds / Coral crumbles / Tap to jump. Hold to soar. / Shift to Rush.
4. **Trailer** (`#trailer`, ink) — Leap large with controls; Crumble + Storm silent loops.
5. **Daily Chart** (`#daily`, surface) — clock card "00:00 UTC", archive note,
   6 daily-mutation chips, 4 weather-zone cards (Temperate, Desert, Storm, Tundra).
6. **Modes** (`#modes`, paper) — Crypto / Stocks / Launchpad cards with silhouettes +
   Graduation band (victory art): summit unlocks World 2, double points.
7. **Liquidated** (ink) — chaos backdrop at 14% opacity, Death Card example tilted −4°,
   caption "Example card · historical run."
8. **Compete** (`#compete`, paper) — Ghosts / Duels / Rival bot / Archive practice tiles,
   GUEST BOARD + OFFICIAL BOARD cards, fair-play note.
9. **$WICK** (`#wick`, ink) — three violet-accent testnet-honesty cards.
10. **Play** (paper) — "Your first ledge is green." + Play / Follow-on-X + duo art.

Breakpoints: Desktop 1200 / Tablet 810 / Phone 390 (template-driven). All sections
verified in screenshots at all three sizes by the building agent.

## 3. Design system

- Concept: "A small, determined duo against a world built from the market."
- Surfaces alternate warm **paper** (light) and **ink** (dark). Lime is the only accent;
  violet appears ONLY on testnet notes; green = up/hold, coral = down/crumble (never swapped).
- Tokens added: Paper `rgb(239,235,225)`, Paper Raised `rgb(248,246,240)`,
  Ink Muted `rgb(62,68,72)`, Paper Line `rgba(16,18,20,0.12)`.
- Existing project tokens reused: Base/Ink, Surface, Hairline, Lime, Up Green, Down Coral,
  Violet, Text Primary, Text Muted (color styles in the Framer project).
- Fonts: **Clash Display** (display), **Instrument Sans** (UI), **JetBrains Mono** (labels/numbers).
  No Inter, no duplicate presets.
- Text styles: CC Display 88 / CC H2 56 / CC H3 24 / CC Body 18 / CC Body S 16 / CC UI 16 w500 /
  CC Label (mono 12, uppercase, lime) / CC Stat 40 / CC Mega 136 / CC Small (mono 13) —
  each with medium/small breakpoint sizes.
- Components: `CC Button` (Lime / Ink / Ghost / Outline, hover + tap states),
  `CC Navigation` (desktop / phone / phone-open), shell template with ticker/nav/footer.
- Icon sets: Lucide, Logos ("X", "Github").

## 4. Reused assets (canonical repo paths)

Base: `https://raw.githubusercontent.com/0o0r7/candle-climber/main/`
- Hero: `assets/branding/keyart-dawn-ascent.png`
- Victory band: `assets/branding/hero-video-frame-2-victory.png`
- Chaos backdrop: `assets/branding/hero-video-frame-1-chaos.png`
- Death Card example: `assets/branding/candle-climber-120.png` (historical run, score 120 —
  example only, never present as live data)
- Duo art: `assets/branding/duo-bull-and-hare-ascent.png`
- Logo: `assets/branding/logo-c-candle-neon-icon.png`
- Trailer posters: `public/media/x-09-trailer-15s-leap-poster.jpg`,
  `x-08-trailer-15s-crumble-poster.jpg`, `x-10-trailer-15s-storm-poster.jpg`
- Mascot sheets: `assets/mascot/` (26 multi-pose reference sheets — select coherent
  versions per composition; they are not isolated cutouts)

Trailer videos (embedded in Framer, self-hosted by Framer CDN):
- Leap: `https://framerusercontent.com/assets/qNxG50HA0gKpuJMfKQbRp8LU6U.mp4`
- Crumble: `https://framerusercontent.com/assets/59ABnbB5PDwKlF6Zo4RCqnJ0M.mp4`
- Storm: `https://framerusercontent.com/assets/fQXLwaKcxl6yix6m5BEbZVZ6QFo.mp4`

## 5. Fixes applied on 2026-11-05 (via Framer API, published in `9bf2301b5`)

1. Home X links fixed: two frames ("Share Button", "X Link", desktop + phone replicas)
   pointed at bare `https://x.com/` → now `https://x.com/Candle_Climber`.
2. Removed all three leftover template junk icons named "1Password" that the building
   agent had flagged (`apaOiWhdP`, `eA12r3J68`, `m372Y1Vf8`) — canvas-level, no page impact.
3. Published: `/relaunch` removal shipped → live 404. Zero errors, zero warnings.
4. CMS seeded (see `SHOWCASE-CMS-SEED.md`): FAQ (10 items) + Glossary (10 items) —
   user-editable regular collections, not yet wired to any page.
5. Verified CTAs were already correct (`vercel.app/play`) — no change needed.
6. The "NEXT CHART DROPS AT 00:00 UTC" clock card is honest by design (daily reset at
   00:00 UTC); it is static. Optional future upgrade: live ticking clock code component.

## 6. CMS

- `FAQ` — fields: Question, Answer. 10 items sourced from verified page/game facts.
- `Glossary` — fields: Term, Definition. 10 items.
- Free-plan cap is 2 collections → **at cap**; adding more requires a plan change or
  removing one.
- Wiring plan (visual phase): render FAQ via a CMS Collection List section on Showcase
  (suggested position: after $WICK, before final CTA) and/or a Glossary drawer in the
  Daily Chart section. CMS must never replace the game backend (it is static content only).

## 7. Framer API capabilities verified (for future automation)

- `framer-api` (agent API, `connect(projectURL, token)`): read nodes, agent DSL
  (`SET <id> link.href="…"`, `DEL <id>`, add/update/remove nodes; every command ends with `;`),
  `replaceText`, CMS (createCollection/addFields/addItems), publish flow
  (`{action:"preview"}` → `confirmationHash` → `{action:"confirm_publish",…}`).
- The personal access token does NOT authorize the REST `api.framer.com/web/v1` endpoints
  (401) — everything goes through the SDK/agent API.
- Canvas edits do not affect the live site until publish; canvas-level junk removal
  needs no publish.

## 8. Known remaining items

- "Made in Framer" badge: removed only by custom domain / plan upgrade (platform, not page).
- Framer account currently belongs to "James Thomas" — transfer to the owner is pending.
- Owner should do a playback check of the three trailers in Framer preview
  (the building agent and later tooling could not watch MP4 playback).
- `Examples.tsx` template code file still exists (harmless, unused; can be deleted in editor).
- Two button variants (Ghost/Outline) have non-opaque fills by design — intentional.
- Stale-measure lint warnings (overlaps) were re-checked by the building agent: not real
  overlaps at desktop; re-verify only if sections are edited.

## 9. Open decisions (owner)

1. Make `/showcase` the homepage of the Framer site, or port it to the repo first?
2. Repo port plan (agreed direction): rebuild `/showcase` as a Next.js route in
   `0o0r7/candle-climber` using this doc + `SHOWCASE-COPY.md` as the content source,
   deploy to Vercel, then decide the domain/brand split. Keep the old home until parity.
3. Custom domain + Framer plan (kills the badge) and account transfer.
4. After the work wraps: revoke the two personal API tokens used for automation
   (Framer PAT + Figma PAT) — standing security rule; never stored in the repo.

## 10. Content laws

All copy on the variant obeys the project's truth rules (see `docs/TRUTH-TABLE.md`,
`docs/ECONOMY-LAWS.md`): free play needs no wallet; holdings never affect score, physics
or rank; "weights" never "earn/guaranteed"; testnet status always stated; $WICK and Death
Cards have no monetary value; real/derived/synthetic labels stay honest; character
selection stays retired; green=up, coral=down.

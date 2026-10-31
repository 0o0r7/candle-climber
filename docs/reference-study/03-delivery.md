# 03 — Delivery

**Delivered:** 2026-10-31 · branch `conduct-reference-study`
**Shape of the work:** the study (`01-observations.md`) found that the reference project
built the *play* loop and never built the *place*: no URL for its level, no artifact a
player could hand to another player, a listing page left as template boilerplate, 96
builds and 2 installs. This delivery gives our level the address it was missing, and puts
the crowd on it.

Everything below was implemented in this repo, is running in the sandbox preview, and is
labelled by how far each claim was verified.

---

## 1. What shipped

### 1.1 `/chart` and `/chart/[date]` — the chart is a place

A public page per UTC day:

- **The day** as the page title (`/chart/2026-10-31`), with an eyebrow that states
  TODAY or ARCHIVE and `UTC`.
- **The level, named by the feed**: the ticker, the daily mutation and its tagline are
  rendered by `ChartDay` from the *one* response the game itself uses
  (`/api/candles?pool=crypto` for today, `/api/candles?date=…` for an archive day).
- **The terrain as a poster**: `ChartPoster` draws the served candles (green up, coral
  down, wicks, faint grid) on the product palette — the shareable face of the level.
- **Honest provenance**: the badge is `provenanceLabel(seed.source)` — `REAL FEED · BTC`,
  `ON-CHAIN · TSLA` or `SYNTHETIC FALLBACK` — never a hand-written "live".
- **The call to play** deep-links to that exact chart: `/play?mode=crypto` today,
  `/play?date=…&mode=crypto` for an archive day.
- **Share**: `SHARE THIS CHART` (Web Share where available) and `COPY LINK`; when the
  browser denies the clipboard the URL is revealed **already selected** in a read-only
  field (observed working in the headless preview, where the clipboard is blocked).
- `/chart` redirects to today (`307` → `/chart/<today>`), so a nav link or a share never
  has to know the date.

**Design decision worth reviewing:** the server deliberately does **not** compute the
day's ticker or mutation. ` /api/candles` picks today's symbol at request time from live
24h tickers (`selectDailySymbol`) and only falls back to the seeded rotation, so a
server-side heading would print a ticker the level does not use — measured here: the pure
rotation predicted `ETHUSDT` for 2026-10-31 while the live level served `BTCUSDT`. The
page therefore server-renders only what is feed-independent (the day, the crowd, the CTA,
the labels) and lets the client name the level from the response. `src/lib/day-chart.ts`
carries that reasoning, and `test/day-chart.test.ts` pins the validation around it.

### 1.2 `/api/field` + `src/lib/field.ts` — the crowd

"Where the crowd stopped" for one day, as a distribution rather than a table:

- `summarizeField(rows)` (pure, no I/O, no clock): count, median candles, p90,
  best, fixed comparable bands (`0–10`, `10–25`, `25–50`, `50–100`, `100–200`, `200+`)
  and **the wall** — the band where the most climbs end.
- `GET /api/field?date=&interval=&board=` exposes exactly that (lane-scoped, rate-limited,
  `Cache-Control: s-maxage=30`), with `top` (3 names) for the page.
- The page shows: 4 stat tiles, the wall sentence ("Most climbs on this chart ended
  between candle 25 and 50."), a six-band bar chart, and the top three.

**Rules it obeys:** one named lane per read (`guest` by default, `official` on request —
`board=all` is refused, never blended, per `ECONOMY-LAWS` LAW 1.2); guest rows are
labelled self-reported and unverified in the page footer; an unreachable store renders
"the field is unreachable right now", **never** "no climbs yet" (a distinct third state).

### 1.3 Link previews

`opengraph-image.tsx` for `/chart/[date]`: a 1200×630 card with the day, the one-line
mechanic, the crowd numbers and the canonical URL. It degrades to a card without numbers
if the store does not answer — never to invented numbers. (Deliberately no ticker, for
the same reason as §1.1.)

### 1.4 Entry points

- Landing nav: `TODAY'S CHART` (between FEATURES and PARTNERS).
- In-game footer: `today's chart` (next to `leaderboard`).
- `sitemap.ts`: `/chart` added.

### 1.5 Bug found and fixed on the way (pre-existing, not part of the feature)

While verifying, the page reported an empty field while `/api/field` reported five
climbs. Cause: `getBoard()` memoised the in-memory store in a **module-scoped**
variable, and the dev server compiles pages and route handlers into separate module
graphs — so one process had two stores. This affected the existing `/leaderboard` page
too (it read a different empty store than the API). Fixed by pinning the store instances
on `globalThis` (the same pattern the candles route already uses for its anchor cache).
Production is unaffected (Mongo is shared by nature); the dev/preview environment now
behaves like production.

---

## 2. Verification — what was actually run

| Check | How | Status |
| --- | --- | --- |
| `summarizeField` + `resolveDay` contracts (15 tests: empty lane, malformed rows, nearest-rank percentiles, band coverage, wall rule + tie rule, future/impossible/pre-archive dates) | `bun test test/field.test.ts test/day-chart.test.ts` in the container | **PASS** (15/15) |
| Whole-repo typecheck | `bunx tsc --noEmit --incremental false` in the container | **PASS** (exit 0) |
| Lint | `bun run lint` in the container | **PASS** — 0 errors, 21 pre-existing warnings (none in new files) |
| `/chart` redirects to today | `curl -o /dev/null -w "%{http_code} %{redirect_url}"` | **PASS** (`307` → `/chart/2026-10-31`) |
| Today page renders and names the level | live preview: clicked the new nav link, waited for the feed, read the DOM | **PASS** — `BTCUSDT`, `REAL FEED · BTCUSDT`, `HIGH VOLUME`, `219 1w candles`, poster canvas 760×300, window move +229.8% |
| The field renders real numbers | seeded five climbs through the **real** `POST /api/leaderboard` path (valid run token + nonce), then loaded the page: 5 climbs / median 31 / p90 140 / best 140, wall "25 and 50", six bands, top three rows | **PASS** |
| `COPY LINK` gesture | clicked in the preview; clipboard denied → fallback field appears with the URL and it is selected | **PASS** (fallback path; the success path was not exercised because the headless browser denies the clipboard) |
| Mobile layout | `setViewport('mobile')` on the page: horizontal overflow = 0 px | **PASS** |
| Archive day page | `curl /chart/2020-03-16` → 200 with `ARCHIVE`, "practice only, never scored", archive CTA; and `/chart/2099-01-01` → 404 | **PASS (HTML-level)** — the archive page's *visual* render was **not** captured: the preview verification budget ran out first |
| Link preview image | `curl -D -` on `/chart/<today>/opengraph-image` → `200 image/png`, 54 934 bytes (after fixing a Satori layout error found in the dev log) | **PASS** |
| Test data cleaned up | restarted the web service (in-memory store) → `/api/field` `count: 0`, page shows the empty state, `/leaderboard` shows "no runs recorded here yet" | **PASS** |

**Not automatically verified:** signing in / wallet flows (untouched), the Web Share
sheet on a real phone, and the archive page's visual render (HTML assertions only).
The link preview was verified as a valid PNG response, not eyeballed for design.

---

## 3. What I deferred, and why

| Deferred | Reason |
| --- | --- |
| **Devvit / Reddit port** (play inside a post, like the reference) | The reference's one genuine strength, but it is a second stack, a human review queue and a subreddit — a distribution decision for the owner, not a feature branch. |
| **Crowdsourced death map** (where, not how high, players die) | Needs a new persisted field on the scoring path — i.e. touching the anti-cheat surface for a nice-to-have. The score-derived "wall" delivers most of the insight with none of that risk. |
| **Weekly recap page** | Trivial once `/chart/[date]` exists; not worth doubling the surface in one turn. |
| **Skin shop / coins** (the reference's economy) | Contradicts "skill, not spend" and `ECONOMY-LAWS`; a currency sink is not a hook. |
| **Character selection** | Explicitly retired by the owner (`RETIRED-FEATURES` R-1). Not touched. |
| **Per-symbol metadata titles** | Would require a second server-side symbol resolution that can drift from the level — the exact bug avoided in §1.1. |

## 4. Known limitations

1. The field is **guest-lane only** on the page. Official (wallet-proven) climbs remain on
   `/leaderboard`; the page says so rather than blending lanes.
2. In a memory-store deployment the field resets on restart — same limitation the
   leaderboard already documents; with `DATABASE_URL` set, both read the same Mongo
   board.
3. An archive day's ticker is whatever today's selector resolves for that date (existing
   `/api/candles` behaviour, pre-existing and unchanged); the page reports it verbatim
   instead of pretending a historical ticker was chosen.
4. The naming collision with the reference app (`apps/candle-climber`, `r/CandleClimber`)
   is a brand problem, not a code problem. Recorded in `01-observations.md` §5.

## 5. Files

**New**

- `docs/reference-study/01-observations.md`, `02-proposals.md`, `03-delivery.md`
- `src/lib/field.ts` — pure crowd statistics
- `src/lib/day-chart.ts` — pure day validation (and the "why no server symbol" record)
- `src/app/api/field/route.ts` — lane-scoped crowd read
- `src/app/chart/page.tsx` — `/chart` → today
- `src/app/chart/[date]/page.tsx` — the day page
- `src/app/chart/[date]/opengraph-image.tsx` — link preview
- `src/components/chart/ChartDay.tsx`, `src/components/chart/ChartPoster.tsx`
- `test/field.test.ts`, `test/day-chart.test.ts`

**Changed**

- `src/lib/leaderboard-store.ts` — store singletons pinned on `globalThis` (bug fix, §1.5)
- `src/components/landing/Navbar.tsx`, `src/components/cc/GameCanvas.tsx` — entry points
- `src/app/sitemap.ts` — `/chart`
- `src/app/globals.css` — `.cc-chart-*` styles (appended, nothing rewritten)

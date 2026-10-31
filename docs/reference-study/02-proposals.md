# 02 — Proposals

**Inputs:** the independent study in `01-observations.md` (external only), then — and
only then — this repository's own documents (`docs/GAME_DESIGN.md`, `TRUTH-TABLE.md`,
`ECONOMY-LAWS.md`, `RETIRED-FEATURES.md`, `FEEDS.md`, `ART-DIRECTION.md`) and its code.

**One-line diagnosis carried over from the study:** the reference project built the
*play* loop and never built the *place*. It had no URL for its level, no artifact a
player could hand to another player, and a listing page that said "Devvit React
Starter". 96 builds, 2 installs. We already win on the harder half — real data as
terrain, one shared daily level, death as content — but our core object, **the day's
chart**, also has no address of its own. This proposal set is about giving it one, and
about making it show the crowd.

---

## What I adopt, adapt, and reject from the reference

| Reference behaviour | My call | Why |
| --- | --- | --- |
| One-sentence pitch that explains mechanic *and* joke ("Jump candles, avoid shorts, reach the moon!") | **Adopt the discipline, not the words.** Our hero already carries "the chart is the level"; every new surface must repeat the mechanic in one breath. | The pitch was the best thing on their listing. |
| Plays inline where people already are (a Reddit post) | **Reject for now.** Porting to Devvit means a second runtime, a review queue and a subreddit — a distribution strategy, not a feature. Recorded as a deferred option, not smuggled in. | Scope discipline; also our identity is a standalone site. |
| Coin → skin shop | **Reject.** A currency sink is not a hook; our ladder is skill + proof, and `ECONOMY-LAWS` forbids pay-for-score anyway. | Their shop cannot be the reason a stranger stays. |
| Runs on mobile without install | **Already ours.** No action. | Verified: touch controls exist in the engine. |
| No leaderboard, no daily level, no share artifact | **Ours is ahead.** Protect it: every new surface must *expose* what we already compute rather than invent a parallel system. | Avoids duplicate social layers. |
| Boilerplate listing / dead demo link | **Adapt as a rule:** a surface a stranger lands on must be designed like a feature — real content, real metadata, real link previews. | This is the concrete failure I could verify (2 installs). |

---

## P0 — "The chart is a place": a public day page at `/chart/[date]`

**Problem.** The level — the only object in this product that is identical for every
player on earth and different every day — has no URL. Today you can share
`/play?date=2024-11-04&mode=crypto` (the game after a modal) or a Death Card PNG (after
you've already played). A bystander who receives either cannot *see* the chart; they
land in a game they were not ready for. Meanwhile `/leaderboard` answers "who", and
nothing answers "what was today's mountain".

**Opportunity.** One page per UTC day: the day's symbol, its mutation, the actual candle
terrain drawn as the poster it is, the crowd's numbers, and one button that puts you on
that exact chart. That is a link anyone can post, an indexable page per day (a content
machine that builds itself from data we already have), and a preview card that renders
in a chat client.

**What it adds.** A canonical shareable address for the product's core object; a
non-player entry point that does not begin with a tutorial modal; a reason for the
`?date=` archive to exist publicly; and the surface on which the crowd layer (P1) and
the link preview (P2) live.

**Honesty constraints (from `TRUTH-TABLE`).** The page must show the provenance the API
actually returned (`REAL FEED · BTCUSDT` vs `SYNTHETIC FALLBACK`), never a hand-written
"live" label. Past days must be labelled archive/practice terrain (they are unscored by
design), so a visitor is not told they can set a leaderboard score on 2020-03-16.

## P1 — "The field": show where the crowd stopped

**Problem.** Our game is single-player with a global board. A stranger cannot tell
whether 340 points is heroic or embarrassing, and a returning player only ever sees the
top of the table — the three names above them — never the shape of the crowd they are
competing with. The reference's loop was purely private: coins in, skins out, nothing
social emitted.

**Opportunity.** We already store `candlesPassed` on every scored run. Turn that into a
distribution: how many climbs today, the median height, the 90th percentile, and **the
wall** — the band of candles where the most runs end ("most climbs die between candle
25 and 49"). That single line is a challenge, a joke, and a benchmark, and it is
derived from data we already hold; no new writes, no schema change, no anti-cheat
surface.

**What it adds.** Social proof without fake social; a concrete goal that is reachable
("beat the median today") for a player who will never be #1; a screenshot-able,
quotable line; and a second reason to open the day page tomorrow.

**Honesty constraints.** Guest rows are self-reported and unverified — the block says so
in the same breath, exactly like `/leaderboard` does. Lanes never mix (`ECONOMY-LAWS`
LAW 1.2): the distribution is computed on **one** named lane (guest) and labelled as
such; no blended number is presented as a board.

## P2 — Link previews for the day page

**Problem.** The study's most concrete failure was a product page nobody designed. A
shared day link that unfurls as a grey box repeats that failure in miniature.

**Opportunity.** A generated 1200×630 preview card per day: symbol, date, mutation,
median and top score. Typographic, on our palette, with the candle motif — computed
from the same numbers the page shows.

## P3 — Share affordances wired into the product (small, but it is the whole point)

**Problem.** A page nobody links to does nothing. The reference promoted a Twitch
recording that 404s; we should not promote surfaces we do not wire.

**Opportunity.** A `TODAY'S CHART` entry in the landing nav and in the in-game footer,
plus copy/native-share buttons on the day page that hand out the canonical URL with a
measurable `?ref=`-compatible link (the existing `shareUrl()` helper is the precedent).

---

## Original ideas considered, and why they are not in this delivery

| Idea | Verdict | Reason |
| --- | --- | --- |
| **Reddit/Devvit port** (play inside a post, like the reference) | Deferred | Real opportunity — it is literally the reference's one strength — but it is a second stack plus human review; it belongs to a distribution decision the owner must make, not to a feature branch. Documented as the top deferred item. |
| **Crowdsourced death map** (where, not how high, players die) | Deferred | Needs a new persisted field on the score path — a data-integrity change to the anti-cheat surface. The score-derived "wall" delivers ~80% of the insight with 0% of that risk. |
| **Weekly auto-recap page** ("the week in candles") | Deferred | Depends on the same day-page primitive; trivial to add once `/chart/[date]` ships, and not worth doubling this turn's surface. |
| **Skins/coin shop** | Rejected | Contradicts "skill, not spend" and the economy laws. |
| **In-page mini-game on the landing** | Rejected | `HowToPlay` already ships a bot-played demo of the real engine; a second, fake playable would be worse than the real thing one click away. |
| **Naming collision with the reference** | Noted | Both products are "Candle Climber" (`apps/candle-climber`, `r/CandleClimber`). We cannot out-name it; we can out-*specify* it. Not something a code change fixes today. |

---

## Delivery order

1. `src/lib/field.ts` — pure crowd statistics + tests (no I/O, no clock).
2. `GET /api/field` — the honest, lane-scoped read.
3. `/chart/[date]` (+ `/chart` → today) — the page, the poster, the crowd block, share.
4. `opengraph-image` — the preview card.
5. Entry points: nav, in-game footer, sitemap.
6. Documentation: `03-delivery.md`, plus the claims this work makes added to the
   truth-table discipline.

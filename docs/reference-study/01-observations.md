# 01 — Independent study of the reference project

**Date of study:** 2026-10-31
**Study method:** direct HTTP retrieval from the sandbox, the Reddit developer portal's
own embedded page payload, the public Twitch API, and the Devvit documentation site.
No pre-existing analysis or design documents from this workspace were read before
writing this file (Phase 1 rule).

Every paragraph below is tagged with one of:

- **[VERIFIED]** — I retrieved it myself and can point at the artifact.
- **[INFERRED]** — a conclusion I drew from verified facts; could be wrong.
- **[NOT ACCESSIBLE]** — the source refused this sandbox; nothing is claimed about it.

---

## 0. Access log (what actually worked)

| Source | Result |
| --- | --- |
| `https://developers.reddit.com/apps/candle-climber` | **[VERIFIED]** HTTP 200, full HTML retrieved (~364 KB) |
| `https://www.reddit.com/r/CandleClimber/` | **[NOT ACCESSIBLE]** HTTP 403 — "blocked by network security" (bot wall) |
| `https://www.reddit.com/r/WebGames/comments/1pid3a8/` | **[NOT ACCESSIBLE]** HTTP 403 (thread page, `.json`, `api.reddit.com`, `embed.reddit.com`, `redditmedia.com` all 403) |
| `https://www.reddit.com/user/le-brando/` | **[NOT ACCESSIBLE]** HTTP 403 (same wall) |
| `https://www.twitch.tv/videos/2639883802` | Page shell loads (HTTP 200) but carries no video data; Twitch's public GraphQL returns `video(id:"2639883802") = null` and `user(login:"le-brando") = null` → **[VERIFIED] the VOD is not retrievable**, so **[NOT ACCESSIBLE]** as gameplay evidence |
| `https://developers.reddit.com/docs` and ~8 doc pages | **[VERIFIED]** readable (intro-games, community-engagement playbook, launch guide, featuring guide, redis, payments, launch screen, GameMaker quickstart, hackathon winners blog) |

Blocked-mirror attempts (all failed): `old.reddit.com`, `r.jina.ai` proxy,
`redlib.catsarch.com` (429), `redlib.perennialte.ch` (Cloudflare), `safereddit.com`
(503), `libreddit.privacydev.net` (502), `reddit.nerdvpn.de` (protocol error),
`api.pullpush.io` archive API (522). A DuckDuckGo HTML query returned a 202 challenge
page with no results.

**Consequence:** the *discussion* half of the brief (player replies, subreddit
activity, dev profile, stream commentary) is genuinely unavailable to me. What I do
have is the developer's own listing and post **titles + first-line snippets** surfaced
by a web search index. Everything about player sentiment in this document is therefore
either **[NOT ACCESSIBLE]** or explicitly **[INFERRED]** from indirect signals, never
quoted.

---

## 1. What the project is

### 1.1 The listing, verbatim

The app detail page ships its own metadata as HTML attributes and an embedded payload.
Retrieved values **[VERIFIED]**:

- `appName` / `slug`: `candle-climber`
- `appDescription` (the one-line pitch shown on the listing):
  **"Can you beat the market? Jump candles, avoid shorts, reach the moon!"**
- `installCount`: **2**
- `owner`: `le-brando` (`t2_6wm2ym1x`), `isEmployee: false`
- `createdAt`: **2025-11-25T11:31:31Z**
- latest version: **0.0.2**, uploaded **2025-12-03T17:42:58Z**, `buildStatus: 1`
- `versionsCount`: **96**
- `appIcon`: empty string
- The **Readme** tab is the untouched `Devvit React Starter` boilerplate: "A starter to
  build web applications on Reddit's developer platform", with the template's own
  `npm create devvit@latest --template=react` install instructions, Vite/React/Express/
  Tailwind/TypeScript blurbs, and a Cursor/`devvit-mcp` section.

So: a real, published-but-unlisted Devvit app, publicly reachable, version 0.0.2,
with a stock template README and no icon. **[VERIFIED]**

### 1.2 What the game is, in the developer's own words

From the three launch posts (titles + snippets only — bodies were blocked)
**[VERIFIED as snippets]**:

- r/WebGames, `1pid3a8`: *"Candle Climber - A browser game that runs inside Reddit
  posts"* — *"Made a vertical scroller that runs natively on Reddit using their Devvit
  platform. No downloads, plays directly in the post. Pilot a rocket through green
  candles, dodge red ones, collect coins. Has a shop with skins and mobile/…"*
- r/playmygame, `1picvh7`: *"Candle Climber - Rocket game that runs directly inside
  Reddit"* — *"Vertical scroller that runs directly inside Reddit posts using Devvit -
  no downloads needed. Pilot a rocket through candlestick patterns, dodge red candles
  and shorts, collect coins. Trading/meme stock themed. Features a shop with unlockable
  skins, mobile…"*
- r/IndieGaming, `1pid01y`: *"Made my first game - runs directly inside Reddit, no
  download needed"*
- r/Devvit, `1pic7ib`: *"Shipped my first Devvit game - looking for feedback"* —
  *"Candle Climber, a vertical scroller where you pilot a rocket through green candles,
  dodge red ones, and avoid shorts. Inspired by meme stock…"*

Reconstructed core loop **[VERIFIED as description, not as played experience]**:

1. Vertical **endless scroller**; you fly a rocket upward (auto-scrolling or
   upward-thrust — the posts say "vertical scroller", not how input works).
2. **Green candles** are the safe corridor (you fly *through* them).
3. **Red candles** are obstacles. **"Shorts"** are a second hazard class (a
   finance pun — short sellers trying to push the price down).
4. **Coins** are collectibles.
5. A **shop** sells **unlockable rocket skins** bought with coins.
6. Runs **inline inside a Reddit post** via the Devvit web view — no install, no
   download, no external site.
7. Built mobile-first-ish: "mobile/…" (mobile + probably desktop keyboard) is called
   out in the pitch.

### 1.3 What is *not* claimed anywhere in the accessible material

No mention of: leaderboards, daily seeds, seasons, streaks, achievements, multiplayer,
ghost replays, wallet/web3, real market data feeds, sound/music, tutorial, accessibility
options, or monetization. **[VERIFIED absence in accessible text]** — this is absence
in a three-line pitch, not proof the app lacks these, but a three-line pitch that
mentions a skin shop and mobile support while omitting competition is a strong signal
about what the author considers the product. **[INFERRED]**

---

## 2. How it is built (platform-level, from the docs)

Nothing here is specific to this app — the app page's README confirms the Devvit React
starter stack — but these are the mechanics a Devvit game lives inside **[VERIFIED from
docs]**:

- **Devvit Web** lets you ship a normal web app (React, Phaser, Three.js…) inside
  Reddit. Client/server split: a Node process (Express in the starter) handles Reddit
  API calls and storage; a `webview` bundle renders the game.
- **Redis** is the storage primitive: strings, hashes, sorted sets (the documented
  leaderboard primitive), numbers, bitfields, transactions. Notably **no plain
  sets/lists**. **5 MB per request, 5 GB per installation**, and — crucially —
  **Redis is namespaced per installation (per subreddit)**, so cross-community data
  needs an external service reached through `fetch`. There is no "list all keys" scan.
- **Distribution is not a store.** Published apps are **unlisted by default**; making
  one installable by any community requires `devvit publish --public` plus review.
  Games are expected to live in a **dedicated non-test subreddit** and to be promoted
  by *posting*, not by app-store discovery.
- **Quality gates for featuring** (which drives the money — Developer Funds, up to
  $167k/app): a **custom first screen**, **no scrolling inside the inline webview**,
  **cross-platform mobile + desktop**, immediately self-explanatory, catalog assets
  updated, plus engagement metrics (CTR, dwell, D1/D3 retention).
- **Publishing** = `npx devvit publish`, human review 1–2 business days, and Reddit
  explicitly recommends **batching updates into weekly releases**.
- **Payments** are Reddit Gold purchases of products, gated behind developer
  verification and the Earn Terms.
- The **community playbook** is unusually explicit: message moderators before a first
  game post, contact **3–5 communities a day maximum**, never reuse a template pitch,
  come back with a summary of what feedback changed, and treat trust — not traffic — as
  the metric.

---

## 3. Distribution behavior observed

**[VERIFIED]** Four near-simultaneous launch posts, each rewritten for its audience
(r/WebGames: "runs inside Reddit posts"; r/IndieGaming: "my first game, no download";
r/playmygame: "looking for feedback"; r/Devvit: "shipped my first Devvit game") —
i.e. the author did *not* paste one identical caption, which is exactly what the
playbook asks for.

**[VERIFIED]** A dedicated community `r/CandleClimber` exists (the link resolved to a
real community URL in search results, even though the page itself was blocked), and a
developer profile `u/le-brando` exists. Content and activity in both: **[NOT
ACCESSIBLE]**.

**[VERIFIED]** A Twitch stream of the game was promoted as a reference link, but the
VOD id returns `null` from Twitch's public API — the recording is dead or private.
Anyone following that link today sees an empty player.

---

## 4. Signals, and how much weight I put on them

### 4.1 `installCount: 2` against `versionsCount: 96`

96 uploaded builds between 2025-11-25 and 2025-12-03 — eight days — i.e. roughly a
dozen deploys a day, which is the signature of "develop in the playtest subreddit,
`devvit upload` constantly" rather than public iteration. Installations: **2**, which
for a game whose entire premise is "plays inline in any post" means essentially nobody
installed it into a community. **[VERIFIED numbers; INFERRED meaning]** The obvious
read is: the developer got the *build* loop working and never got the *distribution*
loop working. The Devvit docs are blunt that distribution is a separate job (dedicated
subreddit, featuring program, engagement metrics), and nothing on the listing suggests
any of it was done: no icon, no custom README, version stuck at 0.0.2, no listed
features.

### 4.2 The pitch is good; the product page wastes it

"Can you beat the market? Jump candles, avoid shorts, reach the moon!" is a genuinely
sharp one-liner — it explains the mechanic *and* the joke in eleven words. It sits on a
page whose body is the React starter README. **[VERIFIED]** That is a pure, fixable
distribution leak: the only surface a curious player sees says "A starter to build web
applications on Reddit's developer platform."

### 4.3 The concept is thin, in a specific way

A scroller where green = safe, red = kill, coins = shop currency is *legible in one
second* (a real asset on Reddit, where attention is the scarce resource) but it has
almost no **shape**: no run length, no goal other than "reach the moon", no reason the
next run differs from this one, and no reason to tell another human about it. A skin
shop is a currency sink, not a hook — you need a first hook before you can monetise
the second one. **[INFERRED]**

### 4.4 The theme is doing real work

Finance/meme-stock iconography (candles, shorts, "to the moon", liquidations) is a
shared language on Reddit. It buys instant comprehension and a joke. But the reference
appears to use the theme as *skin*, not as *system*: the candles look like a chart, they
are not a chart. **[INFERRED from the pitch]**

### 4.5 What the project is missing relative to its platform

Mapped against what the Devvit docs say drives featuring and retention
**[INFERRED, docs VERIFIED]**:

| Platform expectation | Reference project, as observable |
| --- | --- |
| Custom first screen | Unknown; pitch does not mention one |
| Community loop (posts, comments, UGC) | A skin shop and a run; no social artifact produced by play |
| Reason to return tomorrow | No daily seed / streak / season mentioned |
| Competition | No leaderboard mentioned |
| Mobile-first polish | Explicitly claimed ("mobile/…") |
| Discoverable listing | Stock template README, no icon |

Whether the *code* does more than the pitch says is unknowable from here. What is
knowable is that the only public description of the game promises a scroller, coins
and skins — and that is the entire promise.

---

## 5. The uncomfortable observation: the name

**[VERIFIED]** The reference app is literally named **candle-climber** and lives at
`developers.reddit.com/apps/candle-climber`; the developer is `le-brando`; the
community is `r/CandleClimber`. Our workspace is also called Candle Climber
(`$WICK`, chart-as-terrain platformer). This is either a coincidence or a name
collision with a *different, unrelated* project. **[VERIFIED: same name, different
product]**

That matters for anything I propose later: our product's identity cannot rest on the
name alone, and any Reddit-side surface we build would be competing for the same
search string with an app that already owns `apps/candle-climber` and
`r/CandleClimber`. It also means "our app page: developers.reddit.com/apps/" in the
brief resolves to nothing for us today — **we have no Reddit listing**. **[VERIFIED:
our repo has no Devvit app; it is a Next.js site]**

---

## 6. What I could not access, and what would change my read

1. **All comment text** on the four launch posts. If players there said the game is
   too hard, too easy, or that skins feel pointless, that changes §4.3 substantially.
2. **r/CandleClimber activity** — whether it has posts, a pinned "how to play", flair,
   or is empty. This is the single best proxy for whether the community loop exists.
3. **The actual game**, at any version. The 96 builds are invisible; the readme does
   not describe controls, run length, scoring, or difficulty curve. I am reasoning
   about a game I have never seen move.
4. **The gameplay recording** — dead VOD (see §0).
5. **`u/le-brando`'s other work**, which would tell me whether 2 installs is a
   first-timer artifact or a pattern.

If the team can paste: the launch-thread comment bodies, a screenshot or two of the
game in play, and the subreddit's front page, I can firm up §4.3 and §4.5 in a
revision. Until then those sections stay marked as inference.

---

## 7. My independent read, in one paragraph

The reference project is a **competently-built, badly-distributed, structurally thin**
Reddit game. It picked a theme with genuine cultural fluency, wrote a pitch better than
its listing, shipped in a webview so there was no install friction — and then left the
product page as boilerplate, accumulated 2 installs against 96 builds, let its only
demo recording die, and offered players a scroller with a coin shop but no reason to
return, compete, or talk about it. The lessons worth carrying are not "make a
scroller": they are (a) the first screen and the one-line pitch *are* the product's
front door and must be designed like features, (b) a game on a social platform needs to
emit **social artifacts** — something a player can post, compare, or argue about — and
(c) a themed skin is not a system; a chart should *behave* like a chart, not just look
like one. Our project already has the harder, better half of that idea (real market
data as literal terrain, daily shared seeds, on-chain proofs of a death). What it does
not yet have is the reference project's one genuine strength: a pitch and a first
second that a stranger understands without a tutorial.

# VIBE TEAM INTEL — X timelines, promoted projects ($FOLK game), SPARK economy, legal entity (2026-10-03)

> Owner brief: review the founder/team X timelines, the projects and games they forwarded and
> posted on their page, the tags they use, and the GitHub from the screenshot (Vibeforge1111);
> dig into the promoted projects; add what matters to the knowledge base; then re-assess OUR
> strategy, especially economics and monetization. Owner also offered a Twitter token if X blocks us.
>
> **BREAKTHROUGH vs 2026-10-03-ecosystem-intel.md §6:** the `page_reader` channel (ZAI fetch
> infra, different IP/network than our sandbox) **does render x.com** profile timelines and
> single-post pages. Every earlier block (direct curl, syndication, oembed, jina, nitter,
> headless Chromium) was a sandbox-network block, not an X-side impossibility. §1 lists exactly
> what this channel can and cannot see. **No owner token required** for the main timeline;
> one optional exception noted in §1b.

---

## 1. X access — capability map (update the block log)

| Surface | Status via page_reader | Notes |
|---|---|---|
| Profile timeline (`/user`) | **WORKS** | ~5–6 most recent posts SSR'd with counts, timestamps, quote-tweet embeds |
| Single post (`/user/status/id`) | **WORKS** | og:title = full text up to X's ~280-char og limit; longer posts still truncate ("Show more" hidden) |
| Replies tab, Media tab | blocked (client-rendered shell) | CSS only, no posts |
| Full "Show more" bodies (long posts/threads) | blocked | not in SSR HTML |
| Images/screenshots in posts | not fetched | CDN URLs require auth |

**1b. Optional owner token:** only needed if we want (a) full bodies of long posts — e.g. the
"simple map" participation thread (§4), the Spark thesis post (§6), the "p.s. we are also…" post
(§5) — or (b) replies/media tabs. If owner wants to provide it: **NOT the password** — the two
cookie values `auth_token` and `ct0` from a logged-in browser (DevTools → Application → Cookies →
x.com). Treat as sensitive; paste via DM only. **Nothing in this file is blocked on that.**

---

## 2. Identity & roles (confirmed, supersedes §1 of the earlier intel)

- **Founder/technical team = one person**: @meta_alchemist (X) = github.com/Vibeforge1111
  (GitHub profile cross-links both). Product accounts: **@vibevibefun** (launchpad),
  **@vibevibegames** (community-games surface — NEW: first captured this session),
  **@spark_coded** (Spark agent product). ~38.8K posts, 75.8K followers, joined May 2022,
  follows 7,217. Bio: "vibes @vibevibefun @spark_coded" + vibevibe.fun link.
- **Legal operator (NEW — from the launchpad's own User Agreement modal):**
  **SPARK LABS ORGANIZATION, S.A. (Panama)**. "Affiliates, contractors, and service providers act
  for the operator and are not parties to it."

## 3. The promoted project the owner asked about — Vibe Arena / "Vibe Folk" ($FOLK)

Founder quote-reposted it (Oct 2 19:48 UTC, post `2106109180788736247`) with: **"this is cool
af!!"** (4K views). The builder (@vibevibegames) launched it 1h earlier: "Vibe Arena is playable
now ⚔️ Connect MetaMask, hold $FOLK, unlock legendary gear and crush the Bear Market 🐻 Free to
play 👇 vibe-nine-woad.vercel.app (More is coming.)" (2.8K views).

**Founder's reply (11h ago) — his curation criteria in his own words:** "this is super cool, and
love the UI and art i'll make sure to complete the game haha i'd make it easier to find the game
when you enter the site tho, it wasn't obvious enough on that side"
→ **Praise = UI + art. Critique #1 = discoverability of the game on the site.** That is the single
most actionable sentence we captured all day.

### 3a. The game itself (source-level, all verified today)

- **URL:** vibe-nine-woad.vercel.app — page title "Vibe Folk"; og description: "Nine little block
  characters that each react differently when clicked." Eyes follow the mouse; "Find every
  personality for a surprise."
- **Source:** github.com/memosr/vibe — single-file HTML game (language: HTML, 0★, solo dev),
  created **2026-09-24**, last push **2026-10-01** → **one week from zero to founder-retweet.**
- **Commit ladder (the iteration story):** Sep 28 "Clearer weapon perk effects" → Sep 29
  "**FOLK holder tiers: wallet connect and tier-gated unlocks**", "MetaMask only wallet connect",
  "Chained folk: FOLK holding unlocks characters", "**Friendlier FOLK thresholds**" → Sep 30
  "Dungeon frame, taller ring, fiery ultimate" → Oct 1 "**cheaper weapon unlocks, lower FOLK
  tiers**, disclaimer" → they **lowered holding requirements after feedback**, same week.
- **Chain & token (ours):** $FOLK = `0xA9126368Be052e619c7E43C8Ff3BeCf7ECAfb8d9`, chainId **46630**
  (Robinhood Chain Testnet, hex 0xb626), RPC rpc.testnet.chain.robinhood.com, explorer
  explorer.testnet.chain.robinhood.com — **identical chain to $WICK.**
- **Holder-tier system (read-only balance, no transfer):** code comment (Turkish, solo dev):
  "Cüzdandaki $FOLK bakiyesi okunur (transfer yok). Tutulan miktar seviyeyi belirler." =
  "The $FOLK balance in the wallet is read (no transfer). The held amount determines the tier."
  - TIERS: **None 0 → Bronze ≥10,000 (+10% gold) → Silver ≥50,000 (+25%) → Gold ≥150,000 (+50%)**
  - Wallet connect: EIP-6963, **MetaMask-only** (explicit filter excludes Rabby, Coinbase,
    Phantom, Brave, OKX, Trust) — deliberate scope-cut for a one-week build.
- **The monetization loop (the template that got promoted):** `folkAction()` = if not connected →
  connect; else `window.open(FOLK.buy)` where buy = **`https://testnet.vibevibe.fun/token/0xA912…`**
  — the in-game buy button points **straight at the launchpad token page**. Game → token page →
  buy → holder tier perks in-game. Free-to-play core; token buys perks, never access.
- **Honesty disclaimer (verbatim):** "Community project built on @vibevibefun testnet. Not
  affiliated with the vibe/vibe team. $FOLK is a testnet token with no monetary value."
  → identical spirit to our GROWTH-AND-HOOKS red lines; the promoted project obeys them.
- **Gameplay shape:** arena "ring" battles between the nine block characters, gear/weapons with
  4 levels (MAXLV), "Camp & shop", "Shuffle gear", "Clear ring", XP bar, gold currency, gift/card
  moments, WebAudio SFX. Pure client-side; no backend leaderboard visible in source.

### 3b. The builder's second product (captured minutes after posting)

@vibevibegames, Oct 3 (~06:5x UTC, post `2106276290827518124`): "Download GIFs and use them
anywhere. **Some are locked. Buy FOLK.**" → a **second $FOLK-gated product** (GIF pack) shipped
the morning of our session. Same playbook, same week: multiple small products, one token.
Oct 1 teaser on their account: "vibegames is coming soon". Their framing: "I love building for
the community. Play the game and give me feedback."

## 4. Platform truth: the Sep 29 "big merge" changed OUR launch surface

Pinned founder post (Sep 29) = 🫶 over @vibevibefun's update (23K views): "chef v/v just cooked
for all of you **Robinhood Chain fans**! **stock pairs, anything pairs, holder reflections, fully
customizable tokens, graduation airdrops**, performance improvements, ui/ux upgrades, and more
are all now live at testnet.vibevibe.fun"

Consequences for our launch pack (WICK-LAUNCH-FORM-PACK, built from pre-update traces):

1. **The wizard likely has NEW fields** our pack doesn't list: holder-reflections toggle,
   stock/anything pair tabs next to Classic, "fully customizable token" options, and possibly a
   graduation-airdrop registration block. Our pack's config re-verify shows the on-chain policy
   unchanged (seedify-curve-v3-testnet-5eth-2pct-3pct-creator-125bps-75-25), but the **form
   surface** is newer than our trace. → ACTION at signing: 5-minute field sweep before filling
   (checklist added to §9).
2. **"Graduation airdrops" is a platform feature, and Oct 2 founder post says: "next up is gonna
   be registrations for graduation airdrops"** → when $WICK graduates we register through the
   platform flow; our P4.4 weights story (streak / route prediction / archive marathon) stays
   complementary, not conflicting.

## 5. What the platform says it rewards (monetization-relevant, verbatim)

- @vibevibefun Sep 30 (23K views, post `2105227488087691353`): "builders and vibe coders: this is
  for you!! tomorrow at 6PM UTC, our founder @meta_alchemist will have a livestream workshop on
  how to vibe code stock paired products **as those who launch products on our RH testnet will be
  getting rewarded with large amounts of vibe/vibe tokens**. p.s. we are also …" (p.s. hidden
  behind Show-more — owner-token item).
- Oct 1 workshop actually ran (1:48:54 broadcast, ~4,042 views): "come join us, and **earn from 5
  WLs** and learn about how to vibe code a dope product for **vibe/vibe rewards**!"
- @vibevibefun Sep 30 map post (17K views, post `2105170501727297913`): "one verb for today:
  cook. the pad is the kitchen. real products that merge **stock pairs, RWA, and creativity** get
  cooked here. also, here is a simple map for those who are confused about how to get involved in
  vibe/vibe earlier: **base:0x0fb07c88bc6d195c196279523957c004eb868248 is st…**" (truncated).
- **The base address resolves: SPARK on Base** — `0x0fb07c88bc6d195c196279523957c004eb868248`,
  $0.002648, main Uniswap pool ~$115K liquidity, 24h volume ~$8.9K (DexScreener API, fetched
  2026-10-03). Matches the "$SPARK $0.00264" widget embedded in @spark_coded's X profile.
  → the "map" tells newcomers to buy SPARK on Base; full thread body hidden (owner-token item).

## 6. The SPARK economy (their monetization machine — context, not ours to join)

- Sep 20/21: "just updated the **$SPARK thesis** — read on for what Spark holders get free" /
  "the Spark thesis has been updated. in it you will find all the currently announced Spark
  perks…" (thesis body = owner-token item).
- Aug 29 @spark_coded: "remember **each 200k $SPARK = 1 vibe vibers NFT**; being a top 250 holder
  on fomo app, also gets 1 NFT on top."
- Aug 29 founder — "**vibe vibers NFTs' post-launch mechanics**: 1. **95% of the NFT trading fees
  will be used to buy a basket of top tokenized AI stocks** 2. vibe vibers will have levels, and
  as you use vibe/vibe launchpad, refer others, and do other quests, they will gain XP 3. all
  the…" (truncated).
- Aug 27 founder: "you get 200k $SPARK → you then get a free vibe vibers NFT → you start using
  vibe/vibe launchpad on RH → you invite frens, **earn commissions from all their trades** → your
  vibe viber get charged both ways → you get…" (truncated).
- Structure summary: SPARK (Base, liquid) = value token; vibe/vibe testnet participation =
  recognition layer; NFT = XP/quest/perk wrapper; referrals = trade-commission flywheel.
  The "testnet rewards for product launchers" (§5) are the acquisition budget of this machine.

## 7. Legal language of the launchpad (from the User Agreement modal, captured today)

1. Operator = SPARK LABS ORGANIZATION, S.A. (Panama).
2. "Testnet only: test ETH, testnet tokens, fees, and rankings have no monetary value and are not
   redeemable for anything."
3. "**Recognition of participation**: the operator currently intends — at its sole and absolute
   discretion — to recognise recorded testnet participation **if** a future mainnet token is ever
   created. **No program is offered or promised**, nothing is owed until actually delivered under
   separate claim terms, and **mainnet may never launch**."
4. "Nothing entitles you to receive anything — not points, stages, standings, leaderboards…";
   operator may "consolidate addresses it determines are controlled by one person into a single
   allocation, and **exclude addresses associated with sybil activity, wash trading, or automated
   abuse**."
5. "Token creation is permissionless… a listing is never vetting, endorsement, audit, or
   investment advice; creators are solely responsible for what they publish."

→ Our copy must keep the same discipline we already have: no promises, "recognition"-style
framing for airdrop weights, anti-cheat as sybil-protection story (server-verified scores, HMAC).

## 8. Tags & post format (what the owner asked: "the tags they've used")

**No hashtags. Anywhere.** Across every captured post from all four accounts (Sep 29–Oct 3): zero
`#`-tags. Their distribution vocabulary is:

- **Cashtags**: `$FOLK`, `$SPARK` (these get the price widgets and the trading surface)
- **@mentions**: `@vibevibefun` tagged on every product post by builders; founder tags builders
- **Ritual hooks**: "chef v/v just cooked…", "one verb for today: **cook**", "the pad is the
  kitchen", "vibecheck:", "enjoy!", "hi everybody"
- Emoji accents (🫶 ⚔️ 🐻), numbers-first updates, honest changelog tone.

→ Our launch/showcase post must drop hashtags and speak exactly this dialect: `$WICK` cashtag +
`@vibevibefun` + one product-first hook + verifiable claims. (The old #project-showcase template
in WICK-LAUNCH-FORM-PACK keeps the tag only because that's where the platform reads submissions —
the X post itself should mirror the founder's format.)

## 9. Strategy re-assessment — economics & monetization of Candle Climber / $WICK

### 9a. KEEP (no change)
- **2% creator tax (holders 75 / treasury 20 / burn 5 / ETH reflections 0)** — untouched; platform
  rails confirmed again today (policy string identical; every trade's creator share = 50% payout +
  50% auto buyback-burn of $WICK via feeHook).
- **Classic ETH pair** for $WICK v1. Stock-pair/anything-pair is their new narrative for OTHER
  products; adopting it at our first launch would muddy the story we've already packed. Revisit
  only for a future second experiment.
- **Skip Merkle AIRDROPS at signing** — reinforced by §7's anti-sybil language; community share
  stays with P4.4 weights + treasury.

### 9b. ADJUST / ADD (evidence-driven)
1. **Balance Gate P4.2 → tiered perks, not a binary gate.** Vibe Arena proves the founder loves
   read-only holder tiers with %-bonuses (Bronze/Silver/Gold, +10/25/50%) and LOWERED thresholds
   after feedback. Ship $WICK tiers as cosmetic/boost perks (e.g. +10/20/30% score multiplier or
   exclusive card skins) with thresholds set at genuinely reachable balances (respect the 2%
   wallet cap; curve supply 793.1M). In-game "Get $WICK" button → our launchpad token page —
   same loop, already proven on our own chain.
2. **Discoverability is the founder's #1 critique genre** — our landing page must put the
   playable game above the fold with the $WICK utility one scroll away. This is a cheap,
   founder-visible fix; weigh it against VD-x visual debt (the game-first impression is what he
   judges).
3. **Launch-day copy: adopt the disclaimer verbatim pattern** — "Community project built on
   @vibevibefun testnet. Not affiliated with the vibe/vibe team. $WICK is a testnet token with no
   monetary value." It is both our red line and the platform's legal tone (§7) — and the promoted
   project shows it doesn't hurt curation.
4. **Add the "platform rewards" line to our upside ledger (not projections):** "those who launch
   products on our RH testnet will be getting rewarded with large amounts of vibe/vibe tokens" —
   our launch IS the qualifying event. Treat as discretionary upside; never promise it in copy.
5. **Graduation airdrop registration:** platform feature landing "next up" (Oct 2). When $WICK
   graduates → register via the platform flow AND publish our P4.4 weights table in the same
   window (the airdrop-expectation crowd from Seedify culture lands on an honest table).
6. **Wizard field sweep before signing** (5 min): pairs offered (Classic vs stock vs anything),
   holder-reflections toggle, "fully customizable token" options, any graduation-airdrop block.
   If holder-reflections is a native toggle, it maps to our existing 75% token-reflections split —
   verify the wizard computes it the same way our pack says.
7. **Post format** (§8): no hashtags; `$WICK` + `@vibevibefun`; product-first hook; changelog
   honesty; one strong post, not scattered replies.
8. **Cheap resonance move:** he stars DESIGN.md tooling (google-labs-code/design.md,
   VoltAgent/awesome-design-md) — adding a real `DESIGN.md` to the candle-climber repo (palette,
   "the chart is the level", type rules) speaks his exact dialect and helps any future agent-built
   variants. ~30 min of work.

### 9c. Competitive read
The 100 most recent launches (all Sep 29, launchIds ≈141762–141987) are junk-heavy
("StripedEagle4875", "Cat", "Baby Doge" — 26–51 holders each). The launchpad is quiet since Sep 29
(reconfirmed today). In that universe **one real product got the founder's quote-repost in a
week** — Candle Climber is exactly the genre he rewards (shipped, playable, honest, user-real),
and our QA/anti-cheat evidence exceeds the bar Vibe Arena set. Distribution risk is not curation —
it's shipping before the platform's traffic narrative moves elsewhere (§5 workshop already steers
builders toward stock-paired products).

## 10. Founder interest graph (GitHub stars, 96 captured — for future outreach resonance)

Dense in: agent harness/skills (obra/superpowers 294K★, awesome-claude-skills, claude-mem,
agent-orchestrator), **AI-agent game tooling** (agent-game-forge 209★, agent-sprite-forge 4252★,
2d-multiplayer-survival-mmorpg, LyalinDotCom/the-world), **X-research tooling** (x-research-skill
1242★, Agent-Reach 89K★, x-twitter-mcp-server), trading intel (ai-hedge-fund,
dexscreener-cli-mcp-tool 248★), design systems for coding agents (design.md,
awesome-design-md, ui-ux-pro-max-skill 132K★), video (remotion, hyperframes). Following: karpathy,
paradigmxyz, openai, anthropic, ruvnet, kingbootoshi.
→ Our "AI agents QA the game" story (450+ headless rounds) is native content for this audience.

## 11. Owner-input items (nothing blocked; queue for next pass)

1. The profile-page links he copied (bio links) → fold into this doc when they arrive.
2. Optional: `auth_token` + `ct0` cookies if he wants the Show-more bodies (map thread, Spark
   thesis, "p.s. we are also…") and replies/media tabs. Password never needed.
3. Names/links of any promoted projects beyond Vibe Arena (older posts are outside the ~6-post
   SSR window; media tab needs §11.2).

## 12. Evidence register

| Claim | Source | Fetched |
|---|---|---|
| Founder timeline (5 posts + counts) | page_reader x.com/meta_alchemist | 2026-10-03 |
| "this is cool af!!" = Vibe Arena RP | og of post 2106109180788736247 | 2026-10-03 |
| Founder reply critiquing discoverability | page_reader x.com/vibevibegames (reply embed) | 2026-10-03 |
| @vibevibefun 5 posts incl. Sep-29 feature list, rewards post, map post | page_reader + og posts 2104843548579504297/2105719943606206580/2105227488087691353/2105170501727297913/2105001020569051457 | 2026-10-03 |
| Guild system / graduation-airdrop registrations next | og post 2105908667388440685 | 2026-10-03 |
| Workshop "earn from 5 WLs" | og post 2105720503201841360 | 2026-10-03 |
| vibegames timeline + GIF "Some are locked. Buy FOLK." | page_reader x.com/vibevibegames + og 2106276290827518124 | 2026-10-03 |
| $FOLK token, chain 46630, tiers 10k/50k/150k, buy→token page, MetaMask-only, read-only balance | game source inline JS, vibe-nine-woad.vercel.app | 2026-10-03 |
| Game commit ladder / one-week build | api.github.com/repos/memosr/vibe + /commits | 2026-10-03 |
| Disclaimer text | vibe-nine-woad.vercel.app footer | 2026-10-03 |
| SPARK on Base $0.002648, ~$115K liq | api.dexscreener.com token 0x0fb07c88…8248 | 2026-10-03 |
| SPARK thesis / NFT mechanics / referral commissions | og posts on x.com/spark_coded + profile embeds | 2026-10-03 |
| Operator SPARK LABS ORGANIZATION S.A. (Panama) + participation-recognition + anti-sybil | User Agreement modal, testnet.vibevibe.fun/token/0xA912… | 2026-10-03 |
| 100 recent launches all Sep 29, junk-heavy | /api/v1/chains/46630/launches?limit=100 | 2026-10-03 |
| Star graph / following | api.github.com/users/Vibeforge1111/starred, /following | 2026-10-03 |

---

## 13. DEEP ECONOMY DECODE — Vibe Folk's full game economy (owner follow-up, same day)

Owner asked: (a) which "profiles" were meant → answer: the info-page links HE said he copied
(his earlier message: "They also had a few links in their info page that I copied, and I'll send
those to you") — still welcome, nothing blocked. (b) the economy of the promoted games, in depth.
(c) ideas we can DEVELOP (inspired, not copied) for our project.

### 13a. The promoted game's economy, source-level (memosr/vibe, single-file HTML)

**Two-currency, dual-gate design — the actual innovation the founder rewarded:**

| Layer | Currency | Source | What it buys |
|---|---|---|---|
| Grind | **coins (gold)** + XP | arena fights: `xp = win ? 25 + stage*15 + (last?60:0) : 10 + stage*5` | weapons (dagger free, bow 100, sword 200, spear 300, axe 350 gold), moves (strike 200 / power 300 / ultimate 500 gold), 3 stat points per level (pow/spd/grd/vit) |
| Holding | **$FOLK balance** (read-only, on-chain 46630) | wallet connect, MetaMask-only EIP-6963 | USE-rights on top of gold: weapon tiers (sword needs Bronze, spear Silver, axe Gold), move tiers (strike B / power S / ultimate G), upgrade-level caps per tier `[0,2,3,4]`, chained characters, +10/25/50% gold bonus |

- **Holding never skips the grind** — it raises the ceiling and multiplies earnings. Gold still
  gates everything. Token = capacity + speed, coins = competence.
- **Sponsor/stock layer (their "stock pairs" translation into game terms):** pick a sponsor —
  TSLA (more crits), NVDA (hit harder), AAPL (less damage), MSFT (hit more often), AMZN (+25%
  coins), HOOD (start hyped) — and win fights to accumulate **in-game "shares" of it**
  (+1 per win, +3 for final). Stock-picking gamified without any real stock exposure.
- **Persistence:** `localStorage` only ("Progress is saved in this browser") — **no server, no
  leaderboard, no anti-cheat**. All progression is client-trusted.
- **Progression pacing seen in commits:** thresholds LOWERED within 48h of feedback ("Friendlier
  FOLK thresholds", "cheaper weapon unlocks, lower FOLK tiers") — iteration honesty is part of
  why it got promoted.
- $FOLK's own launch record is not reachable via the API's `q`/cursor search from here
  (probed 6 ways; only its token page + on-chain address confirmed). Non-blocking.

### 13b. Translation table — develop their ideas into OURS (inspired, not copied)

| Their mechanic | Our version (Candle Climber / $WICK) | Why it's not a copy |
|---|---|---|
| Holding raises ceiling, grind stays | **"The token raises the ceiling, never skips the climb"** — tiers unlock cosmetics, marathon brackets, weights-multiplier caps; score itself is NEVER buyable | their tier perks are combat power; ours protect leaderboard integrity (our core promise) |
| Tier medals +10/25/50% gold | **Wick Aura** — visible flame size/color on your climber in runs & duels; zero score effect | status is cosmetic, not economic power |
| Chained characters unlock by holding | **Wick Bearers** — seasonal companions on the climber (pure cosmetic + one-line market-psychology lore), hold-gated | our identity is candlestick lore, not block mascots |
| Stock sponsors (TSLA/NVDA…) + in-game shares | **Pattern Mentors** — pick a candlestick-pattern mentor (Hammer School, Doji Cult, Engulfing Guild); personal quest lines ("reverse 3 hammers") → mentor badge + P4.4-weights participation credit | pattern-literacy education = ours; no combat perks; ties to OUR weights economy |
| Shares accumulate per sponsor | **Pattern mastery XP per mentor** feeding the community-weights ledger | participation recognition, transparent, anti-sybil (server-verified) |
| Second product same token (GIF pack, "Some are locked. Buy FOLK.") | **$WICK Share Kit** — hold-gated Death-Card art pack: wallpapers/stickers/animated cards for X | feeds OUR Death-Card share loop; zero gameplay risk |
| Browser-only save, no server | **Anti-positioning: server-verified scores + HMAC anti-cheat + real-device QA** — "scores you can trust" | the promoted game has none of this; our credibility moat, say it in the launch post |
| Thresholds lowered after feedback | ship tiers conservative → telemetry-tune weekly → **publish the tuning** | their culture rewards iteration honesty; we do it by design |
| Founder's #1 critique (discoverability) | game-first landing, one scroll to $WICK utility | already in the pack |
| Guild system (platform, live Oct 2) | create the **Candle Climbers guild** at launch so early players cluster under our banner | platform-native surface, zero build cost |
| Graduation airdrop registrations ("next up") | register $WICK at graduation; publish P4.4 weights table same window | honest answer to the Seedify-culture airdrop crowd |

**Do NOT copy:** tiered score multipliers (kills leaderboard integrity), stock sponsors verbatim
(their niche; muddies chart-native identity), MetaMask-only wallet lock (we keep general EIP-6963).

**Priority order:** T1 (now/cheap): game-first landing + $WICK Share Kit assets + Pattern Mentors
quest design → T2 (when P4.2 ships): hold-gated companions + weights integration → T3 (post-grad):
guild + marathon brackets + graduation-airdrop registration.

*Evidence: game_src.html = raw memosr/vibe main (fetched 2026-10-03, 279,467 bytes, identical to
live site); API probes: ?q=&cursor= walks (6 attempts); earlier sections' register applies.*

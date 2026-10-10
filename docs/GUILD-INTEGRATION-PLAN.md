# Guild Integration Plan — v0 (DESIGN DOC ONLY)

> Registered 2026-10-10 per owner brainstorm ("guilds joining the product, their own
> page, guild leaderboard, inter-guild tournaments"). **Nothing here is built or
> promised.** No LAW touched, no product copy changed. Each phase below gets its own
> council note + tests before any code exists.

---

## 1. Why guilds structurally fit THIS game (the fairness argument)

Candle Climber's terrain is **deterministic from the day's real chart** — every
player on a given UTC date climbs the exact same mountain (same candles, same
seeded mutations, same weather derivation). Inter-guild competition is therefore
apples-to-apples **by construction**: no guild can claim its members drew a harder
seed, because there are no per-player seeds. This is a fairness property most
multiplayer games have to engineer; ours is free.

Ecosystem ground truth (all from `vibe-ecosystem-kb`, verified sources):

| Fact | Source |
|---|---|
| **Guild Leader** is a first-class role in the vibe/vibe Discord role ladder | roles API [S27] |
| Dedicated **#guilds-info** channel; "guilds join together" as communities | [S11] |
| Anti-abuse rules explicitly disqualify **"fake guild activity"** → guild activity is measured and valued by the platform | [S6] |
| Guild-leader approval may matter for platform NFT rewards, but **"leaders cannot guarantee anything"** | [S11] |
| `codex-visual-builder-guild` (46★) — builders already brand themselves as guilds | showcase census |
| Platform NFT (vibe vibers, 10k supply) mints **after mainnet** — platform rewards are theirs, post-mainnet | [S19] |

**Consequence:** we align with guilds as an *activity surface*, and we never
promise platform rewards on the platform's behalf (language law).

## 2. Phase 0 — Our own guild (the gap the owner found)

Confirmed gap: **zero guild trace in the product.** Candle Climber has no guild
home anywhere.

- Create (or join) a guild as the Candle Climber community home — Discord-first,
  zero code cost.
- One honest line in the product linking to it (footer or links row), added only
  after the guild actually exists (truth sweep applies).
- Owner lever: reach — the guild is where early climbers gather; it feeds the
  worst metric we have (439 X messages, 0 replies → need a gathering place).

## 3. Phase 1 — Guild tag identity (codeable pre-token, no economy change)

A near-clone of the shipped referral loop (E5.5 `sanitizeRef`):

- `?guild=<code>` landing → `cc_guild_v1` local storage → stamped as **metadata**
  on `BoardEntry` (same rules as `ref`: sanitized `[A-Za-z0-9_-]{1,24}`,
  type-strict, fail-open omit, **never inside the personal_sign proof payload**).
- Guild code registry: append-only, agent-curated, same honest-handling as ref.
- Board views: pure query params on the existing GET (`?board=official&guild=…`)
  — no new lane, no mixing (P3.5 no-board-mixing stays pinned).
- **Guest lane keeps the guild tag too** — belonging is free; LAW 1.2 substance
  (play never blocked, no paywall for identity decoration) is untouched.

## 4. Phase 2 — Duels and guild cups

- The duel engine **already ships** (`src/game/cc/duel.ts`, `duel-store.ts`) —
  1v1 challenges are a product surface, not a new build.
- **Tournaments are already staged** as a post-graduation lane
  (`POST_GRAD_LANES` registry, E6.2 fail-closed gate, commit `a906a04`). The guild
  cup is a *consumer* of that lane, not a new lane — no economy-law surface is
  added.
- Guild cup v0 (pre-token, honest math only): for date D, aggregate official-lane
  best-per-wallet scores by guild tag → guild row = top-N member bests. Pure
  functions, unit-tested, no token movement, clearly labeled "unofficial cup
  until graduation opens the tournament lane".

## 5. Phase 3 — Guild onboarding + inter-guild season ("Vibe Guild World Cup" shape)

- Per-guild page: tag, member count, weekly best, cup history — rendered from the
  same public aggregates the boards already expose (no new PII; wallets stay
  masked on every public read path).
- Calendar: the season registry (S1 live since 2026-10-10) provides the rhythm —
  cup finals land on season close.
- Other guilds join by the same `?guild=` onboarding; inter-guild bracket = the
  World Cup shape the owner sketched.
- **Timing gate: REACH.** The honest sequencing is audience first — building an
  inter-guild tournament with 0 replies on 439 messages crowns nobody. P3 starts
  only when Phase 0's guild has real members; no pre-announcement.

## 6. Honesty gates (apply to every phase)

1. No promises of platform rewards — their NFTs, their rules, post-mainnet.
2. No invented numbers anywhere; every counter is measured.
3. Guest stays free, walletless, forever; official stays wallet-bound via
   personal_sign; guild decoration never changes scoring.
4. Anything token-moving waits for its post-graduation lane + LAW 5.1 PR
   checklist.
5. Landing order: **P0 now (owner+agent) → P1 small code → P2 v0 small code →
   P2 token parts + P3 post-graduation AND reach-gated.**

---

## خلاصه‌ی فارسی برای مالک

بله — دقیقاً همان‌طور که گفتی سند شد، نه کد. چهار فاز: (۰) گیلد خودمان که الان هیچ
اثری ندارد، (۱) تگ گیلد کنار اسم‌ها با همان الگوی ریفرالِ شیپ‌شده، (۲) جام گیلدی
هفتگی روی موتور دوئل موجود + لِین تورنومنتی که در گیت گِرِجویشن رزرو شده، (۳)
آنبوردینگ گیلدهای دیگر و «جام جهانی گیلدهای Vibe» روی تقویم فصل S1. استدلال عدالت
هم ساختاری است: چارت هر روز برای همه یکی است، پس ادعای «زمینِ من سخت‌تر بود» معنا
ندارد. زمان فاز ۳ به دسترس گره خورده؛ اول باید خانه‌ای داشته باشیم که آدم‌ها در آن
جمع شوند.

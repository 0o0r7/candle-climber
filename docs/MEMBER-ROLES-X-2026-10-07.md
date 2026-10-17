# MEMBER ROLES + X HANDLES — 2026-10-07 (role-verified, method-verified)

> Completes §5 of `2026-10-07-ecosystem-intel-update.md`. The owner's ask — members by ROLE,
> then X handles from their Discord profiles — is now delivered with **role-verified data**.

## 1. Method (what worked, what is platform-blocked)

| Path | Result |
|---|---|
| Bulk REST `/guilds/{id}/members` | ❌ 403 — platform-blocked for user tokens (not a Wick issue; the account reads every channel) |
| `POST /members-search` / `GET /members/search` | ❌ 403 / 50001 |
| Gateway lazy member chunks (op14) | ❌ no chunks delivered post-READY (client-only behavior) |
| **`/users/{id}/profile`** | ✅ 200 — connected_accounts (X/GitHub), bio, badges, mutual guilds |
| **`/guilds/{id}/members/{uid}`** (single) | ✅ 200 — exact roles, nick, join date |

Pipeline: 186 distinct human authors mined from the 674-message corpus → top 140 profiled →
all 186 role-fetched. Coverage = everyone who ever posted in the captured window (the people
who matter). Guild total ~1,258 members; the non-posting remainder (~1,070) is invisible by
design and irrelevant for outreach.

## 2. TEAM roster (role: Team / Admin) — 5 members

| Discord | Roles | X | Notes |
|---|---|---|---|
| **adramelekh.** | Team, Admin | — (no X, no bio) | the only official poster (about/faq/incentives); joined Aug 25 |
| **covenant11** | Team | **@wiredwisely** | 22 msgs; relays founder Telegram notes (curve-abuse fix, Sep 11). The ONLY team member with a public X |
| **justine1588** | Team, Guild Leader, Builder | — | 30 msgs — the most active team voice in chat |
| **bacty123** | Team | — | silent |
| **kriptocrafter** | Team | — | silent |

Founder (meta_alchemist) holds no visible Discord presence; the team layer on X stays
founder-centric (@meta_alchemist / @vibevibefun / @jumperz-ambassador).

## 3. GUILD LEADER layer (role: Guild Leader) — 35 members (with X where connected)

@kozakmazal, @ay.go→**@Tacometax**, @emaran1920→**@ShayekA21461**, @westsidegun, @kyzia772→
**@kuznetsjeka** (Stage: Launched), @bona_ventures, @brainstormity→**@brainstormity**,
@tuna_bb→**@Tuna_bbh**, @masum03681, @shripon786→**@Alom_D** (Stage: Idea), @anthropoid666→
**@khalilov6666**, @lookieo, @elvis_analyst→**@elvis_analyst**, @sizerr521→**@UniverseGuild**,
@soayeb_0x, @_legalise, @nisheta_dao, @rezgar_sh→**@RezgarShah**, @alona9588→**@AlChernega**,
@emotionlessss6, @hdproff→**@HenDrew88**, @kingzeye, @zestovibe→**@0xMslm** (Stage: Idea),
@zorro_ct, @yobaoz, @samadectng→**@oxAyoade**, @harunguyen→**@HaruNguyenSK**, @donotfeardeath,
@skybornfx→**@Skybornfx**, @ebashtrader→**@ebash_creator**, @raidesaint, @heathley,
@mdraihan_63698, @techymaru_reborn, @justine1588 (also Team).

Read: the Guild Leader layer is the guild-race cohort (35 leaders competing in the top-100
NFT race). Many are ALSO Builder/Stage-tagged. This is the highest-leverage engagement list
for a project that needs guilds.

## 4. Role corrections (context says X, roles say no)

- **latiblack** — acts like staff (answers #builder-help, owns ticket channel #latiblack-20,
  24 msgs) but roles are only `Verified, Builder, Stage: Launched`. A power user, NOT a mod.
- **ricardokarma1** — self-styled "approved Creator & Builder"; roles confirm only
  `Verified, Builder`. Marketing language, not rank.

## 5. Population stats among posting members (n=186 role-fetched)

Verified 181 · Builder 116 · Guild Leader 35 · Stage: Launched 10 · Stage: Idea 4 ·
Stage: Building 3 · Team 5 · Admin 1 (overlaps included). No Moderator, Collab Manager, or
Vibe/viber appeared among posters — those roles either don't post or sit outside the captured
window. Bot roles (Wick/Appy/carl-bot) ignored.

## 6. FINAL tiered monitoring list (X handles, role-verified)

- **T0 — team/official (daily):** @meta_alchemist, @vibevibefun, @spark_coded, @jumperz,
  @wiredwisely (covenant11, Team — NEW)
- **T1 — builders w/ live products (weekly):** @vibevibegames, @0xHaileyy, @memosrETH
  ($FOLK dev, IS in our server — 3 msgs), @FOXMEMERH, @Th33ros, @nabapu13, @ronexresearch,
  @0xMimmi, @Tacometax (ay.go, Guild Leader + loud grad-poster)
- **T2 — guild-leader/community layer (list):** the 34 handles in §3 + Tier-2 names from
  `intel/discord/mine-digest.md` (66-handle raw capture)
- **T3 — silent team:** bacty123, kriptocrafter (no X; watch Discord only)

## 7. Economy decision — final input deltas

1. The Team layer is deliberately quiet on X — the megaphone is founder + pad + ambassador.
   Our showcase post should tag `@vibevibefun` only; DMs to covenant11 (@wiredwisely) are the
   private channel if we ever need one.
2. The Guild Leader cohort IS the guild race. Joining as "Candle Climbers guild" puts us in a
   ladder with exactly these 35 accounts — a week of real play-activity makes us visible to
   all of them at once.
3. latiblack's "Play stock battle I will buy your tokens" energy is what #builder-help rewards:
   a single showcase post + one helpful reply to the unanswered browser-game question converts
   that channel into our funnel.
4. Nothing changes ECONOMY-LAWS: the 5% recognition ledger, the scam-alert wording discipline
   ("no airdrop going on right now"), and the no-fake-volume stance all point the same way —
   ship, showcase, guild, then Balance Gate when the owner flips the env.

Evidence: `intel/discord/{authors-profiles,members-by-id,role-histogram,members-role-histogram}.json`
(sandbox), distilled here + `core-members.md` + `authors-x-handles.md`.

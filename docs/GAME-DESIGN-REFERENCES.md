# GAME DESIGN REFERENCES — the evidence base for Candle Climber's next loop

> Written 2026-11-10. Companion to [`PLATFORMER-UX-RESEARCH.md`](PLATFORMER-UX-RESEARCH.md)
> (which covers control forgiveness only). This document collects the external,
> named sources behind the game's open design gaps — game feel / juice, difficulty
> and level analytics, retention, and decision depth — and states what each one
> implies for THIS game. No dates or launch promises: it is a design reference,
> not a plan.
>
> **Method (honest scope).** Sources were found and their URLs verified on
> 2026-11-10. Quotes marked "verbatim" were read in the fetched page; everything
> else is paraphrase of the talk/book's published summary. Where a source is a
> talk or book, the principle — not a quote — is what is transferable.

## 1. The ten-pattern frame

The gap analysis behind this document compares Candle Climber against ten patterns
recurring across small-session arcade games:

| # | Pattern | Candle Climber status (2026-11-10) | Evidence |
|---|---|---|---|
| 1 | **Climax / set-piece** | partial — the summit now has a gap-free approach and the chart is paced in named sectors (P0.2); it is still a landing, not an encounter | `game/cc/director.ts`, [`DIFFICULTY-DIRECTOR.md`](DIFFICULTY-DIRECTOR.md) |
| 2 | **Build choice** | absent — the daily mutation is imposed, not chosen | `game/cc/mutations.ts` |
| 3 | **Quality score** | present — STYLE (late hops + forgiveness saves) sits *beside* the score, not inside it | `game/cc/style.ts`, [`STYLE-SCORE.md`](STYLE-SCORE.md) |
| 4 | **Modes** | present — crypto / stocks / launchpad × 4 timeframes + archive | `lib/market-selector.ts` |
| 5 | **Meta-progression** | weak — 10 achievements, localStorage only | `lib/achievements.ts` |
| 6 | **Inputs** | minimal — jump + RUSH, no gamepad | `components/cc/GameCanvas.tsx` |
| 7 | **Telegraphing** | present — candle colour, crumble tell, fairness clamp | `game/cc/engine.ts` |
| 8 | **World / tone** | strong — "the chart is the level", Death Card | `docs/GAME_DESIGN.md` |
| 9 | **Social** | present — async duel, ghost, rival bot, boards | `game/cc/duel.ts`, `ghost.ts`, `rival/` |
| 10 | **Polish** | half — particles/shake/slow-mo, 5 synth SFX, no music | `game/cc/sound.ts`, `render-v2.ts` |

### The P0 build queue (updated 2026-11-10)

| Item | What it produces | Status |
|---|---|---|
| P0.1 | run telemetry intake + the `/ops` death histogram (§2) | **shipped** — [`TELEMETRY.md`](TELEMETRY.md) |
| P0.2 | deterministic difficulty director: sectors, safe opening, summit run-in | **shipped** — [`DIFFICULTY-DIRECTOR.md`](DIFFICULTY-DIRECTOR.md) |
| P0.3 | air jump (second jump) with the same forgiveness windows | **next — not started.** Not a free add: extra reach changes the `MAX_UP` fairness clamp (`level.ts`), the rival bot's planner and every existing difficulty prior, so it needs its own re-tuning pass and a before/after death histogram. |
| P0.4 | STYLE quality axis: `LATE` hops (+3) and forgiveness `SAVE`s (+2) | **shipped** — [`STYLE-SCORE.md`](STYLE-SCORE.md) |

With quality score now present, the pattern the game still scores worst on is
**build choice (#2)** — plus the measurement that tells you whether any of these
changes worked (§2).

## 2. Measurement and level analytics

**Anders Drachen & Alessandro Canossa, "Spatial Game Analytics and Visualization"
(IEEE CIG 2013).** <https://andersdrachen.com/wp-content/uploads/2014/07/spatialgameanalytics_cig2013.pdf>
Paraphrase: death heatmaps are the standard first diagnostic for level design —
a spatial cluster of deaths that a designer did not intend is either a difficulty
spike or a readability failure, and both are invisible without the map.
→ *Implication:* Candle Climber's level is a single axis (candle index), so the
heatmap degenerates to a **histogram of death indexes**. That is exactly what
`/ops` now reports (P0.1, `lib/run-telemetry.ts`). Without it every difficulty
change is an opinion.

**GameAnalytics, "Balance and Flow Maps".** <https://www.gameanalytics.com/blog/balance-and-flow-maps>
Paraphrase: binning player deaths by level position and comparing the same level
across cohorts is how "the player is stuck here" is proven rather than felt.
→ *Implication:* the histogram must be readable per **mode + timeframe**, because
a 1h chart and a 1w chart are different difficulties. The stored event carries
both labels for that reason.

**CRESST, "Guidelines for the Design, Implementation, and Analysis of Game
Telemetry" (2019).** <https://cresst.org/publication/guidelines-for-the-design-implementation-and-analysis-of-game-telemetry/>
Paraphrase: collect the minimum behavior that answers a design question, define
each metric before collecting it, and prefer aggregates over per-player trails.
→ *Implication:* the telemetry contract is deliberately tiny and PII-free
(`docs/TELEMETRY.md`). No user id, no wallet, no IP, no client timestamp.

**Robin Hunicke, "The Case for Dynamic Difficulty Adjustment in Games" (2005).**
The classic argument FOR adapting difficulty to the player.
→ *Implication (this is why we do NOT):* Candle Climber is a shared daily chart
with one global board. Per-player difficulty would make two identical scores mean
different things — fairness and comparability are the product. Difficulty work
therefore goes into **deterministic** pacing (fixed set-pieces at fixed indexes),
not adaptation. The telemetry histogram is the tool that proves a set-piece is
too sharp without touching anyone's run.

## 3. Decision depth

**Sid Meier, "Interesting Decisions", GDC 2012.**
<https://gdcvault.com/play/1015756/Interesting>
Verbatim gist: "Games are a series of interesting decisions"; a decision is
interesting when it involves a **trade-off**, is **situational**, and the player
has **enough information** to judge it — and the game must acknowledge the choice.
→ *Implication:* RUSH is currently a fixed multiplier, not a decision: it never
presents a trade-off with incomplete-but-sufficient information. Two concrete
applications: (a) a seeded **modifier choice** at run start with explicit
trade-offs (casual lane only, ranked lane stays baseline), (b) a **style/quality
score** so "how you climbed" becomes a decision axis next to "how high".

**Jesse Schell, *The Art of Game Design* (3rd ed., 2019)** — the lens framework;
"the player's mind is the real game". Used here as the vocabulary for evaluating
choice quality, not as a numeric source.

## 4. Game feel and juice (the polish layer)

**Maddy Thorson, "Celeste & Forgiveness".**
<https://www.maddymakesgames.com/articles/celeste_and_forgiveness/index.html>
Verbatim: ten tricks "centered around widening timing or positioning windows,
so that everything is fudged a tiny bit in the player's favor" — "it wants you
to succeed." Already mined in `PLATFORMER-UX-RESEARCH.md §2`; the engine ships
coyote time, jump buffering, jump cut and hang gravity.
→ *Implication:* any new verb (e.g. an air jump) must arrive WITH the same
forgiveness windows, or it will read as unfair rather than expressive.

**Matt Thorson, "Level Design Workshop: Designing Celeste", GDC 2017.**
<https://www.gdcvault.com/play/1024307/Level-Design-Workshop-Designing-Celeste>
Paraphrase: introduce a mechanic in a safe space, then test it, then combine it;
difficulty is a sequence of readable single-idea screens.
→ *Implication:* a deterministic difficulty director should follow that grammar —
one new hazard idea per segment, never two at once — which is cheap for a
generated axis: a segment is a function of the candle index.

**Martin Jonasson & Petri Purho, "Juice it or lose it", GDC 2012.**
<https://www.youtube.com/watch?v=Fy0aCDmgnxg>
Paraphrase: the same game becomes dramatically more satisfying by adding
surface feedback only — tweening, particles, sound, screen response — with zero
rule changes.
→ *Implication:* the cheapest professionalization is feedback, not features. The
engine already has particles, shake and slow-mo; what is missing is **audio
variety** (five synth effects) and the feedback that makes a *quality* run feel
different from a lucky one.

**Jan Willem Nijman (Vlambeer), "The Art of Screenshake", INDIGO 2013.**
<https://www.youtube.com/watch?v=AJdEqssNZ-U>
Paraphrase: thirty tiny, cheap tricks (recoil, hit-stop, camera kick, sound
layering) that make action legible and satisfying.
→ *Implication:* the landing/crumble feedback loop is the place to spend polish
budget — it fires dozens of times per run, so its cost per unit of feel is the
lowest in the game.

## 5. Retention expectations (what "good" means)

**GameAnalytics, "2026 Mobile & PC Gaming Benchmarks".**
<https://www.gameanalytics.com/reports/2026-mobile-pc-gaming-benchmarks>
Verbatim figures for 2025 mobile: median (P50) **D1 ≈ 22%**, **D7 just under 4%**,
**D30 ≈ 0.7%**; top decile (P90) D1 ≈ 40%, D7 ≈ 11–12%; top 1% D7 > 25%.
→ *Implication:* a browser game with a daily seed has no install funnel, so its
realistic comparison is D1 and D7 among returning players, not store benchmarks.
The honest use of these numbers is as a **ceiling check**: if a design change
cannot plausibly move first-session completion or next-day return, it is polish,
not retention work.

## 6. What this document does NOT claim

- No source here proves a specific change will raise retention for THIS game.
  Each is a design prior; the telemetry in §2 is how a prior becomes evidence.
- No dates, no promised features. The ten-pattern table is a statement of the
  current code, and it changes when the code does.

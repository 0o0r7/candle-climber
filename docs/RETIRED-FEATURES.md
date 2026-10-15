# Retired / Removed Features — Decision Record

> Purpose: layers that were **deliberately de-surfaced or retired** get one
> immutable entry here, so a future edit never resurrects them by accident
> ("suddenly that layer shows up again and messes up the work").
> Each entry states the full history honestly — including when something is
> **not yet physically gone**. Agents: check this file BEFORE re-adding any
> UX surface that resembles an entry below.

---

## R-1 · Character-selection layer ("CHOOSE YOUR CLIMBER")

**Status: RETIREMENT DIRECTED by owner (2026-10-15) — physical removal of the
UI row PENDING the owner's explicit go. Nothing below may be re-exposed in the
meantime.**

### History (verified against git)

| When | Event |
|---|---|
| 2026-10-02 | **Added** as P3.11–P3.14 (`d8c1365`), owner-directed (roster directives O5: "همشون خوبن و با کیفیت"): 15 identities — CLASSIC (the procedural blockbot) + 14 sprite mascots (WICK VENOM, WICK COP, GOLDEN BULL, FROST LIQUIDATOR, SCARF RUNNER, VISOR DROID, GRUMP, GOBLIN, CADET, FLOOR TRADER, SCOUT BOT, CANDLE COWBOY, DAPPER LIQUIDATOR, BAG HOLDER) — with a pre-game select screen and decor-only FX profiles (`test/characters.test.ts` purity pins). |
| 2026-10-13 | Landing rebuild removed the landing-side character chips (first-paint surface #1 gone). |
| 2026-10-14 | De-clutter pass folded the entry card; the roster row ended up **hidden behind the "TERRAIN & OPTIONS" expander** (first-paint surface #2 gone). |
| 2026-10-15 | Owner message: the multi-character version was removed from the final product and **that is the desired end state** — he explicitly endorsed the removal ("بهتر هم که حذف شد") and asked for this record so the layer never resurfaces in future edits. |

### TRUE state as of 2026-10-15 (honesty note)

The owner believed the layer was **already fully gone**. It is not: the
"YOUR CLIMBER / CHOOSE YOUR CLIMBER" roster row is still shipped inside the
fold on `/play` (`src/components/cc/GameCanvas.tsx`), it persists a
`CC_CHAR_KEY` localStorage pick, and the 2026-10-15 Apple-matrix QA walked its
15 chips on **production** (8/8 profiles). This record intentionally documents
that discrepancy instead of papering over it (language law: the docs never
claim something is removed while it is still reachable).

### What stays, what goes (when the owner says "remove it")

- **GOES (one-word-gated):** the roster row UI in GameCanvas, its QA checks
  (15-chip / venom-select legs in `scripts/realdevice_matrix.ts` and the
  LambdaTest session script), and the CC_CHAR_KEY user-facing wiring. Removal
  must be one clean sweep + QA evidence refresh, not a slow fade.
- **STAYS regardless:** `src/game/cc/characters.ts` registry + sprite assets
  (`public/cc/chars/*`) — they are (a) the rival bot's own skin source,
  (b) the project's finalized mascot art, (c) the brand source of the death-card
  NFT image (`public/nft/death-card.png`). "Retire the selection layer" never
  means "delete the mascots".

### Rules for future edits (binding until R-1 is fully executed)

1. Do **not** re-expose character selection in first-paint UX (landing or
   entry card).
2. Do **not** rebuild a dedicated character select screen.
3. Do **not** grow the roster or its FX system.
4. Do **not** delete the registry/sprites (see STAYS list above).

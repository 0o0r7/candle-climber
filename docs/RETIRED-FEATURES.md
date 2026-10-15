# Retired / Removed Features — Decision Record

> Purpose: layers that were **deliberately de-surfaced or retired** get one
> immutable entry here, so a future edit never resurrects them by accident
> ("suddenly that layer shows up again and messes up the work").
> Each entry states the full history honestly — including when something is
> **not yet physically gone**. Agents: check this file BEFORE re-adding any
> UX surface that resembles an entry below.

---

## R-1 · Character-selection layer ("CHOOSE YOUR CLIMBER")

**Status: RETIRED — EXECUTED 2026-10-15 (same day as the directive). The roster
row is REMOVED from the product; the rules below stay binding forever.**

### Execution record (2026-10-15, owner-approved sweep)

- `src/components/cc/GameCanvas.tsx`: the "YOUR CLIMBER / CHOOSE YOUR CLIMBER"
  roster row removed; `pickChar`, the `charId` state, the `CC_CHAR_KEY`
  load/persist block and the `?char=` deep link removed with it. Everyone
  climbs as CLASSIC (`charIdRef` pinned to `DEFAULT_CHAR_ID`); run payloads
  still carry `charId` unchanged (schema-compatible, now always "default").
- Registry + sprites intentionally KEPT: `src/game/cc/characters.ts` and
  `public/cc/chars/*` (rival-bot skins, archived-run/ghost champion names,
  project mascot art incl. the death-card NFT image brand).
- QA retired with the surface: `char_chips_rendered` + `venom_select` checks
  removed from `scripts/realdevice_matrix.ts` (hydration signal moved to the
  `.cc-mode-btn` tablist) and `scripts/lambdatest_realdevice.py` (boot signal
  same swap; check list renumbered 16 -> 14).
- Returning players who had picked a mascot: their saved `cc_char_v1`
  localStorage key is simply ignored now (no migration needed — cosmetic
  only); ghost/champion history still renders the correct character names.

### History (verified against git)

| When | Event |
|---|---|
| 2026-10-02 | **Added** as P3.11–P3.14 (`d8c1365`), owner-directed (roster directives O5: "همشون خوبن و با کیفیت"): 15 identities — CLASSIC (the procedural blockbot) + 14 sprite mascots (WICK VENOM, WICK COP, GOLDEN BULL, FROST LIQUIDATOR, SCARF RUNNER, VISOR DROID, GRUMP, GOBLIN, CADET, FLOOR TRADER, SCOUT BOT, CANDLE COWBOY, DAPPER LIQUIDATOR, BAG HOLDER) — with a pre-game select screen and decor-only FX profiles (`test/characters.test.ts` purity pins). |
| 2026-10-13 | Landing rebuild removed the landing-side character chips (first-paint surface #1 gone). |
| 2026-10-14 | De-clutter pass folded the entry card; the roster row ended up **hidden behind the "TERRAIN & OPTIONS" expander** (first-paint surface #2 gone). |
| 2026-10-15 | Owner message: the multi-character version was removed from the final product and **that is the desired end state** — he explicitly endorsed the removal ("بهتر هم که حذف شد") and asked for this record so the layer never resurfaces in future edits. |

### TRUE state — superseded by the execution above (kept for the history)

At the moment of the directive the layer was NOT fully gone: the
"YOUR CLIMBER / CHOOSE YOUR CLIMBER" roster row was still shipped inside the
fold on `/play`, it persisted a `CC_CHAR_KEY` localStorage pick, and the
2026-10-15 Apple-matrix QA walked its 15 chips on **production** (8/8
profiles). The directive made the desired end state explicit; the sweep above
then made reality match the record (language law: the docs never claim
something is removed while it is still reachable).

### Rules for future edits (binding permanently)

1. Do **not** re-expose character selection anywhere (landing, entry card,
   settings, first-paint — no surface).
2. Do **not** rebuild a dedicated character select screen.
3. Do **not** grow the roster or its FX system.
4. Do **not** delete the registry/sprites — they are load-bearing for the
   rival bot's skins, the ghost/champion names, and the project's mascot art
   (incl. the death-card NFT image brand).

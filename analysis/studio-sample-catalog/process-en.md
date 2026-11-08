# Process: Reviewing 40 Public Studio Sample Games

## Purpose and boundaries

This workflow reviews the 40 entries in the public Studio sample-game catalog for abstract, testable design principles that may be relevant to Candle Climber. It is not a comprehensive playtest, a product quality audit, or permission to reproduce a sample game's identity. Do not recreate names, brands, copy, characters, images, audio, levels, or proprietary assets.

Repository changes for this work belong only on `research/studio-sample-catalog-v2`. Do not modify, merge into, or deploy from `main`; production remains untouched. Direct public page URLs are omitted from the distributable database. Stable IDs, titles, categories, official-card copy, evidence summaries, and stage references remain available.

## Data model and deliverables

Each source item has a stable ID from `game-01` to `game-40`. The final record keeps these claim classes separate:

1. **Direct observation:** visible in a named screenshot stage or recorded page text.
2. **Official-card claim:** promotional or instruction copy that has not necessarily been confirmed in active gameplay.
3. **Technical candidate:** a browser/resource trace that suggests, but does not prove, a library, engine, rendering path, or implementation detail.
4. **Unknown / not observed:** evidence was insufficient. Absence from one frame does not prove absence from the full game.

The analysis schema covers observed goal, controls, core loop, progress feedback, decisions and risk/reward, rewards, penalties/failure, outcomes/replay, onboarding, visual/audio/accessibility, technical clues, transferable principles, Candle Climber relevance, do-not-copy rules, evidence, confidence, and limitations. Every evidence entry carries a claim, source type, stage, certainty, and stable source reference. Direct URLs are excluded from the public database.

## Public-page capture

The technical audit runs with Node 20, Playwright 1.49.0, and Chromium at 1280×800. Its generic sequence has five intended stages: page load; a safe start attempt; a short generic key sequence; a combined right-arrow and Space hold for 900 ms; and a later frame. It records page title/text/status, errors, screenshots, canvas inventory, selected resource metadata, and possible static technical candidates.

This sequence is a screening pass. It is not a game-specific control test, and no login, payment, private API, purchase, or account modification is part of the method. A screenshot changing does not prove that the game accepted an input or that the input caused the change. Page/resource metadata is not equivalent to gameplay, engine identification, or asset provenance. The full game bundle is not retained.

Run the capture from the repository root with:

```bash
node scripts/studio-sample-tech-audit.mjs
```

The GitHub Actions workflow is scoped to the research branch. The screenshots remain run artifacts rather than committed binary assets.

## Observation levels

Use exactly these levels and do not upgrade a record without direct supporting evidence:

- `metadata_only`: only the official card or metadata was available.
- `page_only`: a start page, loading view, menu, or story was visible; active gameplay was not confirmed.
- `partial_gameplay`: direct evidence of an active scene exists, but a full loop or outcome was not observed.
- `gameplay_loop_observed`: a repeatable loop can be described from direct evidence.
- `outcome_observed`: a result, win, or loss was directly recorded.
- `capture_unavailable`: no usable screenshot or text evidence was available.

“Page did not open,” “game did not launch,” and “game is broken” are different claims. State only what the evidence supports. Official copy does not replace playtesting; a library marker does not prove the runtime engine; errors or rendering fallbacks do not, by themselves, prove user-visible failure.

## Per-game analysis and synthesis

Each per-game analysis should use only that game's supplied page text/metadata and original staged JPGs. Do not browse for additional sources, rerun controls, guess hidden controls, or infer a gameplay result from genre conventions. Cite every material claim to the game ID, source type, and stage. Preserve uncertainty and limitations explicitly.

Synthesis may combine successful records with the Candle Climber source/code baseline. Report capture status, observation level, image coverage, and analysis completeness separately. A page-only game must never be counted as a playtested loop. A failure list with zero entries means no failures were supplied to that field; it does not mean no experience or capture failed.

## English deliverables and reproducibility

The Persian source files remain unchanged. English per-game analyses live in `game-analysis-results-en/`. To build the English JSON/CSV database from the English analysis files and the original catalog/capture metadata, run:

```bash
python3 scripts/build_game_database.py \
  --catalog analysis/studio-sample-catalog/catalog.json \
  --technical analysis/studio-sample-catalog/technical-audit.json \
  --analysis-dir analysis/studio-sample-catalog/game-analysis-results-en \
  --review-assets-index analysis/studio-sample-catalog/review-assets/workflow-items.json \
  --capture-run-id 42491536835 \
  --fallback-run-id 42487657236 \
  --output-dir analysis/studio-sample-catalog/database-en
```

The builder checks the 40 unique catalog IDs, the technical-audit ID set, analysis completeness, JSON/CSV counts, and direct-URL sanitization. It preserves screenshot stage and provenance metadata. The current run ID is `42491536835`; supplemental image provenance uses `42487657236`.

## Quality gates

Before delivery, verify all of the following:

- Exactly 40 unique IDs exist in the catalog, English per-game analyses, English JSON database, and English CSV.
- English analysis JSON keeps the same keys, value types, array order, IDs, enums, evidence references, and uncertainty as its Persian source.
- Direct evidence, page/card assertions, technical candidates, and unknowns remain distinct.
- Every screenshot reference has an image stage and source; fallback images are not treated as comparable animation evidence without qualification.
- No direct public URL or local filesystem path is introduced into the distributable dataset.
- `main` and production remain untouched; only the designated research branch is changed.
- The final implementation review does not add controls, score, physics, wallet advantages, or borrowed proprietary assets by implication.

## Technical files

- `catalog.json`: 40 official card records.
- `technical-audit.json`: 40 browser-capture records.
- `review-assets/workflow-items.json`: screenshot stage and provenance index.
- `game-analysis-results/`: original per-game source analyses.
- `game-analysis-results-en/`: English translated analyses.
- `database/game-database.json` and `.csv`: original-language merged database.
- `database-en/game-database.json` and `.csv`: English merged database.
- `report-en-final.md`: cross-game synthesis and v2 hypothesis.
- `visual-review-en.md`: engineering feasibility and acceptance checklist.

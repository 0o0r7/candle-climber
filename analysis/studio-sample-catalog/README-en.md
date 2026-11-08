# 40-Game Sample Catalog and Research Method

This directory contains a structured review of 40 public Studio sample-game pages and an implementation-oriented assessment of how carefully bounded design principles may apply to Candle Climber. The English deliverables are intended for engineering review, including the Super Z Agent Coder. Original Persian sources remain unchanged for provenance.

> **Research status:** research and implementation-feasibility guidance only. Recommendations are not approval to change gameplay, merge code, or deploy. The research was prepared from the public research branch `research/studio-sample-catalog-v2` at baseline commit `e211cb7`; `main` and production are out of scope.

## Principal finding

The 40-entry catalog is not equivalent to 40 completed game playtests. All 40 pages returned HTTP 200 and reached a `loaded` page state in the latest technical capture, but 25 records are classified `page_only` and 15 `partial_gameplay`. No complete gameplay loop, outcome, win/loss, or controlled input-to-result relationship is confirmed for the set. The defensible design implication is therefore modest: make the existing Candle Climber goal, next milestone, risk, and result easier to read; do not treat advertised features or static technical traces as proven gameplay patterns.

Candle Climber already has the core systems this proposal would surface: a deterministic daily chart, fixed-step Canvas 2D physics, variable-height jump, coyote time, jump buffering, red-candle crumble, combo scoring, optional skill-based RUSH, Summit graduation, World 2, score/history, Death Cards, ghosts, bots, duels, and guest/official competitive lanes. See the [English v1 baseline](candle-climber-v1-baseline-en.md), [English research report](report-en-final.md), and [English technical visual review](visual-review-en.md).

## Evidence coverage

| Measure | Result | Interpretation |
|---|---:|---|
| Catalog and independent analysis records | 40 | IDs `game-01` through `game-40`; every record has an analysis file. |
| Latest technical page captures | 40 loaded / HTTP 200 | Page load is not proof that active gameplay loaded. |
| Latest capture statuses | 23 `completed`, 14 `partial`, 3 `budget_timeout` | Status describes the capture sequence, not whether gameplay was completed. |
| Merged image evidence | 188 images across 39 games | 35 games have five images, three have four, one has one, and one has none. Images may show loading or menus. |
| Observation levels | 25 `page_only`, 15 `partial_gameplay` | No record is classified as a confirmed full loop or outcome. |

Full per-game English results are available in [`game-analysis-results-en/`](game-analysis-results-en/), and the merged, URL-sanitized English database is in [`database-en/game-database.json`](database-en/game-database.json) and [`database-en/game-database.csv`](database-en/game-database.csv). The JSON retains the English analysis alongside the catalog and technical-capture metadata. Use the CSV for filtering and the JSON for evidence-level detail.

## English deliverables

- [Final research report and v2 hypothesis](report-en-final.md)
- [Super Z technical visual review](visual-review-en.md)
- [Technical capture summary](technical-summary-en.md)
- [Research process and QA rules](process-en.md)
- [Candle Climber v1 project baseline](candle-climber-v1-baseline-en.md)
- [AI reviewer prompt for one sample game](game-review-prompt-en.md)
- [English per-game JSON analyses](game-analysis-results-en/)
- [English merged database (JSON)](database-en/game-database.json)
- [English merged database (CSV)](database-en/game-database.csv)

Persian originals, raw capture metadata, and the source builder remain in their original locations. This English layer does not overwrite them.

## Rebuild the English database

From the repository root, run the existing deterministic builder with the English per-game analysis directory. The run IDs below identify the current and supplemental screenshot sources used by the project database; they do not imply that each screenshot shows gameplay.

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

The builder validates 40 unique catalog IDs, 40 unique analysis IDs, 40 capture records, JSON/CSV row counts, and the omission of direct public URLs from the distributable database. It also records image stage, source, and capture-run provenance.

To repeat the public-page technical capture, use Node 20, Playwright 1.49.0, and Chromium, then run:

```bash
node scripts/studio-sample-tech-audit.mjs
```

The browser sequence is generic, not game-specific. It is a screening pass, not a controlled playtest; do not infer accepted input or causality from a changed screenshot alone. Full game bundles are not stored. The 188-image evidence archive is intentionally not vendored into the repository; the database preserves stage/source references, and the capture workflow stores its images as run artifacts.

## Evidence and implementation guardrails

Each result distinguishes direct screenshot/page-text observation from official-card claims, technical candidates, and unknowns. Confidence and limitations are per game. The sample data must not be used to claim unobserved gameplay, copied assets, or a feature's effectiveness.

For Candle Climber, all implementation proposals remain render/UI-only unless product owners separately approve a gameplay change. Preserve physics, collision, score, rank, deterministic terrain, public-data honesty, accessibility, and the project's skill-only economy rules. Do not add wallet advantages, free brake, lateral steering, route branches, camera orbit/zoom, or copied sample-game art as a result of this study. See [ECONOMY-LAWS](../../docs/ECONOMY-LAWS.md), [PLATFORMER-UX-RESEARCH](../../docs/PLATFORMER-UX-RESEARCH.md), [ART-DIRECTION](../../docs/ART-DIRECTION.md), and [RETIRED-FEATURES](../../docs/RETIRED-FEATURES.md).

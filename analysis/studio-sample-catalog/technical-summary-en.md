# Technical Capture Summary — 40 Studio Sample Games

## Capture status at a glance

The latest public-page capture pass processed all 40 catalog entries. Each page was recorded as `loaded` with HTTP 200; that is only a navigation result, not proof that the game itself started. Capture outcomes were:

| Capture status | Count | Game IDs |
|---|---:|---|
| `completed` | 23 | `game-02`, `game-09`, `game-12`, `game-13`, `game-14`, `game-16`, `game-19`, `game-20`, `game-23`, `game-24`, `game-25`, `game-29`, `game-30`, `game-31`, `game-32`, `game-33`, `game-34`, `game-35`, `game-36`, `game-37`, `game-38`, `game-39`, `game-40` |
| `partial` | 14 | `game-01`, `game-03`, `game-04`, `game-05`, `game-06`, `game-07`, `game-08`, `game-10`, `game-11`, `game-15`, `game-21`, `game-22`, `game-26`, `game-27` |
| `budget_timeout` | 3 | `game-17`, `game-18`, `game-28` |

A `completed` capture means the planned capture sequence completed, not that a game loop or outcome was observed. After merging current and supplemental evidence, 188 images are available for 39 games: 35 games have five images, three have four images, one has one image, and one has no image. A five-image set may still consist of loading, onboarding, or menu screens.

## Evidence classification

The independent map analyses classify the 40 records as follows:

- **25 `page_only`:** a title, loading screen, menu, story, or other page-level view was available, but active gameplay was not directly confirmed.
- **15 `partial_gameplay`:** at least one direct indicator of an active scene or changing HUD was visible, but a complete repeatable loop and final outcome were not observed.
- **0 confirmed `gameplay_loop_observed` records.**
- **0 confirmed `outcome_observed` records.**

The 25 page-only records are `game-01` Iron Rift FPS; `game-02` Space Worm 3D; `game-04` The Rogue; `game-05` Canyon Circuit; `game-06` Super Dungeon; `game-07` Caveman vs Wild; `game-08` Space Worm 2D; `game-09` Sands; `game-11` Wildclaw: Colossus Hunt; `game-15` Superhero High School; `game-16` BeatStage 3D; `game-17` TerraForge; `game-18` Sizzle Up!; `game-19` Super Defense; `game-21` Lion City: After Hours; `game-22` Frostline Zero; `game-23` Critter Kart; `game-28` Faraway; `game-30` Nebula Pinball; `game-31` Mushroom Garrison; `game-32` Starveil Barrage; `game-34` Cloud Climber; `game-38` Nebula Squadron; `game-39` Card Battler; and `game-40` Shadow.

The 15 partial-gameplay records are `game-03` Side Scroller; `game-10` Frosthold; `game-12` Game Dev Game; `game-13` Lane Runner; `game-14` Hero Academy Architect; `game-20` Skybound Academy; `game-24` Siege; `game-25` Drift King; `game-26` Mini Golf Isles; `game-27` Strike Bowl; `game-29` Helix Drop; `game-33` Lantern Wayfarer; `game-35` Neon Alley Brawl; `game-36` Mushies - Merge Puzzle; and `game-37` Mage Knight.

These categories are deliberately conservative. A screenshot showing a value change does not establish which input caused it; a page description does not establish that its feature was exercised. A lack of evidence in an initial capture does not prove that a feature is absent from the game.

## Method and captured signals

The public pages were visited at a 1280×800 viewport. The planned five-stage sequence records page load, a safe start attempt, a short generic key burst, a combined right-arrow/Space hold, and a later frame. The capture also records page text and title, browser/page errors, canvas dimensions, network-resource metadata, and candidate engine/library markers. Small scripts may be scanned in memory for candidate numeric constants; full game bundles are not retained.

The sequence is not tailored to each game's controls. The input may be irrelevant, ignored, intercepted by a focused form, or occur while the page is still loading. A changed frame can be animation or elapsed time. Neither static library markers nor error codes establish the active engine, asset origin, intended physics, successful input, game quality, or a broken product.

## How to use the underlying records

The source capture is `technical-audit.json`; each record in the English database combines its page/capture fields with the corresponding English gameplay analysis and stage/provenance references. Use `database-en/game-database.json` for record-level evidence and `database-en/game-database.csv` for tabular filtering. See [process-en.md](process-en.md) for reproduction and evidence rules and [report-en-final.md](report-en-final.md) for cross-game synthesis.

No dedicated user research, device-scale accessibility study, controlled input experiment, or full-cycle playtest was conducted for the sample games in this capture pass. Recommendations based on the data must remain hypotheses until validated on Candle Climber itself.

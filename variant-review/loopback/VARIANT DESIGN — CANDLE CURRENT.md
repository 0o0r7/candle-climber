# VARIANT DESIGN — CANDLE CURRENT

## One-line concept

**Candle Current** is a short, tactile lane-reading game where a synthetic market tape becomes a current map: steer a small signal boat toward calm flow, take green boosts, and survive coral turbulence long enough to reach the horizon.

## Theme and narrative wrapper

The player is a **signal pilot** navigating a dark data sea. Each bar on the tape is a new current cell. The player is not trading and does not wager; they are reading a changing pattern and choosing a route. A run is framed as a “tape crossing,” not a liquidation.

The shipped variant uses a bundled **SYNTHETIC DEMO TAPE**. It must not be read as live prices or real user/market metrics. The source badge is always visible.

## Art direction

- **Movement:** editorial data-cockpit / analog navigation instrument.
- **Palette:** ink `#071014`, deep water `#0D1B21`, signal cyan `#65E6D6`, tape saffron `#FFB85C`, turbulence coral `#FF6B6B`, paper `#F3F0E8`.
- **Typography:** Space Grotesk for labels and headlines, IBM Plex Mono for telemetry.
- **Layout:** asymmetric: a dominant playable chart viewport, a narrow tape rail, and a bottom command strip. Avoid centered dashboard grids.
- **Signature elements:** curved sonar arcs, a vertical tape rail with actual bar bodies, and a small boat glyph whose wake grows with a clean streak.
- **Interaction:** controls are direct and physical—left/right lane buttons, A/D, arrow keys, and swipe-friendly tap zones. Every hazard is previewed before it arrives.
- **Motion:** 180–300ms lane glide, slow camera drift, subtle scanline/sonar pulse, no decorative motion that competes with the next lane decision.
- **Voice:** terse, observant, non-financial: “read the flow”, “clean signal”, “turbulence ahead”, “crossing complete”.

## Core loop

1. See the next three tape cells and the highlighted calm route.
2. Move the boat one lane at a time.
3. Hit the calm lane for a clean signal and streak; hit the boost lane for a bigger score; enter coral turbulence and lose hull integrity.
4. Recover or commit to a route through the next cells.
5. Complete 24 cells to cross the tape, or lose 3 hull points.
6. Review score, best run, discovered pattern note, and one “change your route” hint.
7. Retry immediately; the deterministic tape remains the same so mastery is readable.

## Economy design

- **Free base:** all 24 cells, all score, all three sessions, and all retry behavior are free.
- **Local Signal Notes:** non-transferable local achievements for clean crossings and streaks. They are progress language, not rewards or value.
- **Optional $WICK relation:** future read-only holder status may unlock wake colors, tape skins, and an alternate night route. It never changes ranked score, hull, base access, or physics. Any live integration remains `[UNVERIFIED — NEEDS OWNER INPUT]` until a contract address and balance-read design exist.
- **Weights philosophy:** if later connected to the platform’s recognition/airdrop-weight system, only server-verified participation dimensions would count: clean streak days, route-reading notes, and archive crossings. No earnings, no guarantees, no gambling framing.
- **Testnet disclosure:** the variant does not require a wallet and contains no purchase flow. Any future token link must say testnet and no monetary value.

## KEPT vs. DELIBERATELY CHANGED vs. CANDLE CLIMBER

| Dimension | Kept from the original DNA | Deliberately changed in Candle Current | Why the change matters |
|---|---|---|---|
| Market translation | A data tape becomes playable terrain | Bars become lane currents, not platforms | Proves the product soul can survive a genre change |
| Determinism | Same seeded sequence enables fair retries | One bundled synthetic tape is pinned locally | Static hosting stays honest and testable |
| Skill | Reading before acting, route commitment, mastery | Lane timing and forecasted route choice | Different hand-feel; no jump physics reskin |
| Failure | Clear, short, retryable failure | Hull integrity and turbulence diagnosis | More legible cause-and-effect than a fall |
| Session length | Compact runs with “one more” pull | Exactly 24 visible tape cells | Stranger can finish three sessions quickly |
| Visual identity | Strong typography and data marks | Analog navigation cockpit, cyan/saffron water | Distinct product silhouette |
| Social/share potential | Result artifact and competitive score | Crossing report with route quality/pattern note | New share surface without copying Death Cards |
| Progression | Daily/archival mastery ideas | Local Signal Notes; optional cosmetic holder layer | Keeps rank fair while testing a different economy |
| Economy | Free base, honest testnet posture | Holder status is cosmetic/accessory only | Holder utility without pay-to-score |
| Architecture | Small pure game rules + persistence | Vanilla static app, no API dependency | Lower build risk for a comparable experiment |

## Build constraints

The variant is a new separate deliverable. It does not import original source, assets, data, or deployment settings. It uses only static bundled synthetic data and browser local storage. No keys, paid APIs, transactions, or wallet signing are required.

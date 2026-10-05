# GAME CONCEPT — LOOPBACK

## One-line pitch

**LOOPBACK is a 60-second routing puzzle for people who ship: rotate a tiny agent's signal board until every request reaches the right output, then publish the clean build.**

## What the player does

A small build request arrives as three colored packets. The player rotates printed circuit tiles on a 4×4 board to connect the input port to the matching output ports. A successful route lights the board, the agent boots, and the player advances to the next build. A session contains three deterministic builds; each build is short enough to understand in one glance and hard enough to invite a retry.

The game has no market-price claims, no wallet requirement, no transactions, and no gambling mechanic. It borrows the ecosystem's builder/product language rather than its existing games' physical grammar.

## Vibe and world

The player is inside a miniature **autonomous-agent repair bay**. A small machine called LOOPBACK is trying to ship a useful tool, but its signal board was scrambled during a build. Every rotation is a visible engineering decision. The “reward” is not a token payout: it is a clean compile, a better time, and a stamped build report.

Timeline hook copy:

> **LOOPBACK is live. Wire the agent. Ship the build.**
>
> A 60-second routing puzzle for people who ship — no wallet, no fake metrics, just one clean compile after another.

## Art direction

- **Movement:** industrial blueprint / terminal instrument, with a warm workbench rather than a finance chart.
- **Palette:** carbon `#0B0E12`, blueprint `#101D2B`, electric violet `#C58CFF`, mint `#9CFFD0`, amber `#FFC857`, paper `#F7F4ED`, fault red `#FF6878`.
- **Typography:** Space Grotesk for human-facing copy, IBM Plex Mono for build telemetry.
- **Layout:** a large blueprint board offset beside a narrow build log; the CTA and first board are visible immediately. No centered hero waiting room.
- **Signature motifs:** stamped `COMPILED` labels, a living wire glow that traces the solved route, and a tiny agent avatar that changes posture from “waiting” to “shipping.”
- **Audio:** quiet relay clicks for rotations, a rising three-note boot chord on solve, a soft paper-stamp thump on compile. Audio is optional and local-only.
- **Copy voice:** concise, builder-aware, lightly playful: “rotate the route”, “compile clean”, “one broken edge”, “ship it.”

## Core loop

1. Click **START BUILD**; the first board is already visible behind the CTA.
2. Rotate tiles with click/tap, `R`/`E`, or arrow keys after selecting a tile.
3. Watch the live wire preview; a valid source-to-output path glows.
4. Solve three boards before the session clock expires.
5. Receive a build report with compile count, best streak, time, and a local “ship note.”
6. Retry the exact deterministic sequence to improve the report.

## Progression and economy

- **Free core:** all three boards, all sessions, all scores, and the retry loop are free.
- **Local Build Notes:** local-only milestones such as “three clean compiles” or “zero-hint session.” They are non-transferable and have no monetary value.
- **Future token stance:** v0 launches without a token. If the product earns a real community, a future launch may use a new token **$PATCH** only after owner approval and current platform verification. Any future token would unlock blueprint skins, agent chassis cosmetics, and community challenge boards; it would never affect solve validation, ranked time, or base access. Every on-chain detail is **[UNVERIFIED — NEEDS OWNER INPUT]**.
- **Why not $WICK:** LOOPBACK is an independent alternative, not an extension of the flagship. Reusing $WICK would blur product identity and make the experiment impossible to evaluate honestly.
- **Testnet disclosure:** if a token is ever launched, the UI will state that it is a testnet token with no monetary value, make no rewards/earnings promise, and use “recognition” language only for any future participation record.

## Why this fits this ecosystem

The ecosystem study shows a founder who ships tools, values UI/art, promotes a playable free core quickly, and wants products to be easy to find. LOOPBACK is a product first: the interaction is obvious in one screenshot, it demonstrates actual utility-language (routing, builds, compile), and it can stand alone without financial speculation. Its future token path is optional, cosmetic, and separated from fair performance.

## Alternative, not derivative

| Dimension | Existing flagship: Candle Climber | Promoted community example: Vibe Arena / Vibe Folk | LOOPBACK |
|---|---|---|---|
| Genre | Vertical skill platformer | Click/arena battler with gear | Spatial routing puzzle |
| Player verb | Jump / climb | Fight / collect / upgrade | Rotate / connect / compile |
| World | Market candles become mountain | Nine characters in a ring | Autonomous-agent repair bay |
| Visual grammar | Candle slabs, weather, score HUD | Block characters, arena, shop | Blueprint board, wire glow, build log |
| Data dependency | Real/synthetic chart terrain | Client-side combat state | Deterministic authored routing boards; no fake market data |
| Session shape | Climb until summit or liquidation | Battle/upgrade loop | Three 20-second build puzzles |
| Token relation | $WICK utility roadmap | $FOLK holder tiers and buy link | No token in v0; future $PATCH cosmetics only |
| Social proof | Death Card / score / ghosts | Holder tier and gear | Compile report / local ship note |

## Success bar

A stranger should understand “rotate the board until the signal reaches the output” from the first screen, finish one board within 10 seconds of interaction, and choose to run a second session because the exact route is learnable but not trivial.

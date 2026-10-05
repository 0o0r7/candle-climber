# Candle Current

A deliberately differentiated browser-game variant of Candle Climber.

> **Read the flow.** A bundled synthetic market tape becomes a three-lane current map. Steer the signal boat toward calm flow, take saffron boosts, and avoid coral turbulence.

## Run locally

No build step or API key is required:

```bash
python3 -m http.server 4173
# open http://127.0.0.1:4173
```

The app is static and works from any static host. `npm run check` runs a JavaScript syntax check.

## Controls

- Keyboard: `A` / `D` or `↑` / `↓`
- Touch: tap a lane or use the two arrow buttons
- Objective: cross 24 tape cells before hull integrity reaches zero

## Data and economy honesty

- The visible tape is explicitly labeled **SYNTHETIC DEMO TAPE**. It is not live market data and contains no real price or user metric claims.
- The base game is free and does not require a wallet.
- No score, hull, or base access is token-gated.
- Any future `$WICK` relationship is cosmetic/accessory-only and remains `[UNVERIFIED — NEEDS OWNER INPUT]` until a real contract/balance-read design is supplied.

## Project docs

- `VARIANT-ANALYSIS.md` — Phase 1 study of Candle Climber and opportunities.
- `VARIANT-DESIGN.md` — concept, art direction, core loop, economy, and kept/changed table.
- `COMPARISON-MATRIX.md` — original vs. variant scoring and merge-back verdict.
- `TEAM.md` — self-orchestrated specialist roles and decisions.
- `manus-routes.json` — static route manifest.

## Source repository

Private GitHub repo: https://github.com/0o0r7/candle-current

## Deployment status

A Vercel project creation was attempted for a **new** project named `candle-current`. The connected Vercel team returned HTTP 403 (`You don't have permission to create the project`), so no Vercel project was created and the original Candle Climber deployment was not touched. This repo is ready to deploy when the team permission is granted.

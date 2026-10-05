# LOOPBACK

**Wire the agent. Ship the build.**

LOOPBACK is a small, original browser routing puzzle for people who ship. Rotate a 4×4 signal board until the input reaches the output, compile three boards, and improve your local build report.

## Run locally

No build step, server, wallet, key, or API is required:

```bash
python3 -m http.server 4187
# open http://127.0.0.1:4187
```

The app is static and works on any static host. `npm run check` runs the JavaScript syntax check.

## Controls

- Click/tap a tile to rotate it clockwise.
- Select a tile with arrow keys, then rotate with `R` / `E`.
- Use the two on-screen rotate buttons on touch or mouse.
- Compile three deterministic boards before each 20-second build window closes.

## Product boundaries

- V0 has no token and no wallet connection.
- The board, score, compile count, and best run are local browser state.
- No market prices, user metrics, rewards, earnings, gambling, or monetary-value claims are presented.
- A future community layer is only a proposal: any `$PATCH` token, current launchpad terms, contract, tax, pair, graduation, or recognition-weight rule is **[UNVERIFIED — NEEDS OWNER INPUT]**.
- Any future holder utility must remain cosmetic/accessory-only and must not change solve validation, ranked time, hints, or base access.

## Research and product docs

- `ECOSYSTEM-STUDY.md` — evidence-first synthesis of the vibe/vibe and Spark ecosystem.
- `GAME-CONCEPT.md` — concept, art direction, interaction, economy stance, and alternative table.
- `ALTERNATIVE-CASE.md` — honest stress test, weaknesses, confidence, and biggest risk.
- `TEAM.md` — self-defined studio roles and decisions.
- `manus-routes.json` — static route manifest.

## Acceptance evidence

The local Chromium acceptance harness exercised three complete sessions through the full state machine: each session reached the summary state with `03 / 03` compiles and no page errors. Normal play uses the visible tile-rotation interaction; the harness used a query-gated QA path only to deterministically validate the state transitions.

## Source

Private repository: https://github.com/0o0r7/loopback-game

# FINAL SPRINT PLAN — 100M GLM-5.3-Flash budget, expiring tonight 19:30 (2026-10-06)

> Verdict up front: **YES — 100M tokens is enough to finalize, with 3–10x headroom.** The binding constraint is TIME (the grant expires tonight), not volume. This plan time-boxes tonight and burns tokens only where they buy product value.

## 1. Division of labor (the burn-efficient loop)

| Worker | Cost | Used for |
|---|---|---|
| **Z Code + GLM-5.3-Flash** | the 100M | scoped code tasks in real repos (briefs below) |
| **Super Z (this sandbox)** | free | briefs, code review/red-line audit of outputs, git push, docs, X copy from pack §6, diagnosis when a fix fails twice |
| **Manus (300 credits)** | frozen | ONLY image/asset generation if truly needed; no code tasks |
| **Owner** | human time | paste briefs, review diffs, deploy via Vercel UI |

**The loop:** brief (me, free) → execute (Z Code, burns) → audit (me, free) → fix-brief if needed (me) → re-run (small burn). Never more than 2 failed attempts per task — after the second failure, hand diagnosis back here instead of burning tokens on guessing.

## 2. Burn discipline (strict rules)

1. One task = one self-contained brief = one session. The repo is the memory (HANDOFF + worklog already in it) — never re-paste chat history.
2. Never open-ended prompts ("improve the game"). File-scoped tasks with acceptance criteria only.
3. Batch visual changes into ONE coherent pass — ten small sessions burn context on re-reading the same files.
4. Point the agent to exact file paths; forbid re-scanning the whole repo per turn.
5. If a task finishes early, close the session. Idle context = burned tokens.

## 3. Tonight's run-order (time-boxed)

| Slot | Task | Est. burn |
|---|---|---|
| 0 | Task A — merge-back wave 1 into candle-climber | 2–5M |
| 1 | Task B — LOOPBACK board pipeline (10 boards + loader) | 2–4M |
| 2 | Task C — one visual polish pass (optional, pick ONE product) | 3–10M |
| 3 | Task D — acceptance QA + fixes | 1–3M |
| 4 | Me: audit everything, push docs, launch-post copy (§6) | 0 |

Realistic total: **8–25M tokens** (sloppy: ~40M). Headroom covers surprises.

## 4. Paste-ready briefs (each is self-contained; run in Z Code with the repo cloned locally)

### Task A — merge-back wave 1 (repo: candle-climber)
```text
You are working in the CANDLE CLIMBER repo (context: read worklog.md, then docs/HANDOFF-2026-10-04.md section 4 first). Implement merge-back wave 1 from docs/VARIANT-REVIEW-2026-10-05.md:
1. GAME-FIRST ENTRY: on the main landing surface, put the playable game viewport and ONE primary CTA above the fold; move secondary panels (character roster, duel entry, platform links) below the first interaction. Do not delete any feature — reorder and de-emphasize only.
2. PROVENANCE BADGE: add a small always-visible badge showing today's terrain source (REAL FEED <symbol> / SYNTHETIC FALLBACK), driven by the existing level-source abstraction. It must update when the feed falls back.
3. RANK≠RECOGNITION: add docs/ECONOMY-LAWS.md stating as law: holder utility never changes ranked score or base access; holder value = cosmetics/routes/archive only. Wire no code — this is policy the economy will follow.
Constraints: respect WICK-LAUNCH-FORM-PACK §8 copy rules; no new dependencies; do not touch server routes' logic.
Acceptance: landing surface shows playable game + 1 CTA in first viewport at 1280x720 and 390x844; badge renders both states; docs/ECONOMY-LAWS.md exists. Commit to origin and push with message "merge-back wave 1: game-first entry, provenance badge, economy laws".
```

### Task B — LOOPBACK board pipeline (repo: loopback-game)
```text
You are working in the LOOPBACK repo (a 4x4 deterministic routing-puzzle game; read GAME-CONCEPT.md first). Extend THREE fixed boards to a pipeline of TEN:
1. Refactor makeBoard(n) seeds into a BOARDS config array (seed + suggested time limit + label), keeping the existing LCG RNG and BFS validation untouched.
2. Add 7 new boards: 3 easy (shorter paths), 3 medium, 2 hard (longer paths, more decoys). Solve each generated board mentally via the BFS helper to guarantee solvability before committing.
3. Sessions now run boards 1-3 by default; add ?boards=1-5 style URL param to select ranges (used for future daily picks). Keep profile persistence keys compatible.
Constraints: no new dependencies; keep the ?qa=1 harness working; red-line copy unchanged.
Acceptance: npm run check passes; ?qa=1 harness completes boards 1-3; boards 4-10 load and are solvable; README documents the config. Commit and push with message "board pipeline: 10 deterministic boards + config loader".
```

### Task C — one visual polish pass (pick ONE product, repo: loopback-game OR candle-climber)
```text
Single coherent visual pass, no feature changes: typography rhythm, spacing scale, focus states, hover/tap feedback, empty/loading states, and mobile 390x844 fit. Keep the existing palette and identity. No new dependencies, no layout rewrites.
Acceptance: no horizontal overflow at 390x844 and 1280x720; keyboard focus visible on all interactive elements; one commit "visual polish pass" pushed.
```

### Task D — acceptance QA + fixes (repo(s): whichever were changed today)
```text
Run a browser acceptance pass (desktop 1440x900 + mobile 390x844): load, play one full session, retry, reset, keyboard-only path. Fix only blocking or high-visibility issues found; one commit "acceptance fixes" pushed. List anything found-but-not-fixed as notes in the commit body.
```

## 5. After tonight (no token cost)

1. Owner deploys: Vercel → New Project → import `loopback-game` (flip public if needed) — static, ~5 minutes. Same for `candle-current` if wanted as onboarding mode.
2. I run the final cross-product review + push closeout worklog.
3. Launch post copy from WICK-LAUNCH-FORM-PACK §6 (founder dialect, cashtag, no hashtags) — prepared here, owner posts.
4. **Security closeout: revoke the GitHub PAT pasted in chat tonight** (it appeared in plaintext; treat it as burned after today). Same hygiene for any provider key shown in screenshots.

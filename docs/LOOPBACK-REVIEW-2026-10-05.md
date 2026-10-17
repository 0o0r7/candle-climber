# LOOPBACK REVIEW — Manus experiment 2, knowledge-driven ideation (independent audit, 2026-10-05)

> ⚠️ **HISTORICAL — kept as a record, not current status (marked 2026-10-10).**
> A one-off audit of the Manus loopback experiment; its actions are done or
> superseded. Now-current sources: [`docs/README.md`](README.md) ·
> [`docs/TRUTH-TABLE.md`](TRUTH-TABLE.md).

> Reviewer: Super Z (main agent). Inputs: owner-uploaded zip (Manus project export), the four LOOPBACK deliverable docs, Manus's claims. Every verifiable claim re-checked; unverifiable ones flagged.

## 1. Verification results

| Check | Result |
|---|---|
| Original repo untouched | PASS — `origin HEAD` = `f8ad334` (our last commit, the alternative brief). No foreign commits. |
| New private repo `0o0r7/loopback-game` | 404 anonymously → consistent with a private repo created via connector (owner should confirm logged-in). |
| Live preview `4187-...manus.computer` | **FAIL — persistent 502.** The temporary sandbox is already down. The game itself could NOT be independently opened. |
| Game source in owner's zip | **MISSING.** The zip's `game.js/index.html/styles.css` are byte-identical (md5) to Candle Current's files from experiment 1 — the export included stale files, not `zero-game-venture`'s code. |
| Consequence | The playable artifact — the single most important deliverable — is currently UNVERIFIED. Docs-level review only. |

**Action to close the gap:** owner opens `github.com/0o0r7/loopback-game` logged-in and either makes it public temporarily, or re-attaches the actual `zero-game-venture` folder (index.html/game.js/styles.css) here. A 2-minute fix; the review verdict below is otherwise ready.

## 2. Red-lines audit (docs & copy level — code audit pending)

- v0 ships with NO token, NO wallet, NO transactions — the strongest possible compliance posture. PASS
- Copy audited: "no wallet, no fake metrics", "testnet token with no monetary value", "recognition" framing only, zero earnings/reward verbs across all four documents. PASS
- Every on-chain specific ($PATCH, contract, taxes, launch mechanics) tagged `[UNVERIFIED — NEEDS OWNER INPUT]` and gated behind explicit owner approval. PASS
- Launchpad API checked read-only; both protected repos untouched per Manus's report and our own git check. PASS
- Code-level audit: BLOCKED (see §1). Pending file delivery.

## 3. Quality assessment of the four documents

**ECOSYSTEM-STUDY.md — the best artifact of either experiment (9/10).** Source-cited for every major claim, honest about observability limits, and it derives real design consequences from platform mechanics (wallet-cap → many-players economics; transfer-lock → no-custody mechanics; testnet agreement → copy law). The goal statement ("small, visually unmistakable, genuinely playable product a timeline scroller understands in one sentence...") is a correct compression of our KB intel, not a paraphrase of the prompt.

**GAME-CONCEPT.md (8/10).** The routing-puzzle concept is genuinely distinct; the "why not $WICK" paragraph is unusually mature product thinking. Deductions: success bar metrics are asserted, not yet demonstrated; the game exists only as claims until verified (§1).

**ALTERNATIVE-CASE.md (9/10).** Names where it loses (market-native identity, data depth, social proof, spectacle, token narrative) with specifics, sets the win conditions, and self-assesses 0.78 confidence with "one-minute toy" as the named risk. This is the honesty we demanded.

**TEAM.md (7/10).** Real role separation and traceable decisions; thinner than experiment 1's because the doc is shorter, not because the logic is worse.

## 4. The boldest decision: no token in v0

Both earlier products tie into a token story from day one. LOOPBACK refuses a token until repeat use is proven — citing that a token-first launch would make it "look like a token wrapper," which is exactly the failure mode our KB intel says the founder ignores. This decision was NOT in the prompt; Manus derived it from the ecosystem evidence. It is the clearest signal that the knowledge-driven loop produced judgment, not imitation. (Owner note: any future $PATCH remains a separate owner decision — nothing is pre-agreed by this document.)

## 5. Three-way verdict (flagship vs Candle Current vs LOOPBACK)

| Dimension | Candle Climber | Candle Current | LOOPBACK |
|---|---|---|---|
| Origin | shipped flagship | derived variant | knowledge-driven original |
| Genre | vertical candle platformer | lane-current steering | 4×4 routing puzzle |
| Token relation | $WICK roadmap | cosmetic-only future | **none in v0** ($PATCH gated) |
| Market data | real feeds (core identity) | synthetic tape | none at all |
| Ecosystem grounding | built-in | inherited | **derived from cited study** |
| Verified playable | YES (live) | YES (reviewed live) | **PENDING (preview dead, code missing)** |
| Honest self-critique | n/a | good | best of the three |

**Answer to the owner's experiment question — can it create an alternative?** On the evidence available: **yes, credibly.** The ideation chain is traceable (study → consequences → design), the distinctness bar is genuinely met, and the no-token decision shows independent judgment. The final confirmation is mechanical, not conceptual: play the actual game once it is re-delivered. If the first frame matches the documented first frame (live board behind the CTA, one verb, one CTA), the alternative claim stands.

**On the competition framing:** Manus's knowledge-driven run is stronger than its from-product run — the synthesis quality and the token decision exceed anything in experiment 1. Honest score, no home-team bias.

## 6. Recommended next actions

1. Close the verification gap (2 min): owner delivers `zero-game-venture` code files or flips the private repo public temporarily; we run the code-level red-line audit and the 10-second test for real.
2. Permanent hosting (matches the owner's "Review feature plan"): since connector project-creation is 403-blocked, deploy manually — Vercel → New Project → import `loopback-game` (or drag-drop the folder). Static site, ~5 minutes. Manus's plan to preserve the core 4×4 puzzle, three boards, local build report, blueprint visual system, and static routes is sane; approve it.
3. Address the named risk early: a small authored board pipeline (5–10 boards, weekly cadence) is what separates a toy from a product — cheaper than any marketing.
4. The X post for any of these products comes later from WICK-LAUNCH-FORM-PACK §6 (founder dialect, cashtag, no hashtags) — LOOPBACK's own hook copy ("Wire the agent. Ship the build.") is compatible and well-written.
5. Keep all three artifacts alive as a portfolio: flagship (competitive depth), Current (onboarding-mode candidate), LOOPBACK (builder-native alternative + future $PATCH decision slot).

---

## 7. ADDENDUM (2026-10-06): code-level audit complete — verification gap CLOSED

Owner provided repo access; `0o0r7/loopback-game` (private, 2 commits) shallow-cloned and audited. Also confirmed `0o0r7/candle-current` (private) is byte-identical to the already-reviewed Candle Current — the zip's stale files were a red herring, nothing new there.

### Code audit of LOOPBACK (game.js 8.5KB / index.html / styles.css)

**Claims now verified at code level:**
- Deterministic boards: seeded LCG RNG, three fixed seeds → three fixed boards. TRUE
- Real puzzle logic: BFS connectivity validation (`reachable` / `boardSolved`), source cell → target cell; ANY valid route compiles (matches the copy promise). TRUE
- First-frame claim: home screen renders board 1 live behind the CTA (`preview()` at load). TRUE
- Built-in QA hook: `?qa=1` exposes `runSession()` that applies stored solution masks — explains the "three full sessions" acceptance claim; legitimate self-test. TRUE
- Red lines in shipped HTML: footer "TESTNET TOKEN: NONE IN V0 · NO MONETARY VALUE CLAIMS", "FREE CORE · NO WALLET · NO FAKE METRICS", "NOT A TOKEN WRAPPER" panel, summary note "no wallet, no reward promise". FULL PASS
- No keys/APIs/wallet code — localStorage only (Google Fonts CDN = same minor note as Current). PASS

**Found issues (non-blockers):**
1. `maskFor()` is dead code (always returns 0, never called) — sloppy leftover, harmless.
2. Mobile rotation is CW-only per tap; CCW requires the ↶ button — minor friction.
3. Any-valid-route wins = generous puzzle goal; fine for v0, tightens later via target-specific packets.

**Verdict upgrade:** the "credible alternative" claim now stands **VERIFIED at code level**. Remaining unknown is only the feel of play (needs a human 10-second test on a live deploy).

### Final standing of the two Manus experiments
- Experiment 1 (Candle Current): verified playable, red-lines PASS, quality good — onboarding-mode candidate.
- Experiment 2 (LOOPBACK): verified at code level, red-lines PASS, strongest strategic thinking (no-token v0) — builder-native alternative, deploy + play-test to finalize.

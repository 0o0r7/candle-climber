# Independent Review Prompt — One Studio Sample Game

Analyze exactly one sample game using only the supplied source materials for that game: its page text/metadata and its original staged screenshots. Do not browse the web, rerun the game, infer hidden controls from genre, or use another game's evidence. Return a structured JSON object following the required schema below.

## Evidence rules

Classify each claim and cite the game ID and evidence stage:

1. **Direct observation:** an item visibly present in a named screenshot or recorded in the page text. For visual claims, name the exact stage.
2. **Official-card claim:** copy or instructions from the public gallery card that have not necessarily been confirmed during active gameplay. Do not present them as tested gameplay.
3. **Technical clue:** a possible library, resource, engine, or numeric candidate. Do not state that it proves the active engine, gameplay behavior, or asset origin.
4. **Unknown / not observed:** the available evidence does not establish the fact. An element missing from an initial frame does not prove that it is absent from the full game.

A changed frame alone does not prove input acceptance or causality. The generic key sequence is not tailored to this game. Report quality, balance, loop completion, win/loss, and replay only when direct evidence supports them.

## Questions for each game

- What goal is explicit at the start? Is a short next goal directly visible?
- Which controls are actually stated or directly evidenced? Separate stated controls from controls merely attempted.
- What is the apparent core loop? Was repetition of the loop directly observed?
- Which progress/state/stage/score/time/life/resource indicators are visible?
- Which choices, risks, and rewards are evidenced? Was their consequence observed?
- What reward, penalty, failure state, result, retry, or return motivation is directly visible?
- What onboarding is visible? What can and cannot be concluded about visual/audio accessibility?
- What are up to four abstract, testable principles that may be relevant to Candle Climber?
- What must not be copied: names, branding, copy, characters, art, audio, levels, and proprietary assets?
- What are the confidence level and evidence limitations?

## Observation level

Choose one value:

- `metadata_only`: only official card copy or metadata is available.
- `page_only`: a start page, menu, story, or loading view is visible, but active gameplay is not clearly confirmed.
- `partial_gameplay`: direct evidence of an active scene exists, but the loop or outcome is incomplete.
- `gameplay_loop_observed`: a repeatable game loop is clear in direct evidence.
- `outcome_observed`: a game result, win, or loss is directly recorded.
- `capture_unavailable`: no usable visual/text evidence is available.

## Candle Climber constraints

Transfer principles, not sample content. Candle Climber score, physics, and rank must remain skill-based; purchases or wallet state must not create competitive advantage. Do not present horizontal movement, free brake, wall interaction, or branches requiring new controls as established solutions; if mentioned at all, label them separate hypotheses with explicit risk. Do not propose existing systems as new features. A problem may be visibility or feedback timing rather than missing functionality.

## Required JSON schema

Return exactly one JSON object with these keys:

```json
{
  "id": "game-NN",
  "title": "Exact catalog title",
  "observation_level": "one of the defined values",
  "observed_goal": "string",
  "observed_controls": ["string"],
  "observed_core_loop": "string",
  "progress_feedback": "string",
  "decisions_risk_reward": "string",
  "rewards": "string",
  "penalties_failure": "string",
  "outcomes_replay": "string",
  "onboarding": "string",
  "visual_audio_accessibility": "string",
  "technical_clues": ["string"],
  "transferable_principles": ["up to four abstract, testable principles"],
  "candle_climber_relevance": ["string"],
  "do_not_copy": ["string"],
  "evidence": [
    {
      "claim": "string",
      "source_type": "screenshot | page_text | official_card | technical_trace",
      "stage": "exact stage or source stage",
      "certainty": "direct | stated_not_playtested | candidate_only | unknown",
      "source_reference": "game-NN:source_type:stage"
    }
  ],
  "confidence": "high | medium | low",
  "limitations": "string"
}
```

Do not include direct page URLs or local filesystem paths in the distributable result. Preserve exact UI labels, figures, screenshot-stage names, technical identifiers, and uncertainty. Never invent missing details.

# MUSIC — the bed, and why it took this long

> **خلاصه فارسی:** موسیقی متن بازی حالا هست: چهار سکشنِ سینثِ بدون-فایل (همان
> سازهای تریلر X)، هر بایوم یک سکشن با تمپو و گام خودش، بار-به-بار زمان‌بندی
> می‌شود و روی مرز بایوم cross-fade می‌خورد. با همان AudioContext و همان
> ولوم/mute موجود کار می‌کند — هیچ تنظیم جدیدی اضافه نشد.

Ten-pattern #10 ("Polish") had one honest hole left after the sector cues
(`docs/OPEN-ITEMS.md` O-5): the game had **no music**. This is that hole, closed
the only way this codebase can close it — with the synth it already owns.

## What shipped

`src/game/cc/music.ts` — a procedural bed, four sections, one per biome. It is the
**trailer's score at game scale**: `scripts/trailer/audio.mjs` already defined one
music section per biome (tempo, key, chord progression, drum feel) for the 15s cuts;
the game now plays the same four pieces, bar by bar, while you climb.

| Biome | Tempo | Bar | What you hear |
|---|---|---|---|
| `temperate` | 100 BPM | 4/4 | root/fifth pad, a walking eighth line, a click on the beat |
| `desert` | 108 BPM | 4/4 | drone, hand-drum pulse, the trailer's 4-note melodic cell |
| `storm` | 132 BPM | 4/4 | the riff, kick/snare backbeat, a thin square line |
| `tundra` | 76 BPM | 2/4 | slow pad, muffled heartbeat, two bells per bar |

Zero audio files: every voice is an `OscillatorNode` (plus buffered noise for the
pulse), exactly like `sound.ts`. The page ships no `.mp3`, so there is no payload,
no licence, and no preload.

## The laws it keeps

1. **Deterministic.** `barPlan(biome, bar)` is pure — same input, same events. A
   recorded run sounds like the run that recorded it; no `Math.random` in the
   score (only in the percussion *texture*, same as `sound.ts`'s `noise()`).
2. **Invisible to gameplay.** Nothing in `music.ts` is read by the engine. It
   cannot gate a press, move a platform or touch a score.
3. **One audio contract.** The bed connects to the shared master gain from
   `sound.ts` (`audioOut()`), so the existing **mute** and **volume slider**
   already control it. No new setting, no new storage key.
4. **Quiet on purpose.** Section gains top out at 0.08 and the bed bus sits at
   0.5 of the master — roughly −20 dB against the jump/land transients. A bed that
   competes with the rhythm turns a rhythm game into noise; the sfx stay signal.

## Playback contract

- **Gate:** `phase === "running" && !paused`. The bed never plays under a dialog,
  a pause panel, the death card or the graduation panel.
- **Section change:** on a biome change the bus dips to 40% and returns over
  ~0.9 s; the next *bar* starts in the new section, so the seam is a breath, not
  a cut (the trailer's `XF` cross-fade, in miniature).
- **Stop:** death, graduation, pause and page teardown all fade out in 0.3 s. The
  bed is restarted fresh (bar 0) on every new run.

## Tests

`test/music.test.ts` — pins the score, not the waveform (the synth is
browser-only): every biome has a non-empty section, the plan is deterministic,
gains stay in bed range, every event lands inside its own bar, and the four
sections are provably different pieces of music (distinct tempo/notes; tundra
slowest, storm fastest).

```bash
docker compose -f docker-compose.base44.yml exec -T web bun test test/music.test.ts
```

**Not verified automatically:** how it *sounds* in a real speaker/headphone mix.
That one needs a human ear — the same session that does O-7 (a human summit run)
can settle it.

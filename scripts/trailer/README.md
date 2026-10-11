# Trailer pipeline

Builds the short produced trailers in [`docs/assets/x-launch`](../../docs/assets/x-launch)
(the `x-08`…`x-10` 15-second cuts) out of the landing page's own deterministic bot demo —
real gameplay, nothing faked, no invented numbers.

## What runs

1. **`capture.mjs`** — records the landing demo headless (Playwright video, 25fps) into a
   master `.webm`. An injected stylesheet isolates the game canvas and hides the demo's
   "BOT PLAYING" badge, so the recording is pure gameplay; the app is untouched.
2. **`timeline.ts`** — prints the demo's deterministic timeline (biome changes + gameplay
   sfx) in loop-relative seconds, from the same modules the demo renders with. Runs under
   `bun` inside the web container because it imports the app's TypeScript.
3. **`build.mjs`** — finds the loop seam in the take (the demo fades to the frame colour
   across it), cuts each hook window from there, generates the audio bed (`audio.mjs`) and
   the captions + end card, burns them in with ffmpeg, and checks the result.

## Run it

```bash
# the dev server serves the demo that gets recorded
docker compose -f docker-compose.base44.yml up -d

# work dir defaults to /tmp/cc-trailer; --out publishes kit-named files
node scripts/trailer/build.mjs
node scripts/trailer/build.mjs --out docs/assets/x-launch

# reuse a take, override the detected seam, or override the crop
node scripts/trailer/build.mjs --take /tmp/cc-trailer/page@….webm
node scripts/trailer/build.mjs --loop 3.0
```

Needs Node on the host (the repo's `node_modules` provides Playwright + chromium), `ffmpeg`
and `ffprobe` (on `PATH`, or installed with `npm i -D ffmpeg-static ffprobe-static`, or
pointed at with `FFMPEG=` / `FFPROBE=`), and Docker for the timeline step.

## Outputs

- `<dir>/<id>.mp4` — 1600×960 (the game's native 5:3 view, `VIEW_W × VIEW_H`), 25fps,
  H.264 High CRF 18 + AAC 192k, `+faststart`
- `<dir>/<id>-poster.jpg`, plus `<dir>/timeline.json` and `<dir>/capture.json`
- with `--out <dir>`: the same files under the kit names from the variant table

## Changing the cuts

The variant table at the top of `build.mjs` holds each hook: `loopStart` (seconds into the
demo's 30s loop), the hook transient (`hook`), its captions and the poster time. `DUR` is the
cut length. Keep captions in the game's own copy (the how-to-play card labels, the site's
lines) and keep the end card free of URLs and monetary claims — nothing is hosted yet, see the
kit README's red lines.

## Checks the build performs

- the demo completes the loop without dying, and every window fits inside the take
- the loop-seam anchor is found (override with `--loop` if a take defeats it)
- each cut's frame 0 matches the master at its in-point (mean abs diff ≤ 3)
- per output: duration, streams, and audio level (peak ≈ −1 dBFS)

# Brand assets — source, profile and alpha rules

Short note for anyone swapping mascot art into the web UI. The visual DNA lives with the
owner's pack; this file only records what is actually in `public/cc/brand/` and how it must
be treated.

## What ships

| File | Used by | Source | Status |
|---|---|---|---|
| `public/cc/brand/wick-hero.webp` | landing hero (`Hero.tsx`) | owner visual-DNA pack `wick-pose-hero-wave.png` (1920×1920, RGBA, **real alpha**, `usage: standalone transparent hero/welcome pose`) | delivered pose downscaled, 1000×1296, alpha untouched, 138 KB |

Two packs ship mascot art and only one of them is web-ready:

- **Visual-DNA pack** (`wick-pose-hero-wave` / `action-climb` / `victory` / `falling`, 1920×1920
  RGBA) — real transparency, drop straight into the UI. This is the set to use.
- **`07-bot-first-concept` pack** (26 × `mascot-*.png`, 1024×1024 **RGB on white, no alpha**) —
  visible-art reference and in-product mockup art only. Putting one of these on a dark surface
  requires cutting the background out by hand, which is exactly what this repo no longer does.

Profile: `OWNER-REBRIEF-A` (cream/sand blockbot, teal faceplate, black square eyes, two dark
turrets with lime bars, orange-brown backpack, small companion). Do not blend in the waxy
`Wick V2` identity or the older blockbot prompt set, and do not restyle the in-game canvas
player (profile C) to match this art without a separate decision.

## How the shipped file was produced

No background removal and no manual cutout. The delivered `wick-pose-hero-wave.png` already
carries a real alpha channel (63% of the canvas fully transparent, soft antialiased edges,
`alpha_range 0–254` per the pack manifest), so the only steps are mechanical delivery ones:

1. `trim({ threshold: 1 })` — drops the empty transparent margin around the character. Nothing
   of the subject is cropped.
2. Resize to 1000 px wide (`withoutEnlargement`).
3. Export WebP q92 + `alphaQuality 100`, so the delivered alpha survives untouched.

Re-check any new derivative by compositing it on `#101214`, white and lime at final display
size. A checkerboard in the file, or a grey halo on the dark surface, is a fail.

## Rules for future swaps

- Transparent means a real alpha channel; archive files with a baked checkerboard are
  reference only.
- Green `#5BD08A` / coral `#E07856` keep their market meaning everywhere; never use them as
  decoration that could read as "safe"/"danger" in reverse.
- Copy, prices and claims stay in HTML/CSS, never baked into artwork.
- `docs/` is not served by Next — these notes are for reviewers, the shipped files are only
  the ones under `public/`.

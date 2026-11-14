# Brand assets — source, profile and alpha rules

Short note for anyone swapping mascot art into the web UI. The visual DNA lives with the
owner's pack; this file only records what is actually in `public/cc/brand/` and how it must
be treated.

## What ships

| File | Used by | Source | Status |
|---|---|---|---|
| `public/cc/brand/wick-action.webp` | landing hero (`Hero.tsx`) | owner pack `07-bot-first-concept/assets/mascot-action-with-baby.png` (1024×1024, **RGB, white background — no alpha**) | cutout derivative, 720×871, real alpha, 109 KB |

Profile: `OWNER-REBRIEF-A` (cream/sand blockbot, teal faceplate, black square eyes, two dark
turrets with lime bars, orange-brown backpack, small companion). Do not blend in the waxy
`Wick V2` identity or the older blockbot prompt set, and do not restyle the in-game canvas
player (profile C) to match this art without a separate decision.

## How the cutout was made

The delivered hero art is opaque on white, so it cannot be dropped onto `#101214` as-is
(the pack's rule: never present a flat background as if it were transparency).

1. Flood-fill from the image border over near-white pixels (`r,g,b ≥ 240`) — only the
   background connected to the edge is removed, so light tones *inside* the character
   (shell highlights, the baby's wrap) survive. Leftover light pixels afterwards: 1.1%,
   which is the antialiased character outline, not background.
2. Hard alpha (no blur pass): a blurred alpha channel smeared the edge and re-exposed the
   background, so the export keeps a 1-bit mask; the browser's downscale does the feathering.
3. Trim to the subject, resize to 720 px wide, export WebP q90 + full alpha quality.

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

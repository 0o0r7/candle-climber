#!/usr/bin/env python3
"""CCDC death-card NFT art — composed from the project's OWN shipped assets.

Source: public/landing/banner-v2-liquidation-chase1.jpg — the finished
"liquidation chase" illustration (finalized project mascots: the blockbot
carrying the small climber, escaping the red liquidation wave across green
candles). The owner asked for the minted NFT to carry one of the project's
finalized mascot artworks *with a background* — this banner IS that artwork,
so the card is an honest square crop of it (no invented art, no AI generation,
no external assets).

Output: public/nft/death-card.png (1024x1024) — served at the canonical prod
URL pinned in src/lib/deathcard-claim.ts (DEATH_CARD_IMAGE_URL).

Deterministic: same input file + same crop params => byte-stable output.
Run:  python3 scripts/deathcard/make-card-art.py
"""

from __future__ import annotations

import sys
from pathlib import Path

from PIL import Image

REPO = Path(__file__).resolve().parents[2]
SRC = REPO / "public" / "landing" / "banner-v2-liquidation-chase1.jpg"
OUT = REPO / "public" / "nft" / "death-card.png"

SIZE = 1024  # marketplace-friendly square


def main() -> int:
    if not SRC.exists():
        print(f"FATAL: source banner missing: {SRC}")
        return 1

    img = Image.open(SRC).convert("RGB")
    w, h = img.size

    # Square crop, full height, right-anchored on the mascots.
    side = min(w, h)
    # Mascots sit in the right ~35% of the banner; anchor the crop so their
    # center of mass (~x = 0.72 * w) lands near the crop's horizontal center.
    center_x = int(w * 0.72)
    x0 = max(0, min(w - side, center_x - side // 2))
    y0 = (h - side) // 2
    crop = img.crop((x0, y0, x0 + side, y0 + side))
    card = crop.resize((SIZE, SIZE), Image.LANCZOS)

    OUT.parent.mkdir(parents=True, exist_ok=True)
    card.save(OUT, format="PNG", optimize=True)

    kb = OUT.stat().st_size // 1024
    print(f"OK {OUT.relative_to(REPO)}  {SIZE}x{SIZE}  {kb}KB  (src {w}x{h}, crop x0={x0} y0={y0} side={side})")
    return 0


if __name__ == "__main__":
    sys.exit(main())

#!/usr/bin/env python3
"""Gamma CDN bulk importer.

Takes any number of text files containing Gamma image links (raw cdn.gamma.app
URLs and/or imgproxy.gamma.app resize wrappers, truncated or not), extracts the
underlying full-resolution cdn.gamma.app URLs, and downloads them into the repo
at assets/gamma/ MIRRORING the exact CDN path structure, keeping the original
CDN filenames (per project decision 2026-11-03).

Usage:
    python3 scripts/gamma_import.py FILE [FILE ...] [--sheet OUT.jpg]

Idempotent: files already present and valid are skipped, so new link batches
can be appended later by just adding another URL file.
Writes/updates assets/gamma/manifest.json with source URL + dimensions per file.
"""
import json
import pathlib
import re
import sys
import urllib.request
from datetime import datetime, timezone
from io import BytesIO

from PIL import Image

ROOT = pathlib.Path("/home/z/my-project")
DEST_ROOT = ROOT / "assets" / "gamma"
MANIFEST = DEST_ROOT / "manifest.json"
UA = {"User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36"}
CDN_RE = re.compile(r"https://cdn\.gamma\.app/[A-Za-z0-9/_\-.]+\.jpg")


def extract_urls(text: str):
    """Return ordered unique full-res cdn URLs mentioned in text."""
    out, seen = [], set()
    for m in CDN_RE.finditer(text):
        u = m.group(0)
        if u not in seen:
            seen.add(u)
            out.append(u)
    return out


def fetch(url: str) -> bytes:
    req = urllib.request.Request(url, headers=UA)
    with urllib.request.urlopen(req, timeout=90) as r:
        return r.read()


def valid_image(data: bytes):
    try:
        im = Image.open(BytesIO(data))
        im.load()
        return im.size
    except Exception:  # noqa: BLE001
        return None


def main() -> int:  # noqa: C901
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    sheet = None
    if "--sheet" in sys.argv:
        i = sys.argv.index("--sheet")
        sheet = sys.argv[i + 1]
        args = [a for j, a in enumerate(sys.argv[1:])
                if not a.startswith("--") and j != i]

    urls = []
    for f in args:
        p = pathlib.Path(f)
        urls += extract_urls(p.read_text(errors="replace"))
    # de-dupe across files, keep order
    seen, ordered = set(), []
    for u in urls:
        if u not in seen:
            seen.add(u)
            ordered.append(u)

    print(f"unique cdn URLs to import: {len(ordered)}")
    DEST_ROOT.mkdir(parents=True, exist_ok=True)
    manifest = {}
    if MANIFEST.exists():
        manifest = json.loads(MANIFEST.read_text())

    imported, skipped, failed = 0, 0, 0
    thumbs = []
    for u in ordered:
        rel = u.replace("https://cdn.gamma.app/", "")
        dest = DEST_ROOT / rel
        entry = {"source_url": u, "path": f"assets/gamma/{rel}"}
        if dest.exists() and dest.stat().st_size > 5120:
            size = valid_image(dest.read_bytes())
            if size:
                entry.update({"bytes": dest.stat().st_size, "dims": size,
                              "variant": "cached"})
                skipped += 1
                thumbs.append((rel, dest))
                manifest[u] = entry
                print(f"  skip (exists) {rel}")
                continue
        try:
            data = fetch(u)
            size = valid_image(data)
            if not size or len(data) < 5120:
                raise ValueError(f"invalid image data ({len(data)} bytes)")
            variant = "original"
        except Exception as e:  # noqa: BLE001
            # fallback: imgproxy 500px variant referenced in the same batch file
            proxy = None
            for f in args:
                t = pathlib.Path(f).read_text(errors="replace")
                for line in t.split():
                    if u in line and line.startswith("https://imgproxy"):
                        proxy = line
                        break
                if proxy:
                    break
            if not proxy:
                print(f"  FAIL {rel}: {e}")
                failed += 1
                continue
            try:
                data = fetch(proxy)
                size = valid_image(data)
                if not size:
                    raise ValueError("proxy image invalid")
                variant = "imgproxy-500"
            except Exception as e2:  # noqa: BLE001
                print(f"  FAIL {rel}: {e} / proxy: {e2}")
                failed += 1
                continue
        dest.parent.mkdir(parents=True, exist_ok=True)
        dest.write_bytes(data)
        entry.update({"bytes": len(data), "dims": size, "variant": variant,
                      "fetched_at": datetime.now(timezone.utc).isoformat()})
        manifest[u] = entry
        imported += 1
        thumbs.append((rel, dest))
        print(f"  OK [{variant}] {rel}  {len(data)//1024} KB  {size}")

    MANIFEST.write_text(json.dumps(manifest, indent=2, ensure_ascii=False))
    print(f"\nimported={imported} skipped={skipped} failed={failed} "
          f"manifest_entries={len(manifest)}")

    if sheet and thumbs:
        COLS, TH = 6, 250
        rows = (len(thumbs) + COLS - 1) // COLS
        from PIL import ImageDraw, ImageFont
        W = COLS * (TH + 10) + 10
        H = rows * (TH + 44) + 10
        canvas = Image.new("RGB", (W, H), (16, 16, 20))
        d = ImageDraw.Draw(canvas)
        try:
            font = ImageFont.truetype(
                "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 18)
        except OSError:
            font = ImageFont.load_default()
        for i, (rel, dest) in enumerate(thumbs):
            im = Image.open(dest).convert("RGB")
            im.thumbnail((TH, TH))
            r, c = divmod(i, COLS)
            x = 10 + c * (TH + 10)
            y = 10 + r * (TH + 44)
            canvas.paste(im, (x, y))
            d.text((x, y + TH + 4), f"[{i+1:02d}] {rel.split('/')[-1][:34]}",
                   font=font, fill=(240, 240, 240))
        sp = ROOT / sheet
        sp.parent.mkdir(parents=True, exist_ok=True)
        canvas.save(sp, quality=85)
        print(f"contact sheet -> {sp} ({len(thumbs)} thumbs)")
    return 1 if failed else 0


if __name__ == "__main__":
    sys.exit(main())

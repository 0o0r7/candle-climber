#!/usr/bin/env python3
"""Import the owner's Dropbox pack (2026-11-03) into the repo.  v2

Sources (extracted): /tmp/dropbox-test/extracted/{PNG,Social Media}
Destinations:
  - docs/assets/x-launch/ + public/media/ : x-08..x-10 trailers (G5 gap restore)
  - assets/mascot/                        : unique mascot pose PNGs (kebab-case)
  - assets/branding/                      : logos, key art, X headers, score card, hero frames
  - assets/branding/INDEX.md              : mapping table (original -> repo path, dims, bytes, md5)

Dedup: md5 groups; canonical representative = the cleanest name in the group
(prefers no "(N)" suffix). Genuinely-different "(N)" files get a "-alt" suffix.
CDN-named files keep their exact original filenames (project convention).
"""

import hashlib
import os
import re
import shutil
from collections import defaultdict
from PIL import Image

SRC = "/tmp/dropbox-test/extracted"
PNG = os.path.join(SRC, "PNG")
SOC = os.path.join(SRC, "Social Media")
REPO = "/home/z/my-project"
DOCS_X = os.path.join(REPO, "docs/assets/x-launch")
PUBLIC_MEDIA = os.path.join(REPO, "public/media")
MASCOT = os.path.join(REPO, "assets/mascot")
BRAND = os.path.join(REPO, "assets/branding")

# wipe & rebuild asset dirs (idempotent)
for d in (MASCOT, BRAND):
    shutil.rmtree(d, ignore_errors=True)
for d in (DOCS_X, PUBLIC_MEDIA, MASCOT, BRAND):
    os.makedirs(d, exist_ok=True)


def md5(p):
    return hashlib.md5(open(p, "rb").read()).hexdigest()


def kebab(name):
    return re.sub(r"[^A-Za-z0-9._-]", "", re.sub(r"\s+", "-", name.strip()))


DUP_SUFFIX = re.compile(r"\((\d+)\)$")


def clean_base(name):
    """name without extension, with dup suffixes stripped"""
    stem = os.path.splitext(name)[0]
    return DUP_SUFFIX.sub("", stem).strip()


def canonical_key(name):
    """sort key: prefer names without (N) suffix, then alphabetical"""
    return (1 if DUP_SUFFIX.search(os.path.splitext(name)[0]) else 0, name)


# ---------- 1) md5 groups over PNG/ ----------
groups = defaultdict(list)
for f in sorted(os.listdir(PNG)):
    p = os.path.join(PNG, f)
    if os.path.isfile(p):
        groups[md5(p)].append(f)

# ---------- 2) classify + copy ----------
pose_re = re.compile(r"^mascot ", re.I)
cdn_re = re.compile(r"^(01M41|Wu-|lamJn)")

# semantic renames for generic download names (identified visually 2026-11-03)
SEMANTIC = {
    "Image.png": "keyart-chart-is-the-level.png",
    "Image(1).png": "keyart-liquidation-chase.png",
    "Image(2).png": "keyart-dawn-ascent.png",
    "Image (1).png": "logo-c-candle-mono-a.png",
    "Image (2).png": "logo-c-candle-mono-b.png",
    "Image (4).png": "logo-c-candle-neon-icon.png",
}

BRAND_DESC_EXTRA = {
    "hero-video-frame-1-chaos.png": "Hero video frame 1 — chaos variant (full-res 1536x864 still)",
    "hero-video-frame-2-victory.png": "Hero video frame 2 — victory variant (full-res still)",
    "hero-frame-1-chaos-variant-2.png": "Hero frame 1 — chaos, alternate variant 2",
    "hero-frame-2-victory-variant-2.png": "Hero frame 2 — victory, alternate variant 2",
}

POSE_DESC = {
    "action": "mid-jump push-off pose", "action with baby": "push-off pose carrying the baby companion",
    "baby": "chibi baby mascot variant", "chaos": "panic flail pose",
    "confused": "puzzled head-tilt pose", "crouching": "crouch/charge pose",
    "dancing": "dance loop pose", "excited": "arms-up excitement pose",
    "excited with baby": "excitement pose with baby companion", "falling": "free-fall (liquidation) pose",
    "greeting": "hello-wave pose", "idle": "standing idle pose",
    "idle with baby": "idle pose with baby companion", "looking up": "gaze-up pose",
    "pointing": "pointing gesture pose", "presenting": "presenter pose (arm out)",
    "presenting with baby": "presenter pose with baby companion", "pushing": "push/effort pose",
    "running": "run cycle pose", "sad": "slumped sad pose", "shrugging": "shrug pose",
    "side profile": "side-profile turn", "sitting wave": "seated wave pose",
    "stretching": "stretch/warm-up pose", "surprised": "startle pose",
    "thinking": "chin-stroke thinking pose", "thumbs up": "approval gesture pose",
    "up": "reaching-up pose", "victory": "win/celebration pose", "wave": "standing wave gesture pose",
}

mapping = []  # (orig, dest_rel, bytes, dims, md5)

for h, names in groups.items():
    names = sorted(names, key=canonical_key)
    canon = names[0]
    alts = names[1:]
    p = os.path.join(PNG, canon)
    im = Image.open(p)
    dims = f"{im.size[0]}x{im.size[1]}"
    size = os.path.getsize(p)

    if pose_re.match(canon):
        pose = clean_base(canon)[len("mascot "):]
        dest_name = "mascot-" + kebab(pose).lower() + os.path.splitext(canon)[1]
        dest_dir = MASCOT
    elif canon in SEMANTIC:
        dest_name, dest_dir = SEMANTIC[canon], BRAND
    elif cdn_re.match(canon):
        dest_name, dest_dir = canon, BRAND  # keep exact CDN name
    elif canon.startswith(("banner-v2", "twitter-banner")):
        dest_name, dest_dir = kebab(canon).lower(), BRAND
    else:
        dest_name, dest_dir = kebab(clean_base(canon)).lower() + os.path.splitext(canon)[1], BRAND

    dest = os.path.join(dest_dir, dest_name)
    shutil.copy2(p, dest)
    rel = os.path.relpath(dest, REPO)
    mapping.append((canon, rel, size, dims, h))
    extra = f"  [+{len(alts)} dup: {', '.join(alts)}]" if alts else ""
    print(f"import: {canon} -> {rel} ({dims}, {size//1024}KB){extra}")

    for a in alts:  # genuinely-different same-collision names — should not happen after md5 grouping
        print(f"  (dup skipped): {a}")

# ---------- 3) trailers: docs + public/media ----------
TRAILERS = ["x-08-trailer-15s-crumble.mp4", "x-08-trailer-15s-crumble-poster.jpg",
            "x-09-trailer-15s-leap.mp4", "x-09-trailer-15s-leap-poster.jpg",
            "x-10-trailer-15s-storm.mp4", "x-10-trailer-15s-storm-poster.jpg"]
for t in TRAILERS:
    src = os.path.join(SOC, t)
    if not os.path.exists(src):
        print(f"MISSING trailer: {t}")
        continue
    for d in (DOCS_X, PUBLIC_MEDIA):
        shutil.copy2(src, os.path.join(d, t))
    size = os.path.getsize(src)
    dims = "video" if t.endswith(".mp4") else f"{Image.open(src).size[0]}x{Image.open(src).size[1]}"
    mapping.append((t, f"docs/assets/x-launch/{t} (+ public/media/)", size, dims, md5(src)))
    print(f"trailer: {t} -> docs/assets/x-launch/ + public/media/ ({size//1024}KB)")

# ---------- 4) INDEX.md ----------
pose_rows = sorted([m for m in mapping if m[1].startswith("assets/mascot/")], key=lambda m: m[1])
brand_rows = sorted([m for m in mapping if m[1].startswith("assets/branding/")], key=lambda m: m[1])
trail_rows = [m for m in mapping if m[1].startswith("docs/")]

BRAND_DESC = {
    "keyart-chart-is-the-level.png": 'Key art "THE CHART IS THE LEVEL." — mascot leaping green/red candles',
    "keyart-liquidation-chase.png": "Key art — red liquidation-chase variant, mascot on candle wall",
    "keyart-dawn-ascent.png": "Key art — dawn/mist variant, mascot balancing atop candle ridge",
    "logo-c-candle-mono-a.png": "Monochrome pixel 'C'-candle logo, white background (mark A)",
    "logo-c-candle-mono-b.png": "Monochrome pixel 'C'-candle logo with candle pips row, white background (mark B)",
    "logo-c-candle-neon-icon.png": "Neon holographic 'C'-candle app-icon on dark, rounded corners",
    "duo-bull-and-hare-ascent.png": "Character duo art — mascot + companion climbing candles (portrait)",
    "candle-climber-120.png": "Share/score card — XRPUSDT run, score 120, streak x3, PB 195, BEAT MY RUN CTA",
    "Wu-0pjRF7OevosHX.png": "Monochrome 'C'-candle logo variant with candle pips (CDN name kept)",
    "lamJnU8B8HtJvjOY.png": "Neon holographic 'C'-candle logo, square, non-rounded (CDN name kept)",
    "01M41PTA3EXEJBRMBE14CP1ZBE.jpg": "Neon 'C'-candle logo variant, purple/green (CDN name kept)",
    "01M41PTSZJAGH10KV3AWGGDMGE.jpg": "Monochrome 'C'-candle logo with pips, white bg (CDN name kept)",
    "banner-v2-liquidation-chase.png": "16:9 banner — liquidation-chase red key art",
    "banner-v2-neon-night-leap.png": "16:9 banner — neon night leap key art",
    "banner-v2-neon-night-leap-alt.png": "16:9 banner — neon night leap, alternate take (CDN alt)",
    "twitter-banner-v2-liquidation-chase.png": "X/Twitter header 1536x512 — liquidation-chase crop",
    "twitter-banner-v3-neon-night-leap.png": "X/Twitter header 1536x512 — neon-night-leap crop",
}
BRAND_DESC.update(BRAND_DESC_EXTRA)

lines = [
    "# Owner pack — 2026-11-03 (Dropbox restore)",
    "",
    "Imported from the owner's shared Dropbox folder (subfolders `PNG/`, `Social Media/`),",
    "md5-deduplicated. CDN-named files keep their original names (project convention, so they",
    "match the owner's link lists); generic download names (`Image(N).png`) got semantic names,",
    "originals preserved in the mapping below. Trailer duplicates of these bytes live in",
    "`public/media/` (servable) and `docs/assets/x-launch/` (kit) — git stores identical blobs once.",
    "",
    "## Mascot poses (`assets/mascot/`) — 1024x1024 transparent PNGs",
    "",
    "| Repo file | Pose | Size | Original name |",
    "|---|---|---|---|",
]
for orig, rel, size, dims, h in pose_rows:
    pose = re.sub(r"^mascot-|\.png$", "", os.path.basename(rel)).replace("-", " ")
    lines.append(f"| `{os.path.basename(rel)}` | {POSE_DESC.get(pose, pose)} | {size//1024} KB | `{orig}` |")

lines += [
    "",
    "## Branding & key art (`assets/branding/`)",
    "",
    "| Repo file | What it is | Dims | Size | Original name |",
    "|---|---|---|---|---|",
]
for orig, rel, size, dims, h in brand_rows:
    b = os.path.basename(rel)
    lines.append(f"| `{b}` | {BRAND_DESC.get(b, '')} | {dims} | {size//1024} KB | `{orig}` |")

lines += [
    "",
    "## X-launch trailers restored (G5 gap closed)",
    "",
    "The three 15s trailers produced 2026-10-11 (documented in `docs/assets/x-launch/README.md`)",
    "were never committed — a branch rescue could not carry binaries. Restored from the owner's",
    "Dropbox backup into **both** `docs/assets/x-launch/` (kit) and `public/media/` (servable at",
    "`/media/<file>` for attaching to X posts).",
    "",
    "| File | Size |",
    "|---|---|",
]
for orig, rel, size, dims, h in sorted(trail_rows):
    lines.append(f"| `{orig}` | {size/(1<<20):.1f} MB |")

with open(os.path.join(BRAND, "INDEX.md"), "w") as f:
    f.write("\n".join(lines) + "\n")
print("\nINDEX.md written:", os.path.join(BRAND, "INDEX.md"))
total = sum(m[2] for m in mapping)
print(f"TOTAL imported: {len(mapping)} unique files, {total/(1<<20):.1f} MB")

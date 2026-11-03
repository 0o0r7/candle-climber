#!/usr/bin/env python3
"""Render assets/gamma/INDEX.md from manifest.json + curated descriptions."""
import json
import pathlib

ROOT = pathlib.Path("/home/z/my-project")
G = ROOT / "assets" / "gamma"
man = json.loads((G / "manifest.json").read_text())

D = {
    # ---- Halloween poster set (13) ----
    "01M644BHF8FATDHH5MBAFQACJ7/erokgEN43zUvgvXBJl2Hs.jpg": "Poster #01 — “The Haunted Chart” comic page",
    "01M644BHF8FATDHH5MBAFQACJ7/5pOfq-OEljM7D7Hthh8LU.jpg": "Poster #02 — “LIQUIDATED” red candle-wall poster",
    "01M644BHF8FATDHH5MBAFQACJ7/DTAB8nhZMmGiE1IJ3_Loi.jpg": "Poster #03 — green candle forest w/ jack-o’-lanterns",
    "01M644BHF8FATDHH5MBAFQACJ7/vmLyq1W2MEjnDRpCUn_nj.jpg": "Poster #04 — “Trick or Wick” ghost-costume mascot",
    "01M644BHF8FATDHH5MBAFQACJ7/vwboJFdlBg7tYHokO0Obu.jpg": "Poster #05 — “Real Candles, Real Deaths” moon poster",
    "01M644BHF8FATDHH5MBAFQACJ7/Ng6FvTJ_BPsAor0fTxN9f.jpg": "Poster #06 — “You Have Been Liquidated” death card (Haunted Wick, score 666)",
    "01M644BHF8FATDHH5MBAFQACJ7/WK8NwE-0kf6aT7qmAAFch.jpg": "Poster #07 — “Trick or Chart” pumpkin-arch street",
    "01M644BHF8FATDHH5MBAFQACJ7/B6rWET-xDnCWLqqCAVNTL.jpg": "Poster #08 — “The Chart Is the Level” pumpkin patch (vertical)",
    "01M644BHF8FATDHH5MBAFQACJ7/JLS5j3IijYVQ5NAdudm5Z.jpg": "Poster #09 — “LIQUIDATED — Halloween Daily Run” death card (vertical)",
    "01M644BHF8FATDHH5MBAFQACJ7/Odmj9j5vL3OuZN1_yyeeX.jpg": "Poster #10 — “Halloween Special — Trick or Trade” leaderboard diorama (vertical)",
    "01M644BHF8FATDHH5MBAFQACJ7/B-PypSdhDUCZQ2iA6O2AY.jpg": "Poster #11 — dark multi-panel comic strip (vertical)",
    "01M644BHF8FATDHH5MBAFQACJ7/wiAugAkpecfPVnlK_Vonx.jpg": "Poster #12 — “DEATH CARD SPECIAL” comic ★ SELECTED HERO POSTER",
    "01M644BHF8FATDHH5MBAFQACJ7/j3dFcbjLbQhjUNd2Kc0r8.jpg": "Poster #13 — “The Wick Protocol” comic page",
    "AoZDx5HwiZwLKOmuNctFx/z12g1KZlbHnYpqx7UV4De.jpg": "Wick mascot P2 character sheet v1 — green candle creature turnaround (front/side/back) + LIQUIDATED state (burnt, cracked, ember eyes, smoke wick). Matches docs/ART_PROMPTS_V2.md P2 spec (#1E4D33 body, #CCFF00 eyes).",
    # ---- Mascot model sheets (26) ----
    "01M4QX9H0F3H1GJPV6H950YYM9/-36ZinkZSespBarQX6T2k.jpg": "Model sheet — jump/fly poses + expression heads row",
    "01M4QX9H0F3H1GJPV6H950YYM9/-DSFMKcSt60YAYZ7LhPXK.jpg": "Single hero jump pose (green/orange accents)",
    "01M4QX9H0F3H1GJPV6H950YYM9/1kyNY8v7ansCGOweKkBNG.jpg": "Model sheet + color-palette swatches, backpack on",
    "01M4QX9H0F3H1GJPV6H950YYM9/20iMX-W2FtZ-RLxwMpUMf.jpg": "Turnaround (front+3 backs) + faces + walk cycle",
    "01M4QX9H0F3H1GJPV6H950YYM9/5IxAAcLVPj7Uo9-VSZmHl.jpg": "Pose sheet — shrug/wave/splits + head close-up",
    "01M4QX9H0F3H1GJPV6H950YYM9/5yKQbaQ91r7MUAbsGkuVI.jpg": "Big mid-jump action pose + small studies",
    "01M4QX9H0F3H1GJPV6H950YYM9/9JTwcYtzzPwxDJs5K-s8H.jpg": "Turnaround with orange backpack (F/S/B)",
    "01M4QX9H0F3H1GJPV6H950YYM9/A41zXvHn9EF-WpXImR9hK.jpg": "Clean single front pose — minimal hero shot",
    "01M4QX9H0F3H1GJPV6H950YYM9/FTxMmGlCmUD94p0d7aO-9.jpg": "Model sheet + head studies + candle prop + candlestick palette",
    "01M4QX9H0F3H1GJPV6H950YYM9/GRzdmlHP6zsuTzA1Kmt3v.jpg": "“#1” pointing hero pose + orange-variant studies",
    "01M4QX9H0F3H1GJPV6H950YYM9/JPjIz6aLfmOlt0REAY3C_.jpg": "Idle/side/back poses + emotion heads (laugh, cool, puzzled)",
    "01M4QX9H0F3H1GJPV6H950YYM9/M-Dpse11z8m_h92bxSyI5.jpg": "Action sheet — run/jump/leap poses",
    "01M4QX9H0F3H1GJPV6H950YYM9/RqD-xxVPJlGGluu9zifYe.jpg": "Celebration jump + turnaround + climb/crawl poses",
    "01M4QX9H0F3H1GJPV6H950YYM9/avrKzI5ONIEByBSNZ_fd-.jpg": "Power pose + closed-eyes expression heads",
    "01M4QX9H0F3H1GJPV6H950YYM9/cQzE6LSUWSV5s1AF_m4zg.jpg": "Point-up pose + F/S/B + orange pack variant",
    "01M4QX9H0F3H1GJPV6H950YYM9/dwMnjKluF-2D3ayfVY1_d.jpg": "Thumbs-up hero pose + walk poses",
    "01M4QX9H0F3H1GJPV6H950YYM9/fK025dQqfFBboePJ4ICBW.jpg": "Sitting/relaxed pose sheet",
    "01M4QX9H0F3H1GJPV6H950YYM9/iYuOQ7SJvg0U_N0AVOF9P.jpg": "Run poses + backpack variants row",
    "01M4QX9H0F3H1GJPV6H950YYM9/kdcSN2zXzOVA3uhy64yYv.jpg": "Carry/dynamite pose + small model rows",
    "01M4QX9H0F3H1GJPV6H950YYM9/p-RCk9hgrsu1irugixxz-.jpg": "Confusion sheet — “?” pose, shrug, head-scratch",
    "01M4QX9H0F3H1GJPV6H950YYM9/pcCSOlCKECjyvhKOQWaFL.jpg": "Backpack variants (satchel/briefcase) F+B turnaround",
    "01M4QX9H0F3H1GJPV6H950YYM9/r1LgaAq5QDQdfUBt4OuFI.jpg": "Multi-jump action sheet (leap/fall/dive)",
    "01M4QX9H0F3H1GJPV6H950YYM9/t1nZOQinMpi8LHqNdwlDr.jpg": "Walk cycle + briefcase variant",
    "01M4QX9H0F3H1GJPV6H950YYM9/vWshMQXuZoLqtQFgVX4Wg.jpg": "Marching poses + idea/laugh/spark expression row",
    "01M4QX9H0F3H1GJPV6H950YYM9/yx6LPYdssTfKiCstAIyZY.jpg": "Jump pose + F/S/B + brown pack variant",
    "01M4QX9H0F3H1GJPV6H950YYM9/zdsLYgJHDKEmRgCCpZ0MJ.jpg": "Action lunge + side/back studies + run poses",
    # ---- Key art / banners (4) ----
    "generated-images/01M498RZ81QESJCTVMCMYVR9EW.jpg": "Promo banner — “THE CHART IS THE LEVEL.” + mascot over green/red candlesticks",
    "generated-images/01M498RWZN7SVXV2J5EA5T0WM0.jpg": "Key art — liquidation crash: red chart wall, mascot leaping over green candles",
    "generated-images/01M498HAMJRCKK9TBZVY5A508N.jpg": "Key art — pastel sunrise candle climb (wide/calm variant)",
    "generated-images/01M498GCMP9G7X9SDT94S5NJV9.jpg": "Key art — pastel sunrise candle climb, mascot planting flag (close variant)",
}


def rows_for(prefix: str) -> str:
    out = []
    for u, e in man.items():
        rel = e["path"].removeprefix("assets/gamma/")
        if not rel.startswith(prefix):
            continue
        name = rel.split("/")[-1]
        desc = D.get("/".join(rel.split("/")[-2:]), "—")  # keys: folder/file
        dims = f"{e['dims'][0]}×{e['dims'][1]}"
        kb = e["bytes"] // 1024
        out.append(f"| `{name}` | {desc} | {dims} | {kb} KB | [source]({u}) |")
    return "\n".join(out)


md = f"""# assets/gamma — Gamma CDN design outputs

AI-generated **Candle Climber** visual assets produced with [Gamma](https://gamma.app),
downloaded from `cdn.gamma.app` on 2026-11-03. Filenames are kept **exactly as on the
CDN** (opaque IDs) so every file here matches the link list the owner has; what each
file shows is documented below, and the full machine-readable mapping (source URL,
dimensions, bytes, fetch timestamp) lives in [`manifest.json`](manifest.json).

| Batch | Path | Files |
|---|---|---|
| Halloween poster set (13) | [`p2vb9jo89yaezxo/design-anything/01M644BHF8FATDHH5MBAFQACJ7/`](p2vb9jo89yaezxo/design-anything/01M644BHF8FATDHH5MBAFQACJ7) | see table 1 |
| Wick mascot character sheet v1 (P2) | [`p2vb9jo89yaezxo/design-anything/AoZDx5HwiZwLKOmuNctFx/`](p2vb9jo89yaezxo/design-anything/AoZDx5HwiZwLKOmuNctFx) | see table 2 |
| Mascot model & pose sheets (26) | [`7oeyyy25zk87ga5/design-anything/01M4QX9H0F3H1GJPV6H950YYM9/`](7oeyyy25zk87ga5/design-anything/01M4QX9H0F3H1GJPV6H950YYM9) | see table 3 |
| Key art / promo banners (4) | [`7oeyyy25zk87ga5/generated-images/`](7oeyyy25zk87ga5/generated-images) | see table 4 |

Poster numbering (#01–#13) follows the owner’s shared link order; **#12 “DEATH CARD
SPECIAL” is the selected hero poster**.

## Table 1 — Halloween poster set

| File (CDN name) | What it is | Dims | Size | Source |
|---|---|---|---|---|
{rows_for("p2vb9jo89yaezxo/design-anything/01M644BHF8FATDHH5MBAFQACJ7")}

## Table 2 — Character sheet

| File (CDN name) | What it is | Dims | Size | Source |
|---|---|---|---|---|
{rows_for("p2vb9jo89yaezxo/design-anything/AoZDx5HwiZwLKOmuNctFx")}

## Table 3 — Mascot model & pose sheets (beige wick-eared mascot, 1024×1024)

| File (CDN name) | What it is | Dims | Size | Source |
|---|---|---|---|---|
{rows_for("7oeyyy25zk87ga5/design-anything/01M4QX9H0F3H1GJPV6H950YYM9")}

## Table 4 — Key art / banners

| File (CDN name) | What it is | Dims | Size | Source |
|---|---|---|---|---|
{rows_for("7oeyyy25zk87ga5/generated-images")}

## Adding more batches later

Paste any Gamma link list (raw CDN URLs or imgproxy wrappers, truncated or not) into a
text file under `scripts/gamma_urls/`, then run from the repo root:

```bash
python3 scripts/gamma_import.py scripts/gamma_urls/<new-batch>.txt
```

The importer mirrors the CDN path structure under `assets/gamma/`, keeps original CDN
filenames, skips files already present, and appends entries to `manifest.json`
(then extend the tables above / commit).
"""

(G / "INDEX.md").write_text(md)
print(f"INDEX.md written, {len(man)} manifest entries, {len(D)} described")
missing = [u for u in man
           if "/".join(u.replace("https://cdn.gamma.app/", "")
                       .split("/")[-2:]) not in D]
print("undescribed:", missing if missing else "none")

#!/usr/bin/env python3
"""Prepare compact, legible per-game evidence files for workflow agents."""
from __future__ import annotations

import argparse
import json
from pathlib import Path
from typing import Any
from PIL import Image, ImageOps

STAGES = [
    ("load", "01-load.png", "01-load.jpg"),
    ("after_start", "02-after-start.png", "02-after-start.jpg"),
    ("after_key_burst", "03-after-key-burst.png", "03-after-key-burst.jpg"),
    ("after_combined_input", "04-after-combined-input.png", "04-after-combined-input.jpg"),
    ("late", "05-late.png", "05-late.jpg"),
]


def load_json(path: Path | None) -> dict[str, Any]:
    if not path or not path.exists():
        return {}
    return json.loads(path.read_text(encoding="utf-8"))


def image_to_jpeg(src: Path, dst: Path) -> None:
    with Image.open(src) as opened:
        image = ImageOps.exif_transpose(opened)
        if image.mode in ("RGBA", "LA"):
            rgba = image.convert("RGBA")
            background = Image.new("RGBA", rgba.size, (255, 255, 255, 255))
            background.alpha_composite(rgba)
            image = background.convert("RGB")
        else:
            image = image.convert("RGB")
        # Keep native dimensions so on-screen text remains readable.
        image.save(dst, "JPEG", quality=84, optimize=True, progressive=True, subsampling=1)


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--catalog", required=True, type=Path)
    ap.add_argument("--technical", type=Path)
    ap.add_argument("--screenshots-root", type=Path)
    ap.add_argument("--fallback-screenshots-root", type=Path, action="append", default=[])
    ap.add_argument("--output-dir", required=True, type=Path)
    args = ap.parse_args()

    catalog_doc = load_json(args.catalog)
    technical_doc = load_json(args.technical)
    catalog_games = catalog_doc.get("games", [])
    technical_by_id = {str(g.get("id")): g for g in technical_doc.get("games", [])}
    if len(catalog_games) != 40 or len({str(g.get("id")) for g in catalog_games}) != 40:
        raise SystemExit(f"Expected 40 unique catalog games; got {len(catalog_games)}")

    args.output_dir.mkdir(parents=True, exist_ok=True)
    items = []
    status_counts: dict[str, int] = {}
    all_sources = [
        ("current", args.screenshots_root),
        *((f"fallback-{i + 1}", p) for i, p in enumerate(args.fallback_screenshots_root)),
    ]
    all_sources = [(label, root) for label, root in all_sources if root is not None]

    for game in catalog_games:
        gid = str(game["id"])
        technical = technical_by_id.get(gid, {})
        game_dir = args.output_dir / gid
        game_dir.mkdir(parents=True, exist_ok=True)
        copied = []
        stage_sources = {}
        for stage_key, filename, outname in STAGES:
            selected = None
            selected_label = None
            for label, root in all_sources:
                candidate = root / gid / filename
                if candidate.is_file():
                    selected, selected_label = candidate, label
                    break
            if selected is None:
                continue
            target = game_dir / outname
            image_to_jpeg(selected, target)
            if not target.is_file() or target.stat().st_size == 0:
                raise SystemExit(f"JPEG conversion failed: {selected}")
            copied.append({"stage": stage_key, "path": str(target.resolve()), "source": selected_label,
                           "original_path": str(selected.resolve()), "bytes": target.stat().st_size})
            stage_sources[stage_key] = selected_label

        meta = {
            "id": gid,
            "title": game.get("title", ""),
            "category": game.get("category", ""),
            "is_template": bool(game.get("is_template")),
            "launch_url": game.get("launch_url", ""),
            "source_gallery_url": game.get("source_gallery_url") or catalog_doc.get("source_gallery_url", ""),
            "gallery_description": game.get("gallery_description", ""),
            "description_source": game.get("description_source", "official gallery card copy"),
            "capture": {
                key: technical.get(key) for key in (
                    "page_status", "capture_status", "http_status", "page_title", "stage_text",
                    "completed_stages", "controls_attempted", "start_action",
                    "interaction_visual_change_signal", "interaction_visual_change_caveat",
                    "canvas_inventory", "visible_images", "resource_type_totals",
                    "script_count_scanned", "script_bytes_scanned", "engine_markers",
                    "tuning_constant_candidates", "console_messages", "page_errors",
                    "request_failures", "limitations", "screenshots",
                ) if key in technical
            },
            "review_images": copied,
            "screenshot_sources_by_stage": stage_sources,
            "evidence_warning": "The generic input sequence is not a game-specific playtest; visual change alone does not prove input acceptance.",
        }
        meta_path = game_dir / "evidence.json"
        meta_path.write_text(json.dumps(meta, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        files = [{"path": str(meta_path.resolve()), "name": "metadata-and-capture-evidence"}]
        for image in copied:
            files.append({"path": image["path"], "name": f"{image['stage']}-{image['source']}"})
        items.append({
            "id": gid, "index": game.get("index"), "title": game.get("title"),
            "category": game.get("category"), "is_template": bool(game.get("is_template")),
            "evidence_json": str(meta_path.resolve()), "review_images": copied,
            "analysis_path": str((args.output_dir.parent / "game-analysis-results" / f"{gid}.json").resolve()),
            "input_files": files,
        })
        status = technical.get("capture_status", "legacy_or_missing")
        status_counts[status] = status_counts.get(status, 0) + 1

    items_path = args.output_dir / "workflow-items.json"
    items_path.write_text(json.dumps(items, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    summary = {
        "game_count": len(items),
        "games_with_any_image": sum(bool(item["review_images"]) for item in items),
        "games_with_five_images": sum(len(item["review_images"]) == 5 for item in items),
        "image_count": sum(len(item["review_images"]) for item in items),
        "technical_capture_status_counts": dict(sorted(status_counts.items())),
        "workflow_items": str(items_path.resolve()),
        "output_dir": str(args.output_dir.resolve()),
    }
    summary_path = args.output_dir / "review-assets-summary.json"
    summary_path.write_text(json.dumps(summary, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(summary, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()

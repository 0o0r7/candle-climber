#!/usr/bin/env python3
"""Merge the Studio sample catalog, technical capture, and map-analysis JSON into a sanitized 40-game database."""
from __future__ import annotations

import argparse
import csv
import json
import re
from collections import Counter
from pathlib import Path
from typing import Any

URL_RE = re.compile(r"https?://\S+|\bwww\.\S+", re.IGNORECASE)
URL_KEYS = {"url", "launch_url", "source_gallery_url", "source_url", "src"}
FIELDS = [
    "id", "index", "title", "category", "is_template", "gallery_description",
    "page_status", "capture_status", "http_status", "observation_level",
    "observed_goal", "observed_controls", "observed_core_loop", "progress_feedback",
    "decisions_risk_reward", "rewards", "penalties_failure", "outcomes_replay",
    "onboarding", "visual_audio_accessibility", "transferable_principles",
    "candle_climber_relevance", "do_not_copy", "technical_clues", "confidence",
    "limitations", "evidence", "visual_evidence", "engine_markers",
    "script_count_scanned", "script_bytes_scanned", "tuning_constant_candidates",
    "technical_limitations", "request_failure_count", "page_error_count", "console_error_count",
]


def read_json(path: Path) -> Any:
    with path.open(encoding="utf-8") as f:
        return json.load(f)


def clean_value(value: Any) -> Any:
    if isinstance(value, str):
        value = URL_RE.sub("[public link omitted]", value)
        value = re.sub(r"(?i)\bmanus\b", "Studio", value)
        return value
    if isinstance(value, list):
        return [clean_value(v) for v in value]
    if isinstance(value, dict):
        return {k: clean_value(v) for k, v in value.items() if str(k).lower() not in URL_KEYS}
    return value


def as_text(value: Any) -> str:
    if value is None:
        return ""
    if isinstance(value, str):
        return re.sub(r"[ \t]+\n", "\n", value).rstrip()
    if isinstance(value, list):
        return " | ".join(as_text(v) for v in value)
    if isinstance(value, dict):
        return json.dumps(value, ensure_ascii=False, separators=(",", ":"))
    return str(value)


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--catalog", required=True, type=Path)
    ap.add_argument("--technical", required=True, type=Path)
    ap.add_argument("--analysis-dir", required=True, type=Path)
    ap.add_argument("--output-dir", required=True, type=Path)
    ap.add_argument("--review-assets-index", type=Path)
    ap.add_argument("--capture-run-id", default="")
    ap.add_argument("--fallback-run-id", default="")
    ap.add_argument("--allow-missing-analysis", action="store_true")
    args = ap.parse_args()

    catalog_doc = read_json(args.catalog)
    technical_doc = read_json(args.technical) if args.technical.exists() else {"games": []}
    catalog_games = catalog_doc.get("games", [])
    technical_games = technical_doc.get("games", [])
    catalog_by_id = {str(g["id"]): g for g in catalog_games}
    technical_by_id = {str(g["id"]): g for g in technical_games}
    if len(catalog_by_id) != 40 or len(catalog_games) != 40:
        raise SystemExit(f"Expected 40 unique catalog games, found {len(catalog_by_id)} unique / {len(catalog_games)} rows")
    if len(technical_by_id) != len(technical_games):
        raise SystemExit("Duplicate game IDs in technical audit")
    unknown_technical = sorted(set(technical_by_id) - set(catalog_by_id))
    if unknown_technical:
        raise SystemExit(f"Technical audit has unknown IDs: {unknown_technical}")

    review_assets_by_id: dict[str, dict[str, Any]] = {}
    if args.review_assets_index:
        for item in read_json(args.review_assets_index):
            review_assets_by_id[str(item["id"])] = item

    analysis_by_id: dict[str, dict[str, Any]] = {}
    for path in sorted(args.analysis_dir.glob("game-*.json")):
        item = read_json(path)
        game_id = str(item.get("id", ""))
        if not game_id:
            raise SystemExit(f"Missing id in {path}")
        if game_id in analysis_by_id:
            raise SystemExit(f"Duplicate analysis for {game_id}")
        if game_id not in catalog_by_id:
            raise SystemExit(f"Analysis has unknown game id {game_id}")
        analysis_by_id[game_id] = item
    missing = sorted(set(catalog_by_id) - set(analysis_by_id))
    if missing and not args.allow_missing_analysis:
        raise SystemExit(f"Missing analysis for {len(missing)} games: {', '.join(missing)}")

    records = []
    for game in catalog_games:
        gid = str(game["id"])
        capture = technical_by_id.get(gid, {})
        analysis = analysis_by_id.get(gid, {})
        catalog_public = clean_value({k: v for k, v in game.items() if k not in URL_KEYS})
        capture_keys = (
            "page_status", "capture_status", "http_status", "page_title", "stage_text",
            "completed_stages", "controls_attempted", "start_action",
            "interaction_visual_change_signal", "interaction_visual_change_caveat",
            "canvas_inventory", "resource_type_totals", "script_count_scanned",
            "script_bytes_scanned", "engine_markers", "tuning_constant_candidates", "limitations",
        )
        capture_public = clean_value({k: capture[k] for k in capture_keys if k in capture})
        capture_public["request_failure_count"] = len(capture.get("request_failures", []))
        capture_public["page_error_count"] = len(capture.get("page_errors", []))
        capture_public["console_error_count"] = sum(1 for x in capture.get("console_messages", []) if x.get("type") == "error")

        analysis_public = clean_value({k: v for k, v in analysis.items() if k not in {"analysis_path", "source_url"}})
        evidence = []
        for ev in analysis.get("evidence", []):
            clean_ev = clean_value({k: v for k, v in ev.items() if k not in URL_KEYS})
            clean_ev["source_reference"] = f"{gid}:{ev.get('source_type', 'evidence')}:{ev.get('stage', 'unspecified')}"
            evidence.append(clean_ev)
        analysis_public["evidence"] = evidence

        review_item = review_assets_by_id.get(gid, {})
        visual_evidence = []
        for image in review_item.get("review_images", []):
            source = image.get("source", "unknown")
            run_id = args.capture_run_id if source == "current" else (args.fallback_run_id if source.startswith("fallback") else "")
            visual_evidence.append({"stage": image.get("stage", "unknown"), "source": source, "run_id": run_id})

        records.append({
            "catalog": catalog_public,
            "capture": capture_public,
            "analysis": analysis_public,
            "visual_evidence": visual_evidence,
            "source_note": "Official Studio sample-gallery record; direct public URLs omitted from this distributable dataset.",
            "evidence_policy": "Direct observations, page text, official-card claims and static technical candidates are kept distinct.",
        })

    observation_counts = Counter((analysis_by_id.get(g["id"], {}).get("observation_level") or "analysis_missing") for g in catalog_games)
    capture_counts = Counter((technical_by_id.get(g["id"], {}).get("capture_status") or "capture_missing") for g in catalog_games)
    output = {
        "schema_version": "1.1",
        "source_note": "Official Studio sample-game gallery; URLs intentionally omitted.",
        "catalog_count": len(catalog_games),
        "technical_capture_count": len(technical_games),
        "gameplay_analysis_count": len(analysis_by_id),
        "complete": len(catalog_games) == len(analysis_by_id) == 40 and len(technical_games) == 40,
        "missing_analysis_ids": missing,
        "category_counts": clean_value(catalog_doc.get("category_counts", {})),
        "template_count": catalog_doc.get("template_count"),
        "observation_level_counts": dict(sorted(observation_counts.items())),
        "capture_status_counts": dict(sorted(capture_counts.items())),
        "screenshot_run_ids": {"current": args.capture_run_id, "supplemental": args.fallback_run_id},
        "games": records,
    }

    args.output_dir.mkdir(parents=True, exist_ok=True)
    json_path = args.output_dir / "game-database.json"
    with json_path.open("w", encoding="utf-8") as f:
        json.dump(output, f, ensure_ascii=False, indent=2)
        f.write("\n")

    csv_path = args.output_dir / "game-database.csv"
    with csv_path.open("w", encoding="utf-8-sig", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=FIELDS, extrasaction="ignore", lineterminator="\n")
        writer.writeheader()
        for record in records:
            game, capture, analysis = record["catalog"], record["capture"], record["analysis"]
            row = {key: game.get(key, "") for key in ("id", "index", "title", "category", "is_template", "gallery_description")}
            row.update({
                "page_status": capture.get("page_status", ""),
                "capture_status": capture.get("capture_status", ""),
                "http_status": capture.get("http_status", ""),
                "observation_level": analysis.get("observation_level", ""),
                "observed_goal": analysis.get("observed_goal", ""),
                "observed_controls": analysis.get("observed_controls", []),
                "observed_core_loop": analysis.get("observed_core_loop", ""),
                "progress_feedback": analysis.get("progress_feedback", ""),
                "decisions_risk_reward": analysis.get("decisions_risk_reward", ""),
                "rewards": analysis.get("rewards", ""),
                "penalties_failure": analysis.get("penalties_failure", ""),
                "outcomes_replay": analysis.get("outcomes_replay", ""),
                "onboarding": analysis.get("onboarding", ""),
                "visual_audio_accessibility": analysis.get("visual_audio_accessibility", ""),
                "transferable_principles": analysis.get("transferable_principles", []),
                "candle_climber_relevance": analysis.get("candle_climber_relevance", []),
                "do_not_copy": analysis.get("do_not_copy", []),
                "technical_clues": analysis.get("technical_clues", []),
                "confidence": analysis.get("confidence", ""),
                "limitations": analysis.get("limitations", ""),
                "evidence": analysis.get("evidence", []),
                "visual_evidence": record["visual_evidence"],
                "engine_markers": capture.get("engine_markers", []),
                "script_count_scanned": capture.get("script_count_scanned", ""),
                "script_bytes_scanned": capture.get("script_bytes_scanned", ""),
                "tuning_constant_candidates": capture.get("tuning_constant_candidates", []),
                "technical_limitations": capture.get("limitations", []),
                "request_failure_count": capture.get("request_failure_count", 0),
                "page_error_count": capture.get("page_error_count", 0),
                "console_error_count": capture.get("console_error_count", 0),
            })
            writer.writerow({k: as_text(v) for k, v in row.items()})

    roundtrip = read_json(json_path)
    if len(roundtrip["games"]) != 40 or len({r["catalog"]["id"] for r in roundtrip["games"]}) != 40:
        raise SystemExit("Output JSON verification failed: expected exactly 40 unique games")
    serialized = json.dumps(roundtrip, ensure_ascii=False)
    if URL_RE.search(serialized) or re.search(r"(?i)manus", serialized):
        raise SystemExit("Sanitization verification failed: public URL or prohibited product name remains")
    with csv_path.open(encoding="utf-8-sig", newline="") as f:
        csv_rows = list(csv.DictReader(f))
    if len(csv_rows) != 40 or len({r["id"] for r in csv_rows}) != 40:
        raise SystemExit("Output CSV verification failed: expected exactly 40 unique rows")
    csv_text = csv_path.read_text(encoding="utf-8-sig")
    if URL_RE.search(csv_text) or re.search(r"(?i)manus", csv_text):
        raise SystemExit("Sanitization verification failed in CSV")
    print(json.dumps({
        "json": str(json_path.resolve()), "csv": str(csv_path.resolve()),
        "catalog_count": len(catalog_games), "technical_count": len(technical_games),
        "analysis_count": len(analysis_by_id), "complete": output["complete"],
        "observation_level_counts": output["observation_level_counts"],
        "capture_status_counts": output["capture_status_counts"],
        "visual_evidence_frames": sum(len(r["visual_evidence"]) for r in records),
        "sanitized": True,
    }, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()

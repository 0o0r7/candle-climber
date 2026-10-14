#!/usr/bin/env python3
"""LT DIAG — sanitized LambdaTest account/grid diagnostics (manual dispatch only).

Answers the standing owner question «LambdaTest grid: handshake fails from CI —
runs #8/#9» by querying the platform AS the CI credentials do — without ever
printing the credentials:

  1. plan/quota snapshot (tolerant; endpoint may 404 on some plans)
  2. recent automation builds (the #8/#9 window: builds G5-prelaunch-QA-*)
  3. per-session meta + execution-log tail for the known failed sessions
  4. LIVE repro: ONE minimal web-automation session on the same hub CI uses —
     is the handshake still failing right now?

Output: GitHub run log (sanitized) + qa/lt-diag/diag-<stamp>.json artifact.
Nothing sensitive is printed: only IDs, statuses, error messages, timings.
"""
import base64
import json
import os
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from datetime import datetime, timezone

LT_API = "https://api.lambdatest.com/automation/api/v1"
HUB = "https://hub.lambdatest.com/wd/hub"
PLAN_API = "https://api.lambdatest.com/api/v1/plan_detail"
OUT = os.environ.get("QA_OUT", "qa/lt-diag")
GAME = os.environ.get("GAME_URL", "https://candle-climber.vercel.app/")
STAMP = datetime.now(timezone.utc).strftime("%Y%m%d-%H%M%S")

# Runs #8/#9 (2026-10-13, workflow realdevice-qa) — the six failing sessions.
KNOWN_SESSIONS = [
    "8c925a84-8293-4bb4-82db-a579ac27a4d9",
    "dd82288b-af5d-46ca-91fe-d6ec2ecdd05f",
    "54b1c7313ad7f4a25075d94746eba954",
    "06aad5e467d37152ff636cf89d0389fe",
    "6eb2b7ab-22c9-4bdb-a049-55d57a6856f3",
    "142c0cd3-421e-4ec5-9ebf-61b28e218b5b",
]


def auth_header():
    u = os.environ.get("LT_USERNAME", "").strip()
    k = os.environ.get("LT_ACCESS_KEY", "").strip()
    if not (u and k):
        print("MISSING CREDS: LT_USERNAME/LT_ACCESS_KEY not set (secrets empty?)")
        sys.exit(2)
    return "Basic " + base64.b64encode(f"{u}:{k}".encode()).decode()


def get(tok, url, timeout=40):
    req = urllib.request.Request(
        url, headers={"Authorization": tok, "Accept": "application/json"})
    try:
        with urllib.request.urlopen(req, timeout=timeout) as r:
            return r.status, json.load(r)
    except urllib.error.HTTPError as e:
        return e.code, {"_http_error": e.read()[:400].decode("utf-8", "replace")}
    except Exception as e:  # noqa: BLE001
        return 0, {"_network_error": str(e)[:200]}


def clip(obj, n=1500):
    s = json.dumps(obj, ensure_ascii=False, default=str)
    return s if len(s) <= n else s[:n] + f"...(+{len(s) - n} chars)"


def diag_static(tok, report):
    print("\n=== 1. PLAN / QUOTA (tolerant) ===")
    report["plan"] = {}
    for label, url in (("plan_detail", PLAN_API),
                       ("plan_alt", "https://api.lambdatest.com/api/v1/plan"),
                       ("usage", "https://api.lambdatest.com/api/v1/usage")):
        code, plan = get(tok, url)
        report["plan"][label] = {"http": code, "body": plan if code == 200 else None}
        print(f"  {label} HTTP {code}: {clip(plan, 600)}")
    report["plan"]["note"] = "non-200 tolerated (endpoints differ per plan)"

    print("\n=== 2. RECENT AUTOMATION BUILDS ===")
    code, builds = get(tok, f"{LT_API}/builds?limit=15")
    rows = []
    if code == 200:
        for b in (builds.get("data") or [])[:15]:
            rows.append({"build_id": b.get("build_id"), "name": b.get("name"),
                         "status": b.get("status"),
                         "created_at": b.get("created_at"),
                         "sessions_passed": (b.get("metrics") or {}).get("passed"),
                         "sessions_failed": (b.get("metrics") or {}).get("failed")})
    else:
        rows = [{"builds_api_http": code, "body": clip(builds, 400)}]
    report["builds"] = {"http": code, "rows": rows}
    for r in rows:
        print(f"  {(str(r.get('created_at')) if r.get('created_at') else '?')[:19]}  "
              f"{str(r.get('name') or '?')!r}  "
              f"status={r.get('status')} passed={r.get('sessions_passed')} "
              f"failed={r.get('sessions_failed')}")

    print("\n=== 3. KNOWN FAILED SESSIONS (#8/#9 window) ===")
    sess_report = []
    for sid in KNOWN_SESSIONS:
        c1, meta = get(tok, f"{LT_API}/sessions/{sid}")
        entry = {"session_id": sid, "meta_http": c1}
        if c1 == 200:
            d = meta.get("data", meta)
            entry.update({
                "status": d.get("status"),
                "test_name": d.get("test_name"),
                "build_name": d.get("build_name"),
                "created_at": d.get("created_at"),
                "platform": f"{d.get('platform','?')} {d.get('browser','?')} "
                            f"{d.get('browser_version','?')}",
                "error_message": (d.get("error_message") or "")[:300],
                "reason": (d.get("reason") or "")[:300],
            })
            c2, log = get(tok, f"{LT_API}/sessions/{sid}/executionlog")
            if c2 == 200:
                logs = log.get("data", log) if isinstance(log, dict) else log
                if isinstance(logs, dict):
                    logs = logs.get("logs", [])
                tail = logs[-12:] if isinstance(logs, list) else logs
                entry["execution_log_tail"] = tail
            else:
                entry["execution_log_http"] = c2
        sess_report.append(entry)
        print(f"  [{sid[:8]}…] meta HTTP {c1}: {clip({k: v for k, v in entry.items() if k != 'execution_log_tail'}, 700)}")
        if "execution_log_tail" in entry:
            print(f"    exec-log tail ({len(entry['execution_log_tail'])} entries):")
            for e_ in entry["execution_log_tail"]:
                if isinstance(e_, dict):
                    print(f"      {str(e_.get('created_at',''))[:19]} "
                          f"{str(e_.get('command','?'))[:60]} -> "
                          f"{str(e_.get('status','?'))[:12]} "
                          f"{str(e_.get('message',''))[:160]}")
                else:
                    print(f"      {str(e_)[:200]}")
    report["known_sessions"] = sess_report


def diag_live_repro(tok, report):
    """A/B capability probes — isolate which realdevice-script cap kills the
    session. Baseline (proven good 2026-10-14): idle 300, media OFF."""
    print("\n=== 4. LIVE REPRO — capability A/B probes on the CI hub ===")
    try:
        from selenium import webdriver
        from selenium.webdriver.chrome.options import Options
    except Exception as e:  # noqa: BLE001
        print(f"  selenium import failed: {e}")
        report["live_repro"] = {"import_error": str(e)[:200]}
        return

    probes = [
        {"label": "A_realdevice_caps_exact",
         "note": "idle 240 + video/screenshot/console True — the realdevice.py set",
         "caps": {"resolution": "1440x900", "w3c": True, "video": True,
                  "screenshot": True, "console": True, "network": False,
                  "queueTimeout": 300, "idleTimeout": 240}},
        {"label": "B_idle_300_media_off",
         "note": "idle 300, media off — the proven-good baseline",
         "caps": {"resolution": "1440x900", "w3c": True, "video": False,
                  "screenshot": False, "console": False, "network": False,
                  "queueTimeout": 300, "idleTimeout": 300}},
    ]
    results = []
    for p in probes:
        entry = {"label": p["label"], "note": p["note"]}
        try:
            o = Options()
            o.set_capability("platformName", "Windows 10")
            o.set_capability("browserName", "Chrome")
            o.set_capability("browserVersion", "latest")
            caps = dict(p["caps"])
            caps.update({"build": f"lt-diag-{STAMP}", "name": f"cap probe {p['label']}"})
            o.set_capability("LT:Options", caps)
            hub = (f"https://{urllib.parse.quote(os.environ['LT_USERNAME'])}:"
                   f"{urllib.parse.quote(os.environ['LT_ACCESS_KEY'])}@hub.lambdatest.com/wd/hub")
            t0 = time.time()
            d = webdriver.Remote(hub, options=o)
            entry["session_create_s"] = round(time.time() - t0, 1)
            sid = d.session_id
            entry["session_id"] = sid
            print(f"  [{p['label']}] session {sid} created in {entry['session_create_s']}s")
            t1 = time.time()
            try:
                d.get(GAME)
                entry["first_command"] = {"ok": True, "title": d.title,
                                          "seconds": round(time.time() - t1, 1)}
                print(f"  [{p['label']}] FIRST COMMAND OK in {entry['first_command']['seconds']}s  title={d.title!r}")
            except Exception as e:  # noqa: BLE001
                entry["first_command"] = {"ok": False, "error": str(e)[:300]}
                print(f"  [{p['label']}] FIRST COMMAND FAILED: {type(e).__name__}: {str(e)[:200]}")
            try:
                d.quit()
            except Exception:  # noqa: BLE001
                pass
        except Exception as e:  # noqa: BLE001
            entry["session_create"] = f"FAILED: {type(e).__name__}: {str(e)[:300]}"
            print(f"  [{p['label']}] SESSION CREATE FAILED: {str(e)[:200]}")
        results.append(entry)
    report["live_repro"] = results
    okA = any(r.get("label") == "A_realdevice_caps_exact" and (r.get("first_command") or {}).get("ok") for r in results)
    okB = any(r.get("label") == "B_idle_300_media_off" and (r.get("first_command") or {}).get("ok") for r in results)
    if okA:
        print("VERDICT: A passes too — caps are NOT the killer; grid healthy for the realdevice script shape")
    elif okB:
        print("VERDICT: A fails / B passes — a realdevice-script CAP (idle 240 or media flags) kills sessions; fix the caps")
    else:
        print("VERDICT: both probes fail — grid-side issue persists for this shape")


def main():
    tok = auth_header()
    print(f"creds source: env (values never printed)  stamp={STAMP}")
    os.makedirs(OUT, exist_ok=True)
    report = {"stamp": STAMP, "game": GAME}
    for section in (lambda: diag_static(tok, report),
                    lambda: diag_live_repro(tok, report)):
        try:
            section()
        except Exception as e:  # noqa: BLE001
            print(f"  SECTION CRASH (continuing): {type(e).__name__}: {str(e)[:300]}")
            report.setdefault("section_errors", []).append(str(e)[:300])
    path = f"{OUT}/diag-{STAMP}.json"
    with open(path, "w") as f:
        json.dump(report, f, indent=2, default=str)
    print(f"\nartifact -> {path}")
    return 0


if __name__ == "__main__":
    sys.exit(main())

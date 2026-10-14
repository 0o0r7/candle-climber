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
    code, plan = get(tok, PLAN_API)
    report["plan"] = {"http": code, "body": plan if code == 200 else None,
                      "note": "non-200 tolerated (endpoint differs per plan)"}
    print(f"  plan_detail HTTP {code}: {clip(plan, 900)}")

    print("\n=== 2. RECENT AUTOMATION BUILDS ===")
    code, builds = get(tok, f"{LT_API}/builds?limit=15&sort=created_at.desc")
    rows = []
    if code == 200:
        for b in builds.get("data", [])[:15]:
            rows.append({"build_id": b.get("build_id"), "name": b.get("name"),
                         "status": b.get("status"),
                         "created_at": b.get("created_at"),
                         "sessions_passed": (b.get("metrics") or {}).get("passed"),
                         "sessions_failed": (b.get("metrics") or {}).get("failed")})
    report["builds"] = {"http": code, "rows": rows}
    for r in rows:
        print(f"  {r.get('created_at','?')[:19]}  {r.get('name','?')!r}  "
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
    print("\n=== 4. LIVE REPRO — one minimal session on the CI hub ===")
    entry = {"started_utc": STAMP}
    try:
        from selenium import webdriver
        from selenium.webdriver.chrome.options import Options

        o = Options()
        o.set_capability("platformName", "Windows 10")
        o.set_capability("browserName", "Chrome")
        o.set_capability("browserVersion", "latest")
        o.set_capability("LT:Options", {
            "resolution": "1280x800", "w3c": True,
            "build": f"lt-diag-{STAMP}", "name": "handshake repro (diag)",
            "video": False, "screenshot": False, "console": False,
            "network": False, "queueTimeout": 120, "idleTimeout": 60,
        })
        hub = (f"https://{urllib.parse.quote(os.environ['LT_USERNAME'])}:"
               f"{urllib.parse.quote(os.environ['LT_ACCESS_KEY'])}@hub.lambdatest.com/wd/hub")
        t0 = time.time()
        d = webdriver.Remote(hub, options=o)
        entry["session_create_s"] = round(time.time() - t0, 1)
        sid = d.session_id
        entry["session_id"] = sid
        print(f"  session created in {entry['session_create_s']}s  id={sid}")
        t1 = time.time()
        try:
            d.get(GAME)
            title = d.title
            entry["first_command"] = {"ok": True, "title": title,
                                      "seconds": round(time.time() - t1, 1)}
            print(f"  FIRST COMMAND OK in {entry['first_command']['seconds']}s  title={title!r}")
        except Exception as e:  # noqa: BLE001
            entry["first_command"] = {"ok": False, "error": str(e)[:400]}
            print(f"  FIRST COMMAND FAILED: {type(e).__name__}: {str(e)[:300]}")
        try:
            d.quit()
            entry["quit"] = "ok"
        except Exception as e:  # noqa: BLE001
            entry["quit"] = f"error: {str(e)[:120]}"
        code, meta = get(tok, f"{LT_API}/sessions/{sid}")
        if code == 200:
            dd = meta.get("data", meta)
            entry["grid_status"] = dd.get("status")
            print(f"  grid session status: {entry['grid_status']}")
    except Exception as e:  # noqa: BLE001
        entry["session_create"] = f"FAILED: {type(e).__name__}: {str(e)[:400]}"
        print(f"  SESSION CREATE FAILED: {type(e).__name__}: {str(e)[:300]}")
    report["live_repro"] = entry


def main():
    tok = auth_header()
    print(f"creds source: env (values never printed)  stamp={STAMP}")
    os.makedirs(OUT, exist_ok=True)
    report = {"stamp": STAMP, "game": GAME}
    diag_static(tok, report)
    diag_live_repro(tok, report)
    path = f"{OUT}/diag-{STAMP}.json"
    with open(path, "w") as f:
        json.dump(report, f, indent=2, default=str)
    print(f"\nartifact -> {path}")
    repro = report.get("live_repro", {})
    ok = (repro.get("first_command") or {}).get("ok") is True
    print(f"VERDICT: live repro first-command {'OK — grid recovered / infra-only in past' if ok else 'STILL FAILING — grid-side issue confirmed today'}")
    return 0


if __name__ == "__main__":
    sys.exit(main())

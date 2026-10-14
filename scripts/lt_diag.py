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
# Extend via env LT_DIAG_SESSIONS (comma-separated) to autopsy any new run.
KNOWN_SESSIONS = [
    "8c925a84-8293-4bb4-82db-a579ac27a4d9",
    "dd82288b-af5d-46ca-91fe-d6ec2ecdd05f",
    "54b1c7313ad7f4a25075d94746eba954",
    "06aad5e467d37152ff636cf89d0389fe",
    "6eb2b7ab-22c9-4bdb-a049-55d57a6856f3",
    "142c0cd3-421e-4ec5-9ebf-61b28e218b5b",
] + [s.strip() for s in os.environ.get("LT_DIAG_SESSIONS", "").split(",") if s.strip()]


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
        {"label": "A_win11_exact_realdevice_caps",
         "note": "platformName Windows 11 — the realdevice.py desktop targets",
         "platform": "Windows 11",
         "caps": {"resolution": "1440x900", "w3c": True, "video": True,
                  "screenshot": True, "console": True, "network": False,
                  "queueTimeout": 300, "idleTimeout": 240}},
        {"label": "B_win10_same_caps",
         "note": "platformName Windows 10, identical caps — isolates the OS pool",
         "platform": "Windows 10",
         "caps": {"resolution": "1440x900", "w3c": True, "video": True,
                  "screenshot": True, "console": True, "network": False,
                  "queueTimeout": 300, "idleTimeout": 240}},
        {"label": "C_pixel7_real_device_min",
         "note": "the real-device leg: create + first command + immediate quit",
         "platform": "Android",
         "caps": {"deviceName": "Pixel 7", "platformVersion": "13",
                  "isRealMobile": True, "w3c": True,
                  "queueTimeout": 300, "idleTimeout": 240},
         "browserName": "Chrome", "android": True},
    ]
    results = []
    for p in probes:
        entry = {"label": p["label"], "note": p["note"]}
        try:
            o = Options()
            o.set_capability("platformName", p["platform"])
            if not p.get("android"):
                o.set_capability("browserName", "Chrome")
                o.set_capability("browserVersion", "latest")
            else:
                o.set_capability("browserName", p["browserName"])
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
            # best-effort slot cleanup — a husk session must not eat the
            # freemium concurrency slots and cascade into later probes/runs
            try:
                stop = urllib.request.Request(f"{LT_API}/sessions/{sid}", method="DELETE",
                                              headers={"Authorization": tok})
                urllib.request.urlopen(stop, timeout=30)
                entry["cleanup"] = "stopped via API"
            except Exception as e:  # noqa: BLE001
                entry["cleanup"] = f"skip: {str(e)[:100]}"
        except Exception as e:  # noqa: BLE001
            entry["session_create"] = f"FAILED: {type(e).__name__}: {str(e)[:300]}"
            print(f"  [{p['label']}] SESSION CREATE FAILED: {str(e)[:200]}")
        results.append(entry)
    # Probe D — THE BISECT: run the REAL lambdatest_realdevice.run_session()
    # body (full 16-check walk) inside THIS diag workflow. If D passes while
    # the realdevice.yml run husks in the same window, the difference is the
    # workflow context; if D fails, the script body itself kills sessions.
    try:
        sys.path.insert(0, os.path.join(os.path.dirname(__file__)))
        import lambdatest_realdevice as rd
        user, key = os.environ["LT_USERNAME"].strip(), os.environ["LT_ACCESS_KEY"].strip()
        rd.OUT = OUT  # keep evidence inside the diag artifact
        rd.PROD = os.environ.get("GAME_URL", rd.PROD)
        entry_d = {"label": "D_full_realdevice_body",
                   "note": "full 16-check run_session() executed from the diag workflow"}
        t0 = time.time()
        try:
            rep = rd.run_session(rd.DEFAULT_MATRIX[0], user, key)
            entry_d["seconds"] = round(time.time() - t0, 1)
            entry_d["pass"] = rep.get("pass")
            entry_d["session_id"] = rep.get("session_id")
            failed = [c for c in rep.get("checks", []) if not c.get("ok")]
            entry_d["failed_checks"] = [c["check"] for c in failed]
            entry_d["detail"] = {c["check"]: c["detail"][:120] for c in failed}
            print(f"  [D_full_realdevice_body] {'PASS' if rep.get('pass') else 'FAIL'} "
                  f"in {entry_d['seconds']}s failed_checks={entry_d['failed_checks']}")
        except Exception as e:  # noqa: BLE001
            entry_d["seconds"] = round(time.time() - t0, 1)
            entry_d["fatal"] = f"{type(e).__name__}: {str(e)[:300]}"
            print(f"  [D_full_realdevice_body] FATAL: {entry_d['fatal'][:200]}")
        results.append(entry_d)
    except Exception as e:  # noqa: BLE001
        print(f"  probe D import failed: {e}")
    report["live_repro"] = results
    def _ok(lbl):
        return any(r.get("label") == lbl and (r.get("first_command") or {}).get("ok") for r in results)
    a, b, c = _ok("A_win11_exact_realdevice_caps"), _ok("B_win10_same_caps"), _ok("C_pixel7_real_device_min")
    if a and b and c:
        print("VERDICT: ALL pass — pools healthy right now; earlier failure was transient")
    elif not a and b:
        print("VERDICT: Windows-11 pool broken / Windows-10 fine — point the desktop targets at win10")
    elif not c and b:
        print("VERDICT: real-device pool broken / desktop fine — quota or device-pool issue")
    else:
        print(f"VERDICT: mixed A={a} B={b} C={c} — see per-probe lines above")


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

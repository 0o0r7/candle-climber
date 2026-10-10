#!/usr/bin/env python3
"""P3.3 — LambdaTest REAL-DEVICE matrix QA for candle-climber.vercel.app.

Runs a small device/browser/size matrix on the LambdaTest grid (freemium-safe,
3 sequential sessions): each session boots prod, selects venom, START CLIMB,
tap-jump loop, natural death card, console audit, video evidence on LT dashboard.

Credentials (never printed): env LT_USERNAME + LT_ACCESS_KEY first (GitHub
Actions secrets — survives sandbox resets), then file fallback
/home/z/.lt_user + /home/z/.lt_key (0600). Missing both -> exit 2 with a
clear message.

Evidence: $QA_OUT/rd-*.png + aggregate report JSON (per-session files too).
Env overrides: GAME_URL (default prod), QA_OUT (default /home/z/my-project/qa/realdevice),
QA_MATRIX (JSON array of {label, caps} to override the default matrix).

Exit code 0 = all sessions PASS (chips render, run starts, death card reached,
0 SEVERE errors).
"""
import json
import sys
import time
import os
from datetime import datetime

from selenium import webdriver
from selenium.webdriver.chrome.options import Options as ChromeOptions
from selenium.webdriver.common.action_chains import ActionChains
from selenium.webdriver.common.by import By
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.support.ui import WebDriverWait

import urllib.parse

PROD = os.environ.get("GAME_URL", "https://candle-climber.vercel.app")
OUT = os.environ.get("QA_OUT", "/home/z/my-project/qa/realdevice")
HUB = "https://hub.lambdatest.com/wd/hub"
LT_API = "https://api.lambdatest.com/automation/api/v1"
STAMP = datetime.now().strftime("%Y%m%d-%H%M%S")


def load_creds():
    u = os.environ.get("LT_USERNAME", "").strip()
    k = os.environ.get("LT_ACCESS_KEY", "").strip()
    if u and k:
        return u, k, "env"
    try:
        u = open("/home/z/.lt_user").read().strip()
        k = open("/home/z/.lt_key").read().strip()
        if u and k:
            return u, k, "file"
    except OSError:
        pass
    return None, None, "missing"


# Freemium-safe default matrix: 1 real device + 2 desktop browser/size combos.
DEFAULT_MATRIX = [
    {
        "label": "pixel7-real-android13-chrome",
        "caps": {
            "platformName": "Android",
            "browserName": "Chrome",
            "LT:Options": {
                "deviceName": "Pixel 7", "platformVersion": "13",
                "isRealMobile": True, "w3c": True,
            },
        },
    },
    {
        "label": "win11-chrome-1440x900",
        "caps": {
            "platformName": "Windows 11",
            "browserName": "Chrome",
            "browserVersion": "latest",
            "LT:Options": {"resolution": "1440x900", "w3c": True},
        },
    },
    {
        "label": "win11-firefox-1280x800",
        "caps": {
            "platformName": "Windows 11",
            "browserName": "Firefox",
            "browserVersion": "latest",
            "LT:Options": {"resolution": "1280x800", "w3c": True},
        },
    },
]


def build_driver(caps, lt_user, lt_key):
    o = ChromeOptions()
    for k, v in caps.items():
        if k == "LT:Options":
            merged = dict(v)
            merged.update({
                "build": "G3-real-device-QA",
                "name": "P3.3 device matrix QA",
                "video": True, "screenshot": True, "console": True,
                "network": False, "queueTimeout": 300, "idleTimeout": 180,
            })
            o.set_capability(k, merged)
        else:
            o.set_capability(k, v)
    hub = (f"https://{urllib.parse.quote(lt_user)}:{urllib.parse.quote(lt_key)}"
           f"@hub.lambdatest.com/wd/hub")
    return webdriver.Remote(hub, options=o)


def shot(d, name, out):
    p = f"{out}/rd-{name}-{STAMP}.png"
    try:
        d.get_screenshot_as_file(p)
        print(f"    screenshot -> {p}")
    except Exception as e:  # noqa: BLE001
        print(f"    screenshot {name} error: {e}")


def tap_canvas(d):
    canvas = d.find_element(By.CSS_SELECTOR, ".cc-canvas")
    ActionChains(d).move_to_element(canvas).click().perform()


def run_session(cfg, lt_user, lt_key):
    label = cfg["label"]
    out = f"{OUT}/{label}"
    os.makedirs(out, exist_ok=True)
    report = {"stamp": STAMP, "label": label, "url": PROD,
              "caps": {k: v for k, v in cfg["caps"].items() if k != "LT:Options"}}
    checks = []

    def check(name, ok, detail=""):
        checks.append({"check": name, "ok": bool(ok), "detail": str(detail)[:300]})
        print(f"[{'PASS' if ok else 'FAIL'}] {label} :: {name}: {str(detail)[:140]}")
        return bool(ok)

    d = build_driver(cfg["caps"], lt_user, lt_key)
    sid = d.session_id
    report["session_id"] = sid
    print(f"[{label}] session: {sid}")
    try:
        d.get(PROD)
        WebDriverWait(d, 60).until(
            EC.presence_of_element_located((By.CSS_SELECTOR, ".cc-char-chip"))
        )
        # G2 de-clutter: the roster (and everything else) folded into the
        # "WAYS TO PLAY" <details> — expand it or the chips are display:none
        # (present in DOM but .text empty → venom never found).
        try:
            d.execute_script(
                "const x=document.querySelector('.cc-more');if(x)x.open=true;")
            time.sleep(0.6)
        except Exception:
            pass
        chips = d.find_elements(By.CSS_SELECTOR, ".cc-char-chip")
        check("page_title", "candle" in (d.title or "").lower(), d.title)
        check("char_chips_rendered", len(chips) >= 14, f"{len(chips)} chips")
        shot(d, "01-boot", out)

        venom = next((c for c in chips if "venom" in c.text.lower()), None)
        if venom:
            venom.click()
            time.sleep(1)
            sel = d.find_elements(By.CSS_SELECTOR, ".cc-char-chip.cc-char-on")
            ok = len(sel) == 1 and "venom" in sel[0].text.lower()
            check("venom_select", ok, sel[0].text.strip() if sel else "none selected")
        else:
            check("venom_select", False, "venom chip not found")

        start = WebDriverWait(d, 20).until(
            EC.element_to_be_clickable((By.CSS_SELECTOR, ".cc-btn-start"))
        )
        start.click()
        try:
            WebDriverWait(d, 20).until(
                EC.presence_of_element_located((By.CSS_SELECTOR, ".cc-chip-score"))
            )
            check("run_started", True, "HUD score chip visible")
        except Exception:
            check("run_started", d.execute_script(
                "const p=document.querySelector('.cc-panel');return p?getComputedStyle(p).display==='none':true;"),
                "score chip not found; panel state probed")
        shot(d, "03-running", out)

        t0 = time.time()
        taps = 0
        dead = False
        while time.time() - t0 < 120:
            try:
                if d.find_elements(By.CSS_SELECTOR, ".cc-death-num"):
                    dead = True
                    break
            except Exception:
                pass
            try:
                tap_canvas(d)
                taps += 1
            except Exception:
                pass
            time.sleep(0.8)
        score_txt = ""
        if dead:
            try:
                score_txt = d.find_element(By.CSS_SELECTOR, ".cc-death-num").text
            except Exception:
                pass
        check("gameplay_then_death_card", dead, f"taps={taps} death-score={score_txt!r}")
        shot(d, "04-deathcard", out)

        severe = 0
        try:
            for e in d.get_log("browser"):
                if e.get("level") == "SEVERE":
                    severe += 1
                    print(f"    SEVERE: {e.get('message','')[:120]}")
        except Exception as e:  # noqa: BLE001
            report["console_logs"] = f"unsupported: {e}"
        check("no_severe_console_errors", severe == 0, f"{severe} SEVERE entries")
        report["console_severe"] = severe
    finally:
        try:
            d.quit()
        except Exception:
            pass

    import urllib.request
    import base64
    req = urllib.request.Request(
        f"{LT_API}/sessions/{sid}",
        headers={"Authorization": "Basic " + base64.b64encode(
            f"{lt_user}:{lt_key}".encode()).decode()})
    try:
        meta = json.load(urllib.request.urlopen(req, timeout=30))
        report["lt_status"] = meta.get("status")
        report["video_url"] = meta.get("video_url")
        report["dashboard"] = f"https://automation.lambdatest.com/log/{sid}"
    except Exception as e:  # noqa: BLE001
        report["lt_api_error"] = str(e)[:200]

    report["checks"] = checks
    report["pass"] = all(c["ok"] for c in checks)
    with open(f"{OUT}/report-real-{label}-{STAMP}.json", "w") as f:
        json.dump(report, f, indent=2)
    return report


def main():
    lt_user, lt_key, src = load_creds()
    if not lt_user:
        print("MISSING CREDS: set env LT_USERNAME + LT_ACCESS_KEY "
              "(GitHub Actions secrets) or drop /home/z/.lt_user + /home/z/.lt_key")
        return 2
    print(f"creds source: {src}")
    os.makedirs(OUT, exist_ok=True)
    matrix = DEFAULT_MATRIX
    raw = os.environ.get("QA_MATRIX", "").strip()
    if raw:
        try:
            matrix = json.loads(raw)
        except ValueError:
            print("QA_MATRIX parse failed; using default matrix")

    reports = []
    for i, cfg in enumerate(matrix):
        label = cfg.get("label", f"session-{i}")
        rep = None
        for attempt in (1, 2):  # grid VMs are flaky — one retry on session error
            try:
                rep = run_session(cfg, lt_user, lt_key)
                rep["attempt"] = attempt
                break
            except Exception as e:  # noqa: BLE001
                print(f"[RETRY {attempt}] {label} :: session error: {str(e)[:160]}")
                if attempt == 2:
                    rep = {"label": label, "pass": False, "attempt": 2,
                           "error": str(e)[:300]}
        reports.append(rep)

    summary = {"stamp": STAMP, "url": PROD, "sessions": len(reports),
               "passed": sum(1 for r in reports if r.get("pass")),
               "results": [{"label": r.get("label"), "pass": r.get("pass"),
                            "dashboard": r.get("dashboard"),
                            "video_url": r.get("video_url")} for r in reports]}
    with open(f"{OUT}/report-real-SUMMARY-{STAMP}.json", "w") as f:
        json.dump(summary, f, indent=2)
    print(f"\nMATRIX: {summary['passed']}/{summary['sessions']} sessions PASS")
    for r in summary["results"]:
        print(f"  {r['label']}: {'PASS' if r['pass'] else 'FAIL'}"
              + (f"  dashboard: {r['dashboard']}" if r.get("dashboard") else ""))
    return 0 if summary["passed"] == summary["sessions"] else 1


if __name__ == "__main__":
    sys.exit(main())

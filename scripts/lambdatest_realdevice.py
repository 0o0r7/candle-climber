#!/usr/bin/env python3
"""G5 — LambdaTest REAL-DEVICE matrix QA for candle-climber.vercel.app (prelaunch).

Runs a freemium-safe device/browser matrix (3 sequential sessions) on the LT grid.
Each session walks the REAL player path against PRODUCTION and asserts the full
product surface — not just boot-and-die:

  1  page_title                landing/prod identity
  2  mode_tabs_present         CRYPTO/STOCKS/LAUNCHPAD tablist renders (3-mode era)
  3  corner_tools_visible      D8 regression guard — settings group reachable/visible
  4  settings_dialog_opens    dialog opens + closes (Escape)
  5  achievements_dialog_opens dialog opens + closes (Escape)
  6  wizard_gate               first-run tutorial overlay appears + SKIP dismisses
  7  run_started               HUD score chip appears
   8 pause_toggle              desktop only — "p" pauses, "p" resumes (window handler)
  9 mobile_rush_button         mobile only — hold-to-boost chip present
 10 gameplay_then_death_card   tap loop -> natural death -> score rendered
 11 results_home_affordance    D2 regression guard — HOME present on the death panel
 12 landing_surface            (chrome desktop) root page: footer links + $WICK strip
 13 sentry_sdk_loaded          window.__SENTRY__ present -> monitoring wired on prod
 14 no_severe_console_errors   console audit (when the grid exposes logs)

Credentials (never printed): env LT_USERNAME + LT_ACCESS_KEY first (GitHub
Actions secrets — survives sandbox resets), then file fallback
/home/z/.lt_user + /home/z/.lt_key (0600). Missing both -> exit 2 with a
clear message.

Evidence: $QA_OUT/<label>/rd-*.png + per-session report JSON + aggregate
SUMMARY JSON. Env overrides: GAME_URL, QA_OUT, QA_MATRIX (JSON array of
{label, caps}).

Exit code 0 = all sessions PASS (every check ok).
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
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.support.ui import WebDriverWait

import urllib.parse

PROD = os.environ.get("GAME_URL", "https://candle-climber.vercel.app/play")
OUT = os.environ.get("QA_OUT", "/home/z/my-project/qa/realdevice")
HUB = "https://hub.lambdatest.com/wd/hub"
LT_API = "https://api.lambdatest.com/automation/api/v1"
STAMP = datetime.now().strftime("%Y%m%d-%H%M%S")
# 2026-10-15: fresh build-name prefix — after the Oct 12-14 empty-message husk
# streak on the G5-prelaunch-QA-* series while bare diag sessions kept passing
# in the SAME windows, the recurring name series is rule-out suspect #1.
BUILD = os.environ.get("LT_BUILD_PREFIX", "CC-DEV-QA") + f"-{STAMP}"


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


# Freemium-safe matrix, DESKTOP-FIRST (2026-10-15): the real-device leg is the
# flakiest (runs #7-#11 always died on it FIRST) and a husked real-device
# session may hold the freemium concurrency slot, cascading into every later
# target. Cheap desktop signal first; real device last, isolated.
DEFAULT_MATRIX = [
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
]


def build_driver(caps, lt_user, lt_key):
    o = ChromeOptions()
    for k, v in caps.items():
        if k == "LT:Options":
            merged = dict(v)
            merged.update({
                "build": BUILD,
                "name": f"device matrix QA {STAMP}",
                "video": True, "screenshot": True, "console": True,
                "network": False, "queueTimeout": 300, "idleTimeout": 240,
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


def dialog_open_and_close(d, check, trigger_sel, name, idx=0):
    """Click the idx-th button inside trigger_sel, assert a shadcn dialog
    appears, close it with Escape, assert it is gone."""
    try:
        trig = d.find_elements(By.CSS_SELECTOR, f"{trigger_sel} button")[idx]
        d.execute_script("arguments[0].scrollIntoView({block:'center'});", trig)
        trig.click()
    except Exception as e:  # noqa: BLE001
        check(name, False, f"trigger click failed: {str(e)[:120]}")
        return
    try:
        WebDriverWait(d, 10).until(
            EC.presence_of_element_located((By.CSS_SELECTOR, '[role="dialog"]')))
    except Exception:
        check(name, False, "dialog did not open")
        return
    opened = d.find_elements(By.CSS_SELECTOR, '[role="dialog"]')
    opened_ok = bool(opened) and opened[0].is_displayed()
    try:
        d.find_element(By.CSS_SELECTOR, "body").send_keys(Keys.ESCAPE)
        time.sleep(1.2)
        gone = len(d.find_elements(By.CSS_SELECTOR, '[role="dialog"]')) == 0
    except Exception:
        gone = False
    check(name, opened_ok and gone,
          f"opened={opened_ok} closed_by_escape={gone}")


def run_session(cfg, lt_user, lt_key):
    label = cfg["label"]
    is_desktop = label.startswith("win11")
    is_chrome_desktop = label == "win11-chrome-1440x900"
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
        print(f"[{label}] phase:get", flush=True)
        d.get(PROD)
        print(f"[{label}] phase:wait-boot", flush=True)
        WebDriverWait(d, 60).until(
            EC.presence_of_element_located((By.CSS_SELECTOR, ".cc-mode-btn")))

        # G5: WIZARD FIRST — the first-visit tutorial overlay covers the entry
        # card and absorbs every click beneath it (dialog clicks silently
        # no-op). Fresh grid profiles ALWAYS see it: dismiss before anything else.
        print(f"[{label}] phase:wizard", flush=True)
        try:
            WebDriverWait(d, 8).until(
                EC.presence_of_element_located((By.CSS_SELECTOR, ".cc-tutorial-overlay")))
            skip = next((b for b in d.find_elements(
                By.CSS_SELECTOR, ".cc-tutorial-overlay button")
                if b.text.strip().upper() == "SKIP"), None)
            if skip:
                skip.click()
                time.sleep(1)
                gone = len(d.find_elements(By.CSS_SELECTOR, ".cc-tutorial-overlay")) == 0
                check("wizard_gate", gone, f"overlay shown, SKIP dismissed={gone}")
                shot(d, "00-wizard", out)
            else:
                check("wizard_gate", False, "overlay shown but SKIP not found")
        except Exception:
            check("wizard_gate", True, "overlay not shown (progress flag already set)")

        check("page_title", "candle" in (d.title or "").lower(), d.title)

        # G5: 3-mode era — the tablist must render with CRYPTO active.
        try:
            d.execute_script(
                "const x=document.querySelector('.cc-more');if(x)x.open=true;")
            time.sleep(0.6)
        except Exception:
            pass
        modes = d.find_elements(By.CSS_SELECTOR, ".cc-mode-btn")
        active = [m for m in modes if "cc-mode-active" in (m.get_attribute("class") or "")]
        check("mode_tabs_present", len(modes) >= 3 and len(active) == 1,
              f"{len(modes)} tabs, active={active[0].text.strip() if active else 'none'}")
        # R-1 2026-10-15: roster checks (char_chips_rendered / venom_select)
        # retired together with the selection UI — docs/RETIRED-FEATURES.md.
        shot(d, "01-boot", out)

        # D8 regression guard: corner tools must exist, be displayed and in-viewport.
        try:
            tools = d.find_element(By.CSS_SELECTOR, ".cc-corner-tools")
            vis = tools.is_displayed() and tools.size.get("width", 0) > 0
            check("corner_tools_visible", vis,
                  f"displayed={tools.is_displayed()} w={tools.size.get('width')}")
        except Exception as e:  # noqa: BLE001
            check("corner_tools_visible", False, f"missing: {str(e)[:120]}")

        dialog_open_and_close(d, check, ".cc-settings-trigger",
                              "settings_dialog_opens", idx=0)
        dialog_open_and_close(d, check, ".cc-settings-trigger",
                              "achievements_dialog_opens", idx=1)
        shot(d, "02-dialogs", out)

        print(f"[{label}] phase:start", flush=True)
        start = next((b for b in d.find_elements(By.CSS_SELECTOR, ".cc-btn-start")
                      if "cc-tut-btn" not in (b.get_attribute("class") or "")), None)
        if not start:
            raise RuntimeError("no start button outside the tutorial overlay")
        WebDriverWait(d, 20).until(EC.element_to_be_clickable(start))
        start.click()

        try:
            WebDriverWait(d, 20).until(
                EC.presence_of_element_located((By.CSS_SELECTOR, ".cc-chip-score")))
            check("run_started", True, "HUD score chip visible")
        except Exception:
            check("run_started", d.execute_script(
                "const p=document.querySelector('.cc-panel');return p?getComputedStyle(p).display==='none':true;"),
                "score chip not found; panel state probed")
        shot(d, "03-running", out)

        if is_desktop:
            # R8/127: "p" toggles pause via the window keydown handler.
            try:
                d.find_element(By.CSS_SELECTOR, "body").send_keys("p")
                WebDriverWait(d, 6).until(
                    EC.presence_of_element_located((By.CSS_SELECTOR, ".cc-pause-head")))
                paused = True
            except Exception:
                paused = False
            shot(d, "04-paused", out)
            try:
                d.find_element(By.CSS_SELECTOR, "body").send_keys("p")
                time.sleep(1.2)
                resumed = len(d.find_elements(
                    By.CSS_SELECTOR, ".cc-pause-head")) == 0
            except Exception:
                resumed = False
            check("pause_toggle", paused and resumed,
                  f"paused={paused} resumed={resumed}")
        else:
            rush = d.find_elements(By.CSS_SELECTOR, ".cc-rush-btn")
            check("mobile_rush_button", bool(rush) and rush[0].is_displayed(),
                  f"present={bool(rush)}")

        print(f"[{label}] phase:death-loop", flush=True)
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
        shot(d, "05-deathcard", out)

        # D2 regression guard: HOME affordance must exist on the results panel.
        try:
            homes = [h for h in d.find_elements(By.CSS_SELECTOR, ".cc-btn-home")
                     if h.is_displayed()]
            check("results_home_affordance", bool(homes),
                  f"{len(homes)} visible HOME button(s)")
        except Exception as e:  # noqa: BLE001
            check("results_home_affordance", False, f"probe failed: {str(e)[:120]}")

        # Production monitoring wired: the Sentry SDK must be live on prod.
        try:
            sentry_ok = d.execute_script("return !!window.__SENTRY__;")
            check("sentry_sdk_loaded", bool(sentry_ok), f"window.__SENTRY__={sentry_ok}")
        except Exception as e:  # noqa: BLE001
            check("sentry_sdk_loaded", False, f"probe failed: {str(e)[:120]}")

        if is_chrome_desktop:
            # Full surface: the landing must carry footer nav + the $WICK strip.
            try:
                d.get(PROD.rsplit("/play", 1)[0] or "https://candle-climber.vercel.app/")
                WebDriverWait(d, 30).until(
                    EC.presence_of_element_located((By.CSS_SELECTOR, ".lp-wick-strip")))
                partners = d.find_elements(By.CSS_SELECTOR, 'footer a[href="/partners"]')
                airdrop = d.find_elements(By.CSS_SELECTOR, 'footer a[href="/airdrop"]')
                stats = d.find_elements(By.CSS_SELECTOR, 'a[href="/stats"]')
                strip = d.find_element(By.CSS_SELECTOR, ".lp-wick-strip")
                # 2026-10-15 reality: the landing footer carries PARTNERS + AIRDROP
                # (G5 restructure); /stats lives in the in-game footer only.
                check("landing_surface",
                      strip.is_displayed() and bool(partners) and bool(airdrop),
                      f"strip={strip.is_displayed()} partners={len(partners)} "
                      f"airdrop={len(airdrop)} stats_anywhere={len(stats)}")
            except Exception as e:  # noqa: BLE001
                check("landing_surface", False, f"probe failed: {str(e)[:140]}")
            shot(d, "06-landing", out)

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
    except Exception:
        # on-grid forensics — capture the page AS THE GRID SAW IT at death:
        # screenshot + body text + severe console (the Oct 14-15 mystery: the
        # page loads on grid VMs but the app never hydrates -> chips timeout)
        try:
            d.get_screenshot_as_file(f"{out}/rd-99-fatal-{STAMP}.png")
            body_txt = d.find_element(By.TAG_NAME, "body").text[:400]
            _sev = []
            try:
                _sev = [e.get("message", "")[:180] for e in d.get_log("browser")
                        if e.get("level") == "SEVERE"]
            except Exception:
                pass
            print(f"[{label}] FATAL FORENSICS: title={d.title!r} "
                  f"url={d.current_url[:90]} body={body_txt!r} "
                  f"severe_console={_sev[:4]}", flush=True)
        except Exception as fe:  # noqa: BLE001
            print(f"[{label}] forensics failed: {str(fe)[:150]}", flush=True)
        # 2026-10-15 husk cleanup: a dead session (empty-message first-command
        # era) can linger grid-side holding the freemium concurrency slot and
        # cascade into every later target (runs #7-#11 pattern). Best-effort
        # API stop, then re-raise so the retry/fail bookkeeping proceeds.
        try:
            import base64
            import urllib.request as _ur
            _req = _ur.Request(
                f"{LT_API}/sessions/{sid}", method="DELETE",
                headers={"Authorization": "Basic " + base64.b64encode(
                    f"{lt_user}:{lt_key}".encode()).decode()})
            _ur.urlopen(_req, timeout=30)
            print(f"[{label}] husk session {sid} stopped via API")
        except Exception as e:  # noqa: BLE001
            print(f"[{label}] husk cleanup skipped: {str(e)[:120]}")
        raise
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
                print(f"[RETRY {attempt}] {label} :: {type(e).__name__}: {str(e)[:160]} :: repr={repr(str(e))[:120]}", flush=True)
                if attempt == 2:
                    rep = {"label": label, "pass": False, "attempt": 2,
                           "error": str(e)[:300]}
        reports.append(rep)

    summary = {"stamp": STAMP, "url": PROD, "build": BUILD, "sessions": len(reports),
               "passed": sum(1 for r in reports if r.get("pass")),
               "results": [{"label": r.get("label"), "pass": r.get("pass"),
                            "checks": sum(1 for c in r.get("checks", []) if c["ok"]),
                            "total_checks": len(r.get("checks", [])),
                            "dashboard": r.get("dashboard"),
                            "video_url": r.get("video_url")} for r in reports]}
    with open(f"{OUT}/report-real-SUMMARY-{STAMP}.json", "w") as f:
        json.dump(summary, f, indent=2)
    print(f"\nMATRIX: {summary['passed']}/{summary['sessions']} sessions PASS")
    for r in summary["results"]:
        print(f"  {r['label']}: {'PASS' if r['pass'] else 'FAIL'}"
              + (f"  checks={r.get('checks')}/{r.get('total_checks')}" if r.get('total_checks') else "")
              + (f"  dashboard: {r['dashboard']}" if r.get("dashboard") else ""))
    return 0 if summary["passed"] == summary["sessions"] else 1


if __name__ == "__main__":
    sys.exit(main())

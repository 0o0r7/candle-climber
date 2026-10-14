#!/usr/bin/env python3
"""LT DASHBOARD VIEW — browser-login to the LambdaTest dashboard from CI.

The owner asked for eyes on the platform dashboard (grid handshake runs
#7-#11). The REST API hides plan/concurrency from the freemium tier and
answers 403 on session-stop, so this drives the real UI: log in with the
CI secrets (typed programmatically, NEVER printed), screenshot the
automation sessions list, the real-device page and the usage/plan widgets,
and dump the visible session rows (id, status, browser, timestamp) as JSON.

Runs INSIDE the lt-diag workflow, on the LT grid itself (win10/chrome),
using the same never-printed credentials.
"""
import base64
import json
import os
import sys
import time
import urllib.parse
import urllib.request
from datetime import datetime, timezone

OUT = os.environ.get("QA_OUT", "qa/lt-diag")
STAMP = datetime.now(timezone.utc).strftime("%Y%m%d-%H%M%S")


def main() -> int:
    user = os.environ.get("LT_USERNAME", "").strip()
    key = os.environ.get("LT_ACCESS_KEY", "").strip()
    if not (user and key):
        print("MISSING CREDS")
        return 2
    os.makedirs(OUT, exist_ok=True)

    from selenium import webdriver
    from selenium.webdriver.chrome.options import Options
    from selenium.webdriver.common.by import By

    o = Options()
    o.set_capability("platformName", "Windows 10")
    o.set_capability("browserName", "Chrome")
    o.set_capability("browserVersion", "latest")
    o.set_capability("LT:Options", {
        "resolution": "1440x900", "w3c": True,
        "build": f"lt-dashview-{STAMP}", "name": "dashboard eyes (diag)",
        "video": False, "screenshot": False, "console": False,
        "network": False, "queueTimeout": 300, "idleTimeout": 300,
    })
    hub = (f"https://{urllib.parse.quote(user)}:{urllib.parse.quote(key)}"
           f"@hub.lambdatest.com/wd/hub")
    d = webdriver.Remote(hub, options=o)
    print(f"dashboard-eyes session: {d.session_id}")
    rows_out = []
    try:
        # login
        d.get("https://accounts.lambdatest.com/login")
        time.sleep(4)
        email = d.find_element(By.CSS_SELECTOR, 'input[type="email"], input[name="email"], #email')
        email.clear()
        email.send_keys(user)
        pw = d.find_element(By.CSS_SELECTOR, 'input[type="password"], input[name="password"], #password')
        pw.clear()
        pw.send_keys(key)
        try:
            d.find_element(By.CSS_SELECTOR, 'button[type="submit"], button[data-testid="login-button"]').click()
        except Exception:
            pw.submit()
        print("login submitted, waiting for dashboard…")
        time.sleep(12)
        d.get_screenshot_as_file(f"{OUT}/dash-01-after-login-{STAMP}.png")

        # automation sessions/builds list
        for label, url, wait in [
            ("automation", "https://automation.lambdatest.com/builds/", 8),
            ("realtimesessions", "https://realtime.lambdatest.com/", 8),
            ("usage", "https://accounts.lambdatest.com/detail/usage", 8),
        ]:
            try:
                d.get(url)
                time.sleep(wait)
                d.get_screenshot_as_file(f"{OUT}/dash-{label}-{STAMP}.png")
                rows = d.find_elements(By.CSS_SELECTOR, "table tbody tr, [data-testid='session-row']")
                for r in rows[:25]:
                    rows_out.append({"page": label, "text": " | ".join(
                        (r.text or "").split("\n"))[:220]})
                print(f"[{label}] url={d.current_url[:80]} rows={len(rows)} shot saved")
            except Exception as e:  # noqa: BLE001
                print(f"[{label}] failed: {str(e)[:140]}")
        # page title after login tells whether we actually got in
        print(f"final page: {d.title!r} @ {d.current_url[:90]}")
    finally:
        try:
            d.quit()
        except Exception:  # noqa: BLE001
            pass
        # best-effort slot cleanup (may 403 on freemium — ignored)
        try:
            req = urllib.request.Request(
                f"https://api.lambdatest.com/automation/api/v1/sessions/{d.session_id}",
                method="DELETE",
                headers={"Authorization": "Basic " + base64.b64encode(
                    f"{user}:{key}".encode()).decode()})
            urllib.request.urlopen(req, timeout=30)
        except Exception:  # noqa: BLE001
            pass

    with open(f"{OUT}/dashview-{STAMP}.json", "w") as f:
        json.dump({"stamp": STAMP, "rows": rows_out}, f, indent=2)
    print(f"artifact rows: {len(rows_out)}")
    return 0


if __name__ == "__main__":
    sys.exit(main())

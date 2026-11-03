#!/usr/bin/env python3
"""LT account-identity probe (sanitized): which account do the CI creds belong to?
Prints HTTP status + clipped bodies of candidate user/plan endpoints.
Credentials are never printed; the account EMAIL is the payload we need
(owner's own data, needed to verify the student-pack entitlement)."""
import base64, json, os, urllib.request, urllib.error

LT_USER = os.environ["LT_USERNAME"].strip()
LT_KEY = os.environ["LT_ACCESS_KEY"].strip()
basic = base64.b64encode(f"{LT_USER}:{LT_KEY}".encode()).decode()

ENDPOINTS = [
    "https://api.lambdatest.com/api/v1/user",
    "https://api.lambdatest.com/automation/api/v1/user",
    "https://api.lambdatest.com/api/v1/user/settings",
    "https://api.lambdatest.com/api/v1/plan",
    "https://api.lambdatest.com/api/v1/plan_detail",
    "https://accounts.lambdatest.com/api/v1/user",
    "https://api.lambdatest.com/api/v1/organization",
]

def probe(url):
    r = urllib.request.Request(url)
    r.add_header("Authorization", f"Basic {basic}")
    r.add_header("Accept", "application/json")
    r.add_header("User-Agent", "cc-lt-probe/1.0")
    try:
        with urllib.request.urlopen(r, timeout=20) as resp:
            return resp.status, resp.read(1200).decode("utf-8", "replace")
    except urllib.error.HTTPError as e:
        return e.code, e.read(600).decode("utf-8", "replace")
    except Exception as e:
        return -1, str(e)[:150]

for url in ENDPOINTS:
    code, body = probe(url)
    print(f"== {code} {url}")
    if code == 200:
        try:
            j = json.loads(body)
            print(json.dumps(j, indent=1)[:900])
        except ValueError:
            print(body[:400])
    else:
        print(body[:200])
    print()

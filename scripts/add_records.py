#!/usr/bin/env python3
"""Manually add settled records to Gist history."""
import os
import json
import requests

GH_TOKEN  = os.environ["GH_TOKEN"]
GIST_DESC = "mlb_bot_history"
HEADERS   = {"Authorization": "token " + GH_TOKEN, "Content-Type": "application/json"}

NEW_RECORDS = [
    {
        "date":     "2026-07-04",
        "team":     "UNDER",
        "home":     "angels",
        "away":     "redsox",
        "price":    1.92,
        "stake":    50.0,
        "edge":     round(0.188, 4),
        "conf":     round(0.82,  3),
        "dv_p":     round(1/1.92 / (1/1.92 + 1/1.87), 4),
        "bet_type": "大小分",
        "result":   "W",
        "label":    "UNDER",
        "market_total": 8.0,
        "sp_src":   "manual",
    },
    {
        "date":     "2026-07-04",
        "team":     "whitesox",
        "home":     "guardians",
        "away":     "whitesox",
        "price":    1.59,
        "stake":    50.0,
        "edge":     round(0.144, 4),
        "conf":     round(0.73,  3),
        "dv_p":     round(1/1.59 / (1/1.59 + 1/1.55), 4),
        "bet_type": "讓分",
        "result":   "W",
        "label":    "白襪(+1.5)",
        "market_total": None,
        "sp_src":   "manual",
    },
]

r = requests.get("https://api.github.com/gists", headers=HEADERS, timeout=15)
r.raise_for_status()
gid = next((g["id"] for g in r.json() if g.get("description") == GIST_DESC), None)
if not gid:
    raise SystemExit("Gist not found")

detail = requests.get("https://api.github.com/gists/" + gid, headers=HEADERS, timeout=15).json()
raw = list(detail["files"].values())[0]["content"]
hist = json.loads(raw)
print(f"Loaded {len(hist)} existing records")

added = 0
for rec in NEW_RECORDS:
    key = (rec["home"], rec["away"], rec["date"], rec["bet_type"])
    if any((h.get("home"), h.get("away"), h.get("date"), h.get("bet_type")) == key for h in hist):
        print(f"  SKIP (already exists): {key}")
    else:
        hist.append(rec)
        added += 1
        print(f"  ADDED: {rec['away']} vs {rec['home']} {rec['bet_type']} {rec['result']}")

if added == 0:
    print("Nothing to add.")
else:
    body = {"files": {"history.json": {"content": json.dumps(hist, ensure_ascii=False, indent=2)}}}
    requests.patch("https://api.github.com/gists/" + gid, headers=HEADERS, json=body, timeout=15).raise_for_status()
    print(f"Saved {len(hist)} records ({added} new) to Gist.")

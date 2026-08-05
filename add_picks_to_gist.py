#!/usr/bin/env python3
"""一次性腳本：手動把指定比賽加進 Gist 歷史記錄"""
import json, os, requests

GH_TOKEN  = os.getenv("GH_TOKEN", "")
GIST_DESC = "mlb_bot_history"

PICKS_TO_ADD = [
    {
        "date":         "2026-06-02",
        "team":         "brewers",
        "home":         "brewers",
        "away":         "giants",
        "price":        1.70,
        "stake":        50.0,
        "edge":         0.152,
        "conf":         0.85,
        "bet_type":     "獨贏",
        "result":       None,
        "label":        "",
        "market_total": 7.0,
    },
    {
        "date":         "2026-06-02",
        "team":         "diamondbacks",
        "home":         "diamondbacks",
        "away":         "dodgers",
        "price":        1.87,
        "stake":        50.0,
        "edge":         0.173,
        "conf":         0.74,
        "bet_type":     "讓分",
        "result":       None,
        "label":        "+1.5",
        "market_total": 9.0,
    },
]

def gh_h():
    return {"Authorization": "token " + GH_TOKEN, "Content-Type": "application/json"}

def find_gid(gists):
    old = {"mlb_bot_v107_history","mlb_bot_v108_history","mlb_bot_v109_history"}
    new_id = old_id = None
    for g in gists:
        d = g.get("description","")
        if d == GIST_DESC: new_id = g["id"]
        elif d in old and not old_id: old_id = g["id"]
    return new_id or old_id

def main():
    if not GH_TOKEN:
        print("ERROR: GH_TOKEN not set"); return

    r = requests.get("https://api.github.com/gists", headers=gh_h(), timeout=15)
    r.raise_for_status()
    gid = find_gid(r.json())
    if not gid:
        print("ERROR: Gist not found"); return

    detail  = requests.get("https://api.github.com/gists/" + gid, headers=gh_h(), timeout=15).json()
    raw_url = list(detail["files"].values())[0]["raw_url"]
    records = requests.get(raw_url, timeout=15).json()
    print(f"Loaded {len(records)} existing records")

    added = 0
    for pick in PICKS_TO_ADD:
        rk = (pick["home"], pick["away"], pick["date"])
        if any((r.get("home"), r.get("away"), r.get("date")) == rk for r in records):
            print(f"Skip (already exists): {pick['away']}@{pick['home']} {pick['date']}")
        else:
            records.append(pick)
            added += 1
            print(f"Added: {pick['away']}@{pick['home']} {pick['date']} {pick['bet_type']} {pick['label']}")

    if added == 0:
        print("Nothing to add."); return

    body = json.dumps(records, ensure_ascii=False, indent=2)
    pl   = {"description": GIST_DESC, "public": False,
            "files": {"history.json": {"content": body}}}
    requests.patch("https://api.github.com/gists/" + gid, headers=gh_h(), json=pl, timeout=10).raise_for_status()
    print(f"Saved. Total records: {len(records)}")

if __name__ == "__main__":
    main()

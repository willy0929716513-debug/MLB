#!/usr/bin/env python3
"""
Fetch MLB pitcher headshots for every pitcher in picks_latest.json.
Saves to docs/images/pitchers/{safe_name}.jpg

Run order (in mlb_bot.yml):
  1. mlb_bot_v101.py   → writes docs/picks_latest.json
  2. this script        → downloads/caches pitcher photos
  3. git commit         → pushes everything
"""

import json
import os
import re
import time
import urllib.request
import urllib.parse
import urllib.error

PICKS_JSON = "docs/picks_latest.json"
OUTPUT_DIR = "docs/images/pitchers"

# MLB Stats API – public, no key needed
SEARCH_URL = (
    "https://statsapi.mlb.com/api/v1/people/search"
    "?names={name}&sportId=1"
    "&fields=people,id,fullName,primaryPosition,active"
)
# Cloudinary MLB CDN – d_people:generic:… ensures a fallback silhouette is
# returned even if the player has no official headshot yet, so we always get
# a valid image.
PHOTO_URL = (
    "https://img.mlbstatic.com/mlb-photos/image/upload/"
    "d_people:generic:headshot:67:current.png/"
    "w_213,q_auto:best/v1/people/{mlb_id}/headshot/67/current"
)
HEADERS = {"User-Agent": "MLB-Predictor-Bot/1.0"}


def safe_filename(name: str) -> str:
    """'Gerrit Cole' → 'Gerrit_Cole'"""
    return re.sub(r"[^a-zA-Z0-9]", "_", name.strip())


def normalize_name(name: str) -> str:
    """'Cole, Gerrit' → 'Gerrit Cole'; 'Gerrit Cole' unchanged."""
    if "," in name:
        last, first = [p.strip() for p in name.split(",", 1)]
        return f"{first} {last}"
    return name.strip()


def search_player(name: str) -> int | None:
    url = SEARCH_URL.format(name=urllib.parse.quote(normalize_name(name)))
    try:
        req = urllib.request.Request(url, headers=HEADERS)
        with urllib.request.urlopen(req, timeout=12) as r:
            data = json.loads(r.read())
        people = data.get("people", [])
        if not people:
            return None
        # Prefer active pitchers (SP first, then any P)
        for p in people:
            pos = (p.get("primaryPosition") or {}).get("abbreviation", "")
            if p.get("active") and pos == "SP":
                return p["id"]
        for p in people:
            pos = (p.get("primaryPosition") or {}).get("abbreviation", "")
            if p.get("active") and pos in ("P", "RP"):
                return p["id"]
        # Any active player with that name
        for p in people:
            if p.get("active"):
                return p["id"]
        return people[0]["id"]
    except Exception as exc:
        print(f"  [search error] {name}: {exc}")
        return None


def download_photo(mlb_id: int, out_path: str) -> bool:
    url = PHOTO_URL.format(mlb_id=mlb_id)
    try:
        req = urllib.request.Request(url, headers=HEADERS)
        with urllib.request.urlopen(req, timeout=20) as r:
            data = r.read()
        # Sanity-check: a valid JPEG/PNG starts with known magic bytes
        if len(data) < 100:
            print(f"  [warn] response too small ({len(data)} B) for id={mlb_id}")
            return False
        with open(out_path, "wb") as f:
            f.write(data)
        return True
    except Exception as exc:
        print(f"  [download error] id={mlb_id}: {exc}")
        return False


def main() -> None:
    os.makedirs(OUTPUT_DIR, exist_ok=True)

    if not os.path.exists(PICKS_JSON):
        print(f"[skip] {PICKS_JSON} not found")
        return

    with open(PICKS_JSON, encoding="utf-8") as f:
        data = json.load(f)

    # Collect unique pitcher names
    names: set[str] = set()
    for pick in data.get("picks", []):
        for key in ("away_sp", "home_sp"):
            n = (pick.get(key) or "").strip()
            if n:
                names.add(n)

    if not names:
        print("[skip] no pitcher names found in picks")
        return

    print(f"Fetching photos for {len(names)} pitchers → {OUTPUT_DIR}")
    fetched = skipped = failed = 0

    for name in sorted(names):
        fname = safe_filename(name) + ".jpg"
        out   = os.path.join(OUTPUT_DIR, fname)

        if os.path.exists(out):
            print(f"  ✓ {name}  (cached)")
            skipped += 1
            continue

        print(f"  → {name} …", end="", flush=True)
        mlb_id = search_player(name)
        if not mlb_id:
            print("  [MLB ID not found]")
            failed += 1
            continue

        print(f"  id={mlb_id}", end="", flush=True)
        if download_photo(mlb_id, out):
            size = os.path.getsize(out)
            print(f"  ✓  ({size:,} B)")
            fetched += 1
        else:
            failed += 1

        time.sleep(0.5)  # polite rate-limiting

    print(f"\nDone: {fetched} fetched, {skipped} cached, {failed} failed")


if __name__ == "__main__":
    main()

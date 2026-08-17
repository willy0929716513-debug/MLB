#!/usr/bin/env python3
"""唯讀診斷工具：印出 mlb_bot_history 這個 Gist 裡 history.json 的實際內容，
不做任何修改、不寫回。用來排查 load_hist() 回報「JSON解析失敗」時，
Gist裡到底存了什麼東西。

用法：python scripts/inspect_gist.py（需要 GH_TOKEN 環境變數）。
"""
import json
import os

import requests

GH_TOKEN  = os.getenv("GH_TOKEN", "")
GIST_DESC = "mlb_bot_history"


def gh_h():
    return {"Authorization": "token " + GH_TOKEN, "Content-Type": "application/json"}


def find_gid(gists):
    old = {"mlb_bot_v107_history", "mlb_bot_v108_history", "mlb_bot_v109_history"}
    new_id = old_id = None
    for g in gists:
        d = g.get("description", "")
        if d == GIST_DESC:
            new_id = g["id"]
        elif d in old and not old_id:
            old_id = g["id"]
    return new_id or old_id


def main():
    if not GH_TOKEN:
        print("ERROR: GH_TOKEN not set")
        return

    r = requests.get("https://api.github.com/gists", headers=gh_h(), timeout=15)
    r.raise_for_status()
    gists = r.json()
    print(f"Total gists visible to this token: {len(gists)}")
    for g in gists:
        print(f"  id={g.get('id')} desc={g.get('description')!r} "
              f"files={list(g.get('files', {}).keys())} updated={g.get('updated_at')}")

    gid = find_gid(gists)
    if not gid:
        print(f"ERROR: no gist found with description={GIST_DESC!r} (or legacy names)")
        return
    print(f"\nUsing gist id={gid}")

    detail = requests.get("https://api.github.com/gists/" + gid, headers=gh_h(), timeout=15).json()
    files = detail.get("files", {})
    print(f"Files in this gist: {list(files.keys())}")
    for fname, finfo in files.items():
        print(f"  {fname}: size={finfo.get('size')} truncated={finfo.get('truncated')} "
              f"raw_url={finfo.get('raw_url')}")

    if not files:
        print("ERROR: gist has no files at all")
        return

    fname, finfo = next(iter(files.items()))
    print(f"\nReading first file: {fname!r}")
    raw_text = requests.get(finfo["raw_url"], timeout=15).text
    print(f"Raw content length: {len(raw_text)} chars")
    print(f"First 300 chars: {raw_text[:300]!r}")
    print(f"Last 300 chars:  {raw_text[-300:]!r}")

    try:
        data = json.loads(raw_text)
        print(f"\nJSON parses OK. Type={type(data).__name__}, "
              f"len={len(data) if hasattr(data,'__len__') else 'n/a'}")
    except json.JSONDecodeError as e:
        print(f"\nJSON DOES NOT PARSE: {e.msg} at line {e.lineno} col {e.colno} (char {e.pos})")
        snippet = raw_text[max(0, e.pos - 100):e.pos + 100]
        print(f"Context around error: ...{snippet!r}...")


if __name__ == "__main__":
    main()

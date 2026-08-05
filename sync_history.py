#!/usr/bin/env python3
"""從 Gist 讀取歷史 → 結算待結算比賽 → 更新 picks_latest.json"""
import json, os, re, requests, datetime

GH_TOKEN  = os.getenv("GH_TOKEN", "")
GIST_DESC = "mlb_bot_history"
JSON_PATH = "docs/picks_latest.json"

CN = {
    "dodgers":"道奇","yankees":"洋基","mets":"大都會","braves":"勇士",
    "phillies":"費城人","mariners":"水手","brewers":"釀酒人","pirates":"海盜",
    "blue jays":"藍鳥","tigers":"老虎","red sox":"紅襪","astros":"太空人",
    "rangers":"遊騎兵","cubs":"小熊","orioles":"金鶯","royals":"皇家",
    "rays":"光芒","diamondbacks":"響尾蛇","reds":"紅人","padres":"教士",
    "guardians":"守護者","marlins":"馬林魚","giants":"巨人","twins":"雙城",
    "athletics":"運動家","cardinals":"紅雀","angels":"天使","white sox":"白襪",
    "nationals":"國民","rockies":"落磯",
}

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

def _tkey(name):
    return re.sub(r'[^a-z]', '', (name or "").lower())

def _team_match(n1, n2):
    k1, k2 = _tkey(n1), _tkey(n2)
    if not k1 or not k2: return False
    return k1 == k2 or k1 in k2 or k2 in k1

def settle(hist):
    today = datetime.date.today().isoformat()
    pending = [r for r in hist if r.get("result") is None and r.get("date","") <= today]
    print(f"Pending records to settle: {len(pending)}")
    if not pending:
        return 0

    by_date = {}
    for r in pending:
        by_date.setdefault(r["date"], []).append(r)

    updated = 0
    for date_str, records in sorted(by_date.items()):
        try:
            prev_day = (datetime.date.fromisoformat(date_str) - datetime.timedelta(days=1)).isoformat()
        except Exception:
            prev_day = None
        dates_to_try = [date_str] + ([prev_day] if prev_day else [])

        score_map = {}
        for try_date in dates_to_try:
            data = requests.get(
                "https://statsapi.mlb.com/api/v1/schedule",
                params={"sportId": 1, "date": try_date},
                timeout=10,
            ).json()
            for d in data.get("dates", []):
                for g in d.get("games", []):
                    if "Final" not in g.get("status", {}).get("detailedState", ""):
                        continue
                    hd = g.get("teams",{}).get("home",{}); ad = g.get("teams",{}).get("away",{})
                    hs = hd.get("score"); as_ = ad.get("score")
                    if hs is None or as_ is None: continue
                    hk = _tkey(hd.get("team",{}).get("name",""))
                    ak = _tkey(ad.get("team",{}).get("name",""))
                    if (hk, ak) not in score_map:
                        score_map[(hk, ak)] = (int(hs), int(as_))

        print(f"  {date_str}: {len(score_map)} final games found")

        for r in records:
            r_hk = _tkey(r.get("home",""))
            r_ak = _tkey(r.get("away",""))
            scores = None
            for (hk, ak), sc in score_map.items():
                if _team_match(r_hk, hk) and _team_match(r_ak, ak):
                    scores = sc; break
            if scores is None:
                print(f"  No score found: {r.get('away')}@{r.get('home')}"); continue

            h_score, a_score = scores
            btype = r.get("bet_type","")
            team  = r.get("team","")
            label = r.get("label","") or ""
            team_is_home = _team_match(_tkey(team), r_hk)

            try:
                if btype == "獨贏":
                    win = (h_score > a_score) if team_is_home else (a_score > h_score)
                elif btype == "讓分":
                    spread = float(label)
                    win = (h_score + spread > a_score) if team_is_home else (a_score + spread > h_score)
                elif btype == "大小分":
                    mkt = r.get("market_total")
                    if mkt is None: continue
                    total = h_score + a_score
                    if total == mkt:
                        r["result"] = "P"; updated += 1
                        print(f"  PUSH: {r.get('away')}@{r.get('home')} {total}={mkt}")
                        continue
                    win = (total > mkt) if label == "OVER" else (total < mkt)
                else:
                    continue
                r["result"] = "W" if win else "L"
                updated += 1
                print(f"  {'WIN' if win else 'LOSS'}: {r.get('away')}@{r.get('home')} {a_score}:{h_score} {btype} {label}")
            except Exception as e:
                print(f"  Error settling {r.get('away')}@{r.get('home')}: {e}")

    return updated

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
    hist    = requests.get(raw_url, timeout=15).json()
    print(f"Loaded {len(hist)} records from Gist")

    n = settle(hist)
    print(f"Settled {n} records")

    if n > 0:
        body = json.dumps(hist, ensure_ascii=False, indent=2)
        pl   = {"description": GIST_DESC, "public": False, "files": {"history.json": {"content": body}}}
        requests.patch("https://api.github.com/gists/" + gid, headers=gh_h(), json=pl, timeout=10).raise_for_status()
        print("Gist updated")

    # 統計
    settled_list = [r for r in hist if r.get("result") in ("W","L")]
    wins     = sum(1 for r in settled_list if r["result"] == "W")
    wr       = round(wins / len(settled_list) * 100, 1) if settled_list else 0.0
    total_in = sum(r.get("stake",0) for r in settled_list)
    total_pnl= sum(
        r.get("stake",0)*(r.get("price",2)-1) if r["result"]=="W" else -r.get("stake",0)
        for r in settled_list
    )
    roi = round(total_pnl / total_in * 100, 1) if total_in else 0.0

    by_type = {}
    for btlabel, btkey in [("ML","獨贏"),("RL","讓分"),("TOT","大小分")]:
        rs = [r for r in settled_list if r.get("bet_type") == btkey]
        w  = sum(1 for r in rs if r["result"] == "W")
        _in  = sum(r.get("stake",0) for r in rs)
        _pnl = sum(r.get("stake",0)*(r.get("price",2)-1) if r["result"]=="W" else -r.get("stake",0) for r in rs)
        by_type[btlabel] = {
            "settled": len(rs), "wins": w,
            "win_rate": round(w/len(rs)*100,1) if rs else 0.0,
            "roi": round(_pnl/_in*100,1) if _in else 0.0,
        }

    hist_sorted = sorted(
        [r for r in hist if r.get("date")],
        key=lambda r: (r.get("date",""), r.get("bet_type","")),
        reverse=True
    )[:10]
    recent_history = []
    for r in hist_sorted:
        _h = r.get("home",""); _a = r.get("away","")
        recent_history.append({
            "date":     r.get("date",""),
            "home":     _h, "away": _a,
            "home_cn":  CN.get(_h, _h.title()),
            "away_cn":  CN.get(_a, _a.title()),
            "bet_type": r.get("bet_type",""),
            "label":    r.get("label",""),
            "price":    r.get("price"),
            "stake":    r.get("stake"),
            "edge":     round(r.get("edge",0)*100, 1),
            "result":   r.get("result"),
        })

    with open(JSON_PATH, encoding="utf-8") as f:
        data = json.load(f)

    data["recent_history"] = recent_history
    data["stats"] = {
        "settled": len(settled_list), "wins": wins,
        "win_rate": wr,
        "total_in": round(total_in,1), "total_pnl": round(total_pnl,1), "roi": roi,
        "by_type": by_type,
    }

    with open(JSON_PATH, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

    print(f"Done: {len(settled_list)} settled ({wins}W), ROI {roi}%")

if __name__ == "__main__":
    main()

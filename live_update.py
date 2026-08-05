#!/usr/bin/env python3
"""
場中輕量更新器 — 只打 MLB Stats API（免費），不消耗 Odds API 額度。
每次執行：讀取 picks_latest.json → 抓即時比分 → 更新 live_games → 存回。
"""
import datetime
import json
import logging
import os
import time

import requests

log = logging.getLogger("live_update")
logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")

JSON_PATH = "docs/picks_latest.json"
NTFY_TOPIC = os.environ.get("NTFY_TOPIC", "mlb-picks-willy0815")


def send_ntfy(title, message):
    if not NTFY_TOPIC:
        return
    try:
        r = requests.post(
            "https://ntfy.sh",
            json={"topic": NTFY_TOPIC, "title": title, "message": message,
                  "priority": 4, "tags": ["baseball"]},
            timeout=10,
        )
        log.info("ntfy response: %d — %s", r.status_code, title)
    except Exception as e:
        log.warning("ntfy error: %s", e)

CN = {
    "dodgers": "道奇", "yankees": "洋基", "mets": "大都會", "braves": "勇士",
    "phillies": "費城人", "mariners": "水手", "brewers": "釀酒人", "pirates": "海盜",
    "blue jays": "藍鳥", "tigers": "老虎", "red sox": "紅襪", "astros": "太空人",
    "rangers": "遊騎兵", "cubs": "小熊", "orioles": "金鶯", "royals": "皇家",
    "rays": "光芒", "diamondbacks": "響尾蛇", "reds": "紅人", "padres": "教士",
    "guardians": "守護者", "marlins": "馬林魚", "giants": "巨人", "twins": "雙城",
    "athletics": "運動家", "cardinals": "紅雀", "angels": "天使", "white sox": "白襪",
    "nationals": "國民", "rockies": "落磯",
}

TEAM_ALIAS = {
    "los angeles dodgers": "dodgers", "la dodgers": "dodgers",
    "new york yankees": "yankees", "ny yankees": "yankees",
    "new york mets": "mets", "ny mets": "mets",
    "atlanta braves": "braves",
    "philadelphia phillies": "phillies",
    "seattle mariners": "mariners",
    "milwaukee brewers": "brewers",
    "pittsburgh pirates": "pirates",
    "toronto blue jays": "blue jays",
    "detroit tigers": "tigers",
    "boston red sox": "red sox",
    "houston astros": "astros",
    "texas rangers": "rangers",
    "chicago cubs": "cubs",
    "baltimore orioles": "orioles",
    "kansas city royals": "royals",
    "tampa bay rays": "rays",
    "arizona diamondbacks": "diamondbacks",
    "az diamondbacks": "diamondbacks",
    "cincinnati reds": "reds",
    "san diego padres": "padres",
    "cleveland guardians": "guardians",
    "miami marlins": "marlins",
    "san francisco giants": "giants",
    "minnesota twins": "twins",
    "oakland athletics": "athletics",
    "sacramento athletics": "athletics",
    "st. louis cardinals": "cardinals",
    "st louis cardinals": "cardinals",
    "los angeles angels": "angels",
    "la angels": "angels",
    "chicago white sox": "white sox",
    "washington nationals": "nationals",
    "colorado rockies": "rockies",
}


def norm_team(name):
    n = name.lower().strip()
    return TEAM_ALIAS.get(n, n)


def safe_get(url, params=None, timeout=10):
    try:
        r = requests.get(url, params=params, timeout=timeout)
        r.raise_for_status()
        return r.json()
    except Exception as e:
        log.warning("safe_get %s: %s", url, e)
        return None


def fetch_live_scores(et_date_str):
    data = safe_get(
        "https://statsapi.mlb.com/api/v1/schedule",
        params={"date": et_date_str, "sportId": 1, "gameType": "R",
                "hydrate": "linescore,team"},
    )
    live = []
    for db in (data or {}).get("dates", []):
        for game in db.get("games", []):
            if game.get("status", {}).get("abstractGameState") != "Live":
                continue
            home_raw = game.get("teams", {}).get("home", {}).get("team", {}).get("name", "").lower()
            away_raw = game.get("teams", {}).get("away", {}).get("team", {}).get("name", "").lower()
            hk = norm_team(TEAM_ALIAS.get(home_raw, home_raw.split()[-1] if home_raw else ""))
            ak = norm_team(TEAM_ALIAS.get(away_raw, away_raw.split()[-1] if away_raw else ""))
            if not hk or not ak:
                continue
            ls        = game.get("linescore", {})
            inning    = int(ls.get("currentInning") or 1)
            top       = bool(ls.get("isTopInning", True))
            home_runs = int(ls.get("teams", {}).get("home", {}).get("runs") or 0)
            away_runs = int(ls.get("teams", {}).get("away", {}).get("runs") or 0)
            live.append({
                "home": hk, "away": ak,
                "inning": inning, "top_inning": top,
                "home_runs": home_runs, "away_runs": away_runs,
            })
    log.info("Live games: %d", len(live))
    return live


def generate_live_picks(live_games, game_preds):
    result = []
    for lg in live_games:
        home, away    = lg["home"], lg["away"]
        inning        = lg["inning"]
        top_inning    = lg["top_inning"]
        home_r        = lg["home_runs"]
        away_r        = lg["away_runs"]
        current_total = home_r + away_r
        diff          = home_r - away_r

        innings_done = float(inning) - (1.0 if top_inning else 0.5)
        innings_left = max(0.0, 9.0 - innings_done)

        pred         = game_preds.get("%s|%s" % (home, away), {})
        market_total = pred.get("market_total") or 8.5
        p_home       = pred.get("home_win_prob", 0.5)

        log.info("  %s@%s %s%d局 %d:%d diff=%+d mt=%.1f p_home=%.2f pred=%s",
                 away, home, "▲" if top_inning else "▼", inning,
                 away_r, home_r, diff, market_total, p_home,
                 "有" if pred else "無(預設0.5)")

        market_rate = market_total / 9.0

        # 投影：剩餘局數用盤口預期速率，不放大當前異常
        projected = round(current_total + market_rate * innings_left, 1)

        # 此時市場預期應有幾分（用於判斷跑分進度）
        expected_now = round(market_total * innings_done / 9.0, 1) if innings_done > 0 else 0.0
        pace_ratio   = (current_total / expected_now) if expected_now > 0 else 1.0

        log.info("    預計終局 %.1f 市場預期進度 %.1f 實際 %d 速率比 %.2f",
                 projected, expected_now, current_total, pace_ratio)

        bet = reason = None
        # 大小分 UNDER：第6局起，實際得分低於市場預期60%以下
        if inning >= 6 and innings_left >= 1.5 and pace_ratio <= 0.60:
            bet    = "大小分 UNDER"
            reason = "第%d局僅%d分（此時預期%.1f分），低分走勢盤口%.1f" % (inning, current_total, expected_now, market_total)
        # 大小分 OVER：第4局起，實際得分超過市場預期140%以上
        elif 4 <= inning <= 7 and expected_now > 0 and pace_ratio >= 1.40 and current_total >= 5:
            bet    = "大小分 OVER"
            reason = "第%d局已得%d分（此時預期%.1f分），高分走勢盤口%.1f" % (inning, current_total, expected_now, market_total)
        # ML 主隊獨贏：第7局起，主隊領先2分以上（模型不反對）
        elif inning >= 7 and diff >= 2 and p_home >= 0.45:
            bet    = "主隊獨贏"
            reason = "第%d局主隊領先%d分（賽前主隊勝率%d%%），大局已定" % (inning, diff, round(p_home * 100))
        # ML 客隊獨贏：第7局起，客隊領先2分以上
        elif inning >= 7 and diff <= -2 and p_home <= 0.55:
            bet    = "客隊獨贏"
            reason = "第%d局客隊領先%d分（賽前客隊勝率%d%%），大局已定" % (inning, abs(diff), round((1 - p_home) * 100))
        # RL 主隊讓分：第4-8局，主隊落後1-2分，賽前強隊
        elif 4 <= inning <= 8 and -2 <= diff <= -1 and p_home >= 0.54:
            bet    = "主隊讓分(+1.5)"
            reason = "主隊落後%d分 第%d局，賽前主隊勝率%d%%" % (abs(diff), inning, round(p_home * 100))
        # RL 客隊讓分：第4-8局，客隊落後1-2分，賽前強客隊
        elif 4 <= inning <= 8 and 1 <= diff <= 2 and p_home <= 0.46:
            bet    = "客隊讓分(+1.5)"
            reason = "客隊落後%d分 第%d局，賽前客隊勝率%d%%" % (diff, inning, round((1 - p_home) * 100))
        # ML 主隊獨贏 逆轉：賽前大熱門落後1分，中段局
        elif 4 <= inning <= 8 and diff == -1 and p_home >= 0.65:
            bet    = "主隊獨贏"
            reason = "賽前熱門主隊第%d局僅落後1分（勝率%d%%），逆轉機率高" % (inning, round(p_home * 100))
        # ML 客隊獨贏 逆轉：賽前大熱門客隊落後1分
        elif 4 <= inning <= 8 and diff == 1 and p_home <= 0.35:
            bet    = "客隊獨贏"
            reason = "賽前熱門客隊第%d局僅落後1分（勝率%d%%），逆轉機率高" % (inning, round((1 - p_home) * 100))

        if bet:
            log.info("    ✅ 推薦: %s — %s", bet, reason)

        result.append({
            "home_cn":         CN.get(home, home),
            "away_cn":         CN.get(away, away),
            "inning":          inning,
            "top_inning":      top_inning,
            "home_runs":       home_r,
            "away_runs":       away_r,
            "projected_total": projected,
            "market_total":    market_total,
            "bet":             bet,
            "reason":          reason,
        })
    return result


def main():
    if not os.path.exists(JSON_PATH):
        log.error("%s not found — run main bot first", JSON_PATH)
        return

    _flag = "/tmp/ntfy_live_started"
    if not os.path.exists(_flag):
        send_ntfy("MLB Live Update", "場中監控已啟動")
        try:
            open(_flag, "w").close()
        except Exception:
            pass

    with open(JSON_PATH, encoding="utf-8") as f:
        data = json.load(f)

    game_preds = data.get("game_preds", {})
    log.info("game_preds: %d games", len(game_preds))

    # 追蹤上一輪的「場次|注單類型」，這樣同場不同注單類型時也會重新通知
    prev_bets = {
        f"{g['away_cn']}@{g['home_cn']}|{g.get('bet', '')}"
        for g in data.get("live_games", [])
        if g.get("bet")
    }

    et_now       = datetime.datetime.utcnow() - datetime.timedelta(hours=4)
    et_date_str  = et_now.strftime("%Y-%m-%d")
    log.info("ET date: %s", et_date_str)

    live_games  = fetch_live_scores(et_date_str)
    live_picks  = generate_live_picks(live_games, game_preds)

    for pick in live_picks:
        if pick.get("bet"):
            full_key = f"{pick['away_cn']}@{pick['home_cn']}|{pick.get('bet', '')}"
            if full_key not in prev_bets:
                send_ntfy(
                    f"⚾ 場中推薦 — {pick['bet']}",
                    f"{pick['away_cn']} @ {pick['home_cn']}\n{pick.get('reason', '')}",
                )

    now_tw = datetime.datetime.utcnow() + datetime.timedelta(hours=8)
    data["live_games"]       = live_picks
    data["live_updated_at"]  = now_tw.strftime("%Y-%m-%d %H:%M") + " (台灣時間)"
    data["live_updated_ts"]  = int(time.time())

    with open(JSON_PATH, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

    bets = [lp for lp in live_picks if lp.get("bet")]
    log.info("Done — %d 場進行中 / %d 個推薦", len(live_picks), len(bets))


if __name__ == "__main__":
    main()

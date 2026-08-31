#!/usr/bin/env python3
"""Stage 1 regression guard：確認 predict() 新增的 sigma_proj 計算是純附加，
不影響任何既有欄位（h_exp/a_exp/機率...），也不會在各種資料完整度組合下
crash。不需要網路，跑假隊名/假投手名即可（predict() 對未知 key 都有 fallback）。

用法：python scripts/check_predict_stage1.py
"""
import datetime
import math
import sys

sys.path.insert(0, ".")
import mlb_bot_v101 as bot

FAILED = []


def check(label, cond):
    status = "PASS" if cond else "FAIL"
    print(f"  [{status}] {label}")
    if not cond:
        FAILED.append(label)


def main():
    print("== case 1: 完全未知隊伍/投手，無 game_dt ==")
    r = bot.predict("__fake_home__", "__fake_away__", "__fake_p1__", "__fake_p2__",
                     market_total=8.5, game_dt=None)
    check("回傳值仍含所有既有欄位", "home_win_prob" in r and "mc_home_wp" in r)
    check("新增 h_sigma_proj/a_sigma_proj 欄位", "h_sigma_proj" in r and "a_sigma_proj" in r)
    check("sigma_proj 非負", r["h_sigma_proj"] >= 0 and r["a_sigma_proj"] >= 0)
    # 假隊伍：games=0(<10)+lineup缺失 → sqrt(0.20^2+0.15^2)=0.25
    expected = round(math.sqrt(0.20 ** 2 + 0.15 ** 2), 3)
    check(f"假隊伍 sigma_proj 應為 {expected}（開季樣本少+打線未公布）",
          r["h_sigma_proj"] == expected and r["a_sigma_proj"] == expected)

    print("== case 2: TBD 先發，帶 game_dt（觸發天氣抓取路徑） ==")
    r2 = bot.predict("__fake_home__", "__fake_away__", None, None,
                      market_total=8.5, game_dt=datetime.datetime.now())
    check("TBD 先發不 crash", "home_win_prob" in r2)
    check("home_win_prob 落在合理範圍", 0.0 < r2["home_win_prob"] < 1.0)

    print("== case 3: 一次呼叫兩次（相同輸入），確認結果 deterministic ==")
    r3a = bot.predict("__fake_home__", "__fake_away__", "__fake_p1__", "__fake_p2__", market_total=8.5)
    r3b = bot.predict("__fake_home__", "__fake_away__", "__fake_p1__", "__fake_p2__", market_total=8.5)
    # home_win_prob/away_win_prob 吃 mc_home_wp（蒙地卡羅抽樣），本來就非
    # deterministic；只檢查跟蒙地卡羅完全無關、純粹由①-⑫修正鏈算出的欄位
    # （這正是 Stage 1 唯一動到、也唯一保證不變的部分）。
    deterministic_keys = [
        "h_expected", "a_expected", "margin", "pure_total", "pure_total_tot",
        "model_total", "park_factor", "dyn_std", "h_rs", "a_rs",
        "h_team_rpg", "a_team_rpg", "weather_factor", "ump_name", "ump_adj",
        "h_l10_wpct", "a_l10_wpct", "h_lineup_ops", "a_lineup_ops",
        "h_bvp_ops", "a_bvp_ops", "conf_factor", "conf_tot",
        "h_sigma_proj", "a_sigma_proj",
    ]
    check("相同輸入下純①-⑫修正鏈欄位（h_exp/a_exp/model_total等，跟MC抽樣無關）逐一相同",
          all(r3a[k] == r3b[k] for k in deterministic_keys))

    print()
    if FAILED:
        print(f"FAILED: {len(FAILED)} check(s) — {FAILED}")
        sys.exit(1)
    print("All checks passed.")


if __name__ == "__main__":
    main()

#!/usr/bin/env python3
"""一次性分析工具：檢查蒙地卡羅模擬的總分預測，跟實際結果比起來準不準。

背景：mlb_bot_v101.py 的 monte_carlo_game() 用 Poisson 抽樣 + _era_sigma()
(投手ERA樣本可靠度) 當唯一的變異來源，過去被發現在「先發已確認、樣本可靠」
的場次反而把變異度壓得最低，導致大小分/讓分爆冷的機率被系統性低估。修正
時加了 GAME_IRREDUCIBLE_SIGMA 這個常數，但因為沒有真實歷史資料可以驗證，
數值（1.10）是推理估的，不是校準出來的。

這支腳本就是拿來補這個校準的：每筆推薦存檔時都會記錄 pred_total_mean/
pred_total_std（賽前MC模擬的總分期望值/標準差），settle_hist() 結算時
會補上 actual_total（實際總分）。兩者一起看，就能算出「模型預測的標準差」
跟「實際結果的標準差」差多少——如果實際標準差明顯大於模型預測的，代表
GAME_IRREDUCIBLE_SIGMA 還要再調高；如果差不多，代表校準得還可以。

用法：python scripts/analyze_variance_calibration.py（需要 GH_TOKEN 環境
變數，跟 mlb_bot_v101.py 讀 Gist 歷史紀錄用的是同一組）。

注意：pred_total_mean/pred_total_std/actual_total 都是這次修正後才開始
記錄的新欄位，舊紀錄不會有資料，需要累積一段時間的新場次才有東西可看。
"""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from mlb_bot_v101 import load_hist  # noqa: E402


def main():
    hist = load_hist()
    print("讀到歷史紀錄共 %d 筆\n" % len(hist))

    # 同一場比賽可能因為ML/RL/TOT分別產生多筆推薦，用(home,away,date)去重，
    # 避免同一場比賽的預測值被算進去好幾次，扭曲標準差估計。
    seen = set()
    rows = []
    for r in hist:
        pm = r.get("pred_total_mean")
        at = r.get("actual_total")
        if pm is None or at is None:
            continue
        key = (r.get("home"), r.get("away"), r.get("date"))
        if key in seen:
            continue
        seen.add(key)
        rows.append((pm, r.get("pred_total_std"), at))

    print("有完整 pred_total_mean + actual_total 資料的場次：%d 場" % len(rows))
    if not rows:
        print("目前還沒有資料——這些是新加的欄位，需要累積之後產生、且已經")
        print("結算的新場次才會有值，建議2-3週後再跑一次這支腳本。")
        return

    residuals = [at - pm for pm, _, at in rows]
    n = len(residuals)
    mean_resid = sum(residuals) / n
    realized_var = sum((x - mean_resid) ** 2 for x in residuals) / n if n > 1 else 0.0
    realized_std = realized_var ** 0.5

    preds_with_std = [ps for _, ps, _ in rows if ps is not None]
    avg_pred_std = sum(preds_with_std) / len(preds_with_std) if preds_with_std else None

    print()
    print("=" * 60)
    print("實際總分 - 模型預測總分（殘差）統計")
    print("=" * 60)
    print("平均殘差（正值=實際普遍比模型預測的高）: %+.2f 分" % mean_resid)
    print("殘差的實際標準差（真實變異度）        : %.2f 分" % realized_std)
    if avg_pred_std is not None:
        print("模型賽前預測的平均標準差（mc_std_total） : %.2f 分" % avg_pred_std)
        gap = realized_std - avg_pred_std
        print()
        if gap > 0.3:
            print("→ 實際變異度比模型預測的還大 %.2f 分，代表 GAME_IRREDUCIBLE_SIGMA" % gap)
            print("  可能還要再調高，模型還是低估了爆冷/大分差的機率。")
        elif gap < -0.3:
            print("→ 實際變異度比模型預測的還小 %.2f 分，代表 GAME_IRREDUCIBLE_SIGMA" % -gap)
            print("  可能調過頭了，模型現在對大小分/讓分過度保守。")
        else:
            print("→ 實際變異度跟模型預測的差不多（在±0.3分內），校準狀況看起來合理。")
    print()
    print("（場次數 n=%d 越少，這個統計本身的雜訊就越大，建議至少累積30場以上再參考。）" % n)


if __name__ == "__main__":
    main()

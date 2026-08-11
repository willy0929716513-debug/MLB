#!/usr/bin/env python3
"""一次性分析工具：檢查「提前多久下注」是否跟命中率有關。

背景：使用者實際下注時間點固定在台灣時間半夜12點前，很多場次（尤其晚場）
在那個時間點先發打線/官方裁判都還沒公布，只能用 probable/RotoWire/ESPN
等級的資料。這支腳本用來驗證：資料來源等級（sp_src）、以及提前下注時數
（hours_before_game，2026-08-11後才開始記錄）跟實際命中率有沒有相關性，
作為之後要不要針對「早期下注」加信心折扣的依據，而不是用猜的。

用法：python scripts/analyze_lead_time.py（需要 GH_TOKEN 環境變數，
跟 mlb_bot_v101.py 讀 Gist 歷史紀錄用的是同一組）。
"""
import os
import sys
from collections import defaultdict

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from mlb_bot_v101 import load_hist  # noqa: E402


def _pct(w, t):
    return "%d/%d = %.1f%%" % (w, t, w / t * 100) if t else "0/0"


def main():
    hist = load_hist()
    settled = [r for r in hist if r.get("result") in ("W", "L")]
    print("讀到歷史紀錄共 %d 筆，已結算(W/L，不含push) %d 筆\n" % (len(hist), len(settled)))
    if not settled:
        print("沒有已結算紀錄，無法分析。")
        return

    # ── 依 sp_src 分組（每一筆歷史紀錄都有這欄位，馬上可以看）──
    print("=" * 60)
    print("依先發資料來源分組（sp_src）")
    print("probable = 只有MLB官方預告，未被其他來源交叉確認")
    print("rotowire / espn / gamefeed = 有被至少一個獨立來源確認/更正過")
    print("=" * 60)
    by_src = defaultdict(lambda: [0, 0])
    for r in settled:
        src = r.get("sp_src") or "unknown"
        by_src[src][1] += 1
        if r["result"] == "W":
            by_src[src][0] += 1
    for src, (w, t) in sorted(by_src.items(), key=lambda x: -x[1][1]):
        print("  %-10s: %s" % (src, _pct(w, t)))

    # ── 依 bet_type 交叉 sp_src（讓分/獨贏/大小分可能受影響程度不同）──
    print()
    print("=" * 60)
    print("依「注別 x 先發來源」交叉分組")
    print("=" * 60)
    by_type_src = defaultdict(lambda: [0, 0])
    for r in settled:
        key = (r.get("bet_type", "?"), r.get("sp_src") or "unknown")
        by_type_src[key][1] += 1
        if r["result"] == "W":
            by_type_src[key][0] += 1
    for (btype, src), (w, t) in sorted(by_type_src.items(), key=lambda x: (-x[1][1])):
        print("  %-6s / %-10s: %s" % (btype, src, _pct(w, t)))

    # ── 依提前下注時數分組（hours_before_game，只有新紀錄才有）──
    print()
    print("=" * 60)
    print("依提前下注時數分組（hours_before_game）")
    print("=" * 60)
    by_lead = [r for r in settled if r.get("hours_before_game") is not None]
    print("有記錄這個欄位的筆數：%d / %d" % (len(by_lead), len(settled)))
    if not by_lead:
        print("目前還沒有任何一筆紀錄有這個欄位——這是新加的欄位，")
        print("需要累積之後產生的新推薦才會有資料，建議1-2週後再跑一次這支腳本。")
        return
    buckets = [(0, 4), (4, 8), (8, 12), (12, 24), (24, 999)]
    for lo, hi in buckets:
        grp = [r for r in by_lead if lo <= r["hours_before_game"] < hi]
        if not grp:
            continue
        w = sum(1 for r in grp if r["result"] == "W")
        print("  %3d-%3dh 前下注: %s" % (lo, hi, _pct(w, len(grp))))


if __name__ == "__main__":
    main()

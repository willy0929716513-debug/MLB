#!/usr/bin/env python3
"""Stage 3 regression guard：確認 calc_roi_by_type()/blend_prob()/_market_weight()
的行為合理，且完全不需要網路（純用合成的假歷史資料）。

用法：python scripts/check_stage3.py
"""
import sys

sys.path.insert(0, ".")
import mlb_bot_v101 as bot

FAILED = []


def check(label, cond):
    status = "PASS" if cond else "FAIL"
    print(f"  [{status}] {label}")
    if not cond:
        FAILED.append(label)


def mk(bt, n_w, n_l, price, stake=50.0):
    out = []
    for _ in range(n_w):
        out.append({"bet_type": bt, "result": "W", "stake": stake, "price": price})
    for _ in range(n_l):
        out.append({"bet_type": bt, "result": "L", "stake": stake, "price": price})
    return out


def main():
    print("== case 1: 樣本不足時 calc_roi_by_type 回傳 None，_market_weight 退回基準值 ==")
    empty_roi = bot.calc_roi_by_type([])
    check("空歷史全部回傳 None", all(v is None for v in empty_roi.values()))
    for bt in ("獨贏", "讓分", "大小分"):
        check(f"{bt} 樣本不足時 market_weight == base({bot.MARKET_W_BASE[bt]})",
              bot._market_weight(bt, empty_roi) == bot.MARKET_W_BASE[bt])

    print("== case 2: 貼近真實現況的合成歷史（獨贏虧錢/讓分賺錢/大小分小賺）==")
    hist = mk("獨贏", 20, 15, price=1.65) + mk("讓分", 42, 16, price=1.75) + mk("大小分", 17, 13, price=1.90)
    roi = bot.calc_roi_by_type(hist)
    check("獨贏 ROI 為負", roi["獨贏"] is not None and roi["獨贏"] < 0)
    check("讓分 ROI 明顯為正", roi["讓分"] is not None and roi["讓分"] > 0.20)
    w_ml, w_rl, w_tot = (bot._market_weight(bt, roi) for bt in ("獨贏", "讓分", "大小分"))
    check("獨贏虧錢 → market_weight 被拉高到超過基準值", w_ml > bot.MARKET_W_BASE["獨贏"])
    check("讓分賺錢 → market_weight 被拉低到低於基準值", w_rl < bot.MARKET_W_BASE["讓分"])
    check("三者都在合理範圍 [0.10, 0.92] 內", all(0.10 <= w <= 0.92 for w in (w_ml, w_rl, w_tot)))
    check("獨贏目前的 market_weight 高於讓分（獨贏該更信任市場）", w_ml > w_rl)

    print("== case 3: blend_prob 邊界行為 ==")
    check("market_p=None 時直接回傳 model_p（不崩潰、不亂算）",
          bot.blend_prob(0.65, None, "獨贏", roi) == 0.65)
    v_ml = bot.blend_prob(0.65, 0.55, "獨贏", roi)
    v_rl = bot.blend_prob(0.65, 0.55, "讓分", roi)
    check("相同 model_p/market_p 下，獨贏被拉向市場的幅度 > 讓分（因為w_ml > w_rl）",
          abs(v_ml - 0.55) < abs(v_rl - 0.55))
    check("blend_prob 結果落在 model_p 與 market_p 之間",
          min(0.55, 0.65) <= v_ml <= max(0.55, 0.65) and min(0.55, 0.65) <= v_rl <= max(0.55, 0.65))

    print()
    if FAILED:
        print(f"FAILED: {len(FAILED)} check(s) — {FAILED}")
        sys.exit(1)
    print("All checks passed.")


if __name__ == "__main__":
    main()

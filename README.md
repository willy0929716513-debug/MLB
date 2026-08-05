# MLB Predictor

自動化 MLB（美國職棒大聯盟）比賽預測系統。每天自動抓取賠率、跑模型算出「讓分 / 大小分 / 獨贏」的建議下注，發布到靜態網站（GitHub Pages）與 Next.js 網站（Supabase 存資料），兩邊都完全免費公開，並透過 Discord / ntfy 推播通知。

## 專案結構

```
mlb_bot_v101.py          每日主程式：抓賠率 → 跑預測模型 → 產出 docs/picks_latest.json → 推播 Discord
live_update.py           比賽進行中的即時比分更新（由 live_update.yml 排程觸發）
sync_history.py          從 Gist 讀回歷史戰績、結算已完賽的注單
add_picks_to_gist.py     手動補登歷史注單用的一次性腳本
scripts/
  fetch_standings.py     抓 MLB 戰績榜，寫入 docs/standings.json 並同步 Supabase
  fetch_pitcher_photos.py 抓先發投手照片存到 docs/images/pitchers/
docs/                    GitHub Pages 靜態網站（免費看板，公開）
webapp/                  Next.js 網站（另一種介面呈現同一份資料，同樣完全免費公開）
supabase/
  functions/trigger-bot/ Supabase Edge Function：讓手機瀏覽器也能觸發 GitHub Actions 跑 Bot
.github/workflows/       所有排程／自動化流程（見下方）
```

### 自動化流程（GitHub Actions）

| Workflow | 觸發時機 | 功能 |
|---|---|---|
| `mlb_bot.yml` | 每天 UTC 06:00（台灣 14:00）+ 手動 | 抓賠率、跑模型、產生當日推薦、推播 Discord |
| `live_update.yml` | 每天固定時段 + 手動 | 比賽期間每 5 分鐘更新即時比分 |
| `standings.yml` | 每天 UTC 06:30 + 手動 | 更新戰績榜 |
| `sync_history.yml` | 手動 | 從 Gist 同步歷史戰績、結算注單 |
| `add_picks.yml` | 手動 | 手動補登歷史注單資料 |
| `merge_to_main.yml` | push 到特定 feature branch | 自動把非資料檔案合併回 main |

歷史注單資料儲存在一個私有 **GitHub Gist**（`GIST_DESC = "mlb_bot_history"`），第一次執行 `mlb_bot_v101.py` 或 `sync_history.py` 時，若找不到既有 Gist 會自動建立一個新的（需要 `GH_TOKEN` 有 gist 權限）。

---

## 需要設定的金鑰（Secrets）

專案裡沒有任何金鑰是寫死的——全部透過環境變數/GitHub Secrets 注入。以下是「金鑰名稱」與「要去哪裡拿」的完整清單。

### 1. GitHub Actions Repository Secrets（必要，跑排程機器人用）

到 **GitHub repo → Settings → Secrets and variables → Actions → New repository secret**，逐一新增以下名稱（名稱必須完全一致，大小寫都要對）：

| Secret 名稱 | 必填 | 說明 / 去哪裡拿 |
|---|---|---|
| `ODDS_API_KEY` | ✅ 必填 | 賠率資料來源，到 [the-odds-api.com](https://the-odds-api.com/) 免費註冊取得 |
| `GH_TOKEN` | ✅ 必填 | GitHub Personal Access Token，需要 **`gist`** 權限（用來讀寫歷史戰績 Gist）。到 GitHub → Settings → Developer settings → Personal access tokens 建立，Classic token 勾選 `gist` scope 即可 |
| `SUPABASE_URL` | ✅ 必填 | Supabase 專案 URL，見下方「Supabase 設定」 |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ 必填 | Supabase service_role key，見下方「Supabase 設定」 |
| `DISCORD_WEBHOOK` | 選填 | Discord 頻道通知用，Discord 頻道設定 → 整合 → Webhook → 複製網址；不設就不會推播 |
| `WEATHER_API_KEY` | 選填 | [OpenWeatherMap](https://openweathermap.org/api) API key，用於天氣調整模型；不設會跳過天氣調整 |
| `NTFY_TOPIC` | 選填 | [ntfy.sh](https://ntfy.sh/) 推播主題名稱，用於即時比分通知；不設會用程式內建的預設主題 |

> `GITHUB_TOKEN` 不用自己設定——GitHub Actions 會自動提供，workflow 裡已經在用了。

### 2. Webapp（Vercel）環境變數

到 **Vercel 專案 → Settings → Environment Variables**（本機開發則複製 `webapp/.env.example` 為 `webapp/.env.local`）：

| 變數名稱 | 必填 | 說明 / 去哪裡拿 |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ | Supabase Dashboard → Project Settings → API → Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ | 同上頁面 → anon public key |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ | 同上頁面 → service_role secret key（**後端專用，切勿外流、切勿加 `NEXT_PUBLIC_` 前綴**）。只用來從 Storage 讀取 `picks_latest.json` |
| `NEXT_PUBLIC_APP_URL` | 選填 | 網站正式網址，例如 `https://your-app.vercel.app`（目前沒有功能依賴它） |

### 3. Supabase Edge Function `trigger-bot`（選填，讓手機也能一鍵觸發 Bot）

這個 function 讓 `docs/index.html` 網頁上的「觸發更新」按鈕可以不用貼 GitHub token，改用你自訂的密語。到 **Supabase Dashboard → Edge Functions → Function settings** 設定：

| 變數名稱 | 必填 | 說明 |
|---|---|---|
| `GH_TOKEN` | ✅ | GitHub PAT，需要 **`actions:write`**（或 classic token 的 `repo` scope），用來呼叫 `workflow_dispatch` |
| `TRIGGER_SECRET` | 選填 | 自訂密語；不設的話任何人都能觸發 Bot，建議務必設定 |

---

## 完成設定的步驟（Checklist）

1. **Supabase 專案**
   - 到 [supabase.com](https://supabase.com/) 建立新專案
   - 到 Storage 手動建立一個 **私有（Private）** bucket，名稱必須是 `picks`（`mlb_bot_v101.py` 跑完會把 `picks_latest.json` 上傳到這裡，`webapp` 也是從這裡讀）
   - 複製 Project URL / anon key / service_role key 備用

2. **The Odds API**
   - 註冊 [the-odds-api.com](https://the-odds-api.com/)，取得 `ODDS_API_KEY`

3. **GitHub Personal Access Token**
   - 建立一個 classic token，勾選 `gist` scope（給排程機器人用）
   - 若要用 Supabase Edge Function 觸發 Bot，再建立/沿用一個有 `actions:write`（或 `repo`）權限的 token

4. **設定 GitHub Actions Secrets**
   - 把上表「1. GitHub Actions Repository Secrets」的所有值填進 repo Settings → Secrets

5. **部署 webapp 到 Vercel**
   - 到 Vercel 匯入這個 repo，Root Directory 設為 `webapp`
   - 把上表「2. Webapp 環境變數」全部填進 Vercel 專案設定
   - 部署完成後回頭把正式網址填回 `NEXT_PUBLIC_APP_URL`
   - Vercel 預設會在每次 push 到 `main` 時自動重新部署；如果改完環境變數網站沒反應，到 Vercel 專案 → Deployments 分頁手動點最新那筆的 **⋯ → Redeploy**

6. **（選填）部署 Supabase Edge Function**
   - `supabase/functions/trigger-bot/index.ts` 貼到 Supabase Dashboard → Edge Functions → New Function
   - 設定「3. Edge Function」表格中的環境變數

7. **手動跑一次確認**
   - 到 GitHub repo → Actions → `MLB Bot Daily` → Run workflow，確認能成功產生 `docs/picks_latest.json` 並推播 Discord（若有設定）
   - 確認 `docs/` 的 GitHub Pages 有開啟（Settings → Pages → Source 選 `main` 分支 `/docs` 目錄）

---

## 這次做的修正

專案裡原本有兩個地方寫死了舊帳號的 repo 名稱（`willy0929716513-debug/mlb-predictor`），跟現在這個 repo（`willy0931926721-hub/MLB`）對不上，會導致「手動觸發 Bot」功能打錯 API 路徑而失敗，已修正為目前 repo：

- `docs/index.html`（前端「觸發更新」按鈕呼叫的 GitHub API 路徑）
- `supabase/functions/trigger-bot/index.ts`（Edge Function 代理呼叫的 repo）

## 已知限制 / 之後可以做的事

- Python 腳本目前沒有讀取 `.env` 檔（沒裝 `python-dotenv`），本機測試要自己 `export` 環境變數；正式環境都是靠 GitHub Actions Secrets 注入，不受影響。
- `webapp` 目前所有推薦內容一律公開免費顯示，沒有付費/會員機制。

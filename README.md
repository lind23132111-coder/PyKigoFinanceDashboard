# PyKigo Finance Dashboard

一個為家庭量身打造的財務戰情室，旨在提供多維度的資產解析與即時 AI 財務洞察。

## 🌟 主要功能

- **互動式財務圖表**：
  - 支援點擊過濾功能。點擊圓餅圖區塊（幣別、資產類型、成員）可即時連動所有圖表。
  - 總資產成長趨勢圖支援堆疊顯示，可觀察特定分類在不同月份的比例變化。
- **AI 財務洞察 (Gemini API)**：
  - 自動讀取當前資產分佈並產生專業財務總結。
  - **回饋機制**：使用者可對 AI 總結提供修正建議，AI 會學習過往回饋進行優化。
- **資產管理與結算 Wizard**：
  - 季度/月份資產快速結算，支援動態新增/移除資產帳戶。
  - 整合台股、美股、日股與匯率即時更新。
- **目標追蹤 (Financial Goals)**：
  - 設定財務目標並關聯特定資產，即時追蹤存錢與獲利進度。
  - 支援「近期大筆開銷」與「長期理財規劃」兩種目標分類。

## 🛠 技術棧

- **Frontend**: Next.js 16 (App Router, Turbopack), Tailwind CSS, Recharts
- **Backend/DB**: Supabase (PostgreSQL), Next.js Server Actions
- **AI**: Google Gemini 2.5 Flash (via `@google/genai`)

## 🎭 Demo 模式

本專案支援 Demo 模式，使用假資料展示完整功能，不需要連接真實資料庫。

### 本機開啟 Demo 模式

在 `.env.local` 新增：
```text
NEXT_PUBLIC_DEMO_MODE=true
```
重啟 dev server 即生效。

### 部署兩個版本（真實 + Demo）

在 Vercel 上從同一個 repo 建立兩個 Project，分別設定環境變數：

| | 真實版 | Demo 版 |
|---|---|---|
| `NEXT_PUBLIC_DEMO_MODE` | `false`（或不設定）| `true` |

兩個 Project 共用同一份程式碼，push 一次即同步更新。

## 🚀 快速開始

### 1. 安裝依賴
```bash
npm install
```

### 2. 設定環境變數 (`.env.local`)
```text
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
GEMINI_API_KEY=your_gemini_api_key

# 可選：開啟 Demo 模式（使用假資料）
# NEXT_PUBLIC_DEMO_MODE=true
```

### 3. 資料庫初始化
專案使用 Supabase 進行存儲。主要資料表結構位於 `supabase/schema.sql`。

### 4. 啟動開發伺服器
```bash
npm run dev
```

### 5. 更新市場與匯率 (Market Sync)
手動執行腳本更新股票價格與匯率：
```bash
node market_updater.mjs
```
或透過 GitHub Actions 自動定時執行（see `.github/workflows/market_updater.yml`）。

## 📁 專案目錄說明

- `src/app/actions/`: 模組化的 Server Actions（`dashboard.ts`, `ai.ts`, `goals.ts`, `wizard.ts`）
- `src/components/dashboard/`: Dashboard 專用的 UI 元件
- `src/types/`: 全域共享的 TypeScript 介面定義
- `supabase/`: 資料庫 Schema 與 SQL 初始化腳本
- `scripts/legacy/`: 舊版的測試與資料導入腳本

---
Created by **pykao** & **kigochen**.

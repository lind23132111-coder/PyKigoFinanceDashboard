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
  - **完整管理 (CRUD)**：支援由 UI 直接新增、編輯與刪除目標及關聯資產。
  - 支援「近期大筆開銷」與「長期理財規劃」兩種目標分類。
- **行動版介面優化 (Mobile-First Optimization)**：
  - **底部導覽列**：專為手機設計的固定式選單（首頁、目標、結算、報告、策略），支援單手操作。
  - **置頂篩選橫幅**：Dashboard 的互動式篩選橫幅在手機上會自動置頂，方便在滾動查看圖表時隨時清除篩選。
  - **雙端混合佈局 (Strategy Page)**：
    - **電腦版**：維持專業三欄式設計（清單、高階圖表、筆記同時呈現）。
    - **手機版**：自動切換為下拉選單式選取標的，並提供 `600px` 高度大線圖與常置式筆記區塊，極大化小螢幕顯示空間。
  - **觸控友善設計**：加大結算 Wizard 與各頁面按鈕的點擊範圍，優化圖表在窄螢幕的堆疊顯示。
- **站點安全保護 (Site Protection)**：
  - 正式版具備自定義密碼保護頁面，確保真實財務數據不外洩。
  - 使用 Next.js Middleware 與加密 Cookie 實現安全存取。

## 🛠 技術棧

- **Frontend**: Next.js 16 (App Router, Turbopack), Tailwind CSS, Recharts
- **Backend/DB**: Supabase (PostgreSQL), Next.js Server Actions
- **AI**: Google Gemini 2.5 Flash (via `@google/genai`)

## 🎭 Demo 模式

本專案支援 Demo 模式，使用假資料展示完整功能。您可以在此預覽：[Demo 展示版](https://py-kigo-finance-dashboard-demo.vercel.app/)。

### 本機開啟 Demo 模式

在 `.env.local` 新增：
```text
NEXT_PUBLIC_DEMO_MODE=true
```
重啟 dev server 即生效。

### 部署兩個版本（真實 + Demo）

在 Vercel 上從同一個 repo 建立兩個 Project，分別設定環境變數：

| 環境變數 | 真實版 (Real) | 演示版 (Demo) |
|---|---|---|
| `NEXT_PUBLIC_DEMO_MODE` | `false` | `true` |
| `SITE_PASSWORD` | ✅ 填入 (存取密碼) | ❌ 不需要 |
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ 填入 | ❌ 不需要 |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ 填入 | ❌ 不需要 |
| `GEMINI_API_KEY` | ✅ 填入 | ❌ 不需要 |

兩個 Project 共用同一份程式碼，GitHub Push 一次即同步完成兩端部署。注意 Demo 版會自動跳過密碼驗證頁面，方便公開分享。

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

# 站點存取密碼 (非 Demo 模式下必須)
SITE_PASSWORD=pydash2026

# 可選：開啟 Demo 模式（使用假資料，會自動跳過密碼頁面）
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
Created by **pykao**.

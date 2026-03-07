# PyKigo Finance Dashboard - Design Document

本文件詳細說明了 PyKigo Finance Dashboard 的系統架構、技術設計決策與資料模型。

## 1. 系統架構概念

專案採用現代化、非同步且數據驅動的架構，旨在處理多幣別資產與繁瑣的市場數據。

![Architecture Concept](images/architecture_concept_visual_1772792969606.png)
_架構概念圖：核心星狀結構與資料流。_

![Dashboard Ultra](images/dashboard_ultra.png)
_註：本圖為實際 UI 介面展示 (使用模擬數據)。_

### 技術棧 (Tech Stack)
- **Frontend**: Next.js 15 (App Router) 提供高效的 Server Side Rendering 與 Client Side Interaction。
- **Styling**: Tailwind CSS 用於實現響應式與玻璃擬態 (Glassmorphism) 設計。
- **Charts**: Recharts 用於多維度金融數據視覺化。
- **Backend/Service**: Next.js Server Actions 模組化處理業務邏輯。
- **Security**: Next.js Middleware 實作全站密碼保護頁面；Supabase RLS 提供資料庫層級權限控管。
- **Mobile-First Design**: 採用底部導覽與置頂橫幅優化小螢幕操作體驗。
- **Database**: Supabase (Postgres) 提供即時數據存儲。
- **AI Engine**: Google Gemini 2.5 Flash (via `@google/genai`)。

---

### 4. Data Security & CI/CD
*   **History Sanitization**: Sensitive files (`data.csv`, certain SQL seeds) are purged from Git history using `filter-branch` to prevent accidental exposure via public repositories.
*   **Secret Management**: Production credentials (Supabase URL/Key) are managed via GitHub Actions Secrets, ensuring they are never hard-coded in the source code or `.env` files tracked by Git.
*   **Gemini AI Security**: All AI interactions use server-side actions with direct SDK calls, keeping API keys protected on the backend.

## 2. 資料模型設計 (Data Model)

資料庫採用星狀架構 (Star Schema)，核心在於追蹤資產隨時間變化的淨值。

### 核心資料表
- **`assets`**: 資產定義表（包含類型、幣別、所有人、Ticker）。
- **`snapshots`**: 結算點容器，定義了結算的時期與 AI 總結摘要。
- **`snapshot_records`**: 數據事實表，記錄特定資產在特定結算點的數量與 TWD 等值價值。
- **`market_cache`**: 快取表，儲存最新的股票單價與各國匯率（USD/TWD, JPY/TWD）。
- **`ai_summary_feedback`**: AI 回饋日誌表，記錄使用者指示以進行 AI 優化。

---

## 3. 關鍵技術實作

### A. 互動式篩選機制 (Interactive Filtering)
儀表板透過 `useMemo` 實作 Client-side 篩選過濾器。當使用者點擊 Pie Chart 某個區塊（如：USD 幣別）時，系統會：
1. 更新全域 Filter 狀態。
2. 計算該分類在各月份結算點的佔比。
3. 同步更新 Trend Bar Chart 的堆疊 (Stacked Bar) 顯示，呈現篩選部分與總體資產的對比。

### B. AI 洞察回饋循環 (AI Feedback Loop)
系統不僅呈現一次性分析，更支援「訓練」：
- **Prompt Engineering**: AI Prompt 會注入當前資產比例數據。
- **Context Injection**: 每次生成會帶入最近 3 次的使用者回饋記錄。
- **Feedback Logging**: 紀錄使用者的修正指示，使 AI 能隨著使用時間越來越貼近使用者的財務觀點。

### C. 全自動市場同步 (Market Sync)
利用 **GitHub Actions** 每日定時觸發 Python 腳本 (`market_updater.py`)，透過 `yfinance` 抓取全球即時行情並寫回 Supabase 快取。

### D. 站點存取安全 (Option B Middleware)
針對正式版開發了自定義的安全層：
- **Middleware 攔截**：透過 `middleware.ts` 偵測 `site_auth` Cookie。
- **無縫 Demo 模式**：當 `NEXT_PUBLIC_DEMO_MODE` 為 `true` 時，系統自動跳過密碼驗證與 Supabase 初始化檢查，確保 Demo 版本在無環境變數下也能順利 Build 與存取。

### E. 目標管理強化 (Goal Management CRUD)
從單純的「顯示」進化為「管理」：
- **雙向編輯**：支援從 UI 修改目標細節與重新勾選關聯資產。
- **級聯刪除 (Cascading Cleanup)**：刪除目標時，系統自動清理映射表，確保資料庫一致性。

### F. 行動版介面優化 (Mobile-First Optimization)
針對手機使用者進行了操作路徑與視覺佈局的深度重構：
- **底部固定導覽 (Bottom Nav)**：將主要操作（首頁、目標、結算、報告、策略）移至螢幕底部，符合行動裝置單手使用的「大拇指熱區」。
- **置頂篩選橫幅 (Sticky Filter Banner)**：透過 `sticky top-16` 與 `backdrop-blur` 實作。當使用者在 Dashboard 下滑查看圖表時，篩選條件與清除按鈕會持續固定在視窗頂部，提供即時的互動回饋。
- **響應式組件重構**：
  - **AIInsightSection**：在手機版改用 `flex-col` 佈局並縮減內距，節省垂直空間。
  - **AggregationPieCharts**：動態調整圖表高度與圖例 (Legend) 字級，確保在窄螢幕下仍具備可讀性。

---

## 4. 安全性與擴充性

- **RLS (Row Level Security)**：資料庫層級的權限控管。
- **模組化 UI**：Dashboard 拆分為 `AIInsightSection`, `TrendChart`, `AggregationPieCharts` 等，方便未來擴充圖表類型（如：散佈圖、熱點圖）。

---
**Created by Antigravity (AI Architect)**

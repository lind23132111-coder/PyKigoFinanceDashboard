# PyKigo Finance Dashboard Project Work Log

本誌錄記載了本專案從開發初期至今的關鍵里程碑、實作內容及開發心得。

---

## 📅 專案開發進度概覽

| 階段 | 任務名稱 | 主要內容 | 淨開發工時 (Net Dev Hours) |
| :--- | :--- | :--- | :--- |
| **Phase 1** | **專案基石與自動化** | 資料庫 Schema、Python 市場更新腳本、GitHub Actions 部署 | 5h |
| **Phase 2** | **目標追蹤與類別定義** | 財務目標分類、資產與目標映射、進度條視覺化 | 2h |
| **Phase 3** | **資料修復與正規化** | 解決 RLS 權限衝突、CSV 串流重匯入、結算點去重 | 2h |
| **Phase 4** | **真實數據導入** | 從測試數據切換至真實資產資訊 | 1h |
| **Phase 5** | **AI 互動與架構優化** | 雙向 AI 回饋、互動式濾鏡圖表、程式碼全模組化 | 4h |
| **Phase 6** | **安全分享與完整管理** | 雙版本部署、全站密碼保護、目標管理 CRUD 化 | 3h |
| **Phase 8** | **行動版介面優化** | 底部導覽、置頂篩選、觸控友善 Wizard | 2h |

---

## 🛠 詳細開發日誌

### 🔹 Phase 1: 專案基石 (Foundation)
*   **實作亮點**:
    *   建立 Supabase 星狀結構 (Star Schema)：`assets`, `snapshots`, `market_cache`。
    *   **GitHub Actions 自動化**: 每天定時執行 Python 腳本抓取 Yahoo Finance 的股票報價與匯率。
    *   實作玻璃擬態 (Glassmorphism) 的 Next.js 儀表板初版。
*   **Lesson Learnt**: 自動化同步是個人財務系統的靈魂，移除手動輸入報價的負擔能大幅增加系統的使用率。

### 🔹 Phase 2: 目標管理 (Goals)
*   **實作亮點**:
    *   將財務目標區分為「近期大筆開銷」與「長期理財」。
    *   實作多對多映射，讓特定帳戶/股票的價值直接反應在目標進度條上。
*   **Debug 紀錄**: 處理了 JS 浮點數運算在金額加總時的誤差問題。

### 🔹 Phase 3: 資料夾健康與 RLS 修復
*   **實作亮點**:
    *   修復了 Supabase RLS (Row Level Security) 權限導致靜默失敗 (Silent Failure) 的問題。
    *   開發專用的 CSV 資料處理腳本，將原始 CSV 數據與新的 UUID 系統完成掛鉤。
*   **Lesson Learnt**: 在 Supabase 中刪除資料若遇到 RLS 阻擋不會噴錯，導致資料重複。改用「重新命名/封存」而非「刪除」在處理關鍵數據時更穩健。

### 🔹 Phase 4: 邁向維運 (Go-Live)
*   **實作亮點**:
    *   協助 PY 與 Kigo 將真實資產清單導入資料庫。
    *   驗證了多幣別（USD, TWD, JPY）在不同月份結算點的匯率轉換準確性。

### 🔹 Phase 5: AI 戰情室與架構重構 (Current)
*   **實作亮點**:
    *   **AI 回饋循環**: 導入 Gemini API 產生洞察，並增加回饋對話框，讓 AI 能根據使用者偏好（如：更簡短、關注特定股票）重新生成。
    *   **互動式圖表**: 實作 Pie Chart 與 Trend Chart 的連動。點擊特定幣別後，所有圖表皆會同步切換為該幣別的數據分佈。
    *   **Clean Code 重構**: 為了長遠維護，將 600 行的 `actions.ts` 拆分為四個領域模型，並將儀表板 UI 分解為獨立組件。
*   **Lesson Learnt**: 讓使用者能修正 AI（Feedback Loop）比單純顯示 AI 結果更能產生信任感。

### 🔹 Phase 6: 安全分享與完整管理 (Completed)
*   **實作亮點**:
    *   **雙版本部署策略**: 透過環境變數 `NEXT_PUBLIC_DEMO_MODE`，讓同一個 Repo 能同時支援「真實版」與「公開分享 Demo 版」。
    *   **全站密碼防護**: 實作 Middleware 攔截機制與 Premium 登入頁面，使用 `httpOnly` Cookie 提供為期 30 天的安全存取。
    *   **目標 CRUD 完整化**: 完成目標的編輯與刪除功能，包含資料庫聯動清理邏輯，讓資料維護不再依賴 SQL Script。
    *   **數據安全大排查**: 徹底抹除 Git 歷史中的敏感數據 (CSV/SQL)，並重寫 Commit 歷史以確保隱私。
    *   **CI/CD 自動化復原**: 修復 GitHub Actions 與 Secrets 設定，恢復市場報價與匯率的 6 小時自動更新。
*   **Lesson Learnt**: 在專案發布前建立好「Demo 模式」與「安全保險箱 (Secrets)」非常重要，這能讓你在不洩漏真實隱私的前提下，維持長期的自動化維運。

---

## 🌟 亮點總結 (Project Highlights)
1.  **全自動報價更新**: 透過 `yfinance` 與 GitHub Actions，資產價值永遠保持在最新狀態。
2.  **極致互動體驗**: 圖表不再是死板的，而是可以點擊探索的動態數據室。
3.  **現代化架構**: 使用 Next.js 15 Server Actions + TypeScript 共享介面，確保程式碼健壯度。

- [x] 正式版與 Demo 版雙向部署完成。
- [ ] 增加支出分類與記帳功能連動。
- [ ] AI 預測模型：預估退休金達成率。
- [x] 手機版 UI 進一步優化。

---
**本誌錄由 Antigravity (AI Architect) 與 PY/Kigo 共同編輯完成。**
### Phase 7: Long-term Stock Planning (Investment Strategy)
- **Goal**: Transition from current snapshot tracking to future financial strategy.
- **Achievements**:
  - Implemented `/planning` route with "Strategy" dashboard.
  - Added **Portfolio Rebalancing** module (Target vs. Actual).
  - Added **Dividend Snowball** projection chart (10-year passive income forecast).
  - Integrated with Navbar for easy access.

### Phase 8: Mobile Experience & UI Polish (Current)
- **Goal**: Transform the dashboard from "Desktop-Only" to a truly responsive mobile app experience.
- **Achievements**:
  - Implemented a **Persistent Bottom Navigation** with Cantonese-Chinese labels for localized clarity.
  - Developed a **Sticky Interaction Banner** on the Dashboard for convenient filter clearing while scrolling.
  - Refactor **Wizard Page** components for mobile (larger tap targets, responsive header).
  - Optimized chart containers and padding for narrow aspect ratios.
- **Lesson Learnt**: Mobile logic isn't just about "shrinking" elements, but about re-designing interaction points (from top-hover to bottom-tap).

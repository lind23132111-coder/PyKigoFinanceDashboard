---
description: Complete PR workflow for bug fixes and new features including documentation and wiki sync
---

# PyKigo Finance Dashboard - PR 工作流程

## 📌 適用情境
- **Bug Fix**：修復功能錯誤或視覺問題
- **New Feature**：新增功能或頁面
- **Refactor/Optimization**：效能、架構或 UI 優化

---

## 🔁 完整流程

### Phase 1 — 建立 Branch
// turbo
1. 從 main 切出新分支
```bash
git checkout main && git pull origin main
git checkout -b <feature|fix|docs>/<short-description>
```

### Phase 2 — 研究 & 規劃 (PLANNING)
2. 閱讀相關程式碼 (component + server actions)
3. 使用 browser subagent 截圖現況 (如有 UI 任務)
4. 評估影響範圍：哪些 Component、DB Schema、Action 需要改動
5. 建立 `implementation_plan.md` —— 列出：
   - 問題描述或需求說明
   - 修改清單 (含影響檔案)
   - 驗證計劃 (Verification Plan)
6. 回報給使用者（若有設計決策需要確認）

### Phase 3 — 實作 (EXECUTION)
7. 修改程式碼（按照實作計劃逐一完成）
8. **禁止在 Local 看不出錯誤的情況下就送出**
9. 確保沒有引入新的 Lint / TypeScript Error

### Phase 4 — 驗證 (VERIFICATION)
// turbo
10. 啟動 dev server（若尚未啟動）
```bash
npm run dev
```
11. 執行 Playwright 自動截圖
```bash
node scripts/take-screenshots.mjs
```
> ⚠️ **陰私規定**：腳本會自動在 port 3001 啟動一個 **`NEXT_PUBLIC_DEMO_MODE=true`** 的 dev server。  
> 截圖用的是「最新的本地 UI」但資料是 **Mock Data**。完全不會挖到真實資產。
12. 確認截圖符合預期、無 Console Error

### Phase 5 — 文件與 Wiki 同步
13. **README.md**：若有新功能，補充「主要功能」清單。
14. **Wiki 全面更新**：
    - `wiki/User-Guide.md`：更新操作流程與功能描述。
    - `wiki/Design-Document.md`：更新資料表結構與架構決策。
    - `wiki/Project-Work-Log.md`：更新開發日誌，併入對應的 Milestone 與實施工時。
15. **手動視覺稽核**：
    - 比對手機與電腦版佈局。
    - 若自動截圖有遮擋或資料疑慮，應自行手動截取 Demo 數據畫面替換至 Wiki。
16. **執行 Wiki 同步腳本 (關鍵)**：
    // turbo
    ```bash
    node scripts/sync-wiki.mjs
    ```

### Phase 6 — 建立 PR
17. **提交變更**：
    ```bash
    git add .
    git commit -m "<type>: <description>"
    git push origin <branch-name>
    ```
18. **建立 Pull Request**：
    - 標題應包含版本號或功能名稱（如：`feat: Strategy Optimization V1.3`）。
    - 內容應包含：**Key Changes**、**Visuals (Screenshots)** 以及 **關聯的支援單號 (Closes #X)**。

### Phase 7 — 回報與結案
19. 提供 PR 連結給使用者進行最終 Review。
20. 合併後確認 Vercel 自動部署成功。

---

## ⚠️ 核心準則 & 注意事項

| 準則 | 說明 |
|---|---|
| **Wiki 優先** | 所有的文件修改應優先在 Local `wiki/` 目錄完成，再透過腳本 sync。 |
| **連結 Issue** | 每個 PR 都必須明確連結到原始的 GitHub Issue 或 Milestone。 |
| **Demo 隱私** | 對外展示的文件與截圖絕不允許出現真實財務數據。 |
| **響應式思維** | 佈局優化需考量 Context，例如手機版應以單手操作與寬度釋放為首要。 |

---

## 📂 相關資源

- [GitHub PR 頁面](https://github.com/lind23132111-coder/PyKigoFinanceDashboard/pulls)
- [GitHub Wiki](https://github.com/lind23132111-coder/PyKigoFinanceDashboard/wiki)
- [Vercel Dashboard](https://vercel.com/lind23132111-coders-projects)
- [Wiki Sync Script](file:///Users/kigochen/Documents/PyKigoFinanceDashboard/scripts/sync-wiki.mjs)

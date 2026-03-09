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
10. **環境隔離檢查**：確保本地 `.env.local` 連向 **DEV 專案**，避免污染正式數據。
11. **載入測試數據**：
    - 若需快速測試，執行 `supabase/scripts/dev_mock_data.sql`。
    - 若需與 Demo 版完全同步，執行 `supabase/scripts/dev_demo_mirror.sql` (高精確度鏡像)。
12. 啟動 dev server（若尚未啟動）
```bash
npm run dev
```
13. 執行 Playwright 自動截圖
```bash
node scripts/take-screenshots.mjs
```
> ⚠️ **隱私規定**：腳本會自動在 port 3001 啟動一個 **`NEXT_PUBLIC_DEMO_MODE=true`** 的 dev server。  
> 截圖用的是「最新的本地 UI」但資料是 **Mock Data**。完全不會洩漏真實資產。
14. 確認截圖符合預期、無 Console Error。

### Phase 5 — 文件與 Wiki 同步
15. **README.md**：若有新功能，補充「主要功能」清單；若有架構變更，更新「環境配置」章節。
16. **Wiki 全面更新**：
    - `wiki/User-Guide.md`：更新操作流程與功能描述。**務必檢查所有圖片網址是否正確對應 `wiki/images/` 內的檔案名稱 (避免 filename mismatch)**。
    - `wiki/Design-Document.md`：更新資料表結構與架構決策。
    - `wiki/Project-Work-Log.md`：更新開發日誌，併入對應的 Milestone 與實施工時。
17. **手動視覺稽核**：
    - 比對手機與電腦版佈局。
    - 若自動截圖有遮擋或資料疑慮，應自行手動截取 Demo 數據畫面替換至 Wiki。
18. **執行 Wiki 同步腳本 (關鍵)**：
    // turbo
    ```bash
    node scripts/sync-wiki.mjs
    ```

### Phase 6 — 建立 PR
19. **提交變更**：
    ```bash
    git add .
    git commit -m "<type>: <description>"
    git push origin <branch-name>
    ```
20. **建立 Pull Request**：
    - 標題應包含版本號或功能名稱（如：`feat: Strategy Optimization V1.3`）。
    - 內容應包含：**Key Changes**、**Visuals (Screenshots)** 以及 **關聯的支援單號 (Closes #X)**。

### Phase 7 — 回報與結案
21. 提供 PR 連結給使用者進行最終 Review。
22. **合併後維護**：若合併後發現 `main` 分支有漏掉的重構或清理，應立即在 `main` 重新執行並補上提交。
23. 確認 Vercel 自動部署成功。

---

## 🎓 Lessons Learnt & Best Practices

| 類別 | 建議實踐 |
|---|---|
| **架構清理** | 所有的 SQL 腳本應統一放置於 `supabase/scripts/`，並主動清理 GitHub root 的冗餘檔案。 |
| **代碼一致性** | 統一使用 `@/lib/supabase` 作為 client 進入點，內建基礎 Error Handling 與 Demo 回退機制。 |
| **Wiki 鏈結** | 檔案重新命名後（如 `_ultra.png`），必須同步搜尋並取代全 Wiki 文件中的引用字串。 |
| **環境防護** | 開發新功能前，先確認 `.env.local` 內容。正式數據的操作絕對禁止出現在本地開發腳本中。 |

---

## 📂 相關資源

- [GitHub PR 頁面](https://github.com/lind23132111-coder/PyKigoFinanceDashboard/pulls)
- [GitHub Wiki](https://github.com/lind23132111-coder/PyKigoFinanceDashboard/wiki)
- [Vercel Dashboard](https://vercel.com/lind23132111-coders-projects)
- [Wiki Sync Script](file:///Users/kigochen/Documents/PyKigoFinanceDashboard/scripts/sync-wiki.mjs)

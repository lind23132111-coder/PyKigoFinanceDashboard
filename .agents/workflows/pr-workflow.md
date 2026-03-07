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
11. 執行 Playwright 自動截圖（一次截全部頁面）
```bash
node scripts/take-screenshots.mjs
```
> ⚠️ **隱私規定**：截圖腳本預設連線 **Demo 版網址（mock data）**，不會截到真實資產資料。若要自行指定網址，請確保已設定 `NEXT_PUBLIC_DEMO_MODE=true`。
12. 確認功能運作正常、無 Console Error 、截圖符合預期

### Phase 5 — 更新文件
13. **README.md**：若有新功能，補充「主要功能」清單
14. **wiki/User-Guide.md**：補充使用者操作描述
15. **wiki/Design-Document.md**：補充架構/技術決策
16. **wiki/Project-Work-Log.md**：新增開發日誌（Phase N），**使用實際淨開發工時**

### Phase 6 — 建立 PR
17. 批次提交所有程式碼與文件（一次 push）
```bash
git add .
git commit -m "<type>: <description>"
git push origin <branch-name>
```
18. 在 GitHub 建立 Pull Request

### Phase 7 — 同步 Wiki
// turbo
19. **執行 Wiki 同步腳本（必做）**
```bash
node scripts/sync-wiki.mjs
```
20. 確認腳本輸出顯示 `✨ Wiki Synchronization Complete!`

### Phase 8 — 回報使用者
21. 彙整截圖、PR 連結、變更摘要
22. 提供 PR 頁面給使用者 Review

---

## ⚠️ 已知限制 & 注意事項

| 問題 | 說明 | 對策 |
|---|---|---|
| Vercel 部署配額 | Hobby 方案每日上限 100 次 Build | 批次提交，避免多次 Push |
| **Wiki 是獨立倉庫** | `wiki/` 資料夾修改後需額外 sync | PR Merge 到 main 時 GitHub Actions 自動執行 —不需手動 |
| **實際工時確認** | 工時應為實際 Coding + 驗證 + 文件的時間 | 完成後回頭推算，不要估計 |
| **AI Insight 費用** | Gemini API 每次呼叫有費用 | 驗證時盡量用現有快取，避免重複觸發 |

---

## 📂 相關資源

- [GitHub PR 頁面](https://github.com/lind23132111-coder/PyKigoFinanceDashboard/pulls)
- [GitHub Wiki](https://github.com/lind23132111-coder/PyKigoFinanceDashboard/wiki)
- [Vercel Dashboard](https://vercel.com/lind23132111-coders-projects)
- [Wiki Sync Script](file:///Users/kigochen/Documents/PyKigoFinanceDashboard/scripts/sync-wiki.mjs)

# PyKigo Finance Dashboard - 使用者操作指南

歡迎使用您的專屬財務戰情室！本指南將協助您快速上手各項核心功能。

![Dashboard](/Users/kigochen/.gemini/antigravity/brain/49dd8b2d-2a73-45e6-9932-d52a61c7b6f5/dashboard_ultra.png)

## 0. 安全存取 (Site Security)
為了保護您的真實財務隱私，正式版設有密碼保護層。
- **登入頁面**：進入網頁後會自動跳轉至登入頁面。
- **輸入密碼**：請輸入由系統管理者（您自己）在 Vercel 環境變數 `SITE_PASSWORD` 設定的密碼。
- **記住身分**：登入成功後，瀏覽器會記住您的身分 30 天，期間內不需重複登入。
- **Demo 版免登入**：如果您分享的是 Demo 版本，系統會自動跳過此步驟，方便觀看模擬數據。

## 1. 財務戰情室 (Financial Dashboard)
儀表板提供全方位的資產視角。

- **AI 財務洞察 (AI Insight)**: 系統會根據最新數據自動產生一段分析。若您覺得 AI 說得不夠精確，可以在下方的回饋框輸入指令（例如：「請分析得更幽默一點」或「多關注我的美股分配」），點選「重新生成」。
- **趨勢互動圖表**: 
  - 點擊**總資產成長趨勢**中的月份長條圖，可以切換查看該月份的詳細分佈。
  - 點擊下方三個**分佈圓餅圖**（幣別、按所有人、按類型）的任一區塊，上方趨勢圖會自動顯示對應分類的「堆疊佔比」，讓您一眼看出特定資產（如：美金資產）隨時間的增長狀況。

## 2. 定期資產結算 (Quarterly Wizard)
每次結算時（如：季度或月份），請前往此頁面。

![Wizard](/Users/kigochen/.gemini/antigravity/brain/49dd8b2d-2a73-45e6-9932-d52a61c7b6f5/wizard_ultra.png)

![Wizard input detailed](/Users/kigochen/.gemini/antigravity/brain/49dd8b2d-2a73-45e6-9932-d52a61c7b6f5/wizard_detailed_ultra.png)

- **確認投資股數**: 系統會自動帶入上一次的結算數量，並比對最新市場報價，您只需確認是否有買進/賣出即可。
- **更新銀行餘額**: 填入各家網銀今日的實際餘額。
- **儲存結算**: 點擊儲存後，系統將自動計算等值台幣總額，並產生一份新的 AI 報告。

## 3. 財務目標追蹤 (Goal Tracker)
讓您的存款與投資賦予目標感。

![Goals](/Users/kigochen/.gemini/antigravity/brain/49dd8b2d-2a73-45e6-9932-d52a61c7b6f5/goal_ultra.png)

![Goals input detail](/Users/kigochen/.gemini/antigravity/brain/49dd8b2d-2a73-45e6-9932-d52a61c7b6f5/goal_detailed_ultra.png)

- **設定目標**: 您可以建立「近期大筆開銷」（如：國內旅遊）或「長期理財規劃」（如：退休金）。
- **完整管理**: 
  - **編輯**: 點擊目標卡片右上角的「鉛筆」圖示，可隨時修改名稱、金額或重新勾選資產。
  - **刪除**: 點擊「垃圾桶」圖示並確認，即可移除不再追踪的目標。
- **資產關聯**: 建立目標時可選取相關的資產（例如：將特定證券帳戶與「房地產」目標綁定），系統會自動計算這些資產的總額並呈現達成百分比。

## 4. 歷史結算報告 (Report)
本頁面列出所有過往的結算細節，適合在報稅或年度回顧時使用，可以查看特定時間點所有帳戶的餘額快照。
![Report](/Users/kigochen/.gemini/antigravity/brain/49dd8b2d-2a73-45e6-9932-d52a61c7b6f5/report_ultra.png)

---
**Happy Financial Planning!**
### 📉 投資策略與規劃 (Strategy & Planning) - [💡 構想階段 / WIP]
> [!NOTE]
> 此頁面目前處於 **構想實作 (Idea Phase)**，數據與功能僅供 Prototype 參考。
在 **"Strategy"** 頁面中，您可以進行更長遠的財務佈局：
1. **資產再平衡**：設定理想的資產比例（如：美股 40%、台股 30%、現金 30%），系統會自動比對現狀並提醒您是否偏離目標。
2. **股息滾雪球**：根據當前持股，預測未來 10 年的股息成長趨勢，直觀看到被動收入的增長。

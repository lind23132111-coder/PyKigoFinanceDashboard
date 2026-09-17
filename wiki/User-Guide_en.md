# PyKigo Finance Dashboard - User Operational Guide

🌐 **Language / 語言**: [繁體中文](User-Guide) | **English**

Welcome to your family financial command center! This guide will help you quickly master all core features and operations.

---

## 0. Site Security & Protection

To protect your family's real financial privacy, the production environment includes a password security layer.
- **Login Page**: Visiting the application redirects automatically to the password verification screen.
- **Enter Password**: Input the custom access password defined in your Vercel environment variable `SITE_PASSWORD`.
- **Session Persistence**: Upon successful authentication, your browser saves an encrypted session cookie valid for 30 days.
- **Demo Mode Bypass**: If you are exploring the public Demo site, the password step is automatically bypassed.

---

## 1. Financial Dashboard

The main dashboard delivers a 360-degree interactive overview of your net worth and asset breakdown.

![Dashboard](https://raw.githubusercontent.com/wiki/lind23132111-coder/PyKigoFinanceDashboard/images/dashboard_ultra.png)

- **AI Financial Insights (AI Insight)**:
  - Generates real-time advisory summaries based on your latest portfolio breakdown.
  - To customize AI output, type instructions into the feedback box (e.g., *"Keep it concise, focus on tech stock exposure"*), then click **Regenerate**.
- **Interactive Trend Charts**:
  - Click on any bar in the **Total Net Worth Trend** to switch the view to that specific historical snapshot month.
  - Click any segment in the **Pie Charts** (Currency, Ownership, Asset Allocation) to instantly display stacked percentage breakdowns on the main trend chart.
  - **Sticky Mobile Filter Banner**: When filtering on mobile screens, a top banner displays active filters (e.g., `Currency: USD`) with a single-tap **Clear** button.

---

## 2. Financial Goal Tracker

Give your savings and investments clear purpose and direction.

![Goals](https://raw.githubusercontent.com/wiki/lind23132111-coder/PyKigoFinanceDashboard/images/goal_ultra.png)

![Goals Input Detail](https://raw.githubusercontent.com/wiki/lind23132111-coder/PyKigoFinanceDashboard/images/goal_detailed_ultra.png)

- **Categorized Goal Management**: Create goals under **Short-term Major Expenses** (1-3 years) or **Long-term Wealth Planning** (3+ years).
- **Custom Ordering**: Use the up/down arrows on each card to adjust priority order.
- **Full Management (CRUD)**: Edit goal title, target amount, or bound asset accounts anytime using the edit pencil or delete bin icons.
- **Asset Account Binding**:
  - Bind multiple stock or cash accounts to a goal.
  - The application automatically aggregates real-time account balances (converting currencies on the fly) to compute goal completion percentages.

---

## 3. Strategy & Command Center

Perform deep portfolio analysis, monitor allocation drift, and maintain investment discipline.

![Strategy Desktop](https://raw.githubusercontent.com/wiki/lind23132111-coder/PyKigoFinanceDashboard/images/strategy_ultra.png)
*Desktop view: Professional 3-column layout displaying holdings list, TradingView charts, and tactical notes.*

- **Portfolio Rebalancing Matrix**:
  - **Target vs. Actual**: Compares target asset allocation against actual holdings.
  - **Rebalance Drift Alerts**: Highlights assets as `Buy` or `Sell` when deviation exceeds set thresholds.
- **Dividend Snowball Projection**:
  - **Real Holdings Base**: Calculates estimated annual dividend income from current stock & RSU inventory.
  - **10-Year Compound Growth Simulation**: Simulates 10-year passive income growth assuming a 12% CAGR asset appreciation & reinvestment rate.
- **Interactive Candlestick Analysis**:
  - Powered by TradingView charts with a 600px viewport optimized for mobile screens.
  - Store trading notes, price targets, and research remarks persistent per ticker in the database.

---

## 4. Expenses & Settlement Module (V2.2)

Simplify daily bookkeeping and household expense splitting.

![Expenses Desktop](https://raw.githubusercontent.com/wiki/lind23132111-coder/PyKigoFinanceDashboard/images/expenses_ultra.png)
*V2.2 Configuration: Flexible time filtering & mobile optimization.*

- **Flexible Time Period Filters**:
  - Toggle seamlessly between Month, Quarter, and Year views.
  - Computes total spending, daily average estimates, and period-over-period percentage growth.
- **Beneficiary & Project Tabs**:
  - Filter transactions by project scope (*General Living*, *Home Renovation*) or beneficiary (*PY*, *Kigo*, *Both*).
- **AI Smart Import Inbox**:
  ![AI Input](https://raw.githubusercontent.com/wiki/lind23132111-coder/PyKigoFinanceDashboard/images/expenses_input_ultra.png)
  ![Smart Input](https://raw.githubusercontent.com/wiki/lind23132111-coder/PyKigoFinanceDashboard/images/expenses_smartinput_ultra.png)
  - Paste text from e-invoices, upload PDF statements, or line logs. Gemini AI automatically parses dates, merchants, and amounts with smart deduplication.
- **Transaction Workspace**:
  ![All Expenses Modal](https://raw.githubusercontent.com/wiki/lind23132111-coder/PyKigoFinanceDashboard/images/expenses_v2.2_modal_desktop.png)
  - Full-screen workspace with batch editing, auto-selection on edit, and search filters.
- **Split Settlement & Net Balance Module**:
  ![Split Settlement](https://raw.githubusercontent.com/wiki/lind23132111-coder/PyKigoFinanceDashboard/images/expenses_AA_ultra.png)
  - Tracks prepayments between PY and Kigo using a **Net Liability** algorithm, showing exact net transfer amounts required.

---

## 5. Asset Settlement Wizard

Use the wizard for quarterly or monthly net worth updates.

![Wizard](https://raw.githubusercontent.com/wiki/lind23132111-coder/PyKigoFinanceDashboard/images/wizard_ultra.png)

![Wizard input detailed](https://raw.githubusercontent.com/wiki/lind23132111-coder/PyKigoFinanceDashboard/images/wizard_detailed_ultra.png)

- **Step 1: Confirm Investment Holdings**: Review stock share counts pre-filled from your previous settlement, with live ticker lookup for TW, US, and JP stocks.
- **Step 2: Update Bank Balances**: Enter online banking balances for cash and fixed deposit accounts.
- **Step 3: Save & Generate Snapshot**: Automatically converts all holdings into equivalent TWD values and generates a new snapshot report.

---

## 6. Historical Asset Report

View and compare past settlement snapshots for tax filing or annual reviews.

![Report](https://raw.githubusercontent.com/wiki/lind23132111-coder/PyKigoFinanceDashboard/images/report_ultra.png)

- Select any historical snapshot period (e.g. `2026/2`) from the dropdown to inspect past asset balances, exchange rates, and ownership shares.

---

## 7. Mobile Optimization

- **Fixed Bottom Navigation Bar**: Ergonomic single-handed control for core pages.
- **Sticky Filter Banners**: Keeps filter states and clear actions visible while scrolling long tables.
- **Touch-Friendly Controls**: Touch targets sized for thumb interaction on mobile devices.

---

> [!NOTE]
> **Developer Note**: Local development (`NEXT_PUBLIC_DB_SCHEMA=dev`) is isolated in the `dev` schema, protecting the production database (`public`).

**Happy Financial Planning!**

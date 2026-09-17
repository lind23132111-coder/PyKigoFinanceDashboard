# PyKigo Finance Dashboard

🌐 **Language / 語言**: [繁體中文](README.md) | **English**

A custom-built family financial command center designed to deliver multi-dimensional asset analytics and real-time AI wealth insights.

---

## 🌟 Key Features

- **Interactive Financial Charts**:
  - Click-to-filter mechanics: Select pie slices (Currency, Asset Allocation, Ownership) to filter all charts in real time.
  - Historical net worth growth trends with stacked breakdown capability to observe portfolio proportion shifts over time.
- **AI Financial Insights (Gemini API Integration)**:
  - Automatically analyzes current portfolio breakdown to generate 1-2 sentence professional advisory summaries.
  - **Feedback Optimization Loop**: Users can supply prompt feedback (e.g., "Keep it concise, focus on stocks"), allowing the AI to refine future recommendations.
- **Asset Settlement Wizard**:
  - Quarterly and monthly asset settlement wizard with dynamic addition and removal of linked financial accounts.
  - Live market data sync across Taiwan stocks (TW), US equities (US), Japanese stocks (JP), and foreign exchange rates.
- **Financial Goal Tracker**:
  - Set specific wealth goals and bind them to asset accounts to track savings and investment progress live.
  - **Full Management (CRUD)**: Create, edit, and delete goals directly from the user interface.
  - Categorizes goals into "Short-term Major Expenses" (1-3 years) and "Long-term Wealth Planning" (3+ years).
- **AI-Powered Automated Expense & Settlement Module (V2.0)**:
  - **AI Inbox**: Batch import e-invoices, receipts, PDF statements, and LINE text logs. Powered by Gemini for smart deduplication and category suggestions.
  - **Expense Splitting & Partial Settlement**: Accurately tracks member prepayments (PY, Kigo, Both). Features real-time net balance calculations, settlement history, and flexible partial settlements.
  - **Multi-Ledger & Goal Linkage**: Supports separate ledger scopes ("General Living", "Home Renovation") and links spending directly to financial goals.
  - **Collapsible Mobile-Friendly UI**: Optimized layout for fast reconciliation and budget analysis.
- **Mobile-First Responsive Design**:
  - **Fixed Bottom Navigation Bar**: Ergonomic single-handed navigation (Home, Goals, Wizard, Report, Strategy).
  - **Sticky Interactive Filter Banner**: Remains pinned at the top of mobile screens for quick filter resetting.
  - **Adaptive Strategy Command Center**:
    - **Desktop**: Professional 3-column dashboard (Holdings list, TradingView charts, Tactical notes).
    - **Mobile**: Dropdown selection with a 600px high candlestick chart viewport and persistent notes module.
- **Site Security Protection**:
  - Password-protected access to prevent unauthorized viewing of sensitive family financial data.
  - Powered by Next.js Middleware and encrypted cookie sessions.
- **Bilingual Interface (EN/ZH)**:
  - Global language switcher header button with automatic URL parameter persistence (`?lang=en` or `?lang=zh`).

---

## 🛠 Tech Stack

- **Frontend**: Next.js 16 (App Router, Turbopack), React 19, Tailwind CSS, Recharts, Lucide Icons
- **Backend / Database**: Supabase (PostgreSQL), Next.js Server Actions
- **AI Engine**: Google Gemini 2.5 Flash (via `@google/genai`)

---

## 🎭 Demo Mode

The application natively supports Demo Mode using mock financial data. Preview the live interactive demo here: [PyKigo Demo Site](https://py-kigo-finance-dashboard-demo.vercel.app/?lang=en).

### Running Demo Mode Locally

Add the following environment variable to `.env.local`:
```text
NEXT_PUBLIC_DEMO_MODE=true
```
Restart your dev server for changes to take effect.

---

## 🚀 Quick Start Guide

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables (`.env.local`)
```text
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
GEMINI_API_KEY=your_gemini_api_key

# Access password (required when DEMO_MODE is false)
SITE_PASSWORD=your_access_password

# Optional: Enable Demo Mode
# NEXT_PUBLIC_DEMO_MODE=true
```

### 3. Initialize Database
Database schema definitions and SQL scripts are located in `supabase/schema.sql`.

### 4. Start Local Development Server
```bash
npm run dev
```

### 5. Market & Exchange Rate Sync
Update market stock prices and currency rates manually:
```bash
node market_updater.mjs
```
Or run automatically via GitHub Actions (see `.github/workflows/market_updater.yml`).

---

## 📁 Directory Architecture

- `src/app/actions/`: Server Actions (`dashboard.ts`, `ai.ts`, `goals.ts`, `wizard.ts`, `expenses.ts`)
- `src/components/`: Reusable UI components categorized by feature domain (dashboard, expenses, navbar, etc.)
- `src/context/`: `LanguageContext.tsx` for client-side bilingual translation state
- `src/lib/i18n/`: `translations.ts` dictionary containing English and Traditional Chinese keys
- `supabase/`: Database schema definitions and SQL initialization scripts

---
Created by **pykao**.

# PyKigo Finance Dashboard - Technical Design Document

🌐 **Language / 語言**: [繁體中文](Design-Document.md) | **English**

This document details the system architecture, technical design decisions, database models, and algorithms of the PyKigo Finance Dashboard.

---

## 1. System Architecture & Concepts

The application adopts a modern, asynchronous, data-driven architecture optimized for multi-currency portfolio management and financial analytics.

![Architecture Concept](images/architecture_concept_visual_1772792969606.png)

### Tech Stack Specifications
- **Frontend Framework**: Next.js 16 (App Router, Turbopack) for hybrid Server Side Rendering (SSR) and reactive Client Side Components.
- **Styling**: Tailwind CSS for responsive layouts and Glassmorphism visual aesthetics.
- **Data Visualization**: Recharts for dynamic multi-dimensional financial charts.
- **Backend / API**: Next.js Server Actions for type-safe server-side logic and database operations.
- **Database & Auth**: Supabase (PostgreSQL) with Row Level Security (RLS) and custom Next.js Middleware password authentication.
- **AI Engine**: Google Gemini 2.5 Flash via `@google/genai` SDK.

---

## 2. Database Schema Data Model

- **`assets`**: Core financial assets. Fields include `title`, `owner`, `asset_type`, `currency`, `ticker_symbol`, `avg_cost`, `dividend_yield`, `strategy_category`.
- **`snapshots` & `snapshot_records`**: Periodic asset snapshot history recording `quantity`, `unit_price`, `fx_rate`, and `total_twd_value`.
- **`market_cache`**: Caches live stock market prices and currency exchange rates.
- **`strategy_notes`**: Stores stock trading tactical notes (`ticker_symbol`, `note_content`, `target_buy_price`, `target_sell_price`, `confidence_level`).
- **`strategy_targets`**: Defines ideal asset allocation targets and UI colors.
- **`goals` & `goal_asset_mapping`**: Short-term and long-term financial goals and bound asset accounts.
- **`expenses` & `expense_categories`**: Core bookkeeping entries with `paid_by` and `paid_for` tracking for expense splitting.
- **`settlements`**: Records debt settlement history between family members.
- **`ai_summary_feedback`**: Logs user prompt feedback to continuously improve Gemini AI summary generations.

---

## 3. Key Technical Implementations

### A. Client-Side Interactive Filtering
The dashboard utilizes React `useMemo` for client-side multi-dimensional filtering. Clicking any pie chart segment (e.g., Currency = USD) immediately filters all connected stacked bar charts in real time.

### B. AI Feedback Optimization Loop
- **Prompt Construction**: Injects real-time asset percentages into system prompts.
- **Context Injection**: Includes the 3 most recent user feedback logs to adapt the advisory tone over time.

### C. Automated Market Sync Pipeline
A scheduled **GitHub Action** (`.github/workflows/market_updater.yml`) executes `market_updater.mjs` daily to fetch Yahoo Finance ticker prices and exchange rates into Supabase cache.

### D. Schema Sandbox (`dev` vs `public`)
To protect live family data during local development:
- Production environment connects to the Supabase `public` schema.
- Local development automatically targets the `dev` schema when `NEXT_PUBLIC_DB_SCHEMA=dev` is set in `.env.local`.

### E. AI Inbox & Smart Deduplication Algorithm
The expense module utilizes Gemini AI for multi-modal processing (PDF receipts, screenshots, LINE messages) combined with server-side fuzzy matching (`amount ± 1`, `date ± 1 day`) to prevent duplicate record entries while preserving AI token quotas.

---

## 4. Security & Extension Guidelines

- **Row Level Security (RLS)**: Enforces database level access rules.
- **Wiki Synchronization SOP**: Run `node scripts/sync-wiki.mjs` to push changes from local `wiki/` directory to GitHub Wiki repository.

---
**Created by Antigravity (AI Architect)**

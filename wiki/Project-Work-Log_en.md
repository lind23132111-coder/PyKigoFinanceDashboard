# PyKigo Finance Dashboard Project Work Log

🌐 **Language / 語言**: [繁體中文](Project-Work-Log) | **English**

This document records the key development milestones, architectural features, key debug notes, and lessons learnt from project inception to date.

---

## 📅 Development Progress Overview

| Milestone | Task Name | Key Deliverables | Net Dev Hours |
| :--- | :--- | :--- | :--- |
| [**V1.0**](#v1.0) | **Core Foundation** | Supabase architecture, Gemini AI insights, Dual-deployment setup, Password site security | 17h |
| [**V1.1**](#v1.1) | **Polish & Data Integrity** | Mobile-first UX, Ticker autocomplete, Strict Demo Mode write protection | 3h |
| [**V1.2**](#v1.2) | **Strategy & Deep Analysis** | TradingView integration, Ticker strategy notes, Command center Glassmorphism UI | 4h |
| [**V1.3**](#v1.3) | **Responsive Layout Evolution** | Hybrid desktop/mobile layouts, 600px mobile candlestick charts, Sticky notes panel | 3h |
| [**Maintenance**](#maintenance) | **Env Separation & Refactor** | Supabase Schema Sandbox (`dev` vs `public`), Script cleanup, Unified Supabase client | 2h |
| [**V2.0**](#v2.0) | **AI Accounting & Expense Split** | AI Inbox, Smart deduplication, Split net liability engine, Expenses UI | 6h |
| [**V2.1**](#v2.1) | **Infra & UX Polish** | Token optimization, Layered filter layout, Error boundary safeguards, Settlement history fixes | 4h |
| [**V2.2**](#v2.2) | **Filter & UI Refinement** | Month/Quarter/Year filter modes, Mobile typography polish, Auto-check on edit | 5h |
| [**V2.2.9**](#v2.2.9) | **Stability Hotfix** | Zombie process cleanup, 10s timeout protection, Settlement robustness, Date sync fixes | 1h |
| [**V2.3.0**](#v2.3.0) | **Full EN/ZH Localization** | Full Demo Web app English mock data, UI buttons/modals/alerts localization, Docs sync | 1.5h |

---

## 🛠 Detailed Development Log

<a id="v1.0"></a>
### 🔹 Milestone V1.0: Core Foundation & Infrastructure
*   **Development Scope (Phase 1-6)**: Covered building the application from 0 to 1.
*   **Key Deliverables**:
    *   **Infrastructure**: Established Supabase star schema database structure and GitHub Actions automated market data synchronization.
    *   **Core Logic**: Implemented financial goal management, asset weight mapping, and multi-currency exchange rate conversions.
    *   **AI Financial Room**: Integrated Gemini API providing bidirectional prompt feedback for asset advisory.
    *   **Security & Environment Routing**: Password-protected site access and dual-environment deployment (`NEXT_PUBLIC_DEMO_MODE`).
*   **Key Debug Notes**: Resolved silent failures caused by Supabase Row Level Security (RLS) policies; fixed JavaScript floating-point currency accumulation rounding errors.
*   **Lesson Learnt**: Setting up "Demo Mode" and "Automated Sync" early in the development cycle is essential for long-term maintainability, enabling privacy protection and feature verification in parallel.

<a id="v1.1"></a>
### 🔹 Milestone V1.1: Mobile Polish & Data Integrity
*   **Development Scope (Phase 8-9)**: Optimized cross-platform user experience and system data integrity.
*   **Key Highlights**:
    *   **Mobile Experience Polish**: Added persistent bottom navigation, sticky top filter banner, and restructured asset wizard touch layouts.
    *   **Ticker Autocomplete Evolution**: Implemented direct Yahoo Finance fetch integration with automatic `.TW` ticker suffix auto-completion and full-width character handling.
    *   **Strict Demo Data Protection**: Enforced a "write-lock" safeguard and test keyword warnings in Demo Mode to prevent mock data corruption.
    *   **Clean Architecture**: Purged isolated test records from Supabase and established the environment separation roadmap.
*   **Lesson Learnt**: Mobile optimization isn't just scaling down desktop views—it requires rethinking touch navigation; data integrity safeguards are just as critical as feature development.

<a id="v1.2"></a>
### 🔹 Milestone V1.2: Investment Strategy & Tactical Command Center
*   **Development Scope (Phase 7 & 10)**: Evolved the platform from passive monitoring into an active tactical command center.
*   **Key Highlights**:
    *   **TradingView Integration**: Embedded interactive candlestick charts into `/planning` for real-time technical analysis.
    *   **Tactical Trading Notes**: Built `strategy_notes` persistent storage to record target buy/sell prices, confidence ratings, and trade notes per ticker.
    *   **Command Center UI**: Designed a Premium Glassmorphism interface integrating holding selectors, live quotes, and tactical note panels.
*   **Lesson Learnt**: Combining professional market analysis tools (TradingView) with private user trade logs maximizes the strategic value of the platform.

<a id="v1.3"></a>
### 🔹 Milestone V1.3: Responsive Layout Evolution
*   **Development Scope (Phase 11-12)**: Deep layout refactoring tailored for desktop and mobile viewports.
*   **Key Highlights**:
    *   **Hybrid Layout Engine**: Preserved a professional 3-column dashboard on desktop while switching to dropdown navigation and vertical stacking on mobile screens.
    *   **Mobile Viewport Maximization**: Expanded chart viewport height to `600px` on mobile to alleviate screen clutter and pinned tactical notes persistently to the bottom.
    *   **Code Simplification**: Removed redundant `isNotesOpen` toggle states to streamline user navigation paths on mobile devices.
*   **Lesson Learnt**: Layout design should not merely "hide or shrink" elements; it must prioritize content visibility and persistence based on the specific usage context.

<a id="maintenance"></a>
### 🔹 Milestone Maintenance: Env Separation & Architecture Refactoring
*   **Development Scope (Phase 13)**: Hardened development security and codebase maintainability.
*   **Key Highlights**:
    *   **Schema Sandbox Isolation**: Implemented `.env.local` switching via `NEXT_PUBLIC_DB_SCHEMA=dev`. Separated development testing into the `dev` schema while keeping live production data in `public`, safeguarding real household data without requiring separate Supabase project quotas.
    *   **Script Organization**: Migrated all SQL initialization and mock data scripts to `supabase/scripts/`, cleaning up redundant files.
    *   **Unified Supabase Client**: Refactored `src/lib` Supabase client for dynamic schema switching and updated project-wide imports for higher robustness.
*   **Lesson Learnt**: Timely technical debt repayment (Refactoring) and strict schema isolation are mandatory for safe, stable iterative development within cloud quota limits.

<a id="v2.0"></a>
### 🔹 Milestone V2.0: AI Accounting & Expense Split Module
*   **Development Scope (2026/03)**: Built to resolve household expense tracking and monthly reconciliation pain points.
*   **Key Highlights**:
    - **AI Inbox Verification**: Supported heterogeneous invoice receipts, Gemini smart deduplication, and a compact 2x2 grid layout.
    - **Batch Smart Input**: Built a top batch owner synchronization tool, eliminating repetitive manual clicks.
    - **Full Audit History Modal**: Implemented an interactive full-screen modal supporting cross-month keyword searches and date range filters.
    - **Instant Feedback Mechanism**: Fixed post-confirmation expense visibility bugs using session-based filter persistence.
    - **Split Liability Engine**: Developed net debt offset formulas with support for "Both" joint asset expense attributions.
*   **Lesson Learnt**: Household bookkeeping succeeds on speed of reconciliation and audit accuracy, not exhaustive data entry. Combining AI layouts with time filters significantly elevates user experience.

<a id="v2.1"></a>
### 🔹 Milestone V2.1: Infrastructure Hardening & UX Polish
*   **Development Scope (2026/03)**: Focused on API quota governance, filter layout hierarchy, and settlement history stability.
*   **Key Highlights**:
    - **Token & Performance Optimization**: Capped fuzzy matching bounds and historical context size to optimize load speeds and prevent AI token spikes.
    - **Layered Filter Hierarchy**: Separated "Date Range" and "Owner Attributer" into clear visual layers for intuitive filter adjustments.
    - **Error Boundary Protection**: Added client/server Error Boundaries to prevent full UI crashes from single malformed data rows.
    - **Settlement Audit Fix**: Resolved bugs where deleted expenses appeared in historical logs, maintaining audit consistency.
*   **Lesson Learnt**: Robust Error Boundaries and data sanitization are fundamental prerequisites for long-term system availability.

<a id="v2.2"></a>
### 🔹 Milestone V2.2: Flexible Filters & UI Refinement
*   **Development Scope (2026/03)**: Enhanced expense analytics dimensions and detailed interaction polish.
*   **Key Highlights**:
    - **Flexible Period Filtering**: Built Month/Quarter/Year 3-stage filters with dynamic daily averages and period comparisons.
    - **Modal Typography Polish**: Fixed close-button wrapping issues on mobile, boosted font size (+2pt), and improved reading comfort.
    - **Automated Workflow Optimization**: Implemented "Auto-check on edit" in batch mode, saving over 30% of user clicks.
    - **Mobile Layout Fixes**: Corrected bottom navigation alignment overflows across small-screen mobile devices.
    - **Stability Enhancements**: Delivered V2.2.9 stability and deadlock protections.
*   **Lesson Learnt**: Readability is priority #1 on mobile screens, and reducing user click-depth directly drives engagement.

<a id="v2.2.9"></a>
### 🔹 Milestone V2.2.9: System Stability & Report Sync Hotfix
*   **Development Scope (2026/03)**: Fixed persistent UI hangs and deadlock issues while bolstering historical report snapshot selection.
*   **Key Highlights**:
    - **Hang Safeguard Mechanism**: Implemented a 10-second safe timeout in `useExpenses` hook to prevent infinite spinners on dropped requests.
    - **Report Snapshot Selector**: Added a Snapshot Selector on `/report` page to load past settlement points with exact timestamp indicators.
    - **Settlement Logic Guarding**: Added strict Null Guards to `getSplitSettlement` server action to prevent rendering crashes on empty datasets.
    - **Modal Date Sync**: Fixed initialization bugs where `AllExpensesModal` failed to inherit parent date filter states.
    - **Core Query Optimization**: Refactored `getReportData` to use ID-based indexing for faster report loading.
*   **Lesson Learnt**: Complex asynchronous architectures require fallback transitions and timeout exits to ensure basic UX is never permanently locked.

<a id="v2.3.0"></a>
### 🔹 Milestone V2.3.0: Full EN/ZH Web App & Documentation Alignment
*   **Development Scope (2026/09)**: Achieved 100% English and Traditional Chinese localization across the Demo Web App, UI components, and GitHub Wiki documentation.
*   **Key Highlights**:
    - **Synchronous Language Hydration**: Optimized `LanguageContext` state initialization from URL (`?lang=en`) and `localStorage` before client mount, eliminating hydration delay and text flashing.
    - **Localized Server Actions**: Updated `dashboard.ts`, `goals.ts`, `planning.ts`, and `expenses.ts` to return full English mock data when `lang === 'en'`.
    - **UI Buttons, Modals & Alert Localization**: Translated all client dialogs, confirmation prompts (`confirm()`), and alert strings across `useExpenses.ts`, `SettlementSummary.tsx`, `StockPlanningNotes.tsx`, and `wizard/page.tsx`.
    - **Dynamic Docs Links Mapping**: Updated `Navbar.tsx` Docs dropdown to link directly to English Wiki pages (`User-Guide_en`, `Design-Document_en`, `Project-Work-Log_en`) when active language is English.
    - **GitHub & Wiki Dual Publishing**: Created `README_en.md` and full English Wiki docs, executing `sync-wiki.mjs` to auto-mirror changes to GitHub Wiki.
*   **Lesson Learnt**: Internationalization (i18n) extends far beyond UI text translation—it requires synchronizing server-side mock data, browser alerts, and documentation systems to deliver a seamless professional experience. Furthermore, Net Dev Hours in AI Pair-Programming mode should reflect actual real-time execution and prompt alignment hours, accounting for AI acceleration rather than traditional inflated manual estimates.

---

## 🌟 Project Highlights

1.  **Milestone-based Releases**: Evolved continuously from MVP (V1.0), UX polish (V1.1), strategy command center (V1.2), expense split (V2.0), up to full bilingual localization (V2.3).
2.  **Fully Automated Operations**: Automated market price sync, Demo write protection, and GitHub Wiki synchronization.
3.  **Modern Tech Stack**: Next.js 16 Server Actions + TypeScript + Gemini 2.5 Flash AI.

- [x] V1.0: Core foundation & password security.
- [x] V1.1: Mobile UX polish & data integrity.
- [x] V1.2: Investment strategy & TradingView integration.
- [x] V1.3: Hybrid responsive layout evolution.
- [x] V2.0: AI bookkeeping & expense split module.
- [x] V2.1: Infrastructure hardening & UX polish.
- [x] V2.2: Flexible period filters & UI refinement.
- [x] V2.2.9: System stability timeout hotfix.
- [x] V2.3.0: Full English demo web app & GitHub Wiki synchronization.
- [ ] Planned: Automated backtesting engine.

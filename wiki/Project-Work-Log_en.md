# PyKigo Finance Dashboard Project Work Log

🌐 **Language / 語言**: [繁體中文](Project-Work-Log) | **English**

This document records the key development milestones, architectural features, and lessons learnt from project inception to date.

---

## 📅 Development Progress Overview

| Milestone | Task Name | Key Deliverables | Net Dev Hours |
| :--- | :--- | :--- | :--- |
| **V1.0** | **Core Foundation** | Supabase architecture, Gemini AI insights, Dual-deployment setup, Password site security | 17h |
| **V1.1** | **Polish & Data Integrity** | Mobile-first UX, Ticker autocomplete, Strict Demo Mode write protection | 3h |
| **V1.2** | **Strategy & Deep Analysis** | TradingView integration, Ticker strategy notes, Command center Glassmorphism UI | 4h |
| **V1.3** | **Responsive Layout Evolution** | Hybrid desktop/mobile layouts, 600px mobile candlestick charts, Sticky notes panel | 3h |
| **Maintenance** | **Env Separation & Refactor** | Supabase Schema Sandbox (`dev` vs `public`), Script cleanup, Unified Supabase client | 2h |
| **V2.0** | **AI Accounting & Expense Split** | AI Inbox, Smart deduplication, Split net liability engine, Expenses UI | 6h |
| **V2.1** | **Infra & UX Polish** | Token optimization, Layered filter layout, Error boundary safeguards, Settlement history fixes | 4h |
| **V2.2** | **Filter & UI Refinement** | Month/Quarter/Year filter modes, Mobile typography polish, Auto-check on edit | 5h |
| **V2.2.9** | **Stability Hotfix** | Zombie process cleanup, 10s timeout protection, Settlement robustness, Date sync fixes | 1h |
| **V2.3.0** | **Full EN/ZH Localization** | Full Demo Web app English mock data, UI buttons/modals/alerts localization, Docs sync | 1.5h |

---

## 🛠 Milestone Highlights

- **V1.0 (Core Foundation)**: Multi-currency asset mapping, Supabase schema setup, Gemini AI feedback integration, and Vercel site protection.
- **V1.1 (Polish & Integrity)**: Touch-friendly mobile bottom nav, sticky filter banners, and strict mock data protection.
- **V1.2 (Strategy & Deep Analysis)**: Embedded TradingView charts, stock ticker strategy notes, and Glassmorphism styling.
- **V1.3 (Responsive Layout Evolution)**: Dual-mode desktop/mobile layouts optimizing chart space on mobile screens.
- **Maintenance (Schema Sandbox)**: Complete isolation of development testing in Supabase `dev` schema from production `public` schema.
- **V2.0 (AI Accounting & Split)**: Receipt import via Gemini, smart deduplication, net liability split settlement algorithm.
- **V2.2 (Filter & UI Refinement)**: Month/Quarter/Year filter views, responsive typography adjustments, and batch editing.
- **V2.2.9 (Stability Hotfix)**: 10s safe timeout protections for database requests, preventing UI freeze under bad network conditions.
- **V2.3.0 (Full EN/ZH Localization)**: Full Demo Web App English mock data, synchronous i18n state hydration, UI button/modal translations, and automatic Docs Wiki links mapping.

---

- [x] V1.0: Core foundation & password security
- [x] V1.1: Mobile UI polish & ticker autocomplete
- [x] V1.2: Investment strategy & TradingView integration
- [x] V1.3: Hybrid responsive layout evolution
- [x] V2.0: AI bookkeeping & expense split module
- [x] V2.1: Infrastructure hardening & UX polish
- [x] V2.2: Flexible period filters & UI refinement
- [x] V2.2.9: System stability timeout hotfix
- [x] V2.3.0: Full English demo web app & GitHub Wiki synchronization
- [ ] Planned: Automated backtesting engine

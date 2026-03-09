-- =====================================================================
-- RuiPYKigo Family Finance App - MOCK DATA (DEV)
-- Run this in your DEV Supabase project's SQL Editor
-- =====================================================================

-- 1. Insert Mock Assets
INSERT INTO assets (id, title, owner, asset_type, currency, ticker_symbol, is_active, avg_cost, dividend_yield, strategy_category)
VALUES 
    ('00000000-0000-0000-0000-000000000001', 'Nvidia Corp', 'PY', 'stock', 'USD', 'NVDA', true, 105.5, 0.02, '成長動能 (科技股)'),
    ('00000000-0000-0000-0000-000000000002', 'Vanguard S&P 500 ETF', 'Both', 'stock', 'USD', 'VOO', true, 450.0, 1.3, '核心持股 (大型股)'),
    ('00000000-0000-0000-0000-000000000003', '台積電', 'Kigo', 'stock', 'TWD', '2330.TW', true, 850.0, 1.5, '核心持股 (大型股)'),
    ('00000000-0000-0000-0000-000000000004', 'Apple Inc (RSU)', 'PY', 'rsu', 'USD', 'AAPL', true, 0, 0.45, '成長動能 (科技股)'),
    ('00000000-0000-0000-0000-000000000005', 'Realty Income', 'Both', 'stock', 'USD', 'O', true, 55.2, 5.5, '定存股 (領息資產)'),
    ('00000000-0000-0000-0000-000000000006', '玉山金', 'Kigo', 'stock', 'TWD', '2884.TW', true, 26.5, 4.2, '定存股 (領息資產)'),
    ('00000000-0000-0000-0000-000000000007', '國泰世華活存', 'PY', 'cash', 'TWD', NULL, true, 1, 0, '投機/現金資產'),
    ('00000000-0000-0000-0000-000000000008', '嘉信理財 USD', 'Both', 'cash', 'USD', NULL, true, 1, 0, '投機/現金資產')
ON CONFLICT (id) DO NOTHING;

-- 2. Insert a Mock Snapshot
INSERT INTO snapshots (id, period_name, start_date, end_date, ai_summary, notes)
VALUES 
    ('11111111-1111-1111-1111-111111111111', '2026 年 Q1 (Mock)', '2026-01-01', '2026-03-31', '這是模擬環境的 AI 總結，您的資產配置健康。', '開發測試用途')
ON CONFLICT (id) DO NOTHING;

-- 3. Insert Snapshot Records
INSERT INTO snapshot_records (snapshot_id, asset_id, quantity, unit_price, fx_rate, total_twd_value)
VALUES 
    ('11111111-1111-1111-1111-111111111111', '00000000-0000-0000-0000-000000000001', 100, 120, 32.5, 390000),      -- NVDA
    ('11111111-1111-1111-1111-111111111111', '00000000-0000-0000-0000-000000000002', 20, 520, 32.5, 338000),       -- VOO
    ('11111111-1111-1111-1111-111111111111', '00000000-0000-0000-0000-000000000003', 1000, 950, 1, 950000),        -- 2330
    ('11111111-1111-1111-1111-111111111111', '00000000-0000-0000-0000-000000000004', 50, 230, 32.5, 373750),       -- AAPL RSU
    ('11111111-1111-1111-1111-111111111111', '00000000-0000-0000-0000-000000000005', 200, 62, 32.5, 403000),       -- O
    ('11111111-1111-1111-1111-111111111111', '00000000-0000-0000-0000-000000000006', 5000, 28, 1, 140000),         -- 2884
    ('11111111-1111-1111-1111-111111111111', '00000000-0000-0000-0000-000000000007', 250000, 1, 1, 250000),        -- Cash TWD
    ('11111111-1111-1111-1111-111111111111', '00000000-0000-0000-0000-000000000008', 5000, 1, 32.5, 162500)        -- Cash USD
ON CONFLICT DO NOTHING;

-- 4. Insert Mock Strategy Notes
INSERT INTO strategy_targets (category, target_percentage, color)
VALUES 
    ('核心持股 (大型股)', 45, '#10b981'),
    ('成長動能 (科技股)', 30, '#6366f1'),
    ('定存股 (領息資產)', 15, '#f59e0b'),
    ('投機/現金資產', 10, '#94a3b8')
ON CONFLICT (category) DO UPDATE SET target_percentage = EXCLUDED.target_percentage;

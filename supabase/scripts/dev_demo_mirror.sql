-- =====================================================================
-- RuiPYKigo Family Finance App - FULL DEMO MIRROR (DEV)
-- This script replicates the exact Demo mode data (Dashboard, Goals, Reports)
-- =====================================================================

-- 0. Clean up existing data to avoid conflicts
TRUNCATE TABLE dev.expenses CASCADE;
TRUNCATE TABLE dev.settlements CASCADE;
TRUNCATE TABLE dev.snapshot_records CASCADE;
TRUNCATE TABLE dev.snapshots CASCADE;
TRUNCATE TABLE dev.goal_asset_mapping CASCADE;
TRUNCATE TABLE dev.goals CASCADE;
TRUNCATE TABLE dev.assets CASCADE;

-- 1. Insert Base Assets (Matching Demo IDs where possible for continuity)
-- R1: PY RSU (Global Tech)
INSERT INTO dev.assets (id, title, owner, asset_type, currency, ticker_symbol, is_active, avg_cost, strategy_category)
VALUES ('00000000-0000-0000-0000-000000000001', 'Global Tech RSU', 'PY', 'rsu', 'USD', 'NVDA', true, 0, '成長動能 (科技股)');

-- R2: PY Stock (MSFT/Growth focus)
INSERT INTO dev.assets (id, title, owner, asset_type, currency, ticker_symbol, is_active, avg_cost, strategy_category)
VALUES ('00000000-0000-0000-0000-000000000002', 'Microsoft Corp', 'PY', 'stock', 'USD', 'MSFT', true, 350, '成長動能 (科技股)');

-- R3: Kigo Stock (VOO/Core focus)
INSERT INTO dev.assets (id, title, owner, asset_type, currency, ticker_symbol, is_active, avg_cost, strategy_category)
VALUES ('00000000-0000-0000-0000-000000000003', 'Vanguard S&P 500', 'Kigo', 'stock', 'USD', 'VOO', true, 480, '核心持股 (大型股)');

-- R4: Both Cash (Family Reserve)
INSERT INTO dev.assets (id, title, owner, asset_type, currency, ticker_symbol, is_active, avg_cost, strategy_category)
VALUES ('00000000-0000-0000-0000-000000000004', 'Family Reserve Fund', 'Both', 'cash', 'TWD', NULL, true, 1, '投機/現金資產');

-- R5: Kigo Fixed Deposit (JPY)
INSERT INTO dev.assets (id, title, owner, asset_type, currency, ticker_symbol, is_active, avg_cost, strategy_category)
VALUES ('00000000-0000-0000-0000-000000000005', 'Japan Travel Fund', 'Kigo', 'fixed_deposit', 'JPY', NULL, true, 1, '投機/現金資產');

-- R6: Both Cash (Daily)
INSERT INTO dev.assets (id, title, owner, asset_type, currency, ticker_symbol, is_active, avg_cost, strategy_category)
VALUES ('00000000-0000-0000-0000-000000000006', 'Daily Expense Account', 'Both', 'cash', 'TWD', NULL, true, 1, '投機/現金資產');


-- 2. Insert Snapshots (Matching Demo Trend)
INSERT INTO dev.snapshots (id, period_name, created_at) VALUES 
('11111111-1111-1111-1111-111111111111', '2024/4', '2024-04-15 10:00:00+00'),
('11111111-1111-1111-1111-111111111112', '2024/5', '2024-05-15 10:00:00+00'),
('11111111-1111-1111-1111-111111111113', '2024/8', '2024-08-15 10:00:00+00'),
('11111111-1111-1111-1111-111111111114', '2025/5', '2025-05-15 10:00:00+00'),
('11111111-1111-1111-1111-111111111115', '2026/2', NOW());


-- 3. Insert Snapshot Records (Matching Demo raw_values)
-- Latest Snapshot (2026/2) - Total ~98.42M
INSERT INTO dev.snapshot_records (snapshot_id, asset_id, quantity, unit_price, fx_rate, total_twd_value) VALUES 
('11111111-1111-1111-1111-111111111115', '00000000-0000-0000-0000-000000000001', 2000, 280, 31.6, 17715600), -- RSU
('11111111-1111-1111-1111-111111111115', '00000000-0000-0000-0000-000000000002', 400, 420.5, 31.6, 49210000), -- Stock PY
('11111111-1111-1111-1111-111111111115', '00000000-0000-0000-0000-000000000003', 200, 520, 31.6, 11810400), -- Stock Kigo
('11111111-1111-1111-1111-111111111115', '00000000-0000-0000-0000-000000000004', 9842000, 1, 1, 9842000), -- Cash Both
('11111111-1111-1111-1111-111111111115', '00000000-0000-0000-0000-000000000005', 37853846, 1, 0.208, 7873600), -- JPY FD
('11111111-1111-1111-1111-111111111115', '00000000-0000-0000-0000-000000000006', 1968400, 1, 1, 1968400); -- Cash Both (R6)

-- Previous Snapshot (2025/5) - Total ~84M
INSERT INTO dev.snapshot_records (snapshot_id, asset_id, quantity, unit_price, fx_rate, total_twd_value) VALUES 
('11111111-1111-1111-1111-111111111114', '00000000-0000-0000-0000-000000000002', 400, 395.5, 31.6, 50000000),
('11111111-1111-1111-1111-111111111114', '00000000-0000-0000-0000-000000000004', 10000000, 1, 1, 10000000),
('11111111-1111-1111-1111-111111111114', '00000000-0000-0000-0000-000000000001', 1500, 316.5, 31.6, 15000000),
('11111111-1111-1111-1111-111111111114', '00000000-0000-0000-0000-000000000003', 150, 480, 31.6, 9000000);

-- Earlier Snapshots (Summarized)
-- 2024/8 (~62M)
INSERT INTO dev.snapshot_records (snapshot_id, asset_id, quantity, unit_price, fx_rate, total_twd_value) VALUES 
('11111111-1111-1111-1111-111111111113', '00000000-0000-0000-0000-000000000002', 3000, 369, 31.6, 35000000);
-- 2024/5 (~48.5M)
INSERT INTO dev.snapshot_records (snapshot_id, asset_id, quantity, unit_price, fx_rate, total_twd_value) VALUES 
('11111111-1111-1111-1111-111111111112', '00000000-0000-0000-0000-000000000002', 2000, 443, 31.6, 28000000);
-- 2024/4 (~42M)
INSERT INTO dev.snapshot_records (snapshot_id, asset_id, quantity, unit_price, fx_rate, total_twd_value) VALUES 
('11111111-1111-1111-1111-111111111111', '00000000-0000-0000-0000-000000000002', 1800, 439, 31.6, 25000000);


-- 4. Insert Demo Goals
INSERT INTO dev.goals (id, name, target_amount, category, target_date, status) VALUES 
('22222222-2222-2222-2222-222222222221', 'World Expedition 2027', 5000000, 'upcoming_expense', '2027-06-01', 'on_track'),
('22222222-2222-2222-2222-222222222222', 'Extreme Luxury Villa 2035', 85000000, 'long_term', '2035-12-31', 'on_track');


-- 5. Map Assets to Goals
-- World Expedition funded by RSU and Cash
INSERT INTO dev.goal_asset_mapping (goal_id, asset_id) VALUES 
('22222222-2222-2222-2222-222222222221', '00000000-0000-0000-0000-000000000001'), -- RSU
('22222222-2222-2222-2222-222222222221', '00000000-0000-0000-0000-000000000004'); -- Family Reserve

-- Luxury Villa funded by main stocks
INSERT INTO dev.goal_asset_mapping (goal_id, asset_id) VALUES 
('22222222-2222-2222-2222-222222222222', '00000000-0000-0000-0000-000000000002'); -- PY Stock

-- 6. Insert Mock Settlements
INSERT INTO dev.settlements (id, payer, payee, amount, settlement_date, notes) VALUES
('33333333-3333-3333-3333-333333333331', 'Kigo', 'PY', 15000, '2026-03-01', '二月家用結算'),
('33333333-3333-3333-3333-333333333332', 'PY', 'Kigo', 5000, '2026-02-15', '機票代墊結算');

-- 7. Insert Mock Expenses
-- Recent expenses (March)
INSERT INTO dev.expenses (amount, date, store_name, paid_by, paid_for, is_automated, is_duplicate, is_reviewed, project_label) VALUES
(1200, '2026-03-12', '週末聚餐', 'PY', 'Both', FALSE, FALSE, TRUE, 'general'),
(350, '2026-03-10', 'Uber', 'Kigo', 'Kigo', FALSE, FALSE, TRUE, 'general'),
(8500, '2026-03-08', '水電瓦斯', 'PY', 'Both', FALSE, FALSE, TRUE, 'general'),
(450, '2026-03-05', '超市採買', 'Both', 'Both', FALSE, FALSE, TRUE, 'general'),
(2100, '2026-03-02', '生活用品', 'Kigo', 'Both', FALSE, FALSE, TRUE, 'general');

-- Past expenses (February)
INSERT INTO dev.expenses (amount, date, store_name, paid_by, paid_for, is_automated, is_duplicate, is_reviewed, project_label) VALUES
(15000, '2026-02-28', '房租/房貸', 'PY', 'Both', FALSE, FALSE, TRUE, 'general'),
(3200, '2026-02-25', '電影與晚餐', 'Kigo', 'Both', FALSE, FALSE, TRUE, 'general'),
(800, '2026-02-20', '加油', 'PY', 'Both', FALSE, FALSE, TRUE, 'general'),
(4500, '2026-02-14', '情人節大餐', 'PY', 'Both', FALSE, FALSE, TRUE, 'general'),
(120, '2026-02-10', '咖啡', 'Kigo', 'Kigo', FALSE, FALSE, TRUE, 'general'),
(600, '2026-02-05', '網購', 'PY', 'PY', FALSE, FALSE, TRUE, 'general');

-- Settled expenses
INSERT INTO dev.expenses (amount, date, store_name, paid_by, paid_for, is_automated, is_duplicate, is_reviewed, project_label) VALUES
(25000, '2026-01-15', '上月房租', 'PY', 'Both', FALSE, FALSE, TRUE, 'general'),
(5000, '2026-01-20', '機票', 'Kigo', 'PY', FALSE, FALSE, TRUE, 'general');

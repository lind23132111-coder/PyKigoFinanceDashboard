-- Milestone V1.2: 投資策略指揮中心 (手動執行 SQL)
-- 請複製以下內容並貼上至 Supabase SQL Editor 執行

-- 1. 建立配置目標表
CREATE TABLE IF NOT EXISTS strategy_targets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category TEXT UNIQUE NOT NULL,
    target_percentage NUMERIC NOT NULL CHECK (target_percentage >= 0 AND target_percentage <= 100),
    color TEXT NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. 建立達成目標表
CREATE TABLE IF NOT EXISTS user_goals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    goal_name TEXT NOT NULL,
    target_monthly_income NUMERIC NOT NULL,
    currency TEXT DEFAULT 'TWD',
    is_active BOOLEAN DEFAULT TRUE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. 擴充資產表欄位
ALTER TABLE assets ADD COLUMN IF NOT EXISTS avg_cost NUMERIC DEFAULT 0;
ALTER TABLE assets ADD COLUMN IF NOT EXISTS dividend_yield NUMERIC DEFAULT 0;
ALTER TABLE assets ADD COLUMN IF NOT EXISTS strategy_category TEXT;

-- 4. 啟用 RLS
ALTER TABLE strategy_targets ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_goals ENABLE ROW LEVEL SECURITY;

-- 5. 設定存取權限 (開發模式)
CREATE POLICY "Allow public select strategy_targets" ON strategy_targets FOR SELECT USING (true);
CREATE POLICY "Allow public all strategy_targets" ON strategy_targets FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public select user_goals" ON user_goals FOR SELECT USING (true);
CREATE POLICY "Allow public all user_goals" ON user_goals FOR ALL USING (true) WITH CHECK (true);

-- 6. 寫入初始中文配置目標
INSERT INTO strategy_targets (category, target_percentage, color)
VALUES 
    ('核心持股 (大型股)', 45, '#10b981'),
    ('成長動能 (科技股)', 30, '#6366f1'),
    ('定存股 (領息資產)', 15, '#f59e0b'),
    ('投機/現金資產', 10, '#94a3b8')
ON CONFLICT (category) DO UPDATE SET category = EXCLUDED.category;

-- 7. 寫入預設理財目標 (可依需求調整)
INSERT INTO user_goals (goal_name, target_monthly_income)
VALUES ('金融自由 (Passive Income)', 50000)
ON CONFLICT DO NOTHING;

-- 8. 初始化現有資產分類
UPDATE assets SET strategy_category = '核心持股 (大型股)' WHERE asset_type = 'stock' AND strategy_category IS NULL;
UPDATE assets SET strategy_category = '成長動能 (科技股)' WHERE asset_type = 'rsu' AND strategy_category IS NULL;
UPDATE assets SET strategy_category = '投機/現金資產' WHERE asset_type IN ('cash', 'fixed_deposit') AND strategy_category IS NULL;

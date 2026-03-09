-- =====================================================================
-- RuiPYKigo Family Finance App - FULL SETUP (V1.2)
-- Run this in your NEW Supabase project's SQL Editor
-- =====================================================================

-- 0. Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Create Enums
DO $$ BEGIN
    CREATE TYPE asset_type_enum AS ENUM ('cash', 'stock', 'fixed_deposit', 'rsu');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE owner_enum AS ENUM ('PY', 'Kigo', 'Both');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE goal_status_enum AS ENUM ('on_track', 'warning', 'achieved');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE goal_category_enum AS ENUM ('upcoming_expense', 'long_term');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. Create Base Tables
CREATE TABLE IF NOT EXISTS members (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    color_theme TEXT
);

CREATE TABLE IF NOT EXISTS assets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    owner owner_enum NOT NULL,
    asset_type asset_type_enum NOT NULL,
    currency TEXT NOT NULL DEFAULT 'TWD',
    ticker_symbol TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    avg_cost NUMERIC DEFAULT 0, -- V1.2 Added
    dividend_yield NUMERIC DEFAULT 0, -- V1.2 Added
    strategy_category TEXT, -- V1.2 Added
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS market_cache (
    symbol TEXT PRIMARY KEY,
    price NUMERIC NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS snapshots (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    period_name TEXT NOT NULL,
    start_date DATE,
    end_date DATE,
    ai_summary TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS snapshot_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    snapshot_id UUID NOT NULL REFERENCES snapshots(id) ON DELETE CASCADE,
    asset_id UUID NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
    quantity NUMERIC NOT NULL DEFAULT 0,
    unit_price NUMERIC,
    fx_rate NUMERIC DEFAULT 1,
    total_twd_value NUMERIC NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS goals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    category goal_category_enum DEFAULT 'long_term',
    target_amount NUMERIC NOT NULL,
    target_date DATE,
    priority INTEGER DEFAULT 1,
    status goal_status_enum DEFAULT 'on_track',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS goal_asset_mapping (
    goal_id UUID NOT NULL REFERENCES goals(id) ON DELETE CASCADE,
    asset_id UUID NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (goal_id, asset_id)
);

-- 3. Milestone V1.2 Tables
CREATE TABLE IF NOT EXISTS strategy_targets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category TEXT UNIQUE NOT NULL,
    target_percentage NUMERIC NOT NULL CHECK (target_percentage >= 0 AND target_percentage <= 100),
    color TEXT NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_goals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    goal_name TEXT NOT NULL,
    target_monthly_income NUMERIC NOT NULL,
    currency TEXT DEFAULT 'TWD',
    is_active BOOLEAN DEFAULT TRUE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Enable RLS
ALTER TABLE members ENABLE ROW LEVEL SECURITY;
ALTER TABLE assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE market_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE snapshot_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE goal_asset_mapping ENABLE ROW LEVEL SECURITY;
ALTER TABLE strategy_targets ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_goals ENABLE ROW LEVEL SECURITY;

-- 5. Set RLS Policies (Development Mode)
CREATE POLICY "Public Access" ON members FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public Access" ON assets FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public Access" ON market_cache FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public Access" ON snapshots FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public Access" ON snapshot_records FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public Access" ON goals FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public Access" ON goal_asset_mapping FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public Access" ON strategy_targets FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public Access" ON user_goals FOR ALL USING (true) WITH CHECK (true);

-- 6. Initial Seed Data
INSERT INTO members (id, name, color_theme) VALUES 
('PY', 'PY', 'emerald'), ('Kigo', 'Kigo', 'amber'), ('Both', '共同', 'indigo')
ON CONFLICT (id) DO NOTHING;

INSERT INTO market_cache (symbol, price) VALUES
('USD/TWD', 32.5), ('JPY/TWD', 0.22)
ON CONFLICT (symbol) DO NOTHING;

INSERT INTO strategy_targets (category, target_percentage, color)
VALUES 
    ('核心持股 (大型股)', 45, '#10b981'),
    ('成長動能 (科技股)', 30, '#6366f1'),
    ('定存股 (領息資產)', 15, '#f59e0b'),
    ('投機/現金資產', 10, '#94a3b8')
ON CONFLICT (category) DO UPDATE SET category = EXCLUDED.category;

INSERT INTO user_goals (goal_name, target_monthly_income)
VALUES ('金融自由 (Passive Income)', 50000)
ON CONFLICT DO NOTHING;

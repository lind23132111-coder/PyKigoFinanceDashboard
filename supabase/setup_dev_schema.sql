-- ==========================================
-- Setup Development Schema
-- ==========================================

-- 1. Create the dev schema
CREATE SCHEMA IF NOT EXISTS dev;

-- 1.5 Grant permissions to API roles
GRANT USAGE ON SCHEMA dev TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA dev TO anon, authenticated, service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA dev TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA dev TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA dev GRANT ALL ON TABLES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA dev GRANT ALL ON ROUTINES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA dev GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;

-- 2. Create Enums in dev schema (if they don't exist)
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'asset_type_enum' AND typnamespace = 'dev'::regnamespace) THEN
        CREATE TYPE dev.asset_type_enum AS ENUM ('cash', 'stock', 'fixed_deposit', 'rsu');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'owner_enum' AND typnamespace = 'dev'::regnamespace) THEN
        CREATE TYPE dev.owner_enum AS ENUM ('PY', 'Kigo', 'Both');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'goal_status_enum' AND typnamespace = 'dev'::regnamespace) THEN
        CREATE TYPE dev.goal_status_enum AS ENUM ('on_track', 'warning', 'achieved');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'goal_category_enum' AND typnamespace = 'dev'::regnamespace) THEN
        CREATE TYPE dev.goal_category_enum AS ENUM ('upcoming_expense', 'long_term');
    END IF;
END $$;

-- 3. Create Tables in dev schema
CREATE TABLE IF NOT EXISTS dev.members (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    color_theme TEXT
);

CREATE TABLE IF NOT EXISTS dev.assets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    owner dev.owner_enum NOT NULL,
    asset_type dev.asset_type_enum NOT NULL,
    currency TEXT NOT NULL DEFAULT 'TWD',
    ticker_symbol TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    avg_cost NUMERIC DEFAULT 0,
    dividend_yield NUMERIC DEFAULT 0,
    strategy_category TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS dev.market_cache (
    symbol TEXT PRIMARY KEY,
    price NUMERIC NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS dev.snapshots (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    period_name TEXT NOT NULL,
    start_date DATE,
    end_date DATE,
    ai_summary TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS dev.snapshot_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    snapshot_id UUID NOT NULL REFERENCES dev.snapshots(id) ON DELETE CASCADE,
    asset_id UUID NOT NULL REFERENCES dev.assets(id) ON DELETE CASCADE,
    quantity NUMERIC NOT NULL DEFAULT 0,
    unit_price NUMERIC,
    fx_rate NUMERIC DEFAULT 1,
    total_twd_value NUMERIC NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS dev.goals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    category dev.goal_category_enum DEFAULT 'long_term',
    target_amount NUMERIC NOT NULL,
    target_date DATE,
    priority INTEGER DEFAULT 1,
    status dev.goal_status_enum DEFAULT 'on_track',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS dev.goal_asset_mapping (
    goal_id UUID NOT NULL REFERENCES dev.goals(id) ON DELETE CASCADE,
    asset_id UUID NOT NULL REFERENCES dev.assets(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (goal_id, asset_id)
);

-- Strategy & Planning
CREATE TABLE IF NOT EXISTS dev.strategy_targets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    category TEXT UNIQUE NOT NULL,
    target_percentage NUMERIC NOT NULL CHECK (target_percentage >= 0 AND target_percentage <= 100),
    color TEXT NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS dev.user_goals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    goal_name TEXT NOT NULL,
    target_monthly_income NUMERIC NOT NULL,
    currency TEXT DEFAULT 'TWD',
    is_active BOOLEAN DEFAULT TRUE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS dev.strategy_notes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    asset_id UUID NOT NULL REFERENCES dev.assets(id) ON DELETE CASCADE,
    target_price NUMERIC,
    exit_price NUMERIC,
    conviction_level TEXT,
    memo TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(asset_id)
);

-- Settlements & Expenses
CREATE TABLE IF NOT EXISTS dev.settlements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    payer dev.owner_enum NOT NULL,
    receiver dev.owner_enum NOT NULL,
    amount NUMERIC NOT NULL,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS dev.expenses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    amount NUMERIC NOT NULL,
    date DATE NOT NULL,
    category TEXT NOT NULL,
    description TEXT,
    paid_by dev.owner_enum NOT NULL,
    paid_for dev.owner_enum NOT NULL, 
    source_app TEXT, 
    raw_text TEXT,
    is_duplicate BOOLEAN DEFAULT FALSE,
    settlement_id UUID REFERENCES dev.settlements(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Enable RLS and Add Policies (Copying from public logic)
ALTER TABLE dev.members ENABLE ROW LEVEL SECURITY;
ALTER TABLE dev.assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE dev.market_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE dev.snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE dev.snapshot_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE dev.goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE dev.goal_asset_mapping ENABLE ROW LEVEL SECURITY;
ALTER TABLE dev.strategy_targets ENABLE ROW LEVEL SECURITY;
ALTER TABLE dev.user_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE dev.strategy_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE dev.settlements ENABLE ROW LEVEL SECURITY;
ALTER TABLE dev.expenses ENABLE ROW LEVEL SECURITY;

DO $$ 
DECLARE
    t text;
BEGIN
    FOR t IN SELECT table_name FROM information_schema.tables WHERE table_schema = 'dev'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS "Enable read access for all users" ON dev.%I', t);
        EXECUTE format('CREATE POLICY "Enable read access for all users" ON dev.%I FOR SELECT USING (true)', t);
        
        EXECUTE format('DROP POLICY IF EXISTS "Enable insert access for all users" ON dev.%I', t);
        EXECUTE format('CREATE POLICY "Enable insert access for all users" ON dev.%I FOR INSERT WITH CHECK (true)', t);
        
        EXECUTE format('DROP POLICY IF EXISTS "Enable update access for all users" ON dev.%I', t);
        EXECUTE format('CREATE POLICY "Enable update access for all users" ON dev.%I FOR UPDATE USING (true)', t);
    END LOOP;
END $$;

-- 5. Seed Initial Data for dev
INSERT INTO dev.members (id, name, color_theme) VALUES 
('PY', 'PY', 'emerald'),
('Kigo', 'Kigo', 'amber'),
('Both', '共同', 'indigo')
ON CONFLICT (id) DO NOTHING;

INSERT INTO dev.market_cache (symbol, price) VALUES
('USD/TWD', 32.5),
('JPY/TWD', 0.22)
ON CONFLICT (symbol) DO NOTHING;

-- Initial Strategy Targets
INSERT INTO dev.strategy_targets (category, target_percentage, color)
VALUES 
    ('核心持股 (大型股)', 45, '#10b981'),
    ('成長動能 (科技股)', 30, '#6366f1'),
    ('定存股 (領息資產)', 15, '#f59e0b'),
    ('投機/現金資產', 10, '#94a3b8')
ON CONFLICT (category) DO NOTHING;

-- Initial User Goals
INSERT INTO dev.user_goals (goal_name, target_monthly_income)
VALUES ('金融自由 (Passive Income)', 50000)
ON CONFLICT DO NOTHING;

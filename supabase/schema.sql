-- RuiPYKigo Family Finance App - Supabase Schema 

-- 1. members
CREATE TABLE members (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE
);

-- Insert default members
INSERT INTO members (name) VALUES ('PY'), ('Kigo'), ('Both');

-- 2. assets
CREATE TABLE assets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    member_id INT REFERENCES members(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    asset_type VARCHAR(50) NOT NULL CHECK (asset_type IN ('cash', 'stock', 'fixed_deposit')),
    currency VARCHAR(10) NOT NULL CHECK (currency IN ('USD', 'TWD', 'JPY')),
    ticker_symbol VARCHAR(50), -- Only relevant for stocks, nullable
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now())
);

-- 3. snapshots
CREATE TABLE snapshots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    period_name VARCHAR(50) NOT NULL UNIQUE, -- e.g., '2026_Q1'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()),
    notes TEXT
);

-- 4. snapshot_records
CREATE TABLE snapshot_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    snapshot_id UUID REFERENCES snapshots(id) ON DELETE CASCADE,
    asset_id UUID REFERENCES assets(id) ON DELETE CASCADE,
    quantity DECIMAL(15, 6) NOT NULL DEFAULT 0, -- shares or cash balance
    unit_price DECIMAL(15, 6) NOT NULL DEFAULT 1, -- price per share, 1 for cash
    fx_rate DECIMAL(15, 6) NOT NULL DEFAULT 1, -- exchange rate to TWD
    twd_value DECIMAL(15, 2) NOT NULL DEFAULT 0, -- calculated quantity * unit_price * fx_rate
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now())
);

-- 5. market_cache (for Python Pipeline to upsert)
CREATE TABLE market_cache (
    symbol VARCHAR(50) PRIMARY KEY, -- 'MU', 'GOOG', '0050.TW', 'USD/TWD', 'JPY/TWD'
    price DECIMAL(15, 6) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now())
);

-- Row Level Security (RLS) Setup
-- Note: Authentication is stubbed initially. In a production environment with Google OAuth,
-- you would restrict these based on auth.uid() matching a user mapping table.
-- For local development and initial testing with stubbed auth, we enable RLS but allow all anonymous/authenticated operations.

ALTER TABLE members ENABLE ROW LEVEL SECURITY;
ALTER TABLE assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE snapshot_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE market_cache ENABLE ROW LEVEL SECURITY;

-- Development policies (Open to all for stubbed auth phase)
CREATE POLICY "Enable all operations for members" ON members FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all operations for assets" ON assets FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all operations for snapshots" ON snapshots FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all operations for snapshot_records" ON snapshot_records FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all operations for market_cache" ON market_cache FOR ALL USING (true) WITH CHECK (true);

-- Indexes for performance
CREATE INDEX idx_assets_member_id ON assets(member_id);
CREATE INDEX idx_assets_type_active ON assets(asset_type, is_active);
CREATE INDEX idx_snapshot_records_snapshot_id ON snapshot_records(snapshot_id);
CREATE INDEX idx_snapshot_records_asset_id ON snapshot_records(asset_id);

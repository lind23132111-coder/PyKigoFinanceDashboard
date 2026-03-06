-- ---------------------------------------------------------------------
-- RuiPYKigo Family Finance App - Database Schema
-- Run this in your Supabase SQL Editor
-- ---------------------------------------------------------------------

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Create Enums
CREATE TYPE asset_type_enum AS ENUM ('cash', 'stock', 'fixed_deposit', 'rsu');
CREATE TYPE owner_enum AS ENUM ('PY', 'Kigo', 'Both');
CREATE TYPE goal_status_enum AS ENUM ('on_track', 'warning', 'achieved');

-- ---------------------------------------------------------------------
-- 2. Create Tables
-- ---------------------------------------------------------------------

-- Members (Optional, but good for normalisation if needed later)
CREATE TABLE members (
    id TEXT PRIMARY KEY, -- 'PY', 'Kigo', 'Both'
    name TEXT NOT NULL,
    color_theme TEXT
);

-- Assets (Master list of all accounts and trackable items)
CREATE TABLE assets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    owner owner_enum NOT NULL,
    asset_type asset_type_enum NOT NULL,
    currency TEXT NOT NULL DEFAULT 'TWD',
    ticker_symbol TEXT, -- e.g., 'NASDAQ:MU', 'TPE:0050'. Null for cash.
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Market Cache (Latest pulled prices for stocks and FX rates)
CREATE TABLE market_cache (
    symbol TEXT PRIMARY KEY, -- e.g., 'NASDAQ:MU', 'USD/TWD', 'JPY/TWD'
    price NUMERIC NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Snapshots (A single quarterly/event update record)
CREATE TABLE snapshots (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    period_name TEXT NOT NULL, -- e.g., '2026 年 Q1'
    start_date DATE,
    end_date DATE,
    ai_summary TEXT, -- Filled by Gemini after calculation
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Snapshot Records (The Fact Table: Values of assets at a specific snapshot point)
CREATE TABLE snapshot_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    snapshot_id UUID NOT NULL REFERENCES snapshots(id) ON DELETE CASCADE,
    asset_id UUID NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
    quantity NUMERIC NOT NULL DEFAULT 0, -- For stocks: shares. For cash: balance.
    unit_price NUMERIC, -- Recorded price at that exact time
    fx_rate NUMERIC DEFAULT 1, -- FX rate used to calculate TWD value
    total_twd_value NUMERIC NOT NULL, -- The final calculated TWD equivalent at that time
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Goals (Master list of financial goals)
CREATE TYPE goal_category_enum AS ENUM ('upcoming_expense', 'long_term');

CREATE TABLE goals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL, -- e.g., 'Japandi 新家軟裝'
    category goal_category_enum DEFAULT 'long_term',
    target_amount NUMERIC NOT NULL,
    target_date DATE,
    priority INTEGER DEFAULT 1,
    status goal_status_enum DEFAULT 'on_track',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Goal Asset Mapping (Junction table tracking which assets fund which goals)
CREATE TABLE goal_asset_mapping (
    goal_id UUID NOT NULL REFERENCES goals(id) ON DELETE CASCADE,
    asset_id UUID NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (goal_id, asset_id)
);

-- ---------------------------------------------------------------------
-- 3. Row Level Security (RLS) Policies
-- ---------------------------------------------------------------------

-- In a single-family system without Auth just yet, we can enable public access 
-- to get the app MVP running quickly. Later, we attach this to Google OAuth roles.

ALTER TABLE members ENABLE ROW LEVEL SECURITY;
ALTER TABLE assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE market_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE snapshot_records ENABLE ROW LEVEL SECURITY;

-- Allow anonymous read/write operations for MVP phase
CREATE POLICY "Enable read access for all users" ON members FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON members FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON members FOR UPDATE USING (true);

CREATE POLICY "Enable read access for all users" ON assets FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON assets FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON assets FOR UPDATE USING (true);

CREATE POLICY "Enable read access for all users" ON market_cache FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON market_cache FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON market_cache FOR UPDATE USING (true);

CREATE POLICY "Enable read access for all users" ON snapshots FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON snapshots FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON snapshots FOR UPDATE USING (true);

CREATE POLICY "Enable read access for all users" ON snapshot_records FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON snapshot_records FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON snapshot_records FOR UPDATE USING (true);

ALTER TABLE goals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable read access for all users" ON goals FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON goals FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON goals FOR UPDATE USING (true);

ALTER TABLE goal_asset_mapping ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable read access for all users" ON goal_asset_mapping FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON goal_asset_mapping FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON goal_asset_mapping FOR UPDATE USING (true);

-- ---------------------------------------------------------------------
-- 4. Initial Seed Data
-- ---------------------------------------------------------------------

-- Seed Members
INSERT INTO members (id, name, color_theme) VALUES 
('PY', 'PY', 'emerald'),
('Kigo', 'Kigo', 'amber'),
('Both', '共同', 'indigo')
ON CONFLICT (id) DO NOTHING;

-- Base Market Cache
INSERT INTO market_cache (symbol, price) VALUES
('USD/TWD', 32.5),
('JPY/TWD', 0.22)
ON CONFLICT (symbol) DO NOTHING;

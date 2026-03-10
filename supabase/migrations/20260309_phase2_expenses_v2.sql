-- Final refinement for Phase 2 Expenses based on app.mockup6.html
-- Drop existing tables if they were just created to ensure clean state with correct naming
DROP TABLE IF EXISTS expenses;
DROP TABLE IF EXISTS expense_categories;

-- 1. Create Categories Table
CREATE TABLE expense_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL UNIQUE,
    icon TEXT,
    color TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create Expenses Table
CREATE TABLE expenses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    store_name TEXT NOT NULL,
    amount DECIMAL(12, 2) NOT NULL CHECK (amount >= 0),
    currency TEXT NOT NULL DEFAULT 'TWD',
    category_id UUID REFERENCES expense_categories(id) ON DELETE SET NULL,
    project_label TEXT NOT NULL DEFAULT 'general', -- 'general', 'new_home', etc.
    goal_id UUID REFERENCES goals(id) ON DELETE SET NULL,
    paid_by TEXT NOT NULL DEFAULT 'PY', -- 'PY', 'Kigo'
    paid_for TEXT NOT NULL DEFAULT 'Both', -- 'Both', 'PY', 'Kigo'
    is_reviewed BOOLEAN NOT NULL DEFAULT false,
    is_automated BOOLEAN NOT NULL DEFAULT false,
    einvoice_id TEXT UNIQUE, -- For Taiwan E-Invoice de-duplication
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. RLS (Public Access for MVP)
ALTER TABLE expense_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public Read/Write Access" ON expense_categories FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public Read/Write Access" ON expenses FOR ALL USING (true) WITH CHECK (true);

-- 4. Seed Categories
INSERT INTO expense_categories (name, icon, color) VALUES
('餐飲外食', 'utensils', '#f59e0b'),
('日常採買', 'shopping-cart', '#3b82f6'),
('育兒用品', 'baby', '#f43f5e'),
('裝潢工程', 'hammer', '#6366f1'),
('軟裝家具', 'sofa', '#8b5cf6'),
('交通機票', 'plane', '#10b981'),
('水電瓦斯', 'zap', '#f97316');

-- 5. Indexes for Performance
CREATE INDEX idx_expenses_project ON expenses(project_label);
CREATE INDEX idx_expenses_goal ON expenses(goal_id);
CREATE INDEX idx_expenses_date ON expenses(date);
CREATE INDEX idx_expenses_reviewed ON expenses(is_reviewed);

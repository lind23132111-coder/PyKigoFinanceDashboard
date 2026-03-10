-- 20260310_add_settlements.sql
-- New table for tracking full and partial settlements between members

CREATE TABLE IF NOT EXISTS settlements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    settlement_date DATE NOT NULL DEFAULT CURRENT_DATE,
    amount DECIMAL(12, 2) NOT NULL CHECK (amount > 0),
    payer TEXT NOT NULL CHECK (payer IN ('PY', 'Kigo')),
    payee TEXT NOT NULL CHECK (payee IN ('PY', 'Kigo')),
    project_label TEXT NOT NULL DEFAULT 'all',
    goal_id UUID REFERENCES goals(id) ON DELETE SET NULL,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE settlements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public Read/Write Access" ON settlements FOR ALL USING (true) WITH CHECK (true);

-- Indexes
CREATE INDEX idx_settlements_date ON settlements(settlement_date);
CREATE INDEX idx_settlements_project ON settlements(project_label);
CREATE INDEX idx_settlements_goal ON settlements(goal_id);

-- Mock Data for History
INSERT INTO settlements (settlement_date, amount, payer, payee, project_label, notes) VALUES
('2026-02-15', 1200, 'Kigo', 'PY', 'general', '二月份部分生活費結清'),
('2026-03-01', 5000, 'PY', 'Kigo', 'new_home', '三月初裝修款預付清算');

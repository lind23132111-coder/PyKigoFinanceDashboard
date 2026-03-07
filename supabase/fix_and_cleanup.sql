-- ---------------------------------------------------------------------
-- Consoldated Fix: Create AI Feedback Table & Enable Deletion
-- Run this in your Supabase SQL Editor
-- ---------------------------------------------------------------------

-- 1. Create AI Feedback table if it doesn't exist
CREATE TABLE IF NOT EXISTS ai_summary_feedback (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    snapshot_id UUID REFERENCES snapshots(id) ON DELETE SET NULL,
    user_prompt TEXT NOT NULL,
    ai_response TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Enable RLS and missing policies
ALTER TABLE ai_summary_feedback ENABLE ROW LEVEL SECURITY;

-- Idempotent policy creation (using DO blocks to avoid "already exists" errors)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Enable delete access for all users' AND tablename = 'snapshots') THEN
        CREATE POLICY "Enable delete access for all users" ON snapshots FOR DELETE USING (true);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Enable delete access for all users' AND tablename = 'snapshot_records') THEN
        CREATE POLICY "Enable delete access for all users" ON snapshot_records FOR DELETE USING (true);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Enable delete access for all users' AND tablename = 'ai_summary_feedback') THEN
        CREATE POLICY "Enable delete access for all users" ON ai_summary_feedback FOR DELETE USING (true);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Enable delete access for all users' AND tablename = 'goals') THEN
        CREATE POLICY "Enable delete access for all users" ON goals FOR DELETE USING (true);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Enable delete access for all users' AND tablename = 'goal_asset_mapping') THEN
        CREATE POLICY "Enable delete access for all users" ON goal_asset_mapping FOR DELETE USING (true);
    END IF;
END $$;

-- 3. Perform the cleanup
DELETE FROM snapshots WHERE period_name = '2026/03';

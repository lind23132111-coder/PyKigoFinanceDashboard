-- ---------------------------------------------------------------------
-- Enable DELETE access for core tables
-- Run this in your Supabase SQL Editor to allow metadata/snapshot cleanup
-- ---------------------------------------------------------------------

-- Enable delete for snapshots
CREATE POLICY "Enable delete access for all users" ON snapshots FOR DELETE USING (true);

-- Enable delete for snapshot records (cascades usually, but policy needed)
CREATE POLICY "Enable delete access for all users" ON snapshot_records FOR DELETE USING (true);

-- Enable delete for AI feedback
CREATE POLICY "Enable delete access for all users" ON ai_summary_feedback FOR DELETE USING (true);

-- Enable delete for Goals (if needed)
CREATE POLICY "Enable delete access for all users" ON goals FOR DELETE USING (true);
CREATE POLICY "Enable delete access for all users" ON goal_asset_mapping FOR DELETE USING (true);

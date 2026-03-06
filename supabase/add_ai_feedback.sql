-- New table to store AI Feedback history
CREATE TABLE ai_summary_feedback (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    snapshot_id UUID REFERENCES snapshots(id) ON DELETE SET NULL, -- Optional link to the snapshot
    user_prompt TEXT NOT NULL, -- The feedback/instruction from the user
    ai_response TEXT NOT NULL, -- The resulting summary
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policies for the new table
ALTER TABLE ai_summary_feedback ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable read access for all users" ON ai_summary_feedback FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON ai_summary_feedback FOR INSERT WITH CHECK (true);


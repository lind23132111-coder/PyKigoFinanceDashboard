-- Add is_duplicate column to expenses table for AI Deduplication
ALTER TABLE expenses ADD COLUMN is_duplicate BOOLEAN NOT NULL DEFAULT false;

-- Create index for performance
CREATE INDEX idx_expenses_duplicate ON expenses(is_duplicate);

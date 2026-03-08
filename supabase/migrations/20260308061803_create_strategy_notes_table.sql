CREATE TABLE IF NOT EXISTS strategy_notes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ticker_symbol TEXT UNIQUE NOT NULL,
    note_content TEXT,
    target_buy_price NUMERIC,
    target_sell_price NUMERIC,
    confidence_level INTEGER CHECK (confidence_level >= 1 AND confidence_level <= 5),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE strategy_notes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read access" ON strategy_notes FOR SELECT USING (true);
CREATE POLICY "Allow public insert access" ON strategy_notes FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access" ON strategy_notes FOR UPDATE USING (true) WITH CHECK (true);


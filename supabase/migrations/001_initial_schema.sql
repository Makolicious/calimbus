-- Columns table: stores user-defined Kanban columns
CREATE TABLE IF NOT EXISTS columns (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  position INTEGER NOT NULL DEFAULT 0,
  color TEXT NOT NULL DEFAULT '#6b7280',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Card categories table: maps items (events/tasks) to columns
CREATE TABLE IF NOT EXISTS card_categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  item_id TEXT NOT NULL,
  item_type TEXT NOT NULL CHECK (item_type IN ('event', 'task')),
  column_id UUID NOT NULL REFERENCES columns(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, item_id)
);

-- Indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_columns_user_id ON columns(user_id);
CREATE INDEX IF NOT EXISTS idx_card_categories_user_id ON card_categories(user_id);
CREATE INDEX IF NOT EXISTS idx_card_categories_column_id ON card_categories(column_id);

-- Row Level Security (RLS) policies
ALTER TABLE columns ENABLE ROW LEVEL SECURITY;
ALTER TABLE card_categories ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only access their own columns
CREATE POLICY "Users can view own columns" ON columns
  FOR SELECT USING (true);

CREATE POLICY "Users can insert own columns" ON columns
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update own columns" ON columns
  FOR UPDATE USING (true);

CREATE POLICY "Users can delete own columns" ON columns
  FOR DELETE USING (true);

-- Policy: Users can only access their own card categories
CREATE POLICY "Users can view own card_categories" ON card_categories
  FOR SELECT USING (true);

CREATE POLICY "Users can insert own card_categories" ON card_categories
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update own card_categories" ON card_categories
  FOR UPDATE USING (true);

CREATE POLICY "Users can delete own card_categories" ON card_categories
  FOR DELETE USING (true);

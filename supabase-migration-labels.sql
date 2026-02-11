-- Migration: Add Labels/Tags System to Calimbus
-- Run this in Supabase SQL Editor (Dashboard > SQL Editor)

-- Create labels table
CREATE TABLE IF NOT EXISTS labels (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#6b7280',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create item_labels junction table
CREATE TABLE IF NOT EXISTS item_labels (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  item_id TEXT NOT NULL,
  label_id UUID NOT NULL REFERENCES labels(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(item_id, label_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_labels_user_id ON labels(user_id);
CREATE INDEX IF NOT EXISTS idx_item_labels_item_id ON item_labels(item_id);
CREATE INDEX IF NOT EXISTS idx_item_labels_label_id ON item_labels(label_id);

-- Enable RLS (Row Level Security)
ALTER TABLE labels ENABLE ROW LEVEL SECURITY;
ALTER TABLE item_labels ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for labels
CREATE POLICY "Users can view own labels" ON labels
  FOR SELECT USING (true);

CREATE POLICY "Users can insert own labels" ON labels
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update own labels" ON labels
  FOR UPDATE USING (true);

CREATE POLICY "Users can delete own labels" ON labels
  FOR DELETE USING (true);

-- Create RLS policies for item_labels
CREATE POLICY "Users can view item_labels" ON item_labels
  FOR SELECT USING (true);

CREATE POLICY "Users can insert item_labels" ON item_labels
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can delete item_labels" ON item_labels
  FOR DELETE USING (true);

-- Verify tables were created
SELECT 'labels table created' AS status, COUNT(*) AS count FROM labels
UNION ALL
SELECT 'item_labels table created' AS status, COUNT(*) AS count FROM item_labels;

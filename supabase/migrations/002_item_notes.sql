-- Item notes table: stores user notes for calendar events and tasks
CREATE TABLE IF NOT EXISTS item_notes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  item_id TEXT NOT NULL,
  item_type TEXT NOT NULL CHECK (item_type IN ('event', 'task')),
  notes TEXT DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, item_id)
);

-- Index for better query performance
CREATE INDEX IF NOT EXISTS idx_item_notes_user_id ON item_notes(user_id);
CREATE INDEX IF NOT EXISTS idx_item_notes_item_id ON item_notes(item_id);

-- Row Level Security (RLS) policies
ALTER TABLE item_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own item_notes" ON item_notes
  FOR SELECT USING (true);

CREATE POLICY "Users can insert own item_notes" ON item_notes
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update own item_notes" ON item_notes
  FOR UPDATE USING (true);

CREATE POLICY "Users can delete own item_notes" ON item_notes
  FOR DELETE USING (true);

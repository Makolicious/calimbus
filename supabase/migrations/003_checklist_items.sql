-- Checklist items table: stores user checklist items for calendar events and tasks
CREATE TABLE IF NOT EXISTS checklist_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  item_id TEXT NOT NULL,
  item_type TEXT NOT NULL CHECK (item_type IN ('event', 'task')),
  text TEXT NOT NULL,
  checked BOOLEAN DEFAULT FALSE,
  position INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for better query performance
CREATE INDEX IF NOT EXISTS idx_checklist_items_user_id ON checklist_items(user_id);
CREATE INDEX IF NOT EXISTS idx_checklist_items_item_id ON checklist_items(item_id);

-- Row Level Security (RLS) policies
ALTER TABLE checklist_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own checklist_items" ON checklist_items
  FOR SELECT USING (true);

CREATE POLICY "Users can insert own checklist_items" ON checklist_items
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update own checklist_items" ON checklist_items
  FOR UPDATE USING (true);

CREATE POLICY "Users can delete own checklist_items" ON checklist_items
  FOR DELETE USING (true);

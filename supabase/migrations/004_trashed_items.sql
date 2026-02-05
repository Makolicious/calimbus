-- Table to track trashed items and their previous column for restore
CREATE TABLE IF NOT EXISTS trashed_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  item_id TEXT NOT NULL,
  item_type TEXT NOT NULL CHECK (item_type IN ('event', 'task')),
  previous_column_id UUID NOT NULL,
  trashed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, item_id)
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_trashed_items_user_id ON trashed_items(user_id);
CREATE INDEX IF NOT EXISTS idx_trashed_items_item_id ON trashed_items(item_id);

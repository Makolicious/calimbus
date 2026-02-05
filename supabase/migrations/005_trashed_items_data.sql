-- Add item_data column to store full item info for restore
ALTER TABLE trashed_items
ADD COLUMN IF NOT EXISTS item_data JSONB;

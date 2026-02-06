-- Create event_details table for storing additional event info (location, description)
-- that doesn't sync to Google Calendar
CREATE TABLE IF NOT EXISTS event_details (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  location TEXT,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(event_id, user_id)
);

-- Enable RLS
ALTER TABLE event_details ENABLE ROW LEVEL SECURITY;

-- Create policy for users to see only their own event details
CREATE POLICY "Users can view own event details"
  ON event_details FOR SELECT
  USING (auth.uid()::text = user_id OR user_id = current_setting('request.jwt.claims', true)::json->>'sub');

-- Create policy for users to insert their own event details
CREATE POLICY "Users can insert own event details"
  ON event_details FOR INSERT
  WITH CHECK (auth.uid()::text = user_id OR user_id = current_setting('request.jwt.claims', true)::json->>'sub');

-- Create policy for users to update their own event details
CREATE POLICY "Users can update own event details"
  ON event_details FOR UPDATE
  USING (auth.uid()::text = user_id OR user_id = current_setting('request.jwt.claims', true)::json->>'sub');

-- Create policy for users to delete their own event details
CREATE POLICY "Users can delete own event details"
  ON event_details FOR DELETE
  USING (auth.uid()::text = user_id OR user_id = current_setting('request.jwt.claims', true)::json->>'sub');

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_event_details_event_id ON event_details(event_id);
CREATE INDEX IF NOT EXISTS idx_event_details_user_id ON event_details(user_id);

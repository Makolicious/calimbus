-- Webhook channels table: stores Google Calendar webhook subscriptions
CREATE TABLE IF NOT EXISTS webhook_channels (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  channel_id TEXT NOT NULL,
  resource_id TEXT,
  channel_type TEXT NOT NULL DEFAULT 'calendar',
  expiration TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, channel_type)
);

-- Pending updates table: stores notifications for polling clients
CREATE TABLE IF NOT EXISTS pending_updates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  update_type TEXT NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, update_type)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_webhook_channels_user_id ON webhook_channels(user_id);
CREATE INDEX IF NOT EXISTS idx_webhook_channels_channel_id ON webhook_channels(channel_id);
CREATE INDEX IF NOT EXISTS idx_pending_updates_user_id ON pending_updates(user_id);

-- Row Level Security
ALTER TABLE webhook_channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE pending_updates ENABLE ROW LEVEL SECURITY;

-- Policies for webhook_channels
CREATE POLICY "Users can view own webhook_channels" ON webhook_channels
  FOR SELECT USING (true);

CREATE POLICY "Users can insert own webhook_channels" ON webhook_channels
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update own webhook_channels" ON webhook_channels
  FOR UPDATE USING (true);

CREATE POLICY "Users can delete own webhook_channels" ON webhook_channels
  FOR DELETE USING (true);

-- Policies for pending_updates
CREATE POLICY "Users can view own pending_updates" ON pending_updates
  FOR SELECT USING (true);

CREATE POLICY "Users can insert own pending_updates" ON pending_updates
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update own pending_updates" ON pending_updates
  FOR UPDATE USING (true);

CREATE POLICY "Users can delete own pending_updates" ON pending_updates
  FOR DELETE USING (true);

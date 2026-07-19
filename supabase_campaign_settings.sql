-- ============================================
-- UPSHIFT CAMPAIGN SWITCHES (Video / Reddit)
-- Run this in your Supabase SQL Editor
-- Lets admins toggle the Video and Reddit campaigns
-- on/off from the Admin Dashboard. The portal sidebar,
-- dashboard and creator tools react to these flags.
-- ============================================

CREATE TABLE IF NOT EXISTS campaign_settings (
  key TEXT PRIMARY KEY,          -- 'video_campaign' | 'reddit_campaign'
  enabled BOOLEAN NOT NULL DEFAULT TRUE,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by UUID REFERENCES admin_users(id)
);

INSERT INTO campaign_settings (key, enabled) VALUES
  ('video_campaign', TRUE),
  ('reddit_campaign', TRUE)
ON CONFLICT (key) DO NOTHING;

ALTER TABLE campaign_settings ENABLE ROW LEVEL SECURITY;

-- Anyone can read the flags (portal + public /creator page need them)
DROP POLICY IF EXISTS "campaign_settings_read" ON campaign_settings;
CREATE POLICY "campaign_settings_read" ON campaign_settings
  FOR SELECT USING (true);

-- Only admins can flip the switches
DROP POLICY IF EXISTS "campaign_settings_admin_update" ON campaign_settings;
CREATE POLICY "campaign_settings_admin_update" ON campaign_settings
  FOR UPDATE
  USING (EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid()));

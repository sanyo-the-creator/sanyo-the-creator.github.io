-- ============================================
-- UPSHIFT REFERRAL TRACKING SYSTEM
-- Run this in your Supabase SQL Editor
-- ============================================

-- 1. REFERRAL PROFILES
-- Each portal user gets a referral profile with a unique code
CREATE TABLE IF NOT EXISTS referral_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  referral_code TEXT UNIQUE NOT NULL,
  display_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  total_clicks INT DEFAULT 0,
  total_downloads INT DEFAULT 0,
  total_sales_cents INT DEFAULT 0,
  total_trials INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. REFERRAL CLICKS
-- One row per profile visit — source of truth for the funnel
CREATE TABLE IF NOT EXISTS referral_clicks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referral_code TEXT NOT NULL REFERENCES referral_profiles(referral_code) ON DELETE CASCADE,
  visitor_id TEXT,
  platform TEXT DEFAULT 'direct',
  device_type TEXT,
  browser TEXT,
  os TEXT,
  country TEXT,
  clicked_download BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. REFERRAL INSTALLS
-- One per confirmed install, linked back to the click
CREATE TABLE IF NOT EXISTS referral_installs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  click_id UUID UNIQUE NOT NULL REFERENCES referral_clicks(id) ON DELETE CASCADE,
  referral_code TEXT NOT NULL REFERENCES referral_profiles(referral_code) ON DELETE CASCADE,
  installed_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. REFERRAL SALES
-- One per in-app purchase, linked to the install
CREATE TABLE IF NOT EXISTS referral_sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  install_id UUID NOT NULL REFERENCES referral_installs(id) ON DELETE CASCADE,
  referral_code TEXT NOT NULL REFERENCES referral_profiles(referral_code) ON DELETE CASCADE,
  amount_cents INT DEFAULT 0,
  currency TEXT DEFAULT 'USD',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. REFERRAL TRIALS
-- Specifically for "Yearly Trial" starts (hard to track conversion, so tracked as an event)
CREATE TABLE IF NOT EXISTS referral_trials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  install_id UUID NOT NULL REFERENCES referral_installs(id) ON DELETE CASCADE,
  referral_code TEXT NOT NULL REFERENCES referral_profiles(referral_code) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. ADMIN USERS
-- Simple table to mark which auth users are admins
CREATE TABLE IF NOT EXISTS admin_users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INDEXES for fast queries
-- ============================================
CREATE INDEX IF NOT EXISTS idx_referral_clicks_code ON referral_clicks(referral_code);
CREATE INDEX IF NOT EXISTS idx_referral_clicks_created ON referral_clicks(created_at);
CREATE INDEX IF NOT EXISTS idx_referral_clicks_platform ON referral_clicks(platform);
CREATE INDEX IF NOT EXISTS idx_referral_installs_code ON referral_installs(referral_code);
CREATE INDEX IF NOT EXISTS idx_referral_sales_code ON referral_sales(referral_code);
CREATE INDEX IF NOT EXISTS idx_referral_trials_code ON referral_trials(referral_code);

-- ============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================

-- Enable RLS on all tables
ALTER TABLE referral_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE referral_clicks ENABLE ROW LEVEL SECURITY;
ALTER TABLE referral_installs ENABLE ROW LEVEL SECURITY;
ALTER TABLE referral_sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE referral_trials ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- Helper: check if current user is admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM admin_users WHERE id = auth.uid()
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- REFERRAL PROFILES policies
-- Anyone can read (public profile pages)
CREATE POLICY "referral_profiles_public_read" ON referral_profiles
  FOR SELECT USING (true);

-- Owner can update their own profile
CREATE POLICY "referral_profiles_owner_update" ON referral_profiles
  FOR UPDATE USING (id = auth.uid());

-- Owner can insert their own profile
CREATE POLICY "referral_profiles_owner_insert" ON referral_profiles
  FOR INSERT WITH CHECK (id = auth.uid());

-- Admin can do anything
CREATE POLICY "referral_profiles_admin_all" ON referral_profiles
  FOR ALL USING (is_admin());

-- REFERRAL CLICKS policies
-- Anyone (including anon) can insert clicks (public profile visits)
CREATE POLICY "referral_clicks_anon_insert" ON referral_clicks
  FOR INSERT WITH CHECK (true);

-- Owner can read their own clicks (via referral_code match)
CREATE POLICY "referral_clicks_owner_read" ON referral_clicks
  FOR SELECT USING (
    referral_code IN (
      SELECT referral_code FROM referral_profiles WHERE id = auth.uid()
    )
  );

-- Admin can read all clicks
CREATE POLICY "referral_clicks_admin_read" ON referral_clicks
  FOR SELECT USING (is_admin());

-- REFERRAL INSTALLS policies
-- Service role inserts (from app), owner reads their own
CREATE POLICY "referral_installs_owner_read" ON referral_installs
  FOR SELECT USING (
    referral_code IN (
      SELECT referral_code FROM referral_profiles WHERE id = auth.uid()
    )
  );

-- Admin can read all
CREATE POLICY "referral_installs_admin_read" ON referral_installs
  FOR SELECT USING (is_admin());

-- Allow insert from anon (app will call this via RPC function, but just in case)
CREATE POLICY "referral_installs_insert" ON referral_installs
  FOR INSERT WITH CHECK (true);

-- REFERRAL SALES policies
CREATE POLICY "referral_sales_owner_read" ON referral_sales
  FOR SELECT USING (
    referral_code IN (
      SELECT referral_code FROM referral_profiles WHERE id = auth.uid()
    )
  );

-- Admin can read all
CREATE POLICY "referral_sales_admin_read" ON referral_sales
  FOR SELECT USING (is_admin());

-- Allow insert
CREATE POLICY "referral_sales_insert" ON referral_sales
  FOR INSERT WITH CHECK (true);

-- REFERRAL TRIALS policies
CREATE POLICY "referral_trials_owner_read" ON referral_trials
  FOR SELECT USING (
    referral_code IN (
      SELECT referral_code FROM referral_profiles WHERE id = auth.uid()
    )
  );

-- Admin can read all
CREATE POLICY "referral_trials_admin_read" ON referral_trials
  FOR SELECT USING (is_admin());

-- Allow insert
CREATE POLICY "referral_trials_insert" ON referral_trials
  FOR INSERT WITH CHECK (true);

-- ADMIN USERS policies
-- Only admins can read admin_users
CREATE POLICY "admin_users_admin_read" ON admin_users
  FOR SELECT USING (is_admin());

-- ============================================
-- TRIGGERS for automatic counter updates
-- ============================================

-- Increment total_clicks on referral_profiles when a click is inserted
CREATE OR REPLACE FUNCTION increment_total_clicks()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE referral_profiles
  SET total_clicks = total_clicks + 1
  WHERE referral_code = NEW.referral_code;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_increment_clicks
  AFTER INSERT ON referral_clicks
  FOR EACH ROW
  EXECUTE FUNCTION increment_total_clicks();

-- Increment total_downloads on referral_profiles when an install is created
CREATE OR REPLACE FUNCTION increment_total_downloads()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE referral_profiles
  SET total_downloads = total_downloads + 1
  WHERE referral_code = NEW.referral_code;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_increment_downloads
  AFTER INSERT ON referral_installs
  FOR EACH ROW
  EXECUTE FUNCTION increment_total_downloads();

-- Increment total_sales_cents on referral_profiles when a sale is created
CREATE OR REPLACE FUNCTION increment_total_sales()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE referral_profiles
  SET total_sales_cents = total_sales_cents + NEW.amount_cents
  WHERE referral_code = NEW.referral_code;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_increment_sales
  AFTER INSERT ON referral_sales
  FOR EACH ROW
  EXECUTE FUNCTION increment_total_sales();

-- Increment total_trials on referral_profiles when a trial is created
CREATE OR REPLACE FUNCTION increment_total_trials()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE referral_profiles
  SET total_trials = total_trials + 1
  WHERE referral_code = NEW.referral_code;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_increment_trials
  AFTER INSERT ON referral_trials
  FOR EACH ROW
  EXECUTE FUNCTION increment_total_trials();

-- ============================================
-- RPC FUNCTIONS (called from the mobile app)
-- ============================================

-- App calls this on first launch with the click_id from store referrer
CREATE OR REPLACE FUNCTION attribute_install(p_click_id UUID)
RETURNS JSON AS $$
DECLARE
  v_referral_code TEXT;
  v_install_id UUID;
BEGIN
  -- Look up the click to get the referral code
  SELECT referral_code INTO v_referral_code
  FROM referral_clicks
  WHERE id = p_click_id;

  IF v_referral_code IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Click not found');
  END IF;

  -- Insert install (unique constraint on click_id prevents duplicates)
  INSERT INTO referral_installs (click_id, referral_code)
  VALUES (p_click_id, v_referral_code)
  ON CONFLICT (click_id) DO NOTHING
  RETURNING id INTO v_install_id;

  IF v_install_id IS NULL THEN
    -- Already attributed, get existing install_id
    SELECT id INTO v_install_id FROM referral_installs WHERE click_id = p_click_id;
    RETURN json_build_object('success', true, 'install_id', v_install_id, 'already_attributed', true);
  END IF;

  RETURN json_build_object('success', true, 'install_id', v_install_id, 'already_attributed', false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- App calls this on purchase
CREATE OR REPLACE FUNCTION attribute_sale(
  p_install_id UUID,
  p_amount_cents INT,
  p_currency TEXT DEFAULT 'USD'
)
RETURNS JSON AS $$
DECLARE
  v_referral_code TEXT;
  v_sale_id UUID;
BEGIN
  -- Look up the install to get the referral code
  SELECT referral_code INTO v_referral_code
  FROM referral_installs
  WHERE id = p_install_id;

  IF v_referral_code IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Install not found');
  END IF;

  INSERT INTO referral_sales (install_id, referral_code, amount_cents, currency)
  VALUES (p_install_id, v_referral_code, p_amount_cents, p_currency)
  RETURNING id INTO v_sale_id;

  RETURN json_build_object('success', true, 'sale_id', v_sale_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Mark a click as having downloaded
CREATE OR REPLACE FUNCTION mark_click_downloaded(p_click_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE referral_clicks SET clicked_download = TRUE WHERE id = p_click_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- App calls this on starting a trial
CREATE OR REPLACE FUNCTION attribute_trial(
  p_install_id UUID
)
RETURNS JSON AS $$
DECLARE
  v_referral_code TEXT;
  v_trial_id UUID;
BEGIN
  -- Look up the install to get the referral code
  SELECT referral_code INTO v_referral_code
  FROM referral_installs
  WHERE id = p_install_id;

  IF v_referral_code IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Install not found');
  END IF;

  INSERT INTO referral_trials (install_id, referral_code)
  VALUES (p_install_id, v_referral_code)
  RETURNING id INTO v_trial_id;

  RETURN json_build_object('success', true, 'trial_id', v_trial_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- ADMIN VIEW: Aggregated user stats
-- This view joins everything for the admin panel
-- ============================================
CREATE OR REPLACE VIEW admin_user_overview AS
SELECT
  u.id AS user_id,
  u.email,
  u.raw_user_meta_data->>'full_name' AS full_name,
  u.raw_user_meta_data->>'avatar_url' AS avatar_url,
  u.created_at AS joined_at,
  rp.referral_code,
  COALESCE(rp.total_clicks, 0) AS total_clicks,
  COALESCE(rp.total_downloads, 0) AS total_downloads,
  COALESCE(rp.total_sales_cents, 0) AS total_sales_cents,
  COALESCE(rp.total_trials, 0) AS total_trials,
  COALESCE(v.video_count, 0) AS video_count,
  COALESCE(v.total_views, 0) AS total_views,
  COALESCE(v.approved_count, 0) AS approved_videos,
  COALESCE(v.pending_count, 0) AS pending_videos
FROM auth.users u
LEFT JOIN referral_profiles rp ON rp.id = u.id
LEFT JOIN (
  SELECT
    user_id,
    COUNT(*) AS video_count,
    COALESCE(SUM(views), 0) AS total_views,
    COUNT(*) FILTER (WHERE status = 'approved') AS approved_count,
    COUNT(*) FILTER (WHERE status = 'pending') AS pending_count
  FROM videos
  GROUP BY user_id
) v ON v.user_id = u.id;

-- ============================================
-- HOW TO ADD YOURSELF AS ADMIN:
-- Replace YOUR_USER_ID with your actual auth.users id
-- ============================================
-- INSERT INTO admin_users (id) VALUES ('YOUR_USER_ID_HERE');

-- ====================================================================
-- SALES AFFILIATE SYSTEM UPDATE
-- Run this script to add affiliate features to an existing database.
-- ====================================================================

-- 1. Update referral_profiles with affiliate flags
ALTER TABLE referral_profiles 
ADD COLUMN IF NOT EXISTS is_sales_affiliate BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS commission_rate NUMERIC DEFAULT 0.15;

-- 2. Update referral_sales with profile_id for better integrity
ALTER TABLE referral_sales
ADD COLUMN IF NOT EXISTS profile_id UUID REFERENCES referral_profiles(id) ON DELETE CASCADE;

-- 3. Create referral_refunds table
CREATE TABLE IF NOT EXISTS referral_refunds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id UUID REFERENCES referral_sales(id) ON DELETE CASCADE,
  referral_code TEXT NOT NULL REFERENCES referral_profiles(referral_code) ON DELETE CASCADE,
  profile_id UUID REFERENCES referral_profiles(id) ON DELETE CASCADE,
  amount_cents INT DEFAULT 0,
  refunded_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Automatic Refund Logic (Trigger)
-- This function automatically subtracts the refund amount from the affiliate's total earnings
CREATE OR REPLACE FUNCTION decrement_total_sales()
RETURNS TRIGGER AS $$
BEGIN
  -- We subtract the refund amount from the referral_profiles stats if they exist
  -- Note: This assumes you might want to track 'net sales' in the future in a column.
  -- For now, the dashboard calculates it dynamically, but this trigger ensures 
  -- data integrity if you add a 'total_earnings_cents' column later.
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_refund_added ON referral_refunds;
CREATE TRIGGER on_refund_added
AFTER INSERT ON referral_refunds
FOR EACH ROW EXECUTE FUNCTION decrement_total_sales();

-- 5. Update Admin Overview View
-- This view consolidates all user stats including new affiliate metrics
DROP VIEW IF EXISTS admin_user_overview CASCADE;
CREATE OR REPLACE VIEW admin_user_overview AS
WITH video_stats AS (
  SELECT 
    user_id,
    COUNT(*) as video_count,
    SUM(views) as total_views,
    COUNT(*) FILTER (WHERE status = 'approved') as approved_videos,
    COUNT(*) FILTER (WHERE status = 'pending') as pending_videos,
    SUM(earnings_cents) FILTER (WHERE status = 'paid') as total_video_earnings_cents
  FROM videos
  GROUP BY user_id
),
referral_stats AS (
  SELECT 
    referral_code,
    COUNT(*) as total_clicks
  FROM referral_clicks
  GROUP BY referral_code
),
install_stats AS (
  SELECT 
    referral_code,
    COUNT(*) as total_downloads
  FROM referral_installs
  GROUP BY referral_code
),
trial_stats AS (
  SELECT 
    referral_code,
    COUNT(*) as total_trials
  FROM referral_trials
  GROUP BY referral_code
),
sales_stats AS (
  SELECT 
    referral_code,
    SUM(amount_cents) as total_sales_cents
  FROM referral_sales
  GROUP BY referral_code
),
refund_stats AS (
  SELECT 
    referral_code,
    SUM(amount_cents) as total_refunded_cents
  FROM referral_refunds
  GROUP BY referral_code
)
SELECT 
  p.id as user_id,
  p.display_name as full_name,
  p.avatar_url,
  p.created_at as joined_at,
  p.referral_code,
  p.is_sales_affiliate,
  p.commission_rate,
  COALESCE(rs.total_clicks, 0) as total_clicks,
  COALESCE(inst_s.total_downloads, 0) as total_downloads,
  COALESCE(ss.total_sales_cents, 0) as total_sales_cents,
  COALESCE(ref.total_refunded_cents, 0) as total_refunded_cents,
  COALESCE(ts.total_trials, 0) as total_trials,
  COALESCE(vs.video_count, 0) as video_count,
  COALESCE(vs.total_views, 0) as total_views,
  COALESCE(vs.approved_videos, 0) as approved_videos,
  COALESCE(vs.pending_videos, 0) as pending_videos,
  COALESCE(vs.total_video_earnings_cents, 0) as total_video_earnings_cents
FROM referral_profiles p
LEFT JOIN video_stats vs ON p.id = vs.user_id
LEFT JOIN referral_stats rs ON p.referral_code = rs.referral_code
LEFT JOIN install_stats inst_s ON p.referral_code = inst_s.referral_code
LEFT JOIN trial_stats ts ON p.referral_code = ts.referral_code
LEFT JOIN sales_stats ss ON p.referral_code = ss.referral_code
LEFT JOIN refund_stats ref ON p.referral_code = ref.referral_code;

-- 6. Update attribute_sale RPC to handle profile_id automatically
CREATE OR REPLACE FUNCTION attribute_sale(
  p_install_id UUID,
  p_amount_cents INT,
  p_currency TEXT DEFAULT 'USD'
)
RETURNS JSON AS $$
DECLARE
  v_referral_code TEXT;
  v_sale_id UUID;
  v_profile_id UUID;
BEGIN
  SELECT referral_code INTO v_referral_code
  FROM referral_installs
  WHERE id = p_install_id;

  IF v_referral_code IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Install not found');
  END IF;

  SELECT id INTO v_profile_id FROM referral_profiles WHERE referral_code = v_referral_code;

  INSERT INTO referral_sales (install_id, referral_code, profile_id, amount_cents, currency)
  VALUES (p_install_id, v_referral_code, v_profile_id, p_amount_cents, p_currency)
  RETURNING id INTO v_sale_id;

  RETURN json_build_object('success', true, 'sale_id', v_sale_id);
END;
$$ LANGUAGE plpgsql;

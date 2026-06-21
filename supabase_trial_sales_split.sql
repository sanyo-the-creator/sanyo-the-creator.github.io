-- ====================================================================
-- SPLIT SALES INTO DIRECT SALES vs CONVERTED TRIALS
-- A row in referral_sales with trial = TRUE means a free trial that
-- converted into a paying subscription (the affiliate STILL earns on it).
-- trial = FALSE means a direct purchase.
-- Run after supabase_affiliate_update.sql.
-- ====================================================================

-- 1. Make sure the flag exists (it may already)
ALTER TABLE referral_sales
  ADD COLUMN IF NOT EXISTS trial BOOLEAN DEFAULT FALSE;

-- 2. Rebuild the admin overview view to expose the split.
--    total_sales_cents stays = everything (direct + converted trials) so
--    existing revenue/commission math is unchanged.
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
  SELECT referral_code, COUNT(*) as total_clicks
  FROM referral_clicks GROUP BY referral_code
),
install_stats AS (
  SELECT referral_code, COUNT(*) as total_downloads
  FROM referral_installs GROUP BY referral_code
),
trial_stats AS (
  SELECT referral_code, COUNT(*) as total_trials
  FROM referral_trials GROUP BY referral_code
),
sales_stats AS (
  SELECT
    referral_code,
    SUM(amount_cents) as total_sales_cents,
    -- direct purchases (trial = false / null)
    COUNT(*) FILTER (WHERE COALESCE(trial, false) = false) as direct_sales_count,
    COALESCE(SUM(amount_cents) FILTER (WHERE COALESCE(trial, false) = false), 0) as direct_sales_cents,
    -- trials that converted into a paying sale (trial = true)
    COUNT(*) FILTER (WHERE trial = true) as converted_trials_count,
    COALESCE(SUM(amount_cents) FILTER (WHERE trial = true), 0) as converted_trials_cents
  FROM referral_sales
  GROUP BY referral_code
),
refund_stats AS (
  SELECT referral_code, SUM(amount_cents) as total_refunded_cents
  FROM referral_refunds GROUP BY referral_code
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
  COALESCE(ss.direct_sales_count, 0) as direct_sales_count,
  COALESCE(ss.direct_sales_cents, 0) as direct_sales_cents,
  COALESCE(ss.converted_trials_count, 0) as converted_trials_count,
  COALESCE(ss.converted_trials_cents, 0) as converted_trials_cents,
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

-- 3. Let the app record whether a sale came from a converted trial.
CREATE OR REPLACE FUNCTION attribute_sale(
  p_install_id UUID,
  p_amount_cents INT,
  p_currency TEXT DEFAULT 'USD',
  p_trial BOOLEAN DEFAULT FALSE
)
RETURNS JSON AS $$
DECLARE
  v_referral_code TEXT;
  v_sale_id UUID;
  v_profile_id UUID;
BEGIN
  SELECT referral_code INTO v_referral_code
  FROM referral_installs WHERE id = p_install_id;

  IF v_referral_code IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Install not found');
  END IF;

  SELECT id INTO v_profile_id FROM referral_profiles WHERE referral_code = v_referral_code;

  INSERT INTO referral_sales (install_id, referral_code, profile_id, amount_cents, currency, trial)
  VALUES (p_install_id, v_referral_code, v_profile_id, p_amount_cents, p_currency, p_trial)
  RETURNING id INTO v_sale_id;

  RETURN json_build_object('success', true, 'sale_id', v_sale_id);
END;
$$ LANGUAGE plpgsql;

-- ====================================================================
-- SHOW ALL REGISTERED USERS IN THE ADMIN OVERVIEW
-- ====================================================================
-- Regression fix: supabase_trial_sales_split.sql rebuilt admin_user_overview
-- FROM referral_profiles, which hid every user that never became a creator
-- (e.g. people who just signed in with Discord and have no referral_code).
--
-- This rebuilds the view on auth.users LEFT JOIN referral_profiles so EVERY
-- registered user shows up. Creators keep all their referral/sales/video
-- stats; Discord-only users appear with a NULL referral_code and zeroed stats.
-- Keeps the direct-sales / converted-trials split from the trial migration.
--
-- Run AFTER supabase_trial_sales_split.sql.
-- ====================================================================

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
  u.id as user_id,
  u.email,
  -- Prefer the creator profile name/avatar, fall back to the Discord/OAuth metadata
  COALESCE(
    p.display_name,
    u.raw_user_meta_data->>'full_name',
    u.raw_user_meta_data->>'name'
  ) as full_name,
  COALESCE(p.avatar_url, u.raw_user_meta_data->>'avatar_url') as avatar_url,
  u.created_at as joined_at,
  p.referral_code,                               -- NULL for non-creators
  COALESCE(p.is_sales_affiliate, false) as is_sales_affiliate,
  COALESCE(p.commission_rate, 0) as commission_rate,
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
FROM auth.users u
LEFT JOIN referral_profiles p ON p.id = u.id
LEFT JOIN video_stats vs ON vs.user_id = u.id
LEFT JOIN referral_stats rs ON rs.referral_code = p.referral_code
LEFT JOIN install_stats inst_s ON inst_s.referral_code = p.referral_code
LEFT JOIN trial_stats ts ON ts.referral_code = p.referral_code
LEFT JOIN sales_stats ss ON ss.referral_code = p.referral_code
LEFT JOIN refund_stats ref ON ref.referral_code = p.referral_code
-- HARD SECURITY GATE: only admins ever get rows out of this view.
-- is_admin() is SECURITY DEFINER and returns true only for accounts listed in
-- admin_users. A non-admin (or anonymous) caller gets ZERO rows, so user
-- emails can never leak even if someone queries the view directly, bypassing
-- the app. Admins still see everyone.
WHERE is_admin();

-- Defense in depth: don't even expose the view to anonymous (logged-out) callers.
REVOKE ALL ON admin_user_overview FROM anon;
GRANT SELECT ON admin_user_overview TO authenticated;

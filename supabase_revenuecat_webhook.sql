-- ============================================================================
-- RevenueCat → Referral DB: refunds + trial→sale
-- Run once in the Supabase SQL editor of the REFERRAL project
-- (yxuqudsqjtaltrxpuush).
--
-- Earnings deduction on refund is ALREADY handled by the existing
-- `trigger_decrement_sales` trigger on referral_refunds (see
-- supabase_migration_referrals.sql). We only add:
--   1. a `trial` flag on referral_sales (distinguishes trial-converted sales)
--   2. a dedup table so RevenueCat webhook retries don't double-insert
-- ============================================================================

-- 1. Distinguish a sale that came from a converted trial (default false = a
--    normal direct purchase). The increment_total_sales trigger fires for
--    BOTH, so the affiliate is credited either way.
alter table referral_sales
  add column if not exists trial boolean not null default false;

-- 2. Idempotency: RevenueCat retries webhooks; store processed event ids so a
--    refund/sale is never applied twice.
create table if not exists revenuecat_events (
  event_id     text primary key,
  type         text,
  app_user_id  text,
  processed_at timestamptz default now()
);

alter table revenuecat_events enable row level security;
-- service_role (the Edge Function) bypasses RLS; no public policies needed.

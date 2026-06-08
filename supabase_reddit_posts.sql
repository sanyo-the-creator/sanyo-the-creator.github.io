-- ============================================
-- UPSHIFT REDDIT POST SUBMISSIONS
-- Run this in your Supabase SQL Editor
-- Mirrors the `videos` flow but with a Reddit-specific
-- payout structure and proof-of-views verification.
-- ============================================

-- 1. REDDIT POSTS
CREATE TABLE IF NOT EXISTS reddit_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  -- The public Reddit post link (must be unique to prevent re-submitting the same post)
  reddit_url TEXT NOT NULL,
  -- Screenshot of a second device refreshing the post, showing the live view count.
  -- This is how we confirm the creator is not lying about views.
  proof_video_url TEXT,
  -- Ordered list of the screenshots used in the post:
  --   [0] = Upshift app home page showing habit streaks (REQUIRED)
  --   [1]/[2] = app blocker screenshot etc.
  screenshot_urls TEXT[] DEFAULT '{}',
  -- Link to the comment posted from a SECOND account asking "what's the app?"
  -- (must be created within 1h of posting and visible during review)
  ask_comment_url TEXT,
  -- Link to the reply (from the original account) containing the App Store link
  -- (must be posted within ~10 min of the ask comment)
  app_link_reply_url TEXT,
  -- Views the creator is claiming at submission time
  views INTEGER DEFAULT 0,
  -- Final payout decided by a moderator on approval
  earnings_cents INTEGER DEFAULT 0,
  status TEXT DEFAULT 'pending', -- pending | approved | rejected | paid
  posted_at TIMESTAMPTZ,         -- when the Reddit post itself went live
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  rejection_reason TEXT,         -- reused for moderator message on approval too
  moderated_at TIMESTAMPTZ,
  moderated_by UUID REFERENCES admin_users(id),
  invoice_id UUID REFERENCES invoices(id) ON DELETE SET NULL
);

-- In case the table already existed in an older shape, make sure columns exist
ALTER TABLE reddit_posts ADD COLUMN IF NOT EXISTS proof_video_url TEXT;
ALTER TABLE reddit_posts ADD COLUMN IF NOT EXISTS screenshot_urls TEXT[] DEFAULT '{}';
ALTER TABLE reddit_posts ADD COLUMN IF NOT EXISTS ask_comment_url TEXT;
ALTER TABLE reddit_posts ADD COLUMN IF NOT EXISTS app_link_reply_url TEXT;
ALTER TABLE reddit_posts ADD COLUMN IF NOT EXISTS views INTEGER DEFAULT 0;
ALTER TABLE reddit_posts ADD COLUMN IF NOT EXISTS earnings_cents INTEGER DEFAULT 0;
ALTER TABLE reddit_posts ADD COLUMN IF NOT EXISTS posted_at TIMESTAMPTZ;
ALTER TABLE reddit_posts ADD COLUMN IF NOT EXISTS rejection_reason TEXT;
ALTER TABLE reddit_posts ADD COLUMN IF NOT EXISTS moderated_at TIMESTAMPTZ;
ALTER TABLE reddit_posts ADD COLUMN IF NOT EXISTS moderated_by UUID REFERENCES admin_users(id);
ALTER TABLE reddit_posts ADD COLUMN IF NOT EXISTS invoice_id UUID REFERENCES invoices(id) ON DELETE SET NULL;

-- Prevent the same post being submitted more than once (by anyone)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'unique_reddit_url') THEN
        ALTER TABLE reddit_posts ADD CONSTRAINT unique_reddit_url UNIQUE (reddit_url);
    END IF;
END;
$$;

CREATE INDEX IF NOT EXISTS idx_reddit_posts_user ON reddit_posts(user_id);
CREATE INDEX IF NOT EXISTS idx_reddit_posts_status ON reddit_posts(status);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================
ALTER TABLE reddit_posts ENABLE ROW LEVEL SECURITY;

-- Anyone can read (portal list / leaderboard)
DROP POLICY IF EXISTS "reddit_posts_public_read" ON reddit_posts;
CREATE POLICY "reddit_posts_public_read" ON reddit_posts
  FOR SELECT USING (true);

-- Owner can insert their own posts
DROP POLICY IF EXISTS "reddit_posts_owner_insert" ON reddit_posts;
CREATE POLICY "reddit_posts_owner_insert" ON reddit_posts
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Owner can update their own posts only while still pending
DROP POLICY IF EXISTS "reddit_posts_owner_update" ON reddit_posts;
CREATE POLICY "reddit_posts_owner_update" ON reddit_posts
  FOR UPDATE USING (user_id = auth.uid() AND status = 'pending');

-- Admin can do everything
DROP POLICY IF EXISTS "reddit_posts_admin_all" ON reddit_posts;
CREATE POLICY "reddit_posts_admin_all" ON reddit_posts
  FOR ALL USING (is_admin());

-- ============================================
-- STORAGE BUCKET for proof videos + screenshots
-- ============================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('reddit-proofs', 'reddit-proofs', true)
ON CONFLICT (id) DO NOTHING;

-- Authenticated users can upload into their own folder ({uid}/...)
DROP POLICY IF EXISTS "reddit_proofs_auth_upload" ON storage.objects;
CREATE POLICY "reddit_proofs_auth_upload" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'reddit-proofs'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Anyone can read (public bucket — needed so moderators & previews can view)
DROP POLICY IF EXISTS "reddit_proofs_public_read" ON storage.objects;
CREATE POLICY "reddit_proofs_public_read" ON storage.objects
  FOR SELECT USING (bucket_id = 'reddit-proofs');

-- Owner can delete/replace their own uploads
DROP POLICY IF EXISTS "reddit_proofs_owner_manage" ON storage.objects;
CREATE POLICY "reddit_proofs_owner_manage" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'reddit-proofs' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "reddit_proofs_owner_delete" ON storage.objects;
CREATE POLICY "reddit_proofs_owner_delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'reddit-proofs' AND (storage.foldername(name))[1] = auth.uid()::text);

-- ============================================
-- INVOICES: allow linking paid reddit posts
-- ============================================
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS reddit_post_ids UUID[] DEFAULT '{}';
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'video'; -- 'video' | 'reddit'

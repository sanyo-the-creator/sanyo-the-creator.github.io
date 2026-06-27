-- ====================================================================
-- ALLOW ANY LOGGED-IN USER TO SUBMIT REDDIT POSTS (no referral code needed)
-- ====================================================================
-- Reddit submissions don't require a referral code (only the video flow does).
-- In the live DB reddit_posts.user_id ended up pointing at referral_profiles,
-- so Discord-only users (who never created a referral profile) hit a foreign
-- key error (23503 -> "set up your Referral Username first") when submitting.
--
-- This repoints the FK to auth.users(id), so every authenticated user can
-- submit Reddit posts. Creators/affiliates are unaffected (they're in
-- auth.users too).
--
-- Run in the Supabase SQL Editor.
-- ====================================================================

-- Drop whatever FK currently constrains reddit_posts.user_id, regardless of
-- which table it points at (referral_profiles, profiles, or auth.users).
DO $$
DECLARE
  fk RECORD;
BEGIN
  FOR fk IN
    SELECT con.conname
    FROM pg_constraint con
    JOIN pg_class rel ON rel.oid = con.conrelid
    JOIN pg_attribute att
      ON att.attrelid = con.conrelid
     AND att.attnum = ANY (con.conkey)
    WHERE rel.relname = 'reddit_posts'
      AND con.contype = 'f'
      AND att.attname = 'user_id'
  LOOP
    EXECUTE format('ALTER TABLE reddit_posts DROP CONSTRAINT %I', fk.conname);
  END LOOP;
END $$;

-- Re-add the FK against auth.users so any authenticated account qualifies.
ALTER TABLE reddit_posts
  ADD CONSTRAINT reddit_posts_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

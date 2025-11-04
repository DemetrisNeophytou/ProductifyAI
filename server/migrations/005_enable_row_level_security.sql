/**
 * ============================================================================
 * MIGRATION 005: Enable Row Level Security (RLS) on All User-Facing Tables
 * ============================================================================
 * 
 * Purpose:
 * --------
 * This migration enables Row Level Security (RLS) on all user-facing tables
 * to ensure users can only access their own data. This is a critical security
 * measure to prevent unauthorized data access.
 * 
 * Tables Secured:
 * ---------------
 * - users (self-access only)
 * - projects (owner-access only)
 * - brand_kits (owner-access only)
 * - pages (via project ownership)
 * - blocks (via page/project ownership)
 * - user_niches (owner-access only)
 * - orders (buyer or seller access)
 * - usage_credits (owner-access only)
 * - media (owner-access only)
 * - social_packs (via project ownership)
 * - metrics_events (owner-access only)
 * 
 * Admin Override:
 * ---------------
 * Admin users (role = 'admin') can access all data for support purposes.
 * 
 * Rollback:
 * ---------
 * See migration 007_rls_rollback.sql for rollback procedure.
 * 
 * WARNING:
 * --------
 * This migration will restrict data access. Ensure your application properly
 * sets the auth context before running queries. Test thoroughly!
 * 
 * ============================================================================
 */

-- Helper function to get current user ID
-- In Supabase, this would use auth.uid()
-- In custom Postgres setup, use current_setting('app.current_user_id')::varchar
CREATE OR REPLACE FUNCTION get_current_user_id() RETURNS varchar AS $$
BEGIN
  -- Try Supabase auth first
  BEGIN
    RETURN auth.uid()::varchar;
  EXCEPTION
    WHEN undefined_function THEN
      -- Fallback to custom setting
      RETURN current_setting('app.current_user_id', true)::varchar;
  END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to check if current user is admin
CREATE OR REPLACE FUNCTION is_admin() RETURNS boolean AS $$
DECLARE
  user_role varchar;
BEGIN
  SELECT role INTO user_role FROM users WHERE id = get_current_user_id();
  RETURN user_role = 'admin';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- USERS TABLE
-- ============================================================================
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Users can only see their own profile (or admins can see all)
CREATE POLICY "users_select_own" ON users
  FOR SELECT
  USING (id = get_current_user_id() OR is_admin());

-- Users can update their own profile (or admins can update any)
CREATE POLICY "users_update_own" ON users
  FOR UPDATE
  USING (id = get_current_user_id() OR is_admin());

-- Only service role can insert users (handled by auth system)
-- No INSERT policy = only service role can insert

-- Only service role can delete users
-- No DELETE policy = only service role can delete

-- ============================================================================
-- BRAND_KITS TABLE
-- ============================================================================
ALTER TABLE brand_kits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "brand_kits_all" ON brand_kits
  FOR ALL
  USING (user_id = get_current_user_id() OR is_admin());

-- ============================================================================
-- PROJECTS TABLE
-- ============================================================================
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "projects_all" ON projects
  FOR ALL
  USING (user_id = get_current_user_id() OR is_admin());

-- ============================================================================
-- PAGES TABLE
-- ============================================================================
ALTER TABLE pages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "pages_all" ON pages
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = pages.project_id
      AND (projects.user_id = get_current_user_id() OR is_admin())
    )
  );

-- ============================================================================
-- BLOCKS TABLE
-- ============================================================================
ALTER TABLE blocks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "blocks_all" ON blocks
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM pages
      JOIN projects ON projects.id = pages.project_id
      WHERE pages.id = blocks.page_id
      AND (projects.user_id = get_current_user_id() OR is_admin())
    )
  );

-- ============================================================================
-- USER_NICHES TABLE
-- ============================================================================
ALTER TABLE user_niches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_niches_all" ON user_niches
  FOR ALL
  USING (user_id = get_current_user_id() OR is_admin());

-- ============================================================================
-- ORDERS TABLE (Buyer or Seller can access)
-- ============================================================================
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "orders_select" ON orders
  FOR SELECT
  USING (
    buyer_id = get_current_user_id() 
    OR seller_id = get_current_user_id() 
    OR is_admin()
  );

-- Only service role can insert/update/delete orders
CREATE POLICY "orders_insert_service_only" ON orders
  FOR INSERT
  WITH CHECK (is_admin());

CREATE POLICY "orders_update_service_only" ON orders
  FOR UPDATE
  USING (is_admin());

-- ============================================================================
-- USAGE_CREDITS TABLE
-- ============================================================================
ALTER TABLE usage_credits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "usage_credits_select_own" ON usage_credits
  FOR SELECT
  USING (user_id = get_current_user_id() OR is_admin());

-- Only service role can insert credits
CREATE POLICY "usage_credits_insert_service_only" ON usage_credits
  FOR INSERT
  WITH CHECK (is_admin());

-- ============================================================================
-- MEDIA TABLE
-- ============================================================================
ALTER TABLE media ENABLE ROW LEVEL SECURITY;

CREATE POLICY "media_all" ON media
  FOR ALL
  USING (
    user_id::varchar = get_current_user_id() 
    OR is_admin()
    OR EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = media.project_id
      AND projects.user_id = get_current_user_id()
    )
  );

-- ============================================================================
-- SOCIAL_PACKS TABLE
-- ============================================================================
ALTER TABLE social_packs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "social_packs_all" ON social_packs
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = social_packs.project_id
      AND (projects.user_id = get_current_user_id() OR is_admin())
    )
  );

-- ============================================================================
-- METRICS_EVENTS TABLE
-- ============================================================================
ALTER TABLE metrics_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "metrics_events_all" ON metrics_events
  FOR ALL
  USING (
    user_id::varchar = get_current_user_id() 
    OR is_admin()
    OR EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = metrics_events.project_id
      AND projects.user_id = get_current_user_id()
    )
  );

-- ============================================================================
-- KB_DOCUMENTS TABLE (Admin-only access)
-- ============================================================================
ALTER TABLE kb_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "kb_documents_select_all" ON kb_documents
  FOR SELECT
  USING (true); -- All users can read knowledge base

CREATE POLICY "kb_documents_modify_admin_only" ON kb_documents
  FOR ALL
  USING (is_admin());

-- ============================================================================
-- KB_CHUNKS TABLE (Admin-only modify, all can read)
-- ============================================================================
ALTER TABLE kb_chunks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "kb_chunks_select_all" ON kb_chunks
  FOR SELECT
  USING (true); -- All users can read chunks for RAG

CREATE POLICY "kb_chunks_modify_admin_only" ON kb_chunks
  FOR ALL
  USING (is_admin());

-- ============================================================================
-- SUBSCRIPTIONS TABLE (User can see own)
-- ============================================================================
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "subscriptions_select_own" ON subscriptions
  FOR SELECT
  USING (user_id = get_current_user_id() OR is_admin());

-- Only service role can modify subscriptions
CREATE POLICY "subscriptions_modify_service_only" ON subscriptions
  FOR ALL
  USING (is_admin());

-- ============================================================================
-- COMPLETION LOG
-- ============================================================================
DO $$ 
BEGIN
  RAISE NOTICE '============================================================================';
  RAISE NOTICE 'Row Level Security (RLS) has been ENABLED on all user-facing tables.';
  RAISE NOTICE '';
  RAISE NOTICE 'Tables Secured:';
  RAISE NOTICE '  ✓ users';
  RAISE NOTICE '  ✓ brand_kits';
  RAISE NOTICE '  ✓ projects';
  RAISE NOTICE '  ✓ pages';
  RAISE NOTICE '  ✓ blocks';
  RAISE NOTICE '  ✓ user_niches';
  RAISE NOTICE '  ✓ orders';
  RAISE NOTICE '  ✓ usage_credits';
  RAISE NOTICE '  ✓ media';
  RAISE NOTICE '  ✓ social_packs';
  RAISE NOTICE '  ✓ metrics_events';
  RAISE NOTICE '  ✓ kb_documents';
  RAISE NOTICE '  ✓ kb_chunks';
  RAISE NOTICE '  ✓ subscriptions';
  RAISE NOTICE '';
  RAISE NOTICE 'IMPORTANT:';
  RAISE NOTICE '  - Set app.current_user_id before queries: SET LOCAL app.current_user_id = ''user-id-here'';';
  RAISE NOTICE '  - Or use Supabase auth.uid() context';
  RAISE NOTICE '  - Admin users (role=admin) can access all data';
  RAISE NOTICE '  - Test thoroughly before deploying to production!';
  RAISE NOTICE '';
  RAISE NOTICE 'Rollback: Run migration 007_rls_rollback.sql';
  RAISE NOTICE '============================================================================';
END $$;


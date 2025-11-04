/**
 * ============================================================================
 * MIGRATION 007: Rollback Script for Row Level Security (RLS)
 * ============================================================================
 * 
 * Purpose:
 * --------
 * This script DISABLES Row Level Security on all tables if needed for
 * troubleshooting or emergency rollback. Use with caution!
 * 
 * WARNING:
 * --------
 * Running this script will REMOVE all data access restrictions.
 * Only run this if absolutely necessary and re-enable RLS ASAP.
 * 
 * Usage:
 * ------
 * psql -d your_database -f server/migrations/007_rls_rollback.sql
 * 
 * ============================================================================
 */

DO $$ 
BEGIN
  RAISE NOTICE '============================================================================';
  RAISE NOTICE 'WARNING: You are about to DISABLE Row Level Security (RLS)!';
  RAISE NOTICE 'This will remove all data access restrictions.';
  RAISE NOTICE '';
  RAISE NOTICE 'Press Ctrl+C now to cancel, or wait 5 seconds to continue...';
  RAISE NOTICE '============================================================================';
  PERFORM pg_sleep(5);
END $$;

-- ============================================================================
-- DISABLE RLS ON ALL TABLES
-- ============================================================================

ALTER TABLE users DISABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "users_select_own" ON users;
DROP POLICY IF EXISTS "users_update_own" ON users;

ALTER TABLE brand_kits DISABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "brand_kits_all" ON brand_kits;

ALTER TABLE projects DISABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "projects_all" ON projects;

ALTER TABLE pages DISABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "pages_all" ON pages;

ALTER TABLE blocks DISABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "blocks_all" ON blocks;

ALTER TABLE user_niches DISABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "user_niches_all" ON user_niches;

ALTER TABLE orders DISABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "orders_select" ON orders;
DROP POLICY IF EXISTS "orders_insert_service_only" ON orders;
DROP POLICY IF EXISTS "orders_update_service_only" ON orders;

ALTER TABLE usage_credits DISABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "usage_credits_select_own" ON usage_credits;
DROP POLICY IF EXISTS "usage_credits_insert_service_only" ON usage_credits;

ALTER TABLE media DISABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "media_all" ON media;

ALTER TABLE social_packs DISABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "social_packs_all" ON social_packs;

ALTER TABLE metrics_events DISABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "metrics_events_all" ON metrics_events;

ALTER TABLE kb_documents DISABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "kb_documents_select_all" ON kb_documents;
DROP POLICY IF EXISTS "kb_documents_modify_admin_only" ON kb_documents;

ALTER TABLE kb_chunks DISABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "kb_chunks_select_all" ON kb_chunks;
DROP POLICY IF EXISTS "kb_chunks_modify_admin_only" ON kb_chunks;

ALTER TABLE subscriptions DISABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "subscriptions_select_own" ON subscriptions;
DROP POLICY IF EXISTS "subscriptions_modify_service_only" ON subscriptions;

ALTER TABLE auth_events DISABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "auth_events_admin_only" ON auth_events;

-- ============================================================================
-- DROP HELPER FUNCTIONS
-- ============================================================================
DROP FUNCTION IF EXISTS get_current_user_id();
DROP FUNCTION IF EXISTS is_admin();

-- ============================================================================
-- COMPLETION LOG
-- ============================================================================
DO $$ 
BEGIN
  RAISE NOTICE '============================================================================';
  RAISE NOTICE 'Row Level Security (RLS) has been DISABLED on all tables.';
  RAISE NOTICE '';
  RAISE NOTICE 'Tables Affected:';
  RAISE NOTICE '  ✗ users';
  RAISE NOTICE '  ✗ brand_kits';
  RAISE NOTICE '  ✗ projects';
  RAISE NOTICE '  ✗ pages';
  RAISE NOTICE '  ✗ blocks';
  RAISE NOTICE '  ✗ user_niches';
  RAISE NOTICE '  ✗ orders';
  RAISE NOTICE '  ✗ usage_credits';
  RAISE NOTICE '  ✗ media';
  RAISE NOTICE '  ✗ social_packs';
  RAISE NOTICE '  ✗ metrics_events';
  RAISE NOTICE '  ✗ kb_documents';
  RAISE NOTICE '  ✗ kb_chunks';
  RAISE NOTICE '  ✗ subscriptions';
  RAISE NOTICE '  ✗ auth_events';
  RAISE NOTICE '';
  RAISE NOTICE 'IMPORTANT:';
  RAISE NOTICE '  ⚠️  Data access is now UNRESTRICTED!';
  RAISE NOTICE '  ⚠️  Re-enable RLS as soon as possible!';
  RAISE NOTICE '  ⚠️  Run migration 005_enable_row_level_security.sql to restore';
  RAISE NOTICE '============================================================================';
END $$;


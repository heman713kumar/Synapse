-- ============================================================================
-- SYNAPSE DATABASE - COMPLETE INVENTORY
-- ============================================================================
-- Run this query in Supabase SQL Editor to see everything in your database
-- ============================================================================

-- ============================================================================
-- 1. ALL TABLES WITH ROW COUNTS
-- ============================================================================

SELECT 
  schemaname,
  tablename,
  (SELECT count(*) FROM information_schema.columns WHERE table_name = tablename AND table_schema = schemaname) as column_count,
  CASE WHEN schemaname = 'public' THEN 
    (SELECT count(*) FROM information_schema.table_constraints WHERE table_name = tablename AND constraint_type = 'PRIMARY KEY') 
  ELSE 0 END as pk_count
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY tablename;

-- ============================================================================
-- 2. ALL COLUMNS IN USERS TABLE
-- ============================================================================

SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'users'
ORDER BY ordinal_position;

-- ============================================================================
-- 3. ALL COLUMNS IN IDEAS TABLE
-- ============================================================================

SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'ideas'
ORDER BY ordinal_position;

-- ============================================================================
-- 4. ALL COLUMNS IN CONNECTIONS TABLE
-- ============================================================================

SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'connections'
ORDER BY ordinal_position;

-- ============================================================================
-- 5. ALL INDEXES
-- ============================================================================

SELECT 
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;

-- ============================================================================
-- 6. FOREIGN KEY CONSTRAINTS
-- ============================================================================

SELECT 
  constraint_name,
  table_name,
  column_name,
  referenced_table_name,
  referenced_column_name
FROM information_schema.key_column_usage
WHERE referenced_table_name IS NOT NULL AND table_schema = 'public'
ORDER BY table_name, constraint_name;

-- ============================================================================
-- 7. SAMPLE DATA FROM EACH TABLE (COUNT ONLY)
-- ============================================================================

SELECT 'users' as table_name, COUNT(*) as row_count FROM users
UNION ALL
SELECT 'ideas', COUNT(*) FROM ideas
UNION ALL
SELECT 'connections', COUNT(*) FROM connections
UNION ALL
SELECT 'comments', COUNT(*) FROM comments
UNION ALL
SELECT 'chat_messages', COUNT(*) FROM chat_messages
UNION ALL
SELECT 'notifications', COUNT(*) FROM notifications
UNION ALL
SELECT 'audit_logs', COUNT(*) FROM audit_logs
UNION ALL
SELECT 'user_achievements', COUNT(*) FROM user_achievements
UNION ALL
SELECT 'user_badges', COUNT(*) FROM user_badges
UNION ALL
SELECT 'achievement_posts', COUNT(*) FROM achievement_posts
UNION ALL
SELECT 'milestone_posts', COUNT(*) FROM milestone_posts
UNION ALL
SELECT 'feedback', COUNT(*) FROM feedback
UNION ALL
SELECT 'trending_content', COUNT(*) FROM trending_content
UNION ALL
SELECT 'idea_recommendations', COUNT(*) FROM idea_recommendations
UNION ALL
SELECT 'user_recommendations', COUNT(*) FROM user_recommendations
UNION ALL
SELECT 'saved_searches', COUNT(*) FROM saved_searches
UNION ALL
SELECT 'search_history', COUNT(*) FROM search_history
UNION ALL
SELECT 'curator_picks', COUNT(*) FROM curator_picks
UNION ALL
SELECT 'email_logs', COUNT(*) FROM email_logs
UNION ALL
SELECT 'idea_views', COUNT(*) FROM idea_views
UNION ALL
SELECT 'notification_queue', COUNT(*) FROM notification_queue
UNION ALL
SELECT 'notification_settings', COUNT(*) FROM notification_settings
UNION ALL
SELECT 'notification_preferences', COUNT(*) FROM notification_preferences
UNION ALL
SELECT 'notification_digests', COUNT(*) FROM notification_digests
ORDER BY table_name;

-- ============================================================================
-- 8. DATABASE STATISTICS
-- ============================================================================

SELECT 
  'Database Statistics' as metric,
  COUNT(*) as value,
  'Total Tables' as description
FROM information_schema.tables 
WHERE table_schema = 'public'
UNION ALL
SELECT 
  'Column Count',
  COUNT(*),
  'Total Columns'
FROM information_schema.columns 
WHERE table_schema = 'public'
UNION ALL
SELECT 
  'Index Count',
  COUNT(*),
  'Total Indexes'
FROM pg_indexes
WHERE schemaname = 'public'
UNION ALL
SELECT 
  'Constraint Count',
  COUNT(*),
  'Total Constraints'
FROM information_schema.table_constraints
WHERE table_schema = 'public';

-- ============================================================================
-- 9. DETAILED TABLE STRUCTURE
-- ============================================================================

SELECT
  t.table_name,
  string_agg(c.column_name || ' ' || c.data_type, ', ' ORDER BY c.ordinal_position) as columns
FROM information_schema.tables t
LEFT JOIN information_schema.columns c ON t.table_name = c.table_name AND t.table_schema = c.table_schema
WHERE t.table_schema = 'public'
GROUP BY t.table_name
ORDER BY t.table_name;

-- ============================================================================
-- Done! Above shows complete database inventory
-- ============================================================================

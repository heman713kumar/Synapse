-- Migration 004: Advanced Notifications & Search Features
-- Created: April 7, 2026

-- ============================================
-- 1. NOTIFICATIONS SYSTEM EXPANSION
-- ============================================

-- Notifications preferences table
CREATE TABLE IF NOT EXISTS notification_preferences (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  channel VARCHAR(50) NOT NULL, -- 'email', 'in_app', 'sms'
  category VARCHAR(50) NOT NULL, -- 'idea', 'chat', 'achievement', 'follow', 'comment', 'all'
  enabled BOOLEAN DEFAULT TRUE,
  frequency VARCHAR(50) DEFAULT 'instant', -- 'instant', 'daily', 'weekly', 'never'
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, channel, category)
);

-- Enhanced notifications table
ALTER TABLE notifications 
ADD COLUMN IF NOT EXISTS category VARCHAR(50),
ADD COLUMN IF NOT EXISTS priority VARCHAR(20) DEFAULT 'normal', -- 'high', 'normal', 'low'
ADD COLUMN IF NOT EXISTS is_read BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS read_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS metadata JSONB;

-- Notification digest tracking
CREATE TABLE IF NOT EXISTS notification_digests (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  digest_type VARCHAR(50), -- 'daily', 'weekly'
  notifications_count INTEGER,
  sent_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for notifications
CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_category ON notifications(category);
CREATE INDEX IF NOT EXISTS idx_notification_prefs_user ON notification_preferences(user_id);

-- ============================================
-- 2. ADVANCED SEARCH & FILTERS
-- ============================================

-- Search history table
CREATE TABLE IF NOT EXISTS search_history (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  query VARCHAR(255) NOT NULL,
  filters JSONB,
  result_count INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Saved searches table
CREATE TABLE IF NOT EXISTS saved_searches (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  query VARCHAR(255) NOT NULL,
  filters JSONB,
  result_count INTEGER,
  last_executed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create full-text search indexes
CREATE INDEX IF NOT EXISTS idx_ideas_title_fts ON ideas USING GIN(to_tsvector('english', title));
CREATE INDEX IF NOT EXISTS idx_ideas_description_fts ON ideas USING GIN(to_tsvector('english', description));
CREATE INDEX IF NOT EXISTS idx_ideas_summary_fts ON ideas USING GIN(to_tsvector('english', summary));
CREATE INDEX IF NOT EXISTS idx_search_history_user ON search_history(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_searches_user ON saved_searches(user_id);

-- ============================================
-- 3. TRENDING & CONTENT CURATION
-- ============================================

-- Trending content tracking
CREATE TABLE IF NOT EXISTS trending_content (
  id SERIAL PRIMARY KEY,
  idea_id UUID NOT NULL REFERENCES ideas(id) ON DELETE CASCADE,
  trending_score FLOAT DEFAULT 0,
  rank_position INTEGER,
  period VARCHAR(50), -- 'today', 'week', 'month', 'alltime'
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User recommendations
CREATE TABLE IF NOT EXISTS user_recommendations (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  recommended_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reason VARCHAR(100), -- 'shared_interests', 'follows_similar', 'colab_potential'
  score FLOAT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, recommended_user_id)
);

-- Idea recommendations
CREATE TABLE IF NOT EXISTS idea_recommendations (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  recommended_idea_id UUID NOT NULL REFERENCES ideas(id) ON DELETE CASCADE,
  reason VARCHAR(100), -- 'similar_topic', 'user_interest', 'trending', 'collab'
  score FLOAT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, recommended_idea_id)
);

-- Curated picks
CREATE TABLE IF NOT EXISTS curator_picks (
  id SERIAL PRIMARY KEY,
  curator_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  idea_id UUID NOT NULL REFERENCES ideas(id) ON DELETE CASCADE,
  reason TEXT,
  featured_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(curator_id, idea_id)
);

CREATE INDEX IF NOT EXISTS idx_trending_content_period ON trending_content(period, rank_position);
CREATE INDEX IF NOT EXISTS idx_user_recommendations ON user_recommendations(user_id);
CREATE INDEX IF NOT EXISTS idx_idea_recommendations ON idea_recommendations(user_id);
CREATE INDEX IF NOT EXISTS idx_curator_picks_idea ON curator_picks(idea_id);

-- ============================================
-- 4. ENGAGEMENT METRICS
-- ============================================

-- Add engagement tracking columns to ideas
ALTER TABLE ideas
ADD COLUMN IF NOT EXISTS view_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS engagement_score FLOAT DEFAULT 0,
ADD COLUMN IF NOT EXISTS trending_at TIMESTAMP;

-- Create view tracking table
CREATE TABLE IF NOT EXISTS idea_views (
  id SERIAL PRIMARY KEY,
  idea_id UUID NOT NULL REFERENCES ideas(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  viewed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_idea_views_idea ON idea_views(idea_id);
CREATE INDEX IF NOT EXISTS idx_idea_views_user ON idea_views(user_id);

-- ============================================
-- DONE!
-- ============================================
-- Status: Migration created successfully
-- Next: Run this migration in Supabase SQL Editor

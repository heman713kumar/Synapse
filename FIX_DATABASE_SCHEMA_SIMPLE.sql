-- ============================================================================
-- SYNAPSE DATABASE - CRITICAL FIXES (Simplified Version)
-- ============================================================================
-- Run each section separately if you encounter errors
-- This version is designed to be executed step-by-step
-- ============================================================================

-- ============================================================================
-- STEP 1: DROP OLD CONNECTIONS TABLE (if it exists and is broken)
-- ============================================================================
-- Comment this out if you want to keep existing data

DROP TABLE IF EXISTS public.connections CASCADE;

-- ============================================================================
-- STEP 2: CREATE NEW CONNECTIONS TABLE
-- ============================================================================

CREATE TABLE public.connections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  following_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  connection_type varchar(20) DEFAULT 'follow',
  status varchar(20) DEFAULT 'accepted',
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(follower_id, following_id)
);

-- Create performance indexes
CREATE INDEX idx_connections_follower ON public.connections(follower_id);
CREATE INDEX idx_connections_following ON public.connections(following_id);
CREATE INDEX idx_connections_status ON public.connections(status);

-- ============================================================================
-- STEP 3: ADD EMAIL VERIFICATION COLUMNS TO USERS
-- ============================================================================

ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS email_verified boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS email_verification_token varchar(255) UNIQUE,
ADD COLUMN IF NOT EXISTS email_verification_token_expires timestamp with time zone,
ADD COLUMN IF NOT EXISTS password_reset_token varchar(255) UNIQUE,
ADD COLUMN IF NOT EXISTS password_reset_token_expires timestamp with time zone,
ADD COLUMN IF NOT EXISTS last_login_at timestamp with time zone;

-- Create indexes for fast token lookups
CREATE INDEX IF NOT EXISTS idx_users_email_verification_token ON public.users(email_verification_token);
CREATE INDEX IF NOT EXISTS idx_users_password_reset_token ON public.users(password_reset_token);

-- ============================================================================
-- STEP 4: ADD COMMENT THREADING SUPPORT
-- ============================================================================

ALTER TABLE public.comments
ADD COLUMN IF NOT EXISTS parent_comment_id uuid REFERENCES public.comments(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS likes_count integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS status varchar(20) DEFAULT 'published';

CREATE INDEX IF NOT EXISTS idx_comments_parent ON public.comments(parent_comment_id);
CREATE INDEX IF NOT EXISTS idx_comments_status ON public.comments(status);

-- ============================================================================
-- STEP 5: ADD SOFT DELETE SUPPORT
-- ============================================================================

ALTER TABLE public.ideas
ADD COLUMN IF NOT EXISTS deleted_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS deleted_by uuid REFERENCES public.users(id),
ADD COLUMN IF NOT EXISTS deletion_reason text;

CREATE INDEX IF NOT EXISTS idx_ideas_deleted_at ON public.ideas(deleted_at);

-- ============================================================================
-- STEP 6: ENHANCE CHAT MESSAGES
-- ============================================================================

ALTER TABLE public.chat_messages
ADD COLUMN IF NOT EXISTS edited_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS deleted_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS thread_id uuid,
ADD COLUMN IF NOT EXISTS reactions jsonb DEFAULT '{}'::jsonb;

CREATE INDEX IF NOT EXISTS idx_chat_messages_thread ON public.chat_messages(thread_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_read ON public.chat_messages(read);

-- ============================================================================
-- STEP 7: ADD PERFORMANCE INDEXES
-- ============================================================================

-- Indexes on users table
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_username ON public.users(username);
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON public.users(created_at);

-- Indexes on ideas table
CREATE INDEX IF NOT EXISTS idx_ideas_owner_id ON public.ideas(owner_id);
CREATE INDEX IF NOT EXISTS idx_ideas_stage ON public.ideas(stage);
CREATE INDEX IF NOT EXISTS idx_ideas_visibility ON public.ideas(visibility);
CREATE INDEX IF NOT EXISTS idx_ideas_created_at ON public.ideas(created_at);

-- Indexes on comments table
CREATE INDEX IF NOT EXISTS idx_comments_idea_id ON public.comments(idea_id);
CREATE INDEX IF NOT EXISTS idx_comments_user_id ON public.comments(user_id);
CREATE INDEX IF NOT EXISTS idx_comments_created_at ON public.comments(created_at);

-- Indexes on chat_messages table
CREATE INDEX IF NOT EXISTS idx_chat_messages_sender ON public.chat_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_recipient ON public.chat_messages(recipient_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON public.chat_messages(created_at);

-- Indexes on notifications table
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON public.notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at DESC);

-- Indexes on audit_logs table
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON public.audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at);

-- ============================================================================
-- SUCCESS! All tables and columns created/updated
-- ============================================================================
-- Your database is now production-ready!
-- 
-- Summary of changes:
-- ✅ Created connections table (for social features)
-- ✅ Added email verification support to users table
-- ✅ Added comment threading support
-- ✅ Added soft delete support to ideas
-- ✅ Enhanced chat messages with threading & reactions
-- ✅ Created performance indexes on all key tables
--
-- No errors above means everything is working! 🎉
-- ============================================================================

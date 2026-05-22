-- Migration: Add 2FA and Audit Logging Tables
-- Created: 2024
-- Description: Adds columns for 2FA support, audit logging, badges, and role-based access control

-- ============================================
-- 1. ALTER users table to add 2FA columns
-- ============================================
ALTER TABLE users
ADD COLUMN IF NOT EXISTS two_fa_enabled BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS two_fa_secret VARCHAR(32),
ADD COLUMN IF NOT EXISTS two_fa_temp_secret VARCHAR(32),
ADD COLUMN IF NOT EXISTS two_fa_otp VARCHAR(6),
ADD COLUMN IF NOT EXISTS two_fa_otp_expires TIMESTAMP,
ADD COLUMN IF NOT EXISTS two_fa_backup_codes JSONB DEFAULT '[]'::JSONB;

-- ============================================
-- 2. ALTER users table to add RBAC columns
-- ============================================
ALTER TABLE users
ADD COLUMN IF NOT EXISTS role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('admin', 'moderator', 'creator', 'contributor', 'user')),
ADD COLUMN IF NOT EXISTS badges_count INT DEFAULT 0;

-- ============================================
-- 3. CREATE audit_logs table
-- ============================================
CREATE TABLE IF NOT EXISTS audit_logs (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255),
    action VARCHAR(100) NOT NULL,           -- e.g., 'CREATE_IDEA', 'DELETE_COMMENT'
    resource_type VARCHAR(50) NOT NULL,     -- e.g., 'IDEA', 'USER', 'COMMENT'
    resource_id VARCHAR(255) NOT NULL,
    details JSONB DEFAULT '{}'::JSONB,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_user_action (user_id, action),
    INDEX idx_resource (resource_type, resource_id),
    INDEX idx_created_at (created_at)
);

-- ============================================
-- 4. CREATE user_badges table
-- ============================================
CREATE TABLE IF NOT EXISTS user_badges (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    badge_id VARCHAR(100) NOT NULL,
    unlocked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE(user_id, badge_id),
    INDEX idx_user_badges (user_id)
);

-- ============================================
-- 5. CREATE email_logs table (for tracking sent emails)
-- ============================================
CREATE TABLE IF NOT EXISTS email_logs (
    id SERIAL PRIMARY KEY,
    recipient VARCHAR(255) NOT NULL,
    subject VARCHAR(255),
    email_type VARCHAR(50),                 -- 'welcome', 'notification', '2fa', etc.
    status VARCHAR(20) DEFAULT 'pending',   -- 'sent', 'failed', 'bounced'
    error_message TEXT,
    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_recipient (recipient),
    INDEX idx_status (status),
    INDEX idx_sent_at (sent_at)
);

-- ============================================
-- 6. CREATE notification_settings table
-- ============================================
CREATE TABLE IF NOT EXISTS notification_settings (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255) UNIQUE,
    collaboration_requests JSONB DEFAULT '["inApp"]'::JSONB,
    collaboration_updates JSONB DEFAULT '["inApp"]'::JSONB,
    comments_on_my_ideas JSONB DEFAULT '["inApp"]'::JSONB,
    feedback_on_my_ideas JSONB DEFAULT '["inApp"]'::JSONB,
    new_connections JSONB DEFAULT '["inApp"]'::JSONB,
    achievement_unlocks JSONB DEFAULT '["inApp"]'::JSONB,
    direct_messages JSONB DEFAULT '["inApp"]'::JSONB,
    message_reactions JSONB DEFAULT '["inApp"]'::JSONB,
    do_not_disturb BOOLEAN DEFAULT FALSE,
    dnd_start_time TIME DEFAULT '22:00:00',
    dnd_end_time TIME DEFAULT '08:00:00',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_notifications (user_id)
);

-- ============================================
-- 7. CREATE notification_queue table
-- ============================================
CREATE TABLE IF NOT EXISTS notification_queue (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    notification_type VARCHAR(50),          -- 'collaboration', 'comment', 'mention', etc.
    title VARCHAR(255),
    message TEXT,
    link_page VARCHAR(50),
    link_id VARCHAR(255),
    read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_notifications (user_id, read),
    INDEX idx_created_at (created_at)
);

-- ============================================
-- 8. Add indexes for performance
-- ============================================
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_audit_user_action ON audit_logs(user_id, action);
CREATE INDEX IF NOT EXISTS idx_audit_resource ON audit_logs(resource_type, resource_id);

-- ============================================
-- 9. Add security columns to ideas table
-- ============================================
ALTER TABLE ideas
ADD COLUMN IF NOT EXISTS visibility VARCHAR(20) DEFAULT 'public' CHECK (visibility IN ('public', 'private', 'restricted')),
ADD COLUMN IF NOT EXISTS last_modified TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

COMMIT;

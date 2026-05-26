-- Migration: Add email verification columns to users
-- Fills the gap between the inline base users table and the auth routes,
-- which reference email_verified / email_verification_token /
-- email_verification_token_expires. Without these columns every signup and
-- login SELECT/INSERT throws and the route returns a generic 500
-- ("Login failed. Please try again.").

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS email_verification_token VARCHAR(255),
  ADD COLUMN IF NOT EXISTS email_verification_token_expires TIMESTAMP WITH TIME ZONE;

-- Index for the rare case we need to look up by token (verify-email flow)
CREATE INDEX IF NOT EXISTS idx_users_email_verification_token
  ON users (email_verification_token)
  WHERE email_verification_token IS NOT NULL;

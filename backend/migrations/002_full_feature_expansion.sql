-- ============================================================================
-- Synapse — Full Feature Expansion (Migration 002)
-- Adds tables for: bounties, jobs, mentorship, polls, reactions, XP/quests,
-- API keys, webhooks, push subscriptions, hashtags, presence, account
-- deletion grace, data exports, cookie consent, audit log, roadmap voting.
-- ============================================================================

-- ─── REACTIONS ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS idea_reactions (
  id            SERIAL PRIMARY KEY,
  idea_id       UUID NOT NULL,
  user_id       UUID NOT NULL,
  emoji         VARCHAR(10) NOT NULL,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (idea_id, user_id, emoji)
);
CREATE INDEX IF NOT EXISTS idx_idea_reactions_idea ON idea_reactions(idea_id);

CREATE TABLE IF NOT EXISTS comment_reactions (
  id            SERIAL PRIMARY KEY,
  comment_id    UUID NOT NULL,
  user_id       UUID NOT NULL,
  emoji         VARCHAR(10) NOT NULL,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (comment_id, user_id, emoji)
);

-- ─── HASHTAGS / TAGS ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS tags (
  slug          VARCHAR(50) PRIMARY KEY,
  display       VARCHAR(50) NOT NULL,
  description   TEXT,
  follower_count INT DEFAULT 0,
  idea_count    INT DEFAULT 0,
  trending_score NUMERIC(10,4) DEFAULT 0,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_tags_trending ON tags(trending_score DESC);

CREATE TABLE IF NOT EXISTS idea_tags (
  idea_id   UUID NOT NULL,
  tag_slug  VARCHAR(50) NOT NULL REFERENCES tags(slug) ON DELETE CASCADE,
  PRIMARY KEY (idea_id, tag_slug)
);

CREATE TABLE IF NOT EXISTS tag_followers (
  user_id   UUID NOT NULL,
  tag_slug  VARCHAR(50) NOT NULL REFERENCES tags(slug) ON DELETE CASCADE,
  followed_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, tag_slug)
);

-- ─── BOUNTIES ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS bounties (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  idea_id         UUID NOT NULL,
  poster_id       UUID NOT NULL,
  title           TEXT NOT NULL,
  description     TEXT NOT NULL,
  reward_cents    INT NOT NULL CHECK (reward_cents > 0),
  currency        CHAR(3) DEFAULT 'USD',
  difficulty      VARCHAR(10) CHECK (difficulty IN ('easy','medium','hard')),
  deadline        TIMESTAMPTZ,
  status          VARCHAR(20) DEFAULT 'open' CHECK (status IN ('open','in_progress','completed','cancelled')),
  assigned_to     UUID,
  stripe_payment_intent_id  TEXT,
  escrow_held     BOOLEAN DEFAULT FALSE,
  tags            TEXT[] DEFAULT '{}',
  applicant_count INT DEFAULT 0,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_bounties_status ON bounties(status);
CREATE INDEX IF NOT EXISTS idx_bounties_idea ON bounties(idea_id);

CREATE TABLE IF NOT EXISTS bounty_applications (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bounty_id   UUID NOT NULL REFERENCES bounties(id) ON DELETE CASCADE,
  applicant_id UUID NOT NULL,
  proposal    TEXT NOT NULL,
  status      VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending','accepted','rejected','withdrawn')),
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (bounty_id, applicant_id)
);

-- ─── JOBS ───────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS jobs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  idea_id         UUID,
  poster_id       UUID NOT NULL,
  title           TEXT NOT NULL,
  company         TEXT,
  description     TEXT NOT NULL,
  commitment      VARCHAR(20) CHECK (commitment IN ('full-time','part-time','contract','volunteer','equity-only')),
  remote          VARCHAR(10) CHECK (remote IN ('remote','hybrid','onsite')),
  location        TEXT,
  salary_min      INT,                -- in thousands
  salary_max      INT,
  equity          TEXT,
  skills          TEXT[] DEFAULT '{}',
  status          VARCHAR(20) DEFAULT 'open' CHECK (status IN ('open','filled','closed')),
  applicant_count INT DEFAULT 0,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status);
CREATE INDEX IF NOT EXISTS idx_jobs_skills ON jobs USING GIN (skills);

CREATE TABLE IF NOT EXISTS job_applications (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id        UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  applicant_id  UUID NOT NULL,
  cover_letter  TEXT,
  resume_url    TEXT,
  status        VARCHAR(20) DEFAULT 'pending',
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (job_id, applicant_id)
);

-- ─── MENTORSHIP ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS mentors (
  user_id         UUID PRIMARY KEY,
  bio             TEXT,
  expertise       TEXT[] DEFAULT '{}',
  rate_cents      INT,
  rating          NUMERIC(2,1) DEFAULT 5.0,
  review_count    INT DEFAULT 0,
  verified        BOOLEAN DEFAULT FALSE,
  calendar_url    TEXT,
  stripe_connect_id TEXT,
  active          BOOLEAN DEFAULT TRUE,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS mentorship_bookings (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mentor_id       UUID NOT NULL REFERENCES mentors(user_id),
  mentee_id       UUID NOT NULL,
  scheduled_at    TIMESTAMPTZ NOT NULL,
  duration_min    INT DEFAULT 30,
  amount_cents    INT NOT NULL,
  meeting_url     TEXT,
  status          VARCHAR(20) DEFAULT 'confirmed' CHECK (status IN ('confirmed','completed','cancelled','no_show')),
  stripe_payment_intent_id TEXT,
  rating          INT CHECK (rating BETWEEN 1 AND 5),
  review_text     TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_bookings_mentor ON mentorship_bookings(mentor_id, scheduled_at);

-- ─── POLLS ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS polls (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  idea_id         UUID,                              -- nullable: forum-only polls
  forum_message_id UUID,
  creator_id      UUID NOT NULL,
  question        TEXT NOT NULL,
  multiple_choice BOOLEAN DEFAULT FALSE,
  closes_at       TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS poll_options (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  poll_id         UUID NOT NULL REFERENCES polls(id) ON DELETE CASCADE,
  label           TEXT NOT NULL,
  vote_count      INT DEFAULT 0,
  order_index     INT DEFAULT 0
);

CREATE TABLE IF NOT EXISTS poll_votes (
  poll_id     UUID NOT NULL REFERENCES polls(id) ON DELETE CASCADE,
  option_id   UUID NOT NULL REFERENCES poll_options(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL,
  voted_at    TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (poll_id, option_id, user_id)
);

-- ─── XP / LEVELS / QUESTS ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_xp (
  user_id     UUID PRIMARY KEY,
  total_xp    INT DEFAULT 0,
  current_streak INT DEFAULT 0,
  longest_streak INT DEFAULT 0,
  last_visit_date DATE,
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS xp_events (
  id          SERIAL PRIMARY KEY,
  user_id     UUID NOT NULL,
  action      VARCHAR(40) NOT NULL,
  xp          INT NOT NULL,
  metadata    JSONB,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_xp_events_user ON xp_events(user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS quest_progress (
  user_id     UUID NOT NULL,
  week_key    VARCHAR(10) NOT NULL,    -- e.g. "2026-W22"
  quest_id    VARCHAR(50) NOT NULL,
  progress    INT DEFAULT 0,
  completed_at TIMESTAMPTZ,
  PRIMARY KEY (user_id, week_key, quest_id)
);

-- ─── API KEYS + WEBHOOKS (developer platform) ───────────────────────────────
CREATE TABLE IF NOT EXISTS api_keys (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL,
  name          TEXT NOT NULL,
  prefix        VARCHAR(20) NOT NULL,      -- shown in dashboard
  hash          TEXT NOT NULL,             -- bcrypt of full key
  scopes        TEXT[] DEFAULT '{ideas:read,profile:read}',
  last_used_at  TIMESTAMPTZ,
  revoked_at    TIMESTAMPTZ,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_api_keys_user ON api_keys(user_id) WHERE revoked_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_api_keys_prefix ON api_keys(prefix);

CREATE TABLE IF NOT EXISTS webhooks (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL,
  url             TEXT NOT NULL,
  events          TEXT[] DEFAULT '{}',
  signing_secret  TEXT NOT NULL,
  enabled         BOOLEAN DEFAULT TRUE,
  last_delivered_at TIMESTAMPTZ,
  failure_count   INT DEFAULT 0,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS webhook_deliveries (
  id            SERIAL PRIMARY KEY,
  webhook_id    UUID NOT NULL REFERENCES webhooks(id) ON DELETE CASCADE,
  event         VARCHAR(50) NOT NULL,
  payload       JSONB NOT NULL,
  response_code INT,
  delivered_at  TIMESTAMPTZ,
  attempts      INT DEFAULT 1,
  next_retry_at TIMESTAMPTZ,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_pending ON webhook_deliveries(next_retry_at) WHERE delivered_at IS NULL;

-- ─── PUSH NOTIFICATIONS ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id            SERIAL PRIMARY KEY,
  user_id       UUID NOT NULL,
  endpoint      TEXT NOT NULL UNIQUE,
  p256dh        TEXT NOT NULL,
  auth          TEXT NOT NULL,
  user_agent    TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_push_user ON push_subscriptions(user_id);

-- ─── PRESENCE (realtime) ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_presence (
  user_id     UUID PRIMARY KEY,
  status      VARCHAR(20) DEFAULT 'offline',  -- online / away / busy / offline
  last_seen   TIMESTAMPTZ DEFAULT NOW(),
  socket_id   TEXT
);

-- ─── ACCOUNT DELETION (30-day grace) ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS pending_deletions (
  user_id     UUID PRIMARY KEY,
  reason      TEXT,
  feedback    TEXT,
  scheduled_for TIMESTAMPTZ NOT NULL,
  requested_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS data_export_jobs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL,
  sections    TEXT[] NOT NULL,
  format      VARCHAR(10) DEFAULT 'json',
  status      VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending','running','ready','failed')),
  download_url TEXT,
  expires_at  TIMESTAMPTZ,
  requested_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- ─── COOKIE CONSENT LOG (regulatory) ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS cookie_consent_log (
  id            SERIAL PRIMARY KEY,
  user_id       UUID,                     -- nullable for anonymous
  fingerprint   TEXT,                     -- anonymous IP+UA hash
  functional    BOOLEAN,
  analytics     BOOLEAN,
  marketing     BOOLEAN,
  ip_address    INET,
  user_agent    TEXT,
  decided_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ─── AUDIT LOG (for GDPR/CCPA requests) ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS audit_log (
  id          BIGSERIAL PRIMARY KEY,
  user_id     UUID,
  actor_id    UUID,                       -- who performed the action (might be admin)
  action      VARCHAR(50) NOT NULL,
  resource    VARCHAR(50),
  resource_id TEXT,
  metadata    JSONB,
  ip_address  INET,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_audit_user ON audit_log(user_id, created_at DESC);

-- ─── ROADMAP VOTING ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS roadmap_items (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title       TEXT NOT NULL,
  description TEXT,
  category    VARCHAR(50),
  status      VARCHAR(20) DEFAULT 'idea' CHECK (status IN ('idea','planned','in_progress','shipped')),
  upvotes     INT DEFAULT 0,
  comment_count INT DEFAULT 0,
  submitted_by UUID,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS roadmap_votes (
  user_id     UUID NOT NULL,
  item_id     UUID NOT NULL REFERENCES roadmap_items(id) ON DELETE CASCADE,
  voted_at    TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, item_id)
);

-- ─── FOLLOW GRAPH (separate from connections) ───────────────────────────────
CREATE TABLE IF NOT EXISTS follows (
  follower_id   UUID NOT NULL,
  following_id  UUID NOT NULL,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (follower_id, following_id),
  CHECK (follower_id <> following_id)
);

-- ─── SAVED SEARCHES + ALERTS ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS saved_searches (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL,
  name        TEXT NOT NULL,
  query       TEXT NOT NULL,
  filters     JSONB,
  alert_enabled BOOLEAN DEFAULT FALSE,
  last_alerted TIMESTAMPTZ,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ─── INVESTOR DEAL FLOW ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS deal_flow (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  investor_id UUID NOT NULL,
  idea_id     UUID NOT NULL,
  stage       VARCHAR(20) CHECK (stage IN ('watch','interested','meeting','passed','invested')),
  notes       TEXT,
  added_at    TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (investor_id, idea_id)
);

-- ─── DAILY PROMPTS ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS daily_prompts (
  date_key    DATE PRIMARY KEY,
  prompt      TEXT NOT NULL,
  response_count INT DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ─── SUBSCRIPTIONS (Stripe-linked) ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS subscriptions (
  user_id           UUID PRIMARY KEY,
  stripe_customer_id TEXT UNIQUE,
  stripe_subscription_id TEXT UNIQUE,
  plan              VARCHAR(20) CHECK (plan IN ('free','pro','investor')),
  status            VARCHAR(20),       -- active, past_due, canceled, etc
  current_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN DEFAULT FALSE,
  trial_end         TIMESTAMPTZ,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

-- ─── DOCUMENT COLLABORATION (Yjs persistence) ───────────────────────────────
CREATE TABLE IF NOT EXISTS yjs_documents (
  doc_id      VARCHAR(100) PRIMARY KEY,   -- e.g. "idea-{uuid}-board"
  state       BYTEA NOT NULL,             -- Yjs binary state
  updated_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_by  UUID
);

-- ─── HELPFUL VIEWS ──────────────────────────────────────────────────────────
CREATE OR REPLACE VIEW v_idea_reaction_summary AS
SELECT idea_id, emoji, COUNT(*) AS count
FROM idea_reactions
GROUP BY idea_id, emoji;

CREATE OR REPLACE VIEW v_top_tags AS
SELECT slug, display, idea_count, trending_score
FROM tags
WHERE idea_count > 0
ORDER BY trending_score DESC
LIMIT 100;

-- ─── HOUSEKEEPING TRIGGERS ──────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_timestamp() RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END; $$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_bounties_updated ON bounties;
CREATE TRIGGER trg_bounties_updated BEFORE UPDATE ON bounties
  FOR EACH ROW EXECUTE FUNCTION update_timestamp();

DROP TRIGGER IF EXISTS trg_jobs_updated ON jobs;
CREATE TRIGGER trg_jobs_updated BEFORE UPDATE ON jobs
  FOR EACH ROW EXECUTE FUNCTION update_timestamp();

DROP TRIGGER IF EXISTS trg_subs_updated ON subscriptions;
CREATE TRIGGER trg_subs_updated BEFORE UPDATE ON subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_timestamp();

-- ============================================================================
-- DONE. Run with: psql $DATABASE_URL -f migrations/002_full_feature_expansion.sql
-- ============================================================================

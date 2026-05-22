# 🗄️ SYNAPSE DATABASE - COMPLETE SCHEMA & CONFIGURATION

## ✅ QUICK ANSWER: What Database Are You Using?

**ONE DATABASE ONLY:**
- **Type:** PostgreSQL
- **Provider:** Supabase (Cloud-hosted PostgreSQL)
- **Connection:** Via `DATABASE_URL` environment variable
- **NOT using multiple databases** - Everything is in ONE unified PostgreSQL instance

---

## 📊 DATABASE ARCHITECTURE

### **Connection Flow**

```
Frontend (React)
    ├─→ Backend API (Express) [Primary]
    │   └─→ PostgreSQL via DATABASE_URL
    │
    └─→ Supabase JS Client [Fallback]
        └─→ PostgreSQL via VITE_SUPABASE_URL
```

### **Supabase Credentials**
- **URL:** https://fsgcdhshhsbmodspyggn.supabase.co
- **Anon Key:** eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
- **Database Host:** PostgreSQL managed by Supabase

---

## 🔧 CONNECTION CONFIGURATION

### **Backend Configuration** (`backend/.env`)
```
DATABASE_URL=postgresql://username:password@host:port/database?sslmode=require
JWT_SECRET=your-secret
JWT_EXPIRES_IN=7d
NODE_ENV=development
PORT=3001
```

### **Frontend Configuration** (`.env` or `.env.production`)
```
VITE_SUPABASE_URL=https://fsgcdhshhsbmodspyggn.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### **PostgreSQL Connection Pool Settings**
```
Max Connections:        20
Idle Timeout:          30 seconds
Connection Timeout:    10 seconds
SSL Mode (Production): Strict (rejectUnauthorized: true)
SSL Mode (Development): Flexible (rejectUnauthorized: false)
```

---

## 📋 COMPLETE TABLE STRUCTURE (7 TABLES)

### **TABLE 1: USERS**
**Purpose:** Core user profile and authentication

```sql
Column Name              | Type              | Constraints
─────────────────────────┼──────────────────┼─────────────────────────
id                       | UUID              | PRIMARY KEY, Default: gen_random_uuid()
email                    | VARCHAR(255)      | UNIQUE, NOT NULL
username                 | VARCHAR(50)       | UNIQUE, NOT NULL
password_hash            | TEXT              | NOT NULL
display_name             | VARCHAR(255)      | -
avatar_url               | TEXT              | -
bio                      | TEXT              | -
user_type                | ENUM              | ('thinker', 'doer', 'investor')
skills                   | JSONB             | Default: '[]'
interests                | TEXT[]            | Default: '{}'
onboarding_completed     | BOOLEAN           | Default: FALSE
created_at               | TIMESTAMP         | Default: NOW()
updated_at               | TIMESTAMP         | Default: NOW()

[2FA COLUMNS - Added by Migration]:
two_fa_enabled           | BOOLEAN           | Default: FALSE
two_fa_secret            | VARCHAR(32)       | -
two_fa_temp_secret       | VARCHAR(32)       | -
two_fa_otp               | VARCHAR(6)        | -
two_fa_otp_expires       | TIMESTAMP         | -
two_fa_backup_codes      | JSONB             | Default: '[]'

[RBAC COLUMNS - Added by Migration]:
role                     | VARCHAR(20)       | Default: 'user', CHECK IN ('admin', 'moderator', 'creator', 'contributor', 'user')
badges_count             | INT               | Default: 0
```

**Indexes:**
```sql
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
```

---

### **TABLE 2: IDEAS**
**Purpose:** Store innovation ideas with details and metadata

```sql
Column Name              | Type              | Constraints
─────────────────────────┼──────────────────┼─────────────────────────
id                       | VARCHAR(255)      | PRIMARY KEY
owner_id                 | VARCHAR(255)      | FOREIGN KEY → users(id)
title                    | VARCHAR(255)      | -
summary                  | TEXT              | -
description              | TEXT              | -
stage                    | VARCHAR(50)       | CHECK IN ('ideation', 'in-development', 'launched')
sector                   | VARCHAR(100)      | -
region                   | VARCHAR(100)      | -
tags                     | JSONB             | Array of strings
required_skills          | JSONB             | Array of skill objects
is_public                | BOOLEAN           | -
likes_count              | INT               | Default: 0
comments_count           | INT               | Default: 0
collaborators            | JSONB             | Array of user IDs
questionnaire            | JSONB             | Custom form responses
created_at               | TIMESTAMP         | -
updated_at               | TIMESTAMP         | -

[Added by Migration]:
visibility               | VARCHAR(20)       | Default: 'public', CHECK IN ('public', 'private', 'restricted')
last_modified            | TIMESTAMP         | Default: NOW()
```

---

### **TABLE 3: AUDIT_LOGS** ⭐ NEW
**Purpose:** Track all user actions for compliance and debugging

```sql
Column Name              | Type              | Constraints
─────────────────────────┼──────────────────┼─────────────────────────
id                       | SERIAL            | PRIMARY KEY
user_id                  | VARCHAR(255)      | FOREIGN KEY → users(id) ON DELETE SET NULL
action                   | VARCHAR(100)      | NOT NULL (e.g., 'CREATE_IDEA', 'DELETE_COMMENT', 'LOGIN')
resource_type            | VARCHAR(50)       | NOT NULL (e.g., 'IDEA', 'USER', 'COMMENT')
resource_id              | VARCHAR(255)      | NOT NULL
details                  | JSONB             | Default: '{}'
ip_address               | VARCHAR(45)       | -
user_agent               | TEXT              | -
created_at               | TIMESTAMP         | Default: CURRENT_TIMESTAMP
```

**Indexes:**
```sql
CREATE INDEX idx_audit_user_action ON audit_logs(user_id, action);
CREATE INDEX idx_audit_resource ON audit_logs(resource_type, resource_id);
CREATE INDEX idx_audit_created_at ON audit_logs(created_at);
```

---

### **TABLE 4: USER_BADGES** ⭐ NEW
**Purpose:** Gamification - Track badges earned by users

```sql
Column Name              | Type              | Constraints
─────────────────────────┼──────────────────┼─────────────────────────
id                       | SERIAL            | PRIMARY KEY
user_id                  | VARCHAR(255)      | NOT NULL, FOREIGN KEY → users(id) ON DELETE CASCADE
badge_id                 | VARCHAR(100)      | NOT NULL (e.g., 'idea_starter', 'prolific_creator')
unlocked_at              | TIMESTAMP         | Default: CURRENT_TIMESTAMP

Constraints:
- UNIQUE(user_id, badge_id) - Each user can only have each badge once
- INDEX: idx_user_badges (user_id)
```

**Available Badge Types:**
- `idea_starter` - Created first idea
- `prolific_creator` - Multiple ideas created
- `collaboration_champion` - Collaborated on many ideas
- `helpful_mentor` - Gave helpful feedback
- `innovation_leader` - Top-rated ideas
- `connector` - Made many connections
- `trusted_contributor` - High trust score

---

### **TABLE 5: EMAIL_LOGS** ⭐ NEW
**Purpose:** Track all sent emails for diagnostics and auditing

```sql
Column Name              | Type              | Constraints
─────────────────────────┼──────────────────┼─────────────────────────
id                       | SERIAL            | PRIMARY KEY
recipient                | VARCHAR(255)      | NOT NULL
subject                  | VARCHAR(255)      | -
email_type               | VARCHAR(50)       | (e.g., 'welcome', 'notification', '2fa', 'password_reset')
status                   | VARCHAR(20)       | Default: 'pending' (pending, sent, failed, bounced)
error_message            | TEXT              | -
sent_at                  | TIMESTAMP         | Default: CURRENT_TIMESTAMP
```

**Indexes:**
```sql
CREATE INDEX idx_email_recipient ON email_logs(recipient);
CREATE INDEX idx_email_status ON email_logs(status);
CREATE INDEX idx_email_sent_at ON email_logs(sent_at);
```

---

### **TABLE 6: NOTIFICATION_SETTINGS** ⭐ NEW
**Purpose:** User preferences for notifications per channel

```sql
Column Name                      | Type              | Constraints
──────────────────────────────────┼──────────────────┼─────────────────────────
id                               | SERIAL            | PRIMARY KEY
user_id                          | VARCHAR(255)      | UNIQUE, FOREIGN KEY → users(id) ON DELETE CASCADE

Notification Channels (JSONB arrays):
collaboration_requests           | JSONB             | Default: '["inApp"]' → channels: email, inApp, sms
collaboration_updates            | JSONB             | Default: '["inApp"]'
comments_on_my_ideas             | JSONB             | Default: '["inApp"]'
feedback_on_my_ideas             | JSONB             | Default: '["inApp"]'
new_connections                  | JSONB             | Default: '["inApp"]'
achievement_unlocks              | JSONB             | Default: '["inApp"]'
direct_messages                  | JSONB             | Default: '["inApp"]'
message_reactions                | JSONB             | Default: '["inApp"]'

Do Not Disturb Settings:
do_not_disturb                   | BOOLEAN           | Default: FALSE
dnd_start_time                   | TIME              | Default: '22:00:00'
dnd_end_time                     | TIME              | Default: '08:00:00'

Timestamps:
created_at                       | TIMESTAMP         | Default: CURRENT_TIMESTAMP
updated_at                       | TIMESTAMP         | Default: CURRENT_TIMESTAMP
```

**Index:**
```sql
CREATE INDEX idx_user_notifications ON notification_settings(user_id);
```

---

### **TABLE 7: NOTIFICATION_QUEUE** ⭐ NEW
**Purpose:** Queue notifications for async delivery with retry capability

```sql
Column Name              | Type              | Constraints
─────────────────────────┼──────────────────┼─────────────────────────
id                       | SERIAL            | PRIMARY KEY
user_id                  | VARCHAR(255)      | NOT NULL, FOREIGN KEY → users(id) ON DELETE CASCADE
notification_type        | VARCHAR(50)       | (e.g., 'collaboration', 'comment', 'mention')
title                    | VARCHAR(255)      | -
message                  | TEXT              | -
link_page                | VARCHAR(50)       | (Pages: feed, ideaDetail, profile, etc.)
link_id                  | VARCHAR(255)      | -
read                     | BOOLEAN           | Default: FALSE
created_at               | TIMESTAMP         | Default: CURRENT_TIMESTAMP
scheduled_at             | TIMESTAMP         | For delayed notifications
```

**Indexes:**
```sql
CREATE INDEX idx_notification_user_read ON notification_queue(user_id, read);
CREATE INDEX idx_notification_created_at ON notification_queue(created_at);
```

---

### **PRE-EXISTING TABLES** (Assumed, referenced in code)
These tables are referenced in the application but their full schema isn't in the migration:
- `achievement_posts` - Achievement/milestone updates from users
- `milestone_posts` - Milestone progress updates
- `comments` - Comments on ideas
- `collaboration_requests` - Collaboration invitations
- `feedback` - User feedback
- `milestones` - Project milestones
- `blockchain_records` - Blockchain transaction records
- `forum_messages` - Discussion forum messages
- `direct_messages` - DM conversations
- `conversations` - Chat conversations
- `messages` - Chat messages
- `user_achievements` - User achievement tracking

---

## 🚀 SETUP INSTRUCTIONS FOR SUPABASE

### **Step 1: Extract the Migration**
The migration file is located at:
```
backend/migrations/001_add_2fa_rbac_audit.sql
```

### **Step 2: Connect to Supabase**
1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Sign in with your account
3. Open the project for this app
4. Go to **SQL Editor** in the left sidebar

### **Step 3: Execute the Migration**
1. Click **New Query**
2. Copy the entire content from `backend/migrations/001_add_2fa_rbac_audit.sql`
3. Paste into the SQL Editor
4. Click **Run** or press `Ctrl+Enter`

Expected output:
```
✅ No errors - all tables created/modified successfully
```

### **Step 4: Verify Schema**
1. Go to **Table Editor** in Supabase
2. Verify these tables exist:
   - users (with all 2FA and RBAC columns)
   - audit_logs
   - user_badges
   - email_logs
   - notification_settings
   - notification_queue

### **Step 5: Set Backend Environment Variables**

Create or update `backend/.env`:
```env
DATABASE_URL=postgresql://[user]:[password]@[host]:[port]/[database]?sslmode=require
JWT_SECRET=<your-jwt-secret-min-32-chars>
JWT_EXPIRES_IN=7d
NODE_ENV=development
PORT=3001
CORS_ORIGIN=http://localhost:5173
GOOGLE_GENAI_API_KEY=<optional-gemini-key>
```

**How to get DATABASE_URL from Supabase:**
1. Go to Supabase Dashboard → Settings → Database
2. Copy the "Connection string" (PostgreSQL)
3. Paste into `.env` as DATABASE_URL

### **Step 6: Test Connection**

From backend directory:
```bash
npm install
npm run dev
```

Expected output:
```
🔧 Database Configuration:
Connected to: postgresql://****@db.*****.supabase.co:5432/postgres
🔗 Final Database Config - Host: db.*****.supabase.co, Port: 5432, SSL Enabled
🔄 Attempting database connection...
✅ Database connected successfully
📊 Database time: 2024-XX-XX XX:XX:XX.XXXXXX+00
```

---

## 🔐 Security considerations

✅ **SSL/TLS:**
- Production: Strict SSL (rejectUnauthorized: true)
- Development: Flexible SSL (rejectUnauthorized: false)
- Supabase forces HTTPS

✅ **Authentication:**
- JWT tokens for API requests
- Minimum 32-character JWT secret
- Token expiration: 7 days

✅ **Role-Based Access Control:**
- admin (level 4) - Full access
- moderator (level 3) - Content moderation
- creator (level 2) - Can create/edit ideas
- contributor (level 1) - Can collaborate
- user (level 0) - Basic read access

✅ **Audit Logging:**
- All user actions logged in `audit_logs`
- Includes IP address and user agent
- Enables compliance and debugging

---

## 🔄 BACKEND-FRONTEND DATA FLOW

### **Idea Creation Flow**
```
Frontend → POST /api/ideas
  ↓
Backend → Validates JWT token
  ↓
Backend → Inserts into PostgreSQL (ideas table)
  ↓
Backend → Logs action in audit_logs
  ↓
Backend → Returns created idea + unlocked achievements
  ↓
Frontend → Shows success + new idea card
```

### **Fallback Mechanism**
If backend API fails:
```
Frontend tries → http://localhost:3001/api/ideas
  ↓ [FAILS]
Frontend → Falls back to Supabase JS client
  ↓
Frontend → supabase.from('ideas').select(...)
  ↓
Works if Supabase connection available
```

---

## 📊 Row Counts & Maintenance

**Recommended Query Limits:**
- Ideas: SELECT with LIMIT 50 (pagination)
- Notifications: SELECT with LIMIT 100 WHERE read=false
- Audit logs: SELECT with date range filters
- Email logs: Archive monthly data older than 6 months

**Index Maintenance:**
```sql
-- Analyze tables for query optimization
ANALYZE users;
ANALYZE ideas;
ANALYZE audit_logs;
ANALYZE notification_queue;
```

---

## ✅ Verification Checklist

- [ ] All 7 tables exist in Supabase
- [ ] users table has 2FA columns
- [ ] users table has RBAC columns
- [ ] Indexes are created (check Supabase Table Editor)
- [ ] Foreign key relationships work
- [ ] Backend .env has correct DATABASE_URL
- [ ] Backend connects successfully with `npm run dev`
- [ ] Frontend loads ideas without error
- [ ] 2FA authentication works
- [ ] Notifications can be created

---

## 📞 Troubleshooting

### **"Could not connect to database"**
```
✓ Check DATABASE_URL format in backend/.env
✓ Verify Supabase project is active
✓ Check if sslmode is correct (usually ?sslmode=require)
✓ Verify password doesn't have special characters (URL encode if needed)
```

### **"Does not exist: relation 'ideas' does not exist"**
```
✓ Run the migration in Supabase SQL Editor
✓ Check if tables exist in Table Editor
✓ Verify table names match (case-sensitive)
```

### **"Connection timeout"**
```
✓ Increase connectionTimeoutMillis in database.ts
✓ Check network connectivity to Supabase
✓ Verify IP is whitelisted (if Supabase has IP restrictions)
```

### **"JWT token expired"**
```
✓ Clear localStorage and re-login
✓ Check JWT_EXPIRES_IN setting in backend/.env
✓ Verify server time is synchronized
```

---

## 🎯 DATABASE SUMMARY

| Aspect | Details |
|--------|---------|
| **Database Type** | PostgreSQL |
| **Provider** | Supabase (Cloud-hosted) |
| **Total Tables** | 7 (2 core + 5 new) |
| **Connection Method** | DATABASE_URL environment variable |
| **SSL** | Required in production |
| **Connection Pool** | Max 20 connections, 30s idle timeout |
| **Backup** | Supabase handles automatically |
| **Multi-database** | NO - Single PostgreSQL instance |

---

**Last Updated:** 2024
**Schema Version:** 001_add_2fa_rbac_audit
**Status:** Ready for Production

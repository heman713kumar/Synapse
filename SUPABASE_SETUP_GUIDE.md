# 🚀 SUPABASE DATABASE SETUP GUIDE - STEP BY STEP

## ⚡ TL;DR - The Fastest Way to Set Up

1. **Copy migration file:** `backend/migrations/001_add_2fa_rbac_audit.sql`
2. **Go to:** Supabase → Your Project → SQL Editor
3. **Paste** the migration content
4. **Click Run**
5. **Done!** All 7 tables created

---

## 📍 STEP-BY-STEP SETUP

### **STEP 1️⃣: Log Into Supabase**

1. Go to https://app.supabase.com
2. Log in with your account
3. Select your project (or create one)

**Your Project Details:**
```
Project URL:  https://fsgcdhshhsbmodspyggn.supabase.co
Database:     postgres (default)
Region:       (likely us-east-1 or eu-west-1)
```

---

### **STEP 2️⃣: Navigate to SQL Editor**

1. In left sidebar, click **"SQL Editor"**
2. Click **"New Query"** (top-right button)
3. You'll see a blank SQL editor

---

### **STEP 3️⃣: Copy the Migration File**

**File Location:** `backend/migrations/001_add_2fa_rbac_audit.sql`

**Content to Copy:**
```sql
-- Migration: Add 2FA and Audit Logging Tables
-- [Full content from the file]

ALTER TABLE users
ADD COLUMN IF NOT EXISTS two_fa_enabled BOOLEAN DEFAULT FALSE,
-- ... (copy entire file)
```

**How to copy:**
- Open file in VS Code
- Select ALL (Ctrl+A)
- Copy (Ctrl+C)

---

### **STEP 4️⃣: Paste & Execute**

1. **Paste** into Supabase SQL Editor (Ctrl+V)
2. **Click "RUN"** button (or press Ctrl+Enter)
3. **Wait** for execution (should take < 5 seconds)

**Expected Result:**
```
✅ Success!
Rows affected: 0
Query executed in XX ms
```

**If you see errors:**
- ❌ "relation 'users' does not exist" → Create users table first
- ❌ "column already exists" → Already ran this migration
- ❌ "syntax error" → Check SQL file for typos

---

### **STEP 5️⃣: Verify Tables Created**

1. Go to **Table Editor** in Supabase (left sidebar)
2. You should see these new tables:
   - ✅ audit_logs
   - ✅ user_badges
   - ✅ email_logs
   - ✅ notification_settings
   - ✅ notification_queue

3. Verify **users table** has new columns:
   - Click "users" table
   - Scroll right
   - You should see 2FA columns (two_fa_enabled, two_fa_secret, etc.)
   - And RBAC columns (role, badges_count)

---

### **STEP 6️⃣: Get DATABASE_URL**

1. In Supabase, go **Settings** (gear icon, bottom-left)
2. Click **"Database"**
3. Look for **"Connection string"** section
4. Under **"PostgreSQL"**, click **"Copy"** next to the connection string

**It looks like:**
```
postgresql://postgres.username:password@db.supabase.co:5432/postgres?sslmode=require
```

---

### **STEP 7️⃣: Configure Backend**

**Create/Edit** `backend/.env`:

```env
DATABASE_URL=postgresql://postgres.glywfzkdpxhjvrsyaflw:YourPassword@db.supabase.co:5432/postgres?sslmode=require
JWT_SECRET=your-super-secure-secret-at-least-32-characters-long
JWT_EXPIRES_IN=7d
NODE_ENV=development
PORT=3001
CORS_ORIGIN=http://localhost:5173
GOOGLE_GENAI_API_KEY=sk-your-key-here
MAX_FILE_SIZE=5242880
ALLOWED_FILE_TYPES=jpg,jpeg,png,gif,pdf,doc,docx
```

**Where to paste:**
1. Open VS Code terminal in backend folder
2. Run: `echo "DATABASE_URL=..." > .env`
3. Or create `.env` file manually

---

### **STEP 8️⃣: Test Backend Connection**

1. **Open terminal** in `backend/` directory
2. **Run:**
   ```bash
   npm install
   npm run dev
   ```

3. **Expected output:**
   ```
   🔧 Database Configuration:
   Connected to: postgresql://****@db.supabase.co:5432/postgres
   🔗 Final Database Config - Host: db.supabase.co, Port: 5432, SSL Enabled
   🔄 Attempting database connection...
   ✅ Database connected successfully
   📊 Database time: 2024-01-15 10:30:45.123456+00
   
   🚀 Server running on http://localhost:3001
   ```

4. **If you see errors**, see **Troubleshooting** section below

---

### **STEP 9️⃣: Frontend Configuration**

The frontend `.env` or `.env.production` should already have:

```env
VITE_SUPABASE_URL=https://fsgcdhshhsbmodspyggn.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Nothing to change here** - these are already configured!

---

### **STEP 🔟: Start the App**

**Terminal 1 - Frontend:**
```bash
cd frontend
npm install
npm run dev
```

**Terminal 2 - Backend:**
```bash
cd backend
npm run dev
```

**Expected:**
```
✅ Frontend running on http://localhost:5173
✅ Backend running on http://localhost:3001
✅ Connected to Supabase PostgreSQL
```

---

## ✅ Verification Checklist

After setup, verify everything works:

- [ ] All 7 tables exist in Supabase Table Editor
- [ ] users table has new 2FA columns
- [ ] users table has role and badges_count columns
- [ ] Backend connects without errors
- [ ] Frontend loads without "Could not load ideas" error
- [ ] Can create a new idea from frontend
- [ ] Ideas appear immediately (from database)
- [ ] Can log in with 2FA if enabled

---

## 🔴 Troubleshooting

### **Error: "connection refused"**

**Cause:** Backend can't reach Supabase

**Fix:**
1. Check DATABASE_URL is correct
2. Verify network connection
3. Check firewall allows PostgreSQL traffic
4. Paste DATABASE_URL again (may have copy error)

```bash
# Test connection
psql -U postgres -h db.supabase.co -d postgres
```

---

### **Error: "relation 'users' does not exist"**

**Cause:** users table not created yet

**Fix:**
1. Create users table first (may need to run initial schema)
2. Or run the migration in correct order

```sql
-- Create users table if missing
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    display_name VARCHAR(255),
    avatar_url TEXT,
    bio TEXT,
    user_type VARCHAR(20) DEFAULT 'thinker',
    skills JSONB DEFAULT '[]'::jsonb,
    interests TEXT[] DEFAULT '{}',
    onboarding_completed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

---

### **Error: "column already exists"**

**Cause:** Migration already ran once

**Fix:**
- This is normal! Just means you don't need to run it again
- All tables and columns already exist
- Can safely proceed to next step

---

### **Error: "column does not exist"**

**Cause:** Code expects a column that doesn't exist

**Fix:**
1. Check migration file was fully executed
2. Verify no SQL errors during migration
3. Re-run migration:

```sql
-- Re-run entire migration
\c (your database)
-- Copy/paste entire 001_add_2fa_rbac_audit.sql
```

---

### **Error: "Could not load ideas" on frontend**

**Cause:** Database connection issue or backend not running

**Fix:**
1. **Check backend is running:**
   ```bash
   cd backend && npm run dev
   ```

2. **Check DATABASE_URL is set:**
   ```bash
   echo $DATABASE_URL
   ```

3. **Check Supabase is reachable:**
   ```bash
   ping db.supabase.co
   ```

4. **Check logs:**
   - Look at backend terminal output
   - Check for connection errors
   - Look at browser console (F12)

---

### **Error: "Authentication failed" or "JWT expired"**

**Fix:**
1. Clear browser cache/localStorage
2. Log in again
3. Check JWT_SECRET is set in backend/.env
4. Verify token expiration is reasonable (7d is good)

---

## 📊 What Gets Created

### **New Tables (5)**

| Table | Purpose | Rows |
|-------|---------|------|
| audit_logs | Track user actions | Start at 0 |
| user_badges | Track achievements | Start at 0 |
| email_logs | Track sent emails | Start at 0 |
| notification_settings | User preferences | 1 per user |
| notification_queue | Pending notifications | Varies |

### **Modified Tables (1)**

| Table | Changes | Columns Added |
|-------|---------|---|
| users | 2FA + RBAC | 10 new columns |
| ideas | Visibility | 2 new columns |

---

## 🔐 Security Notes

✅ **Never share:** DATABASE_URL (contains password)
✅ **Never commit:** .env files to git
✅ **Always use:** SSL/TLS (?sslmode=require)
✅ **Always set:** Strong JWT_SECRET (min 32 chars)
✅ **Rotate:** JWT_SECRET periodically in production

---

## 📝 After Setup - What to Do Next

1. **Test 2FA Setup:**
   - Log in as a user
   - Enable 2FA in profile settings
   - Verify backup codes generated

2. **Check Audit Logs:**
   - Perform some actions (create idea, etc.)
   - Go to Supabase → Table Editor → audit_logs
   - Should see your actions logged

3. **Test Notifications:**
   - Create a new idea
   - Share it with someone
   - Check notification_queue for new entries

4. **Monitor Database Growth:**
   - ideas_table row count
   - user_badges achievements
   - audit_logs actions

---

## 🎯 Next Steps

- [ ] Run migration in Supabase
- [ ] Set DATABASE_URL in backend/.env
- [ ] Start backend with `npm run dev`
- [ ] Verify "Database connected successfully"
- [ ] Start frontend with `npm run dev`
- [ ] Test creating an idea
- [ ] Check data appears in Supabase

**Total setup time: ~10-15 minutes** ⏱️

---

## 📞 Need Help?

Check these files for more info:
- `DATABASE_COMPLETE_SCHEMA.md` - Full schema reference
- `backend/migrations/001_add_2fa_rbac_audit.sql` - Migration SQL
- `backend/.env.example` - Configuration template
- `backend/src/db/database.ts` - Connection code

**Common issues resolved:**
✅ "Could not load ideas" - backend not running
✅ "Connection refused" - DATABASE_URL wrong
✅ "Column exists" - already migrated (it's OK!)
✅ "JWT expired" - clear cache and re-login

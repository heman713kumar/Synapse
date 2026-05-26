# 🔧 HOW TO FIX THE DATABASE ERROR

## ❌ The Problem
You got this error:
```
ERROR:  42P16: multiple primary keys for table "connections" are not allowed
```

**Cause:** The connections table already exists with a conflicting structure or duplicate primary key definition.

---

## ✅ The Solution (2 Options)

### **OPTION 1: Use the Fixed Script (RECOMMENDED) ✅**

I've created a **corrected script** that handles this:

**File:** `FIX_DATABASE_SCHEMA_SIMPLE.sql`

**Steps:**
1. Go to: https://app.supabase.com → Your Project
2. Click: **SQL Editor** → **New Query**
3. **Delete any old query** (important!)
4. Copy and paste content from: `FIX_DATABASE_SCHEMA_SIMPLE.sql`
5. Click: **Run**
6. ✅ Success! No more errors

**Why this works:**
- Drops the old broken table first with `DROP TABLE IF EXISTS`
- Creates a fresh, clean table
- Uses correct PostgreSQL syntax

---

### **OPTION 2: Run Step-by-Step (If Option 1 Still Fails)**

**Step 2A: Check if connections table exists**
```sql
-- Run this first to see if the table exists
SELECT EXISTS(
  SELECT FROM information_schema.tables 
  WHERE table_name = 'connections'
);
```

**Step 2B: Delete the old table**
```sql
-- Only run this if the above returned 'true'
DROP TABLE IF EXISTS public.connections CASCADE;
```

**Step 2C: Create fresh table**
```sql
CREATE TABLE public.connections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  following_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  connection_type varchar(20) DEFAULT 'follow',
  status varchar(20) DEFAULT 'accepted',
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(follower_id, following_id)
);
```

**Step 2D: Add indexes**
```sql
CREATE INDEX idx_connections_follower ON public.connections(follower_id);
CREATE INDEX idx_connections_following ON public.connections(following_id);
CREATE INDEX idx_connections_status ON public.connections(status);
```

**Then continue with the rest of the script step by step**

---

## 🧪 VERIFICATION

After running the script, verify everything worked:

```sql
-- Check if connections table was created
SELECT tablename FROM pg_tables WHERE tablename = 'connections';

-- Should return: "connections"

-- Check if email columns were added to users
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'users' AND column_name LIKE 'email%';

-- Should return columns like: email_verified, email_verification_token, etc.
```

---

## 📝 IMPORTANT NOTES

1. **Safe to Run Multiple Times:** The script uses `CREATE TABLE IF NOT EXISTS` and `ADD COLUMN IF NOT EXISTS` so it won't cause errors if run again

2. **Use This File:** `FIX_DATABASE_SCHEMA_SIMPLE.sql` (NOT the original one)

3. **Copy Everything:** Make sure you copy the ENTIRE content, not just part of it

4. **One Query Only:** Don't split it into multiple queries - paste the whole thing at once

5. **Click Run Once:** Only click "Run" once - don't click it multiple times

---

## ❓ STILL GETTING ERRORS?

If you still get errors, try this:

**1. Check what tables you have:**
```sql
SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;
```

**2. Drop everything and start fresh:**
```sql
DROP TABLE IF EXISTS public.connections CASCADE;
DROP TABLE IF EXISTS public.audit_logs CASCADE;
DROP TABLE IF EXISTS public.notifications CASCADE;
-- ... etc for all tables
```

**3. Then run the full fix script**

---

## 🎯 RECOMMENDED STEPS

1. **Copy file:** `FIX_DATABASE_SCHEMA_SIMPLE.sql`
2. **Go to:** Supabase → SQL Editor → New Query
3. **Paste:** Entire content
4. **Run:** Click Run button
5. **Verify:** Check for ✅ in output (no red errors)
6. **Celebrate:** Your database is fixed! 🎉

---

## 📞 WHAT TO DO IF STUCK

If you're still stuck:

1. **Take a screenshot** of the error message
2. **Copy the exact error text**
3. **Run Option 2** (step by step)
4. **Let me know** which step fails

I can help you debug from there!

---

**Next Steps:**
- Run the script
- Verify success
- Database is ready! 🚀

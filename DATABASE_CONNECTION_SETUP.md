# 🗄️ DATABASE CONNECTION SETUP GUIDE

## ✅ Status

Your environment files are now **properly configured** with all Supabase credentials!

### What's Already Set ✅
- ✅ Frontend: Supabase URL + Anon Key
- ✅ Backend: Supabase URL + Service Role Key  
- ✅ JWT Secrets: Configured
- ✅ Database connection string template: Ready

### What You Need to Do ⚠️
- ⚠️ **Get PostgreSQL password from Supabase** (ONE STEP!)

---

## 🚀 QUICK START (2 MINUTES)

### Step 1: Get Your PostgreSQL Password

1. **Go to Supabase Dashboard:**
   - URL: https://app.supabase.com
   - Sign in with your account

2. **Select Your Project:**
   - Click on: **fsgcdhshhsbmodspyggn** (your project)

3. **Go to Database Settings:**
   - In the left sidebar, click: **Settings** → **Database**

4. **Copy Connection String:**
   - Look for: **"Connection string"** or **"Direct connection"**
   - You'll see something like:
     ```
     postgresql://postgres:YOUR_PASSWORD_HERE@db.fsgcdhshhsbmodspyggn.supabase.co:5432/postgres
     ```
   - **Copy the entire string including password**

5. **Extract the Password:**
   - The password is between `postgres:` and `@db.fsgcdhshhsbmodspyggn`
   - Example: If you see `postgres:abc123xyz@db...` then password is `abc123xyz`

### Step 2: Update Backend `.env`

**File:** `backend/.env`

**Find this line:**
```
DATABASE_URL=postgresql://postgres:YOUR_POSTGRES_PASSWORD@db.fsgcdhshhsbmodspyggn.supabase.co:5432/postgres?sslmode=require
```

**Replace `YOUR_POSTGRES_PASSWORD` with your actual password:**

Example (if password is `secretPassword123`):
```
DATABASE_URL=postgresql://postgres:secretPassword123@db.fsgcdhshhsbmodspyggn.supabase.co:5432/postgres?sslmode=require
```

### Step 3: Test Connection

**Run Backend:**
```bash
cd backend
npm install  # First time only
npm run dev
```

**Expected Output (✅ SUCCESS):**
```
🔧 Database Configuration:
Connected to: postgresql://postgres:****@db.fsgcdhshhsbmodspyggn.supabase.co:5432/postgres

🔗 Final Database Config - Host: db.fsgcdhshhsbmodspyggn.supabase.co, Port: 5432, SSL Enabled
🔄 Attempting database connection...
✅ Database connected successfully
🚀 Synapse backend running on port 3001
```

**If you see ❌ ERROR:**
```
❌ Failed to authenticate with database
```
**Then:** Double-check your password - copy/paste again from Supabase

---

## 📋 COMPLETE ENVIRONMENT SETUP

### Frontend `.env` (DONE ✅)
```
VITE_SUPABASE_URL=https://fsgcdhshhsbmodspyggn.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZzZ2NkaHNoaHNibW9kc3B5Z2duIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA1OTYwMDMsImV4cCI6MjA3NjE3MjAwM30.XPFkANZHEpKDKLQ9xgx_NSJZ9HFKfChjZOfg0AncZ1E
VITE_API_URL=http://localhost:3001
VITE_ENV=development
```

### Backend `.env` (PARTIALLY DONE - NEEDS PASSWORD)

**✅ Already Set:**
- Server configuration
- Supabase URLs & Keys
- JWT secrets
- File upload settings

**⚠️ Still Needs:**
- DATABASE_URL password (Step 2 above)

---

## 🔐 Security Notes

- ✅ **Never commit `.env` to git** - Already in `.gitignore`
- ✅ **Never share your database password** - Keep it private
- ✅ **SSL enabled** - Your connection uses `sslmode=require`
- ✅ **Service Role Key** - Kept secret on backend only
- ✅ **Anon Key** - Safe for frontend (limited permissions)

---

## 🧪 VERIFICATION CHECKLIST

After completing the steps above, run this checklist:

- [ ] Frontend `.env` has `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
- [ ] Backend `.env` has `DATABASE_URL` with real password (not placeholder)
- [ ] Backend `.env` has `SUPABASE_SERVICE_ROLE_KEY`
- [ ] Backend `.env` has `JWT_SECRET`
- [ ] Backend starts without database errors: `npm run dev`
- [ ] Frontend can reach backend: `npm run dev`
- [ ] You can login with your credentials

---

## 🎯 NEXT STEPS

After database connection is working:

1. **Run Backend Migration** (optional - schema should already exist):
   ```bash
   cd backend
   npm run migrate
   ```

2. **Start Both Services:**
   ```bash
   # Terminal 1 - Backend
   cd backend && npm run dev
   
   # Terminal 2 - Frontend  
   npm run dev
   ```

3. **Test Login:**
   - Go to: http://localhost:5173
   - Try signing up with a test account
   - Verify email verification works
   - Check backend logs for database queries

---

## ❓ TROUBLESHOOTING

### Error: "ECONNREFUSED" or "Connection refused"
**Cause:** Supabase database is down or credentials are wrong
**Fix:** 
1. Verify password in Supabase dashboard
2. Check internet connection
3. Make sure you're using correct host: `db.fsgcdhshhsbmodspyggn.supabase.co`

### Error: "FATAL: password authentication failed"
**Cause:** Wrong password in DATABASE_URL
**Fix:**
1. Go back to Supabase Settings → Database
2. Reset password if needed
3. Copy fresh connection string

### Error: "SSL certificate problem: certificate verify failed"
**Cause:** SSL certificate issue (rare)
**Fix:** This is handled automatically - SSL is set to `{ rejectUnauthorized: false }` in development

### Backend won't start
**Cause:** Missing or wrong DATABASE_URL
**Fix:**
```bash
# Check your .env file
cat backend/.env | grep DATABASE_URL

# Should show: postgresql://postgres:YOUR_PASSWORD@db.fsgcdhshhsbmodspyggn.supabase.co:5432/postgres?sslmode=require
```

---

## 📚 Additional Resources

- **Supabase Docs:** https://supabase.com/docs
- **PostgreSQL Docs:** https://www.postgresql.org/docs/
- **Project API Docs:** See [API_REFERENCE.md](./API_REFERENCE.md)
- **Database Schema:** See [DATABASE_COMPLETE_SCHEMA.md](./DATABASE_COMPLETE_SCHEMA.md)

---

## ✨ You're Almost There!

The hard part is done! Now just add your PostgreSQL password and everything will work. 

**Questions?** Check the troubleshooting section above. 🚀

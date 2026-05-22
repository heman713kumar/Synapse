# 🚀 QUICK START - 5 MINUTES TO TESTING

## What Was Built
- ✅ Email verification after signup
- ✅ Password reset system  
- ✅ Rate limiting (brute force protection)
- ✅ Password strength meter
- ✅ All styled with dark mode support

---

## DO THIS NOW (In Order)

### 1️⃣ Run Database Migration (1 minute)

Go to Supabase Dashboard → SQL Editor and run:

```sql
ALTER TABLE users
ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS email_verification_token VARCHAR(255) UNIQUE,
ADD COLUMN IF NOT EXISTS email_verification_token_expires TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS password_reset_token VARCHAR(255) UNIQUE,
ADD COLUMN IF NOT EXISTS password_reset_token_expires TIMESTAMP WITH TIME ZONE;

CREATE INDEX IF NOT EXISTS idx_email_verification_token ON users(email_verification_token);
CREATE INDEX IF NOT EXISTS idx_password_reset_token ON users(password_reset_token);
```

### 2️⃣ Install Dependencies (2 minutes)

```bash
cd backend
npm install
```

### 3️⃣ Add Email Config (1 minute)

Edit `backend/.env`:

```env
FRONTEND_URL=http://localhost:5173

SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-16-char-app-password
SMTP_FROM=noreply@synapse.app
```

**Need Gmail app password?**
1. Go to myaccount.google.com → Security
2. Enable 2-Step Verification
3. App passwords → Select Mail + Windows
4. Copy 16-char password

### 4️⃣ Start Both Servers

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

---

## TEST THE FEATURES (5 minutes)

### Test 1: Sign Up + Email Verification
```
1. Open http://localhost:5173
2. Click "Sign Up"
3. Fill form (email: test@example.com)
4. Check email for verification link
5. Click link → Email verified! ✅
```

### Test 2: Password Reset
```
1. Go to Login
2. Click "Forgot password?"
3. Enter your email
4. Check email for reset link
5. Click link → Set new password ✅
6. Login with new password
```

### Test 3: Rate Limiting
```
1. Try login with WRONG password 6 times
2. On attempt 6 → "Too many requests" message ✅
```

---

## ✅ DONE!

If all tests passed, your auth system is production-ready.

See `IMPLEMENTATION_COMPLETE.md` for full details.

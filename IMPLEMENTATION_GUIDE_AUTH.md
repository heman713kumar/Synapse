# 🔐 IMPLEMENTATION GUIDE: EMAIL VERIFICATION & PASSWORD RESET

## Phase 1: Email Verification (2-3 hours)

### Step 1: Database Schema Update

**New Columns to Add:**
```sql
ALTER TABLE users
ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS email_verification_token VARCHAR(255) UNIQUE,
ADD COLUMN IF NOT EXISTS email_verification_token_expires TIMESTAMP WITH TIME ZONE;

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_email_verification_token ON users(email_verification_token);
```

---

### Step 2: Backend - Update Registration Route

**File:** `backend/src/routes/auth.routes.ts`

Add after user creation in registration:

```typescript
// After creating user, generate verification token
import crypto from 'crypto';

// Generate verification token
const verificationToken = crypto.randomBytes(32).toString('hex');
const tokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

// Store token in database
await query(
  `UPDATE users SET 
    email_verification_token = $1, 
    email_verification_token_expires = $2 
   WHERE id = $3`,
  [verificationToken, tokenExpires, user.id]
);

// Send verification email
const verificationLink = `${process.env.FRONTEND_URL}/verify-email?token=${verificationToken}`;

await sendEmail(
  email,
  'Verify Your Email - Synapse',
  `Welcome to Synapse!\n\nClick the link below to verify your email:\n${verificationLink}\n\nThis link expires in 24 hours.`,
  `<h2>Verify Your Email</h2>
   <p>Welcome to Synapse!</p>
   <p><a href="${verificationLink}" style="background-color: #4f46e5; color: white; padding: 10px 20px; border-radius: 5px; text-decoration: none;">Verify Email</a></p>
   <p>Link expires in 24 hours.</p>`
);

// Return success response
res.status(201).json({
  message: 'User registered successfully. Check your email for verification link.',
  user: { ... },
  token,
  pendingEmailVerification: true
});
```

---

### Step 3: Backend - New Verification Route

**File:** `backend/src/routes/auth.routes.ts`

Add new endpoint:

```typescript
// Verify email token
router.post('/verify-email', async (req: Request, res: Response) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ error: 'Verification token is required' });
    }

    // Find user with this token
    const result = await query(
      `SELECT id, email FROM users 
       WHERE email_verification_token = $1 
       AND email_verification_token_expires > NOW()`,
      [token]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({ 
        error: 'Invalid or expired verification token. Please request a new one.' 
      });
    }

    const user = result.rows[0];

    // Mark email as verified and clear token
    await query(
      `UPDATE users SET 
        email_verified = true, 
        email_verification_token = NULL,
        email_verification_token_expires = NULL
       WHERE id = $1`,
      [user.id]
    );

    // Log audit event
    await query(
      `INSERT INTO audit_logs (user_id, action, resource_type, resource_id, created_at)
       VALUES ($1, $2, $3, $4, NOW())`,
      [user.id, 'EMAIL_VERIFIED', 'USER', user.id]
    );

    res.json({ 
      success: true, 
      message: 'Email verified successfully. You can now use all features.' 
    });

  } catch (error) {
    console.error('Email verification error:', error);
    res.status(500).json({ error: 'Failed to verify email. Try again later.' });
  }
});

// Resend verification email (for expired tokens)
router.post('/resend-verification', async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    // Find user
    const result = await query(
      `SELECT id, email_verified FROM users WHERE email = $1`,
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Email not found' });
    }

    const user = result.rows[0];

    // If already verified, no need to resend
    if (user.email_verified) {
      return res.json({ 
        message: 'Email already verified' 
      });
    }

    // Generate new token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const tokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);

    // Update token
    await query(
      `UPDATE users SET 
        email_verification_token = $1, 
        email_verification_token_expires = $2 
       WHERE id = $3`,
      [verificationToken, tokenExpires, user.id]
    );

    // Send email
    const verificationLink = `${process.env.FRONTEND_URL}/verify-email?token=${verificationToken}`;
    await sendEmail(
      email,
      'Verify Your Email - Synapse',
      `Click the link to verify: ${verificationLink}`,
      `<p><a href="${verificationLink}">Verify Email</a></p>`
    );

    res.json({ 
      message: 'Verification email sent. Check your inbox.' 
    });

  } catch (error) {
    console.error('Resend verification error:', error);
    res.status(500).json({ error: 'Failed to resend verification email' });
  }
});
```

---

### Step 4: Backend Environment Variables

**File:** `backend/.env`

Add/verify these are set:

```env
# Email service
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_FROM=noreply@synapse.app

# Frontend URL for email links
FRONTEND_URL=http://localhost:5173
```

**For Gmail:**
1. Go to Google Account settings
2. Enable 2-Factor Authentication
3. Create "App Password" for Gmail
4. Copy that password into `SMTP_PASSWORD`

---

### Step 5: Frontend - Verify Email Page

**File:** `src/components/VerifyEmail.tsx` (Create new file)

```typescript
import React, { useEffect, useState } from 'react';
import api from '../services/backendApiService';

interface VerifyEmailProps {
  setPage: (page: string) => void;
  setCurrentUser: (user: any) => void;
}

export const VerifyEmail: React.FC<VerifyEmailProps> = ({ setPage, setCurrentUser }) => {
  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
  const [message, setMessage] = useState('');
  const [resendLoading, setResendLoading] = useState(false);
  const [email, setEmail] = useState('');

  useEffect(() => {
    verifyToken();
  }, []);

  const verifyToken = async () => {
    try {
      // Get token from URL
      const params = new URLSearchParams(window.location.search);
      const token = params.get('token');

      if (!token) {
        setStatus('error');
        setMessage('Invalid verification link. No token provided.');
        return;
      }

      // Call backend to verify
      const response = await api.verifyEmail(token);
      
      setStatus('success');
      setMessage(response.message);

      // Redirect to login after 2 seconds
      setTimeout(() => {
        setPage('feed');
      }, 2000);

    } catch (error: any) {
      setStatus('error');
      setMessage(error.message || 'Failed to verify email. Link may be expired.');
    }
  };

  const handleResendEmail = async () => {
    if (!email) {
      alert('Please enter your email');
      return;
    }

    setResendLoading(true);
    try {
      await api.resendVerificationEmail(email);
      alert('Verification email sent! Check your inbox.');
    } catch (error) {
      alert('Failed to resend email. Try again.');
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-purple-100 dark:from-[#0F0F1A] dark:to-[#1A1A2E] p-4">
      <div className="max-w-md w-full bg-white dark:bg-[#1A1A24] rounded-2xl shadow-2xl p-8 text-center">
        
        {status === 'verifying' && (
          <div>
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 mx-auto mb-4"></div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Verifying Email...</h2>
            <p className="text-gray-600 dark:text-gray-400">Please wait while we verify your email address.</p>
          </div>
        )}

        {status === 'success' && (
          <div>
            <div className="text-5xl mb-4">✅</div>
            <h2 className="text-2xl font-bold text-green-600 dark:text-green-400 mb-2">Email Verified!</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">{message}</p>
            <p className="text-sm text-gray-500">Redirecting you to the app...</p>
          </div>
        )}

        {status === 'error' && (
          <div>
            <div className="text-5xl mb-4">❌</div>
            <h2 className="text-2xl font-bold text-red-600 dark:text-red-400 mb-2">Verification Failed</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">{message}</p>
            
            <div className="space-y-4">
              <div>
                <input
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-[#252532] text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <button
                onClick={handleResendEmail}
                disabled={resendLoading}
                className="w-full bg-indigo-600 text-white font-semibold py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50"
              >
                {resendLoading ? 'Sending...' : 'Resend Verification Email'}
              </button>
              <a href="/" className="block text-indigo-600 dark:text-indigo-400 hover:underline">
                Back to Login
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
```

---

### Step 6: Update Backend API Service

**File:** `src/services/backendApiService.ts`

Add these methods:

```typescript
verifyEmail: (token: string): Promise<{ success: boolean; message: string }> => {
  return apiRequest('/api/auth/verify-email', {
    method: 'POST',
    body: JSON.stringify({ token })
  });
},

resendVerificationEmail: (email: string): Promise<{ message: string }> => {
  return apiRequest('/api/auth/resend-verification', {
    method: 'POST',
    body: JSON.stringify({ email })
  });
},
```

---

### Step 7: Update App.tsx Routes

**File:** `src/App.tsx`

Add to page routing:

```typescript
{!currentUser && page !== 'login' && (
  <Login setCurrentUser={setCurrentUser} setPage={setPage} onGuestLogin={onGuestLogin} />
)}

{page === 'verify-email' && (
  <VerifyEmail setPage={setPage} setCurrentUser={setCurrentUser} />
)}
```

---

## Phase 2: Password Reset (2-3 hours)

### Step 1: Database Schema Update

```sql
ALTER TABLE users
ADD COLUMN IF NOT EXISTS password_reset_token VARCHAR(255) UNIQUE,
ADD COLUMN IF NOT EXISTS password_reset_token_expires TIMESTAMP WITH TIME ZONE;

CREATE INDEX IF NOT EXISTS idx_password_reset_token ON users(password_reset_token);
```

---

### Step 2: Backend - New Routes

**File:** `backend/src/routes/auth.routes.ts`

```typescript
import crypto from 'crypto';

// --- REQUEST PASSWORD RESET ---
router.post('/forgot-password', async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    // Find user
    const result = await query(
      'SELECT id, email FROM users WHERE email = $1',
      [email]
    );

    // SECURITY: Don't reveal if email exists
    if (result.rows.length === 0) {
      // Return same message as success (security best practice)
      return res.json({ 
        message: 'If an account exists, a password reset link has been sent.' 
      });
    }

    const user = result.rows[0];

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const tokenExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    // Store token in database
    await query(
      `UPDATE users SET 
        password_reset_token = $1, 
        password_reset_token_expires = $2 
       WHERE id = $3`,
      [resetToken, tokenExpires, user.id]
    );

    // Send reset email
    const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;

    await sendEmail(
      email,
      'Password Reset Request - Synapse',
      `Click the link below to reset your password:\n${resetLink}\n\nThis link expires in 1 hour.\n\nIf you didn't request this, ignore this email.`,
      `<h2>Password Reset Request</h2>
       <p>Click the button below to reset your password:</p>
       <p><a href="${resetLink}" style="background-color: #4f46e5; color: white; padding: 10px 20px; border-radius: 5px; text-decoration: none;">Reset Password</a></p>
       <p>Link expires in 1 hour.</p>
       <p>If you didn't request this, you can safely ignore this email.</p>`
    );

    // Log audit event
    await query(
      `INSERT INTO audit_logs (action, resource_type, resource_id, details, created_at)
       VALUES ($1, $2, $3, $4, NOW())`,
      ['PASSWORD_RESET_REQUESTED', 'USER', user.id, JSON.stringify({ email })]
    );

    res.json({ 
      message: 'If an account exists, a password reset link has been sent.' 
    });

  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ error: 'Failed to process reset request' });
  }
});

// --- VERIFY AND RESET PASSWORD ---
router.post('/reset-password', async (req: Request, res: Response) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({ error: 'Token and new password are required' });
    }

    // Validate password
    const passwordValidation = validatePassword(newPassword);
    if (!passwordValidation.valid) {
      return res.status(400).json({ error: passwordValidation.error });
    }

    // Find user with valid token
    const result = await query(
      `SELECT id, email FROM users 
       WHERE password_reset_token = $1 
       AND password_reset_token_expires > NOW()`,
      [token]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({ 
        error: 'Invalid or expired password reset token. Please request a new one.' 
      });
    }

    const user = result.rows[0];

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    // Update password and clear reset token
    await query(
      `UPDATE users SET 
        password_hash = $1, 
        password_reset_token = NULL,
        password_reset_token_expires = NULL,
        updated_at = NOW()
       WHERE id = $2`,
      [hashedPassword, user.id]
    );

    // Log audit event
    await query(
      `INSERT INTO audit_logs (user_id, action, resource_type, resource_id, created_at)
       VALUES ($1, $2, $3, $4, NOW())`,
      [user.id, 'PASSWORD_RESET_COMPLETED', 'USER', user.id]
    );

    res.json({ 
      success: true, 
      message: 'Password reset successfully. You can now login with your new password.' 
    });

  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ error: 'Failed to reset password' });
  }
});
```

---

### Step 3: Frontend - Password Reset Page

**File:** `src/components/ResetPassword.tsx` (Create new file)

```typescript
import React, { useState, useEffect } from 'react';
import api from '../services/backendApiService';

interface ResetPasswordProps {
  setPage: (page: string) => void;
}

export const ResetPassword: React.FC<ResetPasswordProps> = ({ setPage }) => {
  const [status, setStatus] = useState<'form' | 'loading' | 'success' | 'error'>('form');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [token, setToken] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const t = params.get('token');
    if (!t) {
      setStatus('error');
      setError('Invalid reset link');
    }
    setToken(t || '');
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!password || !confirmPassword) {
      setError('Please fill in all fields');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 12) {
      setError('Password must be at least 12 characters');
      return;
    }

    setStatus('loading');

    try {
      const response = await api.resetPassword(token, password);
      setStatus('success');
      
      setTimeout(() => {
        setPage('login');
      }, 2000);
    } catch (err: any) {
      setStatus('form');
      setError(err.message || 'Failed to reset password');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-purple-100 dark:from-[#0F0F1A] dark:to-[#1A1A2E] p-4">
      <div className="max-w-md w-full bg-white dark:bg-[#1A1A24] rounded-2xl shadow-2xl p-8">
        
        {status === 'form' && (
          <form onSubmit={handleSubmit}>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Reset Password</h2>
            
            {error && (
              <div className="bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-200 p-3 rounded-lg mb-4">
                {error}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-gray-700 dark:text-gray-300 font-semibold mb-2">
                  New Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 12 characters"
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-[#252532] text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-gray-700 dark:text-gray-300 font-semibold mb-2">
                  Confirm Password
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm your password"
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-[#252532] text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-indigo-600 text-white font-semibold py-2 rounded-lg hover:bg-indigo-700"
              >
                Reset Password
              </button>
            </div>
          </form>
        )}

        {status === 'loading' && (
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">Resetting password...</p>
          </div>
        )}

        {status === 'success' && (
          <div className="text-center">
            <div className="text-5xl mb-4">✅</div>
            <h2 className="text-2xl font-bold text-green-600 dark:text-green-400 mb-2">Password Reset!</h2>
            <p className="text-gray-600 dark:text-gray-400">Your password has been reset successfully.</p>
            <p className="text-sm text-gray-500 mt-4">Redirecting to login...</p>
          </div>
        )}

        {status === 'error' && (
          <div className="text-center">
            <div className="text-5xl mb-4">❌</div>
            <h2 className="text-2xl font-bold text-red-600 dark:text-red-400 mb-2">Link Expired</h2>
            <p className="text-gray-600 dark:text-gray-400">This password reset link has expired.</p>
            <button
              onClick={() => setPage('login')}
              className="mt-4 w-full bg-indigo-600 text-white font-semibold py-2 rounded-lg hover:bg-indigo-700"
            >
              Back to Login
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
```

---

### Step 4: Update Login Component

**File:** `src/components/Login.tsx`

Add forgot password link:

```typescript
<div className="flex justify-between items-center mt-4">
  <label className="flex items-center">
    <input type="checkbox" className="h-4 w-4" />
    <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">Remember me</span>
  </label>
  <button
    type="button"
    onClick={() => setPage('forgot-password')}
    className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline"
  >
    Forgot password?
  </button>
</div>
```

---

### Step 5: Add Forgot Password Page

**File:** `src/components/ForgotPassword.tsx` (Create new file)

```typescript
import React, { useState } from 'react';
import api from '../services/backendApiService';

interface ForgotPasswordProps {
  setPage: (page: string) => void;
}

export const ForgotPassword: React.FC<ForgotPasswordProps> = ({ setPage }) => {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'form' | 'loading' | 'sent'>('form');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email) {
      setError('Please enter your email');
      return;
    }

    setStatus('loading');

    try {
      await api.forgotPassword(email);
      setStatus('sent');
    } catch (err: any) {
      setStatus('form');
      setError(err.message || 'Failed to send reset email');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-purple-100 dark:from-[#0F0F1A] dark:to-[#1A1A2E] p-4">
      <div className="max-w-md w-full bg-white dark:bg-[#1A1A24] rounded-2xl shadow-2xl p-8">
        
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Reset Password</h2>

        {status === 'form' && (
          <form onSubmit={handleSubmit}>
            {error && (
              <div className="bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-200 p-3 rounded-lg mb-4">
                {error}
              </div>
            )}

            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Enter your email and we'll send you a link to reset your password.
            </p>

            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-[#252532] text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 mb-4"
            />

            <button
              type="submit"
              disabled={!email}
              className="w-full bg-indigo-600 text-white font-semibold py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50 mb-4"
            >
              Send Reset Link
            </button>

            <button
              type="button"
              onClick={() => setPage('login')}
              className="w-full text-indigo-600 dark:text-indigo-400 hover:underline"
            >
              Back to Login
            </button>
          </form>
        )}

        {status === 'loading' && (
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">Sending reset email...</p>
          </div>
        )}

        {status === 'sent' && (
          <div className="text-center">
            <div className="text-5xl mb-4">📧</div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Check Your Email</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              We've sent a password reset link to {email}
            </p>
            <p className="text-sm text-gray-500 mb-4">
              The link expires in 1 hour.
            </p>
            <button
              onClick={() => setPage('login')}
              className="w-full bg-indigo-600 text-white font-semibold py-2 rounded-lg hover:bg-indigo-700"
            >
              Back to Login
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
```

---

### Step 6: Update Backend API Service

**File:** `src/services/backendApiService.ts`

Add methods:

```typescript
forgotPassword: (email: string): Promise<{ message: string }> => {
  return apiRequest('/api/auth/forgot-password', {
    method: 'POST',
    body: JSON.stringify({ email })
  });
},

resetPassword: (token: string, password: string): Promise<{ success: boolean; message: string }> => {
  return apiRequest('/api/auth/reset-password', {
    method: 'POST',
    body: JSON.stringify({ token, password })
  });
},
```

---

### Step 7: Update App.tsx

Add these to page routing:

```typescript
{page === 'forgot-password' && (
  <ForgotPassword setPage={setPage} />
)}

{page === 'reset-password' && (
  <ResetPassword setPage={setPage} />
)}
```

Update Page type:

```typescript
export type Page = 'feed' | 'ideaDetail' | 'profile' | 'explore' | 'connections' | 
                   'achievements' | 'newIdea' | 'verify-email' | 'forgot-password' | 
                   'reset-password' | 'onboarding' | 'bookmarks' | 'inbox' | 'chat' | 
                   'forum' | 'analytics' | 'notifications' | 'privacy' | 'kanban';
```

---

## ✅ Testing Checklist

After implementation, test:

- [ ] User registration sends verification email
- [ ] Clicking verification link marks email verified
- [ ] Expired tokens show error message
- [ ] Resend verification email works
- [ ] Forgot password email sends correctly
- [ ] Reset link is valid for 1 hour
- [ ] Expired reset links show error
- [ ] New password works after reset
- [ ] Redirects happen correctly
- [ ] Error messages are clear
- [ ] Works on mobile
- [ ] Works in dark mode

---

**Time Estimate:** 4-5 hours total for both features

**Next Steps:**
1. Run database migrations for new columns
2. Add to backend .env file
3. Implement backend routes
4. Create frontend components
5. Update App.tsx with new routes
6. Test end-to-end
7. Deploy to production

Let me know if you want me to implement these! 🚀

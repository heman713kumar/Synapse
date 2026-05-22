// C:\Users\hemant\Downloads\synapse\backend\src\routes\auth.routes.ts
import express, { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt, { Secret, SignOptions } from 'jsonwebtoken';
import crypto from 'crypto';
import { query } from '../db/database';
import { authenticateToken } from '../middleware/auth.middleware';
import { sendEmail } from '../services/emailService';
import { loginLimiter, registerLimiter, passwordResetLimiter, resendEmailLimiter } from '../middleware/rateLimiter';

const router = express.Router();

// --- INPUT VALIDATION HELPERS ---
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const USERNAME_REGEX = /^[a-zA-Z0-9_-]{3,20}$/;

function validateEmail(email: string): { valid: boolean; error?: string } {
    if (!email || !EMAIL_REGEX.test(email)) {
        return { valid: false, error: 'Invalid email format' };
    }
    if (email.length > 255) {
        return { valid: false, error: 'Email too long (max 255 characters)' };
    }
    return { valid: true };
}

function validateUsername(username: string): { valid: boolean; error?: string } {
    if (!username || !USERNAME_REGEX.test(username)) {
        return { 
            valid: false, 
            error: 'Username must be 3-20 characters, containing only letters, numbers, underscores, or hyphens' 
        };
    }
    return { valid: true };
}

function validatePassword(password: string): { valid: boolean; error?: string } {
    if (!password) {
        return { valid: false, error: 'Password is required' };
    }
    if (password.length < 12) {
        return { valid: false, error: 'Password must be at least 12 characters long' };
    }
    if (password.length > 128) {
        return { valid: false, error: 'Password too long (max 128 characters)' };
    }
    // Check for mix of character types
    const hasUppercase = /[A-Z]/.test(password);
    const hasLowercase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);
    
    const typeCount = [hasUppercase, hasLowercase, hasNumbers, hasSpecial].filter(Boolean).length;
    if (typeCount < 3) {
        return { 
            valid: false, 
            error: 'Password must contain at least 3 of: uppercase, lowercase, numbers, special characters' 
        };
    }
    return { valid: true };
}

function validateDisplayName(name: string): { valid: boolean; error?: string } {
    if (!name || name.trim().length === 0) {
        return { valid: false, error: 'Display name is required' };
    }
    if (name.length < 2 || name.length > 100) {
        return { valid: false, error: 'Display name must be 2-100 characters' };
    }
    return { valid: true };
}

// Get JWT secret from environment (required for token signing)
const JWT_SECRET = process.env.JWT_SECRET || 'default-insecure-secret';
if (!process.env.JWT_SECRET) {
    console.warn('⚠️  JWT_SECRET not set in environment - using default insecure value. Set JWT_SECRET in .env for production!');
}

// Helper function to get expiresIn value (number in seconds)
function getExpiresInSeconds(): number {
    const envValue = process.env.JWT_EXPIRES_IN; // e.g., "7d", "1h", "86400"
    
    if (envValue) {
        const parsedSeconds = parseInt(envValue, 10);
        if (!isNaN(parsedSeconds) && String(parsedSeconds) === envValue) {
            return parsedSeconds;
        }
        const unit = envValue.charAt(envValue.length - 1);
        const value = parseInt(envValue.substring(0, envValue.length - 1), 10);

        if (!isNaN(value)) {
            switch (unit) {
                case 'd': return value * 24 * 60 * 60; // days
                case 'h': return value * 60 * 60; // hours
                case 'm': return value * 60; // minutes
                case 's': return value; // seconds
            }
        }
    }
    return 7 * 24 * 60 * 60; // Default: 7 days
}

// Register endpoint
router.post('/register', registerLimiter, async (req: Request, res: Response) => {
    try {
        const { email, username, password, displayName, userType } = req.body;

        // Validate all inputs
        const emailValidation = validateEmail(email);
        if (!emailValidation.valid) {
            return res.status(400).json({ error: emailValidation.error });
        }

        const usernameValidation = validateUsername(username);
        if (!usernameValidation.valid) {
            return res.status(400).json({ error: usernameValidation.error });
        }

        const passwordValidation = validatePassword(password);
        if (!passwordValidation.valid) {
            return res.status(400).json({ error: passwordValidation.error });
        }

        const displayNameValidation = validateDisplayName(displayName);
        if (!displayNameValidation.valid) {
            return res.status(400).json({ error: displayNameValidation.error });
        }

        // Check if user already exists (log generic message for security)
        const userExists = await query(
          'SELECT id FROM users WHERE email = $1 OR username = $2',
          [email, username]
        );
        if (userExists.rows.length > 0) {
          return res.status(400).json({ error: 'Email or username already registered' });
        }

        // Hash password with 12 rounds
        const saltRounds = 12;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        // Generate email verification token
        const verificationToken = crypto.randomBytes(32).toString('hex');
        const tokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

        // Insert user with verification token
        const result = await query(
          `INSERT INTO users (email, username, display_name, user_type, password_hash, email_verification_token, email_verification_token_expires)
           VALUES ($1, $2, $3, $4, $5, $6, $7)
           RETURNING id, email, username, display_name, user_type, created_at`,
          [email, username, displayName, userType || 'thinker', hashedPassword, verificationToken, tokenExpires]
        );

        if (result.rows.length === 0) {
             throw new Error("User creation failed");
        }

        const user = result.rows[0];
        
        // Send verification email
        const verificationLink = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/verify-email?token=${verificationToken}`;
        try {
          await sendEmail(
            email,
            'Verify Your Email - Synapse',
            `Welcome to Synapse!\n\nClick the link below to verify your email:\n${verificationLink}\n\nThis link expires in 24 hours.`,
            `<h2>Verify Your Email</h2>
             <p>Welcome to Synapse! The place where great ideas meet brilliant minds.</p>
             <p><a href="${verificationLink}" style="background-color: #4f46e5; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; display: inline-block;">Verify Email</a></p>
             <p style="color: #666; font-size: 14px;">Link expires in 24 hours. If you didn't create this account, you can safely ignore this email.</p>`
          );
        } catch (emailError) {
          console.error('Failed to send verification email:', emailError);
          // Continue with registration even if email fails
        }
        
        const options: SignOptions = {
            expiresIn: getExpiresInSeconds() 
        };

        const token = jwt.sign(
          { userId: user.id, email: user.email },
          JWT_SECRET,
          options
        );

        res.status(201).json({
          message: 'User registered successfully. Check your email to verify your account.',
          user: {
            userId: user.id,
            email: user.email,
            username: user.username,
            displayName: user.display_name,
            userType: user.user_type,
            onboardingCompleted: false,
            emailVerified: false
          },
          token,
          pendingEmailVerification: true
        });

    } catch (error) {
        console.error('Registration error:', error);
        // Don't expose internal error details to client
        res.status(500).json({ error: 'Registration failed. Please try again.' });
    }
});

// Login endpoint
router.post('/login', loginLimiter, async (req: Request, res: Response) => {
   try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }

        // Validate email format
        const emailValidation = validateEmail(email);
        if (!emailValidation.valid) {
            return res.status(400).json({ error: 'Invalid email format' });
        }

        const result = await query(
          `SELECT id, email, username, display_name, user_type, password_hash, onboarding_completed, created_at, avatar_url, bio, skills, interests 
           FROM users WHERE email = $1`,
          [email]
        );

        if (result.rows.length === 0) {
          return res.status(401).json({ error: 'Invalid credentials' });
        }
        const user = result.rows[0];

        const isPasswordValid = await bcrypt.compare(password, user.password_hash);
        if (!isPasswordValid) {
          return res.status(401).json({ error: 'Invalid credentials' });
        }

        const options: SignOptions = {
             expiresIn: getExpiresInSeconds()
        };

        const token = jwt.sign(
          { userId: user.id, email: user.email },
          JWT_SECRET, // Use the checked constant
          options
        );

        console.log('User logged in successfully:', user.email);
        res.json({
          message: 'Login successful',
          user: {
            userId: user.id, // <-- (FIXED)
            email: user.email,
            username: user.username,
            displayName: user.display_name,
            userType: user.user_type,
            avatarUrl: user.avatar_url,
            bio: user.bio,
            skills: user.skills || [],
            interests: user.interests || [],
            onboardingCompleted: user.onboarding_completed,
            createdAt: user.created_at
          },
          token
        });

    } catch (error) {
        console.error('Login error:', error);
        // Don't expose internal error details to client
        res.status(500).json({ error: 'Login failed. Please try again.' });
    }
});

// Verify token endpoint
router.get('/verify', authenticateToken, async (req: Request, res: Response) => {
    try {
        const userId = req.user!.userId;

        const result = await query(
            'SELECT id, email, username, display_name, user_type, created_at FROM users WHERE id = $1',
            [userId]
        );

        if (result.rows.length === 0) {
            return res.status(401).json({ valid: false, error: 'Invalid token - user not found' });
        }
        const user = result.rows[0];

        res.json({
            valid: true,
            user: {
                userId: user.id, // <-- (FIXED)
                email: user.email,
                username: user.username,
                displayName: user.display_name,
                userType: user.user_type,
                createdAt: user.created_at
            }
        });

    } catch (error) {
        console.error('Token verification error:', error);
        // Use 500 for internal server error, not 501
        res.status(500).json({ valid: false, error: 'Token verification failed' });
    }
});

// ========== EMAIL VERIFICATION ROUTES ==========

// Verify email with token
router.post('/verify-email', async (req: Request, res: Response) => {
    try {
        const { token } = req.body;

        if (!token) {
            return res.status(400).json({ error: 'Verification token is required' });
        }

        // Find user with valid token
        const result = await query(
            `SELECT id, email, email_verified FROM users 
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

        // Check if already verified
        if (user.email_verified) {
            return res.json({ 
                success: true, 
                message: 'Email already verified' 
            });
        }

        // Mark email as verified
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
            `INSERT INTO audit_logs (user_id, action, resource_type, resource_id, details, created_at)
             VALUES ($1, $2, $3, $4, $5, NOW())`,
            [user.id, 'EMAIL_VERIFIED', 'USER', user.id, JSON.stringify({ email: user.email })]
        );

        res.json({ 
            success: true, 
            message: 'Email verified successfully. You can now use all features.' 
        });

    } catch (error) {
        console.error('Email verification error:', error);
        res.status(500).json({ error: 'Failed to verify email. Please try again.' });
    }
});

// Resend verification email
router.post('/resend-verification', resendEmailLimiter, async (req: Request, res: Response) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ error: 'Email is required' });
        }

        // Find user
        const result = await query(
            `SELECT id, email, email_verified FROM users WHERE email = $1`,
            [email]
        );

        // Security: Don't reveal if user exists
        if (result.rows.length === 0) {
            return res.json({ 
                message: 'If an account exists, verification email has been sent.' 
            });
        }

        const user = result.rows[0];

        // If already verified, still send message but don't resend
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
        const verificationLink = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/verify-email?token=${verificationToken}`;
        try {
          await sendEmail(
            email,
            'Verify Your Email - Synapse',
            `Click the link to verify your email:\n${verificationLink}\n\nThis link expires in 24 hours.`,
            `<p><a href="${verificationLink}" style="background-color: #4f46e5; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; display: inline-block;">Verify Email</a></p>`
          );
        } catch (emailError) {
          console.error('Failed to send verification email:', emailError);
        }

        res.json({ 
            message: 'Verification email sent. Check your inbox.' 
        });

    } catch (error) {
        console.error('Resend verification error:', error);
        res.status(500).json({ error: 'Failed to resend verification email' });
    }
});

// ========== PASSWORD RESET ROUTES ==========

// Request password reset
router.post('/forgot-password', passwordResetLimiter, async (req: Request, res: Response) => {
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
            return res.json({ 
                message: 'If an account exists with this email, a password reset link has been sent.' 
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
        const resetLink = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password?token=${resetToken}`;

        try {
          await sendEmail(
            email,
            'Password Reset Request - Synapse',
            `Click the link below to reset your password:\n${resetLink}\n\nThis link expires in 1 hour.\n\nIf you didn't request this, ignore this email.`,
            `<h2>Password Reset Request</h2>
             <p>Click the button below to reset your password:</p>
             <p><a href="${resetLink}" style="background-color: #4f46e5; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; display: inline-block;">Reset Password</a></p>
             <p style="color: #666; font-size: 14px;">Link expires in 1 hour.</p>
             <p style="color: #666; font-size: 14px;">If you didn't request this, you can safely ignore this email.</p>`
          );
        } catch (emailError) {
          console.error('Failed to send password reset email:', emailError);
        }

        // Log audit event
        await query(
            `INSERT INTO audit_logs (action, resource_type, resource_id, details, created_at)
             VALUES ($1, $2, $3, $4, NOW())`,
            ['PASSWORD_RESET_REQUESTED', 'USER', user.id, JSON.stringify({ email })]
        );

        res.json({ 
            message: 'If an account exists with this email, a password reset link has been sent.' 
        });

    } catch (error) {
        console.error('Forgot password error:', error);
        res.status(500).json({ error: 'Failed to process reset request' });
    }
});

// Reset password with token
router.post('/reset-password', async (req: Request, res: Response) => {
    try {
        const { token, newPassword } = req.body;

        if (!token || !newPassword) {
            return res.status(400).json({ error: 'Token and new password are required' });
        }

        // Validate new password
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

export default router;
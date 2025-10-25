// C:\Users\hemant\Downloads\synapse\backend\src\routes\auth.routes.ts
import express, { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt, { Secret, SignOptions } from 'jsonwebtoken';
import { query } from '../db/database.js';
import { authenticateToken } from '../middleware/auth.middleware.js'; // <-- ADD THIS IMPORT

const router = express.Router();

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
router.post('/register', async (req: Request, res: Response) => {
    try {
        console.log('Register request received:', req.body);
        const { email, username, password, displayName, userType } = req.body;

        if (!email || !username || !password || !displayName) {
            return res.status(400).json({ error: 'All fields are required' });
        }
        if (password.length < 6) {
            return res.status(400).json({ error: 'Password must be at least 6 characters long' });
        }

        const userExists = await query(
          'SELECT id FROM users WHERE email = $1 OR username = $2',
          [email, username]
        );
        if (userExists.rows.length > 0) {
          return res.status(400).json({ error: 'User already exists with this email or username' });
        }

        const saltRounds = 12;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        const result = await query(
          `INSERT INTO users (email, username, display_name, user_type, password_hash)
           VALUES ($1, $2, $3, $4, $5)
           RETURNING id, email, username, display_name, user_type, created_at`,
          [email, username, displayName, userType || 'thinker', hashedPassword]
        );

        if (result.rows.length === 0) {
             throw new Error("User creation failed, no rows returned.");
        }
        const user = result.rows[0];
        const secret: Secret = process.env.JWT_SECRET || 'your-super-secure-jwt-secret-change-this-in-production-12345';
        
        const options: SignOptions = {
            expiresIn: getExpiresInSeconds() 
        };

        const token = jwt.sign(
          { userId: user.id, email: user.email },
          secret,
          options
        );

        console.log('User registered successfully:', user.email);
        res.status(201).json({
          message: 'User registered successfully',
          user: {
            id: user.id,
            email: user.email,
            username: user.username,
            displayName: user.display_name,
            userType: user.user_type,
            onboardingCompleted: false
          },
          token
        });

    } catch (error) {
        console.error('Registration error:', error);
        const message = (error instanceof Error) ? error.message : 'Internal server error';
        res.status(500).json({ error: message });
    }
});

// Login endpoint
router.post('/login', async (req: Request, res: Response) => {
   try {
        console.log('Login request received:', { email: req.body.email });
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
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

        const secret: Secret = process.env.JWT_SECRET || 'your-super-secure-jwt-secret-change-this-in-production-12345';
        
        const options: SignOptions = {
             expiresIn: getExpiresInSeconds()
        };

        const token = jwt.sign(
          { userId: user.id, email: user.email },
          secret,
          options
        );

        console.log('User logged in successfully:', user.email);
        res.json({
          message: 'Login successful',
          user: {
            id: user.id,
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
        const message = (error instanceof Error) ? error.message : 'Internal server error';
        res.status(500).json({ error: message });
    }
});

// --- (FIXED) Verify token endpoint ---
// Changed from POST to GET and using authenticateToken middleware
router.get('/verify', authenticateToken, async (req: Request, res: Response) => {
    try {
        // authenticateToken has already run and verified the token.
        // It placed the user payload in req.user.
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
                id: user.id,
                email: user.email,
                username: user.username,
                displayName: user.display_name,
                userType: user.user_type,
                createdAt: user.created_at
            }
        });

    } catch (error) {
        console.error('Token verification error:', error);
        res.status(501).json({ valid: false, error: 'Internal server error during token verification' });
    }
});

export default router;
// C:\Users\hemant\Downloads\synapse\backend\src\routes\auth.routes.ts
import express, { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt, { Secret, SignOptions } from 'jsonwebtoken';
import { query } from '../db/database.js';

const router = express.Router();

// --- (FIXED) Helper function to get expiresIn value (number in seconds) ---
// This function now correctly parses strings like "7d" or "1h" into seconds.
function getExpiresInSeconds(): number {
    const envValue = process.env.JWT_EXPIRES_IN; // e.g., "7d", "1h", "86400"
    
    if (envValue) {
        // Try parsing as a plain number (seconds)
        const parsedSeconds = parseInt(envValue, 10);
        if (!isNaN(parsedSeconds) && String(parsedSeconds) === envValue) {
            return parsedSeconds; // It's a plain number string like "86400"
        }

        // Try parsing as a string with unit (e.g., "7d", "1h")
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
    
    // Default: 7 days in seconds
    return 7 * 24 * 60 * 60; 
}

// Register endpoint
router.post('/register', async (req: Request, res: Response) => {
    try {
        console.log('Register request received:', req.body);
        const { email, username, password, displayName, userType } = req.body;

        // --- Validation ---
        if (!email || !username || !password || !displayName) {
            return res.status(400).json({ error: 'All fields are required: email, username, password, displayName' });
        }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ error: 'Invalid email format' });
        }
        if (password.length < 6) {
            return res.status(400).json({ error: 'Password must be at least 6 characters long' });
        }

        // --- Check if user exists ---
        const userExists = await query(
          'SELECT id FROM users WHERE email = $1 OR username = $2',
          [email, username]
        );
        if (userExists.rows.length > 0) {
          return res.status(400).json({ error: 'User already exists with this email or username' });
        }

        // --- Hash password ---
        const saltRounds = 12;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        // --- Create user ---
        const result = await query(
          `INSERT INTO users (email, username, display_name, user_type, password_hash)
           VALUES ($1, $2, $3, $4, $5)
           RETURNING id, email, username, display_name, user_type, created_at`,
          [email, username, displayName, userType || 'thinker', hashedPassword]
        );

        // --- Process result ---
        if (result.rows.length === 0) {
             throw new Error("User creation failed, no rows returned.");
        }
        const user = result.rows[0];
        const secret: Secret = process.env.JWT_SECRET || 'your-super-secure-jwt-secret-change-this-in-production-12345';
        
        // --- (FIXED) Use new function that returns a number ---
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
        if (error instanceof SyntaxError) {
          return res.status(400).json({ error: 'Invalid JSON in request body' });
        }
        const message = (error instanceof Error) ? error.message : 'Internal server error during registration';
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

        // --- Find user ---
        const result = await query(
          `SELECT id, email, username, display_name, user_type, password_hash, onboarding_completed, created_at, avatar_url, bio, skills, interests 
           FROM users WHERE email = $1`,
          [email]
        );

        // --- Process result ---
        if (result.rows.length === 0) {
          return res.status(401).json({ error: 'Invalid credentials' });
        }
        const user = result.rows[0];

        // --- Check password ---
        const isPasswordValid = await bcrypt.compare(password, user.password_hash);
        if (!isPasswordValid) {
          return res.status(401).json({ error: 'Invalid credentials' });
        }

        const secret: Secret = process.env.JWT_SECRET || 'your-super-secure-jwt-secret-change-this-in-production-12345';
        
        // --- (FIXED) Use new function that returns a number ---
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
        const message = (error instanceof Error) ? error.message : 'Internal server error during login';
        res.status(500).json({ error: message });
    }
});

// Verify token endpoint
router.post('/verify', async (req: Request, res: Response) => {
    try {
        const { token } = req.body;
        if (!token) {
            return res.status(400).json({ error: 'Token is required' });
        }
        const secret: Secret = process.env.JWT_SECRET || 'your-super-secure-jwt-secret-change-this-in-production-12345';
        const decoded = jwt.verify(
            token,
            secret
        ) as { userId: string };

        // --- Verify user exists ---
        const result = await query(
            'SELECT id, email, username, display_name, user_type, created_at FROM users WHERE id = $1',
            [decoded.userId]
        );

        if (result.rows.length === 0) {
            return res.status(401).json({ error: 'Invalid token - user not found' });
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
        res.status(401).json({ valid: false, error: 'Invalid or expired token' });
    }
});

export default router;
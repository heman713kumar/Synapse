// C:\Users\hemant\Downloads\synapse\backend\src\routes\users.routes.ts
import express, { Request, Response, NextFunction, Router } from 'express';
import { authenticateToken } from '../middleware/auth.middleware.js';
import { query } from '../db/database.js';

const router: Router = express.Router();

// Define a whitelist of fields that can be updated dynamically
const ALLOWED_USER_UPDATE_FIELDS = [
    'skills', 'interests', 'bio', 'display_name', 'avatar_url', 'onboarding_completed', 'user_type'
];

/**
 * Safely constructs the SQL UPDATE query string from the request body.
 * Implements a whitelist to prevent SQL Injection.
 * @param body Request body object
 * @returns { updateFields: string[], values: any[] }
 */
const getSafeUpdateQuery = (body: any) => {
    const updateFields: string[] = [];
    const values: any[] = [];
    let paramCount = 0;

    // Use a loop over the whitelist to guarantee safety
    for (const field of ALLOWED_USER_UPDATE_FIELDS) {
        // Use camelCase to look up in the request body
        const fieldCamelCase = field.replace(/_([a-z])/g, (g) => g[1].toUpperCase());
        const value = body[fieldCamelCase];

        if (value !== undefined) {
            paramCount++;
            updateFields.push(`${field} = $${paramCount}`);
            
            // Special handling for array/JSONB fields
            if (field === 'skills') {
                values.push(Array.isArray(value) ? JSON.stringify(value) : '[]');
            } else if (field === 'interests') {
                values.push(Array.isArray(value) ? value : []);
            } else {
                values.push(value);
            }
        }
    }
    
    return { updateFields, values, paramCount };
};


// --- GET CURRENT USER ---
router.get('/me', authenticateToken, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId;
    const result = await query(
      'SELECT id, email, username, display_name, avatar_url, bio, user_type, skills, interests, onboarding_completed, created_at FROM users WHERE id = $1',
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = result.rows[0];
    res.json({
      userId: user.id, // Corrected
      email: user.email,
      username: user.username,
      displayName: user.display_name,
      avatarUrl: user.avatar_url,
      bio: user.bio,
      userType: user.user_type,
      skills: user.skills || [],
      interests: user.interests || [],
      onboardingCompleted: user.onboarding_completed,
      createdAt: user.created_at
    });
  } catch (error) {
    console.error('Get /me error:', error);
    const errMsg = error instanceof Error ? error.message : 'Internal server error';
    res.status(500).json({ error: errMsg });
  }
});

// --- UPDATE CURRENT USER ---
router.put('/me', authenticateToken, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId;
    const { updateFields, values, paramCount } = getSafeUpdateQuery(req.body);

    if (updateFields.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    // Add updated_at
    updateFields.push(`updated_at = $${paramCount + 1}`);
    values.push(new Date());

    // Add userId for WHERE clause
    const userIdParam = paramCount + 2;
    values.push(userId);

    // FIX 2: Apply safe query construction using whitelist
    const queryText = `UPDATE users SET ${updateFields.join(', ')} WHERE id = $${userIdParam} RETURNING *`;
    const result = await query(queryText, values);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = result.rows[0];
    res.json({
      userId: user.id, // Corrected
      email: user.email,
      username: user.username,
      displayName: user.display_name,
      avatarUrl: user.avatar_url,
      bio: user.bio,
      userType: user.user_type,
      skills: user.skills || [],
      interests: user.interests || [],
      onboardingCompleted: user.onboarding_completed,
      createdAt: user.created_at,
      updatedAt: user.updated_at
    });

  } catch (error) {
    console.error('Update /me error:', error);
    const errMsg = error instanceof Error ? error.message : 'Internal server error';
    res.status(500).json({ error: errMsg });
  }
});

// --- GET CURRENT USER NOTIFICATIONS ---
router.get('/me/notifications', authenticateToken, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId;
    const result = await query(
      'SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50',
      [userId]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Get /me/notifications error:', error);
    const errMsg = error instanceof Error ? error.message : 'Internal server error';
    res.status(500).json({ error: errMsg });
  }
});

// --- MARK ALL NOTIFICATIONS AS READ ---
router.post('/me/notifications/read-all', authenticateToken, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.user!.userId;
        await query(
            'UPDATE notifications SET is_read = true WHERE user_id = $1 AND is_read = false',
            [userId]
        );
        res.status(200).json({ message: 'All notifications marked as read' });
    } catch (error) {
        console.error('Post /me/notifications/read-all error:', error);
        const errMsg = error instanceof Error ? error.message : 'Internal server error';
        res.status(500).json({ error: errMsg });
    }
});

// --- UPDATE NOTIFICATION SETTINGS ---
router.put('/me/settings/notifications', authenticateToken, async (req: Request, res: Response, next: NextFunction) => {
    try {
        console.warn('Notification settings update not fully implemented. Add column to users table.');
        const userId = req.user!.userId;
        const result = await query('SELECT * FROM users WHERE id = $1', [userId]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }
        const user = result.rows[0];
        res.json({
            userId: user.id, // Corrected
            // ... rest of user properties
            email: user.email,
            username: user.username,
            displayName: user.display_name,
            avatarUrl: user.avatar_url,
            bio: user.bio,
            userType: user.user_type,
            skills: user.skills || [],
            interests: user.interests || [],
            onboardingCompleted: user.onboarding_completed,
            createdAt: user.created_at,
            updatedAt: user.updated_at
        });
    } catch (error) {
        console.error('Put /me/settings/notifications error:', error);
        const errMsg = error instanceof Error ? error.message : 'Internal server error';
        res.status(500).json({ error: errMsg });
    }
});


// Get user profile (for other users)
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    
    const uuidRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
    if (!uuidRegex.test(id)) {
        return res.status(400).json({ error: 'Invalid user ID format' });
    }

    const result = await query(
      'SELECT id, email, username, display_name, avatar_url, bio, user_type, skills, interests, onboarding_completed, created_at FROM users WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = result.rows[0];
    res.json({
      userId: user.id, // Corrected
      email: user.email,
      username: user.username,
      displayName: user.display_name,
      avatarUrl: user.avatar_url,
      bio: user.bio,
      userType: user.user_type,
      skills: user.skills || [],
      interests: user.interests || [],
      onboardingCompleted: user.onboarding_completed,
      createdAt: user.created_at
    });
  } catch (error) {
    console.error('Get user error:', error);
    const errMsg = error instanceof Error ? error.message : 'Internal server error';
    res.status(500).json({ error: errMsg });
  }
});

// Update user profile (generic by ID - now less used)
router.put('/:id', authenticateToken, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    if (req.user!.userId !== id) {
      return res.status(403).json({ error: 'Cannot update other user profiles' });
    }

    // FIX 3: Use safe query builder for generic update
    const { updateFields, values, paramCount } = getSafeUpdateQuery(req.body);

    if (updateFields.length === 0) { return res.status(400).json({ error: 'No fields to update' }); }
    
    // Add updated_at
    updateFields.push(`updated_at = $${paramCount + 1}`);
    values.push(new Date());

    // Add userId for WHERE clause
    const userIdParam = paramCount + 2;
    values.push(id);


    const queryText = `UPDATE users SET ${updateFields.join(', ')} WHERE id = $${userIdParam} RETURNING *`;
    const result = await query(queryText, values);

    if (result.rows.length === 0) { return res.status(404).json({ error: 'User not found' }); }
    const user = result.rows[0];
    res.json({
      userId: user.id, // Corrected
      // ... rest of user properties
       email: user.email,
      username: user.username,
      displayName: user.display_name,
      avatarUrl: user.avatar_url,
      bio: user.bio,
      userType: user.user_type,
      skills: user.skills || [],
      interests: user.interests || [],
      onboardingCompleted: user.onboarding_completed,
      createdAt: user.created_at,
      updatedAt: user.updated_at
    });

  } catch (error) {
    console.error('Update user error:', error);
    const errMsg = error instanceof Error ? error.message : 'Internal server error';
    res.status(500).json({ error: errMsg });
  }
});

// Mark onboarding as completed
router.patch('/:id/onboarding', authenticateToken, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    if (req.user!.userId !== id) {
      return res.status(403).json({ error: 'Cannot update other user profiles' });
    }

    const result = await query(
      'UPDATE users SET onboarding_completed = true, updated_at = NOW() WHERE id = $1 RETURNING *',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = result.rows[0];
    res.json({
      userId: user.id, // Corrected
      // ... rest of user properties
      email: user.email,
      username: user.username,
      displayName: user.display_name,
      onboardingCompleted: user.onboarding_completed,
      updatedAt: user.updated_at
    });

  } catch (error) {
    console.error('Update onboarding error:', error);
    const errMsg = error instanceof Error ? error.message : 'Internal server error';
    res.status(500).json({ error: errMsg });
  }
});

// Search users
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { search, userType, skills } = req.query;
    let queryText = `
      SELECT id, username, display_name, avatar_url, bio, user_type, skills, interests, created_at
      FROM users
      WHERE 1=1
    `;
    const params: any[] = [];
    let paramCount = 0;
    if (search) { paramCount++; queryText += ` AND (username ILIKE $${paramCount} OR display_name ILIKE $${paramCount} OR bio ILIKE $${paramCount})`; params.push(`%${search}%`); }
    if (userType) { paramCount++; queryText += ` AND user_type = $${paramCount}`; params.push(userType); }
    if (skills) {
      const skillsArray = Array.isArray(skills) ? skills : [skills];
      if (skillsArray.length > 0) {
          paramCount++;
          // Assuming skills is JSONB: '[{"skillName": "react"}, ...]'
          // We need to construct a JSONB array to check for containment
          const skillsJsonb = JSON.stringify(skillsArray.map(s => ({ skillName: s })));
          queryText += ` AND skills @> $${paramCount}`;
          params.push(skillsJsonb);
      }
    }
    queryText += ' ORDER BY created_at DESC LIMIT 50';

    const result = await query(queryText, params);

    const users = result.rows.map((user: any) => ({
      userId: user.id, // Corrected
      username: user.username,
      displayName: user.display_name,
      avatarUrl: user.avatar_url,
      bio: user.bio,
      userType: user.user_type,
      skills: user.skills || [],
      interests: user.interests || [],
      createdAt: user.created_at
    }));
    res.json(users);
  } catch (error) {
    console.error('Search users error:', error);
    const errMsg = error instanceof Error ? error.message : 'Internal server error';
    res.status(500).json({ error: errMsg });
  }
});

// --- (NEW) GET USER ACHIEVEMENTS ---
router.get('/:id/achievements', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params; // The ID of the user whose achievements we want

        // Validate ID format
        const uuidRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
        if (!uuidRegex.test(id)) {
            return res.status(400).json({ error: 'Invalid user ID format' });
        }

        const result = await query(
            'SELECT * FROM user_achievements WHERE user_id = $1 ORDER BY unlocked_at DESC',
            [id]
        );

        // Map database result to frontend expected format
        const achievements = result.rows.map((ach: any) => ({
            id: ach.id, // You might want to use achievement_id here depending on frontend
            userId: ach.user_id,
            achievementId: ach.achievement_id, // The type/name of the achievement
            unlockedAt: ach.unlocked_at
        }));

        res.json(achievements); // Send back the list (will be empty if none unlocked)

    } catch (error) {
        console.error(`Get user achievements error for user ${req.params.id}:`, error);
        const errMsg = error instanceof Error ? error.message : 'Internal server error';
        res.status(500).json({ error: errMsg });
    }
});


export default router;
// C:\Users\hemant\Downloads\synapse\backend\src\routes\users.routes.ts
import express, { Request, Response, NextFunction, Router } from 'express';
import { authenticateToken } from '../middleware/auth.middleware.js';
import { query } from '../db/database.js';

const router: Router = express.Router();

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
    const { skills, interests, bio, displayName, avatarUrl, onboardingCompleted, userType } = req.body;

    const updateFields: string[] = [];
    const values: any[] = [];
    let paramCount = 0;

    if (skills !== undefined) {
      paramCount++;
      updateFields.push(`skills = $${paramCount}`);
      // Ensure skills are stringified if they are objects for JSONB
      values.push(Array.isArray(skills) ? JSON.stringify(skills) : '[]');
    }
    if (interests !== undefined) {
      paramCount++;
      updateFields.push(`interests = $${paramCount}`);
      values.push(Array.isArray(interests) ? interests : []); // Assuming interests is text[]
    }
    if (bio !== undefined) {
      paramCount++;
      updateFields.push(`bio = $${paramCount}`);
      values.push(bio);
    }
    if (displayName !== undefined) {
      paramCount++;
      updateFields.push(`display_name = $${paramCount}`);
      values.push(displayName);
    }
    if (avatarUrl !== undefined) {
      paramCount++;
      updateFields.push(`avatar_url = $${paramCount}`);
      values.push(avatarUrl);
    }
    if (onboardingCompleted !== undefined) {
      paramCount++;
      updateFields.push(`onboarding_completed = $${paramCount}`);
      values.push(onboardingCompleted);
    }
    if (userType !== undefined) {
      paramCount++;
      updateFields.push(`user_type = $${paramCount}`);
      values.push(userType);
    }

    if (updateFields.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    paramCount++;
    updateFields.push(`updated_at = $${paramCount}`);
    values.push(new Date());

    paramCount++;
    values.push(userId);

    const queryText = `UPDATE users SET ${updateFields.join(', ')} WHERE id = $${paramCount} RETURNING *`;
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

    const { skills, interests, bio, displayName, avatarUrl, onboardingCompleted } = req.body;
    const updateFields: string[] = [];
    const values: any[] = [];
    let paramCount = 0;
    if (skills !== undefined) { paramCount++; updateFields.push(`skills = $${paramCount}`); values.push(Array.isArray(skills) ? JSON.stringify(skills) : '[]'); }
    if (interests !== undefined) { paramCount++; updateFields.push(`interests = $${paramCount}`); values.push(Array.isArray(interests) ? interests : []); }
    if (bio !== undefined) { paramCount++; updateFields.push(`bio = $${paramCount}`); values.push(bio); }
    if (displayName !== undefined) { paramCount++; updateFields.push(`display_name = $${paramCount}`); values.push(displayName); }
    if (avatarUrl !== undefined) { paramCount++; updateFields.push(`avatar_url = $${paramCount}`); values.push(avatarUrl); }
    if (onboardingCompleted !== undefined) { paramCount++; updateFields.push(`onboarding_completed = $${paramCount}`); values.push(onboardingCompleted); }
    if (updateFields.length === 0) { return res.status(400).json({ error: 'No fields to update' }); }
    paramCount++; updateFields.push(`updated_at = $${paramCount}`); values.push(new Date());
    paramCount++; values.push(id);

    const queryText = `UPDATE users SET ${updateFields.join(', ')} WHERE id = $${paramCount} RETURNING *`;
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
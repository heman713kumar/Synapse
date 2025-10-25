// backend/src/routes/feed.routes.ts
import express, { Request, Response, NextFunction, Router } from 'express';
import { authenticateToken, optionalAuth } from '../middleware/auth.middleware.js';
import { query } from '../db/database.js';

const router: Router = express.Router();

// Get feed items (ideas, achievements, milestones)
router.get('/', optionalAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId;

    // Get ideas (public or user's own)
    const ideasQuery = `
      SELECT 
        'idea' as type,
        id as "ideaId",
        title,
        summary,
        description,
        sector,
        region,
        required_skills as "requiredSkills",
        tags,
        owner_id as "ownerId",
        likes_count as "likesCount",
        comments_count as "commentsCount",
        collaborators,
        questionnaire,
        created_at as "createdAt",
        updated_at as "updatedAt"
      FROM ideas 
      WHERE is_public = true OR owner_id = $1
      ORDER BY created_at DESC
      LIMIT 50
    `;

    // Get achievement posts
    const achievementsQuery = `
      SELECT 
        'achievement' as type,
        id as "postId",
        title,
        description,
        user_id as "userId",
        achievement_type as "achievementType",
        skills_gained as "skillsGained",
        created_at as "createdAt",
        updated_at as "updatedAt"
      FROM achievement_posts 
      WHERE is_public = true OR user_id = $1
      ORDER BY created_at DESC
      LIMIT 20
    `;

    // Get milestone posts  
    const milestonesQuery = `
      SELECT 
        'milestone' as type,
        id as "postId", 
        title,
        description,
        user_id as "userId",
        milestone_type as "milestoneType",
        related_skills as "relatedSkills",
        created_at as "createdAt",
        updated_at as "updatedAt"
      FROM milestone_posts 
      WHERE is_public = true OR user_id = $1
      ORDER BY created_at DESC
      LIMIT 20
    `;

    const ideasResult = await query(ideasQuery, [userId || null]);
    const achievementsResult = await query(achievementsQuery, [userId || null]);
    const milestonesResult = await query(milestonesQuery, [userId || null]);

    // Combine all items into a single feed
    const feedItems = [
      ...ideasResult.rows.map((idea: any) => ({
        type: 'idea' as const,
        data: idea
      })),
      ...achievementsResult.rows.map((achievement: any) => ({
        type: 'achievement' as const,
        data: achievement
      })),
      ...milestonesResult.rows.map((milestone: any) => ({
        type: 'milestone' as const,
        data: milestone
      }))
    ];

    // Sort by creation date (newest first)
    feedItems.sort((a, b) => 
      new Date(b.data.createdAt).getTime() - new Date(a.data.createdAt).getTime()
    );

    res.json(feedItems);
  } catch (error) {
    console.error('Get feed error:', error);
    const errMsg = error instanceof Error ? error.message : 'Internal server error';
    res.status(500).json({ error: errMsg });
  }
});

export default router;
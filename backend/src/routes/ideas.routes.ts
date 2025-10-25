// C:\Users\hemant\Downloads\synapse\backend\src\routes\ideas.routes.ts
import express, { Request, Response, NextFunction, Router } from 'express';
import { authenticateToken, optionalAuth } from '../middleware/auth.middleware.js';
import { query } from '../db/database.js';

const router: Router = express.Router();

// Get all ideas (public with optional filtering)
router.get('/', optionalAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { category, stage, search } = req.query;
    const userId = req.user?.userId; // Get user ID if authenticated

    let queryText = `
      SELECT 
        i.id, i.title, i.summary, i.description, i.category, i.stage, i.tags, 
        i.owner_id, i.is_public, i.ai_analysis, 
        i.likes_count, i.comments_count, 
        i.created_at, i.updated_at,
        u.username as owner_username, 
        u.display_name as owner_display_name,
        u.avatar_url as owner_avatar_url
      FROM ideas i 
      LEFT JOIN users u ON i.owner_id = u.id 
      WHERE i.is_public = true
    `;
    
    const params: any[] = [];
    let paramCount = 0;

    if (userId) {
        paramCount++;
        queryText += ` OR i.owner_id = $${paramCount}`;
        params.push(userId);
    }
    
    const conditions: string[] = [];
    if (category) {
      paramCount++;
      conditions.push(`i.category = $${paramCount}`);
      params.push(category);
    }
    if (stage) {
      paramCount++;
      conditions.push(`i.stage = $${paramCount}`);
      params.push(stage);
    }
    if (search) {
      paramCount++;
      conditions.push(`(i.title ILIKE $${paramCount} OR i.description ILIKE $${paramCount} OR i.tags::text ILIKE $${paramCount})`);
      params.push(`%${search}%`);
    }

    if(conditions.length > 0) {
        // Apply filters only to public ideas, but still show private ideas if ownerId matches
        queryText += ` AND (${conditions.join(' AND ')})`;
    }

    queryText += ' ORDER BY i.created_at DESC LIMIT 100';

    const result = await query(queryText, params);

    // Re-map to match frontend camelCase expectations
    const ideas = result.rows.map((idea: any) => ({
      id: idea.id,
      title: idea.title,
      summary: idea.summary,
      description: idea.description,
      category: idea.category,
      stage: idea.stage,
      tags: idea.tags || [],
      ownerId: idea.owner_id,
      ownerUsername: idea.owner_username,
      ownerDisplayName: idea.owner_display_name,
      ownerAvatarUrl: idea.owner_avatar_url,
      isPublic: idea.is_public,
      aiAnalysis: idea.ai_analysis,
      likesCount: idea.likes_count,
      commentsCount: idea.comments_count,
      createdAt: idea.created_at,
      updatedAt: idea.updated_at
    }));

    res.json(ideas);
  } catch (error) {
    console.error('Get ideas error:', error);
    const errMsg = error instanceof Error ? error.message : 'Internal server error';
    res.status(500).json({ error: errMsg });
  }
});

// Create new idea (protected)
router.post('/', authenticateToken, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { title, description, category, stage, tags, isPublic = true, summary } = req.body;
    const ownerId = req.user!.userId;

    if (!title || !description || !category) {
      return res.status(400).json({ error: 'Title, description, and category are required' });
    }

    const result = await query(
      `INSERT INTO ideas (title, description, summary, category, stage, tags, owner_id, is_public) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) 
       RETURNING *`,
      [title, description, summary, category, stage || 'idea', tags || [], ownerId, isPublic]
    );

    const idea = result.rows[0];
    
    // Return what the frontend expects (CreateIdeaResponse)
    res.status(201).json({
      idea: {
        id: idea.id,
        title: idea.title,
        description: idea.description,
        summary: idea.summary,
        category: idea.category,
        stage: idea.stage,
        tags: idea.tags,
        ownerId: idea.owner_id,
        isPublic: idea.is_public,
        createdAt: idea.created_at
      },
      unlockedAchievements: [] // Add achievements later
    });
  } catch (error) {
    console.error('Create idea error:', error);
    const errMsg = error instanceof Error ? error.message : 'Internal server error';
    res.status(500).json({ error: errMsg });
  }
});

// Get single idea
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const result = await query(
      `SELECT i.*, u.username as owner_username, u.display_name as owner_display_name, u.avatar_url as owner_avatar_url
       FROM ideas i 
       LEFT JOIN users u ON i.owner_id = u.id 
       WHERE i.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Idea not found' });
    }

    const idea = result.rows[0];
    // Re-map to match frontend camelCase expectations
    res.json({
      id: idea.id,
      title: idea.title,
      summary: idea.summary,
      description: idea.description,
      category: idea.category,
      stage: idea.stage,
      tags: idea.tags || [],
      ownerId: idea.owner_id,
      ownerUsername: idea.owner_username,
      ownerDisplayName: idea.owner_display_name,
      ownerAvatarUrl: idea.owner_avatar_url,
      isPublic: idea.is_public,
      aiAnalysis: idea.ai_analysis,
      likesCount: idea.likes_count,
      commentsCount: idea.comments_count,
      createdAt: idea.created_at,
      updatedAt: idea.updated_at
    });
  } catch (error) {
    console.error('Get idea error:', error);
    const errMsg = error instanceof Error ? error.message : 'Internal server error';
    res.status(500).json({ error: errMsg });
  }
});

// Update idea (protected - owner only)
router.put('/:id', authenticateToken, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { title, description, summary, category, stage, tags, isPublic } = req.body;

    // Verify ownership
    const ownershipCheck = await query(
      'SELECT owner_id FROM ideas WHERE id = $1',
      [id]
    );

    if (ownershipCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Idea not found' });
    }

    if (ownershipCheck.rows[0].owner_id !== req.user!.userId) {
      return res.status(403).json({ error: 'Cannot update other users ideas' });
    }

    const result = await query(
      `UPDATE ideas 
       SET title = $1, description = $2, category = $3, stage = $4, tags = $5, is_public = $6, summary = $7, updated_at = NOW() 
       WHERE id = $8 
       RETURNING *`,
      [title, description, category, stage, tags, isPublic, summary, id]
    );

    const idea = result.rows[0];
    res.json(idea); // Return the full updated idea
  } catch (error) {
    console.error('Update idea error:', error);
    const errMsg = error instanceof Error ? error.message : 'Internal server error';
    res.status(500).json({ error: errMsg });
  }
});

// Delete idea (protected - owner only)
router.delete('/:id', authenticateToken, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    // Verify ownership
    const ownershipCheck = await query(
      'SELECT owner_id FROM ideas WHERE id = $1',
      [id]
    );

    if (ownershipCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Idea not found' });
    }

    if (ownershipCheck.rows[0].owner_id !== req.user!.userId) {
      return res.status(403).json({ error: 'Cannot delete other users ideas' });
    }

    await query('DELETE FROM ideas WHERE id = $1', [id]);

    res.json({ message: 'Idea deleted successfully' });
  } catch (error) {
    console.error('Delete idea error:', error);
    const errMsg = error instanceof Error ? error.message : 'Internal server error';
    res.status(500).json({ error: errMsg });
  }
});


// --- (NEW) Comments Routes ---

// Get comments for an idea
router.get('/:id/comments', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const result = await query(
      `SELECT c.*, u.username, u.display_name, u.avatar_url 
       FROM comments c
       JOIN users u ON c.user_id = u.id
       WHERE c.idea_id = $1
       ORDER BY c.created_at DESC`,
      [id]
    );

    const comments = result.rows.map((c: any) => ({
      id: c.id,
      ideaId: c.idea_id,
      userId: c.user_id,
      text: c.text,
      createdAt: c.created_at,
      username: c.username,
      displayName: c.display_name,
      avatarUrl: c.avatar_url
    }));
    
    res.json(comments);
  } catch (error) {
    console.error('Get comments error:', error);
    const errMsg = error instanceof Error ? error.message : 'Internal server error';
    res.status(500).json({ error: errMsg });
  }
});

// Post a new comment (protected)
router.post('/:id/comments', authenticateToken, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params; // ideaId
    const { text } = req.body;
    const userId = req.user!.userId;

    if (!text) {
      return res.status(400).json({ error: 'Comment text is required' });
    }

    const result = await query(
      `INSERT INTO comments (idea_id, user_id, text) 
       VALUES ($1, $2, $3) 
       RETURNING *`,
      [id, userId, text]
    );

    // Also update the comments_count on the idea
    await query(
      `UPDATE ideas SET comments_count = comments_count + 1 WHERE id = $1`,
      [id]
    );

    const newComment = result.rows[0];
    
    // We should return the full comment object with user data
    const userResult = await query('SELECT username, display_name, avatar_url FROM users WHERE id = $1', [userId]);
    const user = userResult.rows[0];

    res.status(201).json({
      id: newComment.id,
      ideaId: newComment.idea_id,
      userId: newComment.user_id,
      text: newComment.text,
      createdAt: newComment.created_at,
      username: user.username,
      displayName: user.display_name,
      avatarUrl: user.avatar_url
    });
    
  } catch (error) {
    console.error('Post comment error:', error);
    const errMsg = error instanceof Error ? error.message : 'Internal server error';
    res.status(500).json({ error: errMsg });
  }
});

// --- (NEW) Feedback Routes ---

// Get feedback for an idea
router.get('/:id/feedback', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const result = await query(
      `SELECT f.*, u.username, u.display_name, u.avatar_url 
       FROM feedback f
       JOIN users u ON f.user_id = u.id
       WHERE f.idea_id = $1
       ORDER BY f.created_at DESC`,
      [id]
    );

    const feedback = result.rows.map((f: any) => ({
        id: f.id,
        ideaId: f.idea_id,
        userId: f.user_id,
        feasibility: f.feasibility,
        innovation: f.innovation,
        marketPotential: f.market_potential,
        comment: f.comment,
        createdAt: f.created_at,
        username: f.username,
        displayName: f.display_name,
        avatarUrl: f.avatar_url
    }));

    res.json(feedback);
  } catch (error) {
    console.error('Get feedback error:', error);
    const errMsg = error instanceof Error ? error.message : 'Internal server error';
    res.status(500).json({ error: errMsg });
  }
});

// Post new feedback (protected)
router.post('/:id/feedback', authenticateToken, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params; // ideaId
    const { feasibility, innovation, marketPotential, comment } = req.body;
    const userId = req.user!.userId;

    const result = await query(
      `INSERT INTO feedback (idea_id, user_id, feasibility, innovation, market_potential, comment) 
       VALUES ($1, $2, $3, $4, $5, $6) 
       RETURNING *`,
      [id, userId, feasibility, innovation, marketPotential, comment]
    );

    const newFeedback = result.rows[0];

    // We should return the full feedback object with user data
    const userResult = await query('SELECT username, display_name, avatar_url FROM users WHERE id = $1', [userId]);
    const user = userResult.rows[0];

    res.status(201).json({
      feedback: {
        id: newFeedback.id,
        ideaId: newFeedback.idea_id,
        userId: newFeedback.user_id,
        feasibility: newFeedback.feasibility,
        innovation: newFeedback.innovation,
        marketPotential: newFeedback.market_potential,
        comment: newFeedback.comment,
        createdAt: newFeedback.created_at,
        username: user.username,
        displayName: user.display_name,
        avatarUrl: user.avatar_url
      },
      unlockedAchievements: [] // Add achievements later
    });
    
  } catch (error) {
    console.error('Post feedback error:', error);
    const errMsg = error instanceof Error ? error.message : 'Internal server error';
    res.status(500).json({ error: errMsg });
  }
});

export default router;
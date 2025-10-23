import express, { Request, Response, NextFunction, Router } from 'express';
import { authenticateToken, optionalAuth } from '../middleware/auth.middleware.js';
import { query } from '../db/database.js';

const router: Router = express.Router();

// Get all ideas (public with optional filtering)
router.get('/', optionalAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { category, stage, search, userId } = req.query;

    let queryText = `
      SELECT i.*, u.username as owner_username, u.display_name as owner_display_name 
      FROM ideas i 
      LEFT JOIN users u ON i.owner_id = u.id 
      WHERE i.is_public = true
    `;
    const params: any[] = [];
    let paramCount = 0;

    if (category) {
      paramCount++;
      queryText += ` AND i.category = $${paramCount}`;
      params.push(category);
    }

    if (stage) {
      paramCount++;
      queryText += ` AND i.stage = $${paramCount}`;
      params.push(stage);
    }

    if (search) {
      paramCount++;
      queryText += ` AND (i.title ILIKE $${paramCount} OR i.description ILIKE $${paramCount} OR i.tags::text ILIKE $${paramCount})`;
      params.push(`%${search}%`);
    }

    if (userId && req.user?.userId === userId) {
      paramCount++;
      queryText += ` OR i.owner_id = $${paramCount}`;
      params.push(userId);
    }

    queryText += ' ORDER BY i.created_at DESC';

    const result = await query(queryText, params);

    const ideas = result.rows.map((idea: any) => ({
      id: idea.id,
      title: idea.title,
      description: idea.description,
      category: idea.category,
      stage: idea.stage,
      tags: idea.tags || [],
      ownerId: idea.owner_id,
      ownerUsername: idea.owner_username,
      ownerDisplayName: idea.owner_display_name,
      isPublic: idea.is_public,
      aiAnalysis: idea.ai_analysis,
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
    const { title, description, category, stage, tags, isPublic = true } = req.body;
    const ownerId = req.user!.userId;

    if (!title || !description || !category) {
      return res.status(400).json({ error: 'Title, description, and category are required' });
    }

    const result = await query(
      `INSERT INTO ideas (title, description, category, stage, tags, owner_id, is_public) 
       VALUES ($1, $2, $3, $4, $5, $6, $7) 
       RETURNING *`,
      [title, description, category, stage || 'idea', tags || [], ownerId, isPublic]
    );

    const idea = result.rows[0];

    res.status(201).json({
      id: idea.id,
      title: idea.title,
      description: idea.description,
      category: idea.category,
      stage: idea.stage,
      tags: idea.tags,
      ownerId: idea.owner_id,
      isPublic: idea.is_public,
      createdAt: idea.created_at
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
      `SELECT i.*, u.username as owner_username, u.display_name as owner_display_name 
       FROM ideas i 
       LEFT JOIN users u ON i.owner_id = u.id 
       WHERE i.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Idea not found' });
    }

    const idea = result.rows[0];
    res.json({
      id: idea.id,
      title: idea.title,
      description: idea.description,
      category: idea.category,
      stage: idea.stage,
      tags: idea.tags || [],
      ownerId: idea.owner_id,
      ownerUsername: idea.owner_username,
      ownerDisplayName: idea.owner_display_name,
      isPublic: idea.is_public,
      aiAnalysis: idea.ai_analysis,
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
    const { title, description, category, stage, tags, isPublic } = req.body;

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
       SET title = $1, description = $2, category = $3, stage = $4, tags = $5, is_public = $6, updated_at = NOW() 
       WHERE id = $7 
       RETURNING *`,
      [title, description, category, stage, tags, isPublic, id]
    );

    const idea = result.rows[0];
    res.json({
      id: idea.id,
      title: idea.title,
      description: idea.description,
      category: idea.category,
      stage: idea.stage,
      tags: idea.tags,
      ownerId: idea.owner_id,
      isPublic: idea.is_public,
      updatedAt: idea.updated_at
    });
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

export default router;
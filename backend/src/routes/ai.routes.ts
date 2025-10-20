import express, { Request, Response, NextFunction, Router } from 'express';
import { authenticateToken } from '../middleware/auth.middleware';
import { aiService } from '../services/ai.service';
import { query } from '../db/database';

const router: Router = express.Router();

// Analyze idea with AI
router.post('/analyze-idea', authenticateToken, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { title, description, category, ideaId } = req.body;

    if (!title || !description) {
      return res.status(400).json({ error: 'Title and description are required' });
    }

    console.log('AI analysis requested for idea:', title);

    const analysis = await aiService.analyzeIdea({
      title,
      description,
      category: category || 'general'
    });

    if (ideaId) {
      await query(
        'UPDATE ideas SET ai_analysis = $1, updated_at = NOW() WHERE id = $2',
        [analysis, ideaId]
      );
    }

    res.json({
      analysis,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('AI analysis error:', error);
    const errorMessage = error instanceof Error ? error.message : 'AI analysis failed';
    res.status(500).json({ 
      error: 'AI analysis failed',
      details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
    });
  }
});

// Generate idea summary
router.post('/generate-summary', authenticateToken, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { title, description } = req.body;

    if (!title || !description) {
      return res.status(400).json({ error: 'Title and description are required' });
    }

    const summary = await aiService.generateIdeaSummary({
      title,
      description
    });

    res.json({
      summary,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('AI summary generation error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Summary generation failed';
    res.status(500).json({
      error: 'Summary generation failed',
      details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
    });
  }
});

// AI-powered idea suggestions
router.get('/idea-suggestions', authenticateToken, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const userResult = await query(
      'SELECT interests, skills FROM users WHERE id = $1',
      [userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = userResult.rows[0];
    const interests: string[] = user.interests || [];
    const skills: string[] = user.skills || [];

    if (interests.length === 0 && skills.length === 0) {
      return res.json({ suggestions: [] });
    }

    const mockSuggestions = [
      interests[0] && skills[0] ? `Consider combining ${interests[0]} with ${skills[0]} to create something unique.` : undefined,
      interests[1] && skills[1] ? `Look into emerging trends in ${interests[1]} that could benefit from ${skills[1]}.` : undefined,
      interests[2] && skills[2] ? `Think about how you can solve common problems in ${interests[2]} using ${skills[2]}.` : undefined,
    ].filter(Boolean);

    res.json({
      suggestions: mockSuggestions,
      basedOn: {
        interests: interests.slice(0, 3),
        skills: skills.slice(0, 3)
      }
    });
  } catch (error) {
    console.error('AI suggestions error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to generate suggestions';
    res.status(500).json({ error: 'Failed to generate suggestions', details: errorMessage });
  }
});

export default router;

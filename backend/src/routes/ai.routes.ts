// backend/src/routes/ai.routes.ts
import express from 'express';
import { authenticateToken } from '../middleware/auth.middleware.js'; // Added .js
import { aiService } from '../services/ai.service.js'; // Added .js
import { query } from '../db/database.js'; // Added .js

const router = express.Router();

// --- Analyze Idea ---
router.post('/analyze-idea', authenticateToken, async (req: any, res: any) => {
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

    // Optionally save the analysis back to the idea in the database
    // Ensure your 'ideas' table has a suitable column (e.g., ai_analysis TEXT or JSONB)
    if (ideaId) {
      try {
        await query(
          // Assuming the column type is TEXT or you want to store as JSON string
          'UPDATE ideas SET ai_analysis = $1, updated_at = NOW() WHERE id = $2',
           // If column is JSON/JSONB, you might not need stringify, depending on pg driver
          [JSON.stringify(analysis), ideaId]
        );
         console.log(`Saved AI analysis for idea ${ideaId}`);
      } catch (dbError) {
          console.error(`Failed to save AI analysis for idea ${ideaId}:`, dbError);
          // Don't fail the whole request, just log the error
      }
    }

    res.json({
      analysis,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('AI analysis error:', error);
    res.status(500).json({
      error: 'AI analysis failed',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// --- Generate Idea Summary ---
router.post('/generate-summary', authenticateToken, async (req: any, res: any) => {
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
  } catch (error: any) {
    console.error('AI summary generation error:', error);
    res.status(500).json({
      error: 'Summary generation failed',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// --- Refine Idea Summary ---
router.post('/refine-summary', authenticateToken, async (req: any, res: any) => {
    try {
        const { summary } = req.body;
        if (!summary) {
            return res.status(400).json({ error: 'Summary text is required' });
        }

        const refinedSummary = await aiService.refineSummary(summary);

        res.json({
            refinedSummary: refinedSummary, // Matches frontend expectation
            timestamp: new Date().toISOString()
        });
    } catch (error: any) {
        console.error('AI summary refinement error:', error);
        const message = (error instanceof Error) ? error.message : 'Summary refinement failed';
        res.status(500).json({
            error: 'AI summary refinement failed',
            details: process.env.NODE_ENV === 'development' ? message : undefined
        });
    }
});

// --- Get Idea Suggestions ---
router.get('/idea-suggestions', authenticateToken, async (req: any, res: any) => {
  try {
    const userId = req.user.userId; // User ID from authenticateToken middleware

    const userResult = await query(
      // Assuming skills are stored as JSON: '[{"skillName": "...", "endorsers": [...]}, ...]'
      'SELECT interests, skills FROM users WHERE id = $1',
      [userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = userResult.rows[0];
    const interests: string[] = user.interests || [];
    // Safely parse skills and extract names
    let skillsArray: string[] = [];
    if (user.skills && Array.isArray(user.skills)) {
        skillsArray = user.skills.map((s: any) => s?.skillName).filter(Boolean);
    }

    if (interests.length === 0 && skillsArray.length === 0) {
      // Return empty suggestions if user has no interests or skills defined
      return res.json({ suggestions: [], basedOn: { interests: [], skills: [] } });
    }

    // Replace MOCK logic with a call to aiService.getIdeaSuggestions if implemented
    // const suggestions = await aiService.getIdeaSuggestions(interests, skillsArray);

    // Using MOCK suggestions for now
    const mockSuggestions = [
      `Consider combining ${interests[0] || 'your interests'} with ${skillsArray[0] || 'your skills'} to create something unique.`,
      `Look into emerging trends in ${interests[1] || 'technology'} that could benefit from ${skillsArray[1] || 'your expertise'}.`,
      `Think about how you can solve common problems in ${interests[2] || 'your field'} using ${skillsArray[2] || 'your abilities'}.`
    ].filter(s => !s.includes('undefined')); // Filter out suggestions with missing data

    res.json({
      suggestions: mockSuggestions,
      basedOn: {
        interests: interests.slice(0, 3), // Show what the suggestions were based on
        skills: skillsArray.slice(0, 3)
      }
    });
  } catch (error: any) {
    console.error('AI suggestions error:', error);
    res.status(500).json({ error: 'Failed to generate suggestions', details: process.env.NODE_ENV === 'development' ? error.message : undefined });
  }
});

export default router; // Use export default
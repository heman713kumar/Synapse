/**
 * Extended AI endpoints — thread summary, smart match, pitch generation.
 * Uses existing AI service (Gemini).
 */
import { Router } from 'express';
import { authenticateToken as authMiddleware } from '../middleware/auth.middleware';
import { query } from '../db/database';
import { aiService } from '../services/ai.service';

const router = Router();

// ─── THREAD SUMMARY ──────────────────────────────────────────────────────────

router.post('/summarize-thread', authMiddleware, async (req: any, res) => {
  const { messages } = req.body;
  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: 'messages array required' });
  }
  const text = messages
    .slice(-50)
    .map((m: any) => `${m.author ?? 'User'}: ${m.text}`)
    .join('\n')
    .slice(0, 4000);

  const prompt = `Summarize this discussion thread into strict JSON:
{ "tldr": "<one short paragraph>",
  "actionItems": ["..."],
  "decisions": ["..."],
  "openQuestions": ["..."] }

Thread:
${text}`;

  try {
    const refined = await aiService.refineSummary(prompt);
    const m = (refined ?? '').match(/\{[\s\S]*\}/);
    const parsed = m ? JSON.parse(m[0]) : {
      tldr: refined?.slice(0, 280) ?? '',
      actionItems: [], decisions: [], openQuestions: [],
    };
    res.json(parsed);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// ─── SMART COLLABORATOR MATCH ────────────────────────────────────────────────

router.get('/match/:ideaId', authMiddleware, async (req: any, res) => {
  try {
    const { rows: ideas } = await query(`SELECT * FROM ideas WHERE id = $1`, [req.params.ideaId]);
    if (!ideas[0]) return res.status(404).json({ error: 'Idea not found' });
    const idea = ideas[0];
    const requiredSkills: string[] = idea.required_skills ?? [];
    const tags: string[] = idea.tags ?? [];

    // Score users by skill+interest overlap
    const { rows } = await query(`
      WITH scored AS (
        SELECT u.user_id, u.display_name, u.avatar_url, u.headline,
          COALESCE(jsonb_array_length(u.skills), 0) AS skill_count,
          (
            (SELECT COUNT(*) FROM jsonb_array_elements(u.skills) s WHERE s->>'skillName' = ANY($1::text[])) * 25 +
            (SELECT COUNT(*) FROM jsonb_array_elements_text(u.interests) i WHERE i = ANY($2::text[])) * 10
          ) AS score
        FROM users u
        WHERE u.user_id != $3
      )
      SELECT * FROM scored WHERE score > 0 ORDER BY score DESC LIMIT 10
    `, [requiredSkills, tags, idea.owner_id]);

    res.json(rows.map((r: any) => ({
      ...r,
      matchScore: Math.min(100, r.score),
      reason: 'Skills + interests overlap',
    })));
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// ─── IDEA PITCH (10 slides) ──────────────────────────────────────────────────

router.post('/pitch/:ideaId', authMiddleware, async (req: any, res) => {
  try {
    const { rows } = await query(`SELECT * FROM ideas WHERE id = $1`, [req.params.ideaId]);
    if (!rows[0]) return res.status(404).json({ error: 'Not found' });
    const idea = rows[0];
    const analysis = await aiService.analyzeIdea({
      title: idea.title,
      description: idea.description ?? idea.summary,
      category: idea.sector ?? 'general',
    });
    res.json({ analysis });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

export default router;

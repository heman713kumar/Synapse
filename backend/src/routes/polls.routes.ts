/** Polls — reusable in forum + ideas. */
import { Router } from 'express';
import { authenticateToken as authMiddleware } from '../middleware/auth.middleware';
import { query } from '../db/database';

const router = Router();

router.post('/', authMiddleware, async (req: any, res) => {
  const { ideaId, forumMessageId, question, multipleChoice, closesAt, options } = req.body;
  if (!question || !Array.isArray(options) || options.length < 2 || options.length > 10) {
    return res.status(400).json({ error: 'Question + 2-10 options required' });
  }
  try {
    const { rows: p } = await query(
      `INSERT INTO polls (idea_id, forum_message_id, creator_id, question, multiple_choice, closes_at)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [ideaId, forumMessageId, req.user.userId, question, multipleChoice ?? false, closesAt]
    );
    const pollId = p[0].id;
    for (let i = 0; i < options.length; i++) {
      await query(
        `INSERT INTO poll_options (poll_id, label, order_index) VALUES ($1, $2, $3)`,
        [pollId, options[i], i]
      );
    }
    res.json(p[0]);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.get('/:id', async (req: any, res) => {
  const { rows: poll } = await query(`SELECT * FROM polls WHERE id = $1`, [req.params.id]);
  if (!poll[0]) return res.status(404).json({ error: 'Not found' });
  const { rows: options } = await query(
    `SELECT * FROM poll_options WHERE poll_id = $1 ORDER BY order_index`,
    [req.params.id]
  );
  const userId = req.user?.userId;
  const { rows: myVotes } = userId
    ? await query(`SELECT option_id FROM poll_votes WHERE poll_id = $1 AND user_id = $2`, [req.params.id, userId])
    : { rows: [] };
  res.json({ ...poll[0], options, myVotes: myVotes.map((r: any) => r.option_id) });
});

router.post('/:id/vote', authMiddleware, async (req: any, res) => {
  const { optionId } = req.body;
  try {
    const { rows: p } = await query(`SELECT closes_at, multiple_choice FROM polls WHERE id = $1`, [req.params.id]);
    if (!p[0]) return res.status(404).json({ error: 'Not found' });
    if (p[0].closes_at && new Date(p[0].closes_at) < new Date()) return res.status(400).json({ error: 'Poll closed' });

    if (!p[0].multiple_choice) {
      // Single-choice — remove previous vote first
      const { rows: prev } = await query(
        `DELETE FROM poll_votes WHERE poll_id = $1 AND user_id = $2 RETURNING option_id`,
        [req.params.id, req.user.userId]
      );
      for (const r of prev) {
        await query(`UPDATE poll_options SET vote_count = GREATEST(0, vote_count - 1) WHERE id = $1`, [r.option_id]);
      }
    }
    await query(
      `INSERT INTO poll_votes (poll_id, option_id, user_id) VALUES ($1, $2, $3)
       ON CONFLICT DO NOTHING`,
      [req.params.id, optionId, req.user.userId]
    );
    await query(`UPDATE poll_options SET vote_count = vote_count + 1 WHERE id = $1`, [optionId]);
    res.json({ ok: true });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

export default router;

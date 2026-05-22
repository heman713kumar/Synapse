/** Emoji reactions on ideas + comments. */
import { Router } from 'express';
import { authenticateToken as authMiddleware } from '../middleware/auth.middleware';
import { query } from '../db/database';

const router = Router();
const ALLOWED = new Set(['👍','❤️','🔥','💡','🚀','👀','🎉']);

router.post('/ideas/:ideaId', authMiddleware, async (req: any, res) => {
  const { emoji } = req.body;
  if (!ALLOWED.has(emoji)) return res.status(400).json({ error: 'Invalid emoji' });
  try {
    // Toggle: if exists, delete; else insert
    const { rowCount } = await query(
      `DELETE FROM idea_reactions WHERE idea_id = $1 AND user_id = $2 AND emoji = $3`,
      [req.params.ideaId, req.user.userId, emoji]
    );
    if (rowCount === 0) {
      await query(
        `INSERT INTO idea_reactions (idea_id, user_id, emoji) VALUES ($1, $2, $3)`,
        [req.params.ideaId, req.user.userId, emoji]
      );
    }
    const { rows } = await query(
      `SELECT emoji, COUNT(*)::int AS count FROM idea_reactions WHERE idea_id = $1 GROUP BY emoji`,
      [req.params.ideaId]
    );
    res.json({ reactions: rows, removed: (rowCount ?? 0) > 0 });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.get('/ideas/:ideaId', async (req: any, res) => {
  const { rows } = await query(
    `SELECT emoji, COUNT(*)::int AS count FROM idea_reactions WHERE idea_id = $1 GROUP BY emoji`,
    [req.params.ideaId]
  );
  let myReactions: string[] = [];
  if (req.user?.userId) {
    const { rows: mine } = await query(
      `SELECT emoji FROM idea_reactions WHERE idea_id = $1 AND user_id = $2`,
      [req.params.ideaId, req.user.userId]
    );
    myReactions = mine.map((r: any) => r.emoji);
  }
  res.json({ reactions: rows, mine: myReactions });
});

router.post('/comments/:commentId', authMiddleware, async (req: any, res) => {
  const { emoji } = req.body;
  if (!ALLOWED.has(emoji)) return res.status(400).json({ error: 'Invalid emoji' });
  const { rowCount } = await query(
    `DELETE FROM comment_reactions WHERE comment_id = $1 AND user_id = $2 AND emoji = $3`,
    [req.params.commentId, req.user.userId, emoji]
  );
  if (rowCount === 0) {
    await query(`INSERT INTO comment_reactions (comment_id, user_id, emoji) VALUES ($1, $2, $3)`, [req.params.commentId, req.user.userId, emoji]);
  }
  res.json({ ok: true, removed: (rowCount ?? 0) > 0 });
});

export default router;

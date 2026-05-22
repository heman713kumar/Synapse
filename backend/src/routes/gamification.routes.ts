/** XP / Quests / Streaks / Activity timeline. */
import { Router } from 'express';
import { authenticateToken as authMiddleware } from '../middleware/auth.middleware';
import { query } from '../db/database';

const router = Router();

const XP_VALUES: Record<string, number> = {
  post_idea: 50, post_comment: 5, react: 1, connect: 10,
  message_sent: 2, collab_accepted: 100, profile_completed: 25,
  first_login: 10, daily_visit: 5, achievement_unlocked: 30,
};

router.post('/xp/award', authMiddleware, async (req: any, res) => {
  const { action, multiplier = 1, metadata } = req.body;
  const xp = (XP_VALUES[action] ?? 0) * multiplier;
  if (xp === 0) return res.status(400).json({ error: 'Unknown action' });
  try {
    await query(
      `INSERT INTO xp_events (user_id, action, xp, metadata) VALUES ($1, $2, $3, $4)`,
      [req.user.userId, action, xp, metadata ?? {}]
    );
    await query(
      `INSERT INTO user_xp (user_id, total_xp, last_visit_date)
       VALUES ($1, $2, CURRENT_DATE)
       ON CONFLICT (user_id) DO UPDATE
         SET total_xp = user_xp.total_xp + EXCLUDED.total_xp, updated_at = NOW()`,
      [req.user.userId, xp]
    );
    res.json({ xpAwarded: xp });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.get('/xp/me', authMiddleware, async (req: any, res) => {
  const { rows } = await query(`SELECT * FROM user_xp WHERE user_id = $1`, [req.user.userId]);
  res.json(rows[0] ?? { user_id: req.user.userId, total_xp: 0, current_streak: 0, longest_streak: 0 });
});

router.get('/activity/me', authMiddleware, async (req: any, res) => {
  const { limit = 50 } = req.query;
  const { rows } = await query(
    `SELECT * FROM xp_events WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2`,
    [req.user.userId, limit]
  );
  res.json(rows);
});

// Quest progress
router.get('/quests/me', authMiddleware, async (req: any, res) => {
  const weekKey = currentWeekKey();
  const { rows } = await query(
    `SELECT * FROM quest_progress WHERE user_id = $1 AND week_key = $2`,
    [req.user.userId, weekKey]
  );
  res.json({ weekKey, progress: rows });
});

router.post('/quests/:questId/increment', authMiddleware, async (req: any, res) => {
  const { by = 1 } = req.body;
  const weekKey = currentWeekKey();
  await query(
    `INSERT INTO quest_progress (user_id, week_key, quest_id, progress)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (user_id, week_key, quest_id) DO UPDATE
       SET progress = quest_progress.progress + EXCLUDED.progress`,
    [req.user.userId, weekKey, req.params.questId, by]
  );
  res.json({ ok: true });
});

// Daily streak tick — call once per day on app open
router.post('/streak/tick', authMiddleware, async (req: any, res) => {
  const today = new Date().toISOString().slice(0, 10);
  const { rows } = await query(`SELECT last_visit_date, current_streak, longest_streak FROM user_xp WHERE user_id = $1`, [req.user.userId]);
  const prev = rows[0];
  let nextStreak = 1;
  if (prev?.last_visit_date) {
    const diff = Math.round((new Date(today).getTime() - new Date(prev.last_visit_date).getTime()) / 86400000);
    if (diff === 0) return res.json({ alreadyCounted: true, current: prev.current_streak });
    if (diff === 1) nextStreak = (prev.current_streak ?? 0) + 1;
  }
  await query(
    `INSERT INTO user_xp (user_id, current_streak, longest_streak, last_visit_date)
     VALUES ($1, $2, $2, $3)
     ON CONFLICT (user_id) DO UPDATE
       SET current_streak = EXCLUDED.current_streak,
           longest_streak = GREATEST(user_xp.longest_streak, EXCLUDED.current_streak),
           last_visit_date = EXCLUDED.last_visit_date`,
    [req.user.userId, nextStreak, today]
  );
  res.json({ current: nextStreak });
});

// Public leaderboards
router.get('/leaderboard/xp',     async (_req, res) => res.json((await query(`SELECT user_id, total_xp FROM user_xp ORDER BY total_xp DESC LIMIT 50`)).rows));
router.get('/leaderboard/streak', async (_req, res) => res.json((await query(`SELECT user_id, current_streak, longest_streak FROM user_xp ORDER BY current_streak DESC LIMIT 50`)).rows));

function currentWeekKey(): string {
  const d = new Date();
  const start = new Date(d.getFullYear(), 0, 1);
  const week = Math.ceil((((d.getTime() - start.getTime()) / 86400000) + start.getDay() + 1) / 7);
  return `${d.getFullYear()}-W${String(week).padStart(2, '0')}`;
}

export default router;

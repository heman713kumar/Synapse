/** Mentorship marketplace. */
import { Router } from 'express';
import { authenticateToken as authMiddleware } from '../middleware/auth.middleware';
import { query } from '../db/database';

const router = Router();

// List mentors
router.get('/mentors', async (req, res) => {
  try {
    const { expertise, q, limit = 50 } = req.query;
    const filters: string[] = [`m.active = TRUE`];
    const params: any[] = [];
    if (expertise) { params.push([expertise].flat()); filters.push(`m.expertise && $${params.length}`); }
    if (q)         { params.push(`%${q}%`); filters.push(`(u.display_name ILIKE $${params.length} OR m.bio ILIKE $${params.length})`); }
    params.push(limit);
    const { rows } = await query(
      `SELECT m.*, u.display_name, u.avatar_url, u.headline
       FROM mentors m JOIN users u ON u.user_id = m.user_id
       WHERE ${filters.join(' AND ')}
       ORDER BY m.rating DESC, m.review_count DESC
       LIMIT $${params.length}`,
      params
    );
    res.json(rows);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// Become a mentor / update profile
router.post('/mentors', authMiddleware, async (req: any, res) => {
  const { bio, expertise, rateCents, calendarUrl } = req.body;
  try {
    const { rows } = await query(
      `INSERT INTO mentors (user_id, bio, expertise, rate_cents, calendar_url)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (user_id) DO UPDATE
         SET bio = EXCLUDED.bio, expertise = EXCLUDED.expertise, rate_cents = EXCLUDED.rate_cents, calendar_url = EXCLUDED.calendar_url
       RETURNING *`,
      [req.user.userId, bio, expertise ?? [], rateCents, calendarUrl]
    );
    res.json(rows[0]);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// Get one mentor with reviews
router.get('/mentors/:userId', async (req, res) => {
  const { rows } = await query(
    `SELECT m.*, u.display_name, u.avatar_url, u.headline FROM mentors m JOIN users u ON u.user_id = m.user_id WHERE m.user_id = $1`,
    [req.params.userId]
  );
  if (!rows[0]) return res.status(404).json({ error: 'Not found' });
  const { rows: reviews } = await query(
    `SELECT b.rating, b.review_text, b.scheduled_at, u.display_name AS reviewer_name, u.avatar_url AS reviewer_avatar
     FROM mentorship_bookings b JOIN users u ON u.user_id = b.mentee_id
     WHERE b.mentor_id = $1 AND b.review_text IS NOT NULL
     ORDER BY b.scheduled_at DESC LIMIT 10`,
    [req.params.userId]
  );
  res.json({ ...rows[0], reviews });
});

// Book a slot
router.post('/bookings', authMiddleware, async (req: any, res) => {
  const { mentorId, scheduledAt, durationMin = 30 } = req.body;
  try {
    const { rows: m } = await query(`SELECT rate_cents FROM mentors WHERE user_id = $1`, [mentorId]);
    if (!m[0]) return res.status(404).json({ error: 'Mentor not found' });
    const amount = Math.round(m[0].rate_cents * (durationMin / 30));
    const { rows } = await query(
      `INSERT INTO mentorship_bookings (mentor_id, mentee_id, scheduled_at, duration_min, amount_cents)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [mentorId, req.user.userId, scheduledAt, durationMin, amount]
    );
    res.json(rows[0]);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// My bookings
router.get('/bookings/me', authMiddleware, async (req: any, res) => {
  const { rows } = await query(
    `SELECT b.*, u.display_name AS mentor_name, u.avatar_url AS mentor_avatar
     FROM mentorship_bookings b JOIN users u ON u.user_id = b.mentor_id
     WHERE b.mentee_id = $1 ORDER BY b.scheduled_at DESC`,
    [req.user.userId]
  );
  res.json(rows);
});

// Submit review after session
router.post('/bookings/:id/review', authMiddleware, async (req: any, res) => {
  const { rating, reviewText } = req.body;
  await query(
    `UPDATE mentorship_bookings SET rating = $1, review_text = $2 WHERE id = $3 AND mentee_id = $4`,
    [rating, reviewText, req.params.id, req.user.userId]
  );
  res.json({ ok: true });
});

export default router;

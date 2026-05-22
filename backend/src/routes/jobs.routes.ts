/**
 * Jobs board — full/part/contract/volunteer/equity-only roles.
 */
import { Router, Response } from 'express';
import { authenticateToken as authMiddleware } from '../middleware/auth.middleware';
import { query } from '../db/database';

const router = Router();

router.get('/', async (req, res: Response) => {
  try {
    const { commitment, remote, skills, q, limit = 50 } = req.query;
    const filters: string[] = [`status = 'open'`];
    const params: any[] = [];
    if (commitment) { params.push(commitment); filters.push(`commitment = $${params.length}`); }
    if (remote)     { params.push(remote);     filters.push(`remote = $${params.length}`); }
    if (skills)     { params.push((skills as string).split(',')); filters.push(`skills && $${params.length}`); }
    if (q)          { params.push(`%${q}%`); filters.push(`(title ILIKE $${params.length} OR company ILIKE $${params.length} OR description ILIKE $${params.length})`); }
    params.push(limit);
    const { rows } = await query(
      `SELECT * FROM jobs WHERE ${filters.join(' AND ')} ORDER BY created_at DESC LIMIT $${params.length}`,
      params
    );
    res.json(rows);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.get('/:id', async (req, res) => {
  const { rows } = await query(`SELECT * FROM jobs WHERE id = $1`, [req.params.id]);
  if (!rows[0]) return res.status(404).json({ error: 'Not found' });
  res.json(rows[0]);
});

router.post('/', authMiddleware, async (req: any, res) => {
  const { ideaId, title, company, description, commitment, remote, location, salaryMin, salaryMax, equity, skills } = req.body;
  if (!title || !description) return res.status(400).json({ error: 'title + description required' });
  try {
    const { rows } = await query(
      `INSERT INTO jobs (idea_id, poster_id, title, company, description, commitment, remote, location, salary_min, salary_max, equity, skills)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING *`,
      [ideaId, req.user.userId, title, company, description, commitment, remote, location, salaryMin, salaryMax, equity, skills ?? []]
    );
    res.json(rows[0]);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.post('/:id/apply', authMiddleware, async (req: any, res) => {
  const { coverLetter, resumeUrl } = req.body;
  try {
    await query(
      `INSERT INTO job_applications (job_id, applicant_id, cover_letter, resume_url) VALUES ($1, $2, $3, $4)`,
      [req.params.id, req.user.userId, coverLetter, resumeUrl]
    );
    await query(`UPDATE jobs SET applicant_count = applicant_count + 1 WHERE id = $1`, [req.params.id]);
    res.json({ ok: true });
  } catch (e: any) {
    if (e.message?.includes('duplicate')) return res.status(409).json({ error: 'Already applied' });
    res.status(500).json({ error: e.message });
  }
});

router.patch('/:id', authMiddleware, async (req: any, res) => {
  const owner = await query(`SELECT poster_id FROM jobs WHERE id = $1`, [req.params.id]);
  if (owner.rows[0]?.poster_id !== req.user.userId) return res.status(403).json({ error: 'Forbidden' });
  const { status } = req.body;
  await query(`UPDATE jobs SET status = $1 WHERE id = $2`, [status, req.params.id]);
  res.json({ ok: true });
});

export default router;

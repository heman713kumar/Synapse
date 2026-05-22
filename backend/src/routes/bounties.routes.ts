/**
 * Bounties — owners post tasks with $ rewards, contributors apply, funds in escrow.
 */
import { Router, Response } from 'express';
import { authenticateToken as authMiddleware } from '../middleware/auth.middleware';
import { query } from '../db/database';
import * as stripeService from '../services/stripeService';
import { Push } from '../services/pushService';

const router = Router();

// LIST
router.get('/', async (req, res: Response) => {
  try {
    const { status, idea_id, limit = 50 } = req.query;
    const filters: string[] = [];
    const params: any[] = [];
    if (status) { params.push(status); filters.push(`status = $${params.length}`); }
    if (idea_id) { params.push(idea_id); filters.push(`idea_id = $${params.length}`); }
    const where = filters.length ? `WHERE ${filters.join(' AND ')}` : '';
    const { rows } = await query(
      `SELECT * FROM bounties ${where} ORDER BY created_at DESC LIMIT $${params.length + 1}`,
      [...params, limit]
    );
    res.json(rows);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// GET ONE
router.get('/:id', async (req, res) => {
  const { rows } = await query(`SELECT * FROM bounties WHERE id = $1`, [req.params.id]);
  if (!rows[0]) return res.status(404).json({ error: 'Not found' });
  res.json(rows[0]);
});

// CREATE  (also creates escrow PaymentIntent)
router.post('/', authMiddleware, async (req: any, res: Response) => {
  const { ideaId, title, description, rewardCents, deadline, difficulty, tags } = req.body;
  if (!title || !rewardCents || rewardCents < 1000) {
    return res.status(400).json({ error: 'Invalid bounty data — minimum $10' });
  }
  try {
    const { rows } = await query(
      `INSERT INTO bounties (idea_id, poster_id, title, description, reward_cents, deadline, difficulty, tags)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [ideaId, req.user.userId, title, description, rewardCents, deadline, difficulty ?? 'medium', tags ?? []]
    );
    const bounty = rows[0];

    let clientSecret: string | null = null;
    try {
      const escrow = await stripeService.createBountyEscrow({
        bountyId: bounty.id, posterId: req.user.userId, amountCents: rewardCents,
      });
      clientSecret = escrow.clientSecret;
    } catch (e: any) {
      console.warn('Stripe escrow skipped:', e.message);
    }

    res.json({ bounty, clientSecret });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// APPLY
router.post('/:id/apply', authMiddleware, async (req: any, res) => {
  const { proposal } = req.body;
  if (!proposal) return res.status(400).json({ error: 'Proposal required' });
  try {
    await query(
      `INSERT INTO bounty_applications (bounty_id, applicant_id, proposal) VALUES ($1, $2, $3)`,
      [req.params.id, req.user.userId, proposal]
    );
    await query(`UPDATE bounties SET applicant_count = applicant_count + 1 WHERE id = $1`, [req.params.id]);

    // Notify poster
    const { rows } = await query(`SELECT poster_id, title FROM bounties WHERE id = $1`, [req.params.id]);
    if (rows[0]) await Push.newCollabRequest(rows[0].poster_id, req.user.email ?? 'Someone', rows[0].title).catch(() => {});

    res.json({ ok: true });
  } catch (e: any) {
    if (e.message?.includes('duplicate')) return res.status(409).json({ error: 'Already applied' });
    res.status(500).json({ error: e.message });
  }
});

// LIST APPLICATIONS (owner only)
router.get('/:id/applications', authMiddleware, async (req: any, res) => {
  const owner = await query(`SELECT poster_id FROM bounties WHERE id = $1`, [req.params.id]);
  if (owner.rows[0]?.poster_id !== req.user.userId) return res.status(403).json({ error: 'Forbidden' });
  const { rows } = await query(
    `SELECT a.*, u.display_name, u.avatar_url
     FROM bounty_applications a JOIN users u ON u.user_id = a.applicant_id
     WHERE a.bounty_id = $1 ORDER BY a.created_at DESC`,
    [req.params.id]
  );
  res.json(rows);
});

// ACCEPT applicant (owner only)
router.post('/:id/accept/:applicantId', authMiddleware, async (req: any, res) => {
  const owner = await query(`SELECT poster_id FROM bounties WHERE id = $1`, [req.params.id]);
  if (owner.rows[0]?.poster_id !== req.user.userId) return res.status(403).json({ error: 'Forbidden' });
  await query(`UPDATE bounties SET assigned_to = $1, status = 'in_progress' WHERE id = $2`, [req.params.applicantId, req.params.id]);
  await query(`UPDATE bounty_applications SET status = 'accepted' WHERE bounty_id = $1 AND applicant_id = $2`, [req.params.id, req.params.applicantId]);
  res.json({ ok: true });
});

// COMPLETE (owner approves → release escrow)
router.post('/:id/complete', authMiddleware, async (req: any, res) => {
  const { rows } = await query(`SELECT poster_id, assigned_to FROM bounties WHERE id = $1`, [req.params.id]);
  if (rows[0]?.poster_id !== req.user.userId) return res.status(403).json({ error: 'Forbidden' });
  if (!rows[0]?.assigned_to) return res.status(400).json({ error: 'No assignee' });
  try {
    await stripeService.releaseBountyEscrow(req.params.id, rows[0].assigned_to);
    res.json({ ok: true });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// CANCEL (owner refunds)
router.post('/:id/cancel', authMiddleware, async (req: any, res) => {
  const { rows } = await query(`SELECT poster_id FROM bounties WHERE id = $1`, [req.params.id]);
  if (rows[0]?.poster_id !== req.user.userId) return res.status(403).json({ error: 'Forbidden' });
  try {
    await stripeService.refundBountyEscrow(req.params.id);
    res.json({ ok: true });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

export default router;

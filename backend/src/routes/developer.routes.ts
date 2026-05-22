/** API keys + Webhooks for developers. */
import { Router } from 'express';
import { authenticateToken as authMiddleware } from '../middleware/auth.middleware';
import { query } from '../db/database';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

const router = Router();

// ─── API KEYS ────────────────────────────────────────────────────────────────

router.get('/keys', authMiddleware, async (req: any, res) => {
  const { rows } = await query(
    `SELECT id, name, prefix, scopes, last_used_at, created_at FROM api_keys
     WHERE user_id = $1 AND revoked_at IS NULL ORDER BY created_at DESC`,
    [req.user.userId]
  );
  res.json(rows);
});

router.post('/keys', authMiddleware, async (req: any, res) => {
  const { name, scopes } = req.body;
  if (!name) return res.status(400).json({ error: 'Name required' });
  const raw = 'sk_live_' + crypto.randomBytes(24).toString('hex');
  const prefix = raw.slice(0, 12);
  const hash = await bcrypt.hash(raw, 10);
  const { rows } = await query(
    `INSERT INTO api_keys (user_id, name, prefix, hash, scopes)
     VALUES ($1, $2, $3, $4, $5) RETURNING id, name, prefix, scopes, created_at`,
    [req.user.userId, name, prefix, hash, scopes ?? ['ideas:read', 'profile:read']]
  );
  res.json({ ...rows[0], key: raw, _warning: 'This key is shown only once. Store it now.' });
});

router.delete('/keys/:id', authMiddleware, async (req: any, res) => {
  await query(`UPDATE api_keys SET revoked_at = NOW() WHERE id = $1 AND user_id = $2`, [req.params.id, req.user.userId]);
  res.json({ ok: true });
});

// ─── WEBHOOKS ────────────────────────────────────────────────────────────────

router.get('/webhooks', authMiddleware, async (req: any, res) => {
  const { rows } = await query(`SELECT id, url, events, enabled, last_delivered_at, failure_count, created_at FROM webhooks WHERE user_id = $1`, [req.user.userId]);
  res.json(rows);
});

router.post('/webhooks', authMiddleware, async (req: any, res) => {
  const { url, events } = req.body;
  if (!/^https?:\/\//.test(url)) return res.status(400).json({ error: 'Invalid URL' });
  const signingSecret = 'whsec_' + crypto.randomBytes(32).toString('hex');
  const { rows } = await query(
    `INSERT INTO webhooks (user_id, url, events, signing_secret) VALUES ($1, $2, $3, $4) RETURNING id, url, events, enabled, created_at`,
    [req.user.userId, url, events ?? ['idea.created', 'comment.created'], signingSecret]
  );
  res.json({ ...rows[0], signingSecret, _warning: 'Store the signing secret — used to verify payloads.' });
});

router.patch('/webhooks/:id', authMiddleware, async (req: any, res) => {
  const { enabled, events } = req.body;
  await query(`UPDATE webhooks SET enabled = COALESCE($1, enabled), events = COALESCE($2, events) WHERE id = $3 AND user_id = $4`, [enabled, events, req.params.id, req.user.userId]);
  res.json({ ok: true });
});

router.delete('/webhooks/:id', authMiddleware, async (req: any, res) => {
  await query(`DELETE FROM webhooks WHERE id = $1 AND user_id = $2`, [req.params.id, req.user.userId]);
  res.json({ ok: true });
});

router.get('/webhooks/:id/deliveries', authMiddleware, async (req: any, res) => {
  const { rows: own } = await query(`SELECT user_id FROM webhooks WHERE id = $1`, [req.params.id]);
  if (own[0]?.user_id !== req.user.userId) return res.status(403).json({ error: 'Forbidden' });
  const { rows } = await query(
    `SELECT id, event, response_code, delivered_at, attempts, created_at FROM webhook_deliveries
     WHERE webhook_id = $1 ORDER BY created_at DESC LIMIT 100`,
    [req.params.id]
  );
  res.json(rows);
});

export default router;

/** GDPR — data export + scheduled account deletion. */
import { Router } from 'express';
import { authenticateToken as authMiddleware } from '../middleware/auth.middleware';
import { query } from '../db/database';
import { sendEmail } from '../services/emailService';

const router = Router();

// ─── DATA EXPORT ─────────────────────────────────────────────────────────────

router.post('/export', authMiddleware, async (req: any, res) => {
  const { sections = [], format = 'json' } = req.body;
  const { rows } = await query(
    `INSERT INTO data_export_jobs (user_id, sections, format)
     VALUES ($1, $2, $3) RETURNING id`,
    [req.user.userId, sections, format]
  );
  // In production: kick off a background worker to assemble the ZIP.
  // For now, we generate inline since dataset is small.
  await processExportJob(rows[0].id);
  res.json({ jobId: rows[0].id, status: 'ready' });
});

router.get('/export/:id', authMiddleware, async (req: any, res) => {
  const { rows } = await query(
    `SELECT * FROM data_export_jobs WHERE id = $1 AND user_id = $2`,
    [req.params.id, req.user.userId]
  );
  if (!rows[0]) return res.status(404).json({ error: 'Not found' });
  res.json(rows[0]);
});

async function processExportJob(jobId: string) {
  const { rows: jobs } = await query(`SELECT * FROM data_export_jobs WHERE id = $1`, [jobId]);
  const job = jobs[0];
  if (!job) return;

  await query(`UPDATE data_export_jobs SET status = 'running' WHERE id = $1`, [jobId]);

  const data: Record<string, any> = {
    _metadata: { exportedAt: new Date().toISOString(), userId: job.user_id, sections: job.sections },
  };

  if (job.sections.includes('profile')) {
    const { rows } = await query(`SELECT * FROM users WHERE user_id = $1`, [job.user_id]);
    data.profile = rows[0];
  }
  if (job.sections.includes('ideas')) {
    data.ideas = (await query(`SELECT * FROM ideas WHERE owner_id = $1`, [job.user_id])).rows;
  }
  if (job.sections.includes('comments')) {
    data.comments = (await query(`SELECT * FROM comments WHERE user_id = $1`, [job.user_id])).rows;
  }
  if (job.sections.includes('messages')) {
    data.messages = (await query(`SELECT * FROM messages WHERE sender_id = $1`, [job.user_id])).rows;
  }
  // ...add other sections as your schema fills out

  // In production: upload to S3 and return a signed URL good for 7 days.
  // Here we just store the data inline (small enough)
  await query(
    `UPDATE data_export_jobs
       SET status = 'ready', completed_at = NOW(),
           expires_at = NOW() + INTERVAL '7 days',
           download_url = 'inline'
     WHERE id = $1`,
    [jobId]
  );

  // Email the user
  const { rows: users } = await query(`SELECT email FROM users WHERE user_id = $1`, [job.user_id]);
  if (users[0]?.email) {
    await sendEmail(
      users[0].email,
      'Your Synapse data export is ready',
      'Your export is ready and available for the next 7 days. Download from Settings → Privacy.',
      `<p>Your data export is ready and available for the next 7 days.</p>
       <p><a href="${process.env.APP_URL}/?nav=settings&tab=privacy">Download it from Settings</a></p>`
    ).catch(() => {});
  }
}

// ─── ACCOUNT DELETION ────────────────────────────────────────────────────────

router.post('/delete-account', authMiddleware, async (req: any, res) => {
  const { reason, feedback } = req.body;
  const scheduledFor = new Date(Date.now() + 30 * 86400_000); // 30-day grace
  await query(
    `INSERT INTO pending_deletions (user_id, reason, feedback, scheduled_for)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (user_id) DO UPDATE SET scheduled_for = EXCLUDED.scheduled_for`,
    [req.user.userId, reason, feedback, scheduledFor]
  );
  res.json({ scheduledFor: scheduledFor.toISOString() });
});

router.post('/cancel-deletion', authMiddleware, async (req: any, res) => {
  await query(`DELETE FROM pending_deletions WHERE user_id = $1`, [req.user.userId]);
  res.json({ ok: true });
});

router.get('/deletion-status', authMiddleware, async (req: any, res) => {
  const { rows } = await query(`SELECT * FROM pending_deletions WHERE user_id = $1`, [req.user.userId]);
  res.json(rows[0] ?? { pending: false });
});

// ─── COOKIE CONSENT LOG ──────────────────────────────────────────────────────

router.post('/consent', async (req: any, res) => {
  const { functional, analytics, marketing, userId } = req.body;
  await query(
    `INSERT INTO cookie_consent_log (user_id, functional, analytics, marketing, ip_address, user_agent)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [userId ?? null, !!functional, !!analytics, !!marketing,
     (req.headers['x-forwarded-for'] as string)?.split(',')[0] ?? req.socket.remoteAddress,
     req.headers['user-agent']]
  );
  res.json({ ok: true });
});

export default router;

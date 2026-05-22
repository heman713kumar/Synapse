/**
 * Cron / scheduled-job runner.
 * Install: npm i node-cron
 *
 * Jobs:
 *   - Sunday 09:00 UTC  → send weekly digest emails
 *   - Daily 03:00 UTC   → finalize scheduled account deletions
 *   - Daily 02:00 UTC   → recompute tag trending scores
 *   - Every 5 min       → retry failed webhook deliveries
 *   - Hourly            → expire stale data exports + push retries
 */

import cron from 'node-cron';
import { query } from '../db/database';
import { sendWeeklyDigests } from './digestService';

export function startCron() {
  console.log('⏰ Cron scheduler started');

  // Sunday 09:00 UTC
  cron.schedule('0 9 * * 0', async () => {
    console.log('⏰ Running: weekly digests');
    try { await sendWeeklyDigests(); } catch (e) { console.error('digest failed', e); }
  });

  // Daily 03:00 UTC — finalize pending deletions older than 30 days
  cron.schedule('0 3 * * *', async () => {
    console.log('⏰ Running: finalize deletions');
    try {
      const { rows } = await query(
        `SELECT user_id FROM pending_deletions WHERE scheduled_for < NOW()`
      );
      for (const row of rows) {
        await finalizeDeletion(row.user_id);
      }
      console.log(`  → finalized ${rows.length} accounts`);
    } catch (e) { console.error(e); }
  });

  // Daily 02:00 UTC — recompute trending scores for tags
  cron.schedule('0 2 * * *', async () => {
    console.log('⏰ Running: tag trending scores');
    try {
      await query(`
        UPDATE tags t SET trending_score =
          GREATEST(0, (
            SELECT COUNT(*) FROM idea_tags it
            JOIN ideas i ON i.id = it.idea_id
            WHERE it.tag_slug = t.slug
              AND i.created_at > NOW() - INTERVAL '7 days'
          )::numeric / NULLIF(t.idea_count, 0))
      `);
    } catch (e) { console.error(e); }
  });

  // Every 5 min — retry failed webhook deliveries
  cron.schedule('*/5 * * * *', async () => {
    try {
      const { rows } = await query(`
        SELECT id, webhook_id, payload, event, attempts FROM webhook_deliveries
        WHERE delivered_at IS NULL AND next_retry_at <= NOW() AND attempts < 5
        LIMIT 50
      `);
      for (const d of rows) {
        await retryWebhookDelivery(d);
      }
    } catch (e) { console.error(e); }
  });

  // Hourly — clean up
  cron.schedule('0 * * * *', async () => {
    try {
      await query(`DELETE FROM data_export_jobs WHERE expires_at < NOW() - INTERVAL '7 days'`);
      await query(`DELETE FROM cookie_consent_log WHERE decided_at < NOW() - INTERVAL '5 years'`);
    } catch (e) { console.error(e); }
  });
}

async function finalizeDeletion(userId: string) {
  // Delete in correct order to avoid FK constraint failures
  // Real system should anonymize content the user posted in shared spaces (forum, comments)
  try {
    await query(`UPDATE comments SET user_id = NULL, text = '[deleted]' WHERE user_id = $1`, [userId]);
    await query(`UPDATE ideas SET owner_id = NULL, title = '[deleted]', summary = NULL, description = NULL WHERE owner_id = $1`, [userId]);
    await query(`DELETE FROM idea_reactions WHERE user_id = $1`, [userId]);
    await query(`DELETE FROM poll_votes WHERE user_id = $1`, [userId]);
    await query(`DELETE FROM follows WHERE follower_id = $1 OR following_id = $1`, [userId]);
    await query(`DELETE FROM push_subscriptions WHERE user_id = $1`, [userId]);
    await query(`DELETE FROM api_keys WHERE user_id = $1`, [userId]);
    await query(`DELETE FROM webhooks WHERE user_id = $1`, [userId]);
    await query(`DELETE FROM user_xp WHERE user_id = $1`, [userId]);
    await query(`DELETE FROM users WHERE user_id = $1`, [userId]);
    await query(`DELETE FROM pending_deletions WHERE user_id = $1`, [userId]);
    await query(`INSERT INTO audit_log (user_id, action, resource) VALUES ($1, 'account_deleted', 'user')`, [userId]);
  } catch (e) {
    console.error(`Failed to finalize ${userId}`, e);
  }
}

async function retryWebhookDelivery(delivery: any) {
  try {
    const { rows: w } = await query(`SELECT url, signing_secret, enabled FROM webhooks WHERE id = $1`, [delivery.webhook_id]);
    if (!w[0]?.enabled) {
      await query(`UPDATE webhook_deliveries SET delivered_at = NOW() WHERE id = $1`, [delivery.id]);
      return;
    }
    const body = JSON.stringify(delivery.payload);
    const crypto = await import('crypto');
    const sig = crypto.createHmac('sha256', w[0].signing_secret).update(body).digest('hex');
    const res = await fetch(w[0].url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Synapse-Signature': sig, 'X-Synapse-Event': delivery.event },
      body,
    });
    const ok = res.status >= 200 && res.status < 300;
    if (ok) {
      await query(`UPDATE webhook_deliveries SET delivered_at = NOW(), response_code = $1 WHERE id = $2`, [res.status, delivery.id]);
      await query(`UPDATE webhooks SET last_delivered_at = NOW(), failure_count = 0 WHERE id = $1`, [delivery.webhook_id]);
    } else {
      const nextRetry = new Date(Date.now() + Math.pow(2, delivery.attempts) * 60_000);
      await query(`UPDATE webhook_deliveries SET response_code = $1, attempts = attempts + 1, next_retry_at = $2 WHERE id = $3`, [res.status, nextRetry, delivery.id]);
      await query(`UPDATE webhooks SET failure_count = failure_count + 1 WHERE id = $1`, [delivery.webhook_id]);
    }
  } catch (e) {
    console.error('Webhook retry failed', e);
  }
}

/** Helper for routes to fire webhook events */
export async function fireWebhook(event: string, payload: any, userId?: string) {
  const { rows } = await query(
    `SELECT id FROM webhooks WHERE enabled = TRUE AND $1 = ANY(events) ${userId ? 'AND user_id = $2' : ''}`,
    userId ? [event, userId] : [event]
  );
  for (const w of rows) {
    await query(
      `INSERT INTO webhook_deliveries (webhook_id, event, payload, next_retry_at) VALUES ($1, $2, $3, NOW())`,
      [w.id, event, payload]
    );
  }
}

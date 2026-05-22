/**
 * Web Push notifications via VAPID.
 *
 * Install: npm i web-push
 * Env:
 *   VAPID_PUBLIC_KEY=BN...
 *   VAPID_PRIVATE_KEY=...
 *   VAPID_SUBJECT=mailto:push@synapse.app
 *
 * Generate keys once: npx web-push generate-vapid-keys
 */

import webpush from 'web-push';
import { query } from '../db/database';

const ENABLED = !!process.env.VAPID_PUBLIC_KEY && !!process.env.VAPID_PRIVATE_KEY;

if (ENABLED) {
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT || 'mailto:push@synapse.app',
    process.env.VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!
  );
} else {
  console.warn('⚠ VAPID keys missing — push notifications disabled');
}

export interface PushPayload {
  title: string;
  body: string;
  url?: string;
  tag?: string;
  badge?: string;
  icon?: string;
}

/** Save a push subscription for a user (called when user accepts the prompt). */
export async function saveSubscription(userId: string, sub: webpush.PushSubscription, userAgent?: string) {
  await query(
    `INSERT INTO push_subscriptions (user_id, endpoint, p256dh, auth, user_agent)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (endpoint) DO UPDATE SET user_id = EXCLUDED.user_id`,
    [userId, sub.endpoint, sub.keys.p256dh, sub.keys.auth, userAgent]
  );
}

export async function deleteSubscription(endpoint: string) {
  await query(`DELETE FROM push_subscriptions WHERE endpoint = $1`, [endpoint]);
}

/** Send a push to all of a user's devices. Auto-cleans dead subscriptions. */
export async function sendToUser(userId: string, payload: PushPayload) {
  if (!ENABLED) return { sent: 0, failed: 0 };

  const { rows } = await query(
    `SELECT endpoint, p256dh, auth FROM push_subscriptions WHERE user_id = $1`,
    [userId]
  );

  let sent = 0;
  let failed = 0;
  const deadEndpoints: string[] = [];

  await Promise.all(rows.map(async (row) => {
    try {
      await webpush.sendNotification(
        { endpoint: row.endpoint, keys: { p256dh: row.p256dh, auth: row.auth } },
        JSON.stringify({
          title: payload.title,
          body: payload.body,
          url: payload.url ?? '/',
          tag: payload.tag,
          icon: payload.icon ?? '/icons/icon-192.png',
          badge: payload.badge ?? '/icons/icon-48.png',
        }),
        { TTL: 60 * 60 * 24 }
      );
      sent++;
    } catch (err: any) {
      failed++;
      // Subscription expired or unsubscribed
      if (err.statusCode === 404 || err.statusCode === 410) {
        deadEndpoints.push(row.endpoint);
      }
    }
  }));

  if (deadEndpoints.length > 0) {
    await query(`DELETE FROM push_subscriptions WHERE endpoint = ANY($1)`, [deadEndpoints]);
  }
  return { sent, failed };
}

/** Broadcast to many users at once (use sparingly — has rate limits). */
export async function sendBatch(userIds: string[], payload: PushPayload) {
  const results = await Promise.all(userIds.map((uid) => sendToUser(uid, payload).catch(() => ({ sent: 0, failed: 1 }))));
  return results.reduce((acc, r) => ({ sent: acc.sent + r.sent, failed: acc.failed + r.failed }), { sent: 0, failed: 0 });
}

// ─── Convenience triggers (called from feature routes) ──────────────────────

export const Push = {
  newMessage: (toUserId: string, fromName: string, preview: string, conversationId: string) =>
    sendToUser(toUserId, {
      title: fromName,
      body: preview.slice(0, 120),
      url: `/?nav=chat&id=${conversationId}`,
      tag: `chat-${conversationId}`,
    }),

  newCollabRequest: (toUserId: string, fromName: string, ideaTitle: string) =>
    sendToUser(toUserId, {
      title: 'Collaboration request',
      body: `${fromName} wants to join "${ideaTitle}"`,
      url: '/?nav=notifications',
      tag: 'collab',
    }),

  achievement: (toUserId: string, achievementName: string) =>
    sendToUser(toUserId, {
      title: `🏆 ${achievementName}`,
      body: 'You unlocked a new achievement!',
      url: '/?nav=profile',
      tag: 'achievement',
    }),
};

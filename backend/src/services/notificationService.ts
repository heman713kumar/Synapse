import { query } from '../db/database';

/**
 * Advanced Notifications Service
 * Handles notification preferences, digest scheduling, and categorization
 */

// ============================================
// NOTIFICATION PREFERENCES
// ============================================

export async function getNotificationPreferences(userId: string) {
  const result = await query(
    'SELECT * FROM notification_preferences WHERE user_id = $1',
    [userId]
  );
  return result.rows;
}

export async function updateNotificationPreference(
  userId: string,
  channel: string,
  category: string,
  enabled: boolean,
  frequency: string = 'instant'
) {
  const result = await query(
    `INSERT INTO notification_preferences (user_id, channel, category, enabled, frequency, updated_at)
     VALUES ($1, $2, $3, $4, $5, NOW())
     ON CONFLICT (user_id, channel, category) DO UPDATE SET enabled = $4, frequency = $5, updated_at = NOW()
     RETURNING *`,
    [userId, channel, category, enabled, frequency]
  );
  return result.rows[0];
}

export async function getWantedNotifications(userId: string, category: string) {
  const result = await query(
    `SELECT * FROM notification_preferences 
     WHERE user_id = $1 AND category = $2 AND enabled = true`,
    [userId, category]
  );
  return result.rows;
}

// ============================================
// NOTIFICATION MANAGEMENT
// ============================================

export async function markNotificationAsRead(notificationId: number) {
  const result = await query(
    `UPDATE notifications SET is_read = true, read_at = NOW() 
     WHERE id = $1 RETURNING *`,
    [notificationId]
  );
  return result.rows[0];
}

export async function markAllNotificationsAsRead(userId: string) {
  const result = await query(
    `UPDATE notifications SET is_read = true, read_at = NOW() 
     WHERE user_id = $1 AND is_read = false RETURNING *`,
    [userId]
  );
  return result.rows;
}

export async function getUnreadNotifications(userId: string) {
  const result = await query(
    `SELECT * FROM notifications 
     WHERE user_id = $1 AND is_read = false 
     ORDER BY created_at DESC LIMIT 50`,
    [userId]
  );
  return result.rows;
}

export async function getNotificationsByCategory(userId: string, category: string) {
  const result = await query(
    `SELECT * FROM notifications 
     WHERE user_id = $1 AND category = $2 
     ORDER BY created_at DESC LIMIT 50`,
    [userId, category]
  );
  return result.rows;
}

export async function deleteNotification(notificationId: number) {
  await query(
    'DELETE FROM notifications WHERE id = $1',
    [notificationId]
  );
}

// ============================================
// NOTIFICATION DIGEST
// ============================================

export async function createNotificationDigest(userId: string, digestType: string) {
  // Get all unread notifications since last digest
  const notificationsResult = await query(
    `SELECT * FROM notifications 
     WHERE user_id = $1 AND is_read = false 
     ORDER BY created_at DESC`,
    [userId]
  );

  const notifications = notificationsResult.rows;

  if (!notifications || notifications.length === 0) {
    return null;
  }

  // Record digest
  const digestResult = await query(
    `INSERT INTO notification_digests (user_id, digest_type, notifications_count, sent_at)
     VALUES ($1, $2, $3, NOW()) RETURNING *`,
    [userId, digestType, notifications.length]
  );

  return {
    digest: digestResult.rows[0],
    notifications,
  };
}

// ============================================
// SEND NOTIFICATION
// ============================================

export async function sendNotification(
  userId: string,
  title: string,
  description: string,
  category: string,
  priority: string = 'normal',
  metadata: any = {}
) {
  // Check if user wants this notification
  const preferences = await getWantedNotifications(userId, category);
  if (!preferences || preferences.length === 0) {
    return null; // User disabled this category
  }

  const result = await query(
    `INSERT INTO notifications (user_id, title, description, category, priority, metadata, is_read)
     VALUES ($1, $2, $3, $4, $5, $6, false) RETURNING *`,
    [userId, title, description, category, priority, JSON.stringify(metadata)]
  );

  return result.rows[0];
}

// ============================================
// BULK OPERATIONS
// ============================================

export async function createBulkNotifications(
  userIds: string[],
  title: string,
  description: string,
  category: string,
  priority: string = 'normal'
) {
  const placeholders = userIds.map((_, i) => `($${i * 5 + 1}, $${i * 5 + 2}, $${i * 5 + 3}, $${i * 5 + 4}, $${i * 5 + 5}, false)`).join(',');
  const flatParams: any[] = [];
  userIds.forEach(userId => {
    flatParams.push(userId, title, description, category, priority);
  });

  const result = await query(
    `INSERT INTO notifications (user_id, title, description, category, priority, is_read)
     VALUES ${placeholders} RETURNING *`,
    flatParams
  );

  return result.rows;
}

export default {
  getNotificationPreferences,
  updateNotificationPreference,
  getWantedNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  getUnreadNotifications,
  getNotificationsByCategory,
  deleteNotification,
  createNotificationDigest,
  sendNotification,
  createBulkNotifications,
};

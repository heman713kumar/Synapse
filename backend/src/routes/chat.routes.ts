import express, { Request, Response, NextFunction, Router } from 'express';
import { authenticateToken } from '../middleware/auth.middleware.js';
import { query } from '../db/database.js';

const router: Router = express.Router();

// Get chat conversations for user
router.get('/conversations', authenticateToken, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId;

    const result = await query(
      `SELECT DISTINCT 
        CASE 
          WHEN sender_id = $1 THEN recipient_id 
          ELSE sender_id 
        END as other_user_id,
        u.username as other_username,
        u.display_name as other_display_name,
        u.avatar_url as other_avatar_url,
        (SELECT content FROM chat_messages 
         WHERE (sender_id = $1 AND recipient_id = other_user_id) 
            OR (sender_id = other_user_id AND recipient_id = $1) 
         ORDER BY created_at DESC LIMIT 1) as last_message,
        (SELECT created_at FROM chat_messages 
         WHERE (sender_id = $1 AND recipient_id = other_user_id) 
            OR (sender_id = other_user_id AND recipient_id = $1) 
         ORDER BY created_at DESC LIMIT 1) as last_message_time
       FROM chat_messages cm
       JOIN users u ON u.id = CASE 
          WHEN cm.sender_id = $1 THEN cm.recipient_id 
          ELSE cm.sender_id 
        END
       WHERE sender_id = $1 OR recipient_id = $1
       ORDER BY last_message_time DESC`,
      [userId]
    );

    const conversations = result.rows.map((conv: any) => ({
      userId: conv.other_user_id,
      username: conv.other_username,
      displayName: conv.other_display_name,
      avatarUrl: conv.other_avatar_url,
      lastMessage: conv.last_message,
      lastMessageTime: conv.last_message_time
    }));

    res.json(conversations);
  } catch (error) {
    console.error('Get conversations error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    res.status(500).json({ error: errorMessage });
  }
});

// Get messages between two users
router.get('/:otherUserId', authenticateToken, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId;
    const { otherUserId } = req.params;

    const result = await query(
      `SELECT id, sender_id, recipient_id, content, message_type, file_url, created_at 
       FROM chat_messages 
       WHERE (sender_id = $1 AND recipient_id = $2) OR (sender_id = $2 AND recipient_id = $1)
       ORDER BY created_at ASC`,
      [userId, otherUserId]
    );

    const messages = result.rows.map((msg: any) => ({
      id: msg.id,
      senderId: msg.sender_id,
      recipientId: msg.recipient_id,
      content: msg.content,
      messageType: msg.message_type,
      fileUrl: msg.file_url,
      createdAt: msg.created_at
    }));

    res.json(messages);
  } catch (error) {
    console.error('Get messages error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    res.status(500).json({ error: errorMessage });
  }
});

// Mark messages as read
router.post('/:otherUserId/read', authenticateToken, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId;
    const { otherUserId } = req.params;

    await query(
      `UPDATE chat_messages 
       SET read = true 
       WHERE sender_id = $1 AND recipient_id = $2 AND read = false`,
      [otherUserId, userId]
    );

    res.json({ message: 'Messages marked as read' });
  } catch (error) {
    console.error('Mark messages read error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    res.status(500).json({ error: errorMessage });
  }
});

export default router;
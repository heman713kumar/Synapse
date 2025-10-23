import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import { query } from '../db/database.js';

export const setupSocketIO = (server: any) => {
  const io = new Server(server, {
    cors: {
      origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:5173', 'http://127.0.0.1:5173'],
      methods: ['GET', 'POST'],
      credentials: true
    },
  });

  // Socket authentication middleware
  io.use(async (socket: any, next: any) => {
    try {
      const token = socket.handshake.auth.token;

      if (!token) {
        console.log('Socket connection attempt without token');
        return next(new Error('Authentication error'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET as string);

      // ✅ FIX: use type assertion for JWT payload
      const userId = (decoded as any).userId;

      // Verify user in database
      const userResult = await query(
        'SELECT id, email FROM users WHERE id = $1',
        [userId] // <--- UPDATED
      );

      if (userResult.rows.length === 0) {
        return next(new Error('User not found'));
      }

      socket.userId = userId; // <--- UPDATED
      socket.userEmail = userResult.rows[0].email;
      next();
    } catch (error) {
      console.log('Socket authentication failed:', error);
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', (socket: any) => {
    console.log(`User ${socket.userId} connected`);

    // Join rooms
    if (socket.userId) {
      socket.join(socket.userId);
      socket.join('global');
    }

    // Messaging
    socket.on('send_message', async (data: any) => {
      try {
        console.log('Message received:', data);
        const result = await query(
          `INSERT INTO chat_messages (sender_id, recipient_id, content, message_type) 
           VALUES ($1, $2, $3, $4) 
           RETURNING *`,
          [socket.userId, data.recipientId, data.content, data.messageType || 'text']
        );

        const savedMessage = result.rows[0];

        // Recipient
        socket.to(data.recipientId).emit('new_message', {
          id: savedMessage.id,
          senderId: socket.userId,
          recipientId: data.recipientId,
          content: data.content,
          messageType: data.messageType || 'text',
          createdAt: savedMessage.created_at
        });

        // Sender confirmation
        socket.emit('message_delivered', {
          tempId: data.tempId,
          messageId: savedMessage.id
        });
      } catch (error) {
        console.error('Message send error:', error);
        socket.emit('message_error', {
          tempId: data.tempId,
          error: 'Failed to send message'
        });
      }
    });

    // Typing indicator
    socket.on('typing_start', (data: any) => {
      socket.to(data.recipientId).emit('user_typing', { userId: socket.userId });
    });
    socket.on('typing_stop', (data: any) => {
      socket.to(data.recipientId).emit('user_stopped_typing', { userId: socket.userId });
    });

    // Collaboration
    socket.on('collaboration_update', (data: any) => {
      socket.to(data.userId).emit('collaboration_updated', data);
    });

    socket.on('disconnect', () => {
      console.log(`User ${socket.userId} disconnected`);
    });
  });

  return io;
};
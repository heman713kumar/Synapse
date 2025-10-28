import { Server, Socket } from 'socket.io';
import jwt, { Secret } from 'jsonwebtoken';
import { query } from '../db/database.js';

// --- DEFINITIONS FOR TYPE SAFETY AND SECURITY ---

// Structure for the decoded JWT payload
interface UserPayload {
  userId: string;
  email: string;
  iat?: number;
  exp?: number;
}

// Custom socket interface to hold authenticated user data
interface AuthSocket extends Socket {
  userId: string;
  userEmail: string;
}

// Interface for incoming message data
interface MessageData {
  recipientId: string;
  content: string;
  messageType?: string;
  tempId?: string; // Used for client-side confirmation
}

// --- CRITICAL: Fail-Fast Check for JWT Secret ---
const JWT_SECRET: Secret = process.env.JWT_SECRET || '';
if (!JWT_SECRET) {
    console.error("FATAL ERROR: JWT_SECRET environment variable is missing for Socket.IO.");
    // In a real application, we might exit the process here, but we'll let it fail gracefully 
    // by throwing within the middleware below.
}

// --- HELPER CLASS FOR SECURITY AND RELIABILITY ---
class SocketServiceHelpers {
    // Stores message counts for basic rate limiting
    private messageCounts = new Map<string, number>();
    private lastReset = Date.now();
    private readonly RATE_LIMIT_SECONDS = 60;
    private readonly MESSAGE_LIMIT_PER_USER = 60; // 60 messages per minute

    // FIX 2: Implement Rate Limiting Logic
    public canSendMessage(userId: string): boolean {
        const now = Date.now();
        // Reset counter every minute
        if (now - this.lastReset > this.RATE_LIMIT_SECONDS * 1000) {
            this.messageCounts.clear();
            this.lastReset = now;
        }
        
        const count = this.messageCounts.get(userId) || 0;
        if (count >= this.MESSAGE_LIMIT_PER_USER) { 
            return false;
        }
        
        this.messageCounts.set(userId, count + 1);
        return true;
    }

    // FIX 3 & 4: Input Sanitization (XSS Protection)
    public sanitizeMessage(content: string): string {
        const MAX_MESSAGE_SIZE = 10000; // 10KB limit

        // Basic XSS protection: escape HTML characters
        let sanitized = content
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .trim();

        // Enforce size limit
        return sanitized.substring(0, MAX_MESSAGE_SIZE); 
    }
}

const helpers = new SocketServiceHelpers();
// --- END HELPER CLASS ---


export const setupSocketIO = (server: any) => {
  const io = new Server(server, {
    cors: {
      origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:5173', 'http://127.0.0.1:5173'],
      methods: ['GET', 'POST'],
      credentials: true
    },
  });

  // Socket authentication middleware
  io.use(async (socket: AuthSocket, next) => {
    try {
      const token = socket.handshake.auth.token;

      if (!token || !JWT_SECRET) {
        console.log('Socket connection attempt failed: Missing token or secret');
        return next(new Error('Authentication error: Server configuration or token missing'));
      }

      // FIX 1 & 2: Use validated secret and proper typing
      const decoded = jwt.verify(token, JWT_SECRET) as UserPayload;
      const userId = decoded.userId;

      // Verify user in database
      const userResult = await query(
        'SELECT id, email FROM users WHERE id = $1',
        [userId]
      );

      if (userResult.rows.length === 0) {
        return next(new Error('Authentication error: User not found'));
      }

      // FIX 2: Attach authenticated user details to the socket object
      socket.userId = userId; 
      socket.userEmail = userResult.rows[0].email;
      next();
    } catch (error) {
      console.log('Socket authentication failed:', error);
      // FIX 2: Check for specific JWT errors for clearer logging
      if (error instanceof jwt.TokenExpiredError) {
          return next(new Error('Authentication error: Token expired'));
      } else if (error instanceof jwt.JsonWebTokenError) {
          return next(new Error('Authentication error: Invalid token'));
      }
      next(new Error('Authentication error: Connection failed'));
    }
  });

  io.on('connection', (socket: AuthSocket) => {
    console.log(`User ${socket.userId} connected`);

    // Join rooms
    if (socket.userId) {
      socket.join(socket.userId);
      socket.join('global');
    }

    // Messaging
    socket.on('send_message', async (data: MessageData) => {
      // FIX 3 & 4: Input Validation, Sanitization, and Rate Limiting
      
      // Check message requirements
      if (!data.recipientId || !data.content?.trim()) {
        socket.emit('message_error', {
          tempId: data.tempId,
          error: 'Recipient ID and content are required'
        });
        return;
      }
      
      // Check Rate Limit
      if (!helpers.canSendMessage(socket.userId)) {
          socket.emit('message_error', {
            tempId: data.tempId,
            error: 'Rate limit exceeded. Try again in a minute.'
          });
          return;
      }

      const sanitizedContent = helpers.sanitizeMessage(data.content);

      try {
        // NOTE: Ideally, use transaction for INSERT + UPDATE
        const result = await query(
          `INSERT INTO chat_messages (sender_id, recipient_id, content, message_type) 
           VALUES ($1, $2, $3, $4) 
           RETURNING *`,
          [socket.userId, data.recipientId, sanitizedContent, data.messageType || 'text']
        );

        const savedMessage = result.rows[0];

        // Recipient
        socket.to(data.recipientId).emit('new_message', {
          id: savedMessage.id,
          senderId: socket.userId,
          recipientId: data.recipientId,
          content: savedMessage.content, // Use saved content to reflect DB sanitization
          messageType: savedMessage.message_type,
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
          error: 'Failed to send message due to server error'
        });
      }
    });

    // Typing indicator
    socket.on('typing_start', (data: { recipientId: string }) => {
      // FIX 1: Ensure safe access to data property
      if (data.recipientId) {
          socket.to(data.recipientId).emit('user_typing', { userId: socket.userId });
      }
    });
    socket.on('typing_stop', (data: { recipientId: string }) => {
      // FIX 1: Ensure safe access to data property
      if (data.recipientId) {
          socket.to(data.recipientId).emit('user_stopped_typing', { userId: socket.userId });
      }
    });

    // Collaboration
    socket.on('collaboration_update', (data: { userId: string }) => {
      // Assuming data.userId is the target room/user ID
      if (data.userId) {
          socket.to(data.userId).emit('collaboration_updated', data);
      }
    });

    // FIX 3: Add Connection Health Monitoring
    socket.on('ping', (cb: () => void) => {
        if (typeof cb === 'function') {
            cb();
        }
    });

    socket.on('disconnect', () => {
      console.log(`User ${socket.userId} disconnected`);
    });
  });

  return io;
};
import { Server, Socket } from 'socket.io';
import jwt, { Secret } from 'jsonwebtoken';
import { query } from '../db/database.js';

// --- ADD MISSING INTERFACES (Fixes missing type declarations) ---

// Structure for the decoded JWT payload
interface UserPayload {
  userId: string;
  email: string;
  iat?: number;
  exp?: number;
}

// Interface for incoming message data
interface MessageData {
  recipientId: string;
  content: string;
  messageType?: string;
  tempId?: string; // Used for client-side confirmation
}

// Custom socket interface to hold authenticated user data
interface AuthSocket extends Socket {
  userId: string;
  userEmail: string;
}
// --- END MISSING INTERFACES ---

// CRITICAL: Fail-Fast Check for JWT Secret
const JWT_SECRET: Secret = process.env.JWT_SECRET || '';
if (!JWT_SECRET) {
    console.error("FATAL ERROR: JWT_SECRET environment variable is missing for Socket.IO.");
    // Allowing to fail in middleware for cleaner logging path
}

// Helper class for security and reliability (using placeholder logic)
class SocketServiceHelpers {
    private messageCounts = new Map<string, number>();
    private lastReset = Date.now();
    private readonly RATE_LIMIT_SECONDS = 60;
    private readonly MESSAGE_LIMIT_PER_USER = 60;

    public canSendMessage(userId: string): boolean {
        const now = Date.now();
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

    public sanitizeMessage(content: string): string {
        const MAX_MESSAGE_SIZE = 10000;
        let sanitized = content
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .trim();
        return sanitized.substring(0, MAX_MESSAGE_SIZE); 
    }
}

const helpers = new SocketServiceHelpers();

// FIX: Define the Server with the custom AuthSocket type for the Socket type parameter
export const setupSocketIO = (server: any) => {
  // Use generic `any` for event maps and AuthSocket for the instance data
  const io = new Server<any, any, any, AuthSocket>(server, {
    cors: {
      origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:5173', 'http://127.0.0.1:5173'],
      methods: ['GET', 'POST'],
      credentials: true
    },
  });

  // Socket authentication middleware
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;

      if (!token || !JWT_SECRET) {
        console.log('Socket connection attempt failed: Missing token or secret');
        return next(new Error('Authentication error: Server configuration or token missing'));
      }

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

      // Assign properties to the socket object (allowed by AuthSocket type)
      (socket as AuthSocket).userId = userId;
      (socket as AuthSocket).userEmail = userResult.rows[0].email;
      next();
    } catch (error) {
      console.log('Socket authentication failed:', error);
      if (error instanceof Error) {
          next(new Error(`Authentication error: ${error.message}`));
      } else {
          next(new Error('Authentication error: Connection failed'));
      }
    }
  });

  // FIX: The event handler now uses type inference from the Server definition
  io.on('connection', (socket) => {
    // Cast to AuthSocket locally for cleaner code within the handler
    const authSocket = socket as AuthSocket; 
    
    console.log(`User ${authSocket.userId} connected`);

    // Join rooms
    if (authSocket.userId) {
      authSocket.join(authSocket.userId);
      authSocket.join('global');
    }

    // Messaging
    socket.on('send_message', async (data: MessageData) => {
      if (!data.recipientId || !data.content?.trim()) {
        authSocket.emit('message_error', {
          tempId: data.tempId,
          error: 'Recipient ID and content are required'
        });
        return;
      }
      
      if (!helpers.canSendMessage(authSocket.userId)) {
          authSocket.emit('message_error', {
            tempId: data.tempId,
            error: 'Rate limit exceeded. Try again in a minute.'
          });
          return;
      }

      const sanitizedContent = helpers.sanitizeMessage(data.content);

      try {
        const result = await query(
          `INSERT INTO chat_messages (sender_id, recipient_id, content, message_type) 
           VALUES ($1, $2, $3, $4) 
           RETURNING *`,
          [authSocket.userId, data.recipientId, sanitizedContent, data.messageType || 'text']
        );

        const savedMessage = result.rows[0];

        // Recipient
        authSocket.to(data.recipientId).emit('new_message', {
          id: savedMessage.id,
          senderId: authSocket.userId,
          recipientId: data.recipientId,
          content: savedMessage.content,
          messageType: savedMessage.message_type,
          createdAt: savedMessage.created_at
        });

        // Sender confirmation
        authSocket.emit('message_delivered', {
          tempId: data.tempId,
          messageId: savedMessage.id
        });
      } catch (error) {
        console.error('Message send error:', error);
        authSocket.emit('message_error', {
          tempId: data.tempId,
          error: 'Failed to send message due to server error'
        });
      }
    });

    // Typing indicator
    socket.on('typing_start', (data: { recipientId: string }) => {
      if (data.recipientId) {
          authSocket.to(data.recipientId).emit('user_typing', { userId: authSocket.userId });
      }
    });
    socket.on('typing_stop', (data: { recipientId: string }) => {
      if (data.recipientId) {
          authSocket.to(data.recipientId).emit('user_stopped_typing', { userId: authSocket.userId });
      }
    });

    // Collaboration
    socket.on('collaboration_update', (data: { userId: string }) => {
      if (data.userId) {
          authSocket.to(data.userId).emit('collaboration_updated', data);
      }
    });

    socket.on('ping', (cb: () => void) => {
        if (typeof cb === 'function') {
            cb();
        }
    });

    socket.on('disconnect', () => {
      console.log(`User ${authSocket.userId} disconnected`);
    });
  });

  return io;
};
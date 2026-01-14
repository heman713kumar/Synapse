import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import http from 'http';

// Import database and socket
import { testConnection } from './db/database.js';
import { setupSocketIO } from './sockets/socket.js';

// Import routes
import authRoutes from './routes/auth.routes.js';
import usersRoutes from './routes/users.routes.js';
import ideasRoutes from './routes/ideas.routes.js';
import chatRoutes from './routes/chat.routes.js';
import uploadRoutes from './routes/upload.routes.js';
import aiRoutes from './routes/ai.routes.js';
import feedRoutes from './routes/feed.routes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// CORS Configuration - FIXED
const allowedOrigins = process.env.CORS_ORIGIN 
  ? process.env.CORS_ORIGIN.split(',') 
  : ['http://localhost:5173', 'http://127.0.0.1:5173'];

console.log('🔧 CORS Allowed Origins:', allowedOrigins);

// Middleware
app.use(helmet());
app.use(cors({
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);
        
        if (allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            console.log('🚫 CORS Blocked Origin:', origin);
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Ensure uploads directory exists
const uploadsPath = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsPath)) {
    console.log(`Creating uploads directory: ${uploadsPath}`);
    fs.mkdirSync(uploadsPath, { recursive: true });
}

// Serve static uploaded files
console.log(`Serving static files from: ${uploadsPath}`);
app.use('/uploads', express.static(uploadsPath));

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
    res.status(200).json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV,
        version: '1.0.0'
    });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/ideas', ideasRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/feed', feedRoutes);

// Basic API info
app.get('/api', (req: Request, res: Response) => {
    res.json({
        message: 'Synapse API is running!',
        version: '1.0.0',
        endpoints: {
          auth: '/api/auth',
          users: '/api/users',
          ideas: '/api/ideas',
          chat: '/api/chat',
          upload: '/api/upload',
          ai: '/api/ai',
          feed: '/api/feed'
        }
    });
});

// 404 catch-all
app.use('*', (req: Request, res: Response) => {
    res.status(404).json({ error: 'Route not found' });
});

// Global error handler
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Global Error Handler:', err.stack);
  res.status(500).json({
    error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// Start server
const startServer = async () => {
  try {
    const dbConnected = await testConnection();
    if (!dbConnected) {
      console.log('⚠️ Database connection failed, but starting server anyway for development');
    }

    const server = http.createServer(app);
    server.listen(PORT, () => {
      console.log(`🚀 Synapse backend running on port ${PORT}`);
      console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🔗 CORS Origin: ${process.env.CORS_ORIGIN || 'http://localhost:5173'}`);
      console.log(`📍 http://localhost:${PORT}`);
    });

    setupSocketIO(server);
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
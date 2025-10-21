// C:\Users\hemant\Downloads\synapse\backend\src\index.ts
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import path from 'path';
// No 'url' import needed if using commonjs __dirname
// import { fileURLToPath } from 'url';
import fs from 'fs';
import http from 'http';

// Import database and socket
import { testConnection } from './db/database.js'; // Keep .js if needed, depends on final module setup
import { setupSocketIO } from './sockets/socket.js'; // Keep .js if needed

// Import routes using default imports
import authRoutes from './routes/auth.routes.js'; // Keep .js if needed
import usersRoutes from './routes/users.routes.js'; // Keep .js if needed
import ideasRoutes from './routes/ideas.routes.js'; // Keep .js if needed
import chatRoutes from './routes/chat.routes.js'; // Keep .js if needed
import uploadRoutes from './routes/upload.routes.js'; // Keep .js if needed
import aiRoutes from './routes/ai.routes.js'; // Keep .js if needed

// __dirname fix for ES modules - NOT NEEDED for commonjs
// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet());
app.use(cors({
    origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:5173', 'http://127.0.0.1:5173'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Ensure uploads directory exists - uses standard __dirname available in commonjs
const uploadsPath = path.join(__dirname, '../uploads');
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
        version: '1.0.0' // Consider reading from package.json
    });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/ideas', ideasRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/ai', aiRoutes);

// Basic API info
app.get('/api', (req: Request, res: Response) => {
    res.json({
        message: 'Synapse API is running!',
        version: '1.0.0', // Consider reading from package.json
        endpoints: {
          auth: '/api/auth',
          users: '/api/users',
          ideas: '/api/ideas',
          chat: '/api/chat',
          upload: '/api/upload',
          ai: '/api/ai'
        }
    });
});

// 404 catch-all - Should be after all other routes
app.use('*', (req: Request, res: Response) => {
    res.status(404).json({ error: 'Route not found' });
});

// Global error handler - MUST have 4 parameters
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Global Error Handler:', err.stack); // Log stack trace
  res.status(500).json({
    error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }) // Optionally include stack in dev
  });
});


// Start server
const startServer = async () => {
  try {
    // Test database connection
    const dbConnected = await testConnection();
    if (!dbConnected) {
      console.log('⚠️ Database connection failed, but starting server anyway for development');
    }

    // Create HTTP server for Socket.IO
    const server = http.createServer(app);

    server.listen(PORT, () => {
      console.log(`🚀 Synapse backend running on port ${PORT}`);
      console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🔗 CORS Origin: ${process.env.CORS_ORIGIN || 'http://localhost:5173'}`);
      console.log(`📍 http://localhost:${PORT}`);
      console.log(`🔐 Authentication: /api/auth`);
      console.log(`🤖 AI Services: /api/ai`);
      console.log(`💬 Real-time Chat: WebSocket enabled`);
    });

    // Setup Socket.io
    setupSocketIO(server);

  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
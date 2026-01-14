import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import http from 'http';

import { testConnection } from './db/database.js';
import { setupSocketIO } from './sockets/socket.js';

import authRoutes from './routes/auth.routes.js';
import usersRoutes from './routes/users.routes.js';
import ideasRoutes from './routes/ideas.routes.js';
import chatRoutes from './routes/chat.routes.js';
import uploadRoutes from './routes/upload.routes.js';
import aiRoutes from './routes/ai.routes.js';
import feedRoutes from './routes/feed.routes.js';

// __dirname fix for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

/* =======================
   ✅ CORS FIX (IMPORTANT)
   ======================= */

const allowedOrigins = [
  'http://localhost:5173',
  'https://synapse-frontend.onrender.com', // change if frontend URL differs
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true); // allow Postman / server calls
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('CORS not allowed'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// ✅ MUST allow preflight
app.options('*', cors());

/* =======================
   Middleware
   ======================= */

app.use(helmet());
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

/* =======================
   Uploads
   ======================= */

const uploadsPath = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsPath)) {
  fs.mkdirSync(uploadsPath, { recursive: true });
}
app.use('/uploads', express.static(uploadsPath));

/* =======================
   Health Check
   ======================= */

app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
  });
});

/* =======================
   Routes
   ======================= */

app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/ideas', ideasRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/feed', feedRoutes);

app.get('/api', (req, res) => {
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
      feed: '/api/feed',
    },
  });
});

/* =======================
   404 Handler
   ======================= */

app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

/* =======================
   Global Error Handler
   ======================= */

app.use((err, req, res, next) => {
  console.error('Global Error Handler:', err.message);
  res.status(500).json({
    error: process.env.NODE_ENV === 'development'
      ? err.message
      : 'Internal server error',
  });
});

/* =======================
   Start Server
   ======================= */

const startServer = async () => {
  try {
    await testConnection();

    const server = http.createServer(app);

    server.listen(PORT, () => {
      console.log(`🚀 Synapse backend running on port ${PORT}`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
    });

    setupSocketIO(server);

  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { config } from './config/env.js';
import { connectDatabase } from './config/database.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { setupSocket } from './services/socket.js';

// Route imports
import authRoutes from './routes/auth.js';
import projectRoutes from './routes/projects.js';
import issueRoutes from './routes/issues.js';
import sprintRoutes from './routes/sprints.js';
import userRoutes from './routes/users.js';

const app = express();
const httpServer = createServer(app);

// Socket.io setup
export const io = new Server(httpServer, {
  cors: {
    origin: config.socket.corsOrigin,
    credentials: true,
  },
});

// Setup socket handlers
setupSocket(io);

// Middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));

app.use(cors(config.cors));

app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

if (config.isDevelopment) {
  app.use(morgan('dev'));
}

// Rate limiting
const skipRateLimit = () => config.nodeEnv !== 'production';

const limiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.maxRequests,
  message: { success: false, error: { code: 'RATE_LIMITED', message: 'Too many requests, please try again later' } },
  standardHeaders: true,
  legacyHeaders: false,
  skip: skipRateLimit,
});

app.use('/api/', limiter);

// Auth rate limiting
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { success: false, error: { code: 'TOO_MANY_ATTEMPTS', message: 'Too many login attempts, please try again later' } },
  skip: skipRateLimit,
});

app.use(`/api/${config.apiVersion}/auth/login`, authLimiter);
app.use(`/api/${config.apiVersion}/auth/register`, authLimiter);

// Health check
app.get('/health', (req, res) => {
  res.json({ success: true, data: { status: 'healthy', timestamp: new Date().toISOString(), version: '1.0.0' } });
});

// API Routes
app.use(`/api/${config.apiVersion}/auth`, authRoutes);
app.use(`/api/${config.apiVersion}/projects`, projectRoutes);
app.use(`/api/${config.apiVersion}/projects`, issueRoutes);
app.use(`/api/${config.apiVersion}/projects`, sprintRoutes);
app.use(`/api/${config.apiVersion}/users`, userRoutes);

// 404 handler
app.use(notFoundHandler);

// Error handler
app.use(errorHandler);

export { app, httpServer, connectDatabase };

// Start server if not in test mode
if (process.env.NODE_ENV !== 'test') {
  const startServer = async () => {
    try {
      await connectDatabase();

      httpServer.listen(config.port, () => {
        console.log(`
╔════════════════════════════════════════════════════════════╗
║              Project Management Platform          ║
╠════════════════════════════════════════════════════════════╣
║  Environment: ${config.nodeEnv.padEnd(43)} ║
║  Server running on port ${config.port.toString().padEnd(43)} ║
║  API Version: ${config.apiVersion.padEnd(43)} ║
║  Health Check: http://localhost:${config.port}/health${' '.repeat(29)}║
╚════════════════════════════════════════════════════════════╝
        `);
      });
    } catch (error) {
      console.error('Failed to start server:', error);
      process.exit(1);
    }
  };

  startServer().catch(err => {
    console.error('Failed to start server:', err);
    process.exit(1);
  });
}

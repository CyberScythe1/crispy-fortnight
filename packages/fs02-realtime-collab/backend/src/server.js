import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import { setupYjs } from './services/yjs.js';
import { config } from './config/env.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { connectDatabase } from './config/database.js';

// Route imports
import authRoutes from './routes/auth.js';
import workspaceRoutes from './routes/workspaces.js';
import documentRoutes from './routes/documents.js';
import pageRoutes from './routes/pages.js';

const app = express();
const httpServer = createServer(app);

const wss = new WebSocketServer({ server: httpServer, path: '/yjs' });
setupYjs(wss);

app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors(config.cors));
app.use(compression());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(cookieParser());

if (config.isDevelopment) {
  app.use(morgan('dev'));
}

const limiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.maxRequests,
  message: { success: false, error: { code: 'RATE_LIMITED', message: 'Too many requests, please try again later' } },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/', limiter);

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { success: false, error: { code: 'TOO_MANY_ATTEMPTS', message: 'Too many login attempts, please try again later' } },
});

app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);

app.get('/health', (req, res) => {
  res.json({ success: true, data: { status: 'healthy', timestamp: new Date().toISOString(), version: '1.0.0' } });
});

app.get('/api/health', (req, res) => {
  res.json({ success: true, data: { status: 'healthy', timestamp: new Date().toISOString(), version: '1.0.0' } });
});

// API Routes
app.use(`/api/${config.apiVersion}/auth`, authRoutes);
app.use(`/api/${config.apiVersion}/workspaces`, workspaceRoutes);
app.use(`/api/${config.apiVersion}`, documentRoutes);
app.use(`/api/${config.apiVersion}`, pageRoutes);

export { app, httpServer, connectDatabase };

if (process.env.NODE_ENV !== 'test') {
  const startServer = async () => {
    try {
      await connectDatabase();

      httpServer.listen(config.port, () => {
        console.log(`
╔════════════════════════════════════════════════════════════╗
║              Collaborative Workspace         ║
╠════════════════════════════════════════════════════════════╣
║  Environment: ${config.nodeEnv.padEnd(43)} ║
║  HTTP Server running on port ${config.port.toString().padEnd(43)} ║
║  WebSocket Server on port ${config.wsPort.toString().padEnd(43)} ║
║  API Version: ${config.apiVersion.padEnd(43)} ║
║  Health Check: http://localhost:${config.port}/health${' '.repeat(29)}║
╚════════════════════════════════════════════════════════════╝
        `);
      });

      const gracefulShutdown = async (signal) => {
        console.log(`\n${signal} received. Shutting down gracefully...`);
        httpServer.close(async () => {
          console.log('HTTP server closed.');
          const { disconnectDatabase } = await import('./config/database.js');
          await disconnectDatabase();
          console.log('Database connections closed.');
          process.exit(0);
        });

        setTimeout(() => {
          console.error('Forced shutdown after 10s');
          process.exit(1);
        }, 10000);
      };

      process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
      process.on('SIGINT', () => gracefulShutdown('SIGINT'));
      process.on('unhandledRejection', (reason) => console.error('Unhandled Rejection:', reason));
      process.on('uncaughtException', (error) => { console.error('Uncaught Exception:', error); gracefulShutdown('UNCAUGHT_EXCEPTION'); });
    } catch (error) {
      console.error('Failed to start server:', error);
      process.exit(1);
    }
  };

  startServer();
}

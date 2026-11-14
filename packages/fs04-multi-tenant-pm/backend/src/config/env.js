import dotenv from 'dotenv';
dotenv.config();

export const config = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '4001', 10),
  apiVersion: 'v1',

  database: {
    url: process.env.DATABASE_URL || 'postgresql://crispy:crispy_dev_password@localhost:5432/fs04_pm',
  },

  redis: {
    url: process.env.REDIS_URL || 'redis://:crispy_redis_password@localhost:6379',
  },

  jwt: {
    secret: process.env.JWT_SECRET || 'fs04_dev_jwt_secret_change_in_production_min_32_chars',
    expiresIn: '15m',
    refreshExpiresIn: '7d',
  },

  bcrypt: {
    saltRounds: 12,
  },

  rateLimit: {
    windowMs: 15 * 60 * 1000,
    maxRequests: 100,
  },

  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:3001',
    credentials: true,
  },

  stripe: {
    secretKey: process.env.STRIPE_SECRET_KEY,
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
    publishableKey: process.env.STRIPE_PUBLISHABLE_KEY,
  },

  socket: {
    corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:3001',
  },

  logLevel: process.env.LOG_LEVEL || 'info',
};

export const isProduction = config.nodeEnv === 'production';
export const isDevelopment = config.nodeEnv === 'development';
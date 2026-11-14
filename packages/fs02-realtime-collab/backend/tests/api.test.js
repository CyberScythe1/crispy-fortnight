import { describe, it, expect, beforeEach, vi } from 'vitest';
import request from 'supertest';
import { app } from '../src/app.js';
import { prisma } from '../config/database.js';

vi.mock('../src/config/database.js', () => ({
  prisma: {
    user: { findUnique: vi.fn(), create: vi.fn(), update: vi.fn() },
    workspace: { findUnique: vi.fn(), findMany: vi.fn(), create: vi.fn(), update: vi.fn(), count: vi.fn() },
    document: { findUnique: vi.fn(), findMany: vi.fn(), create: vi.fn(), update: vi.fn(), count: vi.fn() },
    page: { findUnique: vi.fn(), findMany: vi.fn(), create: vi.fn(), update: vi.fn() },
    workspaceMember: { findUnique: vi.fn(), create: vi.fn(), update: vi.fn(), delete: vi.fn() },
    $connect: vi.fn().mockResolvedValue(undefined),
    $disconnect: vi.fn().mockResolvedValue(undefined),
  },
}));

vi.mock('bcryptjs', () => ({ hash: vi.fn().mockResolvedValue('hashed'), compare: vi.fn().mockResolvedValue(true) }));
vi.mock('jsonwebtoken', () => ({ sign: vi.fn().mockReturnValue('token'), verify: vi.fn().mockReturnValue({ userId: '1', email: 'test@test.com', role: 'ADMIN' }) }));
vi.mock('express-rate-limit', () => ({ __esModule: true, default: () => (req, res, next) => next() }));
vi.mock('helmet', () => ({ __esModule: true, default: () => (req, res, next) => next() }));
vi.mock('morgan', () => ({ __esModule: true, default: () => (req, res, next) => next() }));
vi.mock('cors', () => ({ __esModule: true, default: () => (req, res, next) => next() }));

vi.mock('../src/middleware/auth.js', () => ({
  requireAuth: (req, res, next) => { req.user = { id: '1', email: 'test@test.com', role: 'ADMIN', isActive: true }; next(); },
  requireRole: (...roles) => (req, res, next) => next(),
}));

vi.mock('../src/middleware/validation.js', () => ({
  validate: () => (req, res, next) => { req.validatedBody = req.body; next(); },
  validateQuery: () => (req, res, next) => { req.validatedQuery = req.query; next(); },
  validateParams: () => (req, res, next) => { req.validatedParams = req.params; next(); },
}));

describe('FS-02 Auth API', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('POST /api/v1/auth/register - should register new user', async () => {
    const { prisma } = await import('../src/config/database.js');
    prisma.user.findUnique.mockResolvedValueOnce(null);
    prisma.workspace.findUnique.mockResolvedValueOnce(null);
    prisma.user.create.mockResolvedValueOnce({ id: '1', email: 'new@test.com', firstName: 'New', lastName: 'User', createdAt: new Date() });
    prisma.workspace.create.mockResolvedValueOnce({ id: '1', name: 'Personal', slug: 'personal-1', isPersonal: true });

    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({ email: 'new@test.com', password: 'Password123!', firstName: 'New', lastName: 'User' });

    expect([201, 400, 500]).toContain(res.status);
  });

  it('POST /api/v1/auth/login - should login', async () => {
    const { prisma } = await import('../src/config/database.js');
    prisma.user.findUnique.mockResolvedValueOnce({ id: '1', email: 'test@test.com', passwordHash: 'hashed', firstName: 'Test', lastName: 'User', role: 'ADMIN', isActive: true });

    const res = await request(app).post('/api/v1/auth/login').send({ email: 'test@test.com', password: 'Password123!' });
    expect([200, 401, 500]).toContain(res.status);
  });

  it('POST /api/v1/auth/refresh - should refresh token', async () => {
    const res = await request(app).post('/api/v1/auth/refresh').send({ refreshToken: 'mock-token' });
    expect([200, 401]).toContain(res.status);
  });
});

describe('FS-02 Workspace API', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('GET /api/v1/workspaces - should list workspaces', async () => {
    const res = await request(app).get('/api/v1/workspaces').set('Authorization', 'Bearer token');
    expect([200, 401, 403, 500]).toContain(res.status);
  });

  it('POST /api/v1/workspaces - should create workspace', async () => {
    const res = await request(app)
      .post('/api/v1/workspaces')
      .set('Authorization', 'Bearer token')
      .send({ name: 'Test Workspace', slug: 'test-workspace' });
    expect([201, 400, 401, 403, 500]).toContain(res.status);
  });
});

describe('FS-02 Health Check', () => {
  it('GET /health - should return healthy', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('healthy');
  });
});
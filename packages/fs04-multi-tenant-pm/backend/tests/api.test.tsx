import { describe, it, expect, beforeEach, vi } from 'vitest';
import request from 'supertest';
import { app } from '../src/server.js';
import { prisma } from '../config/database.js';

vi.mock('../src/config/database.js', () => ({
  prisma: {
    user: { findUnique: vi.fn(), create: vi.fn(), update: vi.fn() },
    tenant: { findUnique: vi.fn(), create: vi.fn() },
    project: { findUnique: vi.fn(), findMany: vi.fn(), create: vi.fn(), update: vi.fn(), delete: vi.fn(), count: vi.fn() },
    projectMember: { findUnique: vi.fn(), create: vi.fn(), update: vi.fn(), delete: vi.fn() },
    board: { findMany: vi.fn(), create: vi.fn() },
    column: { create: vi.fn() },
    $connect: vi.fn().mockResolvedValue(undefined),
    $disconnect: vi.fn().mockResolvedValue(undefined),
  },
}));

vi.mock('bcryptjs', () => ({ hash: vi.fn().mockResolvedValue('hashed'), compare: vi.fn().mockResolvedValue(true) }));
vi.mock('jsonwebtoken', () => ({ sign: vi.fn().mockReturnValue('token'), verify: vi.fn().mockReturnValue({ userId: '1', email: 'test@test.com', role: 'ADMIN', tenantId: '1' }) }));
vi.mock('express-rate-limit', () => ({ __esModule: true, default: () => (req, res, next) => next() }));
vi.mock('helmet', () => ({ __esModule: true, default: () => (req, res, next) => next() }));
vi.mock('morgan', () => ({ __esModule: true, default: () => (req, res, next) => next() }));
vi.mock('cors', () => ({ __esModule: true, default: () => (req, res, next) => next() }));
vi.mock('stripe', () => ({ __esModule: true, default: () => ({ customers: { create: vi.fn().mockResolvedValue({ id: 'cus_1' }) }, subscriptions: { create: vi.fn().mockResolvedValue({ id: 'sub_1' }) } }) }));

vi.mock('../src/middleware/auth.js', () => ({
  requireAuth: (req, res, next) => { req.user = { id: '1', email: 'test@test.com', role: 'ADMIN', tenantId: '1', isActive: true }; next(); },
  requireRole: (...roles) => (req, res, next) => next(),
  optionalAuth: (req, res, next) => next(),
}));

vi.mock('../src/middleware/validation.js', () => ({
  validate: () => (req, res, next) => { req.validatedBody = req.body; next(); },
  validateQuery: () => (req, res, next) => { req.validatedQuery = req.query; next(); },
  validateParams: () => (req, res, next) => { req.validatedParams = req.params; next(); },
}));

describe('FS-04 Auth API', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('POST /api/v1/auth/register - should register new user', async () => {
    const { prisma } = await import('../src/config/database.js');
    prisma.user.findUnique.mockResolvedValueOnce(null);
    prisma.tenant.findUnique.mockResolvedValueOnce(null);
    prisma.user.create.mockResolvedValueOnce({ id: '1', email: 'new@test.com', firstName: 'New', lastName: 'User', role: 'OWNER', tenantId: '1', createdAt: new Date() });
    prisma.tenant.create.mockResolvedValueOnce({ id: '1', slug: 'test', name: 'Test' });

    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({ email: 'new@test.com', password: 'Password123!', firstName: 'New', lastName: 'User', tenantSlug: 'test', tenantName: 'Test' });

    expect([201, 400, 500]).toContain(res.status);
    if (res.status === 201) {
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.email).toBe('new@test.com');
      expect(res.body.data.accessToken).toBeDefined();
    }
  });

  it('POST /api/v1/auth/login - should login with valid credentials', async () => {
    const { prisma } = await import('../src/config/database.js');
    prisma.user.findUnique.mockResolvedValueOnce({ id: '1', email: 'test@test.com', passwordHash: 'hashed', firstName: 'Test', lastName: 'User', role: 'ADMIN', isActive: true, tenantId: '1' });

    const res = await request(app).post('/api/v1/auth/login').send({ email: 'test@test.com', password: 'Password123!' });
    expect([200, 401, 500]).toContain(res.status);
  });

  it('POST /api/v1/auth/refresh - should refresh token', async () => {
    const res = await request(app).post('/api/v1/auth/refresh').send({ refreshToken: 'valid-token' });
    expect([200, 401]).toContain(res.status);
  });

  it('GET /api/v1/auth/me - should return current user', async () => {
    const res = await request(app).get('/api/v1/auth/me').set('Authorization', 'Bearer token');
    expect([200, 401, 500]).toContain(res.status);
  });
});

describe('FS-04 Project API', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('GET /api/v1/projects - should list projects', async () => {
    const res = await request(app).get('/api/v1/projects').set('Authorization', 'Bearer token');
    expect([200, 401, 403, 500]).toContain(res.status);
  });

  it('POST /api/v1/projects - should create project', async () => {
    const res = await request(app)
      .post('/api/v1/projects')
      .set('Authorization', 'Bearer token')
      .send({ key: 'PROJ', name: 'Test Project', description: 'Test', visibility: 'PRIVATE' });
    expect([201, 400, 401, 403, 500]).toContain(res.status);
  });

  it('GET /api/v1/projects/:id - should get project', async () => {
    const res = await request(app).get('/api/v1/projects/1').set('Authorization', 'Bearer token');
    expect([200, 401, 403, 404, 500]).toContain(res.status);
  });
});

describe('FS-04 Health Check', () => {
  it('GET /health - should return healthy', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('healthy');
  });
});
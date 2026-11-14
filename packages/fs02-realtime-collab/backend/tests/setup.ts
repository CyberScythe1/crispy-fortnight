import { vi } from 'vitest';

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

vi.mock('../src/middleware/errorHandler.js', () => ({
  errorHandler: (err, req, res, next) => { res.status(err.statusCode || 500).json({ success: false, error: { code: err.code || 'INTERNAL_ERROR', message: err.message } }); },
  notFoundHandler: (req, res) => { res.status(404).json({ success: false, error: { code: 'ROUTE_NOT_FOUND', message: `Route ${req.method} ${req.url} not found` } }); },
  AppError: class AppError extends Error { constructor(message, statusCode = 500, code = 'INTERNAL_ERROR') { super(message); this.statusCode = statusCode; this.code = code; } },
  ValidationError: class ValidationError extends Error { constructor() { super('Validation failed'); this.statusCode = 400; this.code = 'VALIDATION_FAILED'; } },
  NotFoundError: class NotFoundError extends Error { constructor() { super('Not found'); this.statusCode = 404; this.code = 'NOT_FOUND'; } },
  UnauthorizedError: class UnauthorizedError extends Error { constructor() { super('Unauthorized'); this.statusCode = 401; this.code = 'UNAUTHORIZED'; } },
  ForbiddenError: class ForbiddenError extends Error { constructor() { super('Forbidden'); this.statusCode = 403; this.code = 'FORBIDDEN'; } },
  ConflictError: class ConflictError extends Error { constructor() { super('Conflict'); this.statusCode = 409; this.code = 'CONFLICT'; } },
}));

beforeEach(() => { vi.clearAllMocks(); });
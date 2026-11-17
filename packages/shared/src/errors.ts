import { ZodError } from 'zod';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';

export interface ErrorConfig {
  isProduction?: boolean;
  isDevelopment?: boolean;
}

export interface RequestLike {
  url: string;
  method: string;
  ip?: string;
}

export interface ResponseLike {
  status(code: number): ResponseLike;
  json(body: unknown): ResponseLike;
}

export interface NextFunction {
  (): void;
}

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly details: unknown;
  public readonly isOperational: boolean;

  constructor(message: string, statusCode = 500, code = 'INTERNAL_ERROR', details: unknown = null) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.isOperational = true;
    (Error as { captureStackTrace?: (target: object, constructorOpt?: Function) => void }).captureStackTrace?.(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(details: unknown) {
    super('Validation failed', 400, 'VALIDATION_FAILED', details);
  }
}

export class NotFoundError extends AppError {
  constructor(resource = 'Resource') {
    super(`${resource} not found`, 404, 'NOT_FOUND');
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized') {
    super(message, 401, 'UNAUTHORIZED');
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Forbidden') {
    super(message, 403, 'FORBIDDEN');
  }
}

export class ConflictError extends AppError {
  constructor(message = 'Resource conflict') {
    super(message, 409, 'CONFLICT');
  }
}

export const errorHandler = (config?: ErrorConfig) => (
  err: Error,
  req: RequestLike,
  res: ResponseLike,
  next: NextFunction
) => {
  console.error(`[${new Date().toISOString()}] Error:`, {
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
  });

  if (err instanceof ZodError) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_FAILED',
        message: 'Validation failed',
        details: err.errors.map((e) => ({
          field: e.path.join('.'),
          message: e.message,
        })),
      },
    });
  }

  if (err instanceof PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      const field = (err.meta?.target as string[])?.[0] || 'field';
      return res.status(409).json({
        success: false,
        error: { code: 'DUPLICATE_ENTRY', message: `${field} already exists` },
      });
    }
    if (err.code === 'P2025') {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Record not found' } });
    }
  }

  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      error: { code: err.code, message: err.message, details: err.details },
    });
  }

  const statusCode = (err as AppError).statusCode || 500;
  const message = config?.isProduction ? 'Internal server error' : err.message;

  return res.status(statusCode).json({
    success: false,
    error: { code: 'INTERNAL_ERROR', message, ...(config?.isDevelopment && { stack: err.stack }) },
  });
};

export const notFoundHandler = (req: RequestLike, res: ResponseLike) => {
  res.status(404).json({ success: false, error: { code: 'ROUTE_NOT_FOUND', message: `Route ${req.method} ${req.url} not found` } });
};
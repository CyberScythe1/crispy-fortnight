import { errorHandler as createErrorHandler, notFoundHandler, AppError, ValidationError, NotFoundError, UnauthorizedError, ForbiddenError, ConflictError } from '@crispy-fortnight/shared';
import { config } from '../config/env.js';

export { AppError, ValidationError, NotFoundError, UnauthorizedError, ForbiddenError, ConflictError };

export const errorHandler = createErrorHandler(config);

export { notFoundHandler };
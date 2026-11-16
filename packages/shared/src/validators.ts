import { z } from 'zod';

export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export const uuidParamSchema = z.object({
  id: z.string().uuid('Invalid ID format'),
});

export const registerSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  firstName: z.string().min(1, 'First name is required').max(50),
  lastName: z.string().min(1, 'Last name is required').max(50),
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

export const createWorkspaceSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  slug: z.string().min(2, 'Slug is required').max(50).regex(/^[a-z0-9-]+$/, 'Slug must be lowercase alphanumeric with hyphens'),
  icon: z.string().max(10).optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid color format').optional(),
});

export const updateWorkspaceSchema = z.object({
  name: z.string().max(100).optional(),
  icon: z.string().max(10).optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  settings: z.record(z.any()).optional(),
});

export const createDocumentSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  type: z.enum(['DOCUMENT', 'CANVAS', 'SPREADSHEET', 'DATABASE', 'KANBAN']).default('DOCUMENT'),
  icon: z.string().max(10).optional(),
  cover: z.string().url('Invalid cover URL').optional(),
  parentId: z.string().uuid('Invalid parent document ID').optional(),
});

export const updateDocumentSchema = z.object({
  title: z.string().max(200).optional(),
  icon: z.string().max(10).optional(),
  cover: z.string().url().optional(),
  content: z.any().optional(),
  visibility: z.enum(['PRIVATE', 'TEAM', 'PUBLIC', 'LINK']).optional(),
  settings: z.record(z.any()).optional(),
});

export const createPageSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  icon: z.string().max(10).optional(),
  content: z.any().optional(),
  parentId: z.string().uuid('Invalid parent page ID').optional(),
});

export const updatePageSchema = z.object({
  title: z.string().max(200).optional(),
  icon: z.string().max(10).optional(),
  content: z.any().optional(),
  position: z.number().int().min(0).optional(),
  isPublished: z.boolean().optional(),
});

export const createCommentSchema = z.object({
  content: z.string().min(1, 'Content is required').max(5000),
  type: z.enum(['COMMENT', 'SUGGESTION', 'RESOLVED']).default('COMMENT'),
  anchor: z.any().optional(),
  documentId: z.string().uuid().optional(),
  pageId: z.string().uuid().optional(),
  parentId: z.string().uuid().optional(),
});

export const updateCommentSchema = z.object({
  content: z.string().min(1).max(5000).optional(),
  resolved: z.boolean().optional(),
});

export const workspaceParamSchema = z.object({
  workspaceId: z.string().uuid('Invalid workspace ID'),
});

export const documentParamSchema = z.object({
  documentId: z.string().uuid('Invalid document ID'),
});

export const pageParamSchema = z.object({
  pageId: z.string().uuid('Invalid page ID'),
});
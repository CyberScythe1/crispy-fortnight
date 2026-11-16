import { z } from 'zod';
import {
  paginationSchema,
  uuidParamSchema,
  registerSchema,
  loginSchema,
  refreshTokenSchema,
} from '@crispy-fortnight/shared';

export {
  paginationSchema,
  uuidParamSchema,
  registerSchema,
  loginSchema,
  refreshTokenSchema,
};

export const createTenantSchema = z.object({
  slug: z.string().min(2, 'Slug is required').max(50).regex(/^[a-z0-9-]+$/, 'Slug must be lowercase alphanumeric with hyphens'),
  name: z.string().min(1, 'Name is required').max(100),
  domain: z.string().max(253).optional(),
  logo: z.string().url('Invalid logo URL').optional(),
});

export const updateTenantSchema = z.object({
  name: z.string().max(100).optional(),
  domain: z.string().max(253).optional(),
  logo: z.string().url('Invalid logo URL').optional(),
  settings: z.record(z.any()).optional(),
  subscriptionTier: z.enum(['FREE', 'STARTER', 'PROFESSIONAL', 'ENTERPRISE']).optional(),
});

export const createProjectSchema = z.object({
  key: z.string().min(2, 'Project key is required').max(10).regex(/^[A-Z]+$/, 'Key must be uppercase letters'),
  name: z.string().min(1, 'Name is required').max(100),
  description: z.string().max(2000).optional(),
  visibility: z.enum(['PRIVATE', 'TEAM', 'PUBLIC']).default('PRIVATE'),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
});

export const updateProjectSchema = z.object({
  key: z.string().max(10).regex(/^[A-Z]+$/).optional(),
  name: z.string().max(100).optional(),
  description: z.string().max(2000).optional(),
  visibility: z.enum(['PRIVATE', 'TEAM', 'PUBLIC']).optional(),
  avatar: z.string().url('Invalid avatar URL').optional(),
  settings: z.record(z.any()).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
});

export const createIssueSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  description: z.string().max(10000).optional(),
  type: z.enum(['TASK', 'BUG', 'STORY', 'EPIC', 'SUBTASK']).default('TASK'),
  priority: z.enum(['LOWEST', 'LOW', 'MEDIUM', 'HIGH', 'HIGHEST']).default('MEDIUM'),
  storyPoints: z.number().int().positive().optional(),
  startDate: z.string().datetime().optional(),
  dueDate: z.string().datetime().optional(),
  assigneeId: z.string().uuid('Invalid assignee ID').optional(),
  parentId: z.string().uuid('Invalid parent issue ID').optional(),
  sprintId: z.string().uuid('Invalid sprint ID').optional(),
  boardId: z.string().uuid('Invalid board ID').optional(),
  columnId: z.string().uuid('Invalid column ID').optional(),
  watchers: z.array(z.string().uuid()).optional(),
});

export const updateIssueSchema = z.object({
  title: z.string().max(200).optional(),
  description: z.string().max(10000).optional(),
  type: z.enum(['TASK', 'BUG', 'STORY', 'EPIC', 'SUBTASK']).optional(),
  status: z.enum(['BACKLOG', 'TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE', 'CANCELLED']).optional(),
  priority: z.enum(['LOWEST', 'LOW', 'MEDIUM', 'HIGH', 'HIGHEST']).optional(),
  storyPoints: z.number().int().positive().optional(),
  startDate: z.string().datetime().optional(),
  dueDate: z.string().datetime().optional(),
  assigneeId: z.string().uuid().optional().nullable(),
  parentId: z.string().uuid().optional().nullable(),
  sprintId: z.string().uuid().optional().nullable(),
  boardId: z.string().uuid().optional().nullable(),
  columnId: z.string().uuid().optional().nullable(),
  watchers: z.array(z.string().uuid()).optional(),
});

export const createSprintSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  goal: z.string().max(500).optional(),
  startDate: z.string().datetime('Invalid start date'),
  endDate: z.string().datetime('Invalid end date'),
});

export const updateSprintSchema = z.object({
  name: z.string().max(100).optional(),
  goal: z.string().max(500).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  status: z.enum(['planned', 'active', 'completed']).optional(),
});

export const createBoardSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  type: z.enum(['scrum', 'kanban']).default('scrum'),
  settings: z.record(z.any()).optional(),
});

export const updateBoardSchema = z.object({
  name: z.string().max(100).optional(),
  type: z.enum(['scrum', 'kanban']).optional(),
  settings: z.record(z.any()).optional(),
});

export const createColumnSchema = z.object({
  name: z.string().min(1, 'Name is required').max(50),
  position: z.number().int().min(0).default(0),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid color format').default('#6366f1'),
  wipLimit: z.number().int().positive().optional(),
});

export const updateColumnSchema = z.object({
  name: z.string().max(50).optional(),
  position: z.number().int().min(0).optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  wipLimit: z.number().int().positive().optional(),
});

export const createCommentSchema = z.object({
  content: z.string().min(1, 'Content is required').max(5000),
  parentId: z.string().uuid().optional(),
});

export const updateCommentSchema = z.object({
  content: z.string().min(1).max(5000),
});

export const createWebhookSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  url: z.string().url('Invalid webhook URL'),
  events: z.array(z.string()).min(1, 'At least one event is required'),
  secret: z.string().min(16, 'Secret must be at least 16 characters').optional(),
});

export const updateWebhookSchema = z.object({
  name: z.string().max(100).optional(),
  url: z.string().url().optional(),
  events: z.array(z.string()).optional(),
  isActive: z.boolean().optional(),
});

export const issueQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  status: z.enum(['BACKLOG', 'TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE', 'CANCELLED']).optional(),
  type: z.enum(['TASK', 'BUG', 'STORY', 'EPIC', 'SUBTASK']).optional(),
  priority: z.enum(['LOWEST', 'LOW', 'MEDIUM', 'HIGH', 'HIGHEST']).optional(),
  assigneeId: z.string().uuid().optional(),
  sprintId: z.string().uuid().optional(),
  boardId: z.string().uuid().optional(),
  search: z.string().optional(),
});

export const projectUuidParamSchema = z.object({
  projectId: z.string().uuid('Invalid project ID'),
});

export const issueUuidParamSchema = z.object({
  issueId: z.string().uuid('Invalid issue ID'),
});

export const sprintUuidParamSchema = z.object({
  sprintId: z.string().uuid('Invalid sprint ID'),
});

export const boardUuidParamSchema = z.object({
  boardId: z.string().uuid('Invalid board ID'),
});

export const columnUuidParamSchema = z.object({
  columnId: z.string().uuid('Invalid column ID'),
});

export const webhookUuidParamSchema = z.object({
  webhookId: z.string().uuid('Invalid webhook ID'),
});
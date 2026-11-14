export enum UserRole {
  OWNER = 'OWNER',
  ADMIN = 'ADMIN',
  MEMBER = 'MEMBER',
  EDITOR = 'EDITOR',
  VIEWER = 'VIEWER',
  COMMENTER = 'COMMENTER',
}

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  avatar?: string;
  color?: string;
  role: UserRole;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Tenant {
  id: string;
  slug: string;
  name: string;
  logo?: string;
  domain?: string;
  settings: Record<string, any>;
  subscriptionTier: 'FREE' | 'STARTER' | 'PROFESSIONAL' | 'ENTERPRISE';
  createdAt: Date;
  updatedAt: Date;
}

export interface Project {
  id: string;
  key: string;
  name: string;
  description?: string;
  visibility: 'PRIVATE' | 'TEAM' | 'PUBLIC';
  tenantId: string;
  ownerId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Issue {
  id: string;
  key: string;
  title: string;
  description?: string;
  type: 'TASK' | 'BUG' | 'STORY' | 'EPIC' | 'SUBTASK';
  status: 'BACKLOG' | 'TODO' | 'IN_PROGRESS' | 'IN_REVIEW' | 'DONE' | 'CANCELLED';
  priority: 'LOWEST' | 'LOW' | 'MEDIUM' | 'HIGH' | 'HIGHEST';
  projectId: string;
  assigneeId?: string;
  reporterId: string;
  sprintId?: string;
  boardId?: string;
  columnId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Workspace {
  id: string;
  name: string;
  slug: string;
  icon?: string;
  color: string;
  isPersonal: boolean;
  ownerId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Document {
  id: string;
  title: string;
  type: 'DOCUMENT' | 'CANVAS' | 'SPREADSHEET' | 'DATABASE' | 'KANBAN';
  workspaceId: string;
  ownerId: string;
  content: any;
  visibility: 'PRIVATE' | 'TEAM' | 'PUBLIC' | 'LINK';
  createdAt: Date;
  updatedAt: Date;
}

export interface Page {
  id: string;
  title: string;
  documentId: string;
  content: any;
  position: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Comment {
  id: string;
  content: string;
  type: 'COMMENT' | 'SUGGESTION' | 'RESOLVED';
  documentId?: string;
  pageId?: string;
  authorId: string;
  parentId?: string;
  resolved: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface PaginationParams {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginationMeta {
  currentPage: number;
  perPage: number;
  totalItems: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  meta?: PaginationMeta;
  error?: {
    code: string;
    message: string;
    details?: any[];
  };
}

export const generateKey = (prefix: string = 'PRJ') => `${prefix}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

export const formatDate = (date: Date | string, format: string = 'MMM d, yyyy') => {
  const d = new Date(date);
  return format.replace('MMM', d.toLocaleString('default', { month: 'short' }))
    .replace('d', d.getDate().toString())
    .replace('yyyy', d.getFullYear().toString());
};
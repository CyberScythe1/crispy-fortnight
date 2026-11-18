import { prisma } from '../config/database.js';
import { paginate, buildPaginationMeta } from '../utils/helpers.js';
import { AppError, NotFoundError, ForbiddenError } from '../middleware/errorHandler.js';

export const documentController = {
  list: async (req, res, next) => {
    try {
      const { page, limit, sortBy = 'updatedAt', sortOrder = 'desc' } = req.validatedQuery;
      const { skip, take, page: currentPage, limit: currentLimit } = paginate(page, limit);

      const workspaceId = req.validatedParams.workspaceId;

      const workspace = await prisma.workspace.findUnique({ where: { id: workspaceId } });
      if (!workspace) throw new NotFoundError('Workspace');

      const isMember = workspace.members.some((m) => m.userId === req.user.id);
      if (!isMember && workspace.ownerId !== req.user.id) {
        throw new ForbiddenError('Access denied');
      }

      const [documents, total] = await Promise.all([
        prisma.document.findMany({
          where: { workspaceId },
          skip,
          take,
          orderBy: { [sortBy]: sortOrder },
          include: {
            owner: { select: { id: true, firstName: true, lastName: true, color: true } },
            _count: { select: { pages: true, comments: true } },
          },
        }),
        prisma.document.count({ where: { workspaceId } }),
      ]);

      res.json({
        success: true,
        data: documents,
        meta: buildPaginationMeta(total, currentPage, currentLimit),
      });
    } catch (error) {
      next(error);
    }
  },

  create: async (req, res, next) => {
    try {
      const workspaceId = req.validatedParams.workspaceId;

      const workspace = await prisma.workspace.findUnique({ where: { id: workspaceId } });
      if (!workspace) throw new NotFoundError('Workspace');

      const isMember = workspace.members.some((m) => m.userId === req.user.id);
      if (!isMember && workspace.ownerId !== req.user.id) {
        throw new ForbiddenError('Access denied');
      }

      const { title, type, icon, cover, parentId } = req.validatedBody;

      const document = await prisma.document.create({
        data: {
          title,
          type: type || 'DOCUMENT',
          icon,
          cover,
          workspaceId,
          ownerId: req.user.id,
          content: { type: 'doc', content: [] },
        },
        include: { owner: { select: { id: true, firstName: true, lastName: true, color: true } } },
      });

      res.status(201).json({ success: true, data: document, message: 'Document created successfully' });
    } catch (error) {
      next(error);
    }
  },

  get: async (req, res, next) => {
    try {
      const document = await prisma.document.findUnique({
        where: { id: req.validatedParams.documentId },
        include: {
          workspace: { select: { id: true, name: true, slug: true, ownerId: true } },
          owner: { select: { id: true, firstName: true, lastName: true, email: true, color: true } },
          pages: {
            orderBy: { position: 'asc' },
            select: { id: true, title: true, icon: true, position: true, isPublished: true },
          },
          _count: { select: { pages: true, comments: true } },
        },
      });

      if (!document) throw new NotFoundError('Document');

      const workspace = document.workspace;
      const isMember = workspace.members?.some((m) => m.userId === req.user.id);
      if (!isMember && workspace.ownerId !== req.user.id) {
        throw new ForbiddenError('Access denied');
      }

      res.json({ success: true, data: document });
    } catch (error) {
      next(error);
    }
  },

  update: async (req, res, next) => {
    try {
      const document = await prisma.document.findUnique({ where: { id: req.validatedParams.documentId } });
      if (!document) throw new NotFoundError('Document');

      const workspace = await prisma.workspace.findUnique({ where: { id: document.workspaceId } });
      if (!workspace) throw new NotFoundError('Workspace');

      const isOwner = document.ownerId === req.user.id;
      const isWorkspaceOwner = workspace.ownerId === req.user.id;
      if (!isOwner && !isWorkspaceOwner) {
        throw new ForbiddenError('Only document or workspace owner can update');
      }

      const updated = await prisma.document.update({
        where: { id: document.id },
        data: req.validatedBody,
        include: { owner: { select: { firstName: true, lastName: true, email: true, color: true } } },
      });

      res.json({ success: true, data: updated, message: 'Document updated successfully' });
    } catch (error) {
      next(error);
    }
  },

  delete: async (req, res, next) => {
    try {
      const document = await prisma.document.findUnique({ where: { id: req.validatedParams.documentId } });
      if (!document) throw new NotFoundError('Document');

      const workspace = await prisma.workspace.findUnique({ where: { id: document.workspaceId } });
      if (!workspace) throw new NotFoundError('Workspace');

      const isOwner = document.ownerId === req.user.id;
      const isWorkspaceOwner = workspace.ownerId === req.user.id;
      if (!isOwner && !isWorkspaceOwner) {
        throw new ForbiddenError('Only document or workspace owner can delete');
      }

      await prisma.document.delete({ where: { id: document.id } });

      res.json({ success: true, message: 'Document deleted successfully' });
    } catch (error) {
      next(error);
    }
  },

  getPages: async (req, res, next) => {
    try {
      const document = await prisma.document.findUnique({ where: { id: req.validatedParams.documentId } });
      if (!document) throw new NotFoundError('Document');

      const pages = await prisma.page.findMany({
        where: { documentId: document.id },
        orderBy: { position: 'asc' },
        select: { id: true, title: true, icon: true, content: true, position: true, isPublished: true },
      });

      res.json({ success: true, data: pages });
    } catch (error) {
      next(error);
    }
  },

  createPage: async (req, res, next) => {
    try {
      const document = await prisma.document.findUnique({ where: { id: req.validatedParams.documentId } });
      if (!document) throw new NotFoundError('Document');

      const workspace = await prisma.workspace.findUnique({ where: { id: document.workspaceId } });
      if (!workspace) throw new NotFoundError('Workspace');

      const isMember = workspace.members.some((m) => m.userId === req.user.id);
      if (!isMember && workspace.ownerId !== req.user.id) {
        throw new ForbiddenError('Access denied');
      }

      const { title, icon, content, parentId } = req.validatedBody;

      const maxPosition = await prisma.page.aggregate({
        where: { documentId: document.id },
        _max: { position: true },
      });

      const page = await prisma.page.create({
        data: {
          title,
          icon,
          content,
          position: (maxPosition._max.position || -1) + 1,
          documentId: document.id,
        },
      });

      res.status(201).json({ success: true, data: page, message: 'Page created successfully' });
    } catch (error) {
      next(error);
    }
  },
};
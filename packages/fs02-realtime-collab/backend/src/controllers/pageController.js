import { prisma } from '../config/database.js';
import { paginate, buildPaginationMeta } from '../utils/helpers.js';
import { AppError, NotFoundError, ForbiddenError } from '../middleware/errorHandler.js';

export const pageController = {
  list: async (req, res, next) => {
    try {
      const { page, limit, sortBy = 'position', sortOrder = 'asc' } = req.validatedQuery;
      const { skip, take, page: currentPage, limit: currentLimit } = paginate(page, limit);

      const documentId = req.validatedParams.documentId;

      const document = await prisma.document.findUnique({ where: { id: documentId } });
      if (!document) throw new NotFoundError('Document');

      const workspace = await prisma.workspace.findUnique({ where: { id: document.workspaceId } });
      if (!workspace) throw new NotFoundError('Workspace');

      const isMember = workspace.members.some((m) => m.userId === req.user.id);
      if (!isMember && workspace.ownerId !== req.user.id) {
        throw new ForbiddenError('Access denied');
      }

      const [pages, total] = await Promise.all([
        prisma.page.findMany({
          where: { documentId },
          skip,
          take,
          orderBy: { [sortBy]: sortOrder },
        }),
        prisma.page.count({ where: { documentId } }),
      ]);

      res.json({
        success: true,
        data: pages,
        meta: buildPaginationMeta(total, currentPage, currentLimit),
      });
    } catch (error) {
      next(error);
    }
  },

  create: async (req, res, next) => {
    try {
      const documentId = req.validatedParams.documentId;

      const document = await prisma.document.findUnique({ where: { id: documentId } });
      if (!document) throw new NotFoundError('Document');

      const workspace = await prisma.workspace.findUnique({ where: { id: document.workspaceId } });
      if (!workspace) throw new NotFoundError('Workspace');

      const isMember = workspace.members.some((m) => m.userId === req.user.id);
      if (!isMember && workspace.ownerId !== req.user.id) {
        throw new ForbiddenError('Access denied');
      }

      const { title, icon, content, parentId } = req.validatedBody;

      const maxPosition = await prisma.page.aggregate({
        where: { documentId },
        _max: { position: true },
      });

      const page = await prisma.page.create({
        data: {
          title,
          icon,
          content,
          position: (maxPosition._max.position || -1) + 1,
          documentId,
        },
      });

      res.status(201).json({ success: true, data: page, message: 'Page created successfully' });
    } catch (error) {
      next(error);
    }
  },

  get: async (req, res, next) => {
    try {
      const page = await prisma.page.findUnique({
        where: { id: req.validatedParams.pageId },
        include: {
          document: {
            select: { id: true, title: true, workspaceId: true },
            include: {
              workspace: {
                select: { id: true, name: true, ownerId: true },
                include: { members: { select: { userId: true } } },
              },
            },
          },
        },
      });

      if (!page) throw new NotFoundError('Page');

      const workspace = page.document.workspace;
      const isMember = workspace.members.some((m) => m.userId === req.user.id);
      if (!isMember && workspace.ownerId !== req.user.id) {
        throw new ForbiddenError('Access denied');
      }

      res.json({ success: true, data: page });
    } catch (error) {
      next(error);
    }
  },

  update: async (req, res, next) => {
    try {
      const page = await prisma.page.findUnique({
        where: { id: req.validatedParams.pageId },
        include: {
          document: {
            include: { workspace: { select: { id: true, ownerId: true, members: { select: { userId: true } } } } },
          },
        },
      });
      if (!page) throw new NotFoundError('Page');

      const workspace = page.document.workspace;
      const isMember = workspace.members.some((m) => m.userId === req.user.id);
      const isOwner = workspace.ownerId === req.user.id;
      if (!isMember && !isOwner) {
        throw new ForbiddenError('Access denied');
      }

      const updated = await prisma.page.update({
        where: { id: page.id },
        data: req.validatedBody,
      });

      res.json({ success: true, data: updated, message: 'Page updated successfully' });
    } catch (error) {
      next(error);
    }
  },

  delete: async (req, res, next) => {
    try {
      const page = await prisma.page.findUnique({
        where: { id: req.validatedParams.pageId },
        include: { document: { include: { workspace: { select: { ownerId: true } } } } },
      });
      if (!page) throw new NotFoundError('Page');

      const workspace = page.document.workspace;
      const isOwner = workspace.ownerId === req.user.id;
      if (!isOwner) {
        throw new ForbiddenError('Only workspace owner can delete pages');
      }

      await prisma.page.delete({ where: { id: page.id } });

      res.json({ success: true, message: 'Page deleted successfully' });
    } catch (error) {
      next(error);
    }
  },
};
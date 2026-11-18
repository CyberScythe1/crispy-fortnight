import { prisma } from '../config/database.js';
import { paginate, buildPaginationMeta } from '../utils/helpers.js';
import { AppError, NotFoundError, ForbiddenError } from '../middleware/errorHandler.js';

export const workspaceController = {
  list: async (req, res, next) => {
    try {
      const { page, limit, sortBy = 'createdAt', sortOrder = 'desc' } = req.validatedQuery;
      const { skip, take, page: currentPage, limit: currentLimit } = paginate(page, limit);

      const where = {
        OR: [
          { ownerId: req.user.id },
          { members: { some: { userId: req.user.id } } },
        ],
      };

      const [workspaces, total] = await Promise.all([
        prisma.workspace.findMany({
          where,
          skip,
          take,
          orderBy: { [sortBy]: sortOrder },
          include: {
            owner: { select: { id: true, firstName: true, lastName: true, email: true, color: true } },
            _count: { select: { members: true, documents: true } },
          },
        }),
        prisma.workspace.count({ where }),
      ]);

      res.json({
        success: true,
        data: workspaces,
        meta: buildPaginationMeta(total, currentPage, currentLimit),
      });
    } catch (error) {
      next(error);
    }
  },

  create: async (req, res, next) => {
    try {
      const { name, slug, icon, color } = req.validatedBody;

      const existing = await prisma.workspace.findFirst({ where: { slug, ownerId: req.user.id } });
      if (existing) {
        return res.status(409).json({
          success: false,
          error: { code: 'DUPLICATE_ENTRY', message: 'Workspace slug already exists' },
        });
      }

      const workspace = await prisma.workspace.create({
        data: {
          name,
          slug,
          icon,
          color: color || '#6366f1',
          ownerId: req.user.id,
          isPersonal: false,
        },
        include: {
          owner: { select: { id: true, firstName: true, lastName: true, email: true, color: true } },
        },
      });

      await prisma.workspaceMember.create({
        data: {
          userId: req.user.id,
          workspaceId: workspace.id,
          role: 'OWNER',
        },
      });

      res.status(201).json({ success: true, data: workspace, message: 'Workspace created successfully' });
    } catch (error) {
      next(error);
    }
  },

  get: async (req, res, next) => {
    try {
      const workspace = await prisma.workspace.findUnique({
        where: { id: req.validatedParams.id },
        include: {
          owner: { select: { id: true, firstName: true, lastName: true, email: true, color: true } },
          members: {
            include: { user: { select: { id: true, firstName: true, lastName: true, email: true, color: true } } },
          },
          _count: { select: { documents: true, members: true } },
        },
      });

      if (!workspace) throw new NotFoundError('Workspace');

      const isMember = workspace.members.some((m) => m.userId === req.user.id);
      if (!isMember && workspace.ownerId !== req.user.id) {
        throw new ForbiddenError('Access denied to this workspace');
      }

      res.json({ success: true, data: workspace });
    } catch (error) {
      next(error);
    }
  },

  update: async (req, res, next) => {
    try {
      const workspace = await prisma.workspace.findUnique({ where: { id: req.validatedParams.id } });
      if (!workspace) throw new NotFoundError('Workspace');

      if (workspace.ownerId !== req.user.id) {
        throw new ForbiddenError('Only workspace owner can update');
      }

      const updated = await prisma.workspace.update({
        where: { id: workspace.id },
        data: req.validatedBody,
        include: { owner: { select: { firstName: true, lastName: true, email: true, color: true } } },
      });

      res.json({ success: true, data: updated, message: 'Workspace updated successfully' });
    } catch (error) {
      next(error);
    }
  },

  delete: async (req, res, next) => {
    try {
      const workspace = await prisma.workspace.findUnique({ where: { id: req.validatedParams.id } });
      if (!workspace) throw new NotFoundError('Workspace');

      if (workspace.ownerId !== req.user.id) {
        throw new ForbiddenError('Only workspace owner can delete');
      }

      await prisma.workspace.delete({ where: { id: workspace.id } });

      res.json({ success: true, message: 'Workspace deleted successfully' });
    } catch (error) {
      next(error);
    }
  },

  getMembers: async (req, res, next) => {
    try {
      const workspace = await prisma.workspace.findUnique({
        where: { id: req.validatedParams.id },
        include: { members: { select: { userId: true } } },
      });
      if (!workspace) throw new NotFoundError('Workspace');

      const isMember = workspace.members.some((m) => m.userId === req.user.id);
      if (!isMember && workspace.ownerId !== req.user.id) {
        throw new ForbiddenError('Access denied');
      }

      const members = await prisma.workspaceMember.findMany({
        where: { workspaceId: workspace.id },
        include: { user: { select: { id: true, firstName: true, lastName: true, email: true, color: true, avatar: true } } },
        orderBy: { joinedAt: 'asc' },
      });

      res.json({ success: true, data: members });
    } catch (error) {
      next(error);
    }
  },

  addMember: async (req, res, next) => {
    try {
      const workspace = await prisma.workspace.findUnique({
        where: { id: req.validatedParams.id },
        include: { members: { select: { userId: true } } },
      });
      if (!workspace) throw new NotFoundError('Workspace');

      if (workspace.ownerId !== req.user.id) {
        throw new ForbiddenError('Only workspace owner can add members');
      }

      const { userId, role } = req.validatedBody;

      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user) throw new NotFoundError('User');

      const existing = await prisma.workspaceMember.findUnique({
        where: { userId_workspaceId: { userId, workspaceId: workspace.id } },
      });
      if (existing) throw new AppError('User is already a member', 409, 'ALREADY_MEMBER');

      const member = await prisma.workspaceMember.create({
        data: { userId, workspaceId: workspace.id, role: role || 'MEMBER' },
        include: { user: { select: { id: true, firstName: true, lastName: true, email: true, color: true } } },
      });

      res.status(201).json({ success: true, data: member, message: 'Member added successfully' });
    } catch (error) {
      next(error);
    }
  },

  updateMember: async (req, res, next) => {
    try {
      const workspace = await prisma.workspace.findUnique({
        where: { id: req.validatedParams.id },
        include: { members: { select: { userId: true } } },
      });
      if (!workspace) throw new NotFoundError('Workspace');

      if (workspace.ownerId !== req.user.id) {
        throw new ForbiddenError('Only workspace owner can update members');
      }

      const member = await prisma.workspaceMember.update({
        where: { id: req.validatedParams.memberId },
        data: { role: req.validatedBody.role },
        include: { user: { select: { id: true, firstName: true, lastName: true, email: true, color: true } } },
      });

      res.json({ success: true, data: member, message: 'Member updated successfully' });
    } catch (error) {
      next(error);
    }
  },

  removeMember: async (req, res, next) => {
    try {
      const workspace = await prisma.workspace.findUnique({
        where: { id: req.validatedParams.id },
        include: { members: { select: { userId: true } } },
      });
      if (!workspace) throw new NotFoundError('Workspace');

      if (workspace.ownerId !== req.user.id) {
        throw new ForbiddenError('Only workspace owner can remove members');
      }

      const targetMember = await prisma.workspaceMember.findUnique({ where: { id: req.validatedParams.memberId } });
      if (!targetMember) throw new NotFoundError('Member');

      if (targetMember.userId === req.user.id) {
        throw new ForbiddenError('Cannot remove yourself');
      }

      await prisma.workspaceMember.delete({ where: { id: req.validatedParams.memberId } });

      res.json({ success: true, message: 'Member removed successfully' });
    } catch (error) {
      next(error);
    }
  },

  getDocuments: async (req, res, next) => {
    try {
      const { page, limit, sortBy = 'updatedAt', sortOrder = 'desc' } = req.validatedQuery;
      const { skip, take, page: currentPage, limit: currentLimit } = paginate(page, limit);

      const workspace = await prisma.workspace.findUnique({
        where: { id: req.validatedParams.id },
        include: { members: { select: { userId: true } } },
      });
      if (!workspace) throw new NotFoundError('Workspace');

      const isMember = workspace.members.some((m) => m.userId === req.user.id);
      if (!isMember && workspace.ownerId !== req.user.id) {
        throw new ForbiddenError('Access denied');
      }

      const [documents, total] = await Promise.all([
        prisma.document.findMany({
          where: { workspaceId: workspace.id },
          skip,
          take,
          orderBy: { [sortBy]: sortOrder },
          include: {
            owner: { select: { id: true, firstName: true, lastName: true, color: true } },
            _count: { select: { pages: true, comments: true } },
          },
        }),
        prisma.document.count({ where: { workspaceId: workspace.id } }),
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
};
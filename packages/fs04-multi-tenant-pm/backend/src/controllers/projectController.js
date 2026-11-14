import { prisma } from '../config/database.js';
import { paginate, buildPaginationMeta } from '../utils/helpers.js';
import { AppError, NotFoundError, ForbiddenError } from '../middleware/errorHandler.js';

export const projectController = {
  list: async (req, res, next) => {
    try {
      const { page, limit, search, sortBy = 'createdAt', sortOrder = 'desc' } = req.validatedQuery;
      const { skip, take, page: currentPage, limit: currentLimit } = paginate(page, limit);

      const where = {
        tenantId: req.user.tenantId,
        ...(search && {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { key: { contains: search, mode: 'insensitive' } },
          ],
        }),
      };

      const [projects, total] = await Promise.all([
        prisma.project.findMany({
          where,
          skip,
          take,
          orderBy: { [sortBy]: sortOrder },
          include: {
            owner: { select: { id: true, firstName: true, lastName: true, email: true } },
            _count: { select: { members: true, issues: true, sprints: true } },
          },
        }),
        prisma.project.count({ where }),
      ]);

      res.json({
        success: true,
        data: projects,
        meta: buildPaginationMeta(total, currentPage, currentLimit),
      });
    } catch (error) {
      next(error);
    }
  },

  get: async (req, res, next) => {
    try {
      const project = await prisma.project.findUnique({
        where: { id: req.validatedParams.id },
        include: {
          tenant: { select: { id: true, name: true, slug: true } },
          owner: { select: { id: true, firstName: true, lastName: true, email: true } },
          members: {
            include: { user: { select: { id: true, firstName: true, lastName: true, email: true, avatar: true } } },
          },
          _count: { select: { issues: true, sprints: true, boards: true, members: true } },
        },
      });

      if (!project) throw new NotFoundError('Project');

      const isMember = project.members.some((m) => m.userId === req.user.id);
      const isOwner = project.ownerId === req.user.id;
      if (!isMember && !isOwner && req.user.role !== 'OWNER') {
        throw new ForbiddenError('Access denied to this project');
      }

      res.json({ success: true, data: project });
    } catch (error) {
      next(error);
    }
  },

  create: async (req, res, next) => {
    try {
      const { key, name, description, visibility, startDate, endDate } = req.validatedBody;

      const existingProject = await prisma.project.findFirst({
        where: { tenantId: req.user.tenantId, key: key.toUpperCase() },
      });
      if (existingProject) {
        return res.status(409).json({
          success: false,
          error: { code: 'DUPLICATE_ENTRY', message: 'Project key already exists in this tenant' },
        });
      }

      const project = await prisma.project.create({
        data: {
          key: key.toUpperCase(),
          name,
          description,
          visibility,
          startDate: startDate ? new Date(startDate) : null,
          endDate: endDate ? new Date(endDate) : null,
          tenantId: req.user.tenantId,
          ownerId: req.user.id,
        },
        include: {
          owner: { select: { id: true, firstName: true, lastName: true, email: true } },
        },
      });

      await prisma.projectMember.create({
        data: {
          userId: req.user.id,
          projectId: project.id,
          role: 'OWNER',
        },
      });

      const defaultBoard = await prisma.board.create({
        data: {
          name: 'Board',
          type: 'scrum',
          projectId: project.id,
        },
      });

      const defaultColumns = ['Backlog', 'To Do', 'In Progress', 'In Review', 'Done'];
      for (let i = 0; i < defaultColumns.length; i++) {
        await prisma.column.create({
          data: {
            name: defaultColumns[i],
            position: i,
            boardId: defaultBoard.id,
            color: i === 0 ? '#ef4444' : i === defaultColumns.length - 1 ? '#22c55e' : '#3b82f6',
          },
        });
      }

      res.status(201).json({ success: true, data: project, message: 'Project created successfully' });
    } catch (error) {
      next(error);
    }
  },

  update: async (req, res, next) => {
    try {
      const project = await prisma.project.findUnique({ where: { id: req.validatedParams.id } });
      if (!project) throw new NotFoundError('Project');

      const isOwner = project.ownerId === req.user.id;
      const member = await prisma.projectMember.findUnique({
        where: { userId_projectId: { userId: req.user.id, projectId: project.id } },
      });
      const isAdmin = member?.role === 'ADMIN';

      if (!isOwner && !isAdmin && req.user.role !== 'OWNER') {
        throw new ForbiddenError('Only project owner or admin can update this project');
      }

      const updated = await prisma.project.update({
        where: { id: project.id },
        data: req.validatedBody,
        include: { owner: { select: { firstName: true, lastName: true, email: true } } },
      });

      res.json({ success: true, data: updated, message: 'Project updated successfully' });
    } catch (error) {
      next(error);
    }
  },

  delete: async (req, res, next) => {
    try {
      const project = await prisma.project.findUnique({ where: { id: req.validatedParams.id } });
      if (!project) throw new NotFoundError('Project');

      const isOwner = project.ownerId === req.user.id;
      if (!isOwner && req.user.role !== 'OWNER') {
        throw new ForbiddenError('Only project owner can delete this project');
      }

      await prisma.project.delete({ where: { id: project.id } });

      res.json({ success: true, message: 'Project deleted successfully' });
    } catch (error) {
      next(error);
    }
  },

  getMembers: async (req, res, next) => {
    try {
      const project = await prisma.project.findUnique({ where: { id: req.validatedParams.id } });
      if (!project) throw new NotFoundError('Project');

      const members = await prisma.projectMember.findMany({
        where: { projectId: project.id },
        include: { user: { select: { id: true, firstName: true, lastName: true, email: true, avatar: true } } },
        orderBy: { joinedAt: 'asc' },
      });

      res.json({ success: true, data: members });
    } catch (error) {
      next(error);
    }
  },

  addMember: async (req, res, next) => {
    try {
      const project = await prisma.project.findUnique({ where: { id: req.validatedParams.id } });
      if (!project) throw new NotFoundError('Project');

      const isOwner = project.ownerId === req.user.id;
      if (!isOwner && req.user.role !== 'OWNER') {
        throw new ForbiddenError('Only project owner can add members');
      }

      const { userId, role } = req.validatedBody;

      const user = await prisma.user.findUnique({ where: { id: userId, tenantId: req.user.tenantId } });
      if (!user) throw new NotFoundError('User');

      const existing = await prisma.projectMember.findUnique({
        where: { userId_projectId: { userId, projectId: project.id } },
      });
      if (existing) throw new ConflictError('User is already a member of this project');

      const member = await prisma.projectMember.create({
        data: { userId, projectId: project.id, role: role || 'MEMBER' },
        include: { user: { select: { id: true, firstName: true, lastName: true, email: true, avatar: true } } },
      });

      res.status(201).json({ success: true, data: member, message: 'Member added successfully' });
    } catch (error) {
      next(error);
    }
  },

  updateMember: async (req, res, next) => {
    try {
      const project = await prisma.project.findUnique({ where: { id: req.validatedParams.id } });
      if (!project) throw new NotFoundError('Project');

      const isOwner = project.ownerId === req.user.id;
      if (!isOwner && req.user.role !== 'OWNER') {
        throw new ForbiddenError('Only project owner can update members');
      }

      const member = await prisma.projectMember.update({
        where: { id: req.validatedParams.memberId },
        data: { role: req.validatedBody.role },
        include: { user: { select: { id: true, firstName: true, lastName: true, email: true, avatar: true } } },
      });

      res.json({ success: true, data: member, message: 'Member updated successfully' });
    } catch (error) {
      next(error);
    }
  },

  removeMember: async (req, res, next) => {
    try {
      const project = await prisma.project.findUnique({ where: { id: req.validatedParams.id } });
      if (!project) throw new NotFoundError('Project');

      const isOwner = project.ownerId === req.user.id;
      const targetMember = await prisma.projectMember.findUnique({ where: { id: req.validatedParams.memberId } });

      if (!targetMember) throw new NotFoundError('Member');

      if (targetMember.userId === req.user.id && !project.ownerId) {
        throw new ForbiddenError('Cannot remove yourself as the only owner');
      }

      if (!isOwner && req.user.role !== 'OWNER') {
        throw new ForbiddenError('Only project owner can remove members');
      }

      await prisma.projectMember.delete({ where: { id: req.validatedParams.memberId } });

      res.json({ success: true, message: 'Member removed successfully' });
    } catch (error) {
      next(error);
    }
  },

  getIssues: async (req, res, next) => {
    try {
      const { page, limit, sortBy = 'createdAt', sortOrder = 'desc' } = req.validatedQuery;
      const { skip, take, page: currentPage, limit: currentLimit } = paginate(page, limit);

      const where = {
        projectId: req.validatedParams.id,
      };

      const [issues, total] = await Promise.all([
        prisma.issue.findMany({
          where,
          skip,
          take,
          orderBy: { [sortBy]: sortOrder },
          include: {
            assignee: { select: { id: true, firstName: true, lastName: true, avatar: true } },
            reporter: { select: { id: true, firstName: true, lastName: true } },
            sprint: { select: { id: true, name: true } },
          },
        }),
        prisma.issue.count({ where }),
      ]);

      res.json({
        success: true,
        data: issues,
        meta: buildPaginationMeta(total, currentPage, currentLimit),
      });
    } catch (error) {
      next(error);
    }
  },

  getSprints: async (req, res, next) => {
    try {
      const sprints = await prisma.sprint.findMany({
        where: { projectId: req.validatedParams.id },
        orderBy: { startDate: 'asc' },
        include: { _count: { select: { issues: true } } },
      });
      res.json({ success: true, data: sprints });
    } catch (error) {
      next(error);
    }
  },

  getBoards: async (req, res, next) => {
    try {
      const boards = await prisma.board.findMany({
        where: { projectId: req.validatedParams.id },
        include: { columns: { orderBy: { position: 'asc' } } },
      });
      res.json({ success: true, data: boards });
    } catch (error) {
      next(error);
    }
  },
};
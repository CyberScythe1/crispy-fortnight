import { prisma } from '../config/database.js';
import { paginate, buildPaginationMeta } from '../utils/helpers.js';
import { AppError, NotFoundError, ForbiddenError } from '../middleware/errorHandler.js';

export const sprintController = {
  list: async (req, res, next) => {
    try {
      const { page, limit, sortBy = 'startDate', sortOrder = 'asc', status } = req.validatedQuery;
      const { skip, take, page: currentPage, limit: currentLimit } = paginate(page, limit);

      const projectId = req.validatedParams.projectId;

      const project = await prisma.project.findUnique({ where: { id: projectId } });
      if (!project) throw new NotFoundError('Project');
      if (project.tenantId !== req.user.tenantId) {
        throw new ForbiddenError('Access denied to this project');
      }

      const where = {
        projectId,
        ...(status && { status }),
      };

      const [sprints, total] = await Promise.all([
        prisma.sprint.findMany({
          where,
          skip,
          take,
          orderBy: { [sortBy]: sortOrder },
          include: { _count: { select: { issues: true } } },
        }),
        prisma.sprint.count({ where }),
      ]);

      res.json({
        success: true,
        data: sprints,
        meta: buildPaginationMeta(total, currentPage, currentLimit),
      });
    } catch (error) {
      next(error);
    }
  },

  create: async (req, res, next) => {
    try {
      const projectId = req.validatedParams.projectId;

      const project = await prisma.project.findUnique({ where: { id: projectId } });
      if (!project) throw new NotFoundError('Project');

      const { name, goal, startDate, endDate } = req.validatedBody;

      const sprint = await prisma.sprint.create({
        data: {
          name,
          goal,
          startDate: new Date(startDate),
          endDate: new Date(endDate),
          projectId,
          status: 'planned',
        },
        include: { _count: { select: { issues: true } } },
      });

      res.status(201).json({ success: true, data: sprint, message: 'Sprint created successfully' });
    } catch (error) {
      next(error);
    }
  },

  get: async (req, res, next) => {
    try {
      const sprint = await prisma.sprint.findUnique({
        where: { id: req.validatedParams.sprintId },
        include: {
          project: { select: { id: true, key: true, name: true, tenantId: true } },
          issues: {
            include: {
              assignee: { select: { id: true, firstName: true, lastName: true, avatar: true } },
              reporter: { select: { id: true, firstName: true, lastName: true } },
              type: true,
              status: true,
              priority: true,
            },
            orderBy: { createdAt: 'desc' },
          },
          _count: { select: { issues: true } },
        },
      });

      if (!sprint) throw new NotFoundError('Sprint');

      if (sprint.project.tenantId !== req.user.tenantId) {
        throw new ForbiddenError('Access denied to this sprint');
      }

      res.json({ success: true, data: sprint });
    } catch (error) {
      next(error);
    }
  },

  update: async (req, res, next) => {
    try {
      const sprint = await prisma.sprint.findUnique({ where: { id: req.validatedParams.sprintId } });
      if (!sprint) throw new NotFoundError('Sprint');

      if (sprint.status !== 'planned' && req.validatedBody.status) {
        throw new AppError('Cannot change status of active/completed sprint', 400, 'INVALID_STATUS_TRANSITION');
      }

      const updateData = {};
      if (req.validatedBody.name !== undefined) updateData.name = req.validatedBody.name;
      if (req.validatedBody.goal !== undefined) updateData.goal = req.validatedBody.goal;
      if (req.validatedBody.startDate !== undefined) updateData.startDate = req.validatedBody.startDate ? new Date(req.validatedBody.startDate) : null;
      if (req.validatedBody.endDate !== undefined) updateData.endDate = req.validatedBody.endDate ? new Date(req.validatedBody.endDate) : null;
      if (req.validatedBody.status !== undefined) updateData.status = req.validatedBody.status;

      const updated = await prisma.sprint.update({
        where: { id: sprint.id },
        data: updateData,
        include: { _count: { select: { issues: true } } },
      });

      res.json({ success: true, data: updated, message: 'Sprint updated successfully' });
    } catch (error) {
      next(error);
    }
  },

  delete: async (req, res, next) => {
    try {
      const sprint = await prisma.sprint.findUnique({ where: { id: req.validatedParams.sprintId } });
      if (!sprint) throw new NotFoundError('Sprint');

      if (sprint.status !== 'planned') {
        throw new AppError('Can only delete planned sprints', 400, 'INVALID_SPRINT_STATE');
      }

      await prisma.sprint.delete({ where: { id: sprint.id } });

      res.json({ success: true, message: 'Sprint deleted successfully' });
    } catch (error) {
      next(error);
    }
  },

  start: async (req, res, next) => {
    try {
      const sprint = await prisma.sprint.findUnique({ where: { id: req.validatedParams.sprintId } });
      if (!sprint) throw new NotFoundError('Sprint');

      if (sprint.status !== 'planned') {
        throw new AppError('Can only start planned sprints', 400, 'INVALID_SPRINT_STATE');
      }

      const activeSprint = await prisma.sprint.findFirst({
        where: { projectId: sprint.projectId, status: 'active' },
      });
      if (activeSprint) {
        throw new AppError('Another sprint is already active in this project', 400, 'ACTIVE_SPRINT_EXISTS');
      }

      const updated = await prisma.sprint.update({
        where: { id: sprint.id },
        data: { status: 'active' },
      });

      res.json({ success: true, data: updated, message: 'Sprint started' });
    } catch (error) {
      next(error);
    }
  },

  complete: async (req, res, next) => {
    try {
      const sprint = await prisma.sprint.findUnique({ where: { id: req.validatedParams.sprintId } });
      if (!sprint) throw new NotFoundError('Sprint');

      if (sprint.status !== 'active') {
        throw new AppError('Can only complete active sprints', 400, 'INVALID_SPRINT_STATE');
      }

      await prisma.issue.updateMany({
        where: { sprintId: sprint.id, status: { not: 'DONE' } },
        data: { sprintId: null },
      });

      const updated = await prisma.sprint.update({
        where: { id: sprint.id },
        data: { status: 'completed', completedAt: new Date() },
      });

      res.json({ success: true, data: updated, message: 'Sprint completed' });
    } catch (error) {
      next(error);
    }
  },

  getIssues: async (req, res, next) => {
    try {
      const issues = await prisma.issue.findMany({
        where: { sprintId: req.validatedParams.sprintId },
        orderBy: { createdAt: 'asc' },
        include: {
          assignee: { select: { id: true, firstName: true, lastName: true, avatar: true } },
          reporter: { select: { id: true, firstName: true, lastName: true } },
          type: true,
          status: true,
          priority: true,
        },
      });
      res.json({ success: true, data: issues });
    } catch (error) {
      next(error);
    }
  },
};
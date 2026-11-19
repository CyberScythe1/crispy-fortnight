import { prisma } from '../config/database.js';
import { paginate, buildPaginationMeta } from '../utils/helpers.js';
import { AppError, NotFoundError, ForbiddenError } from '../middleware/errorHandler.js';

export const issueController = {
  listByProject: async (req, res, next) => {
    try {
      const { page, limit, sortBy = 'createdAt', sortOrder = 'desc', status, type, priority, assigneeId, sprintId, search } = req.validatedQuery;
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
        ...(type && { type }),
        ...(priority && { priority }),
        ...(assigneeId && { assigneeId }),
        ...(sprintId && { sprintId }),
        ...(search && {
          OR: [
            { title: { contains: search, mode: 'insensitive' } },
            { description: { contains: search, mode: 'insensitive' } },
          ],
        }),
      };

      const [issues, total] = await Promise.all([
        prisma.issue.findMany({
          where,
          skip,
          take,
          orderBy: { [sortBy]: sortOrder },
          include: {
            assignee: { select: { id: true, firstName: true, lastName: true, email: true, avatar: true } },
            reporter: { select: { id: true, firstName: true, lastName: true } },
            sprint: { select: { id: true, name: true } },
            column: { select: { id: true, name: true, color: true } },
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

  create: async (req, res, next) => {
    try {
      const projectId = req.validatedParams.projectId;

      const project = await prisma.project.findUnique({
        where: { id: projectId },
        include: {
          boards: { include: { columns: true }, orderBy: { position: 'asc' } },
        },
      });
      if (!project) throw new NotFoundError('Project');

      const { title, description, type, priority, storyPoints, startDate, dueDate, assigneeId, parentId, sprintId, boardId, columnId, watchers } = req.validatedBody;

      if (assigneeId) {
        const member = await prisma.projectMember.findUnique({
          where: { userId_projectId: { userId: assigneeId, projectId } },
        });
        if (!member) throw new ForbiddenError('Assignee must be a project member');
      }

      // Validate that related entities belong to this project
      if (boardId) {
        const board = project.boards.find((b) => b.id === boardId);
        if (!board) throw new ForbiddenError('Board does not belong to this project');
      }
      if (columnId) {
        const column = project.boards.flatMap((b) => b.columns).find((c) => c.id === columnId);
        if (!column) throw new ForbiddenError('Column does not belong to this project');
      }
      if (sprintId) {
        const sprint = await prisma.sprint.findUnique({ where: { id: sprintId } });
        if (!sprint || sprint.projectId !== projectId) throw new ForbiddenError('Sprint does not belong to this project');
      }

      const defaultBoard = project.boards[0];
      const defaultColumn = defaultBoard?.columns[0];

      let columnIdFinal = columnId;
      if (!columnIdFinal) {
        columnIdFinal = defaultColumn?.id;
      }
      const resolvedBoardId = boardId || defaultBoard?.id;

      let issue;
      let attempt = 0;
      const maxAttempts = 5;
      while (attempt < maxAttempts) {
        attempt += 1;
        const issueCount = await prisma.issue.count({ where: { projectId } });
        const issueKey = `${project.key}-${issueCount + 1}`;
        try {
          issue = await prisma.issue.create({
            data: {
              key: issueKey,
              title,
              description,
              type: type || 'TASK',
              priority: priority || 'MEDIUM',
              storyPoints,
              startDate: startDate ? new Date(startDate) : null,
              dueDate: dueDate ? new Date(dueDate) : null,
              projectId,
              reporterId: req.user.id,
              assigneeId,
              parentId,
              sprintId,
              boardId: resolvedBoardId,
              columnId: columnIdFinal,
              watchers: watchers ? { connect: watchers.map((id) => ({ id })) } : undefined,
            },
            include: {
              assignee: { select: { id: true, firstName: true, lastName: true, email: true, avatar: true } },
              reporter: { select: { id: true, firstName: true, lastName: true } },
              sprint: { select: { id: true, name: true } },
              column: { select: { id: true, name: true, color: true } },
            },
          });
          break;
        } catch (error) {
          if (error.code === 'P2002' && attempt < maxAttempts) continue;
          throw error;
        }
      }

      res.status(201).json({ success: true, data: issue, message: 'Issue created successfully' });
    } catch (error) {
      next(error);
    }
  },

  get: async (req, res, next) => {
    try {
      const issue = await prisma.issue.findUnique({
        where: { id: req.validatedParams.issueId },
        include: {
          project: { select: { id: true, key: true, name: true, tenantId: true } },
          assignee: { select: { id: true, firstName: true, lastName: true, email: true, avatar: true } },
          reporter: { select: { id: true, firstName: true, lastName: true, email: true } },
          sprint: { select: { id: true, name: true, startDate: true, endDate: true, status: true } },
          column: { select: { id: true, name: true, color: true } },
          board: { select: { id: true, name: true, type: true } },
          parent: { select: { id: true, key: true, title: true } },
          subtasks: { select: { id: true, key: true, title: true, status: true, type: true } },
          watchers: { include: { user: { select: { id: true, firstName: true, lastName: true, avatar: true } } } },
          comments: {
            orderBy: { createdAt: 'desc' },
            include: { author: { select: { id: true, firstName: true, lastName: true, avatar: true } } },
          },
          activities: {
            orderBy: { createdAt: 'desc' },
            take: 50,
            include: { user: { select: { id: true, firstName: true, lastName: true, avatar: true } } },
          },
        },
      });

      if (!issue) throw new NotFoundError('Issue');

      const isMember = await prisma.projectMember.findUnique({
        where: { userId_projectId: { userId: req.user.id, projectId: issue.projectId } },
      });
      if (!isMember && req.user.role !== 'OWNER') {
        throw new ForbiddenError('Access denied to this issue');
      }

      res.json({ success: true, data: issue });
    } catch (error) {
      next(error);
    }
  },

  update: async (req, res, next) => {
    try {
      const issue = await prisma.issue.findUnique({ where: { id: req.validatedParams.issueId } });
      if (!issue) throw new NotFoundError('Issue');

      const isMember = await prisma.projectMember.findUnique({
        where: { userId_projectId: { userId: req.user.id, projectId: issue.projectId } },
      });
      if (!isMember && req.user.role !== 'OWNER') {
        throw new ForbiddenError('Access denied to this issue');
      }

      const { assigneeId, ...updateData } = req.validatedBody;

      if (assigneeId !== undefined) {
        if (assigneeId) {
          const member = await prisma.projectMember.findUnique({
            where: { userId_projectId: { userId: assigneeId, projectId: issue.projectId } },
          });
          if (!member) throw new ForbiddenError('Assignee must be a project member');
        }
        updateData.assigneeId = assigneeId;
      }

      const updated = await prisma.issue.update({
        where: { id: issue.id },
        data: updateData,
        include: {
          assignee: { select: { id: true, firstName: true, lastName: true, email: true, avatar: true } },
          sprint: { select: { id: true, name: true } },
          column: { select: { id: true, name: true, color: true } },
        },
      });

      await prisma.issueActivity.create({
        data: {
          issueId: issue.id,
          userId: req.user.id,
          field: 'updated',
          oldValue: JSON.stringify(issue),
          newValue: JSON.stringify(updated),
        },
      });

      res.json({ success: true, data: updated, message: 'Issue updated successfully' });
    } catch (error) {
      next(error);
    }
  },

  delete: async (req, res, next) => {
    try {
      const issue = await prisma.issue.findUnique({ where: { id: req.validatedParams.issueId } });
      if (!issue) throw new NotFoundError('Issue');

      const isMember = await prisma.projectMember.findUnique({
        where: { userId_projectId: { userId: req.user.id, projectId: issue.projectId } },
      });
      const isReporter = issue.reporterId === req.user.id;
      const isOwner = issue.project.ownerId === req.user.id;

      if (!isReporter && !isOwner && req.user.role !== 'OWNER') {
        throw new ForbiddenError('Only reporter or project owner can delete this issue');
      }

      await prisma.issue.delete({ where: { id: issue.id } });

      res.json({ success: true, message: 'Issue deleted successfully' });
    } catch (error) {
      next(error);
    }
  },

  getComments: async (req, res, next) => {
    try {
      const comments = await prisma.comment.findMany({
        where: { issueId: req.validatedParams.issueId },
        orderBy: { createdAt: 'asc' },
        include: { author: { select: { id: true, firstName: true, lastName: true, avatar: true } } },
      });
      res.json({ success: true, data: comments });
    } catch (error) {
      next(error);
    }
  },

  addComment: async (req, res, next) => {
    try {
      const issue = await prisma.issue.findUnique({ where: { id: req.validatedParams.issueId } });
      if (!issue) throw new NotFoundError('Issue');

      const comment = await prisma.comment.create({
        data: {
          content: req.validatedBody.content,
          issueId: issue.id,
          authorId: req.user.id,
          parentId: req.validatedBody.parentId,
        },
        include: { author: { select: { id: true, firstName: true, lastName: true, avatar: true } } },
      });

      res.status(201).json({ success: true, data: comment, message: 'Comment added' });
    } catch (error) {
      next(error);
    }
  },

  assign: async (req, res, next) => {
    try {
      const issue = await prisma.issue.findUnique({ where: { id: req.validatedParams.issueId } });
      if (!issue) throw new NotFoundError('Issue');

      const { assigneeId } = req.validatedBody;

      if (assigneeId) {
        const member = await prisma.projectMember.findUnique({
          where: { userId_projectId: { userId: assigneeId, projectId: issue.projectId } },
        });
        if (!member) throw new ForbiddenError('Assignee must be a project member');
      }

      const updated = await prisma.issue.update({
        where: { id: issue.id },
        data: { assigneeId },
        include: { assignee: { select: { id: true, firstName: true, lastName: true, email: true, avatar: true } } },
      });

      res.json({ success: true, data: updated, message: 'Issue assigned' });
    } catch (error) {
      next(error);
    }
  },

  transition: async (req, res, next) => {
    try {
      const issue = await prisma.issue.findUnique({ where: { id: req.validatedParams.issueId } });
      if (!issue) throw new NotFoundError('Issue');

      const { status, columnId } = req.validatedBody;

      const updateData = {};
      if (status) updateData.status = status;
      if (columnId) {
        const column = await prisma.column.findUnique({ where: { id: columnId } });
        if (!column) throw new NotFoundError('Column');
        updateData.columnId = columnId;
      }

      const updated = await prisma.issue.update({
        where: { id: issue.id },
        data: updateData,
        include: { column: { select: { id: true, name: true, color: true } } },
      });

      res.json({ success: true, data: updated, message: 'Issue transitioned' });
    } catch (error) {
      next(error);
    }
  },
};
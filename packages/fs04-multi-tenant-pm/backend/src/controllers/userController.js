import { prisma } from '../config/database.js';
import { paginate, buildPaginationMeta } from '../utils/helpers.js';
import { AppError, NotFoundError, ForbiddenError } from '../middleware/errorHandler.js';

export const userController = {
  list: async (req, res, next) => {
    try {
      const { page, limit, sortBy = 'createdAt', sortOrder = 'desc', search, role } = req.validatedQuery;
      const { skip, take, page: currentPage, limit: currentLimit } = paginate(page, limit);

      const where = {
        tenantId: req.user.tenantId,
        ...(search && {
          OR: [
            { email: { contains: search, mode: 'insensitive' } },
            { firstName: { contains: search, mode: 'insensitive' } },
            { lastName: { contains: search, mode: 'insensitive' } },
          ],
        }),
        ...(role && { role }),
      };

      const [users, total] = await Promise.all([
        prisma.user.findMany({
          where,
          skip,
          take,
          orderBy: { [sortBy]: sortOrder },
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            avatar: true,
            role: true,
            isActive: true,
            createdAt: true,
          },
        }),
        prisma.user.count({ where }),
      ]);

      res.json({
        success: true,
        data: users,
        meta: buildPaginationMeta(total, currentPage, currentLimit),
      });
    } catch (error) {
      next(error);
    }
  },

  getMe: async (req, res, next) => {
    try {
      const user = await prisma.user.findUnique({
        where: { id: req.user.id },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          avatar: true,
          role: true,
          tenantId: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      if (!user) throw new NotFoundError('User');

      res.json({ success: true, data: user });
    } catch (error) {
      next(error);
    }
  },

  get: async (req, res, next) => {
    try {
      const user = await prisma.user.findUnique({
        where: { id: req.validatedParams.id },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          avatar: true,
          role: true,
          tenantId: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      if (!user) throw new NotFoundError('User');

      if (user.tenantId !== req.user.tenantId && req.user.role !== 'OWNER') {
        throw new ForbiddenError('Access denied');
      }

      res.json({ success: true, data: user });
    } catch (error) {
      next(error);
    }
  },

  update: async (req, res, next) => {
    try {
      const user = await prisma.user.findUnique({ where: { id: req.validatedParams.id } });
      if (!user) throw new NotFoundError('User');

      if (user.tenantId !== req.user.tenantId && req.user.role !== 'OWNER') {
        throw new ForbiddenError('Access denied');
      }

      const isSelf = user.id === req.user.id;
      const isOwner = req.user.role === 'OWNER';

      const { firstName, lastName, avatar, isActive, role } = req.validatedBody;

      if (role && !isOwner) {
        throw new ForbiddenError('Only tenant owners can change user roles');
      }

      const updated = await prisma.user.update({
        where: { id: user.id },
        data: {
          ...(firstName && { firstName }),
          ...(lastName && { lastName }),
          ...(avatar !== undefined && { avatar }),
          ...(isActive !== undefined && isOwner && { isActive }),
          ...(role && isOwner && { role }),
        },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          avatar: true,
          role: true,
          isActive: true,
        },
      });

      res.json({ success: true, data: updated, message: 'User updated successfully' });
    } catch (error) {
      next(error);
    }
  },

  delete: async (req, res, next) => {
    try {
      const user = await prisma.user.findUnique({ where: { id: req.validatedParams.id } });
      if (!user) throw new NotFoundError('User');

      if (user.tenantId !== req.user.tenantId && req.user.role !== 'OWNER') {
        throw new ForbiddenError('Access denied');
      }

      if (user.id === req.user.id) {
        throw new AppError('Cannot delete yourself', 400, 'SELF_DELETE');
      }

      await prisma.user.delete({ where: { id: user.id } });

      res.json({ success: true, message: 'User deleted successfully' });
    } catch (error) {
      next(error);
    }
  },
};
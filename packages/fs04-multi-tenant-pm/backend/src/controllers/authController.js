import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../config/database.js';
import { config } from '../config/env.js';

export const authController = {
  register: async (req, res, next) => {
    try {
      const { email, password, firstName, lastName, tenantSlug, tenantName } = req.validatedBody;

      const existingUser = await prisma.user.findUnique({ where: { email } });
      if (existingUser) {
        return res.status(409).json({
          success: false,
          error: { code: 'DUPLICATE_ENTRY', message: 'Email already registered' },
        });
      }

      const existingTenant = await prisma.tenant.findUnique({ where: { slug: tenantSlug } });
      if (existingTenant) {
        return res.status(409).json({
          success: false,
          error: { code: 'DUPLICATE_ENTRY', message: 'Tenant slug already taken' },
        });
      }

      const passwordHash = await bcrypt.hash(password, config.bcrypt.saltRounds);

      const tenant = await prisma.tenant.create({
        data: {
          slug: tenantSlug,
          name: tenantName,
        },
      });

      const user = await prisma.user.create({
        data: {
          email,
          passwordHash,
          firstName,
          lastName,
          role: 'OWNER',
          tenantId: tenant.id,
        },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          tenantId: true,
          createdAt: true,
        },
      });

      const tokens = generateTokenPair(user);

      res.status(201).json({
        success: true,
        data: { user: sanitizeUser(user), tenant: { id: tenant.id, slug: tenant.slug, name: tenant.name }, ...tokens },
        message: 'Registration successful',
      });
    } catch (error) {
      next(error);
    }
  },

  login: async (req, res, next) => {
    try {
      const { email, password } = req.validatedBody;

      const user = await prisma.user.findUnique({
        where: { email },
        include: { tenant: { select: { id: true, slug: true, name: true, subscriptionTier: true } } },
      });

      if (!user) {
        return res.status(401).json({
          success: false,
          error: { code: 'INVALID_CREDENTIALS', message: 'Invalid credentials' },
        });
      }

      if (!user.isActive) {
        return res.status(401).json({
          success: false,
          error: { code: 'ACCOUNT_DEACTIVATED', message: 'Account is deactivated' },
        });
      }

      const isValid = await bcrypt.compare(password, user.passwordHash);
      if (!isValid) {
        return res.status(401).json({
          success: false,
          error: { code: 'INVALID_CREDENTIALS', message: 'Invalid credentials' },
        });
      }

      await prisma.user.update({
        where: { id: user.id },
        data: { lastLoginAt: new Date() },
      });

      const tokens = generateTokenPair(user);

      res.json({
        success: true,
        data: { user: sanitizeUser(user), tenant: user.tenant, ...tokens },
        message: 'Login successful',
      });
    } catch (error) {
      next(error);
    }
  },

  refresh: async (req, res, next) => {
    try {
      const { refreshToken } = req.validatedBody;

      let payload;
      try {
        payload = jwt.verify(refreshToken, config.jwt.secret);
      } catch {
        return res.status(401).json({
          success: false,
          error: { code: 'INVALID_REFRESH_TOKEN', message: 'Invalid refresh token' },
        });
      }

      if (payload.type !== 'refresh') {
        return res.status(401).json({
          success: false,
          error: { code: 'INVALID_TOKEN_TYPE', message: 'Invalid token type' },
        });
      }

      const user = await prisma.user.findUnique({
        where: { id: payload.userId },
        select: { id: true, email: true, role: true, isActive: true, tenantId: true },
      });

      if (!user || !user.isActive) {
        return res.status(401).json({
          success: false,
          error: { code: 'USER_NOT_FOUND', message: 'User not found or inactive' },
        });
      }

      const tokens = generateTokenPair(user);

      res.json({
        success: true,
        data: tokens,
        message: 'Token refreshed successfully',
      });
    } catch (error) {
      next(error);
    }
  },

  me: async (req, res, next) => {
    try {
      const user = await prisma.user.findUnique({
        where: { id: req.user.id },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          tenantId: true,
          avatar: true,
          timezone: true,
          locale: true,
          isActive: true,
          emailVerified: true,
          lastLoginAt: true,
          createdAt: true,
          tenant: { select: { id: true, slug: true, name: true, subscriptionTier: true } },
        },
      });

      if (!user) {
        return res.status(404).json({
          success: false,
          error: { code: 'USER_NOT_FOUND', message: 'User not found' },
        });
      }

      res.json({
        success: true,
        data: { user: sanitizeUser(user) },
      });
    } catch (error) {
      next(error);
    }
  },

  logout: async (req, res, next) => {
    try {
      res.json({
        success: true,
        message: 'Logged out successfully',
      });
    } catch (error) {
      next(error);
    }
  },
};

function generateAccessToken(user) {
  return jwt.sign(
    { userId: user.id, email: user.email, role: user.role, tenantId: user.tenantId },
    config.jwt.secret,
    { expiresIn: config.jwt.expiresIn }
  );
}

function generateRefreshToken(user) {
  return jwt.sign(
    { userId: user.id, type: 'refresh' },
    config.jwt.secret,
    { expiresIn: config.jwt.refreshExpiresIn }
  );
}

function generateTokenPair(user) {
  return {
    accessToken: generateAccessToken(user),
    refreshToken: generateRefreshToken(user),
  };
}

function sanitizeUser(user) {
  const { passwordHash, ...sanitized } = user;
  return sanitized;
}
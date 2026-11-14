import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../config/database.js';
import { config } from '../config/env.js';

export const authController = {
  register: async (req, res, next) => {
    try {
      const { email, password, firstName, lastName } = req.validatedBody;

      const existingUser = await prisma.user.findUnique({ where: { email } });
      if (existingUser) {
        return res.status(409).json({ success: false, error: { code: 'DUPLICATE_ENTRY', message: 'Email already registered' } });
      }

      const passwordHash = await bcrypt.hash(password, config.bcrypt.saltRounds);

      const user = await prisma.user.create({
        data: { email, passwordHash, firstName, lastName, color: getRandomColor() },
        select: { id: true, email: true, firstName: true, lastName: true, avatar: true, color: true, createdAt: true },
      });

      const personalWorkspace = await prisma.workspace.create({
        data: { name: 'Personal', slug: `personal-${user.id.slice(0, 8)}`, isPersonal: true, ownerId: user.id },
      });

      await prisma.workspaceMember.create({
        data: { userId: user.id, workspaceId: personalWorkspace.id, role: 'OWNER' },
      });

      const tokens = generateTokenPair(user);

      res.status(201).json({ success: true, data: { user: sanitizeUser(user), workspace: personalWorkspace, ...tokens }, message: 'Registration successful' });
    } catch (error) { next(error); }
  },

  login: async (req, res, next) => {
    try {
      const { email, password } = req.validatedBody;

      const user = await prisma.user.findUnique({ where: { email } });
      if (!user) throw new Error('Invalid credentials');
      if (!user.isActive) throw new Error('Account is deactivated');

      const isValid = await bcrypt.compare(password, user.passwordHash);
      if (!isValid) throw new Error('Invalid credentials');

      await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });

      const tokens = generateTokenPair(user);
      res.json({ success: true, data: { user: sanitizeUser(user), ...tokens }, message: 'Login successful' });
    } catch (error) { next(error); }
  },

  refresh: async (req, res, next) => {
    try {
      const { refreshToken } = req.validatedBody;
      let payload;
      try { payload = jwt.verify(refreshToken, config.jwt.secret); } catch { throw new Error('Invalid refresh token'); }
      if (payload.type !== 'refresh') throw new Error('Invalid token type');

      const user = await prisma.user.findUnique({ where: { id: payload.userId }, select: { id: true, email: true, role: true, isActive: true } });
      if (!user || !user.isActive) throw new Error('User not found or inactive');

      const tokens = generateTokenPair(user);
      res.json({ success: true, data: tokens, message: 'Token refreshed successfully' });
    } catch (error) { next(error); }
  },

  me: async (req, res, next) => {
    try {
      const user = await prisma.user.findUnique({
        where: { id: req.user.id },
        select: { id: true, email: true, firstName: true, lastName: true, avatar: true, color: true, timezone: true, locale: true, isActive: true, emailVerified: true, createdAt: true },
      });
      if (!user) throw new Error('User not found');
      res.json({ success: true, data: { user: sanitizeUser(user) } });
    } catch (error) { next(error); }
  },

  logout: async (req, res, next) => {
    try { res.json({ success: true, message: 'Logged out successfully' }); } catch (error) { next(error); }
  },
};

function generateAccessToken(user) {
  return jwt.sign({ userId: user.id, email: user.email, role: user.role }, config.jwt.secret, { expiresIn: config.jwt.expiresIn });
}

function generateRefreshToken(user) {
  return jwt.sign({ userId: user.id, type: 'refresh' }, config.jwt.secret, { expiresIn: config.jwt.refreshExpiresIn });
}

function generateTokenPair(user) {
  return { accessToken: generateAccessToken(user), refreshToken: generateRefreshToken(user) };
}

function sanitizeUser(user) {
  const { passwordHash, ...sanitized } = user;
  return sanitized;
}

function getRandomColor() {
  const colors = ['#ef4444', '#f97316', '#f59e0b', '#22c55e', '#10b981', '#06b6d4', '#3b82f6', '#6366f6', '#8b5cf6', '#d946ef', '#ec4899', '#f43f5e'];
  return colors[Math.floor(Math.random() * colors.length)];
}
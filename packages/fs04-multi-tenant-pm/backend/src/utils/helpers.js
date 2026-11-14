import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { config } from '../config/env.js';

export async function hashPassword(plainPassword) {
  return bcrypt.hash(plainPassword, config.bcrypt.saltRounds);
}

export async function verifyPassword(plainPassword, storedHash) {
  return bcrypt.compare(plainPassword, storedHash);
}

export function generateAccessToken(user) {
  return jwt.sign(
    { userId: user.id, email: user.email, role: user.role, tenantId: user.tenantId },
    config.jwt.secret,
    { expiresIn: config.jwt.expiresIn }
  );
}

export function generateRefreshToken(user) {
  return jwt.sign(
    { userId: user.id, type: 'refresh' },
    config.jwt.secret,
    { expiresIn: config.jwt.refreshExpiresIn }
  );
}

export function generateTokenPair(user) {
  return {
    accessToken: generateAccessToken(user),
    refreshToken: generateRefreshToken(user),
  };
}

export function sanitizeUser(user) {
  const { passwordHash, ...sanitized } = user;
  return sanitized;
}

export function paginate(page = 1, limit = 20) {
  const safePage = Math.max(1, parseInt(page, 10));
  const safeLimit = Math.min(100, Math.max(1, parseInt(limit, 10)));
  return {
    skip: (safePage - 1) * safeLimit,
    take: safeLimit,
    page: safePage,
    limit: safeLimit,
  };
}

export function buildPaginationMeta(count, page, limit) {
  const totalPages = Math.ceil(count / limit);
  return {
    currentPage: page,
    perPage: limit,
    totalItems: count,
    totalPages,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1,
  };
}
import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import { config } from '../config/env.js';
import { prisma } from '../config/database.js';

const userSockets = new Map();
const projectRooms = new Map();

export function setupSocket(io) {
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1];
      if (!token) return next(new Error('Authentication required'));

      const payload = jwt.verify(token, config.jwt.secret);
      const user = await prisma.user.findUnique({
        where: { id: payload.userId },
        select: { id: true, email: true, firstName: true, lastName: true, role: true, tenantId: true },
      });

      if (!user || !user.isActive) return next(new Error('User not found or inactive'));

      socket.user = user;
      next();
    } catch (error) {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    const { user } = socket;
    console.log(`User connected: ${user.email} (${socket.id})`);

    userSockets.set(user.id, socket.id);

    socket.on('join:project', (projectId) => {
      socket.join(`project:${projectId}`);
      projectRooms.set(socket.id, projectId);
      socket.to(`project:${projectId}`).emit('user:joined', { userId: user.id, name: `${user.firstName} ${user.lastName}` });
    });

    socket.on('leave:project', (projectId) => {
      socket.leave(`project:${projectId}`);
      projectRooms.delete(socket.id);
      socket.to(`project:${projectId}`).emit('user:left', { userId: user.id });
    });

    socket.on('issue:update', (data) => {
      socket.to(`project:${data.projectId}`).emit('issue:updated', { ...data, updatedBy: user.id });
    });

    socket.on('issue:create', (data) => {
      socket.to(`project:${data.projectId}`).emit('issue:created', { ...data, createdBy: user.id });
    });

    socket.on('issue:delete', (data) => {
      socket.to(`project:${data.projectId}`).emit('issue:deleted', { ...data, deletedBy: user.id });
    });

    socket.on('comment:create', (data) => {
      socket.to(`project:${data.projectId}`).emit('comment:created', { ...data, createdBy: user.id });
    });

    socket.on('comment:update', (data) => {
      socket.to(`project:${data.projectId}`).emit('comment:updated', { ...data, updatedBy: user.id });
    });

    socket.on('comment:delete', (data) => {
      socket.to(`project:${data.projectId}`).emit('comment:deleted', { ...data, deletedBy: user.id });
    });

    socket.on('sprint:update', (data) => {
      socket.to(`project:${data.projectId}`).emit('sprint:updated', data);
    });

    socket.on('board:update', (data) => {
      socket.to(`project:${data.projectId}`).emit('board:updated', data);
    });

    socket.on('column:update', (data) => {
      socket.to(`project:${data.projectId}`).emit('column:updated', data);
    });

    socket.on('issue:move', (data) => {
      socket.to(`project:${data.projectId}`).emit('issue:moved', { ...data, movedBy: user.id });
    });

    socket.on('typing:start', (data) => {
      socket.to(`project:${data.projectId}`).emit('user:typing', { userId: user.id, name: `${user.firstName} ${user.lastName}`, issueId: data.issueId });
    });

    socket.on('typing:stop', (data) => {
      socket.to(`project:${data.projectId}`).emit('user:stopped_typing', { userId: user.id, issueId: data.issueId });
    });

    socket.on('disconnect', () => {
      console.log(`User disconnected: ${user.email} (${socket.id})`);
      userSockets.delete(user.id);
      const projectId = projectRooms.get(socket.id);
      if (projectId) {
        socket.to(`project:${projectId}`).emit('user:left', { userId: user.id });
        projectRooms.delete(socket.id);
      }
    });
  });
}

export function emitToProject(io, projectId, event, data) {
  io.to(`project:${projectId}`).emit(event, data);
}

export function emitToUser(io, userId, event, data) {
  // In a production app, you'd track user socket connections
  // For now, we'll rely on project rooms
}
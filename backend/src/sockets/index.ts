import type { Server as HttpServer } from 'node:http';
import { Server, type Socket } from 'socket.io';
import { env } from '../config/env.js';
import { logger } from '../config/logger.js';
import { verifyAccessToken } from '../services/token.service.js';
import { bus, BOARD_EVENT, USER_EVENT, type BoardEvent, type UserEvent } from '../realtime/bus.js';

let io: Server | null = null;

interface SocketUser {
  id: string;
  email: string;
}

declare module 'socket.io' {
  interface Socket {
    user?: SocketUser;
  }
}

// Track who is viewing which board (in-memory; for multi-instance use Redis adapter)
const presence = new Map<string, Map<string, SocketUser>>(); // boardId -> userId -> user

function presenceList(boardId: string): SocketUser[] {
  return Array.from(presence.get(boardId)?.values() ?? []);
}

export function setupSockets(server: HttpServer): Server {
  io = new Server(server, {
    cors: { origin: env.CORS_ORIGIN.split(',').map((s) => s.trim()), credentials: true },
    path: '/realtime',
  });

  io.use((socket, next) => {
    try {
      const token =
        (socket.handshake.auth?.token as string | undefined) ??
        (socket.handshake.headers.authorization?.replace(/^Bearer\s+/, '') as string | undefined);
      if (!token) return next(new Error('unauthenticated'));
      const payload = verifyAccessToken(token);
      socket.user = { id: payload.sub, email: payload.email };
      next();
    } catch {
      next(new Error('unauthorized'));
    }
  });

  io.on('connection', (socket: Socket) => {
    const user = socket.user;
    if (!user) {
      socket.disconnect(true);
      return;
    }
    socket.join(`user:${user.id}`);

    socket.on('board.join', (boardId: string) => {
      if (typeof boardId !== 'string') return;
      socket.join(`board:${boardId}`);
      const m = presence.get(boardId) ?? new Map();
      m.set(user.id, user);
      presence.set(boardId, m);
      io?.to(`board:${boardId}`).emit('presence.update', { boardId, users: presenceList(boardId) });
    });

    socket.on('board.leave', (boardId: string) => {
      if (typeof boardId !== 'string') return;
      socket.leave(`board:${boardId}`);
      const m = presence.get(boardId);
      m?.delete(user.id);
      io?.to(`board:${boardId}`).emit('presence.update', { boardId, users: presenceList(boardId) });
    });

    socket.on('card.viewing', (payload: { boardId: string; cardId: string | null }) => {
      if (!payload?.boardId) return;
      io?.to(`board:${payload.boardId}`).emit('card.viewing', {
        userId: user.id,
        cardId: payload.cardId,
      });
    });

    socket.on('disconnect', () => {
      for (const [boardId, m] of presence.entries()) {
        if (m.delete(user.id)) {
          io?.to(`board:${boardId}`).emit('presence.update', {
            boardId,
            users: presenceList(boardId),
          });
        }
      }
    });
  });

  bus.on(BOARD_EVENT, (event: BoardEvent) => {
    io?.to(`board:${event.boardId}`).emit(event.type, event);
  });

  bus.on(USER_EVENT, (event: UserEvent) => {
    io?.to(`user:${event.userId}`).emit(event.type, event);
  });

  logger.info('socket.io listening at /realtime');
  return io;
}

export function getIO(): Server | null {
  return io;
}

import { io, type Socket } from 'socket.io-client';
import { getAccessToken } from './api';

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (socket && socket.connected) return socket;
  const url = process.env.NEXT_PUBLIC_SOCKET_URL ?? 'http://localhost:4000';
  socket = io(url, {
    path: '/realtime',
    transports: ['websocket'],
    autoConnect: true,
    auth: { token: getAccessToken() },
  });
  return socket;
}

export function disconnectSocket(): void {
  socket?.disconnect();
  socket = null;
}

export function joinBoard(boardId: string): void {
  getSocket().emit('board.join', boardId);
}

export function leaveBoard(boardId: string): void {
  getSocket().emit('board.leave', boardId);
}

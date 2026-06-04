import { io, type Socket } from 'socket.io-client';
import { getAccessToken } from './api';

let socket: Socket | null = null;

export function getSocket(): Socket {
  // Return the SAME instance for the app's lifetime and let socket.io manage
  // (re)connection internally. The old `socket.connected` guard recreated the
  // socket during any transient disconnect, orphaning every `.on()` listener
  // bound to the previous instance (so messages stopped arriving after a blip).
  if (socket) return socket;
  const url = process.env.NEXT_PUBLIC_SOCKET_URL ?? 'http://localhost:4000';
  socket = io(url, {
    path: '/realtime',
    transports: ['websocket'],
    autoConnect: true,
    // Read the token via a callback so every (re)connect handshake uses the
    // CURRENT access token — a fixed `auth` object would send a stale (possibly
    // expired) token on reconnect and fail auth.
    auth: (cb) => cb({ token: getAccessToken() ?? '' }),
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

export function joinChannel(channelId: string): void {
  getSocket().emit('channel.join', channelId);
}

export function leaveChannel(channelId: string): void {
  getSocket().emit('channel.leave', channelId);
}

export function emitTyping(channelId: string): void {
  getSocket().emit('channel.typing', { channelId });
}

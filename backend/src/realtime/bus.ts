import { EventEmitter } from 'node:events';

/**
 * In-process event bus used by services to publish domain events.
 * Subscribers: sockets (broadcast to rooms), automation engine (run rules),
 * future analytics, etc.
 */
class Bus extends EventEmitter {}
export const bus = new Bus();
bus.setMaxListeners(500);

export const BOARD_EVENT = 'board:event';
export const USER_EVENT = 'user:event';
export const CHANNEL_EVENT = 'channel:event';
export const WORKSPACE_EVENT = 'workspace:event';

export interface BoardEvent {
  boardId: string;
  type: string;
  actorId?: string;
  payload?: Record<string, unknown>;
}

export interface UserEvent {
  userId: string;
  type: string;
  payload?: Record<string, unknown>;
}

export interface ChannelEvent {
  channelId: string;
  type: string;
  actorId?: string;
  payload?: Record<string, unknown>;
}

export interface WorkspaceEvent {
  workspaceId: string;
  type: string;
  actorId?: string;
  payload?: Record<string, unknown>;
}

export function emitBoard(event: BoardEvent): void {
  bus.emit(BOARD_EVENT, event);
}

export function emitUser(event: UserEvent): void {
  bus.emit(USER_EVENT, event);
}

export function emitChannel(event: ChannelEvent): void {
  bus.emit(CHANNEL_EVENT, event);
}

export function emitWorkspace(event: WorkspaceEvent): void {
  bus.emit(WORKSPACE_EVENT, event);
}

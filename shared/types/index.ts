export type ID = string;

export type Role = 'owner' | 'admin' | 'member' | 'guest';
export type BoardRole = 'admin' | 'member' | 'observer';
export type Visibility = 'private' | 'workspace' | 'public';

export interface ApiError {
  error: { code: string; message: string; details?: unknown };
}

export interface Paginated<T> {
  items: T[];
  nextCursor?: string;
}

// Realtime event shapes emitted on the board:<id> Socket.IO room.

export interface BoardEventBase {
  boardId: string;
  type: string;
  actorId?: string;
  payload?: Record<string, unknown>;
}

export interface CardMovedPayload {
  cardId: string;
  fromList: string;
  toList: string;
  listId: string;
  position: number;
  clientEventId: string;
}

export interface ListMovedPayload {
  listId: string;
  prevId?: string | null;
  nextId?: string | null;
  position: number;
  clientEventId: string;
}

export interface NormalizedPayload {
  listId?: string;
  boardId?: string;
  clientEventId?: string;
}

export const REALTIME_EVENTS = {
  CARD_MOVED: 'card.moved',
  LIST_MOVED: 'list.moved',
  LIST_NORMALIZED: 'list.normalized',
  BOARD_NORMALIZED: 'board.normalized',
} as const;

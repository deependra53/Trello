import type { Request, Response, NextFunction } from 'express';
import { Workspace, type WorkspaceDoc, type WorkspaceRole } from '../models/workspace.model.js';
import { Board, type BoardDoc, type BoardRole } from '../models/board.model.js';
import { Channel, type ChannelDoc } from '../models/channel.model.js';
import { List } from '../models/list.model.js';
import { Card } from '../models/card.model.js';
import { Forbidden, NotFound } from '../utils/errors.js';
import type { AuthedRequest } from './auth.middleware.js';

export interface WorkspaceRequest extends AuthedRequest {
  workspace: WorkspaceDoc;
  workspaceRole: WorkspaceRole;
}

export interface BoardRequest extends AuthedRequest {
  board: BoardDoc;
  boardRole: BoardRole | 'workspace-member';
}

export interface ChannelRequest extends AuthedRequest {
  channel: ChannelDoc;
  isChannelMember: boolean;
}

export function workspaceMembership(doc: WorkspaceDoc, userId: string): WorkspaceRole | null {
  if (String(doc.ownerId) === userId) return 'owner';
  const m = doc.members?.find((mm) => String(mm.userId) === userId);
  return (m?.role as WorkspaceRole | undefined) ?? null;
}

export function boardMembership(
  board: BoardDoc,
  userId: string,
): BoardRole | null {
  const m = board.members?.find((mm) => String(mm.userId) === userId);
  return (m?.role as BoardRole | undefined) ?? null;
}

const ROLE_RANK_WS: Record<WorkspaceRole, number> = {
  owner: 3,
  admin: 2,
  member: 1,
  guest: 0,
};
const ROLE_RANK_BOARD: Record<BoardRole, number> = { admin: 2, member: 1, observer: 0 };

export const requireWorkspaceRole =
  (...allowed: WorkspaceRole[]) =>
  async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = req.params.workspaceId ?? req.params.id;
      if (!id) return next(NotFound('Workspace id required'));
      const ws = await Workspace.findById(id);
      if (!ws) return next(NotFound('Workspace not found'));
      const userId = (req as AuthedRequest).user.sub;
      const role = workspaceMembership(ws, userId);
      if (!role) return next(Forbidden('Not a workspace member'));
      const minRank = Math.min(...allowed.map((r) => ROLE_RANK_WS[r]));
      if (ROLE_RANK_WS[role] < minRank) return next(Forbidden('Insufficient workspace role'));
      (req as WorkspaceRequest).workspace = ws;
      (req as WorkspaceRequest).workspaceRole = role;
      next();
    } catch (err) {
      next(err);
    }
  };

export const requireBoardRole =
  (...allowed: BoardRole[]) =>
  async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = req.params.boardId ?? req.params.id;
      if (!id) return next(NotFound('Board id required'));
      const board = await Board.findById(id);
      if (!board) return next(NotFound('Board not found'));
      const userId = (req as AuthedRequest).user.sub;
      let role: BoardRole | null = boardMembership(board, userId);
      if (!role) {
        // No explicit board membership — derive access from the user's org role
        // and the board's visibility.
        const ws = await Workspace.findById(board.workspaceId);
        const wsRole = ws ? workspaceMembership(ws, userId) : null;
        if (wsRole === 'owner') {
          // The organization owner can always manage boards within their org.
          role = 'admin';
        } else if (board.visibility === 'workspace' && wsRole && wsRole !== 'guest') {
          // Workspace-visible boards are open to every full org member (not guests).
          role = 'member';
        } else if (board.visibility === 'public') {
          // Public boards: read-only "observer" for anyone with the link.
          role = 'observer';
        }
      }
      if (!role) return next(Forbidden('Not a board member'));
      const effectiveRole: BoardRole = role;
      const minRank = Math.min(...allowed.map((r) => ROLE_RANK_BOARD[r]));
      if (ROLE_RANK_BOARD[effectiveRole] < minRank)
        return next(Forbidden('Insufficient board role'));
      (req as BoardRequest).board = board;
      (req as BoardRequest).boardRole = effectiveRole;
      next();
    } catch (err) {
      next(err);
    }
  };

/**
 * Load a chat channel and verify the user can access it.
 * Members always pass; for public (non-private) channels, any org member passes
 * (so they can read/join). Private channels & DMs require explicit membership.
 */
export const requireChannelAccess =
  (opts: { allowPublicNonMember?: boolean } = {}) =>
  async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = req.params.channelId ?? req.params.id;
      if (!id) return next(NotFound('Channel id required'));
      const channel = await Channel.findById(id);
      if (!channel) return next(NotFound('Channel not found'));
      const userId = (req as AuthedRequest).user.sub;
      const member = channel.members?.some((m) => String(m.userId) === userId) ?? false;

      if (!member) {
        const publicChannel = channel.kind === 'channel' && !channel.isPrivate;
        if (!publicChannel || opts.allowPublicNonMember === false) {
          return next(Forbidden('You are not a member of this conversation'));
        }
        // Public channel: caller must be a full org member. Guests (e.g. someone
        // who joined via a board invite) have no chat access until an admin adds
        // them to a channel explicitly.
        const ws = await Workspace.findById(channel.workspaceId);
        const role = ws ? workspaceMembership(ws, userId) : null;
        if (!role || role === 'guest') {
          return next(Forbidden('You are not a member of this conversation'));
        }
      }

      (req as ChannelRequest).channel = channel;
      (req as ChannelRequest).isChannelMember = member;
      next();
    } catch (err) {
      next(err);
    }
  };

/**
 * Load list and attach its board, with the given board role check.
 * Use for routes like POST /api/lists/:listId/cards
 */
export const requireListAccess =
  (...allowed: BoardRole[]) =>
  async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      const listId = req.params.listId ?? req.params.id;
      if (!listId) return next(NotFound('List id required'));
      const list = await List.findById(listId);
      if (!list) return next(NotFound('List not found'));
      req.params.boardId = String(list.boardId);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (req as any).list = list;
      return requireBoardRole(...allowed)(req, _res, next);
    } catch (err) {
      next(err);
    }
  };

/**
 * Load card and attach its board, with the given board role check.
 */
export const requireCardAccess =
  (...allowed: BoardRole[]) =>
  async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      const cardId = req.params.cardId ?? req.params.id;
      if (!cardId) return next(NotFound('Card id required'));
      const card = await Card.findById(cardId);
      if (!card) return next(NotFound('Card not found'));
      req.params.boardId = String(card.boardId);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (req as any).card = card;
      return requireBoardRole(...allowed)(req, _res, next);
    } catch (err) {
      next(err);
    }
  };

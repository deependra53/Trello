import { Types } from 'mongoose';
import { Board, type BoardDoc } from '../models/board.model.js';
import { Workspace } from '../models/workspace.model.js';
import { User } from '../models/user.model.js';
import {
  BoardInvite,
  type BoardInviteDoc,
  type BoardInviteKind,
} from '../models/boardInvite.model.js';
import { generateOpaqueToken, hashToken } from './token.service.js';
import { sendBoardInviteEmail } from './email.service.js';
import { logActivity } from './activity.service.js';
import * as notificationService from './notification.service.js';
import { BadRequest, Conflict, NotFound } from '../utils/errors.js';
import { env } from '../config/env.js';

type BoardInviteRole = 'admin' | 'member' | 'observer';

const EMAIL_INVITE_TTL_MS = 14 * 24 * 60 * 60 * 1000; // 14 days

function joinUrl(token: string): string {
  // Land directly on the (themed) signup page so new collaborators get the full
  // "Join {board}" experience; already-signed-in users are auto-joined there.
  return `${env.APP_URL}/signup?boardInvite=${token}`;
}

export interface PublicBoardInvite {
  _id: string;
  email: string | null;
  role: BoardInviteRole;
  status: string;
  createdAt: Date | undefined;
}

function publicInvite(inv: BoardInviteDoc): PublicBoardInvite {
  return {
    _id: String(inv._id),
    email: inv.email ?? null,
    role: inv.role as BoardInviteRole,
    status: inv.status,
    createdAt: (inv as unknown as { createdAt?: Date }).createdAt,
  };
}

// --- Reusable share link ------------------------------------------------------

/** Fetch the board's active share link, if one exists (admin view). */
export async function getShareLink(
  boardId: string,
): Promise<{ enabled: boolean; token: string | null; url: string | null; role: BoardInviteRole }> {
  const link = await BoardInvite.findOne({ boardId, kind: 'link', status: 'pending' }).lean();
  if (!link || !link.token) {
    return { enabled: false, token: null, url: null, role: 'member' };
  }
  return {
    enabled: true,
    token: link.token,
    url: joinUrl(link.token),
    role: (link.role ?? 'member') as BoardInviteRole,
  };
}

/**
 * Enable the share link (idempotent) or rotate it. Returns the active link.
 * Rotating revokes the old token so previously-shared links stop working.
 */
export async function enableShareLink(
  boardId: string,
  inviterId: string,
  opts: { regenerate?: boolean; role?: BoardInviteRole } = {},
): Promise<{ enabled: boolean; token: string; url: string; role: BoardInviteRole }> {
  const board = await Board.findById(boardId).select('workspaceId').lean();
  if (!board) throw NotFound('Board not found');

  const existing = await BoardInvite.findOne({ boardId, kind: 'link', status: 'pending' });
  if (existing && !opts.regenerate) {
    if (opts.role && opts.role !== existing.role) {
      existing.role = opts.role;
      await existing.save();
    }
    const token = existing.token as string;
    return { enabled: true, token, url: joinUrl(token), role: existing.role as BoardInviteRole };
  }

  if (existing) {
    existing.status = 'revoked';
    await existing.save();
  }

  const token = generateOpaqueToken(24);
  const created = await BoardInvite.create({
    boardId: new Types.ObjectId(boardId),
    workspaceId: board.workspaceId,
    kind: 'link' as BoardInviteKind,
    role: opts.role ?? existing?.role ?? 'member',
    token,
    invitedBy: new Types.ObjectId(inviterId),
    status: 'pending',
    expiresAt: null,
  });
  return { enabled: true, token, url: joinUrl(token), role: created.role as BoardInviteRole };
}

/** Turn the share link off — any previously-shared URL stops working. */
export async function disableShareLink(boardId: string): Promise<void> {
  await BoardInvite.updateMany(
    { boardId, kind: 'link', status: 'pending' },
    { $set: { status: 'revoked' } },
  );
}

// --- Per-email invites --------------------------------------------------------

/** Create (or refresh) a pending email invite and send the join link. */
export async function createEmailInvite(
  boardId: string,
  email: string,
  role: BoardInviteRole,
  inviterId: string,
): Promise<{ invite: PublicBoardInvite; token: string }> {
  const board = await Board.findById(boardId).select('workspaceId title members').lean();
  if (!board) throw NotFound('Board not found');

  // If they already have an account and are already on the board, there's nothing to do.
  const existingUser = await User.findOne({ email }).select('_id').lean();
  if (
    existingUser &&
    (board.members ?? []).some((m) => String(m.userId) === String(existingUser._id))
  ) {
    throw Conflict('That person is already a member of this board');
  }

  const token = generateOpaqueToken(24);
  const tokenHash = hashToken(token);
  const expiresAt = new Date(Date.now() + EMAIL_INVITE_TTL_MS);

  const invite = await BoardInvite.findOneAndUpdate(
    { boardId, email, kind: 'email', status: 'pending' },
    {
      $set: { role, tokenHash, invitedBy: new Types.ObjectId(inviterId), expiresAt },
      $setOnInsert: {
        boardId: new Types.ObjectId(boardId),
        workspaceId: board.workspaceId,
        email,
        kind: 'email',
        status: 'pending',
      },
    },
    { new: true, upsert: true, setDefaultsOnInsert: true },
  );

  const inviter = await User.findById(inviterId).select('fullName').lean();
  sendBoardInviteEmail(email, board.title, inviter?.fullName ?? 'Someone', joinUrl(token)).catch(
    () => undefined,
  );

  return { invite: publicInvite(invite as BoardInviteDoc), token };
}

export async function listEmailInvites(boardId: string): Promise<PublicBoardInvite[]> {
  const invites = await BoardInvite.find({ boardId, kind: 'email', status: 'pending' })
    .sort({ createdAt: -1 })
    .lean();
  return invites.map((i) => publicInvite(i as unknown as BoardInviteDoc));
}

export async function revokeEmailInvite(boardId: string, inviteId: string): Promise<void> {
  await BoardInvite.updateOne(
    { _id: inviteId, boardId, kind: 'email' },
    { $set: { status: 'revoked' } },
  );
}

// --- Accept / preview ---------------------------------------------------------

async function findValidInviteByToken(token: string): Promise<BoardInviteDoc | null> {
  // Share links store the raw token; per-email invites store a hash.
  const link = await BoardInvite.findOne({ token, kind: 'link', status: 'pending' });
  if (link) return link;
  const email = await BoardInvite.findOne({ tokenHash: hashToken(token), kind: 'email', status: 'pending' });
  if (!email) return null;
  if (email.expiresAt && email.expiresAt.getTime() < Date.now()) return null;
  return email;
}

/** Public preview so the join page can show what the user is joining, pre-login. */
export async function previewInvite(token: string): Promise<{
  valid: true;
  boardId: string;
  boardTitle: string;
  invitedBy: string;
  email: string | null;
} | null> {
  const invite = await findValidInviteByToken(token);
  if (!invite) return null;
  const [board, inviter] = await Promise.all([
    Board.findById(invite.boardId).select('title').lean(),
    User.findById(invite.invitedBy).select('fullName').lean(),
  ]);
  if (!board) return null;
  return {
    valid: true,
    boardId: String(invite.boardId),
    boardTitle: board.title,
    invitedBy: inviter?.fullName ?? 'Someone',
    // Prefill the email for per-email invites; share links carry no address.
    email: invite.kind === 'email' ? (invite.email ?? null) : null,
  };
}

/**
 * Add the authenticated user to the invited board (and, if they aren't already in
 * the board's organization, attach them as a guest so the board loads). Works
 * whether or not the user belongs to the org. Idempotent.
 */
export async function acceptInvite(
  token: string,
  userId: string,
): Promise<{ boardId: string; boardTitle: string; workspaceId: string }> {
  const invite = await findValidInviteByToken(token);
  if (!invite) throw BadRequest('This invite link is invalid, expired, or has been turned off');

  const board = await Board.findById(invite.boardId);
  if (!board) throw NotFound('Board not found');

  const role = (invite.role ?? 'member') as BoardInviteRole;
  const alreadyOnBoard = board.members?.some((m) => String(m.userId) === userId);
  if (!alreadyOnBoard) {
    board.members?.push({ userId: new Types.ObjectId(userId), role, joinedAt: new Date() });
    await board.save();
    await logActivity({
      boardId: board._id,
      actorId: userId,
      type: 'board.member.added',
      payload: { userId, role, via: invite.kind },
    });
    // Let the inviter know their invite landed (best-effort).
    if (String(invite.invitedBy) !== userId) {
      const joiner = await User.findById(userId).select('fullName').lean();
      notificationService
        .create({
          userId: String(invite.invitedBy),
          actorId: userId,
          type: 'board.member.joined',
          title: `${joiner?.fullName ?? 'Someone'} joined "${board.title}"`,
          body: `They accepted your invite to the board "${board.title}".`,
          link: `/boards/${String(board._id)}`,
        })
        .catch(() => undefined);
    }
  }

  // Ensure org access — outside collaborators join the workspace as guests.
  await ensureWorkspaceGuest(invite.workspaceId, userId, invite.invitedBy);

  // Per-email invites are single-use; the reusable share link stays active.
  if (invite.kind === 'email') {
    invite.status = 'accepted';
    await invite.save();
  }

  return {
    boardId: String(board._id),
    boardTitle: board.title,
    workspaceId: String(board.workspaceId),
  };
}

async function ensureWorkspaceGuest(
  workspaceId: BoardDoc['workspaceId'],
  userId: string,
  invitedBy: BoardInviteDoc['invitedBy'],
): Promise<void> {
  const ws = await Workspace.findById(workspaceId);
  if (!ws) return;
  if (String(ws.ownerId) === userId) return;
  if (ws.members?.some((m) => String(m.userId) === userId)) return;
  ws.members?.push({
    userId: new Types.ObjectId(userId),
    role: 'guest',
    invitedBy: invitedBy ? new Types.ObjectId(String(invitedBy)) : new Types.ObjectId(userId),
    joinedAt: new Date(),
  });
  await ws.save();
}

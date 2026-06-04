import { Types } from 'mongoose';
import { Board } from '../models/board.model.js';
import { Workspace } from '../models/workspace.model.js';
import { List } from '../models/list.model.js';
import { Card } from '../models/card.model.js';
import { Label } from '../models/label.model.js';
import { User } from '../models/user.model.js';
import { NotFound } from '../utils/errors.js';
import { logActivity } from './activity.service.js';
import * as notificationService from './notification.service.js';
import { sendBoardAddedEmail } from './email.service.js';
import { env } from '../config/env.js';

interface CreateBoardInput {
  workspaceId: string;
  title: string;
  description?: string;
  background?: { type: 'color' | 'image' | 'gradient'; value: string };
  visibility?: 'private' | 'workspace' | 'public';
  creatorId: string;
}

/**
 * Enrich lean board docs with a live `cardCount` (non-archived cards) using a
 * single grouped query rather than one count per board, so a board picker can
 * show how much work each board holds.
 */
async function attachCardCounts<T extends { _id: unknown }>(
  boards: T[],
): Promise<Array<T & { cardCount: number }>> {
  if (boards.length === 0) return [];
  const counts = await Card.aggregate<{ _id: Types.ObjectId; count: number }>([
    { $match: { boardId: { $in: boards.map((b) => b._id) }, archived: { $ne: true } } },
    { $group: { _id: '$boardId', count: { $sum: 1 } } },
  ]);
  const byId = new Map(counts.map((c) => [String(c._id), c.count]));
  return boards.map((b) => ({ ...b, cardCount: byId.get(String(b._id)) ?? 0 }));
}

export async function listForWorkspace(workspaceId: string, userId: string) {
  // Users always see boards they've been explicitly added to. Full org members
  // (owner/admin/member — not guests) additionally see boards shared with the
  // whole workspace, so an org invite grants access to workspace-visible boards.
  const ws = await Workspace.findById(workspaceId).select('ownerId members').lean();
  const role =
    ws && String(ws.ownerId) === userId
      ? 'owner'
      : ws?.members?.find((m) => String(m.userId) === userId)?.role ?? null;
  const fullMember = role === 'owner' || role === 'admin' || role === 'member';

  const boards = await Board.find({
    workspaceId,
    closed: false,
    $or: fullMember
      ? [{ 'members.userId': userId }, { visibility: 'workspace' }]
      : [{ 'members.userId': userId }],
  })
    .sort({ lastActivityAt: -1 })
    .lean();

  return attachCardCounts(boards);
}

/**
 * Boards in a workspace the user can ADD CARDS to (effective board role
 * admin/member — observers excluded). Used by the "Add message to board"
 * picker so we never offer a board the user can't actually write to.
 */
export async function listWritableForWorkspace(workspaceId: string, userId: string) {
  const ws = await Workspace.findById(workspaceId).select('ownerId members').lean();
  const role =
    ws && String(ws.ownerId) === userId
      ? 'owner'
      : ws?.members?.find((m) => String(m.userId) === userId)?.role ?? null;
  const fullMember = role === 'owner' || role === 'admin' || role === 'member';

  const boards = await Board.find({
    workspaceId,
    closed: false,
    $or: fullMember
      ? [{ 'members.userId': userId }, { visibility: 'workspace' }]
      : [{ 'members.userId': userId }],
  })
    .sort({ lastActivityAt: -1 })
    .lean();

  // Mirror requireBoardRole's effective-role rules, then keep only writers.
  return boards.filter((b) => {
    const m = b.members?.find((mm) => String(mm.userId) === userId);
    if (m) return m.role === 'admin' || m.role === 'member';
    if (role === 'owner') return true; // org owner ⇒ board admin
    if (b.visibility === 'workspace' && fullMember) return true; // ⇒ board member
    return false; // public-only ⇒ observer (read-only)
  });
}

export async function create(input: CreateBoardInput) {
  const board = await Board.create({
    workspaceId: input.workspaceId,
    title: input.title,
    description: input.description ?? '',
    background: input.background ?? { type: 'color', value: '#0079bf' },
    // Boards are private by default — only explicitly-added members can see them.
    visibility: input.visibility ?? 'private',
    members: [{ userId: new Types.ObjectId(input.creatorId), role: 'admin', joinedAt: new Date() }],
    lastActivityAt: new Date(),
  });
  await logActivity({ boardId: board._id, actorId: input.creatorId, type: 'board.created' });
  return board;
}

export async function getById(id: string) {
  const board = await Board.findById(id);
  if (!board) throw NotFound('Board not found');
  return board;
}

export async function getFull(id: string) {
  const board = await Board.findById(id).lean();
  if (!board) throw NotFound('Board not found');
  const memberIds = (board.members ?? []).map((m) => m.userId);
  const [lists, cards, labels, memberDocs] = await Promise.all([
    List.find({ boardId: id, archived: false }).sort({ position: 1 }).lean(),
    Card.find({ boardId: id, archived: false }).sort({ position: 1 }).lean(),
    Label.find({ boardId: id }).lean(),
    memberIds.length
      ? User.find({ _id: { $in: memberIds } })
          .select('fullName email avatarUrl')
          .lean()
      : Promise.resolve([] as Array<{ _id: unknown; fullName: string; email: string; avatarUrl?: string }>),
  ]);
  const memberProfiles = memberDocs.map((u) => ({
    _id: String(u._id),
    fullName: u.fullName,
    email: u.email,
    avatarUrl: u.avatarUrl,
  }));
  return { ...board, lists, cards, labels, memberProfiles };
}

export async function update(id: string, patch: Record<string, unknown>, actorId: string) {
  const board = await Board.findByIdAndUpdate(id, { $set: patch }, { new: true });
  if (!board) throw NotFound('Board not found');
  await logActivity({ boardId: board._id, actorId, type: 'board.updated', payload: patch });
  return board;
}

export async function remove(id: string, actorId: string) {
  await Card.deleteMany({ boardId: id });
  await List.deleteMany({ boardId: id });
  await Label.deleteMany({ boardId: id });
  await Board.findByIdAndDelete(id);
  await logActivity({ boardId: new Types.ObjectId(id), actorId, type: 'board.deleted' });
}

export async function star(id: string, userId: string) {
  const board = await getById(id);
  const has = board.starredBy?.some((u) => String(u) === userId);
  if (has) {
    board.starredBy = board.starredBy?.filter((u) => String(u) !== userId);
  } else {
    board.starredBy?.push(new Types.ObjectId(userId));
  }
  await board.save();
  return { starred: !has };
}

export async function copy(
  sourceId: string,
  opts: { title: string; workspaceId?: string; keepCards: boolean; creatorId: string },
) {
  const src = await getById(sourceId);
  const board = await Board.create({
    workspaceId: opts.workspaceId ?? src.workspaceId,
    title: opts.title,
    description: src.description,
    background: src.background,
    visibility: src.visibility,
    members: [
      { userId: new Types.ObjectId(opts.creatorId), role: 'admin', joinedAt: new Date() },
    ],
    customFields: src.customFields,
    lastActivityAt: new Date(),
  });

  const srcLists = await List.find({ boardId: src._id, archived: false })
    .sort({ position: 1 })
    .lean();
  const listMap = new Map<string, Types.ObjectId>();
  for (const l of srcLists) {
    const created = await List.create({
      boardId: board._id,
      title: l.title,
      position: l.position,
      color: l.color,
    });
    listMap.set(String(l._id), created._id);
  }

  if (opts.keepCards) {
    const srcCards = await Card.find({ boardId: src._id, archived: false }).lean();
    for (const c of srcCards) {
      const newListId = listMap.get(String(c.listId));
      if (!newListId) continue;
      await Card.create({
        listId: newListId,
        boardId: board._id,
        title: c.title,
        description: c.description,
        position: c.position,
        checklists: c.checklists,
        cover: c.cover,
        startDate: c.startDate,
        dueDate: c.dueDate,
      });
    }
  }
  return board;
}

export async function close(id: string, actorId: string) {
  return update(id, { closed: true }, actorId);
}

export async function addMember(
  id: string,
  userId: string,
  role: 'admin' | 'member' | 'observer',
  actorId: string,
) {
  const board = await getById(id);
  if (board.members?.some((m) => String(m.userId) === userId)) {
    return board;
  }
  board.members?.push({
    userId: new Types.ObjectId(userId),
    role,
    joinedAt: new Date(),
  });
  await board.save();
  await logActivity({
    boardId: board._id,
    actorId,
    type: 'board.member.added',
    payload: { userId, role },
  });
  // Let the added member know — in-app notification + email (skip self-adds).
  if (userId !== actorId) {
    const [actor, user] = await Promise.all([
      User.findById(actorId).select('fullName').lean(),
      User.findById(userId).select('fullName email').lean(),
    ]);
    if (user) {
      const actorName = actor?.fullName ?? 'Someone';
      const link = `/boards/${String(board._id)}`;
      await notificationService.create({
        userId,
        actorId,
        type: 'board.added',
        title: `${actorName} added you to "${board.title}"`,
        body: `You now have access to the board "${board.title}".`,
        link,
      });
      sendBoardAddedEmail(
        user.email,
        user.fullName,
        board.title,
        actorName,
        `${env.APP_URL}${link}`,
      ).catch(() => undefined);
    }
  }
  return board;
}

export async function updateMember(
  id: string,
  userId: string,
  role: 'admin' | 'member' | 'observer',
) {
  const board = await getById(id);
  const m = board.members?.find((mm) => String(mm.userId) === userId);
  if (!m) throw NotFound('Member not found');
  m.role = role;
  await board.save();
  return board;
}

export async function removeMember(id: string, userId: string, actorId: string) {
  await Board.updateOne(
    { _id: id },
    { $pull: { members: { userId: new Types.ObjectId(userId) } } },
  );
  await logActivity({
    boardId: new Types.ObjectId(id),
    actorId,
    type: 'board.member.removed',
    payload: { userId },
  });
  return getById(id);
}

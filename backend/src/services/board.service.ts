import { Types } from 'mongoose';
import { Board } from '../models/board.model.js';
import { List } from '../models/list.model.js';
import { Card } from '../models/card.model.js';
import { Label } from '../models/label.model.js';
import { NotFound } from '../utils/errors.js';
import { logActivity } from './activity.service.js';

interface CreateBoardInput {
  workspaceId: string;
  title: string;
  description?: string;
  background?: { type: 'color' | 'image' | 'gradient'; value: string };
  visibility?: 'private' | 'workspace' | 'public';
  creatorId: string;
}

export async function listForWorkspace(workspaceId: string, userId: string) {
  return Board.find({
    workspaceId,
    closed: false,
    $or: [
      { visibility: { $in: ['workspace', 'public'] } },
      { 'members.userId': userId },
    ],
  })
    .sort({ lastActivityAt: -1 })
    .lean();
}

export async function create(input: CreateBoardInput) {
  const board = await Board.create({
    workspaceId: input.workspaceId,
    title: input.title,
    description: input.description ?? '',
    background: input.background ?? { type: 'color', value: '#0079bf' },
    visibility: input.visibility ?? 'workspace',
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
  const [lists, cards, labels] = await Promise.all([
    List.find({ boardId: id, archived: false }).sort({ position: 1 }).lean(),
    Card.find({ boardId: id, archived: false }).sort({ position: 1 }).lean(),
    Label.find({ boardId: id }).lean(),
  ]);
  return { ...board, lists, cards, labels };
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

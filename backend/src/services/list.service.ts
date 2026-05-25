import { Types } from 'mongoose';
import { List } from '../models/list.model.js';
import { Card } from '../models/card.model.js';
import { BadRequest, NotFound } from '../utils/errors.js';
import {
  computeBetween,
  needsNormalize,
  normalizeListsInBoard,
  STEP,
} from '../utils/ordering.js';
import { logActivity } from './activity.service.js';
import { emitBoard } from '../realtime/bus.js';

export async function listForBoard(boardId: string) {
  return List.find({ boardId, archived: false }).sort({ position: 1 }).lean();
}

export async function getById(id: string) {
  const list = await List.findById(id);
  if (!list) throw NotFound('List not found');
  return list;
}

export async function create(
  boardId: string,
  title: string,
  position: number | undefined,
  actorId: string,
) {
  const pos = position ?? (await nextPosition(boardId));
  const list = await List.create({ boardId, title, position: pos });
  await logActivity({
    boardId,
    listId: list._id,
    actorId,
    type: 'list.created',
    payload: { title },
  });
  return list;
}

export async function update(id: string, patch: Record<string, unknown>, actorId: string) {
  const list = await List.findByIdAndUpdate(id, { $set: patch }, { new: true });
  if (!list) throw NotFound('List not found');
  await logActivity({
    boardId: list.boardId,
    listId: list._id,
    actorId,
    type: 'list.updated',
    payload: patch,
  });
  return list;
}

export async function remove(id: string, actorId: string) {
  const list = await getById(id);
  await Card.deleteMany({ listId: id });
  await List.findByIdAndDelete(id);
  await logActivity({ boardId: list.boardId, actorId, type: 'list.deleted', payload: { id } });
}

export async function move(
  id: string,
  prevId: string | null | undefined,
  nextId: string | null | undefined,
  clientEventId: string,
  actorId: string,
) {
  const list = await getById(id);

  if (prevId === id || nextId === id) {
    throw BadRequest('A list cannot be its own neighbor');
  }

  const readNeighborPos = async (neighborId: string | null | undefined) => {
    if (!neighborId) return null;
    const n = await List.findById(neighborId).lean();
    if (!n) throw BadRequest('Neighbor list not found');
    if (String(n.boardId) !== String(list.boardId)) {
      throw BadRequest('Neighbor is not on the same board');
    }
    return n.position ?? null;
  };

  let prevPos = await readNeighborPos(prevId);
  let nextPos = await readNeighborPos(nextId);

  let normalized = false;
  if (needsNormalize(prevPos, nextPos)) {
    await normalizeListsInBoard(String(list.boardId));
    prevPos = await readNeighborPos(prevId);
    nextPos = await readNeighborPos(nextId);
    normalized = true;
  }
  list.position = computeBetween(prevPos, nextPos);
  await list.save();

  await logActivity({
    boardId: list.boardId,
    listId: list._id,
    actorId,
    type: 'list.moved',
    payload: { prevId, nextId, position: list.position, clientEventId },
  });

  if (normalized) {
    emitBoard({
      boardId: String(list.boardId),
      type: 'board.normalized',
      actorId,
      payload: { boardId: String(list.boardId), clientEventId },
    });
  }
  return list;
}

export async function copy(id: string, title: string | undefined, actorId: string) {
  const src = await getById(id);
  const list = await List.create({
    boardId: src.boardId,
    title: title ?? `${src.title} (Copy)`,
    position: src.position + 1,
    color: src.color,
  });
  const srcCards = await Card.find({ listId: src._id, archived: false }).lean();
  for (const c of srcCards) {
    await Card.create({
      boardId: src.boardId,
      listId: list._id,
      title: c.title,
      description: c.description,
      position: c.position,
      labels: c.labels,
    });
  }
  await logActivity({
    boardId: src.boardId,
    listId: list._id,
    actorId,
    type: 'list.copied',
    payload: { sourceId: src._id },
  });
  return list;
}

export async function archive(id: string, actorId: string) {
  return update(id, { archived: true }, actorId);
}

async function nextPosition(boardId: string): Promise<number> {
  const last = await List.findOne({ boardId })
    .sort({ position: -1 })
    .select('position')
    .lean();
  return (last?.position ?? 0) + STEP;
}

export const _internal = { nextPosition };
export type ListId = Types.ObjectId;

import crypto from 'node:crypto';
import { Types } from 'mongoose';
import { Card } from '../models/card.model.js';
import { List } from '../models/list.model.js';
import { Comment } from '../models/comment.model.js';
import { Notification } from '../models/notification.model.js';
import { BadRequest, NotFound } from '../utils/errors.js';
import { computePosition } from '../utils/position.js';
import { logActivity } from './activity.service.js';

export async function getById(id: string) {
  const card = await Card.findById(id);
  if (!card) throw NotFound('Card not found');
  return card;
}

export async function create(
  listId: string,
  title: string,
  description: string,
  position: number | undefined,
  actorId: string,
) {
  const list = await List.findById(listId);
  if (!list) throw NotFound('List not found');
  const pos = position ?? (await nextPosition(listId));
  const card = await Card.create({
    listId,
    boardId: list.boardId,
    title,
    description,
    position: pos,
    watchers: [actorId],
  });
  await logActivity({
    boardId: card.boardId,
    listId: card.listId,
    cardId: card._id,
    actorId,
    type: 'card.created',
    payload: { title },
  });
  return card;
}

export async function update(id: string, patch: Record<string, unknown>, actorId: string) {
  // Normalize date strings to Date
  if (patch.dueDate && typeof patch.dueDate === 'string') {
    patch.dueDate = new Date(patch.dueDate);
  }
  if (patch.startDate && typeof patch.startDate === 'string') {
    patch.startDate = new Date(patch.startDate);
  }
  if (patch.dueComplete === true) patch.completedAt = new Date();
  const card = await Card.findByIdAndUpdate(id, { $set: patch }, { new: true });
  if (!card) throw NotFound('Card not found');
  await logActivity({
    boardId: card.boardId,
    listId: card.listId,
    cardId: card._id,
    actorId,
    type: 'card.updated',
    payload: patch,
  });
  return card;
}

export async function remove(id: string, actorId: string) {
  const card = await getById(id);
  await Comment.deleteMany({ cardId: id });
  await Card.findByIdAndDelete(id);
  await logActivity({
    boardId: card.boardId,
    listId: card.listId,
    actorId,
    type: 'card.deleted',
    payload: { id, title: card.title },
  });
}

export async function move(
  id: string,
  opts: {
    listId?: string;
    boardId?: string;
    prevId?: string | null;
    nextId?: string | null;
    actorId: string;
  },
) {
  const card = await getById(id);
  const fromList = card.listId;
  if (opts.listId) card.listId = new Types.ObjectId(opts.listId);
  if (opts.boardId) card.boardId = new Types.ObjectId(opts.boardId);
  const targetList = String(card.listId);
  const prevPos = opts.prevId
    ? (await Card.findById(opts.prevId).lean())?.position ?? null
    : null;
  const nextPos = opts.nextId
    ? (await Card.findById(opts.nextId).lean())?.position ?? null
    : null;
  if (prevPos == null && nextPos == null) {
    card.position = await nextPosition(targetList);
  } else {
    card.position = computePosition(prevPos, nextPos);
  }
  await card.save();
  await logActivity({
    boardId: card.boardId,
    cardId: card._id,
    listId: card.listId,
    actorId: opts.actorId,
    type: 'card.moved',
    payload: { fromList: String(fromList), toList: String(card.listId) },
  });
  return card;
}

export async function copy(
  id: string,
  opts: {
    title?: string;
    listId?: string;
    keepChecklists: boolean;
    keepLabels: boolean;
    keepMembers: boolean;
    actorId: string;
  },
) {
  const src = await getById(id);
  const targetList = opts.listId ?? String(src.listId);
  const list = await List.findById(targetList);
  if (!list) throw NotFound('Target list not found');
  const card = await Card.create({
    listId: targetList,
    boardId: list.boardId,
    title: opts.title ?? `${src.title} (Copy)`,
    description: src.description,
    position: await nextPosition(targetList),
    labels: opts.keepLabels ? src.labels : [],
    members: opts.keepMembers ? src.members : [],
    checklists: opts.keepChecklists ? src.checklists : [],
    cover: src.cover,
    watchers: [opts.actorId],
  });
  await logActivity({
    boardId: card.boardId,
    cardId: card._id,
    actorId: opts.actorId,
    type: 'card.copied',
    payload: { sourceId: src._id },
  });
  return card;
}

export async function archive(id: string, actorId: string) {
  return update(id, { archived: true }, actorId);
}

export async function mirror(id: string, targetListId: string, actorId: string) {
  const src = await getById(id);
  const list = await List.findById(targetListId);
  if (!list) throw NotFound('Target list not found');
  const mirror = await Card.create({
    listId: targetListId,
    boardId: list.boardId,
    title: src.title,
    description: src.description,
    position: await nextPosition(targetListId),
    mirrorOf: src._id,
    cover: src.cover,
  });
  await Card.updateOne({ _id: src._id }, { $push: { mirrors: mirror._id } });
  await logActivity({
    boardId: mirror.boardId,
    cardId: mirror._id,
    actorId,
    type: 'card.mirrored',
    payload: { sourceId: src._id },
  });
  return mirror;
}

// ---- Members & labels --------------------------------------------------------

async function toggleObjectIdField(
  cardId: string,
  field: 'members' | 'labels' | 'watchers' | 'votes',
  id: string,
) {
  const card = await getById(cardId);
  const arr = (card.get(field) ?? []) as Types.ObjectId[];
  const has = arr.some((v) => String(v) === id);
  const update = has
    ? { $pull: { [field]: new Types.ObjectId(id) } }
    : { $addToSet: { [field]: new Types.ObjectId(id) } };
  await Card.updateOne({ _id: cardId }, update);
  return { card, has };
}

export async function toggleMember(id: string, userId: string, actorId: string) {
  const { card, has } = await toggleObjectIdField(id, 'members', userId);
  await logActivity({
    boardId: card.boardId,
    cardId: card._id,
    actorId,
    type: has ? 'card.member.removed' : 'card.member.added',
    payload: { userId },
  });
  return getById(id);
}

export async function toggleLabel(id: string, labelId: string, actorId: string) {
  const { card, has } = await toggleObjectIdField(id, 'labels', labelId);
  await logActivity({
    boardId: card.boardId,
    cardId: card._id,
    actorId,
    type: has ? 'card.label.removed' : 'card.label.added',
    payload: { labelId },
  });
  return getById(id);
}

export async function toggleWatcher(id: string, userId: string) {
  const { has } = await toggleObjectIdField(id, 'watchers', userId);
  return { watching: !has };
}

export async function toggleVote(id: string, userId: string) {
  const { has } = await toggleObjectIdField(id, 'votes', userId);
  const fresh = await getById(id);
  return { voted: !has, count: fresh.votes?.length ?? 0 };
}

// ---- Checklists --------------------------------------------------------------

export async function addChecklist(
  id: string,
  title: string,
  position: number | undefined,
  actorId: string,
) {
  const card = await getById(id);
  const checklist = {
    id: crypto.randomUUID(),
    title,
    position: position ?? (card.checklists?.length ?? 0) * 65_536 + 65_536,
    items: [],
  };
  card.checklists?.push(checklist);
  await card.save();
  await logActivity({
    boardId: card.boardId,
    cardId: card._id,
    actorId,
    type: 'card.checklist.added',
    payload: { id: checklist.id, title },
  });
  return checklist;
}

export async function updateChecklist(
  cardId: string,
  checklistId: string,
  patch: { title?: string; position?: number },
) {
  const card = await getById(cardId);
  const cl = card.checklists?.find((c) => c.id === checklistId);
  if (!cl) throw NotFound('Checklist not found');
  if (patch.title !== undefined) cl.title = patch.title;
  if (patch.position !== undefined) cl.position = patch.position;
  await card.save();
  return cl;
}

export async function deleteChecklist(cardId: string, checklistId: string) {
  await Card.updateOne({ _id: cardId }, { $pull: { checklists: { id: checklistId } } });
}

export async function addChecklistItem(
  cardId: string,
  checklistId: string,
  input: { text: string; memberId?: string; dueDate?: string },
) {
  const card = await getById(cardId);
  const cl = card.checklists?.find((c) => c.id === checklistId);
  if (!cl) throw NotFound('Checklist not found');
  const item = {
    id: crypto.randomUUID(),
    text: input.text,
    completed: false,
    memberId: input.memberId ? new Types.ObjectId(input.memberId) : undefined,
    dueDate: input.dueDate ? new Date(input.dueDate) : undefined,
    position: (cl.items?.length ?? 0) * 65_536 + 65_536,
  };
  cl.items?.push(item);
  await card.save();
  return item;
}

export async function updateChecklistItem(
  cardId: string,
  itemId: string,
  patch: {
    text?: string;
    completed?: boolean;
    memberId?: string | null;
    dueDate?: string | null;
    position?: number;
  },
) {
  const card = await getById(cardId);
  let found = false;
  for (const cl of card.checklists ?? []) {
    const item = (cl.items ?? []).find((i) => i.id === itemId);
    if (!item) continue;
    if (patch.text !== undefined) item.text = patch.text;
    if (patch.completed !== undefined) item.completed = patch.completed;
    if (patch.memberId !== undefined)
      item.memberId = patch.memberId ? new Types.ObjectId(patch.memberId) : null;
    if (patch.dueDate !== undefined)
      item.dueDate = patch.dueDate ? new Date(patch.dueDate) : null;
    if (patch.position !== undefined) item.position = patch.position;
    found = true;
    break;
  }
  if (!found) throw NotFound('Checklist item not found');
  await card.save();
  return getById(cardId);
}

export async function deleteChecklistItem(cardId: string, itemId: string) {
  await Card.updateOne(
    { _id: cardId },
    { $pull: { 'checklists.$[].items': { id: itemId } } },
  );
}

// ---- Comments ----------------------------------------------------------------

export async function addComment(
  cardId: string,
  authorId: string,
  body: string,
  mentions: string[],
) {
  const card = await getById(cardId);
  const comment = await Comment.create({
    cardId,
    boardId: card.boardId,
    authorId,
    body,
    mentions,
  });
  await logActivity({
    boardId: card.boardId,
    cardId: card._id,
    actorId: authorId,
    type: 'card.comment.added',
    payload: { commentId: comment._id, body: body.slice(0, 200) },
  });
  // Notify mentioned users and watchers (excluding the commenter)
  const notifyUsers = new Set<string>();
  for (const m of mentions) notifyUsers.add(m);
  for (const w of card.watchers ?? []) {
    if (String(w) !== authorId) notifyUsers.add(String(w));
  }
  notifyUsers.delete(authorId);
  if (notifyUsers.size > 0) {
    await Notification.insertMany(
      [...notifyUsers].map((uid) => ({
        userId: uid,
        actorId: authorId,
        type: 'card.comment',
        title: `New comment on ${card.title}`,
        body: body.slice(0, 200),
        boardId: card.boardId,
        cardId: card._id,
        link: `/boards/${card.boardId}/c/${card._id}`,
      })),
    );
  }
  return comment;
}

export async function listComments(cardId: string, cursor?: string, limit = 30) {
  const q: Record<string, unknown> = { cardId };
  if (cursor) q.createdAt = { $lt: new Date(cursor) };
  const items = await Comment.find(q).sort({ createdAt: -1 }).limit(limit + 1).lean();
  const hasMore = items.length > limit;
  if (hasMore) items.pop();
  const last = items[items.length - 1];
  return {
    items,
    nextCursor: hasMore && last ? (last.createdAt as Date).toISOString() : undefined,
  };
}

export async function updateComment(commentId: string, authorId: string, body: string) {
  const comment = await Comment.findById(commentId);
  if (!comment) throw NotFound('Comment not found');
  if (String(comment.authorId) !== authorId) throw BadRequest('Cannot edit another user\'s comment');
  comment.body = body;
  comment.editedAt = new Date();
  await comment.save();
  return comment;
}

export async function deleteComment(commentId: string, userId: string) {
  const comment = await Comment.findById(commentId);
  if (!comment) throw NotFound('Comment not found');
  if (String(comment.authorId) !== userId) throw BadRequest('Cannot delete another user\'s comment');
  await comment.deleteOne();
}

export async function reactToComment(commentId: string, userId: string, emoji: string) {
  const comment = await Comment.findById(commentId);
  if (!comment) throw NotFound('Comment not found');
  const oid = new Types.ObjectId(userId);
  const existing = comment.reactions?.find((rr) => rr.emoji === emoji);
  if (!existing) {
    await Comment.updateOne(
      { _id: commentId },
      { $push: { reactions: { emoji, userIds: [oid] } } },
    );
  } else {
    const has = existing.userIds?.some((u) => String(u) === userId);
    if (has) {
      await Comment.updateOne(
        { _id: commentId, 'reactions.emoji': emoji },
        { $pull: { 'reactions.$.userIds': oid } },
      );
      // Garbage-collect empty reactions
      await Comment.updateOne(
        { _id: commentId },
        { $pull: { reactions: { emoji, userIds: { $size: 0 } } } },
      );
    } else {
      await Comment.updateOne(
        { _id: commentId, 'reactions.emoji': emoji },
        { $addToSet: { 'reactions.$.userIds': oid } },
      );
    }
  }
  return Comment.findById(commentId);
}

// ---- Helpers -----------------------------------------------------------------

async function nextPosition(listId: string): Promise<number> {
  const last = await Card.findOne({ listId })
    .sort({ position: -1 })
    .select('position')
    .lean();
  return (last?.position ?? 0) + 65_536;
}

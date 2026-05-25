import * as svc from '../services/card.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import type { BoardRequest } from '../middleware/authorize.middleware.js';

export const get = asyncHandler<BoardRequest>(async (req, res) => {
  const card = await svc.getById(req.params.id as string);
  res.json(card);
});

export const update = asyncHandler<BoardRequest>(async (req, res) => {
  const c = await svc.update(req.params.id as string, req.body, req.user.sub);
  res.json(c);
});

export const remove = asyncHandler<BoardRequest>(async (req, res) => {
  await svc.remove(req.params.id as string, req.user.sub);
  res.status(204).end();
});

export const move = asyncHandler<BoardRequest>(async (req, res) => {
  const body = req.body as {
    listId?: string;
    boardId?: string;
    prevId?: string | null;
    nextId?: string | null;
  };
  const c = await svc.move(req.params.id as string, { ...body, actorId: req.user.sub });
  res.json(c);
});

export const copy = asyncHandler<BoardRequest>(async (req, res) => {
  const body = req.body as {
    title?: string;
    listId?: string;
    keepChecklists: boolean;
    keepLabels: boolean;
    keepMembers: boolean;
  };
  const c = await svc.copy(req.params.id as string, { ...body, actorId: req.user.sub });
  res.status(201).json(c);
});

export const archive = asyncHandler<BoardRequest>(async (req, res) => {
  const c = await svc.archive(req.params.id as string, req.user.sub);
  res.json(c);
});

export const mirror = asyncHandler<BoardRequest>(async (req, res) => {
  const { listId } = req.body as { listId: string };
  const c = await svc.mirror(req.params.id as string, listId, req.user.sub);
  res.status(201).json(c);
});

export const toggleMember = asyncHandler<BoardRequest>(async (req, res) => {
  const { userId } = req.body as { userId: string };
  const c = await svc.toggleMember(req.params.id as string, userId, req.user.sub);
  res.json(c);
});

export const toggleLabel = asyncHandler<BoardRequest>(async (req, res) => {
  const { labelId } = req.body as { labelId: string };
  const c = await svc.toggleLabel(req.params.id as string, labelId, req.user.sub);
  res.json(c);
});

export const watch = asyncHandler<BoardRequest>(async (req, res) => {
  const r = await svc.toggleWatcher(req.params.id as string, req.user.sub);
  res.json(r);
});

export const vote = asyncHandler<BoardRequest>(async (req, res) => {
  const r = await svc.toggleVote(req.params.id as string, req.user.sub);
  res.json(r);
});

// Checklists
export const addChecklist = asyncHandler<BoardRequest>(async (req, res) => {
  const { title, position } = req.body as { title: string; position?: number };
  const cl = await svc.addChecklist(req.params.id as string, title, position, req.user.sub);
  res.status(201).json(cl);
});

export const updateChecklist = asyncHandler<BoardRequest>(async (req, res) => {
  const cl = await svc.updateChecklist(
    req.params.cardId as string,
    req.params.checklistId as string,
    req.body,
  );
  res.json(cl);
});

export const deleteChecklist = asyncHandler<BoardRequest>(async (req, res) => {
  await svc.deleteChecklist(req.params.cardId as string, req.params.checklistId as string);
  res.status(204).end();
});

export const addChecklistItem = asyncHandler<BoardRequest>(async (req, res) => {
  const item = await svc.addChecklistItem(
    req.params.cardId as string,
    req.params.checklistId as string,
    req.body,
  );
  res.status(201).json(item);
});

export const updateChecklistItem = asyncHandler<BoardRequest>(async (req, res) => {
  const r = await svc.updateChecklistItem(
    req.params.cardId as string,
    req.params.itemId as string,
    req.body,
  );
  res.json(r);
});

export const deleteChecklistItem = asyncHandler<BoardRequest>(async (req, res) => {
  await svc.deleteChecklistItem(req.params.cardId as string, req.params.itemId as string);
  res.status(204).end();
});

// Comments
export const addComment = asyncHandler<BoardRequest>(async (req, res) => {
  const { body, mentions } = req.body as { body: string; mentions: string[] };
  const c = await svc.addComment(req.params.id as string, req.user.sub, body, mentions);
  res.status(201).json(c);
});

export const listComments = asyncHandler<BoardRequest>(async (req, res) => {
  const cursor = req.query.cursor as string | undefined;
  const r = await svc.listComments(req.params.id as string, cursor);
  res.json(r);
});

export const updateComment = asyncHandler<BoardRequest>(async (req, res) => {
  const { body } = req.body as { body: string };
  const c = await svc.updateComment(req.params.commentId as string, req.user.sub, body);
  res.json(c);
});

export const deleteComment = asyncHandler<BoardRequest>(async (req, res) => {
  await svc.deleteComment(req.params.commentId as string, req.user.sub);
  res.status(204).end();
});

export const reactToComment = asyncHandler<BoardRequest>(async (req, res) => {
  const { emoji } = req.body as { emoji: string };
  const c = await svc.reactToComment(req.params.commentId as string, req.user.sub, emoji);
  res.json(c);
});

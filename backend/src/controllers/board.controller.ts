import * as svc from '../services/board.service.js';
import * as labelSvc from '../services/label.service.js';
import * as listSvc from '../services/list.service.js';
import * as automationSvc from '../services/automation.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import type { BoardRequest } from '../middleware/authorize.middleware.js';
import { Activity } from '../models/activity.model.js';

export const get = asyncHandler<BoardRequest>(async (req, res) => {
  const full = await svc.getFull(String(req.board._id));
  res.json(full);
});

export const update = asyncHandler<BoardRequest>(async (req, res) => {
  const b = await svc.update(String(req.board._id), req.body, req.user.sub);
  res.json(b);
});

export const remove = asyncHandler<BoardRequest>(async (req, res) => {
  await svc.remove(String(req.board._id), req.user.sub);
  res.status(204).end();
});

export const star = asyncHandler<BoardRequest>(async (req, res) => {
  const result = await svc.star(String(req.board._id), req.user.sub);
  res.json(result);
});

export const close = asyncHandler<BoardRequest>(async (req, res) => {
  const b = await svc.close(String(req.board._id), req.user.sub);
  res.json(b);
});

export const copy = asyncHandler<BoardRequest>(async (req, res) => {
  const body = req.body as { title: string; workspaceId?: string; keepCards: boolean };
  const b = await svc.copy(String(req.board._id), {
    title: body.title,
    workspaceId: body.workspaceId,
    keepCards: body.keepCards,
    creatorId: req.user.sub,
  });
  res.status(201).json(b);
});

export const addMember = asyncHandler<BoardRequest>(async (req, res) => {
  const { userId, role } = req.body as { userId: string; role: 'admin' | 'member' | 'observer' };
  const b = await svc.addMember(String(req.board._id), userId, role, req.user.sub);
  res.status(201).json(b);
});

export const updateMember = asyncHandler<BoardRequest>(async (req, res) => {
  const b = await svc.updateMember(
    String(req.board._id),
    req.params.userId as string,
    (req.body as { role: 'admin' | 'member' | 'observer' }).role,
  );
  res.json(b);
});

export const removeMember = asyncHandler<BoardRequest>(async (req, res) => {
  const b = await svc.removeMember(
    String(req.board._id),
    req.params.userId as string,
    req.user.sub,
  );
  res.json(b);
});

// ---- Lists nested under board -----------------------------------------------

export const listLists = asyncHandler<BoardRequest>(async (req, res) => {
  const items = await listSvc.listForBoard(String(req.board._id));
  res.json({ items });
});

export const createList = asyncHandler<BoardRequest>(async (req, res) => {
  const { title, position } = req.body as { title: string; position?: number };
  const l = await listSvc.create(String(req.board._id), title, position, req.user.sub);
  res.status(201).json(l);
});

// ---- Labels nested under board -----------------------------------------------

export const listLabels = asyncHandler<BoardRequest>(async (req, res) => {
  const items = await labelSvc.listForBoard(String(req.board._id));
  res.json({ items });
});

export const createLabel = asyncHandler<BoardRequest>(async (req, res) => {
  const { name, color } = req.body as { name: string; color: string };
  const l = await labelSvc.create(String(req.board._id), name, color);
  res.status(201).json(l);
});

export const updateLabel = asyncHandler<BoardRequest>(async (req, res) => {
  const l = await labelSvc.update(req.params.labelId as string, req.body);
  res.json(l);
});

export const removeLabel = asyncHandler<BoardRequest>(async (req, res) => {
  await labelSvc.remove(req.params.labelId as string);
  res.status(204).end();
});

// ---- Activity ----------------------------------------------------------------

export const activity = asyncHandler<BoardRequest>(async (req, res) => {
  const cursor = req.query.cursor as string | undefined;
  const limit = Math.min(Number(req.query.limit) || 30, 100);
  const q: Record<string, unknown> = { boardId: req.board._id };
  if (cursor) q.createdAt = { $lt: new Date(cursor) };
  const items = await Activity.find(q).sort({ createdAt: -1 }).limit(limit + 1).lean();
  const hasMore = items.length > limit;
  if (hasMore) items.pop();
  const last = items[items.length - 1];
  res.json({
    items,
    nextCursor: hasMore && last ? (last.createdAt as Date).toISOString() : undefined,
  });
});

// ---- Automations -------------------------------------------------------------

export const listAutomations = asyncHandler<BoardRequest>(async (req, res) => {
  const items = await automationSvc.list(String(req.board._id));
  res.json({ items });
});

export const createAutomation = asyncHandler<BoardRequest>(async (req, res) => {
  const a = await automationSvc.create(String(req.board._id), req.user.sub, req.body);
  res.status(201).json(a);
});

export const updateAutomation = asyncHandler<BoardRequest>(async (req, res) => {
  const a = await automationSvc.update(req.params.automationId as string, req.body);
  res.json(a);
});

export const removeAutomation = asyncHandler<BoardRequest>(async (req, res) => {
  await automationSvc.remove(req.params.automationId as string);
  res.status(204).end();
});

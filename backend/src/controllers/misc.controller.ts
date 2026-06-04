import type { Request, Response } from 'express';
import * as searchSvc from '../services/search.service.js';
import * as notifSvc from '../services/notification.service.js';
import * as tmplSvc from '../services/template.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import type { AuthedRequest } from '../middleware/auth.middleware.js';
import type { NotificationScope } from '../services/notification.service.js';
import { Card } from '../models/card.model.js';

function parseScope(v: unknown): NotificationScope | undefined {
  return v === 'boards' || v === 'chat' ? v : undefined;
}

export const search = asyncHandler<AuthedRequest>(async (req, res) => {
  const q = (req.query.q as string) ?? '';
  if (!q.trim()) {
    res.json({ cards: [], boards: [], members: [] });
    return;
  }
  const r = await searchSvc.search(req.user.sub, q.trim());
  res.json(r);
});

// Notifications
export const notifications = asyncHandler<AuthedRequest>(async (req, res) => {
  const cursor = req.query.cursor as string | undefined;
  const scope = parseScope(req.query.scope);
  const r = await notifSvc.list(req.user.sub, { cursor, scope });
  res.json(r);
});

export const unreadCount = asyncHandler<AuthedRequest>(async (req, res) => {
  const scope = parseScope(req.query.scope);
  res.json({ count: await notifSvc.unreadCount(req.user.sub, scope) });
});

export const markRead = asyncHandler<AuthedRequest>(async (req, res) => {
  await notifSvc.markRead(req.params.id as string, req.user.sub);
  res.status(204).end();
});

export const markAllRead = asyncHandler<AuthedRequest>(async (req, res) => {
  const scope = parseScope(req.query.scope);
  await notifSvc.markAllRead(req.user.sub, scope);
  res.status(204).end();
});

// Templates
export const templates = asyncHandler(async (_req: Request, res: Response) => {
  res.json({ items: await tmplSvc.list() });
});

export const boardFromTemplate = asyncHandler<AuthedRequest>(async (req, res) => {
  const { workspaceId, title } = req.body as { workspaceId: string; title: string };
  const board = await tmplSvc.createBoardFromTemplate(
    req.params.templateId as string,
    workspaceId,
    title,
    req.user.sub,
  );
  res.status(201).json(board);
});

// Planner
export const planner = asyncHandler<AuthedRequest>(async (req, res) => {
  const from = req.query.from ? new Date(req.query.from as string) : new Date();
  const to = req.query.to
    ? new Date(req.query.to as string)
    : new Date(Date.now() + 7 * 86_400_000);
  // Cards on boards the user has access to via membership
  const cards = await Card.find({
    archived: false,
    $or: [
      { dueDate: { $gte: from, $lte: to } },
      { scheduledAt: { $gte: from, $lte: to } },
    ],
    members: req.user.sub,
  })
    .sort({ scheduledAt: 1, dueDate: 1 })
    .lean();
  res.json({ items: cards });
});

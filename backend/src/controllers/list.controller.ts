import * as svc from '../services/list.service.js';
import * as cardSvc from '../services/card.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import type { BoardRequest } from '../middleware/authorize.middleware.js';

export const update = asyncHandler<BoardRequest>(async (req, res) => {
  const l = await svc.update(req.params.id as string, req.body, req.user.sub);
  res.json(l);
});

export const remove = asyncHandler<BoardRequest>(async (req, res) => {
  await svc.remove(req.params.id as string, req.user.sub);
  res.status(204).end();
});

export const move = asyncHandler<BoardRequest>(async (req, res) => {
  const { prevId, nextId, clientEventId } = req.body as {
    prevId?: string | null;
    nextId?: string | null;
    clientEventId: string;
  };
  const l = await svc.move(req.params.id as string, prevId, nextId, clientEventId, req.user.sub);
  res.json(l);
});

export const archive = asyncHandler<BoardRequest>(async (req, res) => {
  const l = await svc.archive(req.params.id as string, req.user.sub);
  res.json(l);
});

export const copy = asyncHandler<BoardRequest>(async (req, res) => {
  const { title } = req.body as { title?: string };
  const l = await svc.copy(req.params.id as string, title, req.user.sub);
  res.status(201).json(l);
});

export const createCard = asyncHandler<BoardRequest>(async (req, res) => {
  const { title, description, position } = req.body as {
    title: string;
    description?: string;
    position?: number;
  };
  const card = await cardSvc.create(
    req.params.listId as string,
    title,
    description ?? '',
    position,
    req.user.sub,
  );
  res.status(201).json(card);
});

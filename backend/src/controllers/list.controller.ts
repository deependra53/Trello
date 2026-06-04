import * as svc from '../services/list.service.js';
import * as cardSvc from '../services/card.service.js';
import * as chatSvc from '../services/chat.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { Forbidden } from '../utils/errors.js';
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

/**
 * Create a card from a chat message. Board write-access is enforced by
 * `requireListAccess('admin','member')` on the route; here we additionally
 * verify the caller can read the source message's channel, then derive the
 * card's title (the channel name), description (the message body) and
 * attachments (the message's files) server-side.
 */
export const createCardFromMessage = asyncHandler<BoardRequest>(async (req, res) => {
  const {
    messageId,
    title: titleOverride,
    description: descriptionOverride,
  } = req.body as { messageId: string; title?: string; description?: string };
  const msg = await chatSvc.getMessageForCard(messageId, req.user.sub);

  // The message and the destination board must live in the same organization —
  // never let a message be forked into another workspace's board.
  if (String(req.board.workspaceId) !== msg.workspaceId) {
    throw Forbidden('Message and board belong to different organizations');
  }

  // The user can edit the title/description in the preview; fall back to the
  // channel name / message body when they don't.
  const derivedTitle =
    msg.channelKind === 'dm' ? 'Direct message' : `#${msg.channelName || 'channel'}`;
  const title = (titleOverride?.trim() ? titleOverride : derivedTitle).slice(0, 500);
  const description = (descriptionOverride ?? msg.body).slice(0, 20000);
  const firstImage = msg.attachments.find((a) => a.mimeType?.startsWith('image/'));

  const card = await cardSvc.create(
    req.params.listId as string,
    title,
    description,
    undefined,
    req.user.sub,
    {
      attachments: msg.attachments,
      cover: firstImage
        ? { type: 'image', value: firstImage.url, size: 'normal', brightness: 'light' }
        : undefined,
    },
  );
  res.status(201).json(card);
});
